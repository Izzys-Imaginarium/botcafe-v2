# Knowledge Entry Compatibility Fixes

**Created:** 2026-02-05
**Updated:** 2026-02-05
**Status:** In Progress
**Related Files:** activation-engine.ts, memory-service.ts, import routes

This document tracks compatibility issues between legacy memories (migrated from `memory` collection) and new knowledge entries created directly in the `knowledge` collection.

---

## Fix Endpoints Available

| Endpoint | Purpose | Method |
|----------|---------|--------|
| `/api/admin/diagnostic/knowledge` | Preview issues with knowledge entries | GET |
| `/api/admin/diagnostic/vectorization` | Preview vectorization status of entries | GET |
| `/api/admin/fix/knowledge` | Fix orphaned knowledge (missing collections) | GET/POST |
| `/api/admin/fix/knowledge-activation` | Fix missing activation settings | GET/POST |
| `/api/admin/fix/memory-flags` | Fix is_legacy_memory flags on memory tomes | GET/POST |
| `/api/admin/fix/batch-vectorize` | Batch vectorize non-vectorized entries | GET/POST |

---

## Issue Tracker

| # | Issue | Severity | Status | File(s) |
|---|-------|----------|--------|---------|
| 1 | Missing `use_probability` in import route | HIGH | **FIXED** | `memories/import/route.ts`, `memory-service.ts` |
| 2 | `retrieveRelevantMemories` only gets legacy | CRITICAL | BY DESIGN | `memory-service.ts` |
| 3 | `is_vectorized: false` with no query filter | CRITICAL | **FIX AVAILABLE** | Multiple |
| 4 | Hardcoded importance for imports | MEDIUM | ACCEPTABLE | `memories/import/route.ts` |
| 5 | Duplicate detection only checks legacy | MEDIUM | **FIXED** | `memory-service.ts` |
| 6 | Advanced activation fields not set | LOW | **FIX AVAILABLE** | All creation paths |

**Notes:**
- Issue 1: Added `use_probability: false` to all memory creation paths
- Issue 3: Use `/api/admin/fix/batch-vectorize` to vectorize non-vectorized entries
- Issue 5: Duplicate detection now checks all entries, not just legacy
- Issue 6: Use `/api/admin/fix/knowledge-activation` to fix activation settings

---

## Issue 1: Missing `use_probability` in Import Route

**Severity:** HIGH
**Status:** TODO
**File:** `src/app/api/memories/import/route.ts:238-243`

### Problem
The import route creates entries with incomplete `activation_settings`:
```typescript
activation_settings: {
  activation_mode: 'vector',
  vector_similarity_threshold: 0.6,
  max_vector_results: 5,
  probability: 100,
  // MISSING: use_probability: false
}
```

The migration route (`src/app/api/migrate/memories/route.ts:127-133`) correctly includes `use_probability: false`.

### Impact
- Probability checks may fail unpredictably
- Inconsistent behavior between imported and migrated memories

### Fix
Add `use_probability: false` to the activation_settings object.

---

## Issue 2: `retrieveRelevantMemories` Only Gets Legacy Memories

**Severity:** CRITICAL
**Status:** TODO
**File:** `src/lib/chat/memory-service.ts:1236-1241`

### Problem
The query filters with `is_legacy_memory: { equals: true }`:
```typescript
const where: Record<string, unknown> = {
  user: { equals: userId },
  is_legacy_memory: { equals: true },  // <-- Only legacy!
  applies_to_bots: { contains: botId },
}
```

### Impact
- New knowledge entries created as "memories" (but not from conversations) are never retrieved
- Only conversation-generated and imported memories are included
- Users who create memory-type entries manually in admin won't see them

### Design Decision Needed
**Option A:** Keep memories and lore separate (current behavior is intentional)
- Memories = auto-generated from conversations, retrieved via `retrieveRelevantMemories`
- Lore = manually created knowledge, retrieved via activation engine

**Option B:** Unify retrieval to include all knowledge entries marked as memories
- Remove or relax the `is_legacy_memory` filter
- Add a `type` filter for `legacy_memory` type entries

### Fix (if Option B)
Change the where clause to query by type or collection category instead of `is_legacy_memory` flag.

---

## Issue 3: `is_vectorized: false` With No Query Filter

**Severity:** CRITICAL
**Status:** TODO
**Files:**
- `src/app/api/memories/import/route.ts:237`
- `src/app/api/migrate/memories/route.ts:124`
- `src/lib/chat/memory-service.ts` (various)

### Problem
All legacy memories are created with `is_vectorized: false`:
```typescript
is_vectorized: false, // Will need re-vectorization
```

But:
1. No retrieval function filters by this flag
2. The activation engine's vector activation mode tries to search vectors for entries that don't have them
3. Vector search results will miss these entries

### Impact
- Vector-based activation won't find legacy memories
- Entries set to `activation_mode: 'vector'` won't activate properly
- Inconsistent retrieval between vectorized and non-vectorized entries

### Fix Options
**Option A:** Run a batch vectorization job on all legacy memories
- Update `is_vectorized: true` after vectorization
- Ensures vector search works for all entries

**Option B:** Fall back to keyword matching for non-vectorized entries
- Modify activation engine to check `is_vectorized` before vector search
- Use keyword-only for `is_vectorized: false` entries

**Option C:** Change default activation_mode for legacy memories to 'keyword'
- Legacy memories without vectors use keyword matching
- New entries can use vector after vectorization

---

## Issue 4: Hardcoded Importance for Imports

**Severity:** MEDIUM
**Status:** TODO
**File:** `src/app/api/memories/import/route.ts:213-216`

### Problem
Import route uses hardcoded importance:
```typescript
tags: [
  { tag: 'imported' },
  { tag: 'importance-7' }, // <-- Always 7
]
```

While:
- Migration route preserves original importance from Memory collection
- Memory service calculates importance dynamically (1-10 scale)

### Impact
- All imported memories rank equally high (7/10)
- Retrieval ranking may not reflect actual importance
- User expectations about importance may be incorrect

### Fix
Allow importance to be specified during import, or calculate based on content length/keywords.

---

## Issue 5: Duplicate Detection Only Checks Legacy

**Severity:** MEDIUM
**Status:** TODO
**File:** `src/lib/chat/memory-service.ts:99-109`

### Problem
Duplicate detection query:
```typescript
where: {
  user: { equals: userId },
  source_conversation_id: { equals: conversationId },
  is_legacy_memory: { equals: true },  // <-- Only checks legacy
}
```

### Impact
- Duplicates can exist between legacy and non-legacy entries for the same conversation
- Memory extraction could create entries that conceptually duplicate existing lore

### Fix
Remove `is_legacy_memory` filter from duplicate detection, or check both legacy and non-legacy entries.

---

## Issue 6: Advanced Activation Fields Not Set

**Severity:** LOW
**Status:** FIX AVAILABLE
**Files:** All creation paths (import, migrate, memory-service)
**Fix Endpoint:** `/api/admin/fix/knowledge-activation`

### Problem
Legacy knowledge entries are created without:
- `activation_settings` (activation_mode, keywords, vector threshold)
- `advanced_activation` (sticky, cooldown, delay)
- `budget_control` (token_cost, ignore_budget)
- `filtering` (bot/persona include/exclude lists)
- `positioning` (where to insert in prompt)

These fields default to schema defaults but can't be customized without manual editing.

### Impact
- Activation engine may not properly activate legacy entries
- Legacy entries can't use timed effects (sticky, cooldown, delay)
- No budget control for legacy memories
- Can't exclude specific bots/personas from seeing specific memories

### Fix
Use the `/api/admin/fix/knowledge-activation` endpoint:

```bash
# Preview which entries need fixes
GET /api/admin/fix/knowledge-activation

# Fix all entries (auto mode: legacy memories → keyword, lore → vector)
POST /api/admin/fix/knowledge-activation
{ "strategy": "auto" }

# Fix specific user's entries
POST /api/admin/fix/knowledge-activation
{ "strategy": "auto", "userId": 1 }

# Dry run to preview changes
POST /api/admin/fix/knowledge-activation
{ "strategy": "auto", "dryRun": true }
```

Strategy options:
- `auto` (default): Legacy memories get `keyword` mode, regular lore gets `vector` mode
- `keyword`: All entries use keyword activation
- `vector`: All entries use vector activation
- `hybrid`: All entries use hybrid (keyword + vector) activation

---

## Completion Checklist

- [x] Issue 1: Add `use_probability: false` to import route - **DONE**
- [x] Issue 2: Decide on memory/lore separation strategy - **BY DESIGN** (separate systems)
- [x] Issue 3: Batch vectorization endpoint created - `/api/admin/fix/batch-vectorize`
- [x] Issue 4: Review importance handling - **ACCEPTABLE** as-is
- [x] Issue 5: Fix duplicate detection to check both types - **DONE**
- [x] Issue 6: Fix endpoint available - `/api/admin/fix/knowledge-activation`

---

## Notes

### Architecture Context
The system has two retrieval paths:
1. **Activation Engine** (`activation-engine.ts`) - For lore/knowledge activation using keyword/vector/hybrid modes
2. **Memory Retrieval** (`memory-service.ts`) - For legacy memories specifically

Both inject content into the system prompt via `context-builder.ts`.

### Memory Tomes
Memory tomes are KnowledgeCollections with `collection_metadata.collection_category: 'memories'`. They store:
- Auto-extracted memories from conversations
- Imported external memories
- Migrated legacy Memory collection entries

All entries in memory tomes have `is_legacy_memory: true` and `type: 'legacy_memory'`.
