import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { generateEmbedding } from '@/lib/vectorization/embeddings'
import { chunkText, getChunkConfig } from '@/lib/vectorization/chunking'

export const dynamic = 'force-dynamic'

/**
 * POST /api/memories/vectorize
 *
 * Vectorize a memory entry for semantic search.
 * Similar to /api/vectors/generate but specifically for memories.
 *
 * Request body:
 * - memoryId: string (required) - ID of memory to vectorize
 *
 * Response:
 * - success: boolean
 * - chunkCount: number
 * - message: string
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
      memoryId?: string
    }
    const { memoryId } = body

    if (!memoryId) {
      return NextResponse.json(
        { success: false, message: 'memoryId is required' },
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

    // Fetch memory entry
    const memory = await payload.findByID({
      collection: 'memory',
      id: memoryId,
    })

    // Verify ownership
    if (typeof memory.user === 'object' && memory.user.id !== payloadUser.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: You do not own this memory' },
        { status: 403 }
      )
    }

    // Check if already vectorized
    if (memory.is_vectorized) {
      return NextResponse.json(
        { success: false, message: 'Memory is already vectorized' },
        { status: 400 }
      )
    }

    // Chunk the memory text using memory-specific config
    const chunkConfig = getChunkConfig('memory')
    const chunks = chunkText(memory.entry, chunkConfig).map((c) => c.text)

    if (chunks.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No chunks created from memory text' },
        { status: 400 }
      )
    }

    // Get bot information for metadata (use first bot from array)
    let botData = null
    if (memory.bot && Array.isArray(memory.bot) && memory.bot.length > 0) {
      const firstBot = memory.bot[0]
      const botId = typeof firstBot === 'object' ? firstBot.id : firstBot
      botData = await payload.findByID({
        collection: 'bot',
        id: botId,
      })
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

    if (!ai) {
      console.warn('AI binding not available, cannot vectorize')
      return NextResponse.json({
        success: false,
        message: 'AI binding not available for vectorization',
      }, { status: 503 })
    }

    // Generate embeddings and store in Vectorize
    const vectorRecordIds: number[] = []

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]

      // Generate embedding using Cloudflare Workers AI
      const embedding = await generateEmbedding(ai, chunk)

      // Create unique vector ID
      const vectorId = `memory-${memoryId}-chunk-${i}`

      // Build metadata for Vectorize
      const tenantId = String(payloadUser.id)
      const metadata = {
        source_type: 'memory',
        source_id: memoryId,
        user_id: payloadUser.id,
        tenant_id: tenantId,
        chunk_index: i,
        total_chunks: chunks.length,
        memory_type: memory.type || 'short_term',
        bot_id: botData?.id || null,
        bot_name: botData?.name || null,
        participants: memory.participants || { personas: [], bots: [] },
        importance: memory.importance || 5,
        created_at: new Date().toISOString(),
      }

      // Store vector in Cloudflare Vectorize
      if (vectorize) {
        await vectorize.insert([
          {
            id: vectorId,
            values: embedding,
            metadata: metadata,
          },
        ])
      }

      // Create VectorRecord in D1 (including embedding for future-proofing)
      // Note: metadata must be JSON stringified to avoid "too many SQL variables" error
      const vectorRecord = await payload.create({
        collection: 'vectorRecords',
        data: {
          vector_id: vectorId,
          source_type: 'memory',
          source_id: String(memoryId),
          user_id: payloadUser.id,
          tenant_id: tenantId,
          chunk_index: i,
          total_chunks: chunks.length,
          chunk_text: chunk,
          metadata: JSON.stringify(metadata),
          embedding_model: '@cf/baai/bge-m3',
          embedding_dimensions: 1024,
          embedding: JSON.stringify(embedding), // Store embedding for future metadata-only updates
        } as any, // Type will include 'embedding' after running `payload generate:types`
      })

      vectorRecordIds.push(vectorRecord.id)
    }

    // Update memory entry with vectorization status
    // Note: We don't update vector_records relationship here to avoid "too many SQL variables" error
    // VectorRecords can be queried by source_id instead
    // Using D1 directly to avoid Payload expanding all array fields which causes parameter overflow
    try {
      const { env } = await getCloudflareContext()
      // D1 binding is named "D1" in wrangler.jsonc
      const d1 = (env as any).D1
      if (d1) {
        await d1.prepare(`UPDATE memory SET is_vectorized = 1 WHERE id = ?`).bind(memoryId).run()
      } else {
        await payload.update({
          collection: 'memory',
          id: memoryId,
          data: {
            is_vectorized: true,
          },
          overrideAccess: true,
        })
      }
    } catch (updateError) {
      console.warn('Failed to update memory vectorization status:', updateError)
    }

    return NextResponse.json({
      success: true,
      chunkCount: chunks.length,
      vectorRecordIds: vectorRecordIds,
      message: `Memory vectorized successfully with ${chunks.length} chunks`,
    })

  } catch (error: any) {
    console.error('Memory vectorization error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to vectorize memory' },
      { status: 500 }
    )
  }
}
