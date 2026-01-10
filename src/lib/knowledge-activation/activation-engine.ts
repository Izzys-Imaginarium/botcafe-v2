/**
 * Activation Engine - Main orchestrator for hybrid knowledge activation
 *
 * Combines keyword-based and vector-based activation to retrieve relevant
 * knowledge entries for a conversation context.
 */

import type { Payload } from 'payload'
import type { Knowledge, Message, Bot, Persona } from '@/payload-types'
import type {
  ActivationContext,
  ActivationResult,
  ActivatedEntry,
  ActivationMode,
  ActivationMethod,
  ConversationState,
  EntryState,
  ScanConfig,
  VectorSearchOptions,
  FilterConfig,
  BudgetConfig,
  ExclusionReason,
} from './types'
import { ActivationError } from './types'
import { KeywordMatcher } from './keyword-matcher'
import { VectorRetriever } from './vector-retriever'

/**
 * Main activation engine that orchestrates the hybrid activation process
 */
export class ActivationEngine {
  private keywordMatcher: KeywordMatcher
  private vectorRetriever: VectorRetriever
  private conversationStates: Map<string, ConversationState>

  constructor() {
    this.keywordMatcher = new KeywordMatcher()
    this.vectorRetriever = new VectorRetriever()
    this.conversationStates = new Map()
  }

  /**
   * Main activation method - orchestrates the entire activation process
   */
  async activate(context: ActivationContext): Promise<ActivationResult> {
    const startTime = Date.now()

    try {
      // Fetch all knowledge entries for the user
      const allEntries = await this.fetchKnowledgeEntries(context)

      // Get or create conversation state for timed effects
      const conversationState = this.getConversationState(
        context.conversationId,
        context.currentMessageIndex,
      )

      // Run keyword activation
      const keywordResults = await this.keywordActivation(
        allEntries,
        context.messages,
        context.filters,
        conversationState,
      )

      // Run vector activation
      const vectorResults = await this.vectorActivation(
        allEntries,
        context.messages,
        context.filters,
        context.env,
      )

      // Run constant activation (entries with activation_mode: 'constant')
      const constantResults = this.constantActivation(allEntries, context.filters)

      // Merge all results and remove duplicates
      let activatedEntries = this.mergeResults(keywordResults, vectorResults, constantResults)

      // Apply filtering (bot/persona restrictions)
      activatedEntries = this.applyFiltering(activatedEntries, context.filters)

      // Apply timed effects (sticky, cooldown, delay)
      activatedEntries = this.applyTimedEffects(activatedEntries, conversationState)

      // Apply probability checks
      activatedEntries = this.applyProbability(activatedEntries)

      // Apply group scoring (only highest score in each group)
      activatedEntries = this.applyGroupScoring(activatedEntries)

      // Apply token budget
      activatedEntries = this.applyBudget(activatedEntries, context.budgetConfig)

      // Update conversation state for next activation
      this.updateConversationState(conversationState, activatedEntries)

      // Log activations to database (async, non-blocking)
      if (context.payload) {
        this.logActivations(
          context.payload,
          context.conversationId,
          context.currentMessageIndex,
          activatedEntries,
        ).catch((error) => {
          console.error('Failed to log activations:', error)
        })
      }

      const totalTime = Date.now() - startTime

      // Calculate stats
      const includedEntries = activatedEntries.filter((e) => e.wasIncluded)
      const totalTokens = includedEntries.reduce((sum, e) => sum + e.tokenCost, 0)
      const budgetRemaining = this.calculateBudget(context.budgetConfig) - totalTokens

      return {
        activatedEntries: includedEntries,
        totalTokens,
        budgetRemaining,
        entriesExcludedByBudget: activatedEntries.filter((e) => e.exclusionReason === 'budget_exceeded').length,
        entriesExcludedByFilter: activatedEntries.filter((e) => e.exclusionReason === 'filter_excluded').length,
        entriesExcludedByProbability: activatedEntries.filter((e) => e.exclusionReason === 'probability_failed').length,
        entriesExcludedByCooldown: activatedEntries.filter((e) => e.exclusionReason === 'cooldown_active').length,
        entriesExcludedByDelay: activatedEntries.filter((e) => e.exclusionReason === 'delay_not_met').length,
        entriesExcludedByGroupScoring: activatedEntries.filter((e) => e.exclusionReason === 'group_scoring_lost').length,
      }
    } catch (error) {
      throw new ActivationError('Activation failed', 'ACTIVATION_FAILED', { error, context })
    }
  }

  /**
   * Fetch all knowledge entries for the current user
   */
  private async fetchKnowledgeEntries(context: ActivationContext): Promise<Knowledge[]> {
    if (!context.payload) {
      throw new ActivationError('Payload instance required for fetching entries', 'PAYLOAD_REQUIRED')
    }

    const result = await context.payload.find({
      collection: 'knowledge',
      where: {
        user: {
          equals: context.userId,
        },
      },
      limit: 1000, // TODO: Consider pagination for users with many entries
    })

    return result.docs
  }

  /**
   * Keyword-based activation
   */
  private async keywordActivation(
    allEntries: Knowledge[],
    messages: Message[],
    filters: FilterConfig,
    conversationState: ConversationState,
  ): Promise<ActivatedEntry[]> {
    const results: ActivatedEntry[] = []

    // Filter to only keyword/hybrid mode entries
    const keywordEntries = allEntries.filter(
      (entry) =>
        entry.activation_settings?.activation_mode === 'keyword' ||
        entry.activation_settings?.activation_mode === 'hybrid',
    )

    // Build scan config
    const scanConfig: ScanConfig = {
      scanDepth: 2, // Default, can be overridden per entry
      matchInUserMessages: true,
      matchInBotMessages: true,
      matchInSystemPrompts: false,
    }

    for (const entry of keywordEntries) {
      // Override scan config with entry-specific settings
      const entryScanConfig: ScanConfig = {
        scanDepth: entry.activation_settings?.scan_depth ?? scanConfig.scanDepth,
        matchInUserMessages:
          entry.activation_settings?.match_in_user_messages ?? scanConfig.matchInUserMessages,
        matchInBotMessages:
          entry.activation_settings?.match_in_bot_messages ?? scanConfig.matchInBotMessages,
        matchInSystemPrompts:
          entry.activation_settings?.match_in_system_prompts ?? scanConfig.matchInSystemPrompts,
      }

      // Run keyword matching
      const matchResult = this.keywordMatcher.matchEntry(entry, messages, entryScanConfig)

      if (matchResult.matched) {
        results.push({
          entry,
          entryId: entry.id,
          activationMethod: 'keyword',
          activationScore: matchResult.score,
          matchedKeywords: matchResult.matchedKeywords,
          position: entry.positioning?.position ?? 'before_character',
          depth: entry.positioning?.depth ?? 0,
          role: entry.positioning?.role ?? 'system',
          order: entry.positioning?.order ?? 100,
          tokenCost: entry.budget_control?.token_cost ?? 0,
          ignoreBudget: entry.budget_control?.ignore_budget ?? false,
          groupName: entry.group_settings?.group_name,
          groupWeight: entry.group_settings?.group_weight ?? 1.0,
          wasIncluded: true, // Will be updated by filters
        })
      }
    }

    return results
  }

  /**
   * Vector-based activation
   */
  private async vectorActivation(
    allEntries: Knowledge[],
    messages: Message[],
    filters: FilterConfig,
    env?: { VECTORIZE?: any; AI?: any },
  ): Promise<ActivatedEntry[]> {
    if (!env?.VECTORIZE || !env?.AI) {
      console.warn('Vectorize or AI binding not available, skipping vector activation')
      return []
    }

    const results: ActivatedEntry[] = []

    // Filter to only vector/hybrid mode entries
    const vectorEntries = allEntries.filter(
      (entry) =>
        entry.activation_settings?.activation_mode === 'vector' ||
        entry.activation_settings?.activation_mode === 'hybrid',
    )

    if (vectorEntries.length === 0) {
      return []
    }

    // Build query from recent messages
    const queryText = messages
      .slice(-2)
      .map((m) => this.keywordMatcher['extractMessageText'](m))
      .join(' ')

    if (!queryText.trim()) {
      return []
    }

    // Search vector database
    const searchOptions: VectorSearchOptions = {
      similarityThreshold: 0.7, // Default, can be overridden
      maxResults: 20, // Get more than needed, filter per entry
      filters: {
        userId: filters.userId,
      },
    }

    const vectorResults = await this.vectorRetriever.retrieveRelevant(queryText, searchOptions, env)

    // Match vector results back to entries
    for (const vectorResult of vectorResults) {
      const entry = vectorEntries.find((e) => String(e.id) === vectorResult.entryId)

      if (!entry) continue

      // Check entry-specific similarity threshold
      const threshold = entry.activation_settings?.vector_similarity_threshold ?? 0.7
      if (vectorResult.similarity < threshold) continue

      results.push({
        entry,
        entryId: entry.id,
        activationMethod: 'vector',
        activationScore: vectorResult.similarity * 100, // Normalize to 0-100
        vectorSimilarity: vectorResult.similarity,
        position: entry.positioning?.position ?? 'before_character',
        depth: entry.positioning?.depth ?? 0,
        role: entry.positioning?.role ?? 'system',
        order: entry.positioning?.order ?? 100,
        tokenCost: entry.budget_control?.token_cost ?? 0,
        ignoreBudget: entry.budget_control?.ignore_budget ?? false,
        groupName: entry.group_settings?.group_name,
        groupWeight: entry.group_settings?.group_weight ?? 1.0,
        wasIncluded: true,
      })
    }

    return results
  }

  /**
   * Constant activation (entries that are always active)
   */
  private constantActivation(allEntries: Knowledge[], filters: FilterConfig): ActivatedEntry[] {
    const results: ActivatedEntry[] = []

    const constantEntries = allEntries.filter(
      (entry) => entry.activation_settings?.activation_mode === 'constant',
    )

    for (const entry of constantEntries) {
      results.push({
        entry,
        entryId: entry.id,
        activationMethod: 'constant',
        activationScore: 100, // Always max score
        position: entry.positioning?.position ?? 'before_character',
        depth: entry.positioning?.depth ?? 0,
        role: entry.positioning?.role ?? 'system',
        order: entry.positioning?.order ?? 100,
        tokenCost: entry.budget_control?.token_cost ?? 0,
        ignoreBudget: entry.budget_control?.ignore_budget ?? false,
        groupName: entry.group_settings?.group_name,
        groupWeight: entry.group_settings?.group_weight ?? 1.0,
        wasIncluded: true,
      })
    }

    return results
  }

  /**
   * Merge keyword, vector, and constant results, removing duplicates
   */
  private mergeResults(
    keywordResults: ActivatedEntry[],
    vectorResults: ActivatedEntry[],
    constantResults: ActivatedEntry[],
  ): ActivatedEntry[] {
    const entryMap = new Map<string, ActivatedEntry>()

    // Add keyword results first (higher priority)
    for (const result of keywordResults) {
      entryMap.set(String(result.entryId), result)
    }

    // Add vector results (skip if already in map from keyword)
    for (const result of vectorResults) {
      const key = String(result.entryId)
      if (!entryMap.has(key)) {
        entryMap.set(key, result)
      } else {
        // Entry matched both keyword and vector - boost score
        const existing = entryMap.get(key)!
        existing.activationScore += result.activationScore * 0.5 // Hybrid boost
        existing.vectorSimilarity = result.vectorSimilarity
      }
    }

    // Add constant results
    for (const result of constantResults) {
      const key = String(result.entryId)
      if (!entryMap.has(key)) {
        entryMap.set(key, result)
      }
    }

    return Array.from(entryMap.values())
  }

  /**
   * Apply bot/persona filtering
   */
  private applyFiltering(entries: ActivatedEntry[], filters: FilterConfig): ActivatedEntry[] {
    return entries.map((entry) => {
      let excluded = false
      let reason: ExclusionReason | undefined

      const filterSettings = entry.entry.filtering

      // Bot filtering
      if (filterSettings?.filter_by_bots && filters.currentBotId) {
        const allowedBots = (filterSettings.allowed_bot_ids ?? []).map((id) =>
          typeof id === 'object' ? Number(id.id) : Number(id),
        )
        const excludedBots = (filterSettings.excluded_bot_ids ?? []).map((id) =>
          typeof id === 'object' ? Number(id.id) : Number(id),
        )

        if (allowedBots.length > 0 && !allowedBots.includes(Number(filters.currentBotId))) {
          excluded = true
          reason = 'filter_excluded'
        }

        if (excludedBots.includes(Number(filters.currentBotId))) {
          excluded = true
          reason = 'filter_excluded'
        }
      }

      // Persona filtering
      if (filterSettings?.filter_by_personas && filters.currentPersonaId) {
        const allowedPersonas = (filterSettings.allowed_persona_ids ?? []).map((id) =>
          typeof id === 'object' ? Number(id.id) : Number(id),
        )
        const excludedPersonas = (filterSettings.excluded_persona_ids ?? []).map((id) =>
          typeof id === 'object' ? Number(id.id) : Number(id),
        )

        if (allowedPersonas.length > 0 && !allowedPersonas.includes(Number(filters.currentPersonaId))) {
          excluded = true
          reason = 'filter_excluded'
        }

        if (excludedPersonas.includes(Number(filters.currentPersonaId))) {
          excluded = true
          reason = 'filter_excluded'
        }
      }

      if (excluded) {
        return { ...entry, wasIncluded: false, exclusionReason: reason }
      }

      return entry
    })
  }

  /**
   * Apply timed effects (sticky, cooldown, delay)
   */
  private applyTimedEffects(
    entries: ActivatedEntry[],
    conversationState: ConversationState,
  ): ActivatedEntry[] {
    const currentMessageIndex = conversationState.currentMessageIndex

    return entries.map((entry) => {
      const entryState = conversationState.entryStates.get(String(entry.entryId)) || {
        lastActivatedAt: undefined,
        stickyUntil: undefined,
        cooldownUntil: undefined,
        delayUntil: undefined,
      }

      const advancedSettings = entry.entry.advanced_activation

      // Check delay (entry shouldn't activate until message N)
      if (advancedSettings?.delay && advancedSettings.delay > 0) {
        if (currentMessageIndex < advancedSettings.delay) {
          return {
            ...entry,
            wasIncluded: false,
            exclusionReason: 'delay_not_met' as ExclusionReason,
          }
        }
      }

      // Check cooldown (entry is on cooldown)
      if (entryState.cooldownUntil && currentMessageIndex < entryState.cooldownUntil) {
        return {
          ...entry,
          wasIncluded: false,
          exclusionReason: 'cooldown_active' as ExclusionReason,
        }
      }

      // Check sticky (entry should remain active even if not matched)
      if (entryState.stickyUntil && currentMessageIndex <= entryState.stickyUntil) {
        return { ...entry, wasIncluded: true }
      }

      return entry
    })
  }

  /**
   * Apply probability checks
   */
  private applyProbability(entries: ActivatedEntry[]): ActivatedEntry[] {
    return entries.map((entry) => {
      const probabilitySettings = entry.entry.activation_settings

      if (
        probabilitySettings?.use_probability &&
        probabilitySettings.probability !== undefined &&
        probabilitySettings.probability < 100
      ) {
        const roll = Math.random() * 100
        if (roll > probabilitySettings.probability) {
          return {
            ...entry,
            wasIncluded: false,
            exclusionReason: 'probability_failed' as ExclusionReason,
          }
        }
      }

      return entry
    })
  }

  /**
   * Apply group scoring (only highest score in each group)
   */
  private applyGroupScoring(entries: ActivatedEntry[]): ActivatedEntry[] {
    // Group entries by group name
    const groups = new Map<string, ActivatedEntry[]>()

    for (const entry of entries) {
      if (entry.groupName && entry.entry.group_settings?.use_group_scoring) {
        if (!groups.has(entry.groupName)) {
          groups.set(entry.groupName, [])
        }
        groups.get(entry.groupName)!.push(entry)
      }
    }

    // For each group, keep only the highest scoring entry
    const excludedEntries = new Set<string>()

    for (const [groupName, groupEntries] of groups) {
      if (groupEntries.length <= 1) continue

      // Sort by score (weighted)
      groupEntries.sort(
        (a, b) => b.activationScore * b.groupWeight - a.activationScore * a.groupWeight,
      )

      // Mark all except the highest as excluded
      for (let i = 1; i < groupEntries.length; i++) {
        excludedEntries.add(String(groupEntries[i].entryId))
      }
    }

    // Apply exclusions
    return entries.map((entry) => {
      if (excludedEntries.has(String(entry.entryId))) {
        return {
          ...entry,
          wasIncluded: false,
          exclusionReason: 'group_scoring_lost' as ExclusionReason,
        }
      }
      return entry
    })
  }

  /**
   * Apply token budget
   */
  private applyBudget(entries: ActivatedEntry[], budgetConfig: BudgetConfig): ActivatedEntry[] {
    // Calculate available budget
    const totalBudget = Math.min(
      budgetConfig.maxContextTokens * (budgetConfig.budgetPercentage / 100),
      budgetConfig.budgetCapTokens,
    )

    // Separate entries that ignore budget
    const ignoreBudgetEntries = entries.filter((e) => e.ignoreBudget && e.wasIncluded)
    const budgetedEntries = entries.filter((e) => !e.ignoreBudget && e.wasIncluded)

    // Sort budgeted entries by score (highest first)
    budgetedEntries.sort((a, b) => b.activationScore - a.activationScore)

    // Track budget usage
    let usedBudget = 0
    let includedCount = 0

    // Apply budget
    const processedEntries = budgetedEntries.map((entry) => {
      if (usedBudget + entry.tokenCost <= totalBudget || includedCount < budgetConfig.minActivations) {
        usedBudget += entry.tokenCost
        includedCount++
        return entry
      } else {
        return {
          ...entry,
          wasIncluded: false,
          exclusionReason: 'budget_exceeded' as ExclusionReason,
        }
      }
    })

    // Combine with ignore-budget entries
    return [...ignoreBudgetEntries, ...processedEntries]
  }

  /**
   * Calculate available budget
   */
  private calculateBudget(config: BudgetConfig): number {
    const percentageBudget = config.maxContextTokens * (config.budgetPercentage / 100)
    const cappedBudget = Math.min(percentageBudget, config.budgetCapTokens)
    const availableBudget = Math.max(0, cappedBudget - config.reservedForConversation)
    return Math.floor(availableBudget)
  }

  /**
   * Get or create conversation state
   */
  private getConversationState(conversationId: string, messageIndex: number): ConversationState {
    let state = this.conversationStates.get(conversationId)

    if (!state) {
      state = {
        conversationId,
        currentMessageIndex: messageIndex,
        entryStates: new Map(),
      }
      this.conversationStates.set(conversationId, state)
    } else {
      state.currentMessageIndex = messageIndex
    }

    return state
  }

  /**
   * Update conversation state after activation
   */
  private updateConversationState(state: ConversationState, entries: ActivatedEntry[]): void {
    const currentIndex = state.currentMessageIndex

    for (const entry of entries) {
      if (!entry.wasIncluded) continue

      const advancedSettings = entry.entry.advanced_activation
      const entryKey = String(entry.entryId)
      const entryState: EntryState = state.entryStates.get(entryKey) || {
        lastActivatedAt: undefined,
        stickyUntil: undefined,
        cooldownUntil: undefined,
        delayUntil: undefined,
      }

      // Update last activation
      entryState.lastActivatedAt = currentIndex

      // Set sticky
      if (advancedSettings?.sticky && advancedSettings.sticky > 0) {
        entryState.stickyUntil = currentIndex + advancedSettings.sticky
      }

      // Set cooldown
      if (advancedSettings?.cooldown && advancedSettings.cooldown > 0) {
        entryState.cooldownUntil = currentIndex + advancedSettings.cooldown
      }

      state.entryStates.set(entryKey, entryState)
    }
  }

  /**
   * Log activations to database
   */
  private async logActivations(
    payload: Payload,
    conversationId: string,
    messageIndex: number,
    entries: ActivatedEntry[],
  ): Promise<void> {
    const logs = entries.map((entry) => ({
      conversation_id: parseInt(conversationId),
      message_index: messageIndex,
      knowledge_entry_id: typeof entry.entryId === 'number' ? entry.entryId : parseInt(entry.entryId),
      activation_method: entry.activationMethod,
      activation_score: entry.activationScore,
      matched_keywords: entry.matchedKeywords?.map((k) => ({ keyword: k })) || [],
      vector_similarity: entry.vectorSimilarity,
      position_inserted: `${entry.position}:${entry.depth}`,
      tokens_used: entry.tokenCost,
      was_included: entry.wasIncluded,
      exclusion_reason: entry.exclusionReason,
      activation_timestamp: new Date().toISOString(),
    }))

    // Batch insert logs
    for (const log of logs) {
      try {
        await payload.create({
          collection: 'knowledgeActivationLog',
          data: log,
        })
      } catch (error) {
        console.error('Failed to log activation:', error)
      }
    }
  }
}

/**
 * Factory function to create activation engine
 */
export function createActivationEngine(): ActivationEngine {
  return new ActivationEngine()
}

/**
 * Convenience function for one-off activation
 */
export async function activateKnowledge(
  context: ActivationContext,
): Promise<ActivationResult> {
  const engine = new ActivationEngine()
  return await engine.activate(context)
}
