/**
 * OpenAI Provider
 *
 * Implements the LLMProvider interface for OpenAI's API
 * Supports GPT-4, GPT-4 Turbo, GPT-4o, and GPT-3.5 Turbo models
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

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

const SUPPORTED_MODELS = [
  // GPT-5.x Series (Latest)
  'gpt-5.2',
  'gpt-5.2-chat',
  'gpt-5.1',
  'gpt-5',
  'gpt-5-mini',
  'gpt-5-nano',
  // Codex models
  'gpt-5.2-codex',
  'gpt-5.1-codex',
  'gpt-5.1-codex-mini',
  // GPT-4.x Series
  'gpt-4.1',
  'gpt-4.1-mini',
  'gpt-4o',
  'gpt-4o-mini',
  // Reasoning models
  'o1-preview',
  'o1-mini',
]

export const openaiProvider: LLMProvider = {
  name: 'openai',
  displayName: 'OpenAI',
  supportedModels: SUPPORTED_MODELS,
  defaultModel: 'gpt-4.1-mini',

  async *sendMessage(
    params: SendMessageParams,
    config: ProviderConfig
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const url = config.baseUrl || OPENAI_API_URL

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
      ...(params.user && { user: params.user }),
    }

    let response: Response

    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
          ...config.headers,
        },
        body: JSON.stringify(body),
      })
    } catch (error) {
      throw new LLMError(
        'Network error connecting to OpenAI',
        'NETWORK_ERROR',
        'openai',
        undefined,
        true,
        { error }
      )
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')

      // Enhanced error logging
      console.error('[OpenAI] ========== ERROR RESPONSE ==========')
      console.error('[OpenAI] HTTP Status:', response.status)
      console.error('[OpenAI] Status Text:', response.statusText)
      console.error('[OpenAI] Raw Error Body:', errorText)
      console.error('[OpenAI] Request Model:', body.model)
      console.error('[OpenAI] Request URL:', url)

      let errorData: { error?: { message?: string; type?: string; code?: string } } = {}
      try {
        errorData = JSON.parse(errorText)
        console.error('[OpenAI] Parsed Error JSON:', JSON.stringify(errorData, null, 2))
      } catch {
        console.error('[OpenAI] Error body is not valid JSON')
      }

      const errorMessage = errorData.error?.message || errorText || `HTTP ${response.status}`
      console.error('[OpenAI] Extracted Error Message:', errorMessage)
      console.error('[OpenAI] Error Type:', errorData.error?.type)
      console.error('[OpenAI] Error Code:', errorData.error?.code)
      console.error('[OpenAI] ========== ERROR END ===============')

      let errorCode: LLMError['code'] = 'UNKNOWN_ERROR'
      let retryable = false

      if (response.status === 401) {
        errorCode = 'INVALID_API_KEY'
      } else if (response.status === 429) {
        errorCode = 'RATE_LIMITED'
        retryable = true
      } else if (response.status === 400 && errorMessage.includes('context')) {
        errorCode = 'CONTEXT_LENGTH_EXCEEDED'
      } else if (response.status === 400 && errorMessage.includes('content')) {
        errorCode = 'CONTENT_FILTERED'
      } else if (response.status === 404) {
        errorCode = 'MODEL_NOT_FOUND'
      } else if (response.status === 402) {
        errorCode = 'INSUFFICIENT_QUOTA'
      } else if (response.status >= 500) {
        retryable = true
      }

      throw new LLMError(
        errorMessage,
        errorCode,
        'openai',
        response.status,
        retryable,
        { errorData, requestedModel: body.model }
      )
    }

    if (!response.body) {
      throw new LLMError('No response body', 'STREAM_ERROR', 'openai')
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

        // Process complete lines
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue

          const data = parseSSELine(trimmed)
          if (data === null) {
            // [DONE] signal
            yield { content: '', done: true }
            return
          }

          if (data) {
            try {
              const parsed: OpenAIStreamResponse = JSON.parse(data)

              const choice = parsed.choices?.[0]
              const content = choice?.delta?.content || ''
              const reasoning = (choice?.delta as Record<string, unknown>)?.reasoning_content as string || ''
              const isDone = choice?.finish_reason !== null && choice?.finish_reason !== undefined

              // Yield chunk if we have content, reasoning, finish reason, or usage data
              if (content || reasoning || isDone || parsed.usage) {
                yield {
                  content,
                  reasoning: reasoning || undefined,
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
              // Skip malformed JSON
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
    return estimateTokens(text, 'gpt-4')
  },

  validateApiKeyFormat(apiKey: string): boolean {
    // OpenAI keys start with 'sk-' and are typically 51 chars
    return apiKey.startsWith('sk-') && apiKey.length >= 20
  },
}
