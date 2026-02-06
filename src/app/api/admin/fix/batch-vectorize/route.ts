import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { chunkText, getChunkConfig } from '@/lib/vectorization/chunking'
import {
  generateEmbeddings,
  insertVectors,
  VectorRecord,
  VectorMetadata,
  BGE_M3_MODEL,
  BGE_M3_DIMENSIONS,
} from '@/lib/vectorization/embeddings'

export const dynamic = 'force-dynamic'

const BATCH_SIZE = 5 // Process 5 entries at a time to avoid timeouts

/**
 * GET /api/admin/fix/batch-vectorize
 *
 * Preview non-vectorized knowledge entries that can be vectorized.
 */
export async function GET(request: NextRequest) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const users = await payload.find({
      collection: 'users',
      where: { email: { equals: clerkUser.emailAddresses[0]?.emailAddress } },
      overrideAccess: true,
    })

    if (users.docs.length === 0) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    const payloadUser = users.docs[0] as { id: number; role?: string }
    if (payloadUser.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 })
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '100', 10)

    // Find non-vectorized entries
    const whereClause: Record<string, unknown> = {
      or: [
        { is_vectorized: { equals: false } },
        { is_vectorized: { exists: false } },
      ],
    }
    if (userId) {
      whereClause.user = { equals: parseInt(userId, 10) }
    }

    const entries = await payload.find({
      collection: 'knowledge',
      where: whereClause,
      limit,
      depth: 0,
      overrideAccess: true,
    })

    // Filter to entries with content
    const validEntries = entries.docs.filter((doc) => {
      const k = doc as { entry?: string }
      return k.entry && k.entry.trim().length >= 10
    })

    return NextResponse.json({
      success: true,
      summary: {
        total: entries.totalDocs,
        validForVectorization: validEntries.length,
        tooShort: entries.docs.length - validEntries.length,
      },
      entries: validEntries.slice(0, 50).map((doc) => {
        const k = doc as { id: number; type: string; entry: string; user: number | { id: number } }
        return {
          id: k.id,
          type: k.type,
          contentLength: k.entry.length,
          preview: k.entry.substring(0, 60) + '...',
        }
      }),
      message: `Found ${validEntries.length} entries ready to vectorize. Use POST to start vectorization.`,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Preview failed'
    console.error('Batch vectorize preview error:', error)
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 })
  }
}

/**
 * POST /api/admin/fix/batch-vectorize
 *
 * Vectorize non-vectorized knowledge entries in batches.
 *
 * Body:
 * - userId?: number - Only vectorize for specific user
 * - limit?: number - Max entries to process (default: 20)
 * - dryRun?: boolean - Preview without actually vectorizing
 */
export async function POST(request: NextRequest) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const users = await payload.find({
      collection: 'users',
      where: { email: { equals: clerkUser.emailAddresses[0]?.emailAddress } },
      overrideAccess: true,
    })

    if (users.docs.length === 0) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    const payloadUser = users.docs[0] as { id: number; role?: string }
    if (payloadUser.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 })
    }

    // Parse body
    const body = (await request.json().catch(() => ({}))) as {
      userId?: number
      limit?: number
      dryRun?: boolean
    }

    const filterUserId = body.userId
    const limit = Math.min(body.limit || 20, 100) // Max 100 per request
    const dryRun = body.dryRun || false

    // Get Cloudflare bindings
    let ai: unknown
    let vectorize: unknown
    let d1: unknown

    try {
      const { env } = await getCloudflareContext()
      ai = (env as unknown as Record<string, unknown>).AI
      vectorize = (env as unknown as Record<string, unknown>).VECTORIZE
      d1 = (env as unknown as Record<string, unknown>).D1
    } catch (e) {
      console.warn('Failed to get Cloudflare context:', e)
    }

    if (!ai || !vectorize) {
      return NextResponse.json({
        success: false,
        message: 'Cloudflare AI/Vectorize bindings not available. Cannot vectorize in this environment.',
      }, { status: 500 })
    }

    // Find non-vectorized entries
    const whereClause: Record<string, unknown> = {
      or: [
        { is_vectorized: { equals: false } },
        { is_vectorized: { exists: false } },
      ],
    }
    if (filterUserId) {
      whereClause.user = { equals: filterUserId }
    }

    const entries = await payload.find({
      collection: 'knowledge',
      where: whereClause,
      limit,
      depth: 0,
      overrideAccess: true,
    })

    // Filter to valid entries
    const validEntries = entries.docs.filter((doc) => {
      const k = doc as { entry?: string }
      return k.entry && k.entry.trim().length >= 10
    })

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        summary: {
          wouldProcess: validEntries.length,
          skippedTooShort: entries.docs.length - validEntries.length,
        },
        entries: validEntries.slice(0, 20).map((doc) => {
          const k = doc as { id: number; type: string; entry: string }
          return { id: k.id, type: k.type, contentLength: k.entry.length }
        }),
        message: `Dry run: Would vectorize ${validEntries.length} entries.`,
      })
    }

    // Process entries in batches
    const results: Array<{
      id: number
      status: 'success' | 'error'
      chunks?: number
      error?: string
    }> = []

    for (let i = 0; i < validEntries.length; i += BATCH_SIZE) {
      const batch = validEntries.slice(i, i + BATCH_SIZE)

      for (const doc of batch) {
        const k = doc as {
          id: number
          entry: string
          type: string
          user: number | { id: number }
        }

        try {
          const userId = typeof k.user === 'object' && k.user !== null ? k.user.id : k.user
          const contentType = k.type === 'legacy_memory' ? 'memory' : 'lore'
          const chunkConfig = getChunkConfig(contentType as 'lore' | 'memory')
          const chunks = chunkText(k.entry, chunkConfig)

          if (chunks.length === 0) {
            results.push({ id: k.id, status: 'error', error: 'No chunks generated' })
            continue
          }

          const tenant_id = String(userId)
          const vectorizeRecords: VectorRecord[] = []

          // Generate embeddings
          const chunkTexts = chunks.map((c) => c.text)
          const embeddings = await generateEmbeddings(ai, chunkTexts)

          for (let j = 0; j < chunks.length; j++) {
            const chunk = chunks[j]
            const embedding = embeddings[j]
            const vector_id = `vec_knowledge_${k.id}_chunk_${chunk.index}_${Date.now()}_${j}`

            const metadata: VectorMetadata = {
              type: contentType,
              user_id: userId as number,
              tenant_id,
              source_type: 'knowledge',
              source_id: String(k.id),
              chunk_index: chunk.index,
              total_chunks: chunk.totalChunks,
              created_at: new Date().toISOString(),
            }

            vectorizeRecords.push({
              id: vector_id,
              values: embedding,
              metadata,
            })

            // Create VectorRecord in D1
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (payload as any).create({
              collection: 'vectorRecords',
              data: {
                vector_id,
                source_type: 'knowledge',
                source_id: String(k.id),
                user_id: userId,
                tenant_id,
                chunk_index: chunk.index,
                total_chunks: chunk.totalChunks,
                chunk_text: chunk.text,
                metadata: JSON.stringify(metadata),
                embedding_model: BGE_M3_MODEL,
                embedding_dimensions: BGE_M3_DIMENSIONS,
                embedding: JSON.stringify(embedding),
              },
              overrideAccess: true,
            })
          }

          // Insert vectors into Vectorize
          await insertVectors(vectorize, vectorizeRecords)

          // Update knowledge entry
          if (d1) {
            await (d1 as { prepare: (sql: string) => { bind: (...args: unknown[]) => { run: () => Promise<void> } } })
              .prepare('UPDATE knowledge SET is_vectorized = 1, chunk_count = ? WHERE id = ?')
              .bind(chunks.length, k.id)
              .run()
          } else {
            await payload.update({
              collection: 'knowledge',
              id: k.id,
              data: {
                is_vectorized: true,
                chunk_count: chunks.length,
              },
              overrideAccess: true,
            })
          }

          results.push({ id: k.id, status: 'success', chunks: chunks.length })
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Vectorization failed'
          results.push({ id: k.id, status: 'error', error: errorMessage })
        }
      }
    }

    const successCount = results.filter((r) => r.status === 'success').length
    const errorCount = results.filter((r) => r.status === 'error').length
    const totalChunks = results
      .filter((r) => r.status === 'success')
      .reduce((sum, r) => sum + (r.chunks || 0), 0)

    return NextResponse.json({
      success: true,
      summary: {
        processed: results.length,
        success: successCount,
        errors: errorCount,
        totalChunks,
        remainingNonVectorized: entries.totalDocs - results.length,
      },
      results,
      message: `Vectorized ${successCount} entries with ${totalChunks} total chunks. ${errorCount} errors.`,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Batch vectorization failed'
    console.error('Batch vectorize error:', error)
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 })
  }
}
