# Phase 4B.5: Real Vectorization Implementation

## Overview

This document details the implementation of **real AI-powered vectorization** using Cloudflare Workers AI (BGE-M3) and Cloudflare Vectorize for the BotCafé v2 RAG system.

## ✅ Completed Implementation

### 1. Model Selection: BGE-M3

After evaluating multiple embedding models, we selected **`@cf/baai/bge-m3`** for the following reasons:

- **Multilingual Support**: 100+ languages (essential for international bots)
- **Long Context**: 8192 tokens (16x more than bge-large, perfect for character backstories)
- **High Quality**: State-of-the-art performance on multilingual benchmarks
- **Multi-Functionality**: Supports dense, sparse, and hybrid retrieval methods
- **Dimensions**: 1024 (same as bge-large, reasonable storage cost)
- **Cloudflare Native**: Fully integrated with Workers AI ecosystem

### 2. Cloudflare Bindings Configuration

Updated `wrangler.jsonc` to include:

#### Workers AI Binding
```jsonc
"ai": {
  "binding": "AI"
}
```

#### Vectorize Binding
```jsonc
"vectorize": [
  {
    "binding": "VECTORIZE",
    "index_name": "botcafe-embeddings"
  }
]
```

Configured for all environments:
- **Development**: `botcafe-embeddings-dev`
- **Staging**: `botcafe-embeddings-staging`
- **Production**: `botcafe-embeddings-prod`

### 3. Embedding Utility Functions

Created `/src/lib/vectorization/embeddings.ts` with:

#### Core Functions:
- `generateEmbedding(ai, text)` - Single text embedding
- `generateEmbeddings(ai, texts)` - Batch embedding generation
- `insertVectors(vectorize, vectors)` - Insert vectors into Vectorize
- `searchVectors(ai, vectorize, query, filters, topK)` - Semantic search
- `deleteVectorsBySource(vectorize, sourceType, sourceId)` - Cleanup

#### TypeScript Interfaces:
- `VectorMetadata` - Metadata schema for multi-tenant filtering
- `VectorRecord` - Complete vector record structure
- `SearchFilters` - Query filtering options
- `SearchResult` - Search result format

### 4. Vector Generation API Updates

**File**: `/src/app/api/vectors/generate/route.ts`

#### What Changed:
- ✅ Integrated Workers AI for real embedding generation
- ✅ Batch processing for multiple chunks
- ✅ Real Vectorize storage instead of placeholders
- ✅ Fallback to placeholder mode for local dev without bindings
- ✅ Updated to BGE-M3 model (1024 dimensions)
- ✅ Multi-tenant isolation via metadata

#### Workflow:
1. Authenticate user (Clerk → Payload)
2. Validate source ownership
3. Chunk content using existing utilities
4. **Generate embeddings via Workers AI (BGE-M3)**
5. **Store vectors in Vectorize with metadata**
6. Create VectorRecord tracking entries in D1
7. Update source document (`is_vectorized = true`)

### 5. Semantic Search API Updates

**File**: `/src/app/api/vectors/search/route.ts`

#### What Changed:
- ✅ Integrated Workers AI for query embeddings
- ✅ Real Vectorize semantic search
- ✅ Multi-tenant filtering (users only see their own data)
- ✅ Enriched results with chunk text from D1
- ✅ Fallback to D1 text search for local dev

#### Workflow:
1. Authenticate user
2. **Generate query embedding via Workers AI**
3. **Perform semantic search in Vectorize** with filters
4. Enrich results with chunk text from D1 VectorRecords
5. Return ranked results with similarity scores

### 6. Setup Documentation

Created `/docs/VECTORIZE_SETUP.md` with:
- Step-by-step Vectorize index creation commands
- Environment-specific configuration
- BGE-M3 model details
- Metadata schema documentation
- Cost considerations
- Troubleshooting guide

## Architecture

### Data Flow

```
User creates knowledge entry
    ↓
Knowledge saved to D1 (Payload CMS)
    ↓
User clicks "Vectorize"
    ↓
/api/vectors/generate
    ↓
1. Chunk text (8192 token chunks via BGE-M3 context window)
    ↓
2. Generate embeddings (Workers AI - BGE-M3)
    ↓
3. Store in Vectorize (1024-dim vectors with metadata)
    ↓
4. Create VectorRecords in D1 (tracking)
    ↓
5. Mark entry as vectorized
```

### Search Flow

```
User searches knowledge
    ↓
/api/vectors/search
    ↓
1. Generate query embedding (Workers AI - BGE-M3)
    ↓
2. Search Vectorize (cosine similarity, filtered by tenant_id)
    ↓
3. Retrieve top-K results
    ↓
4. Enrich with chunk text from D1
    ↓
5. Return ranked results with scores
```

## Multi-Tenancy

All vectors are isolated by `tenant_id` (user ID):

```typescript
metadata: {
  tenant_id: payloadUser.id,  // Ensures data isolation
  user_id: payloadUser.id,
  type: 'lore' | 'memory' | 'legacy_memory',
  source_type: 'knowledge' | 'memory',
  source_id: '123',
  // ... other metadata
}
```

Searches automatically filter by `tenant_id` to ensure users only see their own data.

## Local Development Support

Since Cloudflare bindings are only available in Workers/Pages environment, we implemented **fallback placeholders** for local development:

### Fallback Behavior:
- **Vector Generation**: Creates VectorRecord entries in D1 without real embeddings
- **Search**: Returns most recent VectorRecords (not semantic search)
- **Warning Messages**: Clearly indicates placeholder mode

### Production Detection:
```typescript
const ai = (global as any).__env?.AI
const vectorize = (global as any).__env?.VECTORIZE

if (!ai || !vectorize) {
  // Use placeholder implementation
  return await createPlaceholderVectors(...)
}
```

## Next Steps

### Before Production Deployment:

1. **Create Vectorize Indexes**:
   ```bash
   wrangler vectorize create botcafe-embeddings-dev --dimensions=1024 --metric=cosine
   wrangler vectorize create botcafe-embeddings-staging --dimensions=1024 --metric=cosine
   wrangler vectorize create botcafe-embeddings-prod --dimensions=1024 --metric=cosine
   ```

2. **Deploy with Bindings**:
   ```bash
   wrangler deploy --env development
   ```

3. **Test Workflow**:
   - Create a knowledge entry
   - Click "Vectorize" button (UI to be added)
   - Verify embeddings in Vectorize dashboard
   - Test semantic search

### Still TODO:

- [ ] Add "Vectorize" button to lore entries UI
- [ ] Display vectorization status badges
- [ ] Add semantic search UI in lore dashboard
- [ ] Test end-to-end workflow in deployed environment
- [ ] Monitor Workers AI usage and costs
- [ ] Optimize batch sizes for performance

## Technical Specifications

| Component | Details |
|-----------|---------|
| **Embedding Model** | `@cf/baai/bge-m3` |
| **Dimensions** | 1024 |
| **Max Context** | 8192 tokens |
| **Distance Metric** | Cosine similarity |
| **Languages** | 100+ |
| **Chunking Strategy** | Paragraph-based with 8192 token limit |
| **Multi-tenancy** | Metadata filtering by `tenant_id` |
| **Fallback** | Placeholder mode for local dev |

## Cost Estimation

### Workers AI (BGE-M3):
- Charged per token processed
- ~$0.001 per 1000 tokens (estimate)
- 8192 token chunks = maximum efficiency

### Vectorize:
- Storage: ~$0.040 per 1M dimensions per month
- Queries: ~$0.040 per 1M queries
- For 1000 knowledge entries with 3 chunks each (3000 vectors × 1024 dims = 3M dimensions):
  - Storage: ~$0.12/month
  - Very reasonable for startup/MVP

## Files Modified/Created

### Created:
- `/src/lib/vectorization/embeddings.ts` - Core embedding utilities
- `/docs/VECTORIZE_SETUP.md` - Setup documentation
- `/docs/PHASE_4B5_VECTORIZATION_IMPLEMENTATION.md` - This file

### Modified:
- `/wrangler.jsonc` - Added AI and Vectorize bindings
- `/src/app/api/vectors/generate/route.ts` - Real Workers AI integration
- `/src/app/api/vectors/search/route.ts` - Real semantic search

## References

- [Cloudflare Workers AI Docs](https://developers.cloudflare.com/workers-ai/)
- [BGE-M3 Model Card](https://developers.cloudflare.com/workers-ai/models/bge-m3/)
- [Vectorize Documentation](https://developers.cloudflare.com/vectorize/)
- [BGE-M3 on Hugging Face](https://huggingface.co/BAAI/bge-m3)
