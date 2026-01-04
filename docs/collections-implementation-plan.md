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
