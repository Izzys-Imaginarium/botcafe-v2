# BotCafe v2 - Complete Sitemap

**Last Updated**: 2026-02-06
**Version**: 2.37
**Status**: ~98% Complete

---

## Frontend Routes (`/src/app/(frontend)/`)

### Public Pages

| Route | Status | Description |
|-------|--------|-------------|
| `/` | ✅ Complete | Homepage with magical splash, feature cards, and CTA |
| `/explore` | ✅ Complete | Browse accessible bots (public + owned + shared) with search, sort, pagination |
| `/[username]/[botSlug]` | ✅ Complete | Individual bot detail page (per-creator URL format) |
| `/[username]/[botSlug]/edit` | ✅ Complete | Edit bot (owner only) |
| `/bot/[slug]` | ⚠️ Legacy | Returns 404 - use `/<username>/<bot-slug>` instead |
| `/bot/[slug]/edit` | ⚠️ Legacy | Returns 404 - legacy route removed |
| `/create` | ✅ Complete | Multi-step bot creation wizard |
| `/creators` | ✅ Complete | Creator directory with filtering and search |
| `/creators/[username]` | ✅ Complete | Individual creator profile page |
| `/creators/[username]/edit` | ✅ Complete | Edit creator profile (owner only) |
| `/creators/setup` | ✅ Complete | Creator profile setup wizard |

### Authentication

| Route | Status | Description |
|-------|--------|-------------|
| `/sign-in/[[...sign-in]]` | ✅ Complete | Clerk sign-in (catch-all) |
| `/sign-up/[[...sign-up]]` | ✅ Complete | Clerk sign-up (catch-all) |

### Account & Dashboard

| Route | Status | Description |
|-------|--------|-------------|
| `/account` | ✅ Complete | Account settings - 5 tabs: Overview (analytics), Mood, Profile, Security, API Keys |
| `/dashboard` | ✅ Complete | Creator's Workshop - My Bots, Lore, Memories, Personas |

### Knowledge System (Lore)

| Route | Status | Description |
|-------|--------|-------------|
| `/lore` | ✅ Complete | Lore library with tomes, search, sort, and filters |
| `/lore/entries` | ✅ Complete | Create and browse knowledge entries |
| `/lore/collections` | ✅ Complete | Manage knowledge collections |

### Memory System

| Route | Status | Description |
|-------|--------|-------------|
| `/memories/import` | ✅ Complete | Import conversations from external platforms |
| `/memories/library` | ✅ Complete | Browse and manage all memories |

### Persona System

| Route | Status | Description |
|-------|--------|-------------|
| `/personas` | ✅ Complete | Persona library with stats and filtering |
| `/personas/create` | ✅ Complete | Create new persona with personality traits |
| `/personas/edit/[id]` | ✅ Complete | Edit existing persona |

### Mood

| Route | Status | Description |
|-------|--------|-------------|
| `/mood` | ↪️ Redirect | Redirects to `/account?tab=mood` |

> **Note**: Self-moderation features (usage limits, breaks, night mode) have been removed and are planned as a future enhancement.

### Analytics

| Route | Status | Description |
|-------|--------|-------------|
| `/analytics` | ↪️ Redirect | Redirects to `/account?tab=overview` |
| `/analytics/bots` | ✅ Complete | Bot performance metrics |
| `/analytics/usage` | ✅ Complete | Usage statistics and content breakdown |

### Legal

| Route | Status | Description |
|-------|--------|-------------|
| `/legal` | ✅ Complete | Legal hub with document listing |
| `/legal/terms` | ✅ Complete | Terms of Service |
| `/legal/privacy` | ✅ Complete | Privacy Policy |
| `/legal/responsible-ai` | ✅ Complete | Responsible AI Use guidelines |

### Help Center

| Route | Status | Description |
|-------|--------|-------------|
| `/help` | ✅ Complete | Help hub with search and categories |
| `/help/[slug]` | ✅ Complete | Individual help article viewer |
| `/help/category/[category]` | ✅ Complete | Category browsing page |

### Chat

| Route | Status | Description |
|-------|--------|-------------|
| `/chat` | ✅ Complete | Chat interface hub (requires auth) |
| `/chat/[conversationId]` | ✅ Complete | Real-time conversation interface |

---

## API Routes (`/src/app/api/`)

### Bot Management

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/bots` | GET, POST | List all bots, create new bot |
| `/api/bots/explore` | GET | Bot discovery (public + owned + shared via AccessControl). Query params: `liked=true` (filter to liked bots), `favorited=true` (filter to favorited bots) |
| `/api/bots/my-bots` | GET | Get current user's bots |
| `/api/bots/by-path/[username]/[botSlug]` | GET | Internal: Get bot by creator username and slug (used by bot detail pages) |
| `/api/bots/[id]` | GET, PUT, DELETE | Bot CRUD operations. DELETE cascades to remove all related data (interactions, memories, analytics, etc.) |
| `/api/bots/[id]/like` | POST | Toggle like on bot |
| `/api/bots/[id]/favorite` | POST | Toggle favorite on bot |
| `/api/bots/[id]/status` | GET | Get like/favorite status |

### Knowledge (Lore)

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/knowledge` | GET, POST | List and create knowledge entries. Query params: `collection`, `page`, `limit`, `includeMemories` (default: false - excludes legacy memory entries) |
| `/api/knowledge/[id]` | GET, PATCH, DELETE | Get, update, or delete knowledge entry |
| `/api/knowledge-collections` | GET, POST | List and create collections. Query params: `includeMemoryTomes` (default: false), `onlyMemoryTomes` (default: false) |
| `/api/knowledge-collections/[id]` | GET, PATCH, DELETE | Get, update, or delete collection. DELETE cascades to remove all entries in the collection |

### Sharing & Permissions

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/sharing` | POST | Grant access to a resource (bot or lore book) |
| `/api/sharing/[resourceType]/[resourceId]` | GET, DELETE | List collaborators, revoke access |
| `/api/users/lookup` | GET | Look up user by username for sharing |

### Vector/Embeddings

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/vectors/generate` | POST | Generate embeddings (BGE-M3) |
| `/api/vectors/search` | POST | Semantic search |
| `/api/vectors/[sourceId]` | DELETE | Delete vectors by source |

### Memories

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/memories` | GET, POST | List all memories (includes both Memory collection AND Knowledge entries where `is_legacy_memory=true`), create new memory. Query params: `type`, `botId`, `convertedToLore`, `source` ('memory', 'knowledge', 'all' - default: 'all'), `limit`, `offset` |
| `/api/memories/[id]` | GET, PATCH, DELETE | Get, update, or delete a memory |
| `/api/memories/import` | POST | Import external conversations |
| `/api/memories/summarize` | POST | Summarize conversation |
| `/api/memories/vectorize` | POST | Vectorize memory |
| `/api/memories/search` | POST | Semantic memory search |
| `/api/memories/convert-to-lore` | POST | Convert memory to knowledge |
| `/api/memories/auto-process` | POST | Auto-process workflow |

### Personas

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/personas` | GET, POST | List and create personas |
| `/api/personas/[id]` | GET, PUT, DELETE | Persona CRUD operations |

### Creators

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/creators` | GET, POST | List creators, create profile. Query params: `followed=true` (filter to followed creators) |
| `/api/creators/me` | GET | Get current user's profile |
| `/api/creators/[username]` | GET, PUT, DELETE | Creator profile operations |
| `/api/creators/[username]/follow` | GET, POST | Check follow status, toggle follow/unfollow |

### Mood

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/wellbeing/mood` | GET, POST | Mood journal entries |

> **Note**: Self-moderation API endpoints have been removed and are planned as a future enhancement.

### Analytics

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/analytics` | GET | Dashboard overview data |
| `/api/analytics/bots` | GET | Bot performance metrics |
| `/api/analytics/usage` | GET | Usage statistics |

### Legal & Help

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/legal` | GET | List legal documents |
| `/api/legal/[type]` | GET | Get specific legal document |
| `/api/help` | GET | List help articles |
| `/api/help/[slug]` | GET | Get article (increments views) |
| `/api/help/tutorials` | GET | List tutorials |

### Account

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/account/export` | GET | Export all user data (GDPR-compliant) |
| `/api/user/preferences` | GET, PATCH | Get and update user chat preferences (nickname, pronouns, description) |

### Admin

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/admin/seed-legal` | POST | Seed legal documents (Terms, Privacy, AI Use) |
| `/api/admin/seed-help` | POST | Seed help center articles (14 articles across categories) |
| `/api/admin/seed-prompts` | GET, POST | GET: Preview prompts to seed. POST: Seed system prompts into database. Body: `force?: boolean` (overwrite existing) |
| `/api/admin/vector-sync-check` | GET, POST | Check and fix vector/knowledge sync issues |
| `/api/admin/fix/slugs` | GET, POST | GET: Preview bots with non-lowercase slugs. POST: Normalize all bot slugs to lowercase |
| `/api/admin/fix/empty-personas` | GET, POST | GET: Preview user persona collections with empty descriptions. POST: Create personas from empty-description collections using knowledge content |
| `/api/admin/fix/empty-collections` | GET, POST | GET: Preview knowledge collections with empty descriptions. POST: Populate descriptions from knowledge entries |
| `/api/admin/fix/recover-linked-knowledge` | GET, POST | GET: Preview knowledge linked via junction tables in old DB. Query params: `email` (user filter), `verify=true` (verification mode - checks all users for remaining unimported data). POST: Import linked entries. Body params: `email` (single user), `all: true` (batch mode), `limit`/`offset` (pagination for batch), `createMissingCollections`, `skipDuplicates` |
| `/api/admin/diagnostic/lookup` | GET | Diagnostic lookup for bots, users, or creator profiles. Query params: `botName`, `username`, `botSlug` |
| `/api/admin/diagnostic/bots` | GET | Diagnostic: List bots with detailed info for troubleshooting |
| `/api/admin/diagnostic/knowledge` | GET | Diagnostic: List knowledge entries with metadata, includes activation mode statistics (counts by mode, entries missing activation settings) |
| `/api/admin/diagnostic/personas` | GET | Diagnostic: List personas with usage info |
| `/api/admin/diagnostic/persona-collections` | GET | Diagnostic: List persona-related knowledge collections |
| `/api/admin/diagnostic/user-data` | GET | Diagnostic: Get comprehensive user data overview |
| `/api/admin/fix/bots` | GET, POST | Fix bot data issues (orphaned records, missing fields) |
| `/api/admin/fix/knowledge` | GET, POST | Fix knowledge entry issues |
| `/api/admin/fix/personas` | GET, POST | Fix persona data issues |
| `/api/admin/fix/memory-flags` | GET, POST | GET: Diagnose knowledge entries in memory tomes missing `is_legacy_memory` flag. POST: Fix entries by setting flag. Body: `dryRun?: boolean` (default: true), `tomeId?: number` |
| `/api/admin/fix/knowledge-activation` | GET, POST | GET: Preview knowledge entries missing activation settings. POST: Fix activation settings. Body: `strategy?: 'auto'\|'keyword'\|'vector'\|'hybrid'`, `userId?: number`, `dryRun?: boolean` |
| `/api/admin/fix/batch-vectorize` | GET, POST | GET: Preview non-vectorized entries. POST: Batch vectorize entries (processes in batches of 5, uses BGE-M3 embeddings). Body: `userId?: number`, `limit?: number` (max 100), `dryRun?: boolean` |
| `/api/admin/diagnostic/vectorization` | GET | Preview vectorization status of knowledge entries. Query: `userId`, `onlyNonVectorized` |
| `/api/admin/migrate/persona-collections` | GET, POST | Migrate persona collections from legacy format |
| `/api/admin/migration/compare` | GET | Compare local vs remote database for migration verification |

### Migration (Internal)

> **Note**: These endpoints are used for data migration from legacy systems and are not part of the public API.

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/migrate/user` | GET, POST | Migrate individual user data from legacy database |
| `/api/migrate/batch` | POST | Batch migrate multiple users from legacy database |
| `/api/migrate/memories` | GET, POST | GET: Migration status (pending/migrated counts). POST: Bulk migrate Memory entries to Knowledge collection with `is_legacy_memory: true`. Params: `batchSize`, `userId`, `dryRun` |

### File Upload

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/upload` | POST | File upload with text extraction |
| `/api/upload/image` | POST | Image upload with Clerk auth (for bot wizard) |

### Chat

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/chat/conversations` | GET, POST | List conversations, create new (with bot access check) |
| `/api/chat/conversations/[id]` | GET, PATCH, DELETE | Get, update (add/remove bots with access check), or delete |
| `/api/chat/conversations/[id]/messages` | GET, DELETE | Get messages (paginated), clear chat history. Query params: `page` (default: 1), `limit` (default: 50), `before` (message ID for loading older), `after` (message ID for loading newer). Returns most recent messages first with `hasPrevPage` indicating older messages exist. |
| `/api/chat/send` | POST | Send message and trigger LLM response |
| `/api/chat/regenerate` | POST | Regenerate/retry an AI message |
| `/api/chat/stream/[messageId]` | GET | SSE endpoint for streaming LLM responses |

### API Keys

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/api-keys` | GET, POST | List and create API keys |
| `/api/api-keys/[id]` | PATCH, DELETE | Update or delete API key |

---

## Payload Admin Routes (`/src/app/(payload)/`)

| Route | Description |
|-------|-------------|
| `/admin` | Payload CMS admin panel |
| `/admin/collections/*` | Collection management |

---

## Route Summary

| Category | Complete | Redirect | Total |
|----------|----------|----------|-------|
| Public Pages | 9 | 0 | 9 |
| Authentication | 2 | 0 | 2 |
| Account & Dashboard | 2 | 0 | 2 |
| Lore | 3 | 0 | 3 |
| Memories | 2 | 0 | 2 |
| Personas | 3 | 0 | 3 |
| Mood | 0 | 1 | 1 |
| Analytics | 2 | 1 | 3 |
| Legal | 4 | 0 | 4 |
| Help | 3 | 0 | 3 |
| Chat | 2 | 0 | 2 |
| **Frontend Total** | **32** | **2** | **34** |
| API Endpoints | 69 | 0 | 69 |
| **Grand Total** | **101** | **2** | **103** |

*Note: "Redirect" routes automatically redirect to the Account page with the appropriate tab.*
*Note: API count includes 15 admin/migration endpoints for internal tooling.*

---

## Navigation Structure

### Main Navigation Bar
```
Home | Explore | Creators | Chat* | Create*
(* requires authentication via Clerk)
```

### My Studio Dropdown (authenticated users)
```
Chat | My Bots | Lore | Memories | Personas | Account | Help | Discord (external)
```

### Full Site Structure
```
BotCafe
├── Home (/)
├── Explore (/explore)
│   └── Bot Detail (/<username>/<bot-slug>)
│       └── Edit (/<username>/<bot-slug>/edit)
├── Chat (/chat) [requires auth]
│   └── Conversation (/chat/[conversationId])
├── Create (/create → /dashboard) [requires auth]
├── Creators (/creators)
│   ├── Profile (/creators/[username])
│   │   └── Edit (/creators/[username]/edit)
│   └── Setup (/creators/setup)
├── Dashboard (/dashboard) - Creator's Workshop
│   ├── My Bots (default tab)
│   ├── Lore (/dashboard?tab=lore)
│   ├── Memories (/dashboard?tab=memories)
│   └── Personas (/dashboard?tab=personas)
├── Account (/account)
│   ├── Overview (analytics dashboard)
│   ├── Mood (mood journal)
│   ├── Profile (user settings)
│   ├── Security (Connected Accounts, password, 2FA via Clerk)
│   └── API Keys (provider keys)
├── Lore (/lore) - Standalone access
│   ├── Entries (/lore/entries)
│   └── Collections (/lore/collections)
├── Memories - Standalone access
│   ├── Import (/memories/import)
│   └── Library (/memories/library)
├── Personas (/personas) - Standalone access
│   ├── Create (/personas/create)
│   └── Edit (/personas/edit/[id])
├── Mood (/mood) - Redirects to Account
├── Analytics Sub-pages (main /analytics redirects to Account)
│   ├── Bots (/analytics/bots)
│   └── Usage (/analytics/usage)
├── Help (/help)
│   ├── Article (/help/[slug])
│   └── Category (/help/category/[category])
├── Legal (/legal)
│   ├── Terms (/legal/terms)
│   ├── Privacy (/legal/privacy)
│   └── Responsible AI (/legal/responsible-ai)
└── Auth
    ├── Sign In (/sign-in)
    └── Sign Up (/sign-up)
```
