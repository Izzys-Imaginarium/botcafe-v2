/**
 * Reasoning/Thinking Utilities
 *
 * Handles extraction of reasoning content from models that embed
 * thinking in <think> tags within the content rather than using
 * a separate field (e.g., some OpenRouter models, GLM-4.5V).
 */

/**
 * Extract <think>...</think> blocks from content.
 * Returns separated reasoning and clean content.
 */
export function extractThinkTags(text: string): {
  reasoning: string
  content: string
} {
  const thinkRegex = /^<think>([\s\S]*?)<\/think>\s*/
  const match = text.match(thinkRegex)

  if (!match) {
    return { reasoning: '', content: text }
  }

  return {
    reasoning: match[1].trim(),
    content: text.slice(match[0].length),
  }
}
