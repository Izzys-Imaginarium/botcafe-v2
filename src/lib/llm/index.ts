/**
 * LLM Provider Router
 *
 * Main entry point for LLM interactions.
 * Routes requests to the appropriate provider based on API key type.
 */

import type {
  LLMProvider,
  ProviderName,
  SendMessageParams,
  ProviderConfig,
  StreamChunk,
  ChatMessage,
  TokenUsage,
} from './types'
import { LLMError } from './types'

// Import all providers
import { openaiProvider } from './providers/openai'
import { anthropicProvider } from './providers/anthropic'
import { googleProvider } from './providers/google'
import { deepseekProvider } from './providers/deepseek'
import { groqProvider } from './providers/groq'
import { openrouterProvider } from './providers/openrouter'
import { electronhubProvider } from './providers/electronhub'

// Provider registry
const providers: Record<ProviderName, LLMProvider> = {
  openai: openaiProvider,
  anthropic: anthropicProvider,
  google: googleProvider,
  deepseek: deepseekProvider,
  groq: groqProvider,
  openrouter: openrouterProvider,
  electronhub: electronhubProvider,
}

/**
 * Get a provider by name
 */
export function getProvider(providerName: ProviderName): LLMProvider {
  const provider = providers[providerName]
  if (!provider) {
    throw new LLMError(
      `Unknown provider: ${providerName}`,
      'UNKNOWN_ERROR',
      providerName
    )
  }
  return provider
}

/**
 * Get all available providers
 */
export function getAllProviders(): LLMProvider[] {
  return Object.values(providers)
}

/**
 * Get provider names
 */
export function getProviderNames(): ProviderName[] {
  return Object.keys(providers) as ProviderName[]
}

/**
 * Send a message to an LLM provider and stream the response
 */
export async function* streamMessage(
  providerName: ProviderName,
  params: SendMessageParams,
  config: ProviderConfig
): AsyncGenerator<StreamChunk, void, unknown> {
  const provider = getProvider(providerName)

  yield* provider.sendMessage(params, config)
}

/**
 * Send a message and collect the full response (non-streaming)
 */
export async function sendMessage(
  providerName: ProviderName,
  params: SendMessageParams,
  config: ProviderConfig
): Promise<{
  content: string
  usage: TokenUsage | undefined
  finishReason: StreamChunk['finishReason']
}> {
  const provider = getProvider(providerName)

  let content = ''
  let usage: TokenUsage | undefined
  let finishReason: StreamChunk['finishReason'] = null

  for await (const chunk of provider.sendMessage(params, config)) {
    content += chunk.content
    if (chunk.usage) {
      usage = chunk.usage
    }
    if (chunk.done) {
      finishReason = chunk.finishReason
    }
  }

  return { content, usage, finishReason }
}

/**
 * Estimate token count for messages
 */
export function estimateTokens(
  providerName: ProviderName,
  messages: ChatMessage[]
): number {
  const provider = getProvider(providerName)

  let total = 0
  for (const message of messages) {
    total += provider.estimateTokens(message.content)
    total += 4 // Message overhead
  }
  total += 3 // Conversation overhead

  return total
}

/**
 * Validate API key format for a provider
 */
export function validateApiKey(
  providerName: ProviderName,
  apiKey: string
): boolean {
  const provider = getProvider(providerName)
  return provider.validateApiKeyFormat(apiKey)
}

/**
 * Get supported models for a provider
 */
export function getSupportedModels(providerName: ProviderName): string[] {
  const provider = getProvider(providerName)
  return provider.supportedModels
}

/**
 * Get the default model for a provider
 */
export function getDefaultModel(providerName: ProviderName): string {
  const provider = getProvider(providerName)
  return provider.defaultModel
}

/**
 * Provider display info for UI
 */
export interface ProviderInfo {
  name: ProviderName
  displayName: string
  defaultModel: string
  supportedModels: string[]
}

/**
 * Get display info for all providers
 */
export function getProviderInfo(): ProviderInfo[] {
  return Object.values(providers).map((p) => ({
    name: p.name,
    displayName: p.displayName,
    defaultModel: p.defaultModel,
    supportedModels: p.supportedModels,
  }))
}

// Re-export types
export type {
  LLMProvider,
  ProviderName,
  SendMessageParams,
  ProviderConfig,
  StreamChunk,
  ChatMessage,
  TokenUsage,
  MessageRole,
} from './types'

export { LLMError } from './types'
export { estimateTokens as estimateTextTokens } from './token-counter'
export { getContextWindow, getMaxOutputTokens } from './token-counter'
