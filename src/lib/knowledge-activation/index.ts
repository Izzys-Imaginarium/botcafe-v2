/**
 * Knowledge Activation System - Public API
 *
 * Hybrid knowledge activation combining keyword-based and vector-based retrieval
 * for intelligent, deterministic control over knowledge injection into prompts.
 */

// Main Classes
export { ActivationEngine, createActivationEngine, activateKnowledge } from './activation-engine'
export { KeywordMatcher } from './keyword-matcher'
export { VectorRetriever, createVectorRetriever, searchVectors } from './vector-retriever'
export { PromptBuilder, createPromptBuilder, insertKnowledgeIntoPrompt } from './prompt-builder'
export {
  BudgetManager,
  createBudgetManager,
  checkBudgetFit,
  type BudgetStats,
} from './budget-manager'

// Types
export type {
  // Core Types
  ActivationMode,
  KeywordsLogic,
  Position,
  MessageRole,
  ActivationMethod,
  ExclusionReason,

  // Interfaces
  ActivatedEntry,
  BudgetConfig,
  ConversationState,
  EntryState,
  ScanConfig,
  KeywordMatchOptions,
  KeywordMatchResult,
  VectorSearchOptions,
  VectorSearchResult,
  ActivationContext,
  ActivationResult,
  FilterConfig,
} from './types'

// Error Classes
export {
  ActivationError,
  KeywordMatchError,
  VectorSearchError,
  BudgetExceededError,
} from './types'
