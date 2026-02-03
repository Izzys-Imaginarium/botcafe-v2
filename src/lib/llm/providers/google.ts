/**
 * Google/Gemini Provider
 *
 * Implements the LLMProvider interface for Google's Gemini API
 * Supports Gemini 1.5 Pro, Flash, and other models
 */

import type {
  LLMProvider,
  SendMessageParams,
  ProviderConfig,
  StreamChunk,
  GoogleStreamResponse,
  ChatMessage,
} from '../types'
import { LLMError } from '../types'
import { estimateTokens } from '../token-counter'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

const SUPPORTED_MODELS = [
  // Gemini 3 (Preview)
  'gemini-3-pro-preview',
  'gemini-3-flash-preview',
  'gemini-3-pro-image-preview',
  // Gemini 2.5 (Stable)
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  // Gemini 2.0 (Being retired March 2026)
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
]

// Convert OpenAI-style messages to Gemini format
function convertMessages(messages: ChatMessage[]): {
  systemInstruction: { parts: Array<{ text: string }> } | undefined
  contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>
} {
  let systemText = ''
  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = []

  for (const msg of messages) {
    if (msg.role === 'system') {
      systemText = systemText ? `${systemText}\n\n${msg.content}` : msg.content
    } else {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })
    }
  }

  return {
    systemInstruction: systemText ? { parts: [{ text: systemText }] } : undefined,
    contents,
  }
}

export const googleProvider: LLMProvider = {
  name: 'google',
  displayName: 'Google Gemini',
  supportedModels: SUPPORTED_MODELS,
  defaultModel: 'gemini-2.5-flash',

  async *sendMessage(
    params: SendMessageParams,
    config: ProviderConfig
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const model = params.model || this.defaultModel
    const baseUrl = config.baseUrl || GEMINI_API_URL
    const url = `${baseUrl}/${model}:streamGenerateContent?key=${config.apiKey}&alt=sse`

    const { systemInstruction, contents } = convertMessages(params.messages)

    const body: Record<string, unknown> = {
      contents,
      ...(systemInstruction && { systemInstruction }),
      generationConfig: {
        ...(params.temperature !== undefined && { temperature: params.temperature }),
        ...(params.maxTokens && { maxOutputTokens: params.maxTokens }),
        ...(params.topP !== undefined && { topP: params.topP }),
        ...(params.stop && { stopSequences: params.stop }),
      },
    }

    let response: Response

    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
        body: JSON.stringify(body),
      })
    } catch (error) {
      throw new LLMError(
        'Network error connecting to Google',
        'NETWORK_ERROR',
        'google',
        undefined,
        true,
        { error }
      )
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')

      // Enhanced error logging (mask API key in URL)
      const maskedUrl = url.replace(/key=[^&]+/, 'key=***')
      console.error('[Google] ========== ERROR RESPONSE ==========')
      console.error('[Google] HTTP Status:', response.status)
      console.error('[Google] Status Text:', response.statusText)
      console.error('[Google] Raw Error Body:', errorText)
      console.error('[Google] Request Model:', model)
      console.error('[Google] Request URL:', maskedUrl)

      let errorData: { error?: { message?: string; code?: number; status?: string; details?: unknown[] } } = {}
      try {
        errorData = JSON.parse(errorText)
        console.error('[Google] Parsed Error JSON:', JSON.stringify(errorData, null, 2))
      } catch {
        console.error('[Google] Error body is not valid JSON')
      }

      const errorMessage = errorData.error?.message || errorText || `HTTP ${response.status}`
      console.error('[Google] Extracted Error Message:', errorMessage)
      console.error('[Google] Error Code:', errorData.error?.code)
      console.error('[Google] Error Status:', errorData.error?.status)
      console.error('[Google] ========== ERROR END ===============')

      let errorCode: LLMError['code'] = 'UNKNOWN_ERROR'
      let retryable = false

      if (response.status === 401 || response.status === 403) {
        errorCode = 'INVALID_API_KEY'
      } else if (response.status === 429) {
        errorCode = 'RATE_LIMITED'
        retryable = true
      } else if (response.status === 400 && errorMessage.includes('context')) {
        errorCode = 'CONTEXT_LENGTH_EXCEEDED'
      } else if (response.status === 400 && errorMessage.includes('safety')) {
        errorCode = 'CONTENT_FILTERED'
      } else if (response.status === 404) {
        errorCode = 'MODEL_NOT_FOUND'
      } else if (response.status >= 500) {
        retryable = true
      }

      throw new LLMError(
        errorMessage,
        errorCode,
        'google',
        response.status,
        retryable,
        { errorData, requestedModel: model }
      )
    }

    if (!response.body) {
      throw new LLMError('No response body', 'STREAM_ERROR', 'google')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let lastUsage: StreamChunk['usage'] = undefined
    let allContent = '' // Track all content for debugging
    let finishReasonReceived: string | null = null

    // Helper to process a single SSE data payload
    const processData = function* (data: string): Generator<StreamChunk> {
      if (!data || data === '[DONE]') {
        return
      }

      try {
        const parsed: GoogleStreamResponse = JSON.parse(data)

        if (parsed.candidates?.[0]) {
          const candidate = parsed.candidates[0]

          // Gemini can have multiple parts, concatenate them all
          let text = ''
          if (candidate.content?.parts) {
            for (const part of candidate.content.parts) {
              if (part.text) {
                text += part.text
              }
            }
          }

          const finishReason = candidate.finishReason

          if (parsed.usageMetadata) {
            lastUsage = {
              inputTokens: parsed.usageMetadata.promptTokenCount || 0,
              outputTokens: parsed.usageMetadata.candidatesTokenCount || 0,
              totalTokens: parsed.usageMetadata.totalTokenCount || 0,
            }
          }

          // Track content
          allContent += text

          // Always yield if there's content, regardless of finish reason
          if (text) {
            yield {
              content: text,
              done: false,
              finishReason: null,
              usage: undefined,
            }
          }

          // Track finish reason but don't yield done=true yet
          // We'll yield the final done event after processing all data
          if (finishReason) {
            finishReasonReceived = finishReason
          }
        }
      } catch {
        // Skip malformed JSON - could be partial data
      }
    }

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          // Flush remaining buffer content with final decode
          buffer += decoder.decode(new Uint8Array(), { stream: false })
          break
        }

        buffer += decoder.decode(value, { stream: true })

        // Process complete SSE events
        // Gemini SSE format: "data: {json}\n\n" or "data: {json}\r\n\r\n"
        // Split on double newlines to separate events
        const events = buffer.split(/\r?\n\r?\n/)

        // Keep the last part (might be incomplete)
        buffer = events.pop() || ''

        for (const event of events) {
          // Each event can have multiple lines, find the data line(s)
          const lines = event.split(/\r?\n/)
          for (const line of lines) {
            const trimmed = line.trim()
            if (trimmed.startsWith('data: ')) {
              const data = trimmed.slice(6)
              yield* processData(data)
            }
          }
        }
      }

      // Process any remaining data in the buffer
      if (buffer.trim()) {
        const lines = buffer.split(/\r?\n/)
        for (const line of lines) {
          const trimmed = line.trim()
          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6)
            yield* processData(data)
          }
        }
      }

      // Now yield the final done event
      yield {
        content: '',
        done: true,
        finishReason: finishReasonReceived === 'STOP'
          ? 'stop'
          : finishReasonReceived === 'MAX_TOKENS'
            ? 'length'
            : finishReasonReceived === 'SAFETY'
              ? 'content_filter'
              : 'stop', // Default to stop if no finish reason
        usage: lastUsage,
      }
    } finally {
      reader.releaseLock()
    }
  },

  estimateTokens(text: string): number {
    return estimateTokens(text, 'gemini')
  },

  validateApiKeyFormat(apiKey: string): boolean {
    // Google API keys are typically 39 characters
    return apiKey.length >= 30 && !apiKey.includes(' ')
  },
}
