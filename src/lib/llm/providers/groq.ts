/**
 * Groq Provider
 *
 * Implements the LLMProvider interface for Groq's API
 * Uses OpenAI-compatible API format with ultra-fast inference
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

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

const SUPPORTED_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-70b-versatile',
  'llama-3.1-8b-instant',
  'llama3-70b-8192',
  'llama3-8b-8192',
  'mixtral-8x7b-32768',
  'gemma2-9b-it',
]

export const groqProvider: LLMProvider = {
  name: 'groq',
  displayName: 'Groq',
  supportedModels: SUPPORTED_MODELS,
  defaultModel: 'llama-3.3-70b-versatile',

  async *sendMessage(
    params: SendMessageParams,
    config: ProviderConfig
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const url = config.baseUrl || GROQ_API_URL

    const body = {
      model: params.model || this.defaultModel,
      messages: params.messages.map((m) => ({
        role: m.role,
        content: m.content,
        ...(m.name && { name: m.name }),
      })),
      stream: true,
      ...(params.temperature !== undefined && { temperature: params.temperature }),
      ...(params.maxTokens && { max_tokens: params.maxTokens }),
      ...(params.topP !== undefined && { top_p: params.topP }),
      ...(params.stop && { stop: params.stop }),
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
        'Network error connecting to Groq',
        'NETWORK_ERROR',
        'groq',
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
      } else if (response.status >= 500) {
        retryable = true
      }

      throw new LLMError(
        errorMessage,
        errorCode,
        'groq',
        response.status,
        retryable,
        { errorData }
      )
    }

    if (!response.body) {
      throw new LLMError('No response body', 'STREAM_ERROR', 'groq')
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
              if (choice) {
                const content = choice.delta?.content || ''
                const isDone = choice.finish_reason !== null

                yield {
                  content,
                  done: isDone,
                  finishReason: choice.finish_reason as StreamChunk['finishReason'],
                  ...(parsed.usage && {
                    usage: {
                      inputTokens: parsed.usage.prompt_tokens,
                      outputTokens: parsed.usage.completion_tokens,
                      totalTokens: parsed.usage.total_tokens,
                    },
                  }),
                }

                if (isDone) {
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
    return estimateTokens(text, 'llama-3')
  },

  validateApiKeyFormat(apiKey: string): boolean {
    // Groq keys start with 'gsk_'
    return apiKey.startsWith('gsk_') && apiKey.length >= 20
  },
}
