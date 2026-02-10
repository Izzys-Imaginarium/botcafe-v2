# Cloudflare Vectorize Setup Guide

This guide walks you through setting up Cloudflare Vectorize indexes for the BotCafé v2 RAG system.

## Overview

BotCafé uses:
- **Cloudflare Workers AI** for generating embeddings (BGE-M3 model)
- **Cloudflare Vectorize** for storing and searching vector embeddings
- **Dimensions**: 1024 (BGE-M3 output size)
- **Max Context**: 8192 tokens

## Prerequisites

1. Cloudflare account with Workers AI enabled
2. Wrangler CLI installed: `npm install -g wrangler`
3. Authenticated with Wrangler: `wrangler login`

## Creating Vectorize Indexes

You need to create separate indexes for each environment (development, staging, production).

### Development Environment

```bash
wrangler vectorize create botcafe-embeddings-dev \
  --dimensions=1024 \
  --metric=cosine
```

### Staging Environment

```bash
wrangler vectorize create botcafe-embeddings-staging \
  --dimensions=1024 \
  --metric=cosine
```

### Production Environment

```bash
wrangler vectorize create botcafe-embeddings-prod \
  --dimensions=1024 \
  --metric=cosine
```

## Configuration Details

- **Index Names**:
  - Development: `botcafe-embeddings-dev`
  - Staging: `botcafe-embeddings-staging`
  - Production: `botcafe-embeddings-prod`

- **Dimensions**: `1024` (required for BGE-M3 model)
- **Metric**: `cosine` (best for semantic similarity)

## Verifying Indexes

List all your Vectorize indexes:

```bash
wrangler vectorize list
```

Get details about a specific index:

```bash
wrangler vectorize get botcafe-embeddings-dev
```

## BGE-M3 Model Configuration

The BGE-M3 model is accessed via Cloudflare Workers AI:

- **Model ID**: `@cf/baai/bge-m3`
- **Output Dimensions**: 1024
- **Max Input Tokens**: 8192
- **Languages Supported**: 100+
- **Retrieval Methods**: Dense, Sparse, Multi-vector

## Metadata Schema

Each vector in Vectorize stores the following metadata:

```typescript
{
  type: 'lore' | 'memory' | 'legacy_memory',
  user_id: number,
  tenant_id: string,        // MUST BE STRING - use String(userId)
  source_type: 'knowledge' | 'memory',
  source_id: string,        // MUST BE STRING - use String(sourceId)
  chunk_index: number,
  total_chunks: number,
  created_at: string (ISO 8601),
}
```

> **Critical Type Requirements:**
> - `tenant_id` MUST be a string (convert with `String(userId)`)
> - `source_id` MUST be a string (convert with `String(sourceId)`)
> - D1 columns expect text type, not numeric

## Usage in Code

The bindings are configured in `wrangler.jsonc`:

```typescript
// Access Workers AI for embeddings
const ai = env.AI
const embeddings = await ai.run('@cf/baai/bge-m3', {
  text: 'Your text here'
})

// Access Vectorize for storage/search
const vectorize = env.VECTORIZE
await vectorize.insert([
  {
    id: 'unique-id',
    values: embeddings.data[0],
    metadata: { /* your metadata */ }
  }
])
```

## Cost Considerations

### Workers AI Pricing
- BGE-M3 embeddings are charged per token processed
- 8192 token context means you can process long documents efficiently
- Check current pricing: https://developers.cloudflare.com/workers-ai/platform/pricing/

### Vectorize Pricing
- Charged per query and per vector stored
- 1024 dimensions = moderate storage cost
- Multi-tenancy via metadata keeps costs manageable
- Check current pricing: https://developers.cloudflare.com/vectorize/platform/pricing/

## Troubleshooting

### Error: "Index already exists"
If you see this error, the index was already created. You can either:
- Use the existing index
- Delete and recreate: `wrangler vectorize delete <index-name>`

### Error: "Dimensions mismatch"
Ensure your Vectorize index dimensions (1024) match the BGE-M3 output dimensions (1024).

### Error: "Binding not found"
Make sure you've deployed your worker after updating `wrangler.jsonc`:
```bash
wrangler deploy --env development
```

### Error: "The following fields are invalid: Source_id, Tenant_id"
This error occurs when numeric values are passed instead of strings.

**Solution:** Ensure you convert IDs to strings:
```typescript
const tenant_id = String(payloadUser.id)  // NOT payloadUser.id directly
const source_id = String(sourceId)         // NOT sourceId directly
```

### Error: "D1_ERROR: too many SQL variables"
This error occurs when Payload tries to insert too many parameters in a single SQL statement.

**Common causes and solutions:**

1. **Metadata object expansion**: Use `JSON.stringify(metadata)` instead of passing the object directly:
```typescript
// WRONG
data: { metadata: metadata }

// CORRECT
data: { metadata: JSON.stringify(metadata) }
```

2. **hasMany relationship updates**: Don't update relationships with large arrays:
```typescript
// WRONG - causes parameter overflow with many vector records
await payload.update({
  collection: 'knowledge',
  id: sourceId,
  data: {
    vector_records: vectorRecordIds,  // Can have many IDs!
  },
})

// CORRECT - query VectorRecords by source_id instead
const vectorRecords = await payload.find({
  collection: 'vectorRecords',
  where: { source_id: { equals: String(sourceId) } },
})
```

### Error: "SQLITE_ERROR: no such table: main.creator_programs"
This occurs when a foreign key reference points to a non-existent table.

**Solution:** If you've removed a collection but the `payload_locked_documents_rels` table still references it, recreate the table without the orphan column. See `.wrangler/fix-payload-locked-documents-rels.sql` for an example migration.

### Error: "delete from 'knowledge' where id = ?" failing
This is usually caused by foreign key constraints. Check:
1. Does `memory.lore_entry_id` have `ON DELETE SET NULL`?
2. Are there orphan foreign key references in `payload_locked_documents_rels`?

## Auto-Vectorization Behavior 🆕

As of 2026-01-15, knowledge entries with **vector** or **hybrid** activation modes are **automatically vectorized** when saved. There is no longer a separate "Vectorize" button in the UI.

### How It Works

- **On Create:** Entries with vector/hybrid mode are vectorized immediately after creation
- **On Update:** If content changes, old vectors are deleted and new ones generated
- **On Delete:** All associated vectors are automatically cleaned up
- **Mode Change:** Changing to vector/hybrid triggers vectorization; changing away deletes vectors

### Embedding Storage

VectorRecords now include an `embedding` field that stores the actual vector values in D1. This enables:
- Metadata updates without regenerating embeddings
- Debugging and inspection of vectors
- Recovery if Vectorize needs to be repopulated

## Vector Sync Check Tool 🆕

The `/api/admin/vector-sync-check` endpoint helps detect and fix mismatches between knowledge entries and their vector records.

### Checking for Issues (GET)

```bash
# Check for sync issues (requires authentication)
curl -X GET "https://your-domain.com/api/admin/vector-sync-check" \
  -H "Cookie: your-auth-cookie"
```

**Response example:**
```json
{
  "success": true,
  "timestamp": "2026-01-15T22:30:00.000Z",
  "summary": {
    "totalKnowledgeEntries": 10,
    "totalVectorRecords": 15,
    "entriesThatShouldBeVectorized": 8,
    "entriesMarkedAsVectorized": 7,
    "issuesFound": 2
  },
  "issues": [
    {
      "type": "missing_vectors",
      "knowledgeId": 5,
      "description": "Knowledge entry 5 has activation_mode=\"vector\" but no vector records exist"
    },
    {
      "type": "orphaned_vectors",
      "vectorId": "vec_knowledge_99_chunk_0_...",
      "description": "Vector record references non-existent knowledge entry 99"
    }
  ]
}
```

### Issue Types Detected

| Issue Type | Description |
|------------|-------------|
| `missing_vectors` | Entry should be vectorized (vector/hybrid mode) but has no vectors |
| `orphaned_vectors` | Vector records exist for deleted/non-existent knowledge entries |
| `chunk_count_mismatch` | Knowledge `chunk_count` field doesn't match actual vector count |
| `stale_vectors` | Knowledge entry was updated after its vectors were created |

### Fixing Issues (POST)

**Delete orphaned vectors:**
```bash
curl -X POST "https://your-domain.com/api/admin/vector-sync-check" \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{"action": "delete_orphaned_vectors", "vectorId": "vec_knowledge_99_chunk_0_..."}'
```

**Re-vectorize a knowledge entry:**
```bash
curl -X POST "https://your-domain.com/api/admin/vector-sync-check" \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{"action": "revectorize", "knowledgeId": 5}'
```

**Fix chunk count mismatch:**
```bash
curl -X POST "https://your-domain.com/api/admin/vector-sync-check" \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{"action": "fix_chunk_count", "knowledgeId": 5}'
```

### Available Actions

| Action | Required Params | Description |
|--------|-----------------|-------------|
| `delete_orphaned_vectors` | `vectorId` | Deletes orphaned vector from D1 and Vectorize |
| `revectorize` | `knowledgeId` | Deletes existing vectors and re-generates them |
| `fix_chunk_count` | `knowledgeId` | Updates `chunk_count` to match actual vector count |

### When to Use

Run the sync check:
- After database migrations
- If you suspect data inconsistencies
- After bulk operations on knowledge entries
- Periodically as part of maintenance

---

## Metadata Indexes

Vectorize supports **metadata filtering** to scope queries to specific subsets of vectors. BotCafé uses the following metadata indexes:

| Index Name | Type | Purpose |
|------------|------|---------|
| `source_id` | `String` | Filter vectors by knowledge entry ID for bot-scoped search |

### Creating Metadata Indexes

```bash
# Create the source_id index (required for bot-scoped vector search)
wrangler vectorize create-metadata-index botcafe-embeddings-dev \
  --property-name=source_id \
  --type=string

# Repeat for staging/production
wrangler vectorize create-metadata-index botcafe-embeddings-staging \
  --property-name=source_id \
  --type=string

wrangler vectorize create-metadata-index botcafe-embeddings-prod \
  --property-name=source_id \
  --type=string
```

### Listing Metadata Indexes

```bash
wrangler vectorize list-metadata-index botcafe-embeddings-dev
```

> **Important:** Cloudflare Vectorize does **not** retroactively index existing vectors when a new metadata index is created. Vectors inserted before the index was created will not be filterable by that metadata property. Use the `/api/vectors/reindex` endpoint to re-insert existing vectors so they pick up new indexes.

---

## Vector Reindex Tool

The `/api/vectors/reindex` endpoint re-inserts existing vectors from D1 into Vectorize so they pick up newly created metadata indexes. **No AI calls are needed** — it reads stored embeddings from D1.

### Usage

```bash
# Reindex a batch of 50 vectors starting from offset 0
curl -X POST "https://your-domain.com/api/vectors/reindex?batch_size=50&offset=0" \
  -H "Cookie: your-auth-cookie"
```

### Query Parameters

| Parameter | Default | Max | Description |
|-----------|---------|-----|-------------|
| `batch_size` | 50 | 100 | Number of vectors to process per call |
| `offset` | 0 | — | Row offset for resuming from a previous batch |

### Response

```json
{
  "message": "Re-indexed 48 vectors",
  "offset": 0,
  "processed": 48,
  "skipped": 2,
  "nextOffset": 50,
  "batchSize": 50,
  "done": false
}
```

### Batch Processing Script

To reindex all vectors, run this in the browser console:

```javascript
async function reindexAll(batchSize = 50) {
  let offset = 0, total = 0;
  while (true) {
    const res = await fetch(`/api/vectors/reindex?batch_size=${batchSize}&offset=${offset}`, { method: 'POST' });
    const data = await res.json();
    console.log(`Batch: offset=${offset}, processed=${data.processed}, skipped=${data.skipped}`);
    total += data.processed;
    if (data.done) break;
    offset = data.nextOffset;
  }
  console.log(`Done! Total re-indexed: ${total}`);
}
reindexAll();
```

> **Access:** Admin only (user ID 1). Requires authentication.

---

## Next Steps

After creating the indexes:

1. ✅ Vectorize indexes created
2. Deploy your worker with the bindings
3. ✅ Auto-vectorization enabled for vector/hybrid modes
4. Test semantic search via `/api/vectors/search`
5. ✅ UI simplified to single "Save" button (auto-vectorizes based on mode)
6. ✅ Vector sync check tool available at `/api/admin/vector-sync-check`
7. ✅ Metadata indexes created for bot-scoped vector search
8. ✅ Reindex tool available at `/api/vectors/reindex`

## References

- [Cloudflare Vectorize Docs](https://developers.cloudflare.com/vectorize/)
- [Cloudflare Workers AI Docs](https://developers.cloudflare.com/workers-ai/)
- [BGE-M3 Model Card](https://developers.cloudflare.com/workers-ai/models/bge-m3/)
- [Vectorize + Workers AI Tutorial](https://developers.cloudflare.com/vectorize/get-started/embeddings/)
