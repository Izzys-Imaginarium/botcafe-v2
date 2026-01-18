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
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-pro',
  'gemini-2.0-flash-exp',
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
  defaultModel: 'gemini-1.5-flash',

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
      const errorData = await response.json().catch(() => ({})) as { error?: { message?: string } }
      const errorMessage = errorData.error?.message || `HTTP ${response.status}`

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
        { errorData }
      )
    }

    if (!response.body) {
      throw new LLMError('No response body', 'STREAM_ERROR', 'google')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let lastUsage: StreamChunk['usage'] = undefined

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        buffer += decoder.decode(value, { stream: true })

        // Process complete lines - Gemini SSE format
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data: ')) continue

          const data = trimmed.slice(6)
          if (!data || data === '[DONE]') continue

          try {
            const parsed: GoogleStreamResponse = JSON.parse(data)

            if (parsed.candidates?.[0]) {
              const candidate = parsed.candidates[0]
              const text = candidate.content?.parts?.[0]?.text || ''
              const isDone = !!candidate.finishReason

              if (parsed.usageMetadata) {
                lastUsage = {
                  inputTokens: parsed.usageMetadata.promptTokenCount || 0,
                  outputTokens: parsed.usageMetadata.candidatesTokenCount || 0,
                  totalTokens: parsed.usageMetadata.totalTokenCount || 0,
                }
              }

              yield {
                content: text,
                done: isDone,
                finishReason: candidate.finishReason === 'STOP'
                  ? 'stop'
                  : candidate.finishReason === 'MAX_TOKENS'
                    ? 'length'
                    : candidate.finishReason === 'SAFETY'
                      ? 'content_filter'
                      : null,
                usage: isDone ? lastUsage : undefined,
              }

              if (isDone) {
                return
              }
            }
          } catch {
            // Skip malformed JSON
            continue
          }
        }
      }

      // Final yield if we didn't get a proper end signal
      yield {
        content: '',
        done: true,
        finishReason: 'stop',
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
