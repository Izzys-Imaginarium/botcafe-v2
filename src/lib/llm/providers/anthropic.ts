/**
 * Anthropic Provider
 *
 * Implements the LLMProvider interface for Anthropic's API
 * Supports Claude 3 Opus, Sonnet, and Haiku models
 */

import type {
  LLMProvider,
  SendMessageParams,
  ProviderConfig,
  StreamChunk,
  AnthropicStreamResponse,
  ChatMessage,
} from '../types'
import { LLMError, parseSSELine } from '../types'
import { estimateTokens } from '../token-counter'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

const SUPPORTED_MODELS = [
  // Claude 4.5 Series (Latest)
  'claude-opus-4-5-20251101',
  'claude-sonnet-4-5-20250929',
  'claude-haiku-4-5-20251001',
  // Claude 4.x Series (Legacy)
  'claude-opus-4-1-20250805',
  'claude-sonnet-4-20250514',
  'claude-opus-4-20250514',
  // Claude 3.x Series (Legacy)
  'claude-3-7-sonnet-20250219',
  'claude-3-haiku-20240307',
]

// Convert OpenAI-style messages to Anthropic format
function convertMessages(messages: ChatMessage[]): {
  system: string | undefined
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
} {
  let system: string | undefined
  const anthropicMessages: Array<{ role: 'user' | 'assistant'; content: string }> = []

  for (const msg of messages) {
    if (msg.role === 'system') {
      // Anthropic uses a separate system parameter
      system = system ? `${system}\n\n${msg.content}` : msg.content
    } else {
      anthropicMessages.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })
    }
  }

  // Anthropic requires alternating user/assistant messages
  // If we have consecutive same-role messages, we need to combine them
  const normalizedMessages: Array<{ role: 'user' | 'assistant'; content: string }> = []

  for (const msg of anthropicMessages) {
    const last = normalizedMessages[normalizedMessages.length - 1]
    if (last && last.role === msg.role) {
      // Combine with previous message of same role
      last.content += '\n\n' + msg.content
    } else {
      normalizedMessages.push({ ...msg })
    }
  }

  return { system, messages: normalizedMessages }
}

export const anthropicProvider: LLMProvider = {
  name: 'anthropic',
  displayName: 'Anthropic',
  supportedModels: SUPPORTED_MODELS,
  defaultModel: 'claude-sonnet-4-5-20250929',

  async *sendMessage(
    params: SendMessageParams,
    config: ProviderConfig
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const url = config.baseUrl || ANTHROPIC_API_URL
    const { system, messages } = convertMessages(params.messages)

    const body: Record<string, unknown> = {
      model: params.model || this.defaultModel,
      messages,
      stream: true,
      max_tokens: params.maxTokens || 4096,
      ...(system && { system }),
      ...(params.temperature !== undefined && { temperature: params.temperature }),
      ...(params.topP !== undefined && { top_p: params.topP }),
      ...(params.stop && { stop_sequences: params.stop }),
    }

    let response: Response

    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
          ...config.headers,
        },
        body: JSON.stringify(body),
      })
    } catch (error) {
      throw new LLMError(
        'Network error connecting to Anthropic',
        'NETWORK_ERROR',
        'anthropic',
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
      } else if (response.status === 400 && errorMessage.includes('content')) {
        errorCode = 'CONTENT_FILTERED'
      } else if (response.status === 404) {
        errorCode = 'MODEL_NOT_FOUND'
      } else if (response.status >= 500) {
        retryable = true
      }

      throw new LLMError(
        errorMessage,
        errorCode,
        'anthropic',
        response.status,
        retryable,
        { errorData }
      )
    }

    if (!response.body) {
      throw new LLMError('No response body', 'STREAM_ERROR', 'anthropic')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let totalInputTokens = 0
    let totalOutputTokens = 0

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
          if (!trimmed || trimmed.startsWith('event:')) continue

          const data = parseSSELine(trimmed)
          if (!data) continue

          try {
            const parsed: AnthropicStreamResponse = JSON.parse(data)

            switch (parsed.type) {
              case 'message_start':
                if (parsed.message?.usage) {
                  totalInputTokens = parsed.message.usage.input_tokens
                }
                break

              case 'content_block_delta':
                if (parsed.delta?.text) {
                  yield {
                    content: parsed.delta.text,
                    done: false,
                  }
                }
                break

              case 'message_delta':
                if (parsed.usage) {
                  totalOutputTokens = parsed.usage.output_tokens
                }
                if (parsed.delta?.stop_reason) {
                  yield {
                    content: '',
                    done: true,
                    finishReason: parsed.delta.stop_reason === 'end_turn' ? 'stop' : 'length',
                    usage: {
                      inputTokens: totalInputTokens,
                      outputTokens: totalOutputTokens,
                      totalTokens: totalInputTokens + totalOutputTokens,
                    },
                  }
                  return
                }
                break

              case 'message_stop':
                yield {
                  content: '',
                  done: true,
                  finishReason: 'stop',
                  usage: {
                    inputTokens: totalInputTokens,
                    outputTokens: totalOutputTokens,
                    totalTokens: totalInputTokens + totalOutputTokens,
                  },
                }
                return
            }
          } catch {
            // Skip malformed JSON
            continue
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  },

  estimateTokens(text: string): number {
    return estimateTokens(text, 'claude-3')
  },

  validateApiKeyFormat(apiKey: string): boolean {
    // Anthropic keys start with 'sk-ant-'
    return apiKey.startsWith('sk-ant-') && apiKey.length >= 20
  },
}
