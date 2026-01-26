/**
 * OpenRouter Provider
 *
 * Implements the LLMProvider interface for OpenRouter's API
 * OpenRouter provides access to many models through a unified API
 */

import type {
  LLMProvider,
  SendMessageParams,
  ProviderConfig,
  StreamChunk,
  OpenAIStreamResponse,
} from '../types'
import { LLMError, parseSSELine } from '../types'
import { estimateTokens } from '../token-counter'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

// Popular models on OpenRouter (subset - they support hundreds)
const SUPPORTED_MODELS = [
  // Anthropic
  'anthropic/claude-opus-4.5',
  'anthropic/claude-sonnet-4.5',
  'anthropic/claude-haiku-4.5',
  // OpenAI
  'openai/gpt-5.2',
  'openai/gpt-4.1',
  'openai/gpt-4o',
  // Google
  'google/gemini-3-pro-preview',
  'google/gemini-2.5-flash',
  // Meta
  'meta-llama/llama-4-maverick',
  'meta-llama/llama-3.3-70b-instruct',
  // DeepSeek
  'deepseek/deepseek-chat',
  'deepseek/deepseek-r1',
]

export const openrouterProvider: LLMProvider = {
  name: 'openrouter',
  displayName: 'OpenRouter',
  supportedModels: SUPPORTED_MODELS,
  defaultModel: 'anthropic/claude-sonnet-4.5',

  async *sendMessage(
    params: SendMessageParams,
    config: ProviderConfig
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const url = config.baseUrl || OPENROUTER_API_URL

    const body = {
      model: params.model || this.defaultModel,
      messages: params.messages.map((m) => ({
        role: m.role,
        content: m.content,
        ...(m.name && { name: m.name }),
      })),
      stream: true,
      stream_options: { include_usage: true },
      ...(params.temperature !== undefined && { temperature: params.temperature }),
      ...(params.maxTokens && { max_tokens: params.maxTokens }),
      ...(params.topP !== undefined && { top_p: params.topP }),
      ...(params.frequencyPenalty !== undefined && { frequency_penalty: params.frequencyPenalty }),
      ...(params.presencePenalty !== undefined && { presence_penalty: params.presencePenalty }),
      ...(params.stop && { stop: params.stop }),
    }

    let response: Response

    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
          'HTTP-Referer': 'https://botcafe.ai', // Required by OpenRouter
          'X-Title': 'BotCafe',
          ...config.headers,
        },
        body: JSON.stringify(body),
      })
    } catch (error) {
      throw new LLMError(
        'Network error connecting to OpenRouter',
        'NETWORK_ERROR',
        'openrouter',
        undefined,
        true,
        { error }
      )
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { error?: { message?: string } }
      const errorMessage = errorData.error?.message || `HTTP ${response.status}`

      let errorCode: LLMError['code'] = 'UNKNOWN_ERROR'
      let retryable = false

      if (response.status === 401) {
        errorCode = 'INVALID_API_KEY'
      } else if (response.status === 429) {
        errorCode = 'RATE_LIMITED'
        retryable = true
      } else if (response.status === 400 && errorMessage.includes('context')) {
        errorCode = 'CONTEXT_LENGTH_EXCEEDED'
      } else if (response.status === 402) {
        errorCode = 'INSUFFICIENT_QUOTA'
      } else if (response.status === 404) {
        errorCode = 'MODEL_NOT_FOUND'
      } else if (response.status >= 500) {
        retryable = true
      }

      throw new LLMError(
        errorMessage,
        errorCode,
        'openrouter',
        response.status,
        retryable,
        { errorData }
      )
    }

    if (!response.body) {
      throw new LLMError('No response body', 'STREAM_ERROR', 'openrouter')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue

          const data = parseSSELine(trimmed)
          if (data === null) {
            yield { content: '', done: true }
            return
          }

          if (data) {
            try {
              const parsed: OpenAIStreamResponse = JSON.parse(data)

              const choice = parsed.choices?.[0]
              const content = choice?.delta?.content || ''
              const isDone = choice?.finish_reason !== null && choice?.finish_reason !== undefined

              // Yield chunk if we have content, finish reason, or usage data
              if (content || isDone || parsed.usage) {
                yield {
                  content,
                  done: isDone || !!parsed.usage,
                  finishReason: choice?.finish_reason as StreamChunk['finishReason'],
                  ...(parsed.usage && {
                    usage: {
                      inputTokens: parsed.usage.prompt_tokens,
                      outputTokens: parsed.usage.completion_tokens,
                      totalTokens: parsed.usage.total_tokens,
                    },
                  }),
                }

                // Only return after we've received usage data
                if (parsed.usage) {
                  return
                }
              }
            } catch {
              continue
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  },

  estimateTokens(text: string): number {
    // OpenRouter uses various models, use GPT-4 as a reasonable default
    return estimateTokens(text, 'gpt-4')
  },

  validateApiKeyFormat(apiKey: string): boolean {
    // OpenRouter keys start with 'sk-or-'
    return apiKey.startsWith('sk-or-') && apiKey.length >= 20
  },
}
