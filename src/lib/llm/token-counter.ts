/**
 * Token Counter Utilities
 *
 * Provides token estimation for different models.
 * These are approximations - actual counts come from the API response.
 */

// Average characters per token by model family
const CHARS_PER_TOKEN: Record<string, number> = {
  // OpenAI models
  'gpt-4': 4,
  'gpt-4-turbo': 4,
  'gpt-4o': 4,
  'gpt-3.5-turbo': 4,

  // Anthropic models
  'claude-3': 3.5,
  'claude-2': 3.5,

  // Google models
  'gemini': 4,

  // Default fallback
  default: 4,
}

/**
 * Estimate token count for text
 * Uses character-based approximation
 */
export function estimateTokens(text: string, model?: string): number {
  if (!text) return 0

  // Find the right chars-per-token ratio
  let charsPerToken = CHARS_PER_TOKEN.default

  if (model) {
    const modelLower = model.toLowerCase()
    for (const [prefix, ratio] of Object.entries(CHARS_PER_TOKEN)) {
      if (modelLower.includes(prefix)) {
        charsPerToken = ratio
        break
      }
    }
  }

  // Count characters (excluding extra whitespace)
  const cleanText = text.replace(/\s+/g, ' ').trim()

  // Estimate tokens
  const tokens = Math.ceil(cleanText.length / charsPerToken)

  // Add overhead for special tokens (~3-5 per message)
  return tokens + 4
}

/**
 * Estimate tokens for a chat message array
 */
export function estimateMessagesTokens(
  messages: Array<{ role: string; content: string }>,
  model?: string
): number {
  let total = 0

  for (const message of messages) {
    // Message overhead (role, delimiters)
    total += 4

    // Content tokens
    total += estimateTokens(message.content, model)
  }

  // Conversation overhead
  total += 3

  return total
}

/**
 * Truncate text to fit within token limit
 */
export function truncateToTokenLimit(
  text: string,
  maxTokens: number,
  model?: string
): string {
  const currentTokens = estimateTokens(text, model)

  if (currentTokens <= maxTokens) {
    return text
  }

  // Find the right chars-per-token ratio
  let charsPerToken = CHARS_PER_TOKEN.default
  if (model) {
    const modelLower = model.toLowerCase()
    for (const [prefix, ratio] of Object.entries(CHARS_PER_TOKEN)) {
      if (modelLower.includes(prefix)) {
        charsPerToken = ratio
        break
      }
    }
  }

  // Calculate target length
  const targetChars = (maxTokens - 4) * charsPerToken

  // Truncate and add ellipsis
  return text.slice(0, Math.floor(targetChars)) + '...'
}

/**
 * Split text into chunks that fit within token limits
 */
export function chunkByTokens(
  text: string,
  maxTokensPerChunk: number,
  model?: string
): string[] {
  const chunks: string[] = []

  // Split by paragraphs first
  const paragraphs = text.split(/\n\n+/)

  let currentChunk = ''

  for (const paragraph of paragraphs) {
    const paragraphTokens = estimateTokens(paragraph, model)

    if (paragraphTokens > maxTokensPerChunk) {
      // Paragraph itself is too large - split by sentences
      if (currentChunk) {
        chunks.push(currentChunk.trim())
        currentChunk = ''
      }

      const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph]
      for (const sentence of sentences) {
        const sentenceTokens = estimateTokens(sentence, model)
        const currentTokens = estimateTokens(currentChunk, model)

        if (currentTokens + sentenceTokens > maxTokensPerChunk) {
          if (currentChunk) {
            chunks.push(currentChunk.trim())
          }
          currentChunk = sentence
        } else {
          currentChunk += sentence
        }
      }
    } else {
      const currentTokens = estimateTokens(currentChunk, model)

      if (currentTokens + paragraphTokens > maxTokensPerChunk) {
        if (currentChunk) {
          chunks.push(currentChunk.trim())
        }
        currentChunk = paragraph
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim())
  }

  return chunks
}

/**
 * Get context window size for a model
 */
export function getContextWindow(model: string): number {
  const modelLower = model.toLowerCase()

  // OpenAI models
  if (modelLower.includes('gpt-4o')) return 128000
  if (modelLower.includes('gpt-4-turbo')) return 128000
  if (modelLower.includes('gpt-4-32k')) return 32768
  if (modelLower.includes('gpt-4')) return 8192
  if (modelLower.includes('gpt-3.5-turbo-16k')) return 16385
  if (modelLower.includes('gpt-3.5-turbo')) return 4096

  // Anthropic models
  if (modelLower.includes('claude-3-opus')) return 200000
  if (modelLower.includes('claude-3-sonnet')) return 200000
  if (modelLower.includes('claude-3-haiku')) return 200000
  if (modelLower.includes('claude-2')) return 100000

  // Google models
  if (modelLower.includes('gemini-1.5-pro')) return 1000000
  if (modelLower.includes('gemini-1.5-flash')) return 1000000
  if (modelLower.includes('gemini-pro')) return 32760

  // DeepSeek
  if (modelLower.includes('deepseek-chat')) return 32768
  if (modelLower.includes('deepseek-coder')) return 16384

  // Groq (Llama models)
  if (modelLower.includes('llama-3.1')) return 131072
  if (modelLower.includes('llama-3')) return 8192
  if (modelLower.includes('mixtral')) return 32768

  // Default
  return 4096
}

/**
 * Get max output tokens for a model
 */
export function getMaxOutputTokens(model: string): number {
  const modelLower = model.toLowerCase()

  // OpenAI models
  if (modelLower.includes('gpt-4o')) return 16384
  if (modelLower.includes('gpt-4-turbo')) return 4096
  if (modelLower.includes('gpt-4')) return 8192
  if (modelLower.includes('gpt-3.5-turbo')) return 4096

  // Anthropic models
  if (modelLower.includes('claude-3')) return 4096
  if (modelLower.includes('claude-2')) return 4096

  // Google models
  if (modelLower.includes('gemini')) return 8192

  // Default
  return 4096
}
