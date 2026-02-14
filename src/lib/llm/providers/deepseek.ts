/**
 * DeepSeek Provider
 *
 * Implements the LLMProvider interface for DeepSeek's API
 * Uses OpenAI-compatible API format
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

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions'

const SUPPORTED_MODELS = [
  'deepseek-chat',
  'deepseek-coder',
  'deepseek-reasoner',
]

export const deepseekProvider: LLMProvider = {
  name: 'deepseek',
  displayName: 'DeepSeek',
  supportedModels: SUPPORTED_MODELS,
  defaultModel: 'deepseek-chat',

  async *sendMessage(
    params: SendMessageParams,
    config: ProviderConfig
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const url = config.baseUrl || DEEPSEEK_API_URL

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
          ...config.headers,
        },
        body: JSON.stringify(body),
      })
    } catch (error) {
      throw new LLMError(
        'Network error connecting to DeepSeek',
        'NETWORK_ERROR',
        'deepseek',
        undefined,
        true,
        { error }
      )
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')

      // Enhanced error logging
      console.error('[DeepSeek] ========== ERROR RESPONSE ==========')
      console.error('[DeepSeek] HTTP Status:', response.status)
      console.error('[DeepSeek] Status Text:', response.statusText)
      console.error('[DeepSeek] Raw Error Body:', errorText)
      console.error('[DeepSeek] Request Model:', body.model)
      console.error('[DeepSeek] Request URL:', url)

      let errorData: { error?: { message?: string; type?: string; code?: string } } = {}
      try {
        errorData = JSON.parse(errorText)
        console.error('[DeepSeek] Parsed Error JSON:', JSON.stringify(errorData, null, 2))
      } catch {
        console.error('[DeepSeek] Error body is not valid JSON')
      }

      const errorMessage = errorData.error?.message || errorText || `HTTP ${response.status}`
      console.error('[DeepSeek] Extracted Error Message:', errorMessage)
      console.error('[DeepSeek] Error Type:', errorData.error?.type)
      console.error('[DeepSeek] Error Code:', errorData.error?.code)
      console.error('[DeepSeek] ========== ERROR END ===============')

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
        'deepseek',
        response.status,
        retryable,
        { errorData, requestedModel: body.model }
      )
    }

    if (!response.body) {
      throw new LLMError('No response body', 'STREAM_ERROR', 'deepseek')
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
                const reasoning = (choice.delta as Record<string, unknown>)?.reasoning_content as string || ''
                const isDone = choice.finish_reason !== null

                yield {
                  content,
                  reasoning: reasoning || undefined,
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
    return estimateTokens(text, 'deepseek')
  },

  validateApiKeyFormat(apiKey: string): boolean {
    return apiKey.length >= 20 && !apiKey.includes(' ')
  },
}
