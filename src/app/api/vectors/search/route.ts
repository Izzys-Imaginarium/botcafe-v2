import { NextRequest, NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import { currentUser } from '@clerk/nextjs/server'
import config from '@payload-config'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { searchVectors, SearchFilters } from '@/lib/vectorization/embeddings'

export const dynamic = 'force-dynamic'

/**
 * POST /api/vectors/search
 *
 * Semantic search across vectorized content
 *
 * Request body:
 * {
 *   query: string (search query)
 *   filters?: {
 *     type?: 'lore' | 'memory' | 'legacy_memory'
 *     applies_to_bots?: string[] (bot IDs)
 *     applies_to_personas?: string[] (persona IDs)
 *   }
 *   topK?: number (number of results, default: 5)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Get current Clerk user
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const payload = await getPayloadHMR({ config })

    // Find Payload user by email
    const payloadUsers = await payload.find({
      collection: 'users',
      where: {
        email: { equals: clerkUser.emailAddresses[0]?.emailAddress },
      },
      limit: 1,
    })

    if (payloadUsers.docs.length === 0) {
      return NextResponse.json({
        query: '',
        results: [],
        total_results: 0,
        message: 'User not synced yet',
      })
    }

    const payloadUser = payloadUsers.docs[0]

    // Parse request body
    const body = (await request.json()) as {
      query?: string
      filters?: {
        type?: 'lore' | 'memory' | 'legacy_memory'
        applies_to_bots?: string[]
        applies_to_personas?: string[]
      }
      topK?: number
    }
    const { query, filters = {}, topK = 5 } = body

    // Validate inputs
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ message: 'Missing or invalid query' }, { status: 400 })
    }

    // Get Cloudflare bindings from OpenNext context
    let ai: any
    let vectorize: any
    try {
      const { env } = await getCloudflareContext()
      ai = env.AI
      vectorize = env.VECTORIZE
    } catch (e) {
      console.warn('Failed to get Cloudflare context:', e)
    }

    if (!ai || !vectorize) {
      // Fallback: Return placeholder results if bindings not available (local dev)
      console.warn('AI or Vectorize binding not available. Returning placeholder results.')
      return await searchPlaceholder(payload, payloadUser.id, query, filters, topK)
    }

    // Build search filters for multi-tenant isolation
    const searchFilters: SearchFilters = {
      tenant_id: payloadUser.id, // Ensure users only search their own data
      type: filters.type,
      applies_to_bots: filters.applies_to_bots?.map(id => typeof id === 'string' ? parseInt(id) : id),
      applies_to_personas: filters.applies_to_personas?.map(id => typeof id === 'string' ? parseInt(id) : id),
    }

    // Perform semantic search using Workers AI + Vectorize
    const results = await searchVectors(ai, vectorize, query, searchFilters, topK)

    // Enrich results with chunk text from D1
    const enrichedResults = await Promise.all(
      results.map(async (result) => {
        try {
          // Find the VectorRecord in D1 to get chunk text
          const vectorRecords = await payload.find({
            collection: 'vectorRecords' as any,
            where: {
              vector_id: { equals: result.id },
            },
            limit: 1,
          })

          const vectorRecord = vectorRecords.docs[0]

          return {
            chunk_text: vectorRecord?.chunk_text || '(Text not found)',
            metadata: result.metadata,
            score: result.score,
            vector_record_id: vectorRecord?.id || result.id,
          }
        } catch (error) {
          console.error('Error enriching result:', error)
          return {
            chunk_text: '(Error retrieving text)',
            metadata: result.metadata,
            score: result.score,
            vector_record_id: result.id,
          }
        }
      })
    )

    return NextResponse.json({
      query,
      results: enrichedResults,
      total_results: enrichedResults.length,
      filters_applied: searchFilters,
    })
  } catch (error: any) {
    console.error('Error searching vectors:', error)
    return NextResponse.json({ message: error.message || 'Failed to search vectors' }, { status: 500 })
  }
}

/**
 * Fallback search for local development without Cloudflare bindings
 * Returns basic text search results from D1 VectorRecords
 */
async function searchPlaceholder(
  payload: any,
  userId: number,
  query: string,
  filters: any,
  topK: number
) {
  // Build where clause for filtering vector records
  const whereClause: any = {
    user_id: { equals: userId },
  }

  // Fetch recent vector records as placeholder results
  const vectorRecords = await payload.find({
    collection: 'vectorRecords' as any,
    where: whereClause,
    limit: topK,
    sort: '-createdAt',
  })

  const results = vectorRecords.docs.map((record: any, index: number) => ({
    chunk_text: record.chunk_text,
    metadata: record.metadata,
    score: 1.0 - index * 0.1, // Mock similarity score
    vector_record_id: record.id,
  }))

  return NextResponse.json({
    query,
    results,
    total_results: results.length,
    filters_applied: filters,
    warning: 'Cloudflare AI/Vectorize bindings not available. Returning placeholder results (not semantic search).',
  })
}
