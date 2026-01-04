# Collections Implementation Plan - Phases 3 & 4

## Current Status
- ✅ **Phase 1 & 2**: Complete (18 existing collections)
- ✅ **Phase 3**: Complete (29 total collections including BotInteraction)
- 📋 **Phase 4**: Pending

## Task Checklist

### Phase 3: Mental Health & Wellbeing System
- [x] **SelfModeration.ts** - Usage limits and health tools (collection created, TypeScript fix needed)
- [ ] **CrisisSupport.ts** - Mental health resources collection
- [ ] **Update Mood.ts** - Verify existing Mood collection meets requirements

### Phase 4: Analytics & Insights System
- [ ] **UsageAnalytics.ts** - Comprehensive usage tracking collection
- [ ] **MemoryInsights.ts** - Story progression analytics collection
- [ ] **PersonaAnalytics.ts** - Persona effectiveness metrics collection

### Integration & Testing
- [ ] **Update payload.config.ts** - Add all new collections to main config
- [ ] **Fix TypeScript errors** - Resolve SelfModeration collection issues
- [ ] **Build verification** - Ensure clean TypeScript compilation
- [ ] **Database migration** - Run migration for new collections

### Final Steps
- [ ] **Update todo.md** - Mark completed phases
- [ ] **Test collections** - Verify functionality in admin panel
- [ ] **Documentation** - Update any relevant documentation

## Implementation Notes
- Follow existing collection patterns from src/collections/
- Maintain consistent access control patterns
- Ensure proper relationship mappings
- Include comprehensive field definitions with validation
- Use appropriate admin configurations for usability

---

## Database Schema - Core Collections

### BotInteraction Collection (NEW - Phase 3)
**Purpose**: Track user interactions (likes, favorites) with bots

**Fields**:
- `user` (relationship → users) - User who interacted, indexed
- `bot` (relationship → bot) - Bot being interacted with, indexed
- `liked` (checkbox) - Whether user liked the bot (default: false)
- `favorited` (checkbox) - Whether user favorited the bot (default: false)
- `created_date` (date) - When interaction was created
- `updated_date` (date) - Auto-updated on changes

**Access Control**: Open (read/create/update/delete: true)

**Usage**:
- Fetched in bot detail pages to show user's interaction status
- Created/updated via `/api/bots/[id]/like` and `/api/bots/[id]/favorite` endpoints
- Used to calculate bot statistics (likes_count, favorites_count)

**API Endpoints**:
- `GET /api/bots/[id]/status` - Get user's interaction status with a bot
- `POST /api/bots/[id]/like` - Toggle like status
- `POST /api/bots/[id]/favorite` - Toggle favorite status

### Bot Collection (Updated)
**New Fields Added**:
- `likes_count` (number) - Total likes received (updated on interaction toggle)
- `favorites_count` (number) - Total favorites received (updated on interaction toggle)

**Related Collections**:
- BotInteraction (many-to-many through user interactions)
- Users (one-to-many creator relationship)

### Complete Collection List (29 Total)

**Phase 1 & 2 - Core Platform (18 collections)**:
1. Users - User accounts and authentication
2. Media - File uploads and storage
3. Bot - AI bot configurations
4. ApiKey - User API key management
5. Mood - User mood tracking
6. Knowledge - Individual knowledge entries
7. KnowledgeCollections - Organized knowledge groups
8. Conversation - Chat conversations
9. Message - Individual chat messages
10. Memory - Conversation memories
11. TokenGifts - Token gifting system
12. SubscriptionPayments - Payment records
13. SubscriptionTiers - Subscription plans
14. TokenPackages - Token purchase options
15. Personas - User personas
16. CreatorProfiles - Bot creator profiles
17. CreatorPrograms - Creator program management
18. AccessControl - Permission management

**Phase 3 - Bot Detail & User Interactions (1 new collection)**:
19. **BotInteraction** - User likes/favorites for bots ✅

**Existing Phase 3+ Collections (10 collections)**:
20. SelfModeration - Usage limits and health tools
21. CrisisSupport - Mental health resources
22. UsageAnalytics - Usage tracking
23. MemoryInsights - Story progression analytics
24. PersonaAnalytics - Persona effectiveness metrics
25. LegalDocuments - Legal documentation
26. UserAgreements - User agreement records
27. Documentation - Platform documentation
28. Tutorials - User tutorials
29. SupportTickets - Support system

---

## API Endpoints - Phase 3 Additions

### Bot Management
- `GET /api/bots/my-bots` - Fetch current user's bots ✅
- `DELETE /api/bots/[id]` - Delete a bot (owner only) ✅
- `GET /api/bots/[slug]` - Get bot by slug (existing)

### Bot Interactions
- `GET /api/bots/[id]/status` - Get user's interaction status ✅
- `POST /api/bots/[id]/like` - Toggle like status ✅
- `POST /api/bots/[id]/favorite` - Toggle favorite status ✅

### Implementation Details
All interaction endpoints:
- Require Clerk authentication
- Verify user exists in Payload database
- Create interaction record if it doesn't exist
- Toggle boolean values on subsequent calls
- Update bot's aggregate counts (likes_count, favorites_count)
- Return updated state to client

---

## Phase 4: RAG System Collections

### VectorRecord Collection (NEW - Phase 4A)
**Purpose**: Track vector embeddings in Cloudflare Vectorize for D1 coordination

**Fields**:
- `vector_id` (text) - Unique ID in Vectorize database, indexed
- `source_type` (select) - Type of source: 'knowledge' | 'memory'
- `source_id` (text) - ID of source document in D1, indexed
- `user_id` (relationship → users) - Owner, indexed
- `tenant_id` (text) - Multi-tenant isolation, indexed
- `chunk_index` (number) - Position in document (0-based)
- `total_chunks` (number) - Total chunks in document
- `chunk_text` (textarea) - Original text of this chunk
- `metadata` (json) - Full metadata object for Vectorize
- `embedding_model` (text) - Model used (default: 'text-embedding-3-small')
- `embedding_dimensions` (number) - Vector dimensions (default: 1536)
- `created_at` (date) - When vector was created
- `updated_at` (date) - Auto-updated on changes

**Access Control**: Authenticated users only (users can only access their own records)

**Indexes**:
- `vector_id` (unique)
- `user_id` + `source_type` + `source_id` (composite)
- `tenant_id`

**Usage**:
- Created when knowledge or memory is vectorized
- Links D1 records to Vectorize database
- Enables cleanup when source is deleted
- Tracks chunking metadata for re-vectorization

### Knowledge Collection (UPDATED - Phase 4A)
**New Fields Added**:
- `type` (select) - Content type: 'text' | 'file' | 'url' | 'legacy_memory'
- `is_legacy_memory` (checkbox) - Whether this is a converted memory
- `source_memory_id` (relationship → memory) - Link to original Memory
- `source_conversation_id` (relationship → conversation) - Link to original Conversation
- `original_participants` (json) - { personas: string[], bots: string[] }
- `memory_date_range` (json) - { start: timestamp, end: timestamp }
- `applies_to_bots` (relationship → bot, hasMany) - Bots this knowledge applies to
- `applies_to_personas` (relationship → personas, hasMany) - Personas for legacy memories
- `is_vectorized` (checkbox) - Whether content has been vectorized
- `vector_ids` (relationship → vectorRecord, hasMany) - Links to vector chunks
- `chunk_count` (number) - Number of chunks created
- `r2_file_key` (text) - R2 object storage key for uploaded files

**Purpose**: Enhanced to support legacy memory conversion and vectorization tracking

### Conversation Collection (UPDATED - Phase 4B)
**New Fields Added**:
- `participants` (json) - Track all participants in conversation:
  ```json
  {
    "personas": ["persona_id_1", "persona_id_2"],
    "bots": ["bot_id_1"],
    "primary_persona": "persona_id_1",
    "persona_changes": [
      {
        "persona_id": "persona_id_2",
        "switched_at": "2024-01-15T14:30:00Z",
        "message_index": 42
      }
    ]
  }
  ```
- `total_tokens` (number) - Running token count for conversation
- `last_summarized_at` (date) - When conversation was last summarized
- `last_summarized_message_index` (number) - Last message included in summary
- `requires_summarization` (checkbox) - Flag when token threshold reached

**Purpose**: Enhanced to track participants and support memory generation

### Memory Collection (UPDATED - Phase 4B)
**New Fields Added**:
- `type` (select) - Memory type: 'short_term' | 'long_term' | 'consolidated'
- `participants` (json) - { personas: string[], bots: string[] }
- `is_vectorized` (checkbox) - Whether memory has been vectorized
- `vector_ids` (relationship → vectorRecord, hasMany) - Links to vector chunks
- `converted_to_lore` (checkbox) - Whether saved as legacy lore
- `lore_entry_id` (relationship → knowledge) - Link to created lore entry
- `converted_at` (date) - When converted to lore
- `importance` (number) - Significance rating 1-10
- `emotional_context` (textarea) - Mood/emotion tags

**Purpose**: Enhanced to support vectorization and legacy lore conversion

### KnowledgeCollections Collection (EXISTING)
**No changes needed** - Already supports organizing knowledge entries

**Related Collections**:
- Knowledge (many-to-many)
- Users (owner relationship)

---

## RAG System API Endpoints

### Vector Management
- `POST /api/vectors/generate` - Generate embeddings for knowledge/memory
  - Input: source_type, source_id, content
  - Process: Chunk content → OpenAI embeddings → Vectorize storage
  - Output: VectorRecord IDs, chunk_count

- `POST /api/vectors/search` - Semantic search across vectors
  - Input: query, filters (type, user_id, applies_to_bots, etc.)
  - Process: Generate query embedding → Vectorize search → metadata filtering
  - Output: Ranked results with source content

- `DELETE /api/vectors/[sourceId]` - Delete vectors for a source
  - Input: source_type, source_id
  - Process: Find VectorRecords → Delete from Vectorize → Delete D1 records
  - Output: Deletion confirmation

### Legacy Memory Conversion
- `POST /api/memories/[id]/convert-to-lore` - Convert memory to legacy lore
  - Input: memory_id, title, tags, applies_to (bots, personas)
  - Process:
    1. Fetch memory and conversation details
    2. Extract participant information
    3. Create Knowledge entry (type: 'legacy_memory')
    4. Copy/enhance content
    5. Generate vectors with extended metadata
    6. Update original memory record
  - Output: New knowledge entry ID, vector status

- `GET /api/memories/[id]/convertibility` - Check if memory can be converted
  - Input: memory_id
  - Process: Verify memory exists, not already converted, has content
  - Output: { can_convert: boolean, reason?: string }

### Knowledge Management
- `POST /api/knowledge/create` - Create knowledge entry
  - Support for text, file upload (R2), URL scraping
  - Triggers automatic vectorization

- `PUT /api/knowledge/[id]` - Update knowledge entry
  - Re-vectorize if content changed
  - Update metadata in existing vectors

- `DELETE /api/knowledge/[id]` - Delete knowledge entry
  - Cascade delete vectors
  - Remove from collections

### Bot Knowledge Retrieval
- `POST /api/chat/context` - Get relevant knowledge for bot response
  - Input: conversation_id, bot_id, user_message
  - Process:
    1. Generate query embedding
    2. Search with filters (bot_id, user_id, type: 'lore' | 'legacy_memory')
    3. Retrieve top-k chunks
    4. Format for context injection
  - Output: Ranked knowledge chunks with sources

---

## Implementation Workflow

### Phase 4A: Lore System (Current Priority)
1. Create VectorRecord collection
2. Update Knowledge collection with new fields
3. Implement vector generation API
4. Build Lore UI (/lore/entries, /lore/collections)
5. Test end-to-end: upload → chunk → vectorize → search

### Phase 4B: Memory Vectorization
1. Update Memory collection with new fields
2. Implement auto-summarization triggers
3. Add memory vectorization pipeline
4. Build conversation context retrieval

### Phase 4C: Legacy Memory System
1. Implement conversion UI in /memories
2. Build conversion API endpoint
3. Add participant tracking to conversations
4. Test dual-application (user + bot contexts)

### Phase 4D: Integration & Polish
1. Bot chat integration (context injection)
2. Performance optimization (caching, batching)
3. Privacy controls (public/private knowledge)
4. Analytics (usage tracking, effectiveness metrics)
