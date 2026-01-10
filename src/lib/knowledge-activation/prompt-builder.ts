/**
 * Prompt Builder - Inserts activated knowledge entries into prompts at correct positions
 *
 * Handles 7 positioning modes:
 * - before_character: Before bot character card
 * - after_character: After bot character card
 * - before_examples: Before conversation examples
 * - after_examples: After conversation examples
 * - at_depth: At specific message depth with role
 * - system_top: At very beginning of system prompt
 * - system_bottom: At very end of system prompt
 */

import type { Bot, Persona } from '@/payload-types'
import type { ActivatedEntry, Position, MessageRole } from './types'

/**
 * Prompt structure markers for insertion points
 */
const MARKERS = {
  SYSTEM_START: '<<SYSTEM_START>>',
  SYSTEM_END: '<<SYSTEM_END>>',
  CHARACTER_START: '<<CHARACTER_START>>',
  CHARACTER_END: '<<CHARACTER_END>>',
  EXAMPLES_START: '<<EXAMPLES_START>>',
  EXAMPLES_END: '<<EXAMPLES_END>>',
}

/**
 * Prompt builder for inserting knowledge entries
 */
export class PromptBuilder {
  /**
   * Build final prompt with activated knowledge entries inserted
   */
  buildPrompt(
    basePrompt: string,
    activatedEntries: ActivatedEntry[],
    bot: Bot,
    persona?: Persona,
  ): string {
    // Group entries by position
    const groupedEntries = this.groupByPosition(activatedEntries)

    // Start with base prompt
    let prompt = basePrompt

    // Insert at each position in order
    prompt = this.insertAtSystemTop(prompt, groupedEntries.get('system_top') || [])
    prompt = this.insertBeforeCharacter(prompt, groupedEntries.get('before_character') || [], bot)
    prompt = this.insertAfterCharacter(prompt, groupedEntries.get('after_character') || [], bot)
    prompt = this.insertBeforeExamples(prompt, groupedEntries.get('before_examples') || [])
    prompt = this.insertAfterExamples(prompt, groupedEntries.get('after_examples') || [])
    prompt = this.insertAtDepth(prompt, groupedEntries.get('at_depth') || [])
    prompt = this.insertAtSystemBottom(prompt, groupedEntries.get('system_bottom') || [])

    return prompt
  }

  /**
   * Group entries by position and sort by order
   */
  private groupByPosition(entries: ActivatedEntry[]): Map<Position, ActivatedEntry[]> {
    const groups = new Map<Position, ActivatedEntry[]>()

    for (const entry of entries) {
      if (!groups.has(entry.position)) {
        groups.set(entry.position, [])
      }
      groups.get(entry.position)!.push(entry)
    }

    // Sort each group by order (ascending - lower order first)
    for (const [position, positionEntries] of groups) {
      positionEntries.sort((a, b) => a.order - b.order)
    }

    return groups
  }

  /**
   * Insert entries at system_top (very beginning)
   */
  private insertAtSystemTop(prompt: string, entries: ActivatedEntry[]): string {
    if (entries.length === 0) return prompt

    const formattedEntries = entries.map((e) => this.formatEntry(e)).join('\n\n')
    return `${formattedEntries}\n\n${prompt}`
  }

  /**
   * Insert entries before character card
   */
  private insertBeforeCharacter(
    prompt: string,
    entries: ActivatedEntry[],
    bot: Bot,
  ): string {
    if (entries.length === 0) return prompt

    const formattedEntries = entries.map((e) => this.formatEntry(e)).join('\n\n')

    // Try to find character card section
    // Common patterns: "Character:", "Name:", bot name
    const botName = bot.name
    const patterns = [
      new RegExp(`(Character:\\s*${botName})`, 'i'),
      new RegExp(`(Name:\\s*${botName})`, 'i'),
      new RegExp(`(${botName}:)`, 'i'),
    ]

    for (const pattern of patterns) {
      if (pattern.test(prompt)) {
        return prompt.replace(pattern, `${formattedEntries}\n\n$1`)
      }
    }

    // Fallback: insert after first line break if character section not found
    const firstLineBreak = prompt.indexOf('\n')
    if (firstLineBreak !== -1) {
      return (
        prompt.substring(0, firstLineBreak) +
        '\n\n' +
        formattedEntries +
        prompt.substring(firstLineBreak)
      )
    }

    // Last resort: prepend
    return `${formattedEntries}\n\n${prompt}`
  }

  /**
   * Insert entries after character card
   */
  private insertAfterCharacter(
    prompt: string,
    entries: ActivatedEntry[],
    bot: Bot,
  ): string {
    if (entries.length === 0) return prompt

    const formattedEntries = entries.map((e) => this.formatEntry(e)).join('\n\n')

    // Try to find end of character card section
    // Look for common end patterns: double line break, "###", "---", example section
    const patterns = [
      /(\n\n)(?=###)/,
      /(\n\n)(?=---)/,
      /(\n\n)(?=Example:|Examples:)/i,
      /(\n\n)(?=\[Example)/i,
    ]

    for (const pattern of patterns) {
      if (pattern.test(prompt)) {
        return prompt.replace(pattern, `$1${formattedEntries}\n\n`)
      }
    }

    // Fallback: look for second paragraph break
    const firstBreak = prompt.indexOf('\n\n')
    if (firstBreak !== -1) {
      const secondBreak = prompt.indexOf('\n\n', firstBreak + 2)
      if (secondBreak !== -1) {
        return (
          prompt.substring(0, secondBreak) +
          '\n\n' +
          formattedEntries +
          prompt.substring(secondBreak)
        )
      }
    }

    // Last resort: append after first paragraph
    if (firstBreak !== -1) {
      return (
        prompt.substring(0, firstBreak) +
        '\n\n' +
        formattedEntries +
        prompt.substring(firstBreak)
      )
    }

    return `${prompt}\n\n${formattedEntries}`
  }

  /**
   * Insert entries before examples
   */
  private insertBeforeExamples(prompt: string, entries: ActivatedEntry[]): string {
    if (entries.length === 0) return prompt

    const formattedEntries = entries.map((e) => this.formatEntry(e)).join('\n\n')

    // Look for example section markers
    const patterns = [
      /(Example:|Examples:)/i,
      /(\[Example \d+\])/i,
      /(###\s*Examples)/i,
      /(---\s*Examples)/i,
    ]

    for (const pattern of patterns) {
      if (pattern.test(prompt)) {
        return prompt.replace(pattern, `${formattedEntries}\n\n$1`)
      }
    }

    // No examples section found, append at end
    return `${prompt}\n\n${formattedEntries}`
  }

  /**
   * Insert entries after examples
   */
  private insertAfterExamples(prompt: string, entries: ActivatedEntry[]): string {
    if (entries.length === 0) return prompt

    const formattedEntries = entries.map((e) => this.formatEntry(e)).join('\n\n')

    // Look for end of example section
    // Usually marked by "###", "---", or end of last example
    const patterns = [
      /(\[Example \d+\][^\[]*?)(?=\n\n)/gi,
      /(Example \d+:[^\n]*(?:\n(?!\n).*)*)/gi,
    ]

    let lastExampleEnd = -1
    for (const pattern of patterns) {
      const matches = Array.from(prompt.matchAll(pattern))
      if (matches.length > 0) {
        const lastMatch = matches[matches.length - 1]
        const matchEnd = (lastMatch.index || 0) + lastMatch[0].length
        lastExampleEnd = Math.max(lastExampleEnd, matchEnd)
      }
    }

    if (lastExampleEnd !== -1) {
      return (
        prompt.substring(0, lastExampleEnd) +
        '\n\n' +
        formattedEntries +
        prompt.substring(lastExampleEnd)
      )
    }

    // No examples found, append at end
    return `${prompt}\n\n${formattedEntries}`
  }

  /**
   * Insert entries at specific depth in conversation
   * Note: This is handled differently - these entries are inserted into
   * the message array itself, not the system prompt
   */
  private insertAtDepth(prompt: string, entries: ActivatedEntry[]): string {
    // at_depth entries are handled separately in the chat integration
    // They're inserted as messages at specific depths, not in the system prompt
    // So we just return the prompt unchanged here
    return prompt
  }

  /**
   * Insert entries at system_bottom (very end)
   */
  private insertAtSystemBottom(prompt: string, entries: ActivatedEntry[]): string {
    if (entries.length === 0) return prompt

    const formattedEntries = entries.map((e) => this.formatEntry(e)).join('\n\n')
    return `${prompt}\n\n${formattedEntries}`
  }

  /**
   * Format a knowledge entry for insertion
   */
  private formatEntry(activatedEntry: ActivatedEntry): string {
    const entry = activatedEntry.entry
    const content = entry.entry

    // Simple formatting - just wrap in a labeled section
    // Can be customized based on entry type or user preferences
    let formatted = content

    // Add source label if entry has a title/tag
    const tags = entry.tags?.map((t) => (typeof t === 'object' && 'tag' in t ? t.tag : t))
    if (tags && tags.length > 0) {
      formatted = `[${tags[0]}]\n${formatted}`
    }

    return formatted
  }

  /**
   * Build messages array with at_depth entries inserted
   */
  buildMessagesWithDepthEntries(
    messages: Array<{ role: string; content: string }>,
    activatedEntries: ActivatedEntry[],
  ): Array<{ role: string; content: string }> {
    // Filter to only at_depth entries
    const depthEntries = activatedEntries.filter((e) => e.position === 'at_depth')

    if (depthEntries.length === 0) {
      return messages
    }

    // Sort by depth (insertion order)
    depthEntries.sort((a, b) => a.depth - b.depth)

    // Create new messages array with insertions
    const newMessages = [...messages]

    // Insert entries at specified depths (from end)
    for (const entry of depthEntries) {
      const insertIndex = Math.max(0, newMessages.length - entry.depth)

      newMessages.splice(insertIndex, 0, {
        role: entry.role,
        content: this.formatEntry(entry),
      })
    }

    return newMessages
  }

  /**
   * Extract activation metadata for debugging
   */
  getActivationDebugInfo(activatedEntries: ActivatedEntry[]): string {
    const grouped = this.groupByPosition(activatedEntries)
    const lines: string[] = []

    lines.push('=== Knowledge Activation Debug ===')
    lines.push(`Total Entries: ${activatedEntries.length}`)
    lines.push('')

    for (const [position, entries] of grouped) {
      lines.push(`${position.toUpperCase()} (${entries.length}):`)
      for (const entry of entries) {
        lines.push(
          `  - [${entry.activationMethod}] Score: ${entry.activationScore.toFixed(2)} | Order: ${entry.order} | Tokens: ${entry.tokenCost}`,
        )
        if (entry.matchedKeywords && entry.matchedKeywords.length > 0) {
          lines.push(`    Keywords: ${entry.matchedKeywords.join(', ')}`)
        }
        if (entry.vectorSimilarity) {
          lines.push(`    Similarity: ${(entry.vectorSimilarity * 100).toFixed(1)}%`)
        }
      }
      lines.push('')
    }

    return lines.join('\n')
  }
}

/**
 * Factory function to create prompt builder
 */
export function createPromptBuilder(): PromptBuilder {
  return new PromptBuilder()
}

/**
 * Quick utility to insert knowledge into a prompt
 */
export function insertKnowledgeIntoPrompt(
  basePrompt: string,
  activatedEntries: ActivatedEntry[],
  bot: Bot,
  persona?: Persona,
): string {
  const builder = new PromptBuilder()
  return builder.buildPrompt(basePrompt, activatedEntries, bot, persona)
}
