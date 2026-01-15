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

## Next Steps

After creating the indexes:

1. ✅ Vectorize indexes created
2. Deploy your worker with the bindings
3. ✅ Auto-vectorization enabled for vector/hybrid modes
4. Test semantic search via `/api/vectors/search`
5. ✅ UI simplified to single "Save" button (auto-vectorizes based on mode)

## References

- [Cloudflare Vectorize Docs](https://developers.cloudflare.com/vectorize/)
- [Cloudflare Workers AI Docs](https://developers.cloudflare.com/workers-ai/)
- [BGE-M3 Model Card](https://developers.cloudflare.com/workers-ai/models/bge-m3/)
- [Vectorize + Workers AI Tutorial](https://developers.cloudflare.com/vectorize/get-started/embeddings/)
