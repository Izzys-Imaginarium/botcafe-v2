# BotCafé Database Schema Documentation

**Last Updated:** January 4, 2026
**Database:** Cloudflare D1 (SQLite)
**ORM:** Payload CMS with D1 SQLite Adapter
**Total Collections:** 30

---

## Overview

BotCafé uses **Cloudflare D1** (serverless SQLite) as its primary database, managed through **Payload CMS**. The schema is organized into distinct functional areas supporting core features like bot management, conversations, knowledge systems (RAG), mental health tracking, and creator ecosystems.

### Storage Architecture

| Storage Type | Purpose | Collections |
|--------------|---------|-------------|
| **D1 (SQLite)** | Structured data, relationships, metadata | All 30 collections |
| **R2 (Object Storage)** | Large files, PDFs, images, media | Media uploads, documents |
| **Vectorize** | Vector embeddings for semantic search | Knowledge, Memory vectors |

---

## Collection Categories

### 🔐 Core System Collections
1. [Users](#1-users) - User accounts and authentication
2. [Media](#2-media) - File uploads and media storage

### 🤖 Bot & Conversation System
3. [Bot](#3-bot) - Bot configurations and metadata
4. [BotInteraction](#4-botinteraction) - User interactions (likes, favorites)
5. [Conversation](#5-conversation) - Conversation threads and metadata
6. [Message](#6-message) - Individual messages within conversations
7. [Personas](#7-personas) - User personas/masks for bot interactions
8. [Mood](#8-mood) - User mood tracking

### 📚 Knowledge & RAG System (Lore)
9. [Knowledge](#9-knowledge) - Knowledge entries for RAG
10. [KnowledgeCollections](#10-knowledgecollections) - Knowledge organization
11. [Memory](#11-memory) - Conversation memory summaries
12. [VectorRecord](#12-vectorrecord) - Vector embedding tracking

### 🔑 API & Configuration
13. [ApiKey](#13-apikey) - User API keys for AI providers

### 💰 Billing & Subscriptions
14. [TokenGifts](#14-tokengifts) - Token gifting system
15. [SubscriptionPayments](#15-subscriptionpayments) - Payment records
16. [SubscriptionTiers](#16-subscriptiontiers) - Subscription plans
17. [TokenPackages](#17-tokenpackages) - Token purchase options

### 👑 Creator Ecosystem
18. [CreatorProfiles](#18-creatorprofiles) - Creator public profiles
19. [CreatorPrograms](#19-creatorprograms) - Creator recognition programs
20. [AccessControl](#20-accesscontrol) - Sharing and permissions

### 🧠 Mental Health & Wellbeing
21. [SelfModeration](#21-selfmoderation) - Usage limits and controls
22. [CrisisSupport](#22-crisissupport) - Mental health resources

### 📊 Analytics & Insights
23. [UsageAnalytics](#23-usageanalytics) - Usage tracking
24. [MemoryInsights](#24-memoryinsights) - Memory pattern analysis
25. [PersonaAnalytics](#25-personaanalytics) - Persona effectiveness metrics

### ⚖️ Legal & Compliance
26. [LegalDocuments](#26-legaldocuments) - Terms, policies, etc.
27. [UserAgreements](#27-useragreements) - User consent tracking

### 📖 Help & Support
28. [Documentation](#28-documentation) - Help articles and guides
29. [Tutorials](#29-tutorials) - Interactive tutorials
30. [SupportTickets](#30-supporttickets) - User support requests

---

## Detailed Schema

### 1. Users

**Purpose:** Core user authentication and profile management
**Slug:** `users`
**Auth:** Payload CMS built-in authentication with Clerk integration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | ✅ | Auto-generated primary key |
| `email` | email | ✅ | User email (unique, used for auth) |
| `password` | password | ✅ | Hashed password (Payload CMS auth) |
| `name` | text | ❌ | User display name |
| `avatar` | upload → media | ❌ | Profile picture |
| `createdAt` | date | ✅ | Auto-generated |
| `updatedAt` | date | ✅ | Auto-generated |

**Access Control:** Owner-only (users can only access their own data)

**Hooks:**
- `afterChange`: Sends welcome email on user creation
- Forgot password email template with custom styling

---

### 2. Media

**Purpose:** File uploads stored in R2 object storage
**Slug:** `media`
**Storage:** Cloudflare R2

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | ✅ | Auto-generated primary key |
| `alt` | text | ❌ | Alt text for accessibility |
| `filename` | text | ✅ | Original filename |
| `mimeType` | text | ✅ | File MIME type |
| `filesize` | number | ✅ | File size in bytes |
| `width` | number | ❌ | Image width (if applicable) |
| `height` | number | ❌ | Image height (if applicable) |
| `url` | text | ✅ | R2 public URL |
| `createdAt` | date | ✅ | Auto-generated |
| `updatedAt` | date | ✅ | Auto-generated |

**Storage Plugin:** `@payloadcms/storage-r2`

---

### 3. Bot

**Purpose:** AI bot configurations and metadata
**Slug:** `bot`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | ✅ | Auto-generated primary key |
| `user` | relationship → users | ✅ | Bot creator/owner |
| `name` | text | ✅ | Bot display name |
| `slug` | text | ✅ | Unique URL slug |
| `picture` | upload → media | ❌ | Bot avatar image |
| `description` | textarea | ❌ | Bot description |
| `system_prompt` | textarea | ✅ | Core AI instructions |
| `greeting` | textarea | ❌ | Initial greeting message |
| `gender` | select | ❌ | male, female, non-binary, other, prefer-not-to-say |
| `age` | number | ❌ | Bot age (1-200) |
| `is_public` | checkbox | ❌ | Public visibility (default: false) |
| `speech_examples` | array[text] | ❌ | Example speech patterns |
| `knowledge_collections` | relationship → knowledgeCollections | ❌ | Linked knowledge bases (many) |
| `likes_count` | number | ❌ | Total likes (default: 0) |
| `favorites_count` | number | ❌ | Total favorites (default: 0) |
| `creator_display_name` | text | ✅ | Public creator name |
| `created_date` | date | ❌ | Bot creation date |
| `createdAt` | date | ✅ | Auto-generated |
| `updatedAt` | date | ✅ | Auto-generated |

**Access Control:** Public read, owner-only create/update/delete

**Indexes:**
- `slug` (unique)
- `user` (foreign key)

---

### 4. BotInteraction

**Purpose:** Tracks user interactions with bots (likes, favorites)
**Slug:** `botInteractions`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | ✅ | Auto-generated primary key |
| `user` | relationship → users | ✅ | User who interacted |
| `bot` | relationship → bot | ✅ | Bot being interacted with |
| `liked` | checkbox | ❌ | User has liked (default: false) |
| `favorited` | checkbox | ❌ | User has favorited (default: false) |
| `created_date` | date | ❌ | Initial interaction date |
| `updated_date` | date | ❌ | Last update (auto-updated) |

**Access Control:** Open (public read/write for interaction tracking)

**Indexes:**
- `user` (foreign key)
- `bot` (foreign key)
- Unique constraint: `(user, bot)` pair

---

### 5. Conversation

**Purpose:** Conversation threads with multi-bot support
**Slug:** `conversation`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | ✅ | Auto-generated primary key |
| `user` | relationship → users | ✅ | Conversation owner |
| `created_timestamp` | date | ❌ | Conversation start time |
| `modified_timestamp` | date | ❌ | Last message time |
| `conversation_type` | select | ✅ | single-bot, multi-bot, group-chat (default: single-bot) |
| `bot_participation` | array[object] | ❌ | Multi-bot participation tracking |
| └─ `bot_id` | relationship → bot | ✅ | Participating bot |
| └─ `joined_at` | date | ❌ | When bot joined |
| └─ `role` | select | ✅ | primary, secondary, moderator |
| └─ `is_active` | checkbox | ❌ | Currently active in conversation |
| **participants** | json | ❌ | **RAG System**: { personas: string[], bots: string[], primary_persona?: string, persona_changes?: Array } |
| **total_tokens** | number | ❌ | Running token count (default: 0) |
| **last_summarized_at** | date | ❌ | When last summarized |
| **last_summarized_message_index** | number | ❌ | Last message in summary |
| **requires_summarization** | checkbox | ❌ | Flag for summarization trigger |
| `conversation_metadata` | group | ❌ | Metadata group |
| └─ `total_messages` | number | ❌ | Message count |
| └─ `participant_count` | number | ❌ | Number of participants |
| └─ `last_activity` | date | ❌ | Last activity timestamp |
| └─ `conversation_summary` | textarea | ❌ | AI-generated summary |
| └─ `tags` | array[text] | ❌ | User tags |
| `status` | select | ✅ | active, archived, muted, pinned (default: active) |
| `conversation_settings` | group | ❌ | Settings group |
| └─ `allow_file_sharing` | checkbox | ❌ | Allow file uploads (default: true) |
| └─ `message_retention_days` | number | ❌ | Auto-delete threshold (default: 365) |
| └─ `auto_save_conversations` | checkbox | ❌ | Auto-save enabled (default: true) |

**Access Control:** Owner-only (strict multi-tenancy)

**RAG Integration:** Tracks participants for memory filtering in semantic search

---

### 6. Message

**Purpose:** Individual messages within conversations
**Slug:** `message`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | ✅ | Auto-generated primary key |
| `user` | relationship → users | ✅ | Message owner |
| `conversation` | relationship → conversation | ✅ | Parent conversation |
| `bot` | relationship → bot | ❌ | Bot who sent message (if AI) |
| `entry` | textarea | ✅ | Message text content |
| `created_timestamp` | date | ❌ | Message creation time |
| `modified_timestamp` | date | ❌ | Last edit time |
| `message_type` | select | ✅ | text, image, file, system, voice, code (default: text) |
| `message_attribution` | group | ❌ | AI message tracking |
| └─ `source_bot_id` | relationship → bot | ❌ | Source bot |
| └─ `is_ai_generated` | checkbox | ❌ | AI-generated flag |
| └─ `model_used` | text | ❌ | AI model name |
| └─ `confidence_score` | number | ❌ | 0-1 confidence |
| `message_content` | group | ❌ | Rich content group |
| └─ `text_content` | richText | ❌ | Rich text content |
| └─ `media_attachments` | relationship → media | ❌ | Attached files (many) |
| └─ `code_snippets` | array[object] | ❌ | Code blocks |
| &nbsp;&nbsp;&nbsp;&nbsp;└─ `language` | text | ✅ | Programming language |
| &nbsp;&nbsp;&nbsp;&nbsp;└─ `code` | textarea | ✅ | Code content |
| &nbsp;&nbsp;&nbsp;&nbsp;└─ `filename` | text | ❌ | Optional filename |
| └─ `reactions` | json | ❌ | Message reactions |
| `message_thread` | group | ❌ | Threading support |
| └─ `reply_to_id` | relationship → message | ❌ | Parent message |
| └─ `thread_depth` | number | ❌ | Nesting level |
| └─ `is_thread_parent` | checkbox | ❌ | Is thread root |
| `token_tracking` | group | ❌ | Token usage tracking |
| └─ `input_tokens` | number | ❌ | Input tokens |
| └─ `output_tokens` | number | ❌ | Output tokens |
| └─ `total_tokens` | number | ❌ | Total tokens |
| └─ `cost_estimate` | number | ❌ | Estimated cost |
| `byo_key` | checkbox | ❌ | Bring-your-own-key flag |
| `message_status` | group | ❌ | Status tracking |
| └─ `delivery_status` | select | ❌ | sent, delivered, read, failed |
| └─ `is_edited` | checkbox | ❌ | Edit flag |
| └─ `edited_at` | date | ❌ | Last edit time |
| └─ `edit_history` | array[object] | ❌ | Edit history |
| &nbsp;&nbsp;&nbsp;&nbsp;└─ `previous_content` | textarea | ✅ | Previous text |
| &nbsp;&nbsp;&nbsp;&nbsp;└─ `edited_at` | date | ✅ | Edit timestamp |
| &nbsp;&nbsp;&nbsp;&nbsp;└─ `edit_reason` | text | ❌ | Edit reason |
| `metadata` | group | ❌ | Message metadata |
| └─ `processing_time_ms` | number | ❌ | Generation time |
| └─ `priority_level` | select | ❌ | low, normal, high, urgent |
| └─ `sensitivity_level` | select | ❌ | public, private, confidential |

**Access Control:** Owner-only

**Performance:** Indexed on `conversation`, `user`, `bot`

---

### 7. Personas

**Purpose:** User personas/masks for bot interactions
**Slug:** `personas`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | ✅ | Auto-generated primary key |
| `user` | relationship → users | ✅ | Persona owner |
| `name` | text | ✅ | Persona name (max 100 chars) |
| `description` | textarea | ✅ | Persona description (max 500 chars) |
| `personality_traits` | group | ❌ | Personality configuration |
| └─ `tone` | select | ❌ | friendly, professional, playful, mysterious, wise, humorous, empathetic, authoritative |
| └─ `formality_level` | select | ❌ | very-casual, casual, neutral, formal, very-formal |
| └─ `humor_style` | select | ❌ | none, light, moderate, dark, sarcastic |
| └─ `communication_style` | select | ❌ | direct, elaborate, concise, storytelling, questioning |
| `appearance` | group | ❌ | Visual settings |
| └─ `avatar` | upload → media | ❌ | Persona avatar |
| └─ `visual_theme` | select | ❌ | classic, modern, fantasy, minimalist, vintage, futuristic |
| └─ `color_scheme` | text | ❌ | Color palette (max 50 chars) |
| `behavior_settings` | group | ❌ | Behavior configuration |
| └─ `response_length` | select | ❌ | very-short, short, medium, long, very-long |
| └─ `creativity_level` | select | ❌ | conservative, moderate, creative, highly-creative |
| └─ `knowledge_sharing` | select | ❌ | very-limited, limited, balanced, generous, very-generous |
| `interaction_preferences` | group | ❌ | Interaction settings |
| └─ `preferred_topics` | array[text] | ❌ | Topics of interest |
| └─ `avoid_topics` | array[text] | ❌ | Topics to avoid |
| └─ `conversation_starter` | textarea | ❌ | Default greeting (max 200 chars) |
| └─ `signature_phrases` | array[text] | ❌ | Catchphrases (max 100 chars each) |
| `is_default` | checkbox | ❌ | Default persona for new chats |
| `is_public` | checkbox | ❌ | Allow others to use (default: false) |
| `usage_count` | number | ❌ | Times used (read-only) |
| `tags` | array[text] | ❌ | Categorization tags |
| `custom_instructions` | textarea | ❌ | Additional instructions |
| `created_timestamp` | date | ❌ | Creation date |
| `modified_timestamp` | date | ❌ | Last modified |

**Access Control:** Owner read/write, public personas are globally readable

**RAG Integration:** Personas are directly injected into context (not vectorized)

---

### 8. Mood

**Purpose:** User mood journal for mental health tracking
**Slug:** `mood`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | ✅ | Auto-generated primary key |
| `user` | relationship → users | ✅ | User tracking mood |
| `timestamp` | date | ❌ | Mood entry time |
| `mood` | select | ✅ | very-happy, happy, content, neutral, sad, very-sad, anxious, excited, angry, frustrated |
| `note` | textarea | ❌ | Optional journal entry |

**Access Control:** Owner-only (strict privacy)

**Purpose:** Supports mental health analytics and self-moderation

---

### 9. Knowledge

**Purpose:** Knowledge entries for RAG system (Lore)
**Slug:** `knowledge`
**Phase:** 4B/4B.5 Complete ✅

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | ✅ | Auto-generated primary key |
| `user` | relationship → users | ✅ | Knowledge owner |
| `entry` | textarea | ✅ | Main knowledge content |
| `type` | select | ✅ | document, url, text, image, audio, video, code, **legacy_memory** |
| `knowledge_collection` | relationship → knowledgeCollections | ✅ | Parent collection |
| `tags` | array[text] | ❌ | User-defined tags |
| `tokens` | number | ❌ | Token count estimate |
| `created_timestamp` | date | ❌ | Creation date |
| `modified_timestamp` | date | ❌ | Last modified |
| **RAG System Fields** | | | |
| `is_legacy_memory` | checkbox | ❌ | Converted from memory (default: false) |
| `source_memory_id` | relationship → memory | ❌ | Original memory link |
| `source_conversation_id` | relationship → conversation | ❌ | Original conversation link |
| `original_participants` | json | ❌ | { personas: string[], bots: string[] } |
| `memory_date_range` | json | ❌ | { start: timestamp, end: timestamp } |
| `applies_to_bots` | relationship → bot | ❌ | Bots this applies to (many) |
| `applies_to_personas` | relationship → personas | ❌ | Personas this applies to (many) |
| **Vectorization Fields** | | | |
| `is_vectorized` | checkbox | ❌ | Vectorization status (default: false) |
| `vector_records` | relationship → vectorRecords | ❌ | Vector chunk links (many) |
| `chunk_count` | number | ❌ | Number of chunks created |
| `r2_file_key` | text | ❌ | R2 storage key for files |
| **Privacy Settings** | group | ❌ | Privacy configuration |
| └─ `privacy_level` | select | ✅ | private, shared, public (default: private) |
| └─ `allow_sharing` | checkbox | ❌ | Sharing enabled (default: true) |
| └─ `share_expiration` | date | ❌ | Share link expiry |
| └─ `password_protected` | checkbox | ❌ | Requires password |
| └─ `share_password` | text | ❌ | Share password |
| └─ `access_count` | number | ❌ | Access count |
| └─ `last_accessed` | date | ❌ | Last access time |
| **Shared Access** | group | ❌ | Sharing configuration |
| └─ `shared_with_user_ids` | array[number] | ❌ | Shared user IDs |
| └─ `permissions` | array[select] | ❌ | read, write, admin |
| └─ `shared_by_user_id` | number | ❌ | Sharer user ID |
| └─ `shared_at` | date | ❌ | Share timestamp |
| └─ `sharing_notes` | textarea | ❌ | Sharing notes |
| **Content Metadata** | group | ❌ | Content tracking |
| └─ `source_url` | text | ❌ | Original URL |
| └─ `author` | text | ❌ | Content author |
| └─ `language` | text | ❌ | Content language |
| └─ `word_count` | number | ❌ | Word count |
| └─ `reading_time_minutes` | number | ❌ | Est. reading time |
| └─ `content_hash` | text | ❌ | Content hash (deduplication) |
| └─ `processing_status` | select | ❌ | pending, processing, completed, failed |
| **Usage Analytics** | group | ❌ | Analytics tracking |
| └─ `view_count` | number | ❌ | View count |
| └─ `search_count` | number | ❌ | Search appearances |
| └─ `引用_count` | number | ❌ | Citation count |
| └─ `last_searched` | date | ❌ | Last search time |
| └─ `popularity_score` | number | ❌ | Popularity metric |

**Access Control:** Owner or public visibility

**Vectorization:** BGE-M3 embeddings (1024 dims, 8192 token context)

---

### 10. KnowledgeCollections

**Purpose:** Knowledge organization and grouping
**Slug:** `knowledgeCollections`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | ✅ | Auto-generated primary key |
| `name` | text | ✅ | Collection name |
| `user` | relationship → users | ✅ | Collection owner |
| `bot` | relationship → bot | ❌ | Associated bots (many) |
| `description` | textarea | ❌ | Collection description |
| `created_timestamp` | date | ❌ | Creation date |
| `modified_timestamp` | date | ❌ | Last modified |
| **Sharing Settings** | group | ❌ | Sharing configuration |
| └─ `sharing_level` | select | ✅ | private, shared, public (default: private) |
| └─ `allow_collaboration` | checkbox | ❌ | Collaboration enabled (default: true) |
| └─ `allow_fork` | checkbox | ❌ | Forking enabled (default: true) |
| └─ `sharing_expiration` | date | ❌ | Share expiration |
| └─ `share_password` | text | ❌ | Share password |
| └─ `collaboration_requests` | checkbox | ❌ | Allow requests (default: true) |
| └─ `knowledge_count` | number | ❌ | Entry count |
| └─ `last_updated` | date | ❌ | Last update |
| └─ `is_public` | checkbox | ❌ | Public visibility |
| **Collaborators** | group | ❌ | Collaboration tracking |
| └─ `collab_user_ids` | array[number] | ❌ | Collaborator IDs |
| └─ `collab_perms` | array[select] | ❌ | read, write, admin |
| └─ `invited_by_user` | number | ❌ | Inviter user ID |
| └─ `invited_at` | date | ❌ | Invitation date |
| └─ `collab_notes` | textarea | ❌ | Collaboration notes |
| **Collection Metadata** | group | ❌ | Metadata tracking |
| └─ `total_size_bytes` | number | ❌ | Total size |
| └─ `total_words` | number | ❌ | Total word count |
| └─ `average_quality_score` | number | ❌ | Quality metric |
| └─ `collection_category` | text | ❌ | Category |
| └─ `difficulty_level` | select | ❌ | beginner, intermediate, advanced, expert |
| └─ `language` | text | ❌ | Primary language (default: en) |
| └─ `tags` | array[text] | ❌ | Collection tags |
| **Usage Analytics** | group | ❌ | Analytics tracking |
| └─ `view_count` | number | ❌ | View count |
| └─ `fork_count` | number | ❌ | Fork count |
| └─ `collaboration_count` | number | ❌ | Collaborator count |
| └─ `last_viewed` | date | ❌ | Last view time |
| └─ `popularity_score` | number | ❌ | Popularity metric |
| └─ `rating` | number | ❌ | User rating |
| └─ `review_count` | number | ❌ | Review count |

**Access Control:** Owner or public/shared visibility

**Features:** Supports curated collections, legal compliance collections

---

### 11. Memory

**Purpose:** Conversation memory summaries for RAG
**Slug:** `memory`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | ✅ | Auto-generated primary key |
| `user` | relationship → users | ✅ | Memory owner |
| `bot` | relationship → bot | ✅ | Associated bot |
| `conversation` | relationship → conversation | ❌ | Source conversation |
| `entry` | textarea | ✅ | Memory summary text |
| `tokens` | number | ❌ | Token count |
| `created_timestamp` | date | ❌ | Creation date |
| `modified_timestamp` | date | ❌ | Last modified |
| **RAG System Fields** | | | |
| `type` | select | ❌ | short_term, long_term, consolidated (default: short_term) |
| `participants` | json | ❌ | { personas: string[], bots: string[] } |
| `is_vectorized` | checkbox | ❌ | Vectorization status (default: false) |
| `vector_records` | relationship → vectorRecords | ❌ | Vector chunk links (many) |
| **Legacy Lore Conversion** | | | |
| `converted_to_lore` | checkbox | ❌ | Saved as lore (default: false) |
| `lore_entry` | relationship → knowledge | ❌ | Created lore link |
| `converted_at` | date | ❌ | Conversion timestamp |
| `importance` | number | ❌ | Significance 1-10 (default: 5) |
| `emotional_context` | textarea | ❌ | Mood/emotion tags |

**Access Control:** Owner-only

**RAG Integration:** Vectorized for semantic memory search

---

### 12. VectorRecord

**Purpose:** Tracks vector embeddings in Cloudflare Vectorize
**Slug:** `vectorRecords`
**Phase:** 4B.5 Complete ✅

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | ✅ | Auto-generated primary key |
| `vector_id` | text | ✅ | Unique ID in Vectorize (unique, indexed) |
| `source_type` | select | ✅ | knowledge, memory (indexed) |
| `source_id` | text | ✅ | Source document ID in D1 (indexed) |
| `user_id` | relationship → users | ✅ | Vector owner (indexed) |
| `tenant_id` | text | ✅ | Multi-tenant isolation ID (indexed) |
| `chunk_index` | number | ✅ | Chunk position (0-based) |
| `total_chunks` | number | ✅ | Total chunks in document |
| `chunk_text` | textarea | ✅ | Original chunk text |
| `metadata` | json | ✅ | Full Vectorize metadata object |
| `embedding_model` | text | ✅ | Model used (default: `@cf/baai/bge-m3`) |
| `embedding_dimensions` | number | ✅ | Vector dimensions (default: 1024) |
| `createdAt` | date | ✅ | Auto-generated |
| `updatedAt` | date | ✅ | Auto-generated |

**Access Control:** Owner-only

**Vectorization Technology:**
- **Model:** BGE-M3 (`@cf/baai/bge-m3`)
- **Dimensions:** 1024
- **Context Window:** 8192 tokens
- **Languages:** 100+
- **Platform:** Cloudflare Workers AI + Vectorize

**Purpose:** Coordinates D1 database with Vectorize for semantic search

---

### 13. ApiKey

**Purpose:** User API keys for external AI providers
**Slug:** `api-key`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | ✅ | Auto-generated primary key |
| `user` | relationship → users | ✅ | Key owner |
| `nickname` | text | ✅ | Friendly name for key |
| `provider` | select | ✅ | openai, anthropic, google, cohere, together, huggingface, custom, etc. |
| `key` | text | ✅ | Encrypted API key |
| **Key Configuration** | group | ❌ | Configuration settings |
| └─ `model_preferences` | array[text] | ❌ | Preferred models |
| └─ `rate_limits` | group | ❌ | Rate limiting |
| &nbsp;&nbsp;&nbsp;&nbsp;└─ `requests_per_hour` | number | ❌ | Request limit |
| &nbsp;&nbsp;&nbsp;&nbsp;└─ `tokens_per_minute` | number | ❌ | Token limit |
| └─ `usage_tracking` | group | ❌ | Usage quotas |
| &nbsp;&nbsp;&nbsp;&nbsp;└─ `monthly_quota` | number | ❌ | Monthly limit |
| &nbsp;&nbsp;&nbsp;&nbsp;└─ `daily_limit` | number | ❌ | Daily limit |
| └─ `fallback_providers` | array[text] | ❌ | Fallback provider IDs |
| **Usage Analytics** | group | ❌ | Usage tracking |
| └─ `total_requests` | number | ❌ | Total API calls |
| └─ `total_tokens_used` | number | ❌ | Total tokens |
| └─ `monthly_usage` | json | ❌ | Monthly breakdown |
| └─ `average_response_time` | number | ❌ | Avg response time |
| └─ `error_rate` | number | ❌ | Error percentage |
| **Security Features** | group | ❌ | Security settings |
| └─ `key_encryption_level` | select | ❌ | basic, advanced, military-grade (default: basic) |
| └─ `auto_rotation_enabled` | checkbox | ❌ | Auto-rotation (default: false) |
| └─ `rotation_schedule` | text | ❌ | Rotation schedule |
| └─ `last_rotation_date` | date | ❌ | Last rotation |
| └─ `key_expiry_date` | date | ❌ | Expiration date |
| └─ `is_active` | checkbox | ❌ | Key active status (default: true) |
| └─ `last_used` | date | ❌ | Last usage time |
| **Provider Settings** | group | ❌ | Provider-specific config |
| └─ `openai_settings` | group | ❌ | OpenAI config |
| &nbsp;&nbsp;&nbsp;&nbsp;└─ `organization_id` | text | ❌ | Org ID |
| &nbsp;&nbsp;&nbsp;&nbsp;└─ `project_id` | text | ❌ | Project ID |
| └─ `anthropic_settings` | group | ❌ | Anthropic config |
| &nbsp;&nbsp;&nbsp;&nbsp;└─ `account_preferences` | json | ❌ | Account prefs |
| └─ `google_settings` | group | ❌ | Google config |
| &nbsp;&nbsp;&nbsp;&nbsp;└─ `project_configuration` | json | ❌ | Project config |
| └─ `custom_settings` | group | ❌ | Custom provider config |
| &nbsp;&nbsp;&nbsp;&nbsp;└─ `configuration` | json | ❌ | Custom config |
| &nbsp;&nbsp;&nbsp;&nbsp;└─ `api_endpoint` | text | ❌ | Custom endpoint URL |

**Access Control:** Owner-only (strict security)

**Security:** Keys are encrypted at rest in D1

---

### 14. TokenGifts

**Purpose:** Token gifting system for users
**Slug:** `tokenGifts`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | ✅ | Auto-generated primary key |
| `from_user` | relationship → users | ✅ | Gift sender |
| `to_user` | relationship → users | ✅ | Gift recipient |
| `token_amount` | number | ✅ | Tokens gifted |
| `message` | textarea | ❌ | Optional gift message |
| `status` | select | ✅ | pending, accepted, declined, expired |
| `created_date` | date | ❌ | Gift creation date |
| `expires_at` | date | ❌ | Gift expiration |

**Access Control:** Involved users only

---

### 15. SubscriptionPayments

**Purpose:** Payment transaction records
**Slug:** `subscriptionPayments`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | ✅ | Auto-generated primary key |
| `user` | relationship → users | ✅ | Payment user |
| `subscription_tier` | relationship → subscriptionTiers | ✅ | Subscription plan |
| `amount` | number | ✅ | Payment amount |
| `currency` | text | ✅ | Currency code (USD, EUR, etc.) |
| `payment_method` | select | ✅ | credit_card, paypal, crypto, etc. |
| `status` | select | ✅ | pending, completed, failed, refunded |
| `transaction_id` | text | ✅ | External transaction ID |
| `payment_date` | date | ❌ | Payment timestamp |

**Access Control:** Owner-only

---

### 16. SubscriptionTiers

**Purpose:** Subscription plan definitions
**Slug:** `subscriptionTiers`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | ✅ | Auto-generated primary key |
| `name` | text | ✅ | Tier name (Free, Pro, Enterprise) |
| `description` | textarea | ❌ | Tier description |
| `price_monthly` | number | ✅ | Monthly price |
| `price_yearly` | number | ❌ | Yearly price (discount) |
| `token_allocation` | number | ✅ | Monthly token allowance |
| `features` | json | ❌ | Feature list |
| `is_active` | checkbox | ❌ | Tier availability (default: true) |

**Access Control:** Public read, admin-only write

---

### 17. TokenPackages

**Purpose:** One-time token purchase options
**Slug:** `tokenPackages`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | ✅ | Auto-generated primary key |
| `name` | text | ✅ | Package name |
| `token_amount` | number | ✅ | Tokens included |
| `price` | number | ✅ | Package price |
| `currency` | text | ✅ | Currency code |
| `bonus_percentage` | number | ❌ | Bonus tokens % |
| `is_active` | checkbox | ❌ | Package availability |

**Access Control:** Public read, admin-only write

---

### 18. CreatorProfiles

**Purpose:** Public creator profiles for multi-tenant platform
**Slug:** `creatorProfiles`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | ✅ | Auto-generated primary key |
| `user` | relationship → users | ✅ | Creator user account |
| `display_name` | text | ✅ | Public creator name |
| `bio` | textarea | ❌ | Creator bio |
| `avatar` | upload → media | ❌ | Profile picture |
| `social_links` | json | ❌ | Social media URLs |
| `featured_bots` | relationship → bot | ❌ | Showcased bots (many) |
| `total_bots_created` | number | ❌ | Bot count |
| `total_likes_received` | number | ❌ | Total likes across bots |
| `profile_views` | number | ❌ | Profile view count |
| `is_verified` | checkbox | ❌ | Verified creator badge |
| `created_date` | date | ❌ | Profile creation |

**Access Control:** Public read, owner-only write

---

### 19. CreatorPrograms

**Purpose:** Creator recognition and featured programs
**Slug:** `creatorPrograms`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | ✅ | Auto-generated primary key |
| `name` | text | ✅ | Program name |
| `description` | textarea | ❌ | Program description |
| `eligibility_criteria` | json | ❌ | Requirements for joining |
| `benefits` | json | ❌ | Program benefits |
| `enrolled_creators` | relationship → users | ❌ | Participating creators (many) |
| `is_active` | checkbox | ❌ | Program active status |

**Access Control:** Public read, admin-only write

---

### 20. AccessControl

**Purpose:** Sharing and permissions management
**Slug:** `accessControl`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | ✅ | Auto-generated primary key |
| `resource_type` | select | ✅ | bot, knowledge, conversation, etc. |
| `resource_id` | text | ✅ | Resource ID |
| `owner_user` | relationship → users | ✅ | Resource owner |
| `shared_with_users` | relationship → users | ❌ | Shared users (many) |
| `permission_level` | select | ✅ | read, write, admin |
| `share_link` | text | ❌ | Public share link |
| `share_expiration` | date | ❌ | Link expiration |
| `created_date` | date | ❌ | Share creation |

**Access Control:** Owner and shared users

---

### 21. SelfModeration

**Purpose:** User-defined usage limits and controls
**Slug:** `selfModeration`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | ✅ | Auto-generated primary key |
| `user` | relationship → users | ✅ | User setting limits |
| `daily_time_limit_minutes` | number | ❌ | Daily usage limit |
| `weekly_message_limit` | number | ❌ | Weekly message cap |
| `content_filters` | json | ❌ | Content filtering rules |
| `break_reminders` | checkbox | ❌ | Enable break notifications |
| `is_active` | checkbox | ❌ | Moderation enabled |

**Access Control:** Owner-only

---

### 22. CrisisSupport

**Purpose:** Mental health crisis resources
**Slug:** `crisisSupport`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | ✅ | Auto-generated primary key |
| `region` | text | ✅ | Geographic region |
| `hotline_number` | text | ✅ | Crisis hotline |
| `website_url` | text | ❌ | Support website |
| `description` | textarea | ❌ | Resource description |
| `languages` | array[text] | ❌ | Supported languages |
| `is_active` | checkbox | ❌ | Resource active status |

**Access Control:** Public read, admin-only write

---

### 23. UsageAnalytics

**Purpose:** User activity tracking
**Slug:** `usageAnalytics`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | ✅ | Auto-generated primary key |
| `user` | relationship → users | ✅ | Tracked user |
| `date` | date | ✅ | Analytics date |
| `total_messages` | number | ❌ | Messages sent |
| `total_tokens_used` | number | ❌ | Tokens consumed |
| `active_time_minutes` | number | ❌ | Active time |
| `bots_interacted` | relationship → bot | ❌ | Bots used (many) |

**Access Control:** Owner-only

---

### 24. MemoryInsights

**Purpose:** Memory pattern analysis
**Slug:** `memoryInsights`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | ✅ | Auto-generated primary key |
| `user` | relationship → users | ✅ | User insights |
| `memory` | relationship → memory | ✅ | Analyzed memory |
| `sentiment_score` | number | ❌ | Sentiment analysis (-1 to 1) |
| `key_topics` | array[text] | ❌ | Extracted topics |
| `emotional_tags` | array[text] | ❌ | Emotion labels |
| `narrative_importance` | number | ❌ | Story significance 1-10 |

**Access Control:** Owner-only

---

### 25. PersonaAnalytics

**Purpose:** Persona effectiveness metrics
**Slug:** `personaAnalytics`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | ✅ | Auto-generated primary key |
| `user` | relationship → users | ✅ | Persona owner |
| `persona` | relationship → personas | ✅ | Analyzed persona |
| `usage_count` | number | ❌ | Times used |
| `average_conversation_length` | number | ❌ | Avg conversation messages |
| `user_satisfaction_rating` | number | ❌ | User rating 1-5 |
| `most_used_with_bots` | relationship → bot | ❌ | Frequently paired bots (many) |

**Access Control:** Owner-only

---

### 26. LegalDocuments

**Purpose:** Terms of service, privacy policy, legal text
**Slug:** `legalDocuments`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | ✅ | Auto-generated primary key |
| `title` | text | ✅ | Document title |
| `document_type` | select | ✅ | terms, privacy_policy, disclaimer, etc. |
| `content` | richText | ✅ | Legal document text |
| `version` | text | ✅ | Document version |
| `effective_date` | date | ✅ | Effective date |
| `is_active` | checkbox | ❌ | Currently active |

**Access Control:** Public read, admin-only write

---

### 27. UserAgreements

**Purpose:** User consent tracking for legal compliance
**Slug:** `userAgreements`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | ✅ | Auto-generated primary key |
| `user` | relationship → users | ✅ | Consenting user |
| `legal_document` | relationship → legalDocuments | ✅ | Document agreed to |
| `agreed_at` | date | ✅ | Agreement timestamp |
| `ip_address` | text | ❌ | User IP (audit trail) |
| `user_agent` | text | ❌ | Browser info |

**Access Control:** Owner and admin

---

### 28. Documentation

**Purpose:** Help articles and documentation
**Slug:** `documentation`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | ✅ | Auto-generated primary key |
| `title` | text | ✅ | Article title |
| `category` | select | ✅ | getting-started, features, troubleshooting, api, etc. |
| `content` | richText | ✅ | Article content |
| `slug` | text | ✅ | URL slug (unique) |
| `tags` | array[text] | ❌ | Search tags |
| `view_count` | number | ❌ | Article views |
| `is_published` | checkbox | ❌ | Published status |

**Access Control:** Public read, admin-only write

---

### 29. Tutorials

**Purpose:** Interactive tutorials and walkthroughs
**Slug:** `tutorials`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | ✅ | Auto-generated primary key |
| `title` | text | ✅ | Tutorial title |
| `description` | textarea | ❌ | Tutorial description |
| `steps` | json | ✅ | Tutorial step data |
| `difficulty_level` | select | ✅ | beginner, intermediate, advanced |
| `estimated_time_minutes` | number | ❌ | Completion time |
| `completion_count` | number | ❌ | Times completed |
| `is_published` | checkbox | ❌ | Published status |

**Access Control:** Public read, admin-only write

---

### 30. SupportTickets

**Purpose:** User support request tracking
**Slug:** `supportTickets`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | ✅ | Auto-generated primary key |
| `user` | relationship → users | ✅ | User requesting support |
| `subject` | text | ✅ | Ticket subject |
| `description` | textarea | ✅ | Issue description |
| `category` | select | ✅ | bug, feature_request, question, billing, etc. |
| `priority` | select | ✅ | low, normal, high, urgent |
| `status` | select | ✅ | open, in_progress, resolved, closed |
| `assigned_to` | relationship → users | ❌ | Support agent |
| `created_date` | date | ❌ | Ticket creation |
| `resolved_date` | date | ❌ | Resolution date |
| `resolution_notes` | textarea | ❌ | Resolution details |

**Access Control:** Owner and admin

---

## Relationships Diagram

```
Users (1) ←─→ (N) Bots
Users (1) ←─→ (N) Conversations
Users (1) ←─→ (N) Messages
Users (1) ←─→ (N) Knowledge
Users (1) ←─→ (N) KnowledgeCollections
Users (1) ←─→ (N) Memory
Users (1) ←─→ (N) Personas
Users (1) ←─→ (N) ApiKeys

Bots (1) ←─→ (N) BotInteractions
Bots (N) ←─→ (N) KnowledgeCollections
Bots (1) ←─→ (N) Messages
Bots (1) ←─→ (N) Memory

Conversations (1) ←─→ (N) Messages
Conversations (1) ←─→ (N) Memory

Knowledge (N) ←─→ (1) KnowledgeCollections
Knowledge (1) ←─→ (N) VectorRecords
Knowledge (1) ←─→ (1) Memory (legacy memory conversion)

Memory (1) ←─→ (N) VectorRecords
Memory (1) ←─→ (1) Conversation

VectorRecords (N) ←─→ (1) Users (tenant isolation)
```

---

## Indexes and Performance

### Critical Indexes

**Multi-Tenant Isolation:**
- `users.id` - Primary key
- `knowledge.user` - Owner filtering
- `memory.user` - Owner filtering
- `conversation.user` - Owner filtering
- `vectorRecords.user_id` + `vectorRecords.tenant_id` - Multi-tenant RAG

**RAG System:**
- `vectorRecords.vector_id` - Unique Vectorize ID (unique)
- `vectorRecords.source_type` + `vectorRecords.source_id` - Source lookup
- `knowledge.is_vectorized` - Vectorization status
- `memory.is_vectorized` - Memory vectorization

**Relationships:**
- `bot.slug` - Unique bot URLs
- `bot.user` - Creator lookup
- `conversation.user` - User conversations
- `message.conversation` - Conversation messages
- `botInteractions.(user, bot)` - Interaction lookup (composite unique)

---

## Migration Strategy

**Development:**
- Schema push enabled (`push: true`)
- Auto-migration on schema changes

**Production:**
- Schema push disabled (`push: false`)
- Manual migrations only (via `migrations/` directory)
- Migration files committed to version control

**Deployment:**
```bash
# Generate migration
pnpm payload migrate:create

# Run migrations (production)
pnpm payload migrate
```

---

## Access Control Patterns

### 1. **Owner-Only** (Strict Multi-Tenancy)
```typescript
{
  read: ({ req: { user } }) => ({ user: { equals: user?.id } }),
  create: ({ req: { user } }) => ({ user: { equals: user?.id } }),
  update: ({ req: { user } }) => ({ user: { equals: user?.id } }),
  delete: ({ req: { user } }) => ({ user: { equals: user?.id } }),
}
```
**Collections:** Users, Conversation, Message, Memory, Mood, SelfModeration, ApiKey

### 2. **Owner or Public**
```typescript
{
  read: ({ req: { user } }) => ({
    or: [
      { user: { equals: user?.id } },
      { is_public: { equals: true } }
    ]
  }),
  // ... create/update/delete owner-only
}
```
**Collections:** Knowledge, KnowledgeCollections, Personas

### 3. **Public Read, Admin Write**
```typescript
{
  read: () => true,
  create: ({ req: { user } }) => user?.role === 'admin',
  update: ({ req: { user } }) => user?.role === 'admin',
  delete: ({ req: { user } }) => user?.role === 'admin',
}
```
**Collections:** SubscriptionTiers, TokenPackages, LegalDocuments, Documentation, Tutorials

### 4. **Public Read/Write** (Interaction Tracking)
```typescript
{
  read: () => true,
  create: () => true,
  update: () => true,
  delete: () => true,
}
```
**Collections:** BotInteraction (likes/favorites tracking)

---

## Vectorization Architecture

### Vector Storage

**Cloudflare Vectorize Indexes:**
- `botcafe-embeddings` (base/default)
- `botcafe-embeddings-dev` (development)
- `botcafe-embeddings-staging` (staging)
- `botcafe-embeddings-prod` (production)

**Model:** BGE-M3 (`@cf/baai/bge-m3`)
- **Dimensions:** 1024
- **Context:** 8192 tokens
- **Languages:** 100+
- **Platform:** Cloudflare Workers AI

### Vector Metadata Schema

```typescript
interface VectorMetadata {
  // Classification
  type: 'lore' | 'memory' | 'legacy_memory' | 'document'

  // Ownership
  user_id: number
  tenant_id: number

  // Source
  source_type: 'knowledge' | 'memory'
  source_id: string

  // Chunking
  chunk_index: number
  total_chunks: number

  // Application
  applies_to_bots?: number[]
  applies_to_personas?: number[]
  tags?: string[]

  // Timestamps
  created_at: string

  // Legacy Memory Specific
  is_legacy_memory?: boolean
  original_conversation_id?: string
  participants?: {
    personas: string[]
    bots: string[]
  }
  memory_created_at?: string
  converted_to_lore_at?: string
}
```

### D1 ↔ Vectorize Coordination

**VectorRecord** collection coordinates:
1. **Vector Creation:** API creates vector in Vectorize, then VectorRecord in D1
2. **Search:** Query Vectorize → Get vector_ids → Fetch VectorRecords from D1 for chunk_text
3. **Deletion:** Delete from Vectorize → Delete VectorRecords from D1
4. **Multi-Tenant:** Filter by `tenant_id` in Vectorize metadata and `user_id` in D1

---

## Security Considerations

### Data Encryption
- **At Rest:** D1 encrypted by default (Cloudflare)
- **In Transit:** TLS 1.3 for all API calls
- **API Keys:** Encrypted before storage in D1
- **Passwords:** Bcrypt hashing (Payload CMS default)

### Multi-Tenancy Isolation
- **Row-Level Security:** All queries filtered by `user.id`
- **Vector Isolation:** `tenant_id` metadata in Vectorize
- **Access Control:** Payload CMS access rules enforced at API layer

### PII Handling
- **No PII in Vectors:** Only IDs in metadata
- **GDPR Compliance:** Full data export includes vectors
- **Data Deletion:** Cascade deletes for user account removal

---

## Future Enhancements

### Planned Schema Changes

**Phase 4B.6 (UI Polish):**
- Add `vectorization_progress` field to Knowledge
- Add `vector_status` enum: pending, processing, completed, failed

**Phase 4C (Memory Vectorization):**
- Extend Memory collection with auto-summarization triggers
- Add `summarization_model` field
- Add `summary_quality_score` field

**Phase 4D (Legacy Memory System):**
- Add `memory_migration` collection for tracking conversions
- Add `narrative_timeline` field to Knowledge for story progression

**Phase 5 (Legal Compliance):**
- Add `data_retention_policy` to Users
- Add `consent_log` for GDPR compliance

---

## References

- [Payload CMS Documentation](https://payloadcms.com/docs)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Cloudflare Vectorize Documentation](https://developers.cloudflare.com/vectorize/)
- [RAG Architecture Document](./RAG-ARCHITECTURE.md)
- [Phase 4B/4B.5 Completion Summary](./PHASE_4B_4B5_COMPLETION_SUMMARY.md)

---

**Document Version:** 1.0
**Last Updated:** January 4, 2026
**Maintained By:** BotCafé Development Team
