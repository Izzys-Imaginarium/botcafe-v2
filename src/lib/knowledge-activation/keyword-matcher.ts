/**
 * Keyword Matcher
 *
 * Matches keywords in messages with support for:
 * - Primary and secondary keywords
 * - Selective logic (AND_ANY, AND_ALL, NOT_ALL, NOT_ANY)
 * - Case sensitivity
 * - Whole word matching
 * - Regex patterns
 */

import type { Knowledge, Message } from '@/payload-types'
import type {
  KeywordMatchOptions,
  KeywordMatchResult,
  KeywordsLogic,
  ScanConfig,
} from './types'
import { KeywordMatchError } from './types'

export class KeywordMatcher {
  /**
   * Match a knowledge entry against messages
   */
  matchEntry(
    entry: Knowledge,
    messages: Message[],
    scanConfig: ScanConfig,
  ): KeywordMatchResult {
    try {
      // Extract keywords from entry
      const primaryKeys = this.extractKeywords(entry.activation_settings?.primary_keys)
      const secondaryKeys = this.extractKeywords(entry.activation_settings?.secondary_keys)

      if (primaryKeys.length === 0 && secondaryKeys.length === 0) {
        return {
          matched: false,
          score: 0,
          matchedKeywords: [],
          primaryMatches: [],
          secondaryMatches: [],
        }
      }

      // Build search text from messages
      const searchText = this.buildSearchText(messages, scanConfig, entry)

      // Get match options
      const options: KeywordMatchOptions = {
        caseSensitive: entry.activation_settings?.case_sensitive ?? false,
        matchWholeWords: entry.activation_settings?.match_whole_words ?? false,
        useRegex: entry.activation_settings?.use_regex ?? false,
      }

      // Find matches
      const primaryMatches = this.findMatches(searchText, primaryKeys, options)
      const secondaryMatches = this.findMatches(searchText, secondaryKeys, options)

      // Apply selective logic
      const logic = (entry.activation_settings?.keywords_logic ?? 'AND_ANY') as KeywordsLogic
      const matched = this.applySelectiveLogic(
        primaryMatches,
        secondaryMatches,
        primaryKeys,
        secondaryKeys,
        logic,
      )

      // Calculate score (primary = 2 points, secondary = 1 point)
      const score = primaryMatches.length * 2 + secondaryMatches.length

      return {
        matched,
        score,
        matchedKeywords: [...primaryMatches, ...secondaryMatches],
        primaryMatches,
        secondaryMatches,
      }
    } catch (error) {
      throw new KeywordMatchError(
        `Failed to match keywords for entry ${entry.id}`,
        { error, entryId: entry.id },
      )
    }
  }

  /**
   * Extract keyword strings from array of keyword objects
   */
  private extractKeywords(keywordArray: any[] | undefined | null): string[] {
    if (!keywordArray || !Array.isArray(keywordArray)) return []

    return keywordArray
      .map((item) => item?.keyword)
      .filter((k): k is string => typeof k === 'string' && k.trim().length > 0)
  }

  /**
   * Build search text from messages based on scan config
   */
  private buildSearchText(
    messages: Message[],
    scanConfig: ScanConfig,
    entry: Knowledge,
  ): string {
    const parts: string[] = []

    // Limit to scan depth
    const messagesToScan = messages.slice(-scanConfig.scanDepth)

    for (const message of messagesToScan) {
      const role = message.role as string

      if (scanConfig.matchInUserMessages && role === 'user') {
        parts.push(message.content ?? '')
      }

      if (scanConfig.matchInBotMessages && role === 'assistant') {
        parts.push(message.content ?? '')
      }

      if (scanConfig.matchInSystemPrompts && role === 'system') {
        parts.push(message.content ?? '')
      }
    }

    // Optionally match in bot/persona descriptions
    // Note: This would require passing bot/persona data to this function
    // For now, we'll add a placeholder for future implementation

    return parts.join('\n')
  }

  /**
   * Find keyword matches in text
   */
  private findMatches(
    text: string,
    keywords: string[],
    options: KeywordMatchOptions,
  ): string[] {
    const matches: string[] = []

    for (const keyword of keywords) {
      if (this.matchKeyword(text, keyword, options)) {
        matches.push(keyword)
      }
    }

    return matches
  }

  /**
   * Check if a single keyword matches in text
   */
  private matchKeyword(
    text: string,
    keyword: string,
    options: KeywordMatchOptions,
  ): boolean {
    try {
      if (options.useRegex) {
        // Regex matching
        const flags = options.caseSensitive ? 'g' : 'gi'
        const regex = new RegExp(keyword, flags)
        return regex.test(text)
      } else {
        // Literal string matching
        let searchText = text
        let searchKeyword = keyword

        if (!options.caseSensitive) {
          searchText = text.toLowerCase()
          searchKeyword = keyword.toLowerCase()
        }

        if (options.matchWholeWords) {
          // Use word boundary regex for whole word matching
          const flags = options.caseSensitive ? 'g' : 'gi'
          const escapedKeyword = this.escapeRegex(keyword)
          const regex = new RegExp(`\\b${escapedKeyword}\\b`, flags)
          return regex.test(text)
        } else {
          // Simple substring search
          return searchText.includes(searchKeyword)
        }
      }
    } catch (error) {
      // Invalid regex or other error - treat as no match
      console.warn(`Keyword match error for "${keyword}":`, error)
      return false
    }
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  /**
   * Apply selective logic to determine if entry should activate
   */
  private applySelectiveLogic(
    primaryMatches: string[],
    secondaryMatches: string[],
    primaryKeys: string[],
    secondaryKeys: string[],
    logic: KeywordsLogic,
  ): boolean {
    switch (logic) {
      case 'AND_ANY':
        // Any primary OR any secondary
        return primaryMatches.length > 0 || secondaryMatches.length > 0

      case 'AND_ALL':
        // All primary AND all secondary (if they exist)
        const allPrimaryMatch =
          primaryKeys.length === 0 || primaryMatches.length === primaryKeys.length
        const allSecondaryMatch =
          secondaryKeys.length === 0 || secondaryMatches.length === secondaryKeys.length
        return allPrimaryMatch && allSecondaryMatch

      case 'NOT_ALL':
        // NOT (all primary AND all secondary) - exclude if everything matches
        const allPrimary = primaryKeys.length > 0 && primaryMatches.length === primaryKeys.length
        const allSecondary =
          secondaryKeys.length > 0 && secondaryMatches.length === secondaryKeys.length
        return !(allPrimary && allSecondary)

      case 'NOT_ANY':
        // NOT (any primary OR any secondary) - exclude if anything matches
        return primaryMatches.length === 0 && secondaryMatches.length === 0

      default:
        return false
    }
  }

  /**
   * Calculate match score for sorting
   */
  calculateScore(result: KeywordMatchResult): number {
    // Primary matches worth 2 points, secondary worth 1 point
    return result.primaryMatches.length * 2 + result.secondaryMatches.length
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a keyword matcher instance
 */
export function createKeywordMatcher(): KeywordMatcher {
  return new KeywordMatcher()
}

/**
 * Quick match function for convenience
 */
export function matchKeywords(
  entry: Knowledge,
  messages: Message[],
  scanConfig: ScanConfig,
): KeywordMatchResult {
  const matcher = new KeywordMatcher()
  return matcher.matchEntry(entry, messages, scanConfig)
}
