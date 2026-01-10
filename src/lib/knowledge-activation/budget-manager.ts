/**
 * Budget Manager - Token budget management for knowledge activation
 *
 * Ensures activated knowledge entries fit within context window limits
 * while prioritizing most relevant entries.
 */

import type { ActivatedEntry, BudgetConfig } from './types'

/**
 * Budget statistics
 */
export interface BudgetStats {
  totalBudget: number
  usedBudget: number
  remainingBudget: number
  percentUsed: number
  totalEntries: number
  includedEntries: number
  excludedEntries: number
  ignoreBudgetEntries: number
  averageTokensPerEntry: number
}

/**
 * Budget manager for controlling token usage
 */
export class BudgetManager {
  /**
   * Calculate available token budget
   */
  calculateBudget(config: BudgetConfig): number {
    // Calculate budget as percentage of max context
    const percentageBudget = config.maxContextTokens * (config.budgetPercentage / 100)

    // Apply cap
    const cappedBudget = Math.min(percentageBudget, config.budgetCapTokens)

    // Subtract reserved tokens for conversation history
    const availableBudget = Math.max(0, cappedBudget - config.reservedForConversation)

    return Math.floor(availableBudget)
  }

  /**
   * Apply budget to entries, excluding low-priority entries
   */
  applyBudget(entries: ActivatedEntry[], budget: number): ActivatedEntry[] {
    // Separate entries that ignore budget
    const ignoreBudgetEntries = entries.filter((e) => e.ignoreBudget && e.wasIncluded)
    const budgetedEntries = entries.filter((e) => !e.ignoreBudget && e.wasIncluded)
    const alreadyExcluded = entries.filter((e) => !e.wasIncluded)

    // Sort budgeted entries by priority (score descending)
    const sortedEntries = this.sortByPriority(budgetedEntries)

    // Allocate budget
    let usedBudget = 0
    const processedEntries = sortedEntries.map((entry) => {
      if (usedBudget + entry.tokenCost <= budget) {
        usedBudget += entry.tokenCost
        return entry
      } else {
        return {
          ...entry,
          wasIncluded: false,
          exclusionReason: 'budget_exceeded' as const,
        }
      }
    })

    // Combine all entries
    return [...ignoreBudgetEntries, ...processedEntries, ...alreadyExcluded]
  }

  /**
   * Apply budget with minimum activations guarantee
   */
  applyBudgetWithMin(
    entries: ActivatedEntry[],
    budget: number,
    minActivations: number,
  ): ActivatedEntry[] {
    // Separate entries that ignore budget
    const ignoreBudgetEntries = entries.filter((e) => e.ignoreBudget && e.wasIncluded)
    const budgetedEntries = entries.filter((e) => !e.ignoreBudget && e.wasIncluded)
    const alreadyExcluded = entries.filter((e) => !e.wasIncluded)

    // Sort budgeted entries by priority
    const sortedEntries = this.sortByPriority(budgetedEntries)

    // Allocate budget with minimum guarantee
    let usedBudget = 0
    let includedCount = 0

    const processedEntries = sortedEntries.map((entry) => {
      // Include if within budget OR haven't reached minimum yet
      if (usedBudget + entry.tokenCost <= budget || includedCount < minActivations) {
        usedBudget += entry.tokenCost
        includedCount++
        return entry
      } else {
        return {
          ...entry,
          wasIncluded: false,
          exclusionReason: 'budget_exceeded' as const,
        }
      }
    })

    // Combine all entries
    return [...ignoreBudgetEntries, ...processedEntries, ...alreadyExcluded]
  }

  /**
   * Sort entries by priority (activation score weighted by group weight)
   */
  private sortByPriority(entries: ActivatedEntry[]): ActivatedEntry[] {
    return entries.sort((a, b) => {
      const aPriority = a.activationScore * a.groupWeight
      const bPriority = b.activationScore * b.groupWeight
      return bPriority - aPriority
    })
  }

  /**
   * Estimate token count for text
   * Uses simple heuristic: ~4 characters per token (approximate for English)
   */
  estimateTokens(text: string): number {
    if (!text) return 0

    // Simple character-based estimation
    const charCount = text.length

    // Average: 4 characters per token
    const tokenEstimate = Math.ceil(charCount / 4)

    return tokenEstimate
  }

  /**
   * Estimate tokens for an entry including formatting overhead
   */
  estimateEntryTokens(entryText: string, includeFormatting: boolean = true): number {
    const baseTokens = this.estimateTokens(entryText)

    // Add overhead for formatting (labels, separators, etc.)
    const formattingOverhead = includeFormatting ? 10 : 0

    return baseTokens + formattingOverhead
  }

  /**
   * Calculate token costs for all entries
   */
  calculateEntryCosts(entries: ActivatedEntry[]): ActivatedEntry[] {
    return entries.map((entry) => {
      const tokenCost = this.estimateEntryTokens(entry.entry.entry, true)

      return {
        ...entry,
        tokenCost,
      }
    })
  }

  /**
   * Get budget usage statistics
   */
  getUsageStats(entries: ActivatedEntry[], totalBudget: number): BudgetStats {
    const includedEntries = entries.filter((e) => e.wasIncluded)
    const excludedEntries = entries.filter((e) => !e.wasIncluded)
    const ignoreBudgetEntries = entries.filter((e) => e.ignoreBudget && e.wasIncluded)

    const usedBudget = includedEntries.reduce((sum, e) => sum + e.tokenCost, 0)
    const remainingBudget = Math.max(0, totalBudget - usedBudget)
    const percentUsed = totalBudget > 0 ? (usedBudget / totalBudget) * 100 : 0

    const averageTokensPerEntry =
      includedEntries.length > 0
        ? usedBudget / includedEntries.length
        : 0

    return {
      totalBudget,
      usedBudget,
      remainingBudget,
      percentUsed,
      totalEntries: entries.length,
      includedEntries: includedEntries.length,
      excludedEntries: excludedEntries.length,
      ignoreBudgetEntries: ignoreBudgetEntries.length,
      averageTokensPerEntry,
    }
  }

  /**
   * Optimize budget allocation using greedy algorithm
   * Maximizes total activation score within budget
   */
  optimizeBudgetAllocation(
    entries: ActivatedEntry[],
    budget: number,
  ): ActivatedEntry[] {
    // Separate ignore-budget entries
    const ignoreBudgetEntries = entries.filter((e) => e.ignoreBudget && e.wasIncluded)
    const budgetedEntries = entries.filter((e) => !e.ignoreBudget && e.wasIncluded)
    const alreadyExcluded = entries.filter((e) => !e.wasIncluded)

    // Calculate value-to-cost ratio for each entry
    const scoredEntries = budgetedEntries.map((entry) => ({
      entry,
      ratio: entry.tokenCost > 0 ? entry.activationScore / entry.tokenCost : entry.activationScore,
    }))

    // Sort by ratio (highest first)
    scoredEntries.sort((a, b) => b.ratio - a.ratio)

    // Greedy selection
    let usedBudget = 0
    const processedEntries = scoredEntries.map(({ entry }) => {
      if (usedBudget + entry.tokenCost <= budget) {
        usedBudget += entry.tokenCost
        return entry
      } else {
        return {
          ...entry,
          wasIncluded: false,
          exclusionReason: 'budget_exceeded' as const,
        }
      }
    })

    return [...ignoreBudgetEntries, ...processedEntries, ...alreadyExcluded]
  }

  /**
   * Check if adding an entry would exceed budget
   */
  wouldExceedBudget(
    currentUsage: number,
    entryTokens: number,
    totalBudget: number,
  ): boolean {
    return currentUsage + entryTokens > totalBudget
  }

  /**
   * Get recommended budget configuration for a model
   */
  getRecommendedBudgetConfig(
    modelContextWindow: number,
    conversationLength: number,
  ): BudgetConfig {
    // Reserve space for conversation (actual messages)
    const reservedForConversation = Math.min(conversationLength * 150, modelContextWindow * 0.6)

    // Allocate 20-30% for knowledge activation
    const budgetPercentage = 25

    // Cap at reasonable limit to prevent overwhelming context
    const budgetCapTokens = Math.min(modelContextWindow * 0.3, 2000)

    // Ensure at least 2 entries can be included
    const minActivations = 2

    return {
      maxContextTokens: modelContextWindow,
      budgetPercentage,
      budgetCapTokens,
      reservedForConversation,
      minActivations,
    }
  }

  /**
   * Format budget stats for display/logging
   */
  formatBudgetStats(stats: BudgetStats): string {
    const lines: string[] = []

    lines.push('=== Token Budget Statistics ===')
    lines.push(`Total Budget: ${stats.totalBudget} tokens`)
    lines.push(`Used: ${stats.usedBudget} tokens (${stats.percentUsed.toFixed(1)}%)`)
    lines.push(`Remaining: ${stats.remainingBudget} tokens`)
    lines.push('')
    lines.push(`Total Entries: ${stats.totalEntries}`)
    lines.push(`  ✓ Included: ${stats.includedEntries}`)
    lines.push(`  ✗ Excluded: ${stats.excludedEntries}`)
    lines.push(`  ∞ Ignore Budget: ${stats.ignoreBudgetEntries}`)
    lines.push('')
    lines.push(`Average Tokens/Entry: ${stats.averageTokensPerEntry.toFixed(1)}`)

    return lines.join('\n')
  }
}

/**
 * Factory function to create budget manager
 */
export function createBudgetManager(): BudgetManager {
  return new BudgetManager()
}

/**
 * Quick utility to check if entries fit in budget
 */
export function checkBudgetFit(
  entries: ActivatedEntry[],
  budget: number,
): { fits: boolean; overageTokens: number } {
  const totalTokens = entries
    .filter((e) => e.wasIncluded && !e.ignoreBudget)
    .reduce((sum, e) => sum + e.tokenCost, 0)

  const fits = totalTokens <= budget
  const overageTokens = Math.max(0, totalTokens - budget)

  return { fits, overageTokens }
}
