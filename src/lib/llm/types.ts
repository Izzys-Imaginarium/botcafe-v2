/**
 * LLM Provider Types
 *
 * Shared types for all LLM provider implementations
 */

// Supported provider names (matches ApiKey collection)
export type ProviderName =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'deepseek'
  | 'openrouter'
  | 'electronhub'
  | 'glm'

// Chat message role
export type MessageRole = 'system' | 'user' | 'assistant'

// Chat message format (standardized across providers)
export interface ChatMessage {
  role: MessageRole
  content: string
  name?: string // For multi-bot conversations
}

// Streaming chunk from provider
export interface StreamChunk {
  content: string
  done: boolean
  finishReason?: 'stop' | 'length' | 'content_filter' | 'tool_calls' | null
  usage?: TokenUsage
}

// Token usage statistics
export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  totalTokens: number
}

// Request parameters for sending a message
export interface SendMessageParams {
  messages: ChatMessage[]
  model: string
  temperature?: number
  maxTokens?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  stop?: string[]
  user?: string // For tracking/abuse prevention
}

// Provider configuration
export interface ProviderConfig {
  apiKey: string
  baseUrl?: string
  defaultModel?: string
  timeout?: number
  headers?: Record<string, string>
}

// LLM Provider interface
export interface LLMProvider {
  readonly name: ProviderName
  readonly displayName: string
  readonly supportedModels: string[]
  readonly defaultModel: string

  /**
   * Send a message and stream the response
   */
  sendMessage(
    params: SendMessageParams,
    config: ProviderConfig
  ): AsyncGenerator<StreamChunk, void, unknown>

  /**
   * Estimate token count for a given text
   * This is an approximation - actual counts come from the API
   */
  estimateTokens(text: string): number

  /**
   * Validate that the API key format is correct (not that it's valid)
   */
  validateApiKeyFormat(apiKey: string): boolean
}

// Provider model info
export interface ModelInfo {
  id: string
  name: string
  contextWindow: number
  maxOutputTokens: number
  inputPricePerToken: number
  outputPricePerToken: number
  supports: {
    streaming: boolean
    vision: boolean
    tools: boolean
    json: boolean
  }
}

// Error types
export class LLMError extends Error {
  constructor(
    message: string,
    public code: LLMErrorCode,
    public provider: ProviderName,
    public statusCode?: number,
    public retryable: boolean = false,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'LLMError'
  }
}

export type LLMErrorCode =
  | 'INVALID_API_KEY'
  | 'RATE_LIMITED'
  | 'CONTEXT_LENGTH_EXCEEDED'
  | 'CONTENT_FILTERED'
  | 'MODEL_NOT_FOUND'
  | 'INSUFFICIENT_QUOTA'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'PARSE_ERROR'
  | 'STREAM_ERROR'
  | 'UNKNOWN_ERROR'

// Provider-specific response types (for internal use)
export interface OpenAIStreamResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    delta: {
      content?: string
      role?: string
    }
    finish_reason: string | null
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface AnthropicStreamResponse {
  type: 'message_start' | 'content_block_start' | 'content_block_delta' | 'content_block_stop' | 'message_delta' | 'message_stop'
  message?: {
    id: string
    model: string
    usage: {
      input_tokens: number
      output_tokens: number
    }
  }
  delta?: {
    type: string
    text?: string
    stop_reason?: string
  }
  content_block?: {
    type: string
    text: string
  }
  usage?: {
    output_tokens: number
  }
}

export interface GoogleStreamResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>
      role: string
    }
    finishReason?: string
  }>
  usageMetadata?: {
    promptTokenCount: number
    candidatesTokenCount: number
    totalTokenCount: number
  }
}

// Cost calculation helper
export function calculateCost(
  usage: TokenUsage,
  inputPrice: number,
  outputPrice: number
): number {
  return (usage.inputTokens * inputPrice) + (usage.outputTokens * outputPrice)
}

// Parse SSE data lines
export function parseSSELine(line: string): string | null {
  if (line.startsWith('data: ')) {
    const data = line.slice(6)
    if (data === '[DONE]') return null
    return data
  }
  return null
}
