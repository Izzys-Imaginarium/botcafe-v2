# BotCafe v2 - Database Schema

**Last Updated**: 2026-01-06
**Version**: 2.7
**Database**: Cloudflare D1 (SQLite) via Payload CMS

---

## Overview

BotCafe v2 uses Payload CMS with 30 collections organized into functional groups:

| Category | Collections | Count |
|----------|-------------|-------|
| Core | Users, Media | 2 |
| Bot System | Bot, BotInteraction | 2 |
| Knowledge/RAG | Knowledge, KnowledgeCollections, VectorRecord | 3 |
| Conversation | Conversation, Message, Memory | 3 |
| User Features | Personas, ApiKey | 2 |
| Creators | CreatorProfiles, CreatorPrograms | 2 |
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

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `name` | text | Bot name (required) |
| `slug` | text | URL-friendly identifier (unique) |
| `description` | textarea | Bot description |
| `avatar` | relationship (Media) | Bot avatar image |
| `personality` | textarea | Personality prompt |
| `system_prompt` | textarea | System instructions |
| `greeting` | textarea | Initial greeting message |
| `example_dialogues` | textarea | Example conversations |
| `tags` | array | Category tags |
| `is_public` | checkbox | Public visibility |
| `is_nsfw` | checkbox | NSFW flag |
| `conversation_count` | number | Total conversations |
| `likes_count` | number | Total likes |
| `favorites_count` | number | Total favorites |
| `rating` | number | Average rating |
| `createdBy` | relationship (Users) | Creator reference |
| `createdAt` | date | Auto-generated |
| `updatedAt` | date | Auto-generated |

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

Individual knowledge entries for bot context.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `title` | text | Entry title (required) |
| `content` | textarea | Full text content |
| `content_type` | select | Type: text, document, conversation, world_info |
| `source_url` | text | Original source URL |
| `collection` | relationship (KnowledgeCollections) | Parent collection |
| `bot` | relationship (Bot) | Associated bot |
| `is_vectorized` | checkbox | Vectorization status |
| `embedding_metadata` | json | Chunk count, model, dimensions |
| `priority` | select | Priority: low, normal, high, critical |
| `createdBy` | relationship (Users) | Creator |
| `createdAt` | date | Auto-generated |
| `updatedAt` | date | Auto-generated |

### KnowledgeCollections

Grouped knowledge for organization.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `name` | text | Collection name (required) |
| `description` | textarea | Collection description |
| `bot` | relationship (Bot) | Associated bot |
| `is_public` | checkbox | Public visibility |
| `createdBy` | relationship (Users) | Creator |
| `createdAt` | date | Auto-generated |

### VectorRecord

Vector embedding tracking for RAG.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `source_type` | select | Source: knowledge, memory, conversation |
| `source_id` | text | Reference to source document |
| `vectorize_index` | text | Cloudflare Vectorize index name |
| `vector_ids` | json | Array of vector IDs in Vectorize |
| `chunk_count` | number | Number of chunks |
| `model` | text | Embedding model used |
| `dimensions` | number | Vector dimensions |
| `metadata` | json | Additional metadata |
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

User personas/masks for conversations.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `name` | text | Persona name (required) |
| `description` | textarea | Persona description |
| `user` | relationship (Users) | Owner |
| `personality_traits` | json | Trait scores |
| `communication_style` | select | Style: formal, casual, playful, etc. |
| `topics_of_interest` | array | Interest tags |
| `signature_phrases` | array | Catchphrases |
| `response_length` | select | Preference: concise, moderate, detailed |
| `humor_level` | select | Level: none, subtle, moderate, high |
| `formality_level` | select | Level: casual, balanced, formal |
| `emotional_expressiveness` | select | Level: reserved, moderate, expressive |
| `is_default` | checkbox | Default persona flag |
| `is_public` | checkbox | Public visibility |
| `avatar` | relationship (Media) | Persona avatar |
| `createdAt` | date | Auto-generated |
| `updatedAt` | date | Auto-generated |

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

Multi-tenant creator management.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `user` | relationship (Users) | User account |
| `username` | text | Unique username (required) |
| `display_name` | text | Display name |
| `bio` | textarea | Creator biography |
| `avatar` | relationship (Media) | Profile image |
| `cover_image` | relationship (Media) | Cover banner |
| `specialties` | array | Expertise areas |
| `experience_level` | select | Level: beginner, intermediate, expert |
| `social_links` | json | Website, GitHub, Twitter, etc. |
| `is_verified` | checkbox | Verification badge |
| `is_premium` | checkbox | Premium status |
| `is_featured` | checkbox | Featured flag |
| `visibility` | select | Visibility: public, unlisted, private |
| `accepts_commissions` | checkbox | Commission availability |
| `commission_info` | textarea | Commission details |
| `follower_count` | number | Follower count |
| `following_count` | number | Following count |
| `createdAt` | date | Auto-generated |
| `updatedAt` | date | Auto-generated |

### CreatorPrograms

Featured creator programs.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `name` | text | Program name |
| `description` | textarea | Program description |
| `requirements` | textarea | Eligibility requirements |
| `benefits` | array | Program benefits |
| `is_active` | checkbox | Active status |
| `createdAt` | date | Auto-generated |

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
