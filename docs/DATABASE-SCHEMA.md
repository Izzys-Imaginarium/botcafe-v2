# BotCafe v2 - Database Schema

**Last Updated**: 2026-01-08
**Version**: 2.9
**Database**: Cloudflare D1 (SQLite) via Payload CMS

---

## Overview

BotCafe v2 uses Payload CMS with 29 collections organized into functional groups:

| Category | Collections | Count |
|----------|-------------|-------|
| Core | Users, Media | 2 |
| Bot System | Bot, BotInteraction | 2 |
| Knowledge/RAG | Knowledge, KnowledgeCollections, VectorRecord | 3 |
| Conversation | Conversation, Message, Memory | 3 |
| User Features | Personas, ApiKey | 2 |
| Creators | CreatorProfiles | 1 |
| Monetization | TokenGifts, SubscriptionPayments, SubscriptionTiers, TokenPackages, AccessControl | 5 |
| Wellbeing | Mood, SelfModeration, CrisisSupport | 3 |
| Analytics | UsageAnalytics, MemoryInsights, PersonaAnalytics | 3 |
| Legal/Help | LegalDocuments, UserAgreements, Documentation, Tutorials, SupportTickets | 5 |

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
| `role` | select | User role (admin, creator, user) |
| `subscriptionTier` | relationship | Current subscription |
| `tokenBalance` | number | Current token balance |
| `preferences` | json | User preferences |
| `createdAt` | date | Auto-generated |
| `updatedAt` | date | Auto-generated |

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
| `is_public` | checkbox | Public visibility |
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

### BotInteraction

User interactions with bots (likes, favorites).

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `user` | relationship (Users) | User who interacted |
| `bot` | relationship (Bot) | Bot interacted with |
| `interaction_type` | select | Type: like, favorite, share, report |
| `createdAt` | date | When interaction occurred |

**Unique Constraint**: `user` + `bot` + `interaction_type`

---

## Knowledge/RAG System

### Knowledge

Individual knowledge entries for bot context and RAG.

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
| `created_timestamp` | date | Creation timestamp |
| `modified_timestamp` | date | Modification timestamp |
| `createdAt` | date | Auto-generated |
| `updatedAt` | date | Auto-generated |

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
| `collaborators` | group | Collaborator users and permissions |
| `collection_metadata` | group | Size, category, tags, difficulty level |
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

### VectorRecord

Vector embedding tracking for D1/Vectorize coordination.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `vector_id` | text | Unique ID in Vectorize database (required, unique, indexed) |
| `source_type` | select | Source: knowledge, memory (required, indexed) |
| `source_id` | text | Reference to source document in D1 (required, indexed) |
| `user_id` | relationship (Users) | Owner (required, indexed) |
| `tenant_id` | text | Multi-tenant isolation ID (required, indexed) |
| `chunk_index` | number | Position in document, 0-based (required) |
| `total_chunks` | number | Total chunks in document (required) |
| `chunk_text` | textarea | Original text of this chunk (required) |
| `metadata` | json | Full metadata object for Vectorize filtering (required) |
| `embedding_model` | text | Embedding model used, e.g., "@cf/baai/bge-m3" (required) |
| `embedding_dimensions` | number | Vector dimensions, e.g., 1024 (required) |
| `createdAt` | date | Auto-generated |
| `updatedAt` | date | Auto-generated |

---

## Conversation System

### Conversation

Chat conversation records.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `title` | text | Conversation title |
| `user` | relationship (Users) | Conversation owner |
| `bot` | relationship (Bot) | Primary bot |
| `persona` | relationship (Personas) | Active persona |
| `participants` | json | Bot and persona IDs involved |
| `message_count` | number | Total messages |
| `last_message_at` | date | Last activity |
| `context_snapshot` | json | Cached context |
| `is_active` | checkbox | Active status |
| `createdAt` | date | Auto-generated |
| `updatedAt` | date | Auto-generated |

### Message

Individual chat messages.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `conversation` | relationship (Conversation) | Parent conversation |
| `role` | select | Role: user, assistant, system |
| `content` | textarea | Message content |
| `sender_type` | select | Type: user, bot, persona |
| `sender_id` | text | Sender reference |
| `metadata` | json | Token count, model used |
| `createdAt` | date | Auto-generated |

### Memory

Conversation memory storage.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `user` | relationship (Users) | Memory owner |
| `conversation` | relationship (Conversation) | Source conversation |
| `memory_type` | select | Type: short_term, long_term, episodic, semantic |
| `content` | textarea | Raw memory content |
| `summary` | textarea | AI-generated summary |
| `participants` | json | Bot/persona IDs involved |
| `importance` | number | Importance score (0-1) |
| `is_vectorized` | checkbox | Vectorization status |
| `embedding_metadata` | json | Vector metadata |
| `last_accessed` | date | Last retrieval |
| `access_count` | number | Retrieval count |
| `expires_at` | date | Expiration (for short-term) |
| `createdAt` | date | Auto-generated |
| `updatedAt` | date | Auto-generated |

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
| `provider` | select | Provider: openai, anthropic, mistral, etc. |
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

Fine-grained permissions.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `user` | relationship (Users) | User |
| `resource_type` | select | Type: bot, knowledge, collection |
| `resource_id` | text | Resource reference |
| `permission_level` | select | Level: view, edit, admin |
| `granted_by` | relationship (Users) | Granter |
| `createdAt` | date | Auto-generated |

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

### CrisisSupport

Mental health resources.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `name` | text | Resource name |
| `description` | textarea | Description |
| `category` | select | Category: hotline, chat, text, app, organization |
| `type` | select | Type: general, lgbtq, youth, veterans, etc. |
| `contact_phone` | text | Phone number |
| `contact_text` | text | Text number |
| `contact_chat` | text | Chat URL |
| `website` | text | Website URL |
| `hours` | text | Availability hours |
| `is_24_7` | checkbox | 24/7 availability |
| `is_emergency` | checkbox | Emergency resource |
| `region` | select | Region: global, us, uk, etc. |
| `is_active` | checkbox | Active status |

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

### SupportTickets

Help desk system.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `user` | relationship (Users) | Submitter |
| `subject` | text | Ticket subject |
| `description` | textarea | Issue description |
| `category` | select | Category: bug, feature, billing, etc. |
| `priority` | select | Priority: low, normal, high, urgent |
| `status` | select | Status: open, in_progress, resolved, closed |
| `assigned_to` | relationship (Users) | Assignee |
| `resolution` | textarea | Resolution notes |
| `createdAt` | date | Auto-generated |
| `updatedAt` | date | Auto-generated |

---

## Relationships Diagram

```
Users
├── Bots (createdBy)
├── Conversations (user)
├── Memories (user)
├── Personas (user)
├── CreatorProfiles (user)
├── Mood (user)
├── SelfModeration (user)
├── UsageAnalytics (user)
├── ApiKey (user)
├── TokenGifts (sender/recipient)
├── SubscriptionPayments (user)
├── AccessControl (user)
├── UserAgreements (user)
└── SupportTickets (user)

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
| BotInteraction | `user` + `bot` + `interaction_type` |
| CreatorProfiles | `username` |
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
  where: { createdBy: { equals: userId } }
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
