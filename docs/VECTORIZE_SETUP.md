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
  tenant_id: number,
  source_type: 'knowledge' | 'memory',
  source_id: string,
  chunk_index: number,
  total_chunks: number,
  created_at: string (ISO 8601),
}
```

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

## Next Steps

After creating the indexes:

1. ✅ Vectorize indexes created
2. Deploy your worker with the bindings
3. Test embedding generation via `/api/vectors/generate`
4. Test semantic search via `/api/vectors/search`
5. Connect the UI to enable vectorization buttons

## References

- [Cloudflare Vectorize Docs](https://developers.cloudflare.com/vectorize/)
- [Cloudflare Workers AI Docs](https://developers.cloudflare.com/workers-ai/)
- [BGE-M3 Model Card](https://developers.cloudflare.com/workers-ai/models/bge-m3/)
- [Vectorize + Workers AI Tutorial](https://developers.cloudflare.com/vectorize/get-started/embeddings/)
