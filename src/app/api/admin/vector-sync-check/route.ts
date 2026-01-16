import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import config from '@payload-config'
import { getCloudflareContext } from '@opennextjs/cloudflare'

export const dynamic = 'force-dynamic'

interface SyncIssue {
  type: 'missing_vectors' | 'orphaned_vectors' | 'chunk_count_mismatch' | 'stale_vectors'
  knowledgeId?: number
  vectorId?: string
  description: string
  details?: Record<string, any>
}

interface SyncCheckResult {
  success: boolean
  timestamp: string
  summary: {
    totalKnowledgeEntries: number
    totalVectorRecords: number
    entriesThatShouldBeVectorized: number
    entriesMarkedAsVectorized: number
    issuesFound: number
  }
  issues: SyncIssue[]
}

export async function GET(request: NextRequest) {
  try {
    // Get authenticated Clerk user
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return NextResponse.json(
        { message: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    // Get Payload instance
    const payload = await getPayloadHMR({ config })

    // Find Payload user by email
    const payloadUsers = await payload.find({
      collection: 'users',
      where: {
        email: { equals: clerkUser.emailAddresses[0]?.emailAddress },
      },
      limit: 1,
      overrideAccess: true,
    })

    if (payloadUsers.docs.length === 0) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    const payloadUser = payloadUsers.docs[0]
    const issues: SyncIssue[] = []

    // Get Cloudflare context for D1 access
    const { env } = await getCloudflareContext()
    const d1 = (env as any).D1

    if (!d1) {
      return NextResponse.json(
        { message: 'D1 database not available' },
        { status: 500 }
      )
    }

    // 1. Get all knowledge entries for this user
    const knowledgeResult = await d1
      .prepare(`
        SELECT
          id,
          entry,
          is_vectorized,
          chunk_count,
          activation_settings,
          updated_at
        FROM knowledge
        WHERE user = ?
      `)
      .bind(payloadUser.id)
      .all()

    const knowledgeEntries = knowledgeResult.results || []

    // 2. Get all vector records for this user
    const vectorRecordsResult = await d1
      .prepare(`
        SELECT
          id,
          vector_id,
          source_id,
          chunk_index,
          total_chunks,
          chunk_text,
          updated_at
        FROM vector_records
        WHERE user_id = ?
      `)
      .bind(payloadUser.id)
      .all()

    const vectorRecords = vectorRecordsResult.results || []

    // Create lookup maps
    const vectorsBySourceId = new Map<string, any[]>()
    for (const record of vectorRecords) {
      const sourceId = String(record.source_id)
      if (!vectorsBySourceId.has(sourceId)) {
        vectorsBySourceId.set(sourceId, [])
      }
      vectorsBySourceId.get(sourceId)!.push(record)
    }

    const knowledgeById = new Map<number, any>()
    for (const entry of knowledgeEntries) {
      knowledgeById.set(entry.id, entry)
    }

    // Track which source IDs have been seen
    const seenSourceIds = new Set<string>()

    // Calculate statistics
    let entriesThatShouldBeVectorized = 0
    let entriesMarkedAsVectorized = 0

    // 3. Check each knowledge entry
    for (const entry of knowledgeEntries) {
      const sourceId = String(entry.id)
      seenSourceIds.add(sourceId)

      // Parse activation settings to check if it should be vectorized
      let activationMode = 'keyword' // default
      try {
        if (entry.activation_settings) {
          const settings = typeof entry.activation_settings === 'string'
            ? JSON.parse(entry.activation_settings)
            : entry.activation_settings
          activationMode = settings.activation_mode || 'keyword'
        }
      } catch (e) {
        // If we can't parse, assume keyword mode
      }

      const shouldBeVectorized = activationMode === 'vector' || activationMode === 'hybrid'
      const isMarkedVectorized = entry.is_vectorized === 1 || entry.is_vectorized === true

      if (shouldBeVectorized) {
        entriesThatShouldBeVectorized++
      }
      if (isMarkedVectorized) {
        entriesMarkedAsVectorized++
      }

      const vectors = vectorsBySourceId.get(sourceId) || []

      // Check 1: Entry should be vectorized but has no vectors
      if (shouldBeVectorized && vectors.length === 0) {
        issues.push({
          type: 'missing_vectors',
          knowledgeId: entry.id,
          description: `Knowledge entry ${entry.id} has activation_mode="${activationMode}" but no vector records exist`,
          details: {
            activationMode,
            isMarkedVectorized,
            entryPreview: entry.entry?.substring(0, 100) + '...',
          },
        })
      }

      // Check 2: Entry is marked as vectorized but has no vectors
      if (isMarkedVectorized && vectors.length === 0) {
        issues.push({
          type: 'missing_vectors',
          knowledgeId: entry.id,
          description: `Knowledge entry ${entry.id} is marked as vectorized but has no vector records`,
          details: {
            chunkCountInDb: entry.chunk_count,
            actualVectorCount: 0,
          },
        })
      }

      // Check 3: Chunk count mismatch
      if (vectors.length > 0 && entry.chunk_count !== vectors.length) {
        issues.push({
          type: 'chunk_count_mismatch',
          knowledgeId: entry.id,
          description: `Knowledge entry ${entry.id} has chunk_count=${entry.chunk_count} but ${vectors.length} vector records exist`,
          details: {
            expectedChunks: entry.chunk_count,
            actualChunks: vectors.length,
          },
        })
      }

      // Check 4: Stale vectors (knowledge updated after vectors)
      if (vectors.length > 0) {
        const knowledgeUpdatedAt = new Date(entry.updated_at).getTime()
        for (const vector of vectors) {
          const vectorUpdatedAt = new Date(vector.updated_at).getTime()
          // If knowledge was updated more than 1 minute after vectors, it might be stale
          if (knowledgeUpdatedAt > vectorUpdatedAt + 60000) {
            issues.push({
              type: 'stale_vectors',
              knowledgeId: entry.id,
              vectorId: vector.vector_id,
              description: `Knowledge entry ${entry.id} was updated after its vectors were created`,
              details: {
                knowledgeUpdatedAt: entry.updated_at,
                vectorUpdatedAt: vector.updated_at,
                timeDifferenceMs: knowledgeUpdatedAt - vectorUpdatedAt,
              },
            })
            break // Only report once per knowledge entry
          }
        }
      }
    }

    // 4. Check for orphaned vector records (vectors without knowledge entries)
    for (const [sourceId, vectors] of vectorsBySourceId) {
      if (!seenSourceIds.has(sourceId)) {
        for (const vector of vectors) {
          issues.push({
            type: 'orphaned_vectors',
            vectorId: vector.vector_id,
            description: `Vector record ${vector.vector_id} references non-existent knowledge entry ${sourceId}`,
            details: {
              sourceId,
              chunkIndex: vector.chunk_index,
              totalChunks: vector.total_chunks,
            },
          })
        }
      }
    }

    // Build response
    const result: SyncCheckResult = {
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalKnowledgeEntries: knowledgeEntries.length,
        totalVectorRecords: vectorRecords.length,
        entriesThatShouldBeVectorized,
        entriesMarkedAsVectorized,
        issuesFound: issues.length,
      },
      issues,
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error checking vector sync:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to check vector sync' },
      { status: 500 }
    )
  }
}

// POST endpoint to fix issues
export async function POST(request: NextRequest) {
  try {
    // Get authenticated Clerk user
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return NextResponse.json(
        { message: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    const body = (await request.json()) as {
      action?: string
      knowledgeId?: number
      vectorId?: string
    }
    const { action, knowledgeId, vectorId } = body

    // Get Payload instance
    const payload = await getPayloadHMR({ config })

    // Find Payload user by email
    const payloadUsers = await payload.find({
      collection: 'users',
      where: {
        email: { equals: clerkUser.emailAddresses[0]?.emailAddress },
      },
      limit: 1,
      overrideAccess: true,
    })

    if (payloadUsers.docs.length === 0) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    const payloadUser = payloadUsers.docs[0]

    // Get Cloudflare context
    const { env } = await getCloudflareContext()
    const d1 = (env as any).D1
    const vectorize = env.VECTORIZE
    const ai = env.AI

    if (!d1) {
      return NextResponse.json(
        { message: 'D1 database not available' },
        { status: 500 }
      )
    }

    switch (action) {
      case 'delete_orphaned_vectors': {
        // Delete orphaned vector records from D1 and Vectorize
        if (!vectorId) {
          return NextResponse.json(
            { message: 'vectorId is required for delete_orphaned_vectors action' },
            { status: 400 }
          )
        }

        // Delete from Vectorize
        if (vectorize) {
          try {
            await vectorize.deleteByIds([vectorId])
          } catch (e) {
            console.warn('Failed to delete from Vectorize:', e)
          }
        }

        // Delete from D1
        await d1
          .prepare('DELETE FROM vector_records WHERE vector_id = ? AND user_id = ?')
          .bind(vectorId, payloadUser.id)
          .run()

        return NextResponse.json({
          success: true,
          message: `Deleted orphaned vector ${vectorId}`,
        })
      }

      case 'revectorize': {
        // Re-vectorize a knowledge entry
        if (!knowledgeId) {
          return NextResponse.json(
            { message: 'knowledgeId is required for revectorize action' },
            { status: 400 }
          )
        }

        if (!ai || !vectorize) {
          return NextResponse.json(
            { message: 'AI or Vectorize not available' },
            { status: 500 }
          )
        }

        // Import vectorization utilities dynamically
        const { generateEmbeddings, insertVectors, BGE_M3_MODEL, BGE_M3_DIMENSIONS } =
          await import('@/lib/vectorization/embeddings')
        const { chunkText, getChunkConfig } = await import('@/lib/vectorization/chunking')

        // Get the knowledge entry
        const knowledgeResult = await d1
          .prepare('SELECT * FROM knowledge WHERE id = ? AND user = ?')
          .bind(knowledgeId, payloadUser.id)
          .first()

        if (!knowledgeResult) {
          return NextResponse.json(
            { message: 'Knowledge entry not found' },
            { status: 404 }
          )
        }

        // Delete existing vectors
        const existingVectors = await d1
          .prepare('SELECT vector_id FROM vector_records WHERE source_id = ? AND user_id = ?')
          .bind(String(knowledgeId), payloadUser.id)
          .all()

        if (existingVectors.results && existingVectors.results.length > 0) {
          const vectorIds = existingVectors.results.map((v: any) => v.vector_id)
          try {
            await vectorize.deleteByIds(vectorIds)
          } catch (e) {
            console.warn('Failed to delete old vectors from Vectorize:', e)
          }
          await d1
            .prepare('DELETE FROM vector_records WHERE source_id = ? AND user_id = ?')
            .bind(String(knowledgeId), payloadUser.id)
            .run()
        }

        // Re-vectorize
        const content = knowledgeResult.entry
        const chunkConfig = getChunkConfig('lore')
        const chunks = chunkText(content, chunkConfig)

        if (chunks.length > 0) {
          const tenant_id = String(payloadUser.id)
          const vectorizeRecords: any[] = []
          const chunkTexts = chunks.map((c: any) => c.text)
          const embeddings = await generateEmbeddings(ai, chunkTexts)

          for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i]
            const embedding = embeddings[i]
            const vector_id = `vec_knowledge_${knowledgeId}_chunk_${chunk.index}_${Date.now()}_${i}`

            const metadata = {
              type: 'lore',
              user_id: payloadUser.id,
              tenant_id,
              source_type: 'knowledge',
              source_id: String(knowledgeId),
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
            await d1
              .prepare(`
                INSERT INTO vector_records
                (vector_id, source_type, source_id, user_id, tenant_id, chunk_index, total_chunks, chunk_text, metadata, embedding_model, embedding_dimensions, embedding, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
              `)
              .bind(
                vector_id,
                'knowledge',
                String(knowledgeId),
                payloadUser.id,
                tenant_id,
                chunk.index,
                chunk.totalChunks,
                chunk.text,
                JSON.stringify(metadata),
                BGE_M3_MODEL,
                BGE_M3_DIMENSIONS,
                JSON.stringify(embedding)
              )
              .run()
          }

          // Insert into Vectorize
          await insertVectors(vectorize, vectorizeRecords)

          // Update knowledge entry
          await d1
            .prepare('UPDATE knowledge SET is_vectorized = 1, chunk_count = ?, updated_at = datetime("now") WHERE id = ?')
            .bind(chunks.length, knowledgeId)
            .run()
        }

        return NextResponse.json({
          success: true,
          message: `Re-vectorized knowledge entry ${knowledgeId} with ${chunks.length} chunks`,
          chunkCount: chunks.length,
        })
      }

      case 'fix_chunk_count': {
        // Fix chunk count mismatch
        if (!knowledgeId) {
          return NextResponse.json(
            { message: 'knowledgeId is required for fix_chunk_count action' },
            { status: 400 }
          )
        }

        // Count actual vectors
        const countResult = await d1
          .prepare('SELECT COUNT(*) as count FROM vector_records WHERE source_id = ? AND user_id = ?')
          .bind(String(knowledgeId), payloadUser.id)
          .first()

        const actualCount = countResult?.count || 0

        // Update knowledge entry
        await d1
          .prepare('UPDATE knowledge SET chunk_count = ?, is_vectorized = ? WHERE id = ? AND user = ?')
          .bind(actualCount, actualCount > 0 ? 1 : 0, knowledgeId, payloadUser.id)
          .run()

        return NextResponse.json({
          success: true,
          message: `Fixed chunk count for knowledge entry ${knowledgeId}: ${actualCount} chunks`,
          chunkCount: actualCount,
        })
      }

      default:
        return NextResponse.json(
          { message: `Unknown action: ${action}` },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error('Error fixing vector sync:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to fix vector sync issue' },
      { status: 500 }
    )
  }
}
