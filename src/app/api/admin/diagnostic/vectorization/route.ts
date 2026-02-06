import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/diagnostic/vectorization
 *
 * Diagnose non-vectorized knowledge entries and check if they have:
 * - Proper collection links
 * - User ownership
 * - Content to vectorize
 * - Bot associations (via collection)
 *
 * Query params:
 * - userId: Filter by user ID
 * - onlyNonVectorized: Only show non-vectorized entries (default: true)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get Payload instance
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Find user in Payload and verify admin
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

    const payloadUser = users.docs[0] as { id: number; role?: string }

    if (payloadUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const filterUserId = searchParams.get('userId')
    const onlyNonVectorized = searchParams.get('onlyNonVectorized') !== 'false'

    // Build query
    const whereClause: Record<string, unknown> = {}
    if (filterUserId) {
      whereClause.user = { equals: parseInt(filterUserId, 10) }
    }
    if (onlyNonVectorized) {
      whereClause.or = [
        { is_vectorized: { equals: false } },
        { is_vectorized: { exists: false } },
      ]
    }

    // Fetch knowledge entries
    const knowledge = await payload.find({
      collection: 'knowledge',
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      limit: 500,
      depth: 1, // Get collection details
      overrideAccess: true,
    })

    // Fetch all collections for reference
    const collections = await payload.find({
      collection: 'knowledgeCollections',
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    })

    const collectionMap = new Map<number, { name: string; userId: number | null; category: string | null }>()
    for (const col of collections.docs) {
      const c = col as {
        id: number
        name: string
        user: number | { id: number } | null
        collection_metadata?: { collection_category?: string }
      }
      const userId = typeof c.user === 'object' && c.user !== null ? c.user.id : c.user
      collectionMap.set(c.id, {
        name: c.name,
        userId: userId as number | null,
        category: c.collection_metadata?.collection_category || null,
      })
    }

    // Fetch bots to see which collections are linked
    const bots = await payload.find({
      collection: 'bot',
      limit: 500,
      depth: 0,
      overrideAccess: true,
    })

    // Build map of collection ID -> bot names
    const collectionToBots = new Map<number, string[]>()
    for (const bot of bots.docs) {
      const b = bot as {
        id: number
        name: string
        knowledge_collections?: Array<number | { id: number }>
      }
      const colIds = (b.knowledge_collections || []).map((c) =>
        typeof c === 'object' && c !== null ? c.id : c
      ) as number[]
      for (const colId of colIds) {
        const existing = collectionToBots.get(colId) || []
        existing.push(b.name)
        collectionToBots.set(colId, existing)
      }
    }

    // Analyze entries
    const readyToVectorize: Array<{
      id: number
      type: string
      entryPreview: string
      contentLength: number
      collectionId: number | null
      collectionName: string | null
      collectionCategory: string | null
      linkedBots: string[]
      userId: number | null
      isLegacyMemory: boolean
    }> = []

    const missingData: Array<{
      id: number
      type: string
      entryPreview: string
      issues: string[]
    }> = []

    const alreadyVectorized: Array<{
      id: number
      type: string
      chunkCount: number
    }> = []

    for (const doc of knowledge.docs) {
      const k = doc as {
        id: number
        entry: string
        type: string
        user: number | { id: number } | null
        knowledge_collection: number | { id: number } | null
        is_vectorized?: boolean
        is_legacy_memory?: boolean
        chunk_count?: number
      }

      const userId = typeof k.user === 'object' && k.user !== null ? k.user.id : k.user
      const collectionIdRaw = typeof k.knowledge_collection === 'object' && k.knowledge_collection !== null
        ? k.knowledge_collection.id
        : k.knowledge_collection
      const collectionId = collectionIdRaw as number | null
      const collectionInfo = collectionId ? collectionMap.get(collectionId) : null
      const linkedBots = collectionId ? (collectionToBots.get(collectionId) || []) : []
      const entryPreview = k.entry.substring(0, 60) + (k.entry.length > 60 ? '...' : '')

      if (k.is_vectorized) {
        alreadyVectorized.push({
          id: k.id,
          type: k.type,
          chunkCount: k.chunk_count || 0,
        })
        continue
      }

      // Check for issues
      const issues: string[] = []

      if (!userId) {
        issues.push('Missing user')
      }
      if (!collectionId) {
        issues.push('Missing collection link')
      } else if (!collectionInfo) {
        issues.push(`Collection ${collectionId} not found`)
      }
      if (!k.entry || k.entry.trim().length < 10) {
        issues.push('Content too short (<10 chars)')
      }
      if (linkedBots.length === 0 && collectionInfo?.category !== 'memories') {
        issues.push('Collection not linked to any bot')
      }

      if (issues.length > 0) {
        missingData.push({
          id: k.id,
          type: k.type,
          entryPreview,
          issues,
        })
      } else {
        readyToVectorize.push({
          id: k.id,
          type: k.type,
          entryPreview,
          contentLength: k.entry.length,
          collectionId,
          collectionName: collectionInfo?.name || null,
          collectionCategory: collectionInfo?.category || null,
          linkedBots,
          userId: userId as number | null,
          isLegacyMemory: k.is_legacy_memory || false,
        })
      }
    }

    // Summary statistics
    const summary = {
      total: knowledge.totalDocs,
      alreadyVectorized: alreadyVectorized.length,
      readyToVectorize: readyToVectorize.length,
      missingData: missingData.length,
      byType: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      legacyMemories: readyToVectorize.filter((e) => e.isLegacyMemory).length,
      regularLore: readyToVectorize.filter((e) => !e.isLegacyMemory).length,
    }

    for (const entry of readyToVectorize) {
      summary.byType[entry.type] = (summary.byType[entry.type] || 0) + 1
      const cat = entry.collectionCategory || 'uncategorized'
      summary.byCategory[cat] = (summary.byCategory[cat] || 0) + 1
    }

    return NextResponse.json({
      success: true,
      summary,
      readyToVectorize: readyToVectorize.slice(0, 50),
      missingData: missingData.slice(0, 50),
      alreadyVectorized: alreadyVectorized.slice(0, 20),
      message: `Found ${readyToVectorize.length} entries ready to vectorize, ${missingData.length} with issues.`,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Diagnostic failed'
    console.error('Vectorization diagnostic error:', error)
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    )
  }
}
