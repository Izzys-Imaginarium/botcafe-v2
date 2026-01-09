# BotCafe v2

A fantasy-themed AI companion platform built with Next.js 15, Payload CMS, and Cloudflare Workers.

**Status**: ~80% Complete | **Version**: 2.6 | **Last Updated**: 2026-01-05

---

## Overview

BotCafe v2 is an enterprise-level SaaS platform for creating, sharing, and chatting with AI companions. It features a rich fantasy dark-forest theme, comprehensive bot management, knowledge (lore) systems with RAG capabilities, and multi-tenant creator profiles.

### Key Features

- **Bot Creation Wizard**: Multi-step form with personality customization
- **Explore & Discovery**: Browse public bots with search, filters, and pagination
- **Knowledge (Lore) System**: Upload documents, create world-building entries, semantic search via BGE-M3 embeddings
- **Memory Management**: Import conversations, auto-summarization, convert to permanent lore
- **Persona System**: Create user personas with personality traits for roleplay
- **Creator Profiles**: Multi-tenant creator pages with bot showcases
- **Wellbeing Tools**: Mood tracking, self-moderation, crisis resources
- **Analytics Dashboard**: Usage statistics, bot performance metrics

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| CMS | Payload CMS 3.59 |
| Database | Cloudflare D1 (SQLite) |
| Storage | Cloudflare R2 |
| Embeddings | Workers AI (BGE-M3) |
| Vector DB | Cloudflare Vectorize |
| Auth | Clerk |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Deployment | Cloudflare Workers |

---

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- Cloudflare account (Paid Workers plan required)
- Clerk account

### Local Development

1. **Clone and install**
   ```bash
   git clone <repo-url>
   cd botcafe-v2
   pnpm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env.local
   # Add your Clerk keys and other configuration
   ```

3. **Login to Cloudflare**
   ```bash
   pnpm wrangler login
   ```

4. **Run development server**
   ```bash
   pnpm dev
   ```

5. **Open browser**
   - Frontend: http://localhost:3000
   - Admin: http://localhost:3000/admin

### Deployment

1. **Create migrations**
   ```bash
   pnpm payload migrate:create
   ```

2. **Deploy**
   ```bash
   pnpm run deploy
   ```

---

## Project Structure

```
src/
├── app/
│   ├── (frontend)/          # Public pages
│   │   ├── (home)/          # Landing page
│   │   ├── explore/         # Bot discovery
│   │   ├── bot/[slug]/      # Bot details
│   │   ├── create/          # Bot creation
│   │   ├── account/         # User dashboard
│   │   ├── lore/            # Knowledge management
│   │   ├── memories/        # Memory import/library
│   │   ├── personas/        # Persona management
│   │   ├── creators/        # Creator profiles
│   │   ├── wellbeing/       # Health tools
│   │   ├── analytics/       # Usage stats
│   │   ├── legal/           # Legal pages
│   │   └── help/            # Documentation
│   ├── (payload)/           # Admin panel
│   └── api/                 # API routes
├── collections/             # Payload collections (30)
├── components/ui/           # shadcn/ui components
├── modules/                 # Feature modules
│   ├── home/
│   ├── explore/
│   ├── bot-create/
│   ├── account/
│   ├── lore/
│   ├── memories/
│   ├── personas/
│   ├── creators/
│   ├── wellbeing/
│   ├── analytics/
│   ├── legal/
│   └── help/
└── lib/                     # Utilities
    └── vectorization/       # Embedding utilities
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [BOTCAFE-COMPLETION-ROADMAP.md](./BOTCAFE-COMPLETION-ROADMAP.md) | Development roadmap and progress |
| [BOTCAFE-SITEMAP.md](./BOTCAFE-SITEMAP.md) | Complete route documentation |
| [BOTCAFE-STYLE-GUIDE.md](./BOTCAFE-STYLE-GUIDE.md) | Design system and components |
| [BOTCAFE-DATABASE-SCHEMA.md](./BOTCAFE-DATABASE-SCHEMA.md) | Database collections reference |

---

## Database Collections (30)

### Core
- **Users** - Authentication & profiles (Clerk integration)
- **Media** - File uploads (R2 storage)

### Bot System
- **Bot** - AI companion definitions
- **BotInteraction** - Likes, favorites, shares

### Knowledge/RAG
- **Knowledge** - Individual knowledge entries
- **KnowledgeCollections** - Grouped knowledge
- **VectorRecord** - Embedding tracking

### Conversations
- **Conversation** - Chat sessions
- **Message** - Chat messages
- **Memory** - Conversation memories

### User Features
- **Personas** - User personas/masks
- **ApiKey** - API key management

### Creators
- **CreatorProfiles** - Creator showcase pages with bots, bio, and social links

### Monetization
- **TokenGifts** - Token transfers
- **SubscriptionPayments** - Payments
- **SubscriptionTiers** - Plans
- **TokenPackages** - Token purchases
- **AccessControl** - Permissions

### Wellbeing
- **Mood** - Mental health tracking
- **SelfModeration** - Usage limits
- **CrisisSupport** - Resources

### Analytics
- **UsageAnalytics** - Usage stats
- **MemoryInsights** - Story analytics
- **PersonaAnalytics** - Persona metrics

### Legal/Help
- **LegalDocuments** - Terms, privacy
- **UserAgreements** - Acceptance tracking
- **Documentation** - Help articles
- **Tutorials** - Guided tutorials
- **SupportTickets** - Help desk

---

## API Endpoints

### Bot Management
- `GET/POST /api/bots` - List/create bots
- `GET/PUT/DELETE /api/bots/[id]` - Bot operations
- `GET /api/bots/explore` - Public discovery
- `POST /api/bots/[id]/like` - Toggle like
- `POST /api/bots/[id]/favorite` - Toggle favorite

### Knowledge
- `GET/POST /api/knowledge` - Entries
- `GET/POST /api/knowledge-collections` - Collections
- `POST /api/vectors/generate` - Vectorize content
- `POST /api/vectors/search` - Semantic search

### Memories
- `GET /api/memories` - List memories
- `POST /api/memories/import` - Import conversations
- `POST /api/memories/summarize` - AI summarization
- `POST /api/memories/convert-to-lore` - Promote to knowledge

### Personas
- `GET/POST /api/personas` - List/create
- `GET/PUT/DELETE /api/personas/[id]` - Operations

### Creators
- `GET/POST /api/creators` - Directory
- `GET /api/creators/me` - Current user
- `GET/PUT/DELETE /api/creators/[username]` - Profile

### Analytics
- `GET /api/analytics` - Dashboard
- `GET /api/analytics/bots` - Bot metrics
- `GET /api/analytics/usage` - Usage stats

### Wellbeing
- `GET /api/wellbeing` - Overview
- `GET/POST /api/wellbeing/mood` - Mood entries
- `GET/POST /api/wellbeing/settings` - Moderation settings

---

## Remaining Work (~20%)

### Chat Interface (Phase 9)
The main remaining feature is the real-time chat interface:
- WebSocket messaging
- Multi-bot conversations
- Memory integration
- Persona switching
- RAG context injection
- File sharing
- Voice input

---

## Environment Variables

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Payload
PAYLOAD_SECRET=

# Cloudflare
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=

# Optional
RESEND_API_KEY=
```

---

## Known Limitations

- **Worker Size**: Requires Paid Workers plan (3MB bundle limit)
- **GraphQL**: Limited support pending Cloudflare fixes
- **Local Dev**: Some Cloudflare bindings require remote connection

---

## Contributing

1. Check [BOTCAFE-COMPLETION-ROADMAP.md](./BOTCAFE-COMPLETION-ROADMAP.md) for current progress
2. Follow [BOTCAFE-STYLE-GUIDE.md](./BOTCAFE-STYLE-GUIDE.md) for design patterns
3. Reference [BOTCAFE-DATABASE-SCHEMA.md](./BOTCAFE-DATABASE-SCHEMA.md) for data models

---

## License

Proprietary - All Rights Reserved

---

## Support

For issues and questions:
- [GitHub Issues](https://github.com/your-repo/issues)
- [Discord Community](https://discord.gg/your-server)
