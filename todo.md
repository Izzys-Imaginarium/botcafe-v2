# BotCafé Payload CMS Database Schema Update Plan

## Current Status
- **Existing Collections:** 14 total
- **Required for Full Sitemap:** 25+ collections
- **New Collections Needed:** 11+
- **Implementation Priority:** Multi-tenant architecture first

---

## 🎯 Phase 1: Creator & Persona System (Priority 1)

### New Collections to Create:
- [ ] **Personas.ts** - User personas/masks system
  - user relationship, name, description, personality traits, avatar
  - is_default, usage_count, created_timestamp, modified_timestamp

- [ ] **CreatorProfiles.ts** - Multi-tenant creator showcase
  - user relationship, username, display_name, bio, avatar, banner_image
  - social_links, featured_bots, follower_count, verification_status
  - creator_type, specialties, location, website, created_timestamp

- [ ] **CreatorPrograms.ts** - Featured creator program management
  - program_name, description, requirements, benefits, application_status
  - featured_creators, program_tiers, application_deadline

---

## 🎯 Phase 2: Enhanced Privacy & Sharing Controls (Priority 2)

### New Collections:
- [ ] **AccessControl.ts** - Fine-grained permissions
  - resource_type, resource_id, user_id, permission_type
  - granted_by, expiration_date, created_timestamp

### Updates to Existing Collections:
- [ ] **Update Bot.ts** - Add privacy controls
  - privacy_level, allowed_users, sharing_settings, collaboration_settings

- [ ] **Update Knowledge.ts** - Enhanced privacy
  - privacy_level, allowed_users, sharing_expiration_date, access_count

- [ ] **Update KnowledgeCollections.ts** - Collection sharing
  - privacy_level, allowed_users, collaboration_settings
  - is_curated, curator_notes, featured_status

---

## 🎯 Phase 3: Mental Health & Wellbeing System (Priority 3)

### New Collections:
- [ ] **MoodEntries.ts** - Daily mood tracking
  - user relationship, date, mood_score, energy_level, notes
  - tags, weather, sleep_quality, activities

- [ ] **SelfModeration.ts** - Usage limits and health tools
  - user relationship, usage_limits, healthy_habits
  - intervention_triggers, progress_tracking, last_checkin

- [ ] **CrisisSupport.ts** - Mental health resources
  - resource_type, title, description, contact_info, availability
  - resource_category, geographic_region, language_support

---

## 🎯 Phase 4: Analytics & Insights System (Priority 4)

### New Collections:
- [ ] **UsageAnalytics.ts** - Comprehensive usage tracking
  - user_id, session_data, feature_usage, time_spent, interactions
  - timestamp, device_info, geographic_data

- [ ] **MemoryInsights.ts** - Story progression analytics
  - user_id, conversation_id, memory_id, insight_type
  - story_themes, character_development, mood_patterns
  - narrative_elements, relationship_dynamics

- [ ] **PersonaAnalytics.ts** - Persona effectiveness metrics
  - persona_id, user_id, usage_stats, satisfaction_scores
  - response_quality, engagement_metrics, performance_data

---

## 🎯 Phase 5: Legal & Compliance System (Priority 5)

### New Collections:
- [ ] **LegalDocuments.ts** - Terms, privacy, disclaimers
  - document_type, title, content, version, effective_date
  - language, region, acceptance_required

- [ ] **UserAgreements.ts** - Legal acceptance tracking
  - user_id, document_id, acceptance_date, ip_address
  - version_accepted, consent_method

---

## 🎯 Phase 6: Help & Support System (Priority 6)

### New Collections:
- [ ] **Documentation.ts** - Help documentation
  - category, title, content, slug, tags, author
  - view_count, helpful_votes, last_updated, featured

- [ ] **Tutorials.ts** - Interactive tutorials
  - tutorial_type, title, description, content, prerequisites
  - difficulty_level, estimated_duration, completion_rate

- [ ] **SupportTickets.ts** - Help desk system
  - user_id, subject, description, status, priority
  - assigned_to, category, resolution, feedback

---

## 🎯 Phase 7: Enhanced Chat System (Priority 7)

### Updates to Existing Collections:
- [ ] **Update Conversation.ts** - Multi-bot support
  - active_bots, min_bots_required, conversation_settings
  - memory_integration_enabled, persona_applied

- [ ] **Update Message.ts** - Enhanced messaging
  - message_type, attachments, voice_input, response_time
  - bot_confidence_score, edited

---

## 🎯 Phase 8: API Key Management Enhancement (Priority 8)

### Updates to Existing Collections:
- [ ] **Update ApiKey.ts** - Multi-provider support
  - provider, key_name, usage_limits, monthly_spend
  - key_status, auto_renew, backup_keys

---

## 🔄 Implementation Order
1. **Start with Phase 1** - Creator & Persona System
2. **Phase 2** - Privacy Controls (critical for security)
3. **Phase 3** - Mental Health (user wellbeing)
4. **Phase 4-8** - Analytics, Legal, Support, Chat, API

---

## 📋 Current Progress
- [x] Sitemap analysis completed
- [x] Database schema planning completed
- [ ] Create Personas.ts collection
- [ ] Create CreatorProfiles.ts collection
- [ ] Create CreatorPrograms.ts collection
- [ ] Create AccessControl.ts collection
- [ ] Update existing collections with new fields
- [ ] Create database migrations
- [ ] Test new relationships and constraints
