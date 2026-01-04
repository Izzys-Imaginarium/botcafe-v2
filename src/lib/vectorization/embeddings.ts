/**
 * Cloudflare Workers AI Embedding Utilities
 *
 * Uses BGE-M3 model for generating multilingual embeddings with 8192 token context
 */

export const BGE_M3_MODEL = '@cf/baai/bge-m3'
export const BGE_M3_DIMENSIONS = 1024
export const BGE_M3_MAX_TOKENS = 8192

/**
 * Generate embeddings using Cloudflare Workers AI (BGE-M3)
 *
 * @param ai - Cloudflare AI binding from environment
 * @param text - Text to generate embeddings for (max 8192 tokens)
 * @returns Array of 1024-dimensional embeddings
 */
export async function generateEmbedding(ai: any, text: string): Promise<number[]> {
  if (!ai) {
    throw new Error('Workers AI binding not available. Ensure AI binding is configured in wrangler.jsonc')
  }

  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty')
  }

  try {
    // Call Workers AI with BGE-M3 model
    const response = await ai.run(BGE_M3_MODEL, {
      text: [text], // BGE-M3 accepts array of texts
    })

    // Response format: { data: [[...1024 floats]] }
    if (!response || !response.data || !response.data[0]) {
      throw new Error('Invalid response from Workers AI')
    }

    const embedding = response.data[0]

    // Verify dimensions
    if (embedding.length !== BGE_M3_DIMENSIONS) {
      throw new Error(
        `Expected ${BGE_M3_DIMENSIONS} dimensions, got ${embedding.length}`
      )
    }

    return embedding
  } catch (error: any) {
    console.error('Error generating embedding with Workers AI:', error)
    throw new Error(`Failed to generate embedding: ${error.message}`)
  }
}

/**
 * Generate embeddings for multiple texts in batch
 *
 * @param ai - Cloudflare AI binding
 * @param texts - Array of texts to embed
 * @returns Array of embeddings
 */
export async function generateEmbeddings(
  ai: any,
  texts: string[]
): Promise<number[][]> {
  if (!texts || texts.length === 0) {
    throw new Error('Texts array cannot be empty')
  }

  try {
    // BGE-M3 supports batch processing
    const response = await ai.run(BGE_M3_MODEL, {
      text: texts,
    })

    if (!response || !response.data) {
      throw new Error('Invalid response from Workers AI')
    }

    return response.data
  } catch (error: any) {
    console.error('Error generating embeddings in batch:', error)
    throw new Error(`Failed to generate embeddings: ${error.message}`)
  }
}

/**
 * Vector metadata for Vectorize storage
 */
export interface VectorMetadata {
  type: 'lore' | 'memory' | 'legacy_memory' | 'document'
  user_id: number
  tenant_id: number
  source_type: 'knowledge' | 'memory'
  source_id: string
  chunk_index: number
  total_chunks: number
  created_at: string
  // Optional fields for filtering
  applies_to_bots?: number[]
  applies_to_personas?: number[]
  tags?: string[]
}

/**
 * Vector record for Vectorize insert
 */
export interface VectorRecord {
  id: string
  values: number[]
  metadata: VectorMetadata
}

/**
 * Insert vectors into Cloudflare Vectorize
 *
 * @param vectorize - Vectorize binding from environment
 * @param vectors - Array of vector records to insert
 */
export async function insertVectors(
  vectorize: any,
  vectors: VectorRecord[]
): Promise<void> {
  if (!vectorize) {
    throw new Error('Vectorize binding not available. Ensure VECTORIZE binding is configured in wrangler.jsonc')
  }

  if (!vectors || vectors.length === 0) {
    throw new Error('Vectors array cannot be empty')
  }

  try {
    await vectorize.insert(vectors)
  } catch (error: any) {
    console.error('Error inserting vectors into Vectorize:', error)
    throw new Error(`Failed to insert vectors: ${error.message}`)
  }
}

/**
 * Search filters for Vectorize queries
 */
export interface SearchFilters {
  type?: 'lore' | 'memory' | 'legacy_memory' | 'document'
  user_id?: number
  tenant_id?: number
  source_type?: 'knowledge' | 'memory'
  applies_to_bots?: number[]
  applies_to_personas?: number[]
  tags?: string[]
}

/**
 * Search result from Vectorize
 */
export interface SearchResult {
  id: string
  score: number
  metadata: VectorMetadata
}

/**
 * Perform semantic search in Vectorize
 *
 * @param ai - Workers AI binding for query embedding
 * @param vectorize - Vectorize binding for search
 * @param query - Search query text
 * @param filters - Optional metadata filters
 * @param topK - Number of results to return (default: 5)
 * @returns Array of search results with scores
 */
export async function searchVectors(
  ai: any,
  vectorize: any,
  query: string,
  filters?: SearchFilters,
  topK: number = 5
): Promise<SearchResult[]> {
  if (!query || query.trim().length === 0) {
    throw new Error('Query cannot be empty')
  }

  try {
    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(ai, query)

    // Build filter object for Vectorize
    const vectorizeFilter: Record<string, any> = {}

    if (filters) {
      if (filters.type) vectorizeFilter.type = filters.type
      if (filters.user_id) vectorizeFilter.user_id = filters.user_id
      if (filters.tenant_id) vectorizeFilter.tenant_id = filters.tenant_id
      if (filters.source_type) vectorizeFilter.source_type = filters.source_type
    }

    // Perform vector search
    const results = await vectorize.query(queryEmbedding, {
      topK,
      filter: Object.keys(vectorizeFilter).length > 0 ? vectorizeFilter : undefined,
      returnMetadata: true,
    })

    // Transform results to our format
    return results.matches.map((match: any) => ({
      id: match.id,
      score: match.score,
      metadata: match.metadata,
    }))
  } catch (error: any) {
    console.error('Error searching vectors:', error)
    throw new Error(`Failed to search vectors: ${error.message}`)
  }
}

/**
 * Delete vectors by source ID
 *
 * @param vectorize - Vectorize binding
 * @param sourceType - Type of source ('knowledge' or 'memory')
 * @param sourceId - ID of the source document
 */
export async function deleteVectorsBySource(
  vectorize: any,
  sourceType: 'knowledge' | 'memory',
  sourceId: string
): Promise<void> {
  if (!vectorize) {
    throw new Error('Vectorize binding not available')
  }

  try {
    // Query for all vectors with this source
    const results = await vectorize.query(
      new Array(BGE_M3_DIMENSIONS).fill(0), // Dummy vector for filtering
      {
        topK: 10000, // Get all matches
        filter: {
          source_type: sourceType,
          source_id: sourceId,
        },
        returnMetadata: false,
      }
    )

    // Delete each vector by ID
    const vectorIds = results.matches.map((match: any) => match.id)

    if (vectorIds.length > 0) {
      await vectorize.deleteByIds(vectorIds)
    }
  } catch (error: any) {
    console.error('Error deleting vectors by source:', error)
    throw new Error(`Failed to delete vectors: ${error.message}`)
  }
}
