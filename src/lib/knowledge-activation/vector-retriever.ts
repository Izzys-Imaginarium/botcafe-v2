/**
 * Vector Retriever
 *
 * Enhanced vector search for knowledge activation with:
 * - Similarity threshold filtering
 * - Bot/persona/user filtering
 * - Result limiting
 * - Integration with existing vectorization system
 */

import type { Knowledge } from '@/payload-types'
import type { VectorSearchOptions, VectorSearchResult } from './types'
import { VectorSearchError } from './types'

export class VectorRetriever {
  /**
   * Retrieve relevant knowledge entries using vector similarity search
   */
  async retrieveRelevant(
    queryText: string,
    options: VectorSearchOptions,
    env: {
      VECTORIZE?: any
      AI?: any
    },
  ): Promise<
    Array<{
      entry: Knowledge
      similarity: number
      chunkIndex: number
      chunkText: string
    }>
  > {
    try {
      // Generate embedding for query
      const embedding = await this.generateEmbedding(queryText, env)

      // Search vector database
      const results = await this.searchVectorize(embedding, options, env)

      // Filter by similarity threshold
      const filtered = results.filter((r) => r.similarity >= options.similarityThreshold)

      // Limit results
      const limited = filtered.slice(0, options.maxResults)

      return limited
    } catch (error) {
      throw new VectorSearchError('Failed to retrieve relevant knowledge', {
        error,
        queryText,
        options,
      })
    }
  }

  /**
   * Generate embedding for text using Workers AI
   */
  private async generateEmbedding(
    text: string,
    env: { AI?: any },
  ): Promise<number[]> {
    if (!env.AI) {
      throw new VectorSearchError('Workers AI binding not available')
    }

    try {
      const response = await env.AI.run('@cf/baai/bge-m3', {
        text,
      })

      if (!response?.data?.[0]) {
        throw new Error('No embedding returned from Workers AI')
      }

      return response.data[0]
    } catch (error) {
      throw new VectorSearchError('Failed to generate embedding', { error, text })
    }
  }

  /**
   * Search Cloudflare Vectorize
   */
  private async searchVectorize(
    embedding: number[],
    options: VectorSearchOptions,
    env: { VECTORIZE?: any },
  ): Promise<VectorSearchResult[]> {
    if (!env.VECTORIZE) {
      throw new VectorSearchError('Vectorize binding not available')
    }

    try {
      // Build metadata filter
      const filter: Record<string, any> = {}

      if (options.filters.userId) {
        filter.user_id = options.filters.userId
      }

      // Note: Bot/persona filtering happens at the application level
      // because Vectorize metadata doesn't store bot/persona associations
      // Those are stored in the Knowledge collection's applies_to_bots/applies_to_personas fields

      // Query Vectorize
      const results = await env.VECTORIZE.query(embedding, {
        topK: options.maxResults * 2, // Fetch more to account for filtering
        filter: Object.keys(filter).length > 0 ? filter : undefined,
        returnMetadata: true,
        returnValues: false,
      })

      if (!results?.matches) {
        return []
      }

      // Map results to our format
      return results.matches.map((match: any) => ({
        entryId: match.metadata?.source_id || match.id,
        similarity: match.score || 0,
        chunkIndex: match.metadata?.chunk_index || 0,
        chunkText: match.metadata?.chunk_text || '',
      }))
    } catch (error) {
      throw new VectorSearchError('Vectorize query failed', { error, options })
    }
  }

  /**
   * Batch retrieve multiple entries efficiently
   */
  async batchRetrieve(
    queries: string[],
    options: VectorSearchOptions,
    env: { VECTORIZE?: any; AI?: any },
  ): Promise<Map<string, VectorSearchResult[]>> {
    const results = new Map<string, VectorSearchResult[]>()

    // Process queries in parallel
    await Promise.all(
      queries.map(async (query) => {
        try {
          const queryResults = await this.retrieveRelevant(query, options, env)
          results.set(query, queryResults)
        } catch (error) {
          console.error(`Batch retrieve failed for query "${query}":`, error)
          results.set(query, [])
        }
      }),
    )

    return results
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a vector retriever instance
 */
export function createVectorRetriever(): VectorRetriever {
  return new VectorRetriever()
}

/**
 * Quick search function for convenience
 */
export async function searchVectors(
  queryText: string,
  options: VectorSearchOptions,
  env: { VECTORIZE?: any; AI?: any },
): Promise<VectorSearchResult[]> {
  const retriever = new VectorRetriever()
  const results = await retriever.retrieveRelevant(queryText, options, env)
  return results.map((r) => ({
    entryId: r.entry.id as string,
    similarity: r.similarity,
    chunkIndex: r.chunkIndex,
    chunkText: r.chunkText,
  }))
}
