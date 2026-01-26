# BotCafe v2 - Database Schema

**Last Updated**: 2026-01-25
**Version**: 3.12
**Database**: Cloudflare D1 (SQLite) via Payload CMS

---

## Overview

BotCafe v2 uses Payload CMS with 29 collections organized into functional groups:

| Category | Collections | Count |
|----------|-------------|-------|
| Core | Users, Media | 2 |
| Bot System | Bot, BotInteraction | 2 |
| Knowledge/RAG | Knowledge, KnowledgeCollections, KnowledgeActivationLog, VectorRecord | 4 |
| Conversation | Conversation, Message, Memory | 3 |
| User Features | Personas, ApiKey | 2 |
| Creators | CreatorProfiles, CreatorFollows | 2 |
| Monetization | TokenGifts, SubscriptionPayments, SubscriptionTiers, TokenPackages, AccessControl | 5 |
| Wellbeing | Mood, SelfModeration | 2 |
| Analytics | UsageAnalytics, MemoryInsights, PersonaAnalytics | 3 |
| Legal/Help | LegalDocuments, UserAgreements, Documentation, Tutorials | 4 |

---

## Core Collections

### Users

Primary user authentication collection (integrated with Clerk).

> **Important**: API endpoints look up users by `email` field, not `clerkUserId`. The Clerk user's primary email address is used for all user lookups via `clerkUser.emailAddresses[0]?.emailAddress`.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `email` | email | User email (required, unique) - **Primary lookup field** |
| `displayName` | text | Display name |
| `bio` | textarea | User biography |
| `avatar` | relationship (Media) | Profile image |
| `location` | text | User location |
| `role` | select | User role (admin, moderator, user) |
| `name` | text | Display name used when not using a persona |
| `nickname` | text | What bots should call you (e.g., "Alex", "Captain") |
| `pronouns` | select | Pronouns: he/him, she/her, they/them, other |
| `custom_pronouns` | text | Custom pronouns if "other" selected |
| `description` | textarea | Brief description about yourself for bots |
| `subscriptionTier` | relationship | Current subscription |
| `tokenBalance` | number | Current token balance |
| `preferences` | json | User preferences |
| `createdAt` | date | Auto-generated |
| `updatedAt` | date | Auto-generated |

> **Chat Preferences**: The `nickname`, `pronouns`, `custom_pronouns`, and `description` fields are used when chatting without a persona. These preferences help bots address the user properly and are managed via the Account Profile page.

### Media

File uploads and media management.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `alt` | text | Alt text for accessibility |
| `url` | text | Media URL (R2 storage) |
| `filename` | text | Original filename |
| `mimeType` | text | MIME type |
| `filesize` | number | File size in bytes |
| `width` | number | Image width (if applicable) |
| `height` | number | Image height (if applicable) |

---

## Bot System

### Bot

AI companion definitions.

> **URL Format**: Bot URLs use the pattern `/<username>/<bot-slug>` (similar to GitHub repos). The `slug` field is unique per creator, not globally unique.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `name` | text | Bot name (required) |
| `slug` | text | URL-friendly identifier (unique per creator) |
| `description` | textarea | Bot description |
| `picture` | relationship (Media) | Bot profile image |
| `gender` | select | Bot gender (male, female, non-binary, other) |
| `age` | number | Bot age (1-200) |
| `system_prompt` | textarea | System instructions (required) |
| `greeting` | textarea | Initial greeting message |
| `speech_examples` | array | Example speech patterns |
| `personality_traits` | group | Communication style settings (see below) |
| `behavior_settings` | group | Response behavior settings (see below) |
| `signature_phrases` | array | Catchphrases or expressions |
| `tags` | array | Category tags for discovery |
| `is_public` | checkbox | Public visibility (legacy - use `sharing_visibility`) |
| `sharing_visibility` | select | Visibility: **private**, **shared**, **public** (default: private) |
| `sharing` | group | Sharing settings (see below) |
| `likes_count` | number | Total likes |
| `favorites_count` | number | Total favorites |
| `user` | relationship (Users) | Owner reference (required) |
| `creator_profile` | relationship (CreatorProfiles) | Creator profile (**required**) |
| `creator_display_name` | text | Display name for creator (required) |
| `knowledge_collections` | relationship[] | Associated knowledge collections |
| `createdAt` | date | Auto-generated |
| `updatedAt` | date | Auto-generated |

#### Bot Personality Traits (group)

| Field | Type | Options |
|-------|------|---------|
| `tone` | select | friendly, professional, playful, mysterious, wise, humorous, empathetic, authoritative |
| `formality_level` | select | very-casual, casual, neutral, formal, very-formal |
| `humor_style` | select | none, light, moderate, dark, sarcastic |
| `communication_style` | select | direct, elaborate, concise, storytelling, questioning |

#### Bot Behavior Settings (group)

| Field | Type | Options |
|-------|------|---------|
| `response_length` | select | very-short, short, medium, long, very-long |
| `creativity_level` | select | conservative, moderate, creative, highly-creative |
| `knowledge_sharing` | select | very-limited, limited, balanced, generous, very-generous |

#### Bot Sharing Settings (group)

| Field | Type | Options/Description |
|-------|------|---------------------|
| `visibility` | select | **private** (owner only), **shared** (specific users via AccessControl), **public** (anyone can view) |

> **Note**: Bots CAN be made public from the UI. The `is_public` field is maintained for backwards compatibility and is synced with `sharing.visibility`.

### BotInteraction

User interactions with bots (likes, favorites).

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `user` | relationship (Users) | User who interacted |
| `bot` | relationship (Bot) | Bot interacted with |
| `liked` | checkbox | Whether user has liked the bot |
| `favorited` | checkbox | Whether user has favorited the bot |
| `created_date` | date | When interaction was created |
| `updated_date` | date | When interaction was last updated |

**Unique Constraint**: `user` + `bot` (one interaction record per user-bot pair)

---

## Knowledge/RAG System

### Knowledge

Individual knowledge entries for bot context and RAG with hybrid activation system.

**Core Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `user` | relationship (Users) | Owner (required) |
| `entry` | textarea | Knowledge content (required) |
| `type` | select | Type: text, document, url, image, audio, video, legacy_memory |
| `knowledge_collection` | relationship (KnowledgeCollections) | Parent collection (required) |
| `tags` | array | Array of `{ tag: string }` objects |
| `tokens` | number | Token count estimate |
| `is_vectorized` | checkbox | Vectorization status |
| `vector_records` | relationship[] (VectorRecords) | Links to vector chunks |
| `chunk_count` | number | Number of chunks created during vectorization |
| `r2_file_key` | text | R2 object storage key for uploaded files |
| `applies_to_bots` | relationship[] (Bot) | Bots this knowledge applies to |
| `applies_to_personas` | relationship[] (Personas) | Personas this applies to (legacy memories) |
| `is_legacy_memory` | checkbox | Whether this is a converted memory |
| `source_memory_id` | relationship (Memory) | Link to original Memory (legacy memories) |
| `source_conversation_id` | relationship (Conversation) | Link to original Conversation (legacy memories) |
| `original_participants` | json | `{ personas: string[], bots: string[] }` (legacy memories) |
| `memory_date_range` | json | `{ start: timestamp, end: timestamp }` (legacy memories) |
| `privacy_settings` | group | Privacy level, sharing, access count (see below) |
| `shared_access` | group | Shared users and permissions |
| `content_metadata` | group | Source URL, author, language, word count, etc. |
| `usage_analytics` | group | View count, search count, popularity score |
| `activation_settings` | group | **NEW:** Hybrid activation controls (see below) |
| `positioning` | group | **NEW:** Prompt insertion positioning (see below) |
| `advanced_activation` | group | **NEW:** Timed effects (sticky, cooldown, delay) |
| `filtering` | group | **NEW:** Bot/persona filtering controls |
| `budget_control` | group | **NEW:** Token budget management |
| `created_timestamp` | date | Creation timestamp |
| `modified_timestamp` | date | Modification timestamp |
| `createdAt` | date | Auto-generated |
| `updatedAt` | date | Auto-generated |

#### Knowledge Activation Settings (group) 🆕

Controls how knowledge entries are activated during conversations (hybrid keyword + vector system).

| Field | Type | Options/Description |
|-------|------|---------------------|
| `activation_mode` | select | **keyword** (keyword only), **vector** (semantic only), **hybrid** (keyword OR vector), **constant** (always active), **disabled** |
| `primary_keys` | array | Array of `{ keyword: string }` - primary activation keywords |
| `secondary_keys` | array | Array of `{ keyword: string }` - secondary keywords (lower weight) |
| `keywords_logic` | select | **AND_ANY** (any primary OR secondary), **AND_ALL** (all primary AND all secondary), **NOT_ALL**, **NOT_ANY** |
| `case_sensitive` | checkbox | Case-sensitive keyword matching |
| `match_whole_words` | checkbox | Match whole words only |
| `use_regex` | checkbox | Treat keywords as regex patterns |
| `vector_similarity_threshold` | number | Min similarity score (0.0-1.0, default: 0.7) |
| `max_vector_results` | number | Max vector search results (1-20, default: 5) |
| `probability` | number | Activation probability (0-100%, default: 100) |
| `use_probability` | checkbox | Enable probability-based activation |
| `scan_depth` | number | Messages to scan back (1-20, default: 2) |
| `match_in_user_messages` | checkbox | Scan user messages |
| `match_in_bot_messages` | checkbox | Scan bot messages |
| `match_in_system_prompts` | checkbox | Scan system prompts |

#### Knowledge Positioning (group) 🆕

Controls where activated entries are inserted in the final prompt.

| Field | Type | Options/Description |
|-------|------|---------------------|
| `position` | select | **before_character**, **after_character**, **before_examples**, **after_examples**, **at_depth**, **system_top**, **system_bottom** |
| `depth` | number | Depth in conversation (0-100, for at_depth position) |
| `role` | select | Message role: **system**, **user**, **assistant** (for at_depth) |
| `order` | number | Priority/weight (0-1000, default: 100, higher = inserted first) |

#### Knowledge Advanced Activation (group) 🆕

Timed effects for activation behavior across multiple messages.

| Field | Type | Options/Description |
|-------|------|---------------------|
| `sticky` | number | Stay active for N messages after activation (0-50) |
| `cooldown` | number | Cooldown for N messages after deactivation (0-50) |
| `delay` | number | Only activate after message N in conversation (0-100) |

#### Knowledge Filtering (group) 🆕

Control which bots/personas can trigger this entry.

| Field | Type | Options/Description |
|-------|------|---------------------|
| `filter_by_bots` | checkbox | Enable bot-specific filtering |
| `allowed_bot_ids` | array | Array of `{ bot_id: number }` - only these bots can activate |
| `excluded_bot_ids` | array | Array of `{ bot_id: number }` - never activate for these bots |
| `filter_by_personas` | checkbox | Enable persona-specific filtering |
| `allowed_persona_ids` | array | Array of `{ persona_id: number }` - only these personas |
| `excluded_persona_ids` | array | Array of `{ persona_id: number }` - exclude these personas |
| `match_bot_description` | checkbox | Match keywords in bot description |
| `match_bot_personality` | checkbox | Match keywords in bot personality traits |
| `match_persona_description` | checkbox | Match keywords in persona description |

#### Knowledge Budget Control (group) 🆕

Token budget management for context optimization.

| Field | Type | Options/Description |
|-------|------|---------------------|
| `ignore_budget` | checkbox | Always include even if budget exhausted |
| `token_cost` | number | Token count (auto-calculated, read-only) |
| `max_tokens` | number | Maximum tokens this entry can use (0-8000, default: 1000) |

#### Knowledge Privacy Settings (group)

| Field | Type | Options/Description |
|-------|------|---------------------|
| `privacy_level` | select | private, shared, public |
| `allow_sharing` | checkbox | Whether sharing is allowed |
| `share_expiration` | date | Expiration date for share |
| `password_protected` | checkbox | Require password |
| `share_password` | text | Share password |
| `access_count` | number | Times accessed |
| `last_accessed` | date | Last access time |

### KnowledgeCollections

Grouped knowledge for organization with sharing and collaboration features.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `name` | text | Collection name (required) |
| `user` | relationship (Users) | Owner (required) |
| `bot` | relationship[] (Bot) | Associated bots (many) |
| `description` | textarea | Collection description |
| `sharing_settings` | group | Sharing level, collaboration, expiration (see below) |
| `collaborators` | group | **Deprecated** - Use AccessControl collection for managing collaborators |
| `collection_metadata` | group | Size, category, tags, difficulty level (see below) |
| `usage_analytics` | group | View count, fork count, rating |
| `created_timestamp` | date | Creation timestamp |
| `modified_timestamp` | date | Modification timestamp |
| `createdAt` | date | Auto-generated |
| `updatedAt` | date | Auto-generated |

#### KnowledgeCollections Sharing Settings (group)

| Field | Type | Options/Description |
|-------|------|---------------------|
| `sharing_level` | select | private, shared, public |
| `allow_collaboration` | checkbox | Allow collaborators |
| `allow_fork` | checkbox | Allow forking |
| `sharing_expiration` | date | Expiration date |
| `share_password` | text | Password protection |
| `collaboration_requests` | checkbox | Accept collaboration requests |
| `knowledge_count` | number | Entry count in collection |
| `last_updated` | date | Last update time |
| `is_public` | checkbox | Public visibility |

> **Important**: Lore books (KnowledgeCollections) can only be made public from the Payload admin backend, NOT from the main UI. The API blocks attempts to set `sharing_level: 'public'` from frontend requests.

#### KnowledgeCollections Metadata (group)

| Field | Type | Options/Description |
|-------|------|---------------------|
| `collection_category` | select | Category: **general** (default), **memories**, **reference**, **worldbuilding** |
| `size_estimate` | number | Total size estimate in bytes |
| `tags` | array | Array of `{ tag: string }` for categorization |
| `difficulty_level` | select | Content difficulty: beginner, intermediate, advanced |

> **Memory Tomes vs Regular Tomes**: Collections with `collection_category: 'memories'` are "Memory Tomes" - auto-generated collections that store conversation memories. These are:
> - Hidden from the main Tomes/Lore section by default (use `includeMemoryTomes=true` query param to include)
> - Displayed in the Memories section instead
> - Automatically created and linked when conversations generate memories
> - Named after the conversation they're associated with (e.g., "Memories: Adventure with Aria")

### VectorRecord

Vector embedding tracking for D1/Vectorize coordination.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `vector_id` | text | Unique ID in Vectorize database (required, unique, indexed) |
| `source_type` | select | Source: knowledge, memory (required, indexed) |
| `source_id` | text | Reference to source document in D1 (required, indexed) |
| `user_id` | relationship (Users) | Owner (required, indexed) |
| `tenant_id` | text | Multi-tenant isolation ID (required, indexed) - **Must be string** |
| `chunk_index` | number | Position in document, 0-based (required) |
| `total_chunks` | number | Total chunks in document (required) |
| `chunk_text` | textarea | Original text of this chunk (required) |
| `metadata` | json | Full metadata object for Vectorize filtering (required) - **Stored as JSON string** |
| `embedding_model` | text | Embedding model used, e.g., "@cf/baai/bge-m3" (required) |
| `embedding_dimensions` | number | Vector dimensions, e.g., 1024 (required) |
| `embedding` | text | The actual vector values as JSON array (optional) - **For future-proofing metadata updates** |
| `createdAt` | date | Auto-generated |
| `updatedAt` | date | Auto-generated |

> **Important Implementation Notes:**
> - `tenant_id` must be a string (use `String(userId)` when creating records)
> - `metadata` must be stored as a JSON string (use `JSON.stringify(metadata)`) to avoid SQLite "too many SQL variables" errors
> - VectorRecords are queried by `source_id` rather than using hasMany relationships to avoid parameter overflow
> - The `embedding` field stores the actual vector values in D1, enabling future metadata-only updates without re-generating embeddings

### KnowledgeActivationLog 🆕

Tracks when and how knowledge entries are activated during conversations for analytics and debugging.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `conversation_id` | relationship (Conversation) | The conversation where activation occurred (required) |
| `message_index` | number | Message number in conversation, 0-based (required) |
| `knowledge_entry_id` | relationship (Knowledge) | The knowledge entry that was activated (required) |
| `activation_method` | select | How activated: **keyword**, **vector**, **constant**, **manual** (required) |
| `activation_score` | number | Score that triggered activation (keyword score or vector similarity) (required) |
| `matched_keywords` | array | Array of `{ keyword: string }` - keywords that matched (if keyword activation) |
| `vector_similarity` | number | Similarity score (if vector activation) |
| `position_inserted` | text | Where entry was inserted in prompt (required) |
| `tokens_used` | number | Tokens consumed by this entry (required) |
| `was_included` | checkbox | Whether entry was actually included (false if budget exceeded) (required) |
| `exclusion_reason` | select | Why excluded: **budget_exceeded**, **cooldown_active**, **delay_not_met**, **probability_failed**, **filter_excluded** |
| `activation_timestamp` | date | When activation occurred (required, auto-generated) |
| `createdAt` | date | Auto-generated |
| `updatedAt` | date | Auto-generated |

**Indexes:**
- `conversation_id` + `message_index` (for retrieving activation history)
- `knowledge_entry_id` + `activation_timestamp` DESC (for per-entry analytics)
- `activation_method` (for filtering by method)

---

## Conversation System

### Conversation

Chat conversation records supporting single-bot and multi-bot conversations.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `title` | text | Custom conversation name (optional, user-editable) |
| `user` | relationship (Users) | Conversation owner (required) |
| `created_timestamp` | date | Creation timestamp |
| `modified_timestamp` | date | Last modification timestamp |
| `conversation_type` | select | Type: single-bot, multi-bot, group-chat |
| `bot_participation` | array | Bot participants (see below) |
| `participants` | json | Tracks all participants: `{ personas: string[], bots: string[], primary_persona?: string, persona_changes?: Array }` |
| `total_tokens` | number | Running token count for conversation |
| `last_summarized_at` | date | When conversation was last summarized |
| `last_summarized_message_index` | number | Last message included in summary |
| `requires_summarization` | checkbox | Flag when token threshold reached |
| `memory_tome` | relationship (KnowledgeCollections) | Knowledge collection (tome) where auto-generated memories from this conversation are stored |
| `conversation_metadata` | group | Metadata (see below) |
| `status` | select | Status: active, archived, muted, pinned |
| `conversation_settings` | group | Settings (see below) |
| `createdAt` | date | Auto-generated |
| `updatedAt` | date | Auto-generated |

#### Bot Participation (array)

Each bot in the conversation has an entry with:

| Field | Type | Description |
|-------|------|-------------|
| `bot_id` | relationship (Bot) | The bot (required) |
| `joined_at` | date | When bot joined the conversation |
| `role` | select | Role: primary, secondary, moderator |
| `is_active` | checkbox | Whether bot is currently active |

#### Conversation Metadata (group)

| Field | Type | Description |
|-------|------|-------------|
| `total_messages` | number | Total message count |
| `participant_count` | number | Number of participants |
| `last_activity` | date | Last activity timestamp |
| `conversation_summary` | textarea | AI-generated summary |
| `tags` | array | Array of `{ tag: string }` |

#### Conversation Settings (group)

| Field | Type | Description |
|-------|------|-------------|
| `allow_file_sharing` | checkbox | Allow file attachments |
| `message_retention_days` | number | Days to retain messages (default: 365) |
| `auto_save_conversations` | checkbox | Auto-save enabled |
| `api_key_id` | number | Selected API key ID (persisted between sessions) |
| `model` | text | Selected AI model (persisted between sessions) |
| `provider` | text | AI provider name (e.g., openai, anthropic) |

### Message

Individual chat messages with full attribution and tracking.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `user` | relationship (Users) | Message owner (required) |
| `created_timestamp` | date | Creation timestamp |
| `modified_timestamp` | date | Modification timestamp |
| `conversation` | relationship (Conversation) | Parent conversation (required) |
| `message_type` | select | Type: text, image, file, system, voice, code |
| `bot` | relationship (Bot) | Bot that sent this message (if AI-generated) |
| `entry` | textarea | Message text content (required) |
| `message_attribution` | group | Attribution details (see below) |
| `message_content` | group | Rich content (see below) |
| `message_thread` | group | Threading info (see below) |
| `token_tracking` | group | Token usage (see below) |
| `byo_key` | checkbox | Whether user's own API key was used |
| `message_status` | group | Delivery status (see below) |
| `metadata` | group | Processing metadata (see below) |
| `createdAt` | date | Auto-generated |
| `updatedAt` | date | Auto-generated |

#### Message Attribution (group)

| Field | Type | Description |
|-------|------|-------------|
| `source_bot_id` | relationship (Bot) | Bot that generated this message |
| `is_ai_generated` | checkbox | Whether message is AI-generated |
| `model_used` | text | LLM model used (e.g., "gpt-4", "claude-3") |
| `confidence_score` | number | AI confidence score (0-1) |

#### Message Content (group)

| Field | Type | Description |
|-------|------|-------------|
| `text_content` | richText | Rich text content |
| `media_attachments` | relationship[] (Media) | Attached media files |
| `code_snippets` | array | Code blocks: `{ language, code, filename }` |
| `reactions` | json | User reactions |

#### Message Thread (group)

| Field | Type | Description |
|-------|------|-------------|
| `reply_to_id` | relationship (Message) | Message being replied to |
| `thread_depth` | number | Depth in thread |
| `is_thread_parent` | checkbox | Whether this starts a thread |

#### Token Tracking (group)

| Field | Type | Description |
|-------|------|-------------|
| `input_tokens` | number | Input tokens used |
| `output_tokens` | number | Output tokens generated |
| `total_tokens` | number | Total tokens |
| `cost_estimate` | number | Estimated cost |

#### Message Status (group)

| Field | Type | Description |
|-------|------|-------------|
| `delivery_status` | select | Status: sent, delivered, read, failed |
| `edit_history` | array | Previous versions: `{ previous_content, edited_at, edit_reason }` |
| `is_edited` | checkbox | Whether message was edited |
| `edited_at` | date | When message was last edited |

#### Message Metadata (group)

| Field | Type | Description |
|-------|------|-------------|
| `processing_time_ms` | number | LLM processing time |
| `priority_level` | select | Priority: low, normal, high, urgent |
| `sensitivity_level` | select | Sensitivity: public, private, confidential |

### Memory

Conversation memory storage with full CRUD API support.

> **API Endpoints**: Memories support full CRUD operations via `/api/memories` (GET, POST) and `/api/memories/[id]` (GET, PATCH, DELETE). Users can create, view, edit, and delete memories from the Memory Library UI.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `user` | relationship (Users) | Memory owner (required) |
| `bot` | relationship (Bot) | Associated bot (required) |
| `conversation` | relationship (Conversation) | Source conversation |
| `entry` | textarea | Memory content text (required) |
| `type` | select | Type: short_term, long_term, consolidated (default: short_term) |
| `importance` | number | Importance score (1-10, default: 5) |
| `emotional_context` | textarea | Mood/emotion tags and context |
| `tokens` | number | Token count (default: 0) |
| `participants` | json | Bot/persona IDs involved: `{ personas: string[], bots: string[] }` |
| `is_vectorized` | checkbox | Vectorization status (default: false) |
| `vector_records` | relationship[] (VectorRecords) | Links to vector chunks in Vectorize |
| `converted_to_lore` | checkbox | Whether memory has been saved as lore (default: false) |
| `lore_entry` | relationship (Knowledge) | Link to created lore entry (if converted) |
| `converted_at` | date | When converted to lore |
| `created_timestamp` | date | Creation timestamp (auto-generated) |
| `modified_timestamp` | date | Modification timestamp (auto-generated) |
| `createdAt` | date | Auto-generated |
| `updatedAt` | date | Auto-generated |

> **Note**: The `type` field uses values `short_term`, `long_term`, and `consolidated` - not `episodic` or `semantic` as in some earlier designs.

---

## User Features

### Personas

User personas/masks for conversations. Personas are always private to the user.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `name` | text | Persona name (required) - what bots call you |
| `description` | textarea | Persona description (required) |
| `user` | relationship (Users) | Owner |
| `gender` | select | Gender: male, female, non-binary, unspecified, other |
| `age` | number | Age of the persona (optional) |
| `pronouns` | select | Pronouns: he-him, she-her, they-them, he-they, she-they, any, other |
| `custom_pronouns` | text | Custom pronouns if "other" is selected |
| `appearance` | group | Appearance settings (contains avatar) |
| `interaction_preferences` | group | Topics preferences (see below) |
| `is_default` | checkbox | Default persona flag |
| `usage_count` | number | Number of times this persona has been used |
| `custom_instructions` | textarea | Custom instructions for how bots should interact |
| `createdAt` | date | Auto-generated |
| `updatedAt` | date | Auto-generated |

#### Persona Interaction Preferences (group)

| Field | Type | Description |
|-------|------|-------------|
| `preferred_topics` | array | Topics the user enjoys discussing (each item has `topic` text field) |
| `avoid_topics` | array | Topics the user prefers to avoid (each item has `topic` text field) |

> **Note**: The `is_public` field was removed - personas are always private. Personality traits, behavior settings, tags, and signature phrases were moved to the Bot collection instead.

### ApiKey

Multi-provider API key management.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `user` | relationship (Users) | Owner |
| `provider` | select | Provider: openai, anthropic, google, deepseek, openrouter, electronhub, glm |
| `key_encrypted` | text | Encrypted API key |
| `is_active` | checkbox | Active status |
| `last_used` | date | Last usage |
| `usage_count` | number | Total uses |
| `createdAt` | date | Auto-generated |

---

## Creator System

### CreatorProfiles

Creator showcase and profile management. Each creator has a public page at `/<username>` displaying their bots, bio, and social links.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `user` | relationship (Users) | User account (required) |
| `username` | text | Unique URL-friendly username (required) |
| `display_name` | text | Public display name (required) |
| `bio` | textarea | Creator biography (required) |
| `profile_media` | group | Avatar and banner image |
| `social_links` | group | Website, GitHub, Twitter, LinkedIn, Discord, YouTube, other links |
| `creator_info` | group | Creator type, specialties, experience level, location, languages |
| `portfolio` | group | Featured bots, bot count, total conversations, average rating |
| `community_stats` | group | Follower count, following count, total likes |
| `verification_status` | select | Status: unverified, pending, verified, premium |
| `featured_creator` | checkbox | Featured on platform homepage |
| `profile_settings` | group | Visibility, collaborations, commissions settings |
| `tags` | array | Discovery tags |
| `last_active` | date | Last activity timestamp |
| `created_timestamp` | date | Creation timestamp |
| `modified_timestamp` | date | Modification timestamp |
| `createdAt` | date | Auto-generated |
| `updatedAt` | date | Auto-generated |

#### CreatorProfiles Social Links (group)

| Field | Type | Description |
|-------|------|-------------|
| `website` | text | Personal/professional website URL |
| `github` | text | GitHub profile URL |
| `twitter` | text | Twitter/X profile URL |
| `linkedin` | text | LinkedIn profile URL |
| `discord` | text | Discord username or server invite |
| `youtube` | text | YouTube channel URL |
| `other_links` | array | Additional links (platform + url pairs) |

#### CreatorProfiles Portfolio (group)

| Field | Type | Description |
|-------|------|-------------|
| `featured_bots` | relationship[] (Bot) | Bots to feature prominently |
| `bot_count` | number | Total bots created (read-only) |
| `total_conversations` | number | Total conversations across all bots (read-only) |
| `average_rating` | number | Average rating of creator's bots |

### CreatorFollows

Tracks follow relationships between users and creator profiles.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `follower` | relationship (Users) | User who is following (required, indexed) |
| `following` | relationship (CreatorProfiles) | Creator profile being followed (required, indexed) |
| `created_timestamp` | date | When the follow relationship was created |
| `createdAt` | date | Auto-generated |
| `updatedAt` | date | Auto-generated |

**Unique Constraint**: `follower` + `following` (a user can only follow a creator once)

> **Note**: The `community_stats.follower_count` and `community_stats.following_count` in CreatorProfiles are computed in real-time from this collection, not stored values.

---

## Monetization

### TokenGifts

Token transfer system.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `sender` | relationship (Users) | Gift sender |
| `recipient` | relationship (Users) | Gift recipient |
| `amount` | number | Token amount |
| `message` | text | Gift message |
| `related_bot` | relationship (Bot) | Related bot |
| `createdAt` | date | Auto-generated |

### SubscriptionPayments

Payment tracking.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `user` | relationship (Users) | Payer |
| `tier` | relationship (SubscriptionTiers) | Subscription tier |
| `amount` | number | Payment amount |
| `status` | select | Status: pending, completed, failed, refunded |
| `stripe_payment_id` | text | Stripe reference |
| `period_start` | date | Period start |
| `period_end` | date | Period end |
| `createdAt` | date | Auto-generated |

### SubscriptionTiers

Subscription plans.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `name` | text | Tier name |
| `description` | textarea | Tier description |
| `price_monthly` | number | Monthly price |
| `price_yearly` | number | Yearly price |
| `features` | array | Feature list |
| `token_allowance` | number | Monthly tokens |
| `bot_limit` | number | Bot creation limit |
| `priority_support` | checkbox | Priority support flag |
| `is_active` | checkbox | Active status |

### TokenPackages

Token purchasing options.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `name` | text | Package name |
| `amount` | number | Token amount |
| `price` | number | Price |
| `bonus_amount` | number | Bonus tokens |
| `is_active` | checkbox | Active status |

### AccessControl

Fine-grained permissions for sharing bots and knowledge collections.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `user` | relationship (Users) | User who receives access |
| `resource_type` | select | Type: **bot**, **knowledgeCollection** |
| `resource_id` | text | Resource ID reference |
| `permission_type` | select | Permission: **read** (readonly), **write** (editor), **admin** (owner) |
| `granted_by` | relationship (Users) | User who granted access |
| `is_revoked` | checkbox | Whether access has been revoked |
| `revoked_at` | date | When access was revoked |
| `revoked_by` | relationship (Users) | User who revoked access |
| `expires_at` | date | Optional expiration date |
| `createdAt` | date | Auto-generated |
| `updatedAt` | date | Auto-generated |

#### Permission Mapping

| UI Permission | AccessControl `permission_type` | Capabilities |
|---------------|--------------------------------|--------------|
| Owner | `admin` | Full access: view, edit, manage shares, delete |
| Editor | `write` | View and edit content |
| Read-only | `read` | View only |

> **Usage Pattern**: When sharing a bot or lore book with another user, an AccessControl record is created with the recipient user and appropriate permission type. The original creator (stored in the resource's `user` field) is implicit owner and does not have an AccessControl record.

---

## Wellbeing System

### Mood

Mental health tracking.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `user` | relationship (Users) | User |
| `mood` | select | Mood: happy, content, neutral, sad, anxious, etc. |
| `intensity` | number | Intensity (1-5) |
| `note` | textarea | Optional note |
| `triggers` | array | Mood triggers |
| `createdAt` | date | Auto-generated |

### SelfModeration

Usage limits and health tools.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `user` | relationship (Users) | User |
| `daily_limit` | number | Daily usage limit (minutes) |
| `weekly_limit` | number | Weekly usage limit |
| `break_reminder_interval` | number | Break reminder (minutes) |
| `night_mode_enabled` | checkbox | Night mode flag |
| `night_mode_start` | text | Night mode start time |
| `night_mode_end` | text | Night mode end time |
| `intervention_triggers` | json | Alert conditions |
| `current_daily_usage` | number | Today's usage |
| `current_weekly_usage` | number | This week's usage |
| `createdAt` | date | Auto-generated |
| `updatedAt` | date | Auto-generated |

---

## Analytics

### UsageAnalytics

Comprehensive usage tracking.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `user` | relationship (Users) | User |
| `date` | date | Analytics date |
| `conversations_started` | number | New conversations |
| `messages_sent` | number | Messages sent |
| `tokens_used` | number | Tokens consumed |
| `bots_created` | number | Bots created |
| `knowledge_added` | number | Knowledge entries |
| `session_duration` | number | Session minutes |
| `createdAt` | date | Auto-generated |

### MemoryInsights

Story progression analytics.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `user` | relationship (Users) | User |
| `conversation` | relationship (Conversation) | Conversation |
| `memory_depth` | number | Memory depth score |
| `story_coherence` | number | Coherence score |
| `character_development` | number | Development score |
| `key_events` | array | Key events |
| `createdAt` | date | Auto-generated |

### PersonaAnalytics

Persona effectiveness metrics.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `persona` | relationship (Personas) | Persona |
| `conversations_count` | number | Total conversations |
| `average_session_length` | number | Average session |
| `engagement_score` | number | Engagement score |
| `consistency_score` | number | Consistency score |
| `createdAt` | date | Auto-generated |

---

## Legal & Help

### LegalDocuments

Terms, privacy, compliance.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `title` | text | Document title |
| `type` | select | Type: terms, privacy, responsible_ai, cookies, etc. |
| `content` | richText | Document content |
| `version` | text | Version number |
| `effective_date` | date | Effective date |
| `is_active` | checkbox | Active status |
| `createdAt` | date | Auto-generated |
| `updatedAt` | date | Auto-generated |

### UserAgreements

Legal acceptance tracking.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `user` | relationship (Users) | User |
| `document` | relationship (LegalDocuments) | Document |
| `accepted_at` | date | Acceptance date |
| `ip_address` | text | IP address |
| `user_agent` | text | User agent |

### Documentation

Help documentation.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `title` | text | Article title |
| `slug` | text | URL slug (unique) |
| `content` | richText | Article content |
| `category` | select | Category: getting-started, features, troubleshooting |
| `order` | number | Sort order |
| `is_featured` | checkbox | Featured flag |
| `view_count` | number | View count |
| `is_published` | checkbox | Published status |
| `createdAt` | date | Auto-generated |
| `updatedAt` | date | Auto-generated |

### Tutorials

Interactive tutorials.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `title` | text | Tutorial title |
| `description` | textarea | Description |
| `category` | select | Category |
| `difficulty` | select | Difficulty: beginner, intermediate, advanced |
| `steps` | array | Tutorial steps |
| `estimated_time` | number | Estimated minutes |
| `is_published` | checkbox | Published status |
| `createdAt` | date | Auto-generated |

---

## Relationships Diagram

```
Users
├── Bots (user)
├── Conversations (user)
├── Memories (user)
├── Personas (user)
├── CreatorProfiles (user)
├── CreatorFollows (follower)
├── Mood (user)
├── SelfModeration (user)
├── UsageAnalytics (user)
├── ApiKey (user)
├── TokenGifts (sender/recipient)
├── SubscriptionPayments (user)
├── AccessControl (user)
└── UserAgreements (user)

CreatorProfiles
└── CreatorFollows (following)

Bot
├── BotInteraction (bot)
├── Conversations (bot)
├── Knowledge (bot)
├── KnowledgeCollections (bot)
└── TokenGifts (related_bot)

Knowledge
├── VectorRecord (source_id)
└── KnowledgeCollections (collection)

Conversation
├── Messages (conversation)
├── Memories (conversation)
└── MemoryInsights (conversation)

Personas
├── Conversations (persona)
└── PersonaAnalytics (persona)
```

---

## Indexes & Constraints

### Unique Constraints

| Collection | Fields |
|------------|--------|
| Users | `email` |
| Bot | `slug` |
| BotInteraction | `user` + `bot` |
| CreatorProfiles | `username` |
| CreatorFollows | `follower` + `following` |
| Documentation | `slug` |

### Common Query Patterns

```typescript
// Find Payload user by Clerk email (standard pattern for all API endpoints)
const clerkUser = await currentUser()
const payloadUsers = await payload.find({
  collection: 'users',
  where: {
    email: { equals: clerkUser.emailAddresses[0]?.emailAddress },
  },
  limit: 1,
})
const payloadUser = payloadUsers.docs[0]

// Find user's bots
payload.find({
  collection: 'bot',
  where: { user: { equals: userId } }
})

// Find public bots with pagination
payload.find({
  collection: 'bot',
  where: { is_public: { equals: true } },
  sort: '-createdAt',
  limit: 20,
  page: 1
})

// Find user's interactions with a bot
payload.find({
  collection: 'botInteractions',
  where: {
    user: { equals: userId },
    bot: { equals: botId }
  }
})

// Find knowledge for a bot
payload.find({
  collection: 'knowledge',
  where: { bot: { equals: botId } }
})
```
