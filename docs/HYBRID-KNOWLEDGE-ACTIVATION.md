# Hybrid Knowledge Activation System - Design Document

**Version:** 3.1
**Last Updated:** 2026-01-10
**Status:** Phase 3 Complete, Phase 4 Pending

## Implementation Progress

### ✅ Phase 1: Schema & Database (COMPLETE)
- ✅ Knowledge collection enhanced with 37 new fields across 6 groups
- ✅ KnowledgeActivationLog collection created
- ✅ TypeScript types generated
- ✅ All documentation updated
- ✅ Production build passing
- ✅ Default values added to API routes

### ✅ Phase 2: Activation Engine (COMPLETE)
- ✅ **types.ts** (234 lines) - Complete type system with all interfaces, enums, and error classes
- ✅ **keyword-matcher.ts** (247 lines) - Full keyword matching implementation with:
  - Primary/secondary keyword extraction
  - Selective logic (AND_ANY, AND_ALL, NOT_ALL, NOT_ANY)
  - Case sensitivity, whole word matching, regex support
  - Lexical message content extraction
- ✅ **vector-retriever.ts** (163 lines) - Vector search implementation with:
  - BGE-M3 embedding generation via Workers AI
  - Vectorize index querying with filters
  - Similarity threshold filtering
- ✅ **activation-engine.ts** (695 lines) - Main orchestrator with:
  - Combined keyword + vector + constant activation
  - Bot/persona filtering
  - Timed effects (sticky, cooldown, delay)
  - Probability checks
  - Group scoring
  - Token budget management
  - Activation logging to database
- ✅ **prompt-builder.ts** (347 lines) - Positioning system with:
  - 7 position types (system_top, before_character, after_character, etc.)
  - Smart insertion at correct prompt locations
  - at_depth message array modification
  - Debug info generation
- ✅ **budget-manager.ts** (342 lines) - Token budget management with:
  - Budget calculation with caps
  - Priority-based allocation
  - Value-to-cost optimization
  - Usage statistics
- ✅ **index.ts** (52 lines) - Public API exports

**Total: 2,080+ lines of activation engine code**

### ✅ Phase 3: UI Updates (COMPLETE)
- ✅ **tag-input.tsx** - Reusable tag input component with visual chips
- ✅ **activation-settings.tsx** - Complete accordion-based settings panel with:
  - Activation mode selector (keyword/vector/hybrid/constant/disabled)
  - Keyword configuration (primary/secondary keys, logic, options)
  - Vector settings (similarity threshold, max results)
  - Positioning controls (7 positions, depth, role, order)
  - Advanced activation (sticky, cooldown, delay)
  - Budget controls (ignore budget, max tokens)
  - Group settings (group name, scoring, weight)
- ✅ **lore-entries-view.tsx** - Full integration with:
  - Collapsible activation settings panel
  - State management for all 6 settings sections
  - Form submission includes all activation settings
  - Form reset restores default values
- ✅ **/api/knowledge/route.ts** - Updated to accept all activation settings
  - Converts string arrays to Payload's keyword format
  - Converts ID arrays to Payload's bot_id/persona_id format
  - Falls back to sensible defaults for all fields
- ✅ **/api/memories/convert-to-lore/route.ts** - Updated with all activation defaults
- ⏳ Browse view activation indicators (future enhancement)

### ⏳ Phase 4: Chat Integration (PENDING)
- Chat API endpoint integration
- Real-time activation during conversations
- Activation logging and analytics

---

## Executive Summary

This document outlines the design and implementation plan for BotCafé v2's hybrid knowledge activation system, which combines:
1. **Keyword-based activation** (inspired by SillyTavern's World Info) for deterministic, rule-based control
2. **Vector-based retrieval** (existing RAG system) for semantic, intelligent matching

This hybrid approach provides users with both precise control and intelligent discovery of relevant knowledge.

---

## System Architecture

### Two-Stage Activation Process

```
┌─────────────────────────────────────────────────────────────┐
│                    Chat Message Received                     │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
         ┌────────────────────────────────────┐
         │  STAGE 1: Keyword Activation       │
         │  - Scan recent messages            │
         │  - Match primary/secondary keys    │
         │  - Apply selective logic           │
         │  - Apply filters (bot, persona)    │
         │  - Return matched entries          │
         └────────────┬───────────────────────┘
                      │
                      ▼
         ┌────────────────────────────────────┐
         │  STAGE 2: Vector Retrieval         │
         │  - Embed current message           │
         │  - Search vectorized entries       │
         │  - Filter by relevance score       │
         │  - Return semantic matches         │
         └────────────┬───────────────────────┘
                      │
                      ▼
         ┌────────────────────────────────────┐
         │  MERGE & PRIORITIZE                │
         │  - Combine keyword + vector results│
         │  - Remove duplicates               │
         │  - Sort by priority/order          │
         │  - Apply token budget              │
         └────────────┬───────────────────────┘
                      │
                      ▼
         ┌────────────────────────────────────┐
         │  INSERT INTO PROMPT                │
         │  - Group by position               │
         │  - Insert at specified positions   │
         │  - Respect depth settings          │
         │  - Format for LLM consumption      │
         └────────────────────────────────────┘
```

---

## Data Model Updates

### Knowledge Collection Schema Additions

```typescript
// Add to existing Knowledge collection
{
  // ... existing fields ...

  // ACTIVATION SETTINGS GROUP
  activation_settings: {
    // Activation Mode
    activation_mode: 'keyword' | 'vector' | 'hybrid' | 'constant' | 'disabled',

    // Keyword Activation
    primary_keys: string[],           // Primary activation keywords
    secondary_keys: string[],         // Secondary keywords (lower weight)
    keywords_logic: 'AND_ANY' | 'AND_ALL' | 'NOT_ANY' | 'NOT_ALL',
    case_sensitive: boolean,
    match_whole_words: boolean,
    use_regex: boolean,

    // Vector Activation (thresholds)
    vector_similarity_threshold: number,  // 0.0-1.0, default: 0.7
    max_vector_results: number,           // Max results from vector search

    // Activation Control
    probability: number,              // 0-100, chance to activate
    use_probability: boolean,

    // Scan Settings
    scan_depth: number,              // How many messages back to scan (default: 2)
    match_in_user_messages: boolean,
    match_in_bot_messages: boolean,
    match_in_system_prompts: boolean,
  },

  // POSITIONING SETTINGS GROUP
  positioning: {
    position: 'before_character' | 'after_character' | 'before_examples' |
              'after_examples' | 'at_depth' | 'system_top' | 'system_bottom',
    depth: number,                   // For 'at_depth' position (0-100)
    role: 'system' | 'user' | 'assistant',  // For 'at_depth' position
    order: number,                   // Priority/weight (0-1000, default: 100)
  },

  // ADVANCED ACTIVATION GROUP
  advanced_activation: {
    // Timed Effects
    sticky: number,                  // Stay active for N messages after trigger
    cooldown: number,                // Cooldown for N messages after deactivation
    delay: number,                   // Only activate after message N in conversation

    // State Tracking (populated at runtime)
    last_activated_at?: number,      // Message index
    cooldown_until?: number,         // Message index
    sticky_until?: number,           // Message index
  },

  // FILTERING GROUP
  filtering: {
    // Bot/Character Filtering
    filter_by_bots: boolean,
    allowed_bot_ids: number[],
    excluded_bot_ids: number[],

    // Persona Filtering
    filter_by_personas: boolean,
    allowed_persona_ids: number[],
    excluded_persona_ids: number[],

    // Context Matching
    match_bot_description: boolean,
    match_bot_personality: boolean,
    match_persona_description: boolean,
  },

  // BUDGET CONTROL GROUP
  budget_control: {
    ignore_budget: boolean,          // Skip this entry if budget exhausted
    token_cost: number,              // Calculated token count of content
    max_tokens: number,              // Max tokens this entry can use
  },

  // GROUPING (for scoring)
  group_settings: {
    group_name: string,              // Group identifier
    use_group_scoring: boolean,      // Only highest score in group activates
    group_weight: number,            // Weight multiplier for this entry
  },
}
```

### New Collection: KnowledgeActivationLog

Track activation history for analytics and debugging:

```typescript
{
  id: string,
  conversation_id: relationship,   // Which conversation
  message_index: number,           // Which message in conversation
  knowledge_entry_id: relationship,
  activation_method: 'keyword' | 'vector' | 'constant',
  activation_score: number,        // Keyword score or vector similarity
  matched_keywords: string[],      // Keywords that triggered (if keyword)
  vector_similarity: number,       // Similarity score (if vector)
  position_inserted: string,       // Where it was inserted
  tokens_used: number,
  was_included: boolean,           // False if budget was exceeded
  activation_timestamp: date,
}
```

---

## Implementation Strategy

### Phase 1: Schema Updates (Week 1)

1. **Update Knowledge Collection**
   - Add all activation_settings fields
   - Add positioning fields
   - Add advanced_activation fields
   - Add filtering fields
   - Add budget_control fields
   - Add group_settings fields

2. **Create KnowledgeActivationLog Collection**
   - Set up relationships
   - Add indexes for performance

3. **Create Migration Scripts**
   - Default values for existing entries
   - Set all existing entries to `activation_mode: 'vector'` (maintain current behavior)

### Phase 2: Keyword Activation Engine (Week 2)

Create `/src/lib/knowledge-activation/` module:

#### File: `keyword-matcher.ts`
```typescript
// Keyword matching logic
export class KeywordMatcher {
  matchEntry(
    entry: Knowledge,
    messages: Message[],
    scanDepth: number
  ): {
    matched: boolean,
    score: number,
    matchedKeywords: string[]
  }

  private scanMessage(message: string, keywords: string[], options: KeywordOptions): string[]
  private applySelectiveLogic(primaryMatches: string[], secondaryMatches: string[], logic: SelectiveLogic): boolean
  private calculateScore(primaryMatches: string[], secondaryMatches: string[]): number
}
```

#### File: `vector-retriever.ts`
```typescript
// Vector-based retrieval
export class VectorRetriever {
  async retrieveRelevant(
    message: string,
    threshold: number,
    maxResults: number,
    filters: VectorFilters
  ): Promise<{
    entry: Knowledge,
    similarity: number,
    chunk: VectorRecord
  }[]>
}
```

#### File: `activation-engine.ts`
```typescript
// Main orchestration
export class KnowledgeActivationEngine {
  async activate(
    conversationId: string,
    messages: Message[],
    currentBotId: number,
    currentPersonaId?: number
  ): Promise<ActivatedEntry[]>

  private async keywordActivation(entries: Knowledge[], messages: Message[]): Promise<ActivatedEntry[]>
  private async vectorActivation(messages: Message[], filters: any): Promise<ActivatedEntry[]>
  private mergeAndPrioritize(keywordResults: ActivatedEntry[], vectorResults: ActivatedEntry[]): ActivatedEntry[]
  private applyTokenBudget(entries: ActivatedEntry[], budget: number): ActivatedEntry[]
  private applyTimedEffects(entries: ActivatedEntry[], conversationState: any): ActivatedEntry[]
  private groupScoring(entries: ActivatedEntry[]): ActivatedEntry[]
}
```

#### File: `prompt-builder.ts`
```typescript
// Insert entries into prompt
export class PromptBuilder {
  buildPrompt(
    basePrompt: string,
    activatedEntries: ActivatedEntry[],
    bot: Bot,
    persona?: Persona
  ): string

  private groupByPosition(entries: ActivatedEntry[]): Map<Position, ActivatedEntry[]>
  private insertAtPosition(prompt: string, entries: ActivatedEntry[], position: Position): string
  private formatEntry(entry: Knowledge): string
}
```

### Phase 3: UI Updates (Week 3)

Update lore entry creation/editing UI with new fields:

#### New Accordion Sections in Entry Form

1. **Activation Settings** (expanded by default)
   - Activation Mode dropdown
   - If keyword/hybrid:
     - Primary Keywords (tag input)
     - Secondary Keywords (tag input)
     - Logic selector (AND_ANY, AND_ALL, NOT_ANY, NOT_ALL)
     - Case sensitive toggle
     - Match whole words toggle
     - Regex toggle
   - If vector/hybrid:
     - Similarity threshold slider (0.0-1.0)
     - Max results slider (1-10)
   - Probability slider (0-100%)
   - Scan depth slider (1-10 messages)

2. **Positioning** (collapsed by default)
   - Position dropdown (visual diagram showing positions)
   - Depth slider (if at_depth selected)
   - Role selector (if at_depth selected)
   - Order/Priority slider (0-1000)

3. **Advanced Activation** (collapsed by default)
   - Sticky messages slider (0-20)
   - Cooldown messages slider (0-20)
   - Delay messages slider (0-100)
   - Info tooltips explaining each

4. **Filtering** (collapsed by default)
   - Bot filtering toggle
   - Bot selector (multi-select, shows user's bots)
   - Persona filtering toggle
   - Persona selector (multi-select)
   - Context matching checkboxes

5. **Budget Control** (collapsed by default)
   - Ignore budget toggle
   - Token cost display (auto-calculated)
   - Max tokens slider

6. **Grouping** (collapsed by default)
   - Group name input
   - Use group scoring toggle
   - Group weight slider

#### Entry List View Enhancements

Add columns/badges showing:
- Activation mode icon (🔑 keyword, 🎯 vector, 🔀 hybrid, ⭐ constant)
- Position badge
- Order number
- Trigger percentage (based on activation log)
- Group name badge
- Active filters count

### Phase 4: Chat Integration (Week 4)

#### Create API Endpoint: `/api/chat/knowledge/activate`

```typescript
POST /api/chat/knowledge/activate
Body: {
  conversation_id: string,
  message_history: Message[],
  bot_id: number,
  persona_id?: number,
  budget_tokens: number,
  budget_percentage: number
}

Response: {
  activated_entries: {
    entry: Knowledge,
    activation_method: 'keyword' | 'vector' | 'constant',
    score: number,
    matched_keywords?: string[],
    similarity?: number,
    position: string,
    tokens: number
  }[],
  total_tokens: number,
  budget_remaining: number,
  entries_excluded_by_budget: number
}
```

#### Update Chat Message Handler

Integrate activation before LLM call:

```typescript
// In chat message processing
const activatedKnowledge = await activationEngine.activate(
  conversationId,
  recentMessages,
  bot.id,
  persona?.id
);

const enhancedPrompt = promptBuilder.buildPrompt(
  basePrompt,
  activatedKnowledge,
  bot,
  persona
);

// Send enhancedPrompt to LLM
```

### Phase 5: Analytics & Monitoring (Week 5)

1. **Activation Dashboard**
   - Show which entries activate most frequently
   - Trigger percentage per entry
   - Average score per entry
   - Budget usage statistics

2. **Debug Panel** (for users)
   - Show which entries activated for last message
   - Show why entries activated (keywords matched, similarity score)
   - Show budget breakdown
   - Show entries excluded (and why)

3. **Performance Monitoring**
   - Track activation engine latency
   - Monitor vector search performance
   - Alert on budget overruns

---

## Token Budget System

### Budget Calculation

```typescript
interface BudgetConfig {
  max_context_tokens: number,      // Model's max context (e.g., 8000)
  budget_percentage: number,       // % of context for knowledge (e.g., 20%)
  budget_cap_tokens: number,       // Absolute cap (e.g., 2000)
  reserved_for_conversation: number, // Min tokens for chat history
  min_activations: number,         // Keep searching until N entries activate
}

// Calculate budget
const availableBudget = Math.min(
  max_context_tokens * (budget_percentage / 100),
  budget_cap_tokens
);

const actualBudget = max_context_tokens - reserved_for_conversation;
const knowledgeBudget = Math.min(availableBudget, actualBudget);
```

### Budget Application Algorithm

```typescript
function applyTokenBudget(
  entries: ActivatedEntry[],
  budget: number,
  minActivations: number
): ActivatedEntry[] {
  // Sort by priority (order field, then score)
  const sorted = entries.sort((a, b) => {
    if (a.order !== b.order) return b.order - a.order;
    return b.score - a.score;
  });

  const included: ActivatedEntry[] = [];
  let tokensUsed = 0;

  for (const entry of sorted) {
    const cost = entry.budget_control.token_cost;

    // Always include entries that ignore budget
    if (entry.budget_control.ignore_budget) {
      included.push(entry);
      tokensUsed += cost;
      continue;
    }

    // Include if within budget OR haven't reached min activations
    if (tokensUsed + cost <= budget || included.length < minActivations) {
      included.push(entry);
      tokensUsed += cost;
    } else {
      // Budget exhausted
      entry.excluded_reason = 'budget_exceeded';
    }
  }

  return included;
}
```

---

## Example Use Cases

### Use Case 1: Character-Specific Lore (Keyword)

**Entry**: "Elvara's Background"
```
Activation Mode: Keyword
Primary Keys: ["Elvara", "elf queen", "her majesty"]
Secondary Keys: ["throne", "kingdom", "elven"]
Logic: AND_ANY (any primary key matches)
Position: After Character
Order: 100

Content: "Elvara is the Elf Queen of Silverwood..."
```

**Behavior**: Activates whenever "Elvara" or "elf queen" is mentioned in recent messages.

### Use Case 2: Location Lore (Hybrid)

**Entry**: "Darkwood Forest"
```
Activation Mode: Hybrid
Primary Keys: ["darkwood", "dark forest"]
Vector Threshold: 0.75
Position: Before Character
Order: 80

Content: "The Darkwood Forest is an ancient woodland filled with..."
```

**Behavior**:
- Activates if "darkwood" or "dark forest" mentioned (keyword)
- OR if message is semantically similar (e.g., "the spooky woods") (vector)

### Use Case 3: Universal Lore (Constant)

**Entry**: "Magic System Rules"
```
Activation Mode: Constant
Position: System Top
Order: 1000
Ignore Budget: true

Content: "In this world, magic requires mana. All spells consume mana..."
```

**Behavior**: Always included in every prompt, inserted at the top of system messages.

### Use Case 4: Context-Aware Memory (Vector Only)

**Entry**: "Previous Conversation About Dragons"
```
Activation Mode: Vector
Vector Threshold: 0.8
Max Results: 3
Position: Before Examples
Order: 50

Content: "In our previous conversation, you mentioned that dragons..."
```

**Behavior**: Only activates when current message is semantically similar to dragon-related topics.

### Use Case 5: Timed Lore (Keyword with Sticky)

**Entry**: "Combat Rules"
```
Activation Mode: Keyword
Primary Keys: ["attack", "fight", "combat", "battle"]
Sticky: 5 (stay active for 5 messages)
Position: System Bottom
Order: 90

Content: "Combat in this world uses turn-based mechanics..."
```

**Behavior**: Activates when combat mentioned, then stays active for 5 more messages (even if combat isn't mentioned).

---

## Migration Plan

### For Existing Users

1. **Default Settings**
   - All existing entries: `activation_mode: 'vector'` (maintains current behavior)
   - Default vector threshold: 0.7
   - Default position: 'before_character'
   - Default order: 100

2. **Gradual Opt-In**
   - Show banner in lore UI: "New! Keyword activation now available"
   - Tutorial wizard for new activation features
   - Preset templates for common use cases

3. **Backward Compatibility**
   - Vector-only mode works exactly as before
   - No breaking changes to existing functionality
   - New fields optional

---

## Performance Considerations

### Optimization Strategies

1. **Caching**
   - Cache keyword-to-entry mappings
   - Cache compiled regex patterns
   - Cache vector embeddings for recent messages

2. **Indexing**
   - Database indexes on `activation_mode`, `position`, `order`
   - Full-text search index on keywords
   - Vector index optimization (already exists)

3. **Lazy Loading**
   - Only load entries relevant to current bot/persona
   - Paginate entry lists in UI
   - Stream large knowledge content

4. **Batch Processing**
   - Batch vector searches
   - Batch keyword matching
   - Parallel processing where possible

### Latency Goals

- Keyword activation: < 50ms
- Vector retrieval: < 200ms
- Total activation time: < 300ms
- Budget below context limit: Always

---

## Testing Strategy

### Unit Tests

1. **Keyword Matcher**
   - Test all logic types (AND_ANY, AND_ALL, NOT_ANY, NOT_ALL)
   - Test regex patterns
   - Test case sensitivity
   - Test whole word matching

2. **Budget System**
   - Test budget allocation
   - Test min activations
   - Test ignore budget flag

3. **Positioning**
   - Test all position types
   - Test depth insertion
   - Test ordering

### Integration Tests

1. **Full Activation Pipeline**
   - Test keyword + vector merge
   - Test duplicate removal
   - Test priority sorting

2. **Chat Integration**
   - Test activation during conversation
   - Test timed effects (sticky, cooldown, delay)
   - Test state tracking

### User Acceptance Testing

1. **Common Workflows**
   - Create keyword-based entry
   - Create hybrid entry
   - Test activation in chat
   - Verify budget limiting

2. **Edge Cases**
   - Empty keywords
   - Very large entries
   - Budget exhaustion
   - Conflicting filters

---

## Documentation Requirements

### User-Facing Docs

1. **Quick Start Guide**
   - "What is knowledge activation?"
   - "Keyword vs Vector vs Hybrid"
   - Common use cases with examples

2. **Field Reference**
   - Every field explained with examples
   - Visual diagrams for positions
   - Logic type truth tables

3. **Best Practices**
   - When to use keyword vs vector
   - How to set priorities
   - Budget management tips
   - Performance tips

### Developer Docs

1. **Architecture Overview**
   - System diagram
   - Data flow
   - API contracts

2. **API Reference**
   - All endpoints documented
   - Request/response schemas
   - Error codes

3. **Extension Guide**
   - How to add new position types
   - How to add new logic types
   - How to add new activation methods

---

## Success Metrics

### Quantitative

- **Activation accuracy**: >95% of intended triggers
- **False positives**: <5% unwanted activations
- **Latency**: <300ms average activation time
- **Budget efficiency**: >90% of budget utilized effectively

### Qualitative

- User satisfaction with control
- Reduction in "irrelevant lore" complaints
- Increase in "helpful context" feedback
- Adoption rate of hybrid mode

---

## Future Enhancements (Post-V1)

1. **AI-Suggested Keywords**
   - Analyze entry content to suggest keywords
   - ML-based keyword extraction

2. **Activation Analytics**
   - Heatmaps showing which entries activate together
   - Recommendations for optimization

3. **Collaborative Features**
   - Share activation presets
   - Community templates

4. **Advanced Logic**
   - Custom logic expressions
   - Temporal logic (time-of-day, date-based)
   - Stateful logic (track variables across conversation)

5. **Multi-Language Support**
   - Keyword matching in multiple languages
   - Cross-language vector search

---

## Timeline Summary

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Phase 1: Schema** | Week 1 | Updated Knowledge collection, new ActivationLog collection, migrations |
| **Phase 2: Engine** | Week 2 | Keyword matcher, vector retriever, activation engine, prompt builder |
| **Phase 3: UI** | Week 3 | Updated entry forms, list views, activation mode selectors |
| **Phase 4: Integration** | Week 4 | Chat integration, API endpoints, state management |
| **Phase 5: Analytics** | Week 5 | Dashboard, debug panel, monitoring |

**Total: 5 weeks**

---

## Appendix: Field Defaults

```typescript
const DEFAULT_ACTIVATION_SETTINGS = {
  activation_mode: 'vector',
  primary_keys: [],
  secondary_keys: [],
  keywords_logic: 'AND_ANY',
  case_sensitive: false,
  match_whole_words: false,
  use_regex: false,
  vector_similarity_threshold: 0.7,
  max_vector_results: 5,
  probability: 100,
  use_probability: false,
  scan_depth: 2,
  match_in_user_messages: true,
  match_in_bot_messages: true,
  match_in_system_prompts: false,
};

const DEFAULT_POSITIONING = {
  position: 'before_character',
  depth: 0,
  role: 'system',
  order: 100,
};

const DEFAULT_ADVANCED_ACTIVATION = {
  sticky: 0,
  cooldown: 0,
  delay: 0,
};

const DEFAULT_FILTERING = {
  filter_by_bots: false,
  allowed_bot_ids: [],
  excluded_bot_ids: [],
  filter_by_personas: false,
  allowed_persona_ids: [],
  excluded_persona_ids: [],
  match_bot_description: false,
  match_bot_personality: false,
  match_persona_description: false,
};

const DEFAULT_BUDGET_CONTROL = {
  ignore_budget: false,
  token_cost: 0, // calculated
  max_tokens: 1000,
};

const DEFAULT_GROUP_SETTINGS = {
  group_name: '',
  use_group_scoring: false,
  group_weight: 1.0,
};
```

---

**Document Version**: 1.0
**Last Updated**: 2026-01-09
**Author**: BotCafé Development Team
**Status**: Design Phase - Pending Implementation
