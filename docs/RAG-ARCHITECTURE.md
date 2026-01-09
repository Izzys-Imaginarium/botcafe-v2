# BotCafé RAG Architecture

## Overview

BotCafé uses a unified vector database architecture to power three interconnected knowledge systems:
1. **Lore** - User-curated knowledge collections
2. **Memories** - Auto-generated conversation summaries
3. **Personas** - User identity/character information

## Technology Stack

### Vector Database
- **Platform**: Cloudflare Vectorize
- **Embedding Model**: BGE-M3 (`@cf/baai/bge-m3`) via Cloudflare Workers AI
- **Dimensions**: 1024
- **Context Window**: 8192 tokens
- **Language Support**: 100+ languages (multilingual)
- **Distance Metric**: Cosine similarity
- **Architecture**: Single unified index with metadata filtering

### Storage Distribution

| Data Type | D1 (SQLite) | R2 (Object Storage) | Vectorize |
|-----------|-------------|---------------------|-----------|
| **Lore** | Metadata, relationships | Large documents, PDFs | Text chunks |
| **Memories** | Conversation refs, timestamps | Long conversation archives | Summary chunks |
| **Personas** | Core persona data | - | No vectorization* |

*Personas use direct injection into context windows, not semantic search

---

## Metadata Schema

### Core Metadata Structure

Every vector in the unified index includes metadata for filtering and context. The actual implementation in `src/lib/vectorization/embeddings.ts`:

```typescript
interface VectorMetadata {
  // System Classification
  type: 'lore' | 'memory' | 'legacy_memory' | 'document';

  // Ownership & Access
  user_id: number;                    // Owner user ID (numeric)
  tenant_id: number;                  // For multi-tenant isolation (same as user_id)

  // Content Identification
  source_type: 'knowledge' | 'memory'; // Source collection
  source_id: string;                   // ID of source document in D1
  chunk_index: number;                 // Position in document (0-based)
  total_chunks: number;                // Total chunks in document
  created_at: string;                  // ISO timestamp

  // Optional Filtering Fields
  applies_to_bots?: number[];          // Bot IDs this applies to
  applies_to_personas?: number[];      // Persona IDs this applies to
  tags?: string[];                     // User-defined tags
}
```

> **Note**: The `is_public` field was removed from vector metadata. Privacy is controlled at the Knowledge/Memory collection level, not the vector level. All queries filter by `user_id` or `tenant_id` for isolation.

### Legacy Memory Extended Fields

Legacy memories (saved conversation memories converted to lore) require additional metadata:

```typescript
interface LegacyMemoryMetadata extends VectorMetadata {
  type: 'legacy_memory';
  is_legacy_memory: true;

  // Original Context
  original_conversation_id: string;   // Source conversation
  original_memory_id: string;         // Source memory record

  // Participants Tracking
  participants: {
    personas: string[];               // Persona IDs in conversation
    bots: string[];                   // Bot IDs in conversation
    primary_persona?: string;         // User's active persona
    primary_bot?: string;             // Main bot in conversation
  };

  // Timeline
  conversation_date_range: {
    start: string;                    // ISO timestamp
    end: string;                      // ISO timestamp
  };
  memory_created_at: string;          // When memory was generated
  converted_to_lore_at: string;       // When saved as lore

  // Dual Application
  applies_to_personas: string[];      // Can inject into user contexts
  applies_to_bots: string[];          // Can inject into bot contexts

  // Legacy Memory Specific
  memory_type: 'short_term' | 'long_term' | 'consolidated';
  emotional_tags?: string[];          // Mood/emotion markers
  narrative_importance?: number;      // 1-10 significance rating
}
```

---

## Memory Lifecycle: Conversation → Summary → Lore

### Phase 1: Active Conversation
```
User + Persona(s) ←→ Bot(s)
         ↓
   Message Stream
         ↓
   Short-term Memory (in-conversation context)
```

**Storage**:
- Messages: D1 database (Message collection)
- Conversation metadata: D1 database (Conversation collection)
- Active context: Temporary (API state)

### Phase 2: Memory Generation
```
Conversation ends or reaches token threshold
         ↓
   AI Summarization
         ↓
   Memory Record Created
         ↓
   Vectorization (optional, for long-term)
```

**Storage**:
- Summary text: D1 database (Memory collection)
- Vector embeddings: Vectorize (for searchable memories)
- Metadata: Tracks conversation_id, participants, timestamp

**Memory Types**:
1. **Short-term Memory**: Recent messages, direct storage
2. **Long-term Memory**: Consolidated summaries, vectorized
3. **Consolidated Memory**: Multiple memories merged, re-summarized

### Phase 3: Legacy Lore Conversion
```
User selects memory from archive
         ↓
   "Save as Legacy Lore"
         ↓
   Create Lore Entry with Legacy Metadata
         ↓
   Re-vectorize with extended metadata
         ↓
   Dual-application capability enabled
```

**User Actions**:
1. Browse conversation history in `/memories` dashboard
2. Select meaningful memory (e.g., important story moment)
3. Click "Convert to Legacy Lore"
4. Review/edit before saving
5. Assign to personas and/or bots

**System Actions**:
1. Create new Knowledge entry (type: 'legacy_memory')
2. Copy memory text and metadata
3. Capture participant information
4. Generate new vector embeddings with extended metadata
5. Link to original conversation/memory (preserve history)
6. Make searchable for both user and bot contexts

**Result**: Memory becomes reusable lore that can be:
- Applied to the original participants (personas/bots)
- Applied to new personas/bots that continue the story
- Searched semantically across user's knowledge base

---

## Chunking Strategies

Different content types require different chunking approaches:

### Lore (Knowledge Entries)
- **Chunk Size**: Up to 8192 tokens (BGE-M3 max context)
- **Overlap**: Variable based on chunking strategy
- **Method**: Paragraph-based splitting with 8192 token limit
- **Rationale**: BGE-M3's large context window allows for bigger chunks with more context preservation

### Memories (Conversation Summaries)
- **Chunk Size**: 250-400 tokens
- **Overlap**: 25 tokens
- **Method**: Summary segments (temporal or thematic)
- **Rationale**: Summaries are condensed, need smaller chunks for precision

### Legacy Memories (Imported from External Platforms)
- **Chunk Size**: 400-600 tokens
- **Overlap**: 40 tokens
- **Method**: Hybrid (preserve narrative structure)
- **Rationale**: Balance between detailed recall and context breadth
- **Source**: Imported conversations from old BotCafe, Character.AI, or other platforms
- **Conversion**: Users can convert important legacy memories to permanent Knowledge entries

### Large Documents (PDFs, Text Files)
- **Chunk Size**: 750-1000 tokens
- **Overlap**: 75 tokens
- **Method**: Sliding window with section awareness
- **Rationale**: Preserve context for complex documents

---

## Retrieval Strategies

### Complete Context Building for Chat

When a user sends a message in a conversation, the system builds a comprehensive context window by combining multiple sources in a specific order:

```typescript
async function buildChatContext(params: {
  conversationId: string;
  userId: string;
  botId: string;
  personaId: string | null;
  userMessage: string;
  previousMessages: Message[];
}) {
  const context = {
    systemPrompt: '',
    personaContext: '',
    loreContext: '',
    memoryContext: '',
    conversationHistory: '',
  };

  // 1. SYSTEM PROMPT (Bot's base instructions)
  const bot = await getBot(params.botId);
  context.systemPrompt = bot.system_prompt;

  // 2. PERSONA CONTEXT (Direct injection - no vectorization)
  if (params.personaId) {
    const persona = await getPersona(params.personaId);
    context.personaContext = `
You are speaking with ${persona.name}.
Character Description: ${persona.description}
Personality Traits: ${persona.personality_traits}
Background: ${persona.background}
Current Mood: ${persona.current_mood || 'neutral'}
Speaking Style: ${persona.speaking_style}
`;
  }

  // 3. LORE CONTEXT (Vectorized knowledge retrieval)
  const loreResults = await vectorSearch(params.userMessage, {
    topK: 5,
    metadata: {
      type: 'lore',
      applies_to_bots: [params.botId],
      user_id: params.userId,
    },
  });

  context.loreContext = `
Relevant Knowledge:
${loreResults.map((r, i) => `
[Knowledge ${i + 1}] (Source: ${r.metadata.title})
${r.chunk_text}
`).join('\n')}
`;

  // 4. LEGACY MEMORY CONTEXT (Converted memories as lore)
  const legacyMemoryResults = await vectorSearch(params.userMessage, {
    topK: 3,
    metadata: {
      type: 'legacy_memory',
      user_id: params.userId,
      $or: [
        { applies_to_bots: [params.botId] },
        { applies_to_personas: [params.personaId] },
      ],
      // Filter by participants if persona is active
      ...(params.personaId && {
        'participants.personas': { $contains: params.personaId }
      }),
    },
  });

  context.loreContext += `
\nRelevant Past Adventures:
${legacyMemoryResults.map((r, i) => `
[Story Memory ${i + 1}] (From: ${r.metadata.conversation_date_range?.start})
Participants: ${r.metadata.participants?.personas?.join(', ')} with ${r.metadata.participants?.bots?.join(', ')}
${r.chunk_text}
`).join('\n')}
`;

  // 5. CONVERSATION MEMORY CONTEXT (Past summaries from this/related conversations)
  const conversationContext = await getConversationContext(params.conversationId);

  // Search for relevant memories from past conversations with this bot
  const memoryResults = await vectorSearch(
    conversationContext.recentSummary || params.userMessage,
    {
      topK: 3,
      metadata: {
        type: 'memory',
        user_id: params.userId,
        'participants.bots': { $contains: params.botId },
        // Optionally filter by persona participation
        ...(params.personaId && {
          'participants.personas': { $contains: params.personaId }
        }),
      },
    }
  );

  context.memoryContext = `
Relevant Past Conversation Context:
${memoryResults.map((r, i) => `
[Memory ${i + 1}] (Conversation from: ${r.metadata.created_at})
${r.chunk_text}
`).join('\n')}
`;

  // 6. CURRENT CONVERSATION HISTORY (Recent messages)
  context.conversationHistory = `
Recent Messages:
${params.previousMessages.slice(-10).map(m => `
${m.role === 'user' ? (params.personaId ? 'User (as ' + persona?.name + ')' : 'User') : bot.name}: ${m.content}
`).join('\n')}
`;

  // 7. ASSEMBLE FINAL CONTEXT
  const fullContext = `
${context.systemPrompt}

${context.personaContext}

${context.loreContext}

${context.memoryContext}

${context.conversationHistory}

User: ${params.userMessage}
`;

  return {
    fullContext,
    sources: {
      lore: loreResults,
      legacyMemories: legacyMemoryResults,
      memories: memoryResults,
    },
    tokenEstimate: estimateTokens(fullContext),
  };
}
```

### Context Injection Priority

The order matters for context window management:

1. **System Prompt** (Required, ~200-500 tokens)
   - Bot's core personality and instructions
   - Always included, non-negotiable

2. **Persona Context** (If active, ~300-800 tokens)
   - Direct injection from D1 database
   - No vectorization needed (small, always relevant)
   - Defines who the user is playing as

3. **Lore Knowledge** (~1,000-2,000 tokens)
   - Vectorized, semantically relevant to current message
   - User-curated knowledge assigned to this bot
   - TopK: 5 chunks

4. **Legacy Memories** (~600-1,200 tokens)
   - Vectorized, past story moments relevant to current context
   - Filtered by bot AND persona participation
   - TopK: 3 chunks

5. **Conversation Memories** (~500-1,000 tokens)
   - Vectorized summaries of past conversations
   - Filtered by bot (and optionally persona) participation
   - TopK: 3 chunks

6. **Recent Message History** (~1,000-3,000 tokens)
   - Last 10-20 messages from current conversation
   - Retrieved directly from D1 database
   - Provides immediate context

**Total Estimated Context**: ~4,000-8,000 tokens (leaves room for bot response)

### Persona-Aware Filtering

When a persona is active, all RAG queries include persona context:

```typescript
// Legacy memories: Must involve this persona in original conversation
{
  type: 'legacy_memory',
  'participants.personas': { $contains: personaId },
  applies_to_personas: [personaId],  // Or can be applied to this persona
}

// Regular memories: Prioritize memories where persona was present
{
  type: 'memory',
  'participants.personas': { $contains: personaId },
}

// Lore: Can be standard (bot-focused) or persona-specific legacy memories
{
  type: 'lore',
  applies_to_bots: [botId],
  // Legacy memories can also appear here if applies_to_personas includes current persona
}
```

### Token Budget Management

If context exceeds limits (e.g., 8,000 tokens), reduce in reverse priority:

```typescript
function optimizeContext(context: Context, maxTokens: number = 8000) {
  let currentTokens = estimateTokens(context.fullContext);

  if (currentTokens <= maxTokens) return context;

  // 1. Reduce recent message history (keep last 5 instead of 10)
  // 2. Reduce conversation memories (topK: 2 instead of 3)
  // 3. Reduce legacy memories (topK: 2 instead of 3)
  // 4. Reduce lore chunks (topK: 3 instead of 5)
  // 5. Keep persona context (critical for roleplay)
  // 6. Keep system prompt (non-negotiable)

  return optimizedContext;
}
```

### For Lore (Bot Context Injection)
```typescript
// Standard knowledge retrieval
const query = userMessage;
const filters = {
  type: 'lore',
  applies_to_bots: [botId],
  user_id: userId,  // Owner's knowledge only
};

const results = await vectorSearch(query, {
  topK: 5,
  metadata: filters,
});
```

### For Memories (Conversation Context)
```typescript
// Retrieve relevant past conversation context
const query = currentConversationSummary;
const filters = {
  type: 'memory',
  user_id: userId,
  'participants.bots': { $contains: botId },
  // Include persona filter if active
  ...(personaId && {
    'participants.personas': { $contains: personaId }
  }),
};

const results = await vectorSearch(query, {
  topK: 3,
  metadata: filters,
});
```

### For Legacy Memories (Dual Context)
```typescript
// Can retrieve for EITHER user or bot context
// Filtered by original participants
const filters = {
  type: 'legacy_memory',
  user_id: userId,
  $or: [
    { applies_to_personas: [personaId] },
    { applies_to_bots: [botId] },
  ],
  // CRITICAL: Also filter by original participants
  'participants.personas': { $contains: personaId },
  'participants.bots': { $contains: botId },
};

const results = await vectorSearch(query, {
  topK: 3,
  metadata: filters,
});
```

---

## Database Schema Updates

### Memory Collection (Existing - Extended)
```typescript
{
  id: string;
  conversation_id: string;           // Relationship to Conversation
  user_id: string;                   // Relationship to User
  type: 'short_term' | 'long_term' | 'consolidated';
  summary_text: text;                // The memory content
  importance: number;                // 1-10 significance
  emotional_context?: string;        // Mood/emotion tags

  // Participants tracking (NEW)
  participants: {
    personas: string[];              // Persona IDs present
    bots: string[];                  // Bot IDs present
  };

  // Vectorization status (NEW)
  is_vectorized: boolean;
  vector_ids?: string[];             // Vectorize record IDs

  // Legacy lore conversion (NEW)
  converted_to_lore: boolean;
  lore_entry_id?: string;            // Link to Knowledge entry
  converted_at?: timestamp;

  created_at: timestamp;
  updated_at: timestamp;
}
```

### Knowledge Collection (Existing - Extended)
```typescript
{
  id: string;
  user_id: string;                   // Relationship to User
  title: string;
  content: text;
  type: 'text' | 'file' | 'url' | 'legacy_memory';  // NEW type

  // Legacy memory fields (NEW)
  is_legacy_memory: boolean;
  source_memory_id?: string;         // Link to original Memory
  source_conversation_id?: string;   // Link to original Conversation

  original_participants?: {
    personas: string[];
    bots: string[];
  };

  memory_date_range?: {
    start: timestamp;
    end: timestamp;
  };

  // Application settings
  collections: string[];             // KnowledgeCollection IDs
  applies_to_bots: string[];        // Bot IDs
  applies_to_personas: string[];    // Persona IDs (for legacy memories)

  // Vectorization
  is_vectorized: boolean;
  vector_ids?: string[];
  chunk_count?: number;

  tags: string[];
  is_public: boolean;
  created_at: timestamp;
  updated_at: timestamp;
}
```

### Conversation Collection (Existing - Extended)
```typescript
{
  id: string;
  user_id: string;                   // Relationship to User
  bot_id: string;                    // Relationship to Bot
  title?: string;                    // Optional conversation title

  // Participant tracking (NEW)
  participants: {
    personas: string[];              // Persona IDs used in this conversation
    bots: string[];                  // Bot IDs involved (usually just one, but supports multi-bot)
    primary_persona?: string;        // The main/current persona
    persona_changes?: Array<{        // Track persona switches mid-conversation
      persona_id: string;
      switched_at: timestamp;
      message_index: number;
    }>;
  };

  // Conversation state
  message_count: number;
  total_tokens: number;              // Running token count
  last_message_at: timestamp;

  // Memory/summarization tracking (NEW)
  last_summarized_at?: timestamp;
  last_summarized_message_index?: number;
  requires_summarization: boolean;   // Flag when token threshold reached

  is_public: boolean;
  is_archived: boolean;
  created_at: timestamp;
  updated_at: timestamp;
}
```

### New Collection: VectorRecord
```typescript
{
  id: string;
  vector_id: string;                 // Vectorize database ID

  source_type: 'knowledge' | 'memory';
  source_id: string;                 // ID of source document

  user_id: string;                   // Owner
  tenant_id: string;                 // Multi-tenant isolation

  chunk_index: number;
  total_chunks: number;
  chunk_text: text;                  // Original text of chunk

  metadata: json;                    // Full metadata object

  embedding_model: string;           // 'text-embedding-3-small'
  embedding_dimensions: number;      // 1536

  created_at: timestamp;
  updated_at: timestamp;
}
```

---

## Workflow Examples

### Example 1: User Creates Lore Entry
```
1. User uploads PDF to /lore/entries/create
2. System extracts text, stores file in R2
3. Text is chunked (750 tokens, 75 overlap)
4. Each chunk sent to OpenAI for embedding
5. Vectors stored in Vectorize with metadata:
   - type: 'lore'
   - user_id: '...'
   - source_id: knowledge_entry_id
   - applies_to_bots: [selected_bot_ids]
   - collection_ids: [selected_collections]
6. VectorRecord entries created in D1 for tracking
7. Knowledge entry marked as vectorized
```

### Example 2: Bot Retrieves Knowledge During Chat
```
1. User sends message: "What do you know about dragons?"
2. Bot generates embedding for query
3. Vectorize searches with filters:
   - type: 'lore'
   - applies_to_bots: [current_bot_id]
   - user_id: [current_user_id]
4. Top 5 relevant chunks returned
5. Bot includes chunks in context window
6. Bot generates response with knowledge
```

### Example 3: User Converts Memory to Legacy Lore
```
1. User browses /memories/library
2. Filters by conversation with favorite bot
3. Finds memory: "The Dragon Battle of Thornwood"
4. Clicks "Save as Legacy Lore"
5. Review dialog shows:
   - Original participants: [Persona: "Adventurer"], [Bot: "DM"]
   - Date range: 2024-01-15 to 2024-01-20
   - Summary text (editable)
6. User adds tags: ["epic", "dragon", "combat"]
7. User assigns to:
   - Personas: ["Adventurer", "Warrior"] (can use in other campaigns)
   - Bots: ["DM", "CampaignBot"] (different DMs can reference)
8. System creates Knowledge entry (type: 'legacy_memory')
9. Vectorizes with extended metadata
10. Original Memory marked as converted_to_lore
11. Now searchable in both user and bot contexts
```

### Example 4: Memory Re-summarization
```
1. Conversation reaches 10,000 tokens
2. System triggers summarization:
   - Fetch last 5,000 tokens
   - Send to AI with summarization prompt
   - Generate 500-token summary
3. Create Memory record (type: 'long_term')
4. Capture participants from Conversation
5. Chunk summary (250-400 token chunks)
6. Vectorize chunks with metadata:
   - type: 'memory'
   - conversation_id: '...'
   - participants: { personas: [...], bots: [...] }
7. Mark conversation as summarized
8. Clear old messages from active context
9. Inject summary into ongoing conversation
```

### Example 5: Full Conversation with Persona Switching and RAG Context

**Scenario**: User starts conversation as "Warrior" persona, switches to "Mage" persona mid-conversation, then converts a memorable moment to legacy lore.

**Initial State**:
- User has 2 personas: "Warrior" and "Mage"
- Chatting with "DungeonMaster" bot
- User has uploaded lore: "Dragon Compendium" (applied to DungeonMaster bot)
- Previous conversation memory exists: "Battle of Ironforge" (Warrior + DungeonMaster)

**Message Flow**:

```
// Message 1: User starts as Warrior
User selects "Warrior" persona → Conversation.participants.primary_persona = "warrior_id"

buildChatContext({
  personaId: "warrior_id",
  userMessage: "I enter the ancient dungeon, sword drawn"
})

Context assembled:
1. System Prompt: [DungeonMaster's base instructions]
2. Persona Context: "You are speaking with Thorin the Brave. A seasoned warrior..."
3. Lore Context: [5 chunks from "Dragon Compendium" about dungeon creatures]
4. Legacy Memories: [None - no matching legacy lore yet]
5. Conversation Memories: [1 chunk from "Battle of Ironforge" - relevant combat tactics]
6. Recent History: [Empty - new conversation]

Bot responds with dungeon description, referencing lore and past battle experience.

// Messages 2-20: Conversation continues as Warrior
// Token count: ~6,000
// System tracks participants: { personas: ["warrior_id"], bots: ["dm_id"] }

// Message 21: User switches persona
User clicks "Switch Persona" → selects "Mage"

Conversation updated:
{
  participants: {
    personas: ["warrior_id", "mage_id"],  // Both tracked
    primary_persona: "mage_id",           // Current active
    persona_changes: [{
      persona_id: "mage_id",
      switched_at: "2024-01-15T14:30:00Z",
      message_index: 21
    }]
  }
}

buildChatContext({
  personaId: "mage_id",
  userMessage: "I step back and begin casting a fireball spell"
})

Context assembled:
1. System Prompt: [DungeonMaster's base instructions]
2. Persona Context: "You are speaking with Elara the Wise. A powerful mage..." // CHANGED
3. Lore Context: [5 chunks from "Dragon Compendium" about magic and spells]
4. Legacy Memories: [None yet]
5. Conversation Memories: [Still includes "Battle of Ironforge" but less relevant]
6. Recent History: [Last 10 messages from THIS conversation, showing Warrior → Mage transition]

Bot responds acknowledging the persona switch: "The warrior's companion steps forward..."

// Messages 22-50: Epic battle ensues
// Token count: ~15,000
// System triggers summarization

Summarization triggered:
1. Fetch messages 1-30 (first 10,000 tokens)
2. AI generates summary: "Thorin the Warrior explored the dungeon... Elara the Mage joined and defeated the dragon..."
3. Create Memory record:
   {
     type: 'long_term',
     summary_text: "...",
     participants: {
       personas: ["warrior_id", "mage_id"],  // Both captured
       bots: ["dm_id"]
     },
     importance: 8,  // Epic battle
     emotional_context: "triumph, excitement, teamwork"
   }
4. Vectorize summary (2 chunks)
5. Update Conversation:
   {
     last_summarized_at: now,
     last_summarized_message_index: 30,
     requires_summarization: false
   }

// Messages 51-60: Conversation winds down
// User wants to save this as legacy lore

User navigates to /memories/library
Filters by: conversation_id = current conversation
Sees Memory: "The Dragon's Fall" (auto-generated title)

User clicks "Convert to Legacy Lore"

Conversion UI shows:
- Original Participants:
  * Personas: Thorin the Warrior, Elara the Mage
  * Bots: DungeonMaster
- Date Range: 2024-01-15 14:00 - 2024-01-15 16:30
- Summary Preview: [Editable text]
- Tags: [User adds: "epic", "dragon", "teamwork", "dungeon"]

User assigns to:
- Bots: [DungeonMaster, CampaignBot] (can be used in other campaigns)
- Personas: [Warrior, Mage, Rogue] (can reference in other adventures)

System creates Knowledge entry:
{
  type: 'legacy_memory',
  is_legacy_memory: true,
  title: "The Dragon's Fall: A Tale of Courage and Magic",
  content: [enhanced summary with narrative flair],
  source_memory_id: "memory_123",
  source_conversation_id: "conv_456",
  original_participants: {
    personas: ["warrior_id", "mage_id"],
    bots: ["dm_id"]
  },
  memory_date_range: {
    start: "2024-01-15T14:00:00Z",
    end: "2024-01-15T16:30:00Z"
  },
  applies_to_bots: ["dm_id", "campaign_bot_id"],
  applies_to_personas: ["warrior_id", "mage_id", "rogue_id"],
  tags: ["epic", "dragon", "teamwork", "dungeon"]
}

System vectorizes with extended metadata:
{
  type: 'legacy_memory',
  is_legacy_memory: true,
  original_conversation_id: "conv_456",
  participants: {
    personas: ["warrior_id", "mage_id"],
    bots: ["dm_id"],
    primary_persona: "mage_id",
    primary_bot: "dm_id"
  },
  conversation_date_range: { start: "...", end: "..." },
  memory_created_at: "2024-01-15T16:30:00Z",
  converted_to_lore_at: "2024-01-15T16:45:00Z",
  applies_to_personas: ["warrior_id", "mage_id", "rogue_id"],
  applies_to_bots: ["dm_id", "campaign_bot_id"],
  memory_type: 'long_term',
  emotional_tags: ["triumph", "excitement", "teamwork"],
  narrative_importance: 8
}

Original Memory updated:
{
  converted_to_lore: true,
  lore_entry_id: "knowledge_789",
  converted_at: "2024-01-15T16:45:00Z"
}

// Future Conversation: User starts new adventure with Rogue persona
User: [as Rogue] "I've heard tales of a great dragon battle..."

buildChatContext({
  personaId: "rogue_id",
  userMessage: "I've heard tales of a great dragon battle..."
})

Legacy Memory Search finds:
- "The Dragon's Fall" matches because:
  * applies_to_personas includes "rogue_id" ✓
  * User query semantically matches "dragon battle" ✓
  * applies_to_bots includes current bot ✓

Context includes:
3. Lore Context: [Regular lore chunks]
4. Legacy Memories:
   [Story Memory 1] (From: 2024-01-15)
   Participants: Thorin the Warrior, Elara the Mage with DungeonMaster

   "In the depths of the ancient dungeon, a warrior and mage joined forces
   to defeat a fearsome dragon. Through courage and magical prowess, they
   triumphed where others had failed..."

Bot responds: "Ah yes, you speak of Thorin and Elara's legendary quest!
As their companion, let me tell you what really happened that day..."

→ Narrative continuity preserved across personas and conversations!
```

**Key Takeaways**:
1. **Participants tracked throughout**: Conversation captures all personas/bots involved
2. **Persona-aware RAG**: Searches filter by persona participation
3. **Legacy memories bridge conversations**: Past adventures inform future chats
4. **Context adapts to persona**: Switching persona changes lore retrieval and tone
5. **Memory lifecycle complete**: Conversation → Summary → Legacy Lore → Future Context
```

---

## Implementation Priority

### Phase 4A: Lore System Foundation
1. Create Knowledge and KnowledgeCollections UI
2. Implement text entry and file upload
3. Build chunking pipeline
4. Integrate OpenAI embeddings
5. Set up Vectorize index and metadata schema
6. Implement basic semantic search

### Phase 4B: Memory System Integration
1. Auto-summarization triggers
2. Memory vectorization pipeline
3. Conversation context retrieval
4. Re-summarization logic for long conversations

### Phase 4C: Legacy Memory Conversion
1. Memory browsing and selection UI
2. "Save as Legacy Lore" workflow
3. Participant tracking and metadata
4. Dual-application assignment
5. Historical linking (memory ↔ lore)

### Phase 4D: Persona Integration
1. Persona direct injection (no vectorization)
2. Persona-aware context building
3. Legacy memory persona filtering

---

## Performance Considerations

### Embedding Generation
- **Platform**: Cloudflare Workers AI (native integration)
- **Model**: BGE-M3 (1024 dimensions, 8192 token context)
- **Rate Limits**: Cloudflare Workers AI limits (account-dependent)
- **Cost**: ~$0.001 per 1000 tokens (estimated, Workers AI pricing)
- **Batch Processing**: Queue large documents, process chunks in parallel
- **Caching**: Cache embeddings for unchanged content
- **Advantages**: No external API keys needed, fully integrated with Cloudflare ecosystem

### Vector Search
- **Latency**: Cloudflare Vectorize ~10-50ms per query
- **TopK**: Limit to 3-10 results to balance relevance and speed
- **Metadata Filtering**: Use indexed fields (user_id, type, applies_to_bots)
- **Query Optimization**: Pre-filter by user/tenant before semantic search

### Storage Costs
- **Vectorize**: Free tier (10M vectors), then usage-based
- **D1**: Free tier (5GB), minimal cost for metadata
- **R2**: Free tier (10GB), very low cost for documents
- **Strategy**: Keep vectors focused on searchable content, use D1/R2 for large static data

---

## Privacy & Security

### Multi-Tenant Isolation
```typescript
// ALWAYS include tenant/user filter
const results = await vectorSearch(query, {
  metadata: {
    tenant_id: currentTenantId,
    user_id: currentUserId,
    // ... other filters
  },
});
```

### Public vs Private Content
- Private knowledge: `user_id` filter enforced
- Public knowledge: Additional `is_public: true` filter
- Shared collections: Collection-level permissions checked

### Data Deletion
- User deletes knowledge → delete vectors from Vectorize
- User deletes account → delete all vectors with `user_id`
- Cascade deletes: Memory → Legacy Lore → Vectors

### Sensitive Content
- No PII in vector metadata (only IDs)
- Encrypted at rest (Cloudflare default)
- GDPR compliance: Full data export includes vectors

---

## Testing Strategy

### Unit Tests
- Chunking algorithms (boundary cases)
- Metadata schema validation
- Embedding generation mocking

### Integration Tests
- End-to-end lore creation → vectorization → search
- Memory summarization → vectorization
- Legacy memory conversion workflow

### Performance Tests
- Large document chunking (10,000+ tokens)
- Concurrent vectorization (100+ chunks)
- Search latency under load

### User Acceptance Tests
- Lore upload and retrieval accuracy
- Memory search relevance
- Legacy memory context preservation

---

## Future Enhancements

### Advanced Features (Post-MVP)
1. **Hybrid Search**: Combine vector search with keyword/filter search
2. **Re-ranking**: Secondary model to re-rank results by relevance
3. **Multi-modal**: Support images, audio in knowledge base
4. **Automatic Tagging**: AI-generated tags for uploaded content
5. **Knowledge Graphs**: Relationship mapping between lore entries
6. **Version Control**: Track changes to knowledge over time
7. **Collaborative Lore**: Shared knowledge bases with multiple contributors

### Optimization Opportunities
1. **Embedding Cache**: Pre-compute embeddings for common queries
2. **Smart Chunking**: ML-based chunk boundary detection
3. **Adaptive Retrieval**: Adjust topK based on query confidence
4. **Federated Search**: Search across public knowledge bases

---

## References

- [Cloudflare Vectorize Documentation](https://developers.cloudflare.com/vectorize/)
- [Cloudflare Workers AI Documentation](https://developers.cloudflare.com/workers-ai/)
- [BGE-M3 Model Documentation](https://developers.cloudflare.com/workers-ai/models/bge-m3/)
- [BGE-M3 on Hugging Face](https://huggingface.co/BAAI/bge-m3)
- [RAG Best Practices](https://www.pinecone.io/learn/retrieval-augmented-generation/)
- [Chunking Strategies for LLMs](https://www.llamaindex.ai/blog/evaluating-the-ideal-chunk-size-for-a-rag-system-using-llamaindex)
