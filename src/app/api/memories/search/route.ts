import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { generateEmbedding } from '@/lib/vectorization/embeddings'

export const dynamic = 'force-dynamic'

/**
 * POST /api/memories/search
 *
 * Search conversation memories using semantic search.
 * Returns relevant memories based on query similarity.
 *
 * Request body:
 * - query: string (required) - Search query
 * - botId?: string - Filter by specific bot
 * - personaId?: string - Filter by specific persona
 * - memoryType?: 'short_term' | 'long_term' | 'consolidated' - Filter by memory type
 * - limit?: number - Max results (default: 10)
 * - minRelevance?: number - Minimum similarity score 0-1 (default: 0.7)
 *
 * Response:
 * - success: boolean
 * - results: Array of memory objects with relevance scores
 * - count: number
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get request body
    const body = (await request.json()) as {
      query?: string
      botId?: string
      personaId?: string
      memoryType?: 'short_term' | 'long_term' | 'consolidated'
      limit?: number
      minRelevance?: number
    }
    const {
      query,
      botId,
      personaId,
      memoryType,
      limit = 10,
      minRelevance = 0.7,
    } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, message: 'query is required and must be a string' },
        { status: 400 }
      )
    }

    // Get Payload instance
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Find user in Payload
    const users = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: clerkUser.emailAddresses[0]?.emailAddress,
        },
      },
      overrideAccess: true,
    })

    if (users.docs.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found in database' },
        { status: 404 }
      )
    }

    const payloadUser = users.docs[0]

    // Get AI binding for embedding generation
    const ai = (process.env as any).AI

    if (!ai) {
      console.warn('AI binding not available, cannot perform semantic search')
      return NextResponse.json({
        success: false,
        message: 'AI binding not available for semantic search',
      }, { status: 503 })
    }

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(ai, query)

    // Build metadata filter for Vectorize
    const metadataFilter: any = {
      source_type: 'memory',
      tenant_id: clerkUser.id,
    }

    if (botId) {
      metadataFilter.bot_id = botId
    }

    if (memoryType) {
      metadataFilter.memory_type = memoryType
    }

    // Search Vectorize
    const vectorize = (process.env as any).VECTORIZE_INDEX

    let vectorResults: any[] = []

    if (vectorize) {
      const searchResults = await vectorize.query(queryEmbedding, {
        topK: limit * 3, // Get more results to filter and deduplicate
        filter: metadataFilter,
        returnMetadata: true,
      })

      vectorResults = searchResults.matches || []
    } else {
      // Fallback: search without Vectorize (development mode)
      console.warn('Vectorize not available, returning empty results')
    }

    // Filter by minimum relevance score
    const relevantResults = vectorResults.filter(
      (result: any) => result.score >= minRelevance
    )

    // Group by source_id to get unique memories
    const memoryMap = new Map<string, any>()

    for (const result of relevantResults) {
      const sourceId = result.metadata?.source_id
      if (!sourceId) continue

      // Keep the highest scoring chunk for each memory
      if (!memoryMap.has(sourceId) || memoryMap.get(sourceId).score < result.score) {
        memoryMap.set(sourceId, {
          memoryId: sourceId,
          score: result.score,
          chunk: result.metadata?.chunk_text || '',
          metadata: result.metadata,
        })
      }
    }

    // Get the top N unique memories
    const topMemories = Array.from(memoryMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    // Fetch full memory objects from database
    const memoryIds = topMemories.map((m) => m.memoryId)

    if (memoryIds.length === 0) {
      return NextResponse.json({
        success: true,
        results: [],
        count: 0,
        message: 'No relevant memories found',
      })
    }

    const memories = await payload.find({
      collection: 'memory',
      where: {
        id: {
          in: memoryIds,
        },
      },
    })

    // Combine memory data with relevance scores
    const results = topMemories.map((topMem) => {
      const memoryDoc = memories.docs.find((m) => m.id === topMem.memoryId)
      return {
        ...memoryDoc,
        relevanceScore: topMem.score,
        matchingChunk: topMem.chunk,
      }
    })

    // Apply persona filter if provided (post-processing since it's in JSON field)
    let filteredResults = results
    if (personaId) {
      filteredResults = results.filter((mem: any) => {
        const participants = mem.participants || { personas: [], bots: [] }
        return participants.personas?.includes(personaId)
      })
    }

    return NextResponse.json({
      success: true,
      results: filteredResults,
      count: filteredResults.length,
      query: query,
      filters: {
        botId,
        personaId,
        memoryType,
        minRelevance,
      },
    })

  } catch (error: any) {
    console.error('Memory search error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to search memories' },
      { status: 500 }
    )
  }
}
