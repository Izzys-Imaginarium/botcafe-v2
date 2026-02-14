/**
 * GLM Provider (Zhipu AI / Z.AI)
 *
 * Implements the LLMProvider interface for GLM's API
 * Uses OpenAI-compatible API format with reasoning/thinking support
 * Documentation: https://docs.z.ai/guides/develop/http/introduction
 */

import type {
  LLMProvider,
  SendMessageParams,
  ProviderConfig,
  StreamChunk,
} from '../types'
import { LLMError, parseSSELine } from '../types'
import { estimateTokens } from '../token-counter'

// GLM has two different API endpoints:
// - Standard endpoint: Works with pay-as-you-go credits
// - Coding endpoint: Works with GLM Coding Plan subscriptions ($3/month)
// We try standard first, then fallback to coding endpoint on error 1113
const GLM_STANDARD_URL = 'https://api.z.ai/api/paas/v4/chat/completions'
const GLM_CODING_URL = 'https://api.z.ai/api/coding/paas/v4/chat/completions'

const SUPPORTED_MODELS = [
  // GLM-4.7 Series
  'glm-4.7',
  'glm-4.7-flashx',
  'glm-4.7-flash', // Free
  // GLM-4.6 Series
  'glm-4.6',
  'glm-4.6v', // Vision
  'glm-4.6v-flashx',
  'glm-4.6v-flash', // Free
  // GLM-4.5 Series
  'glm-4.5',
  'glm-4.5v', // Vision
  'glm-4.5-x',
  'glm-4.5-air',
  'glm-4.5-airx',
  'glm-4.5-flash', // Free
  // Special
  'glm-4-32b-0414-128k',
]

// Models that support thinking mode
// GLM-4.7 and GLM-5 think compulsorily, GLM-4.5/4.6 auto-determine
const THINKING_MODELS = [
  'glm-4.7', 'glm-4.7-flashx', 'glm-4.7-flash',
  'glm-4.6', 'glm-4.6v', 'glm-4.6v-flashx', 'glm-4.6v-flash',
  'glm-4.5', 'glm-4.5v', 'glm-4.5-x', 'glm-4.5-air', 'glm-4.5-airx', 'glm-4.5-flash',
]

function supportsThinking(model: string): boolean {
  return THINKING_MODELS.some(m => model.startsWith(m))
}

export const glmProvider: LLMProvider = {
  name: 'glm',
  displayName: 'GLM (Zhipu AI)',
  supportedModels: SUPPORTED_MODELS,
  defaultModel: 'glm-4.7-flash',

  async *sendMessage(
    params: SendMessageParams,
    config: ProviderConfig
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const modelName = params.model || this.defaultModel

    // GLM uses standard OpenAI-compatible format but may not support all fields
    // Remove 'name' field as GLM doesn't support it
    const body: Record<string, unknown> = {
      model: modelName,
      messages: params.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      stream: true,
      stream_options: { include_usage: true },
      ...(params.temperature !== undefined && { temperature: params.temperature }),
      ...(params.maxTokens && { max_tokens: params.maxTokens }),
      ...(params.topP !== undefined && { top_p: params.topP }),
      ...(params.stop && { stop: params.stop }),
      // Enable thinking for models that support it
      ...(supportsThinking(modelName) && { thinking: { type: 'enabled' } }),
    }

    // Try endpoints in order: custom baseUrl > standard > coding (fallback)
    // The coding endpoint is for GLM Coding Plan subscriptions
    // Error 1113 means the key doesn't work with the current endpoint
    const endpointsToTry = config.baseUrl
      ? [config.baseUrl]
      : [GLM_STANDARD_URL, GLM_CODING_URL]

    let lastError: LLMError | null = null

    for (const url of endpointsToTry) {
      const isLastEndpoint = url === endpointsToTry[endpointsToTry.length - 1]

      console.log('[GLM] ========== REQUEST START ==========')
      console.log('[GLM] Endpoint URL:', url)
      console.log('[GLM] Endpoint type:', url.includes('/coding/') ? 'CODING' : 'STANDARD')
      console.log('[GLM] Model:', modelName)
      console.log('[GLM] Message count:', (body.messages as unknown[]).length)
      console.log('[GLM] Stream mode:', body.stream)
      console.log('[GLM] Thinking enabled:', !!body.thinking)
      console.log('[GLM] API Key (first 8 chars):', config.apiKey?.substring(0, 8) + '...')
      console.log('[GLM] ========== REQUEST END ============')

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
          'Network error connecting to GLM',
          'NETWORK_ERROR',
          'glm',
          undefined,
          true,
          { error }
        )
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')

        let errorData: { error?: { message?: string; code?: string | number }; code?: string | number; message?: string; msg?: string } = {}
        try {
          errorData = JSON.parse(errorText)
        } catch {
          // Error body is not valid JSON
        }

        const errorMessage = errorData.error?.message || errorData.message || errorData.msg || errorText || `HTTP ${response.status}`
        const apiErrorCode = String(errorData.error?.code || errorData.code || '')

        // Check if this is error 1113 (wrong endpoint for this API key type)
        // If so, try the next endpoint before giving up
        if (apiErrorCode === '1113' && !isLastEndpoint) {
          console.log('[GLM] ========== ENDPOINT FALLBACK ==========')
          console.log('[GLM] Error 1113 detected - API key may be for different endpoint type')
          console.log('[GLM] Trying next endpoint...')
          console.log('[GLM] ========================================')

          lastError = new LLMError(
            errorMessage,
            'RATE_LIMITED',
            'glm',
            response.status,
            true,
            { errorData, apiErrorCode, requestedModel: modelName, triedUrl: url }
          )
          continue // Try next endpoint
        }

        // Enhanced error logging for debugging
        console.error('[GLM] ========== ERROR RESPONSE ==========')
        console.error('[GLM] HTTP Status:', response.status)
        console.error('[GLM] Status Text:', response.statusText)
        console.error('[GLM] Response Headers:', JSON.stringify(Object.fromEntries(response.headers.entries())))
        console.error('[GLM] Raw Error Body:', errorText)
        console.error('[GLM] Request Model:', modelName)
        console.error('[GLM] Request URL:', url)
        console.error('[GLM] Parsed Error JSON:', JSON.stringify(errorData, null, 2))
        console.error('[GLM] Extracted Error Message:', errorMessage)
        console.error('[GLM] API Error Code:', apiErrorCode)
        console.error('[GLM] ========== ERROR END ===============')

        let errorCode: LLMError['code'] = 'UNKNOWN_ERROR'
        let retryable = false

        if (response.status === 401) {
          errorCode = 'INVALID_API_KEY'
        } else if (response.status === 429 || apiErrorCode === '1113') {
          errorCode = 'RATE_LIMITED'
          retryable = true
        } else if (response.status === 400 && errorMessage.includes('context')) {
          errorCode = 'CONTEXT_LENGTH_EXCEEDED'
        } else if (response.status === 400 && (errorMessage.includes('token') || errorMessage.includes('balance') || errorMessage.includes('quota') || errorMessage.includes('insufficient'))) {
          errorCode = 'RATE_LIMITED'
          console.error('[GLM] Detected possible account balance/quota issue')
        } else if (response.status >= 500) {
          retryable = true
        }

        throw new LLMError(
          errorMessage,
          errorCode,
          'glm',
          response.status,
          retryable,
          { errorData, apiErrorCode, requestedModel: modelName }
        )
      }

      // Success! Log which endpoint worked
      console.log('[GLM] ========== SUCCESS ==========')
      console.log('[GLM] Working endpoint:', url)
      console.log('[GLM] Endpoint type:', url.includes('/coding/') ? 'CODING' : 'STANDARD')
      console.log('[GLM] ==============================')

      // Streaming response handling
      if (!response.body) {
        throw new LLMError('No response body', 'STREAM_ERROR', 'glm')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

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
                const parsed = JSON.parse(data) as {
                  choices?: Array<{
                    delta?: { content?: string; reasoning_content?: string; role?: string }
                    finish_reason?: string | null
                  }>
                  usage?: {
                    prompt_tokens: number
                    completion_tokens: number
                    total_tokens: number
                  }
                }

                const choice = parsed.choices?.[0]
                const content = choice?.delta?.content || ''
                const reasoning = choice?.delta?.reasoning_content || ''
                const isDone = choice?.finish_reason !== null && choice?.finish_reason !== undefined

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

      return // Successfully processed streaming response
    }

    // If we get here, all endpoints failed
    if (lastError) {
      throw lastError
    }
  },

  estimateTokens(text: string): number {
    return estimateTokens(text, 'glm')
  },

  validateApiKeyFormat(apiKey: string): boolean {
    // GLM API keys are typically alphanumeric strings
    return apiKey.length >= 20 && !apiKey.includes(' ')
  },
}
