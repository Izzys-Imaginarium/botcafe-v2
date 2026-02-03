/**
 * GLM Provider (Zhipu AI / Z.AI)
 *
 * Implements the LLMProvider interface for GLM's API
 * Uses OpenAI-compatible API format
 * Documentation: https://docs.z.ai/guides/develop/http/introduction
 */

import type {
  LLMProvider,
  SendMessageParams,
  ProviderConfig,
  StreamChunk,
} from '../types'
import { LLMError } from '../types'
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

export const glmProvider: LLMProvider = {
  name: 'glm',
  displayName: 'GLM (Zhipu AI)',
  supportedModels: SUPPORTED_MODELS,
  defaultModel: 'glm-4.7-flash',

  async *sendMessage(
    params: SendMessageParams,
    config: ProviderConfig
  ): AsyncGenerator<StreamChunk, void, unknown> {
    // GLM uses standard OpenAI-compatible format but may not support all fields
    // Remove 'name' field as GLM doesn't support it
    // NOTE: Using non-streaming due to Cloudflare Workers H2 compatibility issues
    const body = {
      model: params.model || this.defaultModel,
      messages: params.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      stream: false, // Disabled streaming due to CF Workers H2 issues
      ...(params.temperature !== undefined && { temperature: params.temperature }),
      ...(params.maxTokens && { max_tokens: params.maxTokens }),
      ...(params.topP !== undefined && { top_p: params.topP }),
      ...(params.stop && { stop: params.stop }),
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
      console.log('[GLM] Model:', body.model)
      console.log('[GLM] Message count:', body.messages.length)
      console.log('[GLM] Stream mode:', body.stream)
      console.log('[GLM] API Key (first 8 chars):', config.apiKey?.substring(0, 8) + '...')
      console.log('[GLM] Request body preview:', JSON.stringify({
        model: body.model,
        stream: body.stream,
        temperature: body.temperature,
        max_tokens: body.max_tokens,
        message_roles: body.messages.map(m => m.role),
      }))
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
            { errorData, apiErrorCode, requestedModel: body.model, triedUrl: url }
          )
          continue // Try next endpoint
        }

        // Enhanced error logging for debugging
        console.error('[GLM] ========== ERROR RESPONSE ==========')
        console.error('[GLM] HTTP Status:', response.status)
        console.error('[GLM] Status Text:', response.statusText)
        console.error('[GLM] Response Headers:', JSON.stringify(Object.fromEntries(response.headers.entries())))
        console.error('[GLM] Raw Error Body:', errorText)
        console.error('[GLM] Request Model:', body.model)
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
          // Likely an account balance/quota issue - provide clearer error
          errorCode = 'RATE_LIMITED' // Using rate limited as closest match
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
          { errorData, apiErrorCode, requestedModel: body.model }
        )
      }

      // Success! Log which endpoint worked
      console.log('[GLM] ========== SUCCESS ==========')
      console.log('[GLM] Working endpoint:', url)
      console.log('[GLM] Endpoint type:', url.includes('/coding/') ? 'CODING' : 'STANDARD')
      console.log('[GLM] ==============================')

      // Non-streaming response handling
      // (Streaming disabled due to Cloudflare Workers H2 compatibility issues with GLM)
      const responseData = await response.json() as {
        choices?: Array<{
          message?: { content?: string; role?: string }
          finish_reason?: string
        }>
        usage?: {
          prompt_tokens: number
          completion_tokens: number
          total_tokens: number
        }
      }

      console.log('[GLM] Response received, choices:', responseData.choices?.length)

      const choice = responseData.choices?.[0]
      if (choice?.message?.content) {
        yield {
          content: choice.message.content,
          done: true,
          finishReason: (choice.finish_reason as StreamChunk['finishReason']) || 'stop',
          ...(responseData.usage && {
            usage: {
              inputTokens: responseData.usage.prompt_tokens,
              outputTokens: responseData.usage.completion_tokens,
              totalTokens: responseData.usage.total_tokens,
            },
          }),
        }
        return // Successfully yielded response, we're done
      } else {
        console.error('[GLM] No content in response:', JSON.stringify(responseData).substring(0, 500))
        throw new LLMError('No content in GLM response', 'PARSE_ERROR', 'glm')
      }
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
