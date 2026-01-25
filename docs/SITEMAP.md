# BotCafe v2 - Complete Sitemap

**Last Updated**: 2026-01-25
**Version**: 2.20
**Status**: ~95% Complete

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
| `/creators/setup` | ✅ Complete | Creator profile setup wizard |

### Authentication

| Route | Status | Description |
|-------|--------|-------------|
| `/sign-in/[[...sign-in]]` | ✅ Complete | Clerk sign-in (catch-all) |
| `/sign-up/[[...sign-up]]` | ✅ Complete | Clerk sign-up (catch-all) |

### Account & Dashboard

| Route | Status | Description |
|-------|--------|-------------|
| `/account` | ✅ Complete | User dashboard with My Bots, stats, and profile |

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

### Wellbeing

| Route | Status | Description |
|-------|--------|-------------|
| `/wellbeing` | ✅ Complete | Wellbeing dashboard with mood overview |
| `/wellbeing/mood` | ✅ Complete | Mood journal with emoji selection and notes |
| `/wellbeing/settings` | ✅ Complete | Self-moderation settings (limits, breaks, night mode) |
| `/wellbeing/resources` | ✅ Complete | Crisis support resources directory |

### Analytics

| Route | Status | Description |
|-------|--------|-------------|
| `/analytics` | ✅ Complete | Analytics dashboard with overview stats |
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

### Chat (In Progress)

| Route | Status | Description |
|-------|--------|-------------|
| `/chat` | ⏳ In Progress | Chat interface hub |
| `/chat/[conversationId]` | ⏳ In Progress | Real-time conversation interface |

---

## API Routes (`/src/app/api/`)

### Bot Management

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/bots` | GET, POST | List all bots, create new bot |
| `/api/bots/explore` | GET | Bot discovery (public + owned + shared via AccessControl) |
| `/api/bots/my-bots` | GET | Get current user's bots |
| `/api/bots/[id]` | GET, PUT, DELETE | Bot CRUD operations |
| `/api/bots/[id]/like` | POST | Toggle like on bot |
| `/api/bots/[id]/favorite` | POST | Toggle favorite on bot |
| `/api/bots/[id]/status` | GET | Get like/favorite status |

### Knowledge (Lore)

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/knowledge` | GET, POST | List and create knowledge entries. Query params: `collection`, `page`, `limit`, `includeMemories` (default: false - excludes legacy memory entries) |
| `/api/knowledge/[id]` | GET, PATCH, DELETE | Get, update, or delete knowledge entry |
| `/api/knowledge-collections` | GET, POST | List and create collections. Query params: `includeMemoryTomes` (default: false), `onlyMemoryTomes` (default: false) |
| `/api/knowledge-collections/[id]` | GET, PATCH, DELETE | Get, update, or delete collection |

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
| `/api/creators` | GET, POST | List creators, create profile |
| `/api/creators/me` | GET | Get current user's profile |
| `/api/creators/[username]` | GET, PUT, DELETE | Creator profile operations |

### Wellbeing

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/wellbeing` | GET | Overall wellbeing dashboard data |
| `/api/wellbeing/mood` | GET, POST | Mood entries |
| `/api/wellbeing/settings` | GET, POST, PUT | Self-moderation settings |
| `/api/wellbeing/crisis-support` | GET | Crisis support resources |

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

### Admin

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/admin/seed-legal` | POST | Seed legal documents (Terms, Privacy, AI Use) |
| `/api/admin/vector-sync-check` | GET, POST | Check and fix vector/knowledge sync issues |

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
| `/api/chat/conversations/[id]/messages` | GET, DELETE | Get messages, clear chat history |
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

| Category | Complete | Pending | Total |
|----------|----------|---------|-------|
| Public Pages | 8 | 0 | 8 |
| Authentication | 2 | 0 | 2 |
| Account | 1 | 0 | 1 |
| Lore | 3 | 0 | 3 |
| Memories | 2 | 0 | 2 |
| Personas | 3 | 0 | 3 |
| Wellbeing | 4 | 0 | 4 |
| Analytics | 3 | 0 | 3 |
| Legal | 4 | 0 | 4 |
| Help | 3 | 0 | 3 |
| Chat | 0 | 2 | 2 |
| **Frontend Total** | **33** | **2** | **35** |
| API Endpoints | 51 | 0 | 51 |
| **Grand Total** | **84** | **2** | **86** |

---

## Navigation Structure

```
BotCafe
├── Home (/)
├── Explore (/explore)
│   └── Bot Detail (/<username>/<bot-slug>)
│       └── Edit (/<username>/<bot-slug>/edit)
├── Create (/create)
├── Creators (/creators)
│   ├── Profile (/creators/[username])
│   └── Setup (/creators/setup)
├── Account (/account)
├── Lore (/lore)
│   ├── Entries (/lore/entries)
│   └── Collections (/lore/collections)
├── Memories
│   ├── Import (/memories/import)
│   └── Library (/memories/library)
├── Personas (/personas)
│   ├── Create (/personas/create)
│   └── Edit (/personas/edit/[id])
├── Wellbeing (/wellbeing)
│   ├── Mood (/wellbeing/mood)
│   ├── Settings (/wellbeing/settings)
│   └── Resources (/wellbeing/resources)
├── Analytics (/analytics)
│   ├── Bots (/analytics/bots)
│   └── Usage (/analytics/usage)
├── Help (/help)
│   ├── Article (/help/[slug])
│   └── Category (/help/category/[category])
├── Legal (/legal)
│   ├── Terms (/legal/terms)
│   ├── Privacy (/legal/privacy)
│   └── Responsible AI (/legal/responsible-ai)
├── Chat (/chat) [IN PROGRESS]
│   └── Conversation (/chat/[conversationId]) [IN PROGRESS]
└── Auth
    ├── Sign In (/sign-in)
    └── Sign Up (/sign-up)
```
