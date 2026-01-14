/**
 * Hybrid Knowledge Activation System - Type Definitions
 *
 * Defines types for the keyword + vector activation engine
 */

import type { Knowledge, Bot, Persona, Message, Conversation } from '@/payload-types'

// ============================================================================
// ACTIVATION MODES
// ============================================================================

export type ActivationMode = 'keyword' | 'vector' | 'hybrid' | 'constant' | 'disabled'

export type KeywordsLogic = 'AND_ANY' | 'AND_ALL' | 'NOT_ALL' | 'NOT_ANY'

export type Position =
  | 'before_character'
  | 'after_character'
  | 'before_examples'
  | 'after_examples'
  | 'at_depth'
  | 'system_top'
  | 'system_bottom'

export type MessageRole = 'system' | 'user' | 'assistant'

export type ActivationMethod = 'keyword' | 'vector' | 'constant' | 'manual'

export type ExclusionReason =
  | 'budget_exceeded'
  | 'cooldown_active'
  | 'delay_not_met'
  | 'probability_failed'
  | 'filter_excluded'

// ============================================================================
// KEYWORD MATCHING
// ============================================================================

export interface KeywordMatchOptions {
  caseSensitive: boolean
  matchWholeWords: boolean
  useRegex: boolean
}

export interface KeywordMatchResult {
  matched: boolean
  score: number
  matchedKeywords: string[]
  primaryMatches: string[]
  secondaryMatches: string[]
}

// ============================================================================
// VECTOR RETRIEVAL
// ============================================================================

export interface VectorSearchOptions {
  similarityThreshold: number // 0.0-1.0
  maxResults: number
  filters: {
    botId?: number
    personaId?: number
    userId?: number
  }
}

export interface VectorSearchResult {
  entryId: string | number
  similarity: number
  chunkIndex: number
  chunkText: string
}

// ============================================================================
// ACTIVATION ENGINE
// ============================================================================

export interface ActivationContext {
  conversationId: string
  userId: number
  currentMessageIndex: number
  messages: Message[]
  filters: FilterConfig
  budgetConfig: BudgetConfig
  env?: {
    VECTORIZE?: any
    AI?: any
  }
  payload?: any // Payload instance
}

export interface ActivatedEntry {
  // Core entry data
  entry: Knowledge
  entryId: string | number

  // Activation details
  activationMethod: ActivationMethod
  activationScore: number
  matchedKeywords?: string[]
  vectorSimilarity?: number

  // Positioning
  position: Position
  depth: number
  role: MessageRole
  order: number

  // Budget
  tokenCost: number
  ignoreBudget: boolean

  // State
  wasIncluded: boolean
  exclusionReason?: ExclusionReason
}

export interface ActivationResult {
  activatedEntries: ActivatedEntry[]
  totalTokens: number
  budgetRemaining: number
  entriesExcludedByBudget: number
  entriesExcludedByFilter: number
  entriesExcludedByProbability: number
  entriesExcludedByCooldown: number
  entriesExcludedByDelay: number
}

// ============================================================================
// BUDGET MANAGEMENT
// ============================================================================

export interface BudgetConfig {
  maxContextTokens: number // Model's max context (e.g., 8000)
  budgetPercentage: number // % of context for knowledge (e.g., 20%)
  budgetCapTokens: number // Absolute cap (e.g., 2000)
  reservedForConversation: number // Min tokens for chat history
  minActivations: number // Keep searching until N entries activate
}

export interface BudgetResult {
  includedEntries: ActivatedEntry[]
  excludedEntries: ActivatedEntry[]
  tokensUsed: number
  tokensRemaining: number
}

// ============================================================================
// TIMED EFFECTS STATE
// ============================================================================

export interface ConversationState {
  conversationId: string
  currentMessageIndex: number
  entryStates: Map<string, EntryState>
}

export interface EntryState {
  lastActivatedAt?: number // Message index
  stickyUntil?: number // Message index
  cooldownUntil?: number // Message index
  delayUntil?: number // Message index
}

// ============================================================================
// PROMPT BUILDING
// ============================================================================

export interface PromptSection {
  position: Position
  content: string
  order: number
  role?: MessageRole
  depth?: number
}

export interface BuiltPrompt {
  systemMessages: string[]
  insertedContent: Map<Position, string[]>
  totalTokens: number
}

// ============================================================================
// FILTERING
// ============================================================================

export interface FilterConfig {
  userId: number
  currentBotId?: number
  currentPersonaId?: number
  filterByBots?: boolean
  allowedBotIds?: number[]
  excludedBotIds?: number[]
  filterByPersonas?: boolean
  allowedPersonaIds?: number[]
  excludedPersonaIds?: number[]
  matchBotDescription?: boolean
  matchBotPersonality?: boolean
  matchPersonaDescription?: boolean
}

export interface FilterResult {
  passed: boolean
  reason?: string
}

// ============================================================================
// SCAN CONFIGURATION
// ============================================================================

export interface ScanConfig {
  scanDepth: number
  matchInUserMessages: boolean
  matchInBotMessages: boolean
  matchInSystemPrompts: boolean
}

// ============================================================================
// ACTIVATION LOG ENTRY
// ============================================================================

export interface ActivationLogData {
  conversationId: string
  messageIndex: number
  knowledgeEntryId: string
  activationMethod: ActivationMethod
  activationScore: number
  matchedKeywords?: string[]
  vectorSimilarity?: number
  positionInserted: string
  tokensUsed: number
  wasIncluded: boolean
  exclusionReason?: ExclusionReason
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class ActivationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any,
  ) {
    super(message)
    this.name = 'ActivationError'
  }
}

export class KeywordMatchError extends ActivationError {
  constructor(message: string, details?: any) {
    super(message, 'KEYWORD_MATCH_ERROR', details)
    this.name = 'KeywordMatchError'
  }
}

export class VectorSearchError extends ActivationError {
  constructor(message: string, details?: any) {
    super(message, 'VECTOR_SEARCH_ERROR', details)
    this.name = 'VectorSearchError'
  }
}

export class BudgetExceededError extends ActivationError {
  constructor(message: string, details?: any) {
    super(message, 'BUDGET_EXCEEDED', details)
    this.name = 'BudgetExceededError'
  }
}
