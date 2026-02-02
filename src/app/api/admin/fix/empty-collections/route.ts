import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

// Helper to extract ID from relationship field
function getRelationId(field: number | { id: number } | null | undefined): number | null {
  if (field === null || field === undefined) return null
  if (typeof field === 'object') return field.id
  return field
}

/**
 * GET /api/admin/fix/empty-collections
 *
 * Preview knowledge collections with empty descriptions that can be populated
 * using their knowledge entries.
 *
 * Query params:
 * - userId: Only check for a specific user
 * - tag: Filter by migration tag (e.g., "migrated:lore", "migrated:bot persona", "migrated:general", "migrated:memory")
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

    // Only admins can access this endpoint
    if (payloadUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const filterUserId = searchParams.get('userId')
    const filterTag = searchParams.get('tag')

    // Fetch all knowledge collections
    const collectionQuery: Record<string, unknown> = {}
    if (filterUserId) {
      collectionQuery.user = { equals: parseInt(filterUserId, 10) }
    }

    const allCollections = await payload.find({
      collection: 'knowledgeCollections',
      where: Object.keys(collectionQuery).length > 0 ? collectionQuery : undefined,
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    })

    // Fetch all knowledge entries
    const allKnowledge = await payload.find({
      collection: 'knowledge',
      limit: 5000,
      depth: 0,
      overrideAccess: true,
    })

    // Build map of knowledge entries by collection
    const knowledgeByCollection = new Map<number, string[]>()
    for (const k of allKnowledge.docs) {
      const knowledge = k as { id: number; entry: string; knowledge_collection: number | { id: number } | null }
      const collectionId = getRelationId(knowledge.knowledge_collection)
      if (collectionId) {
        const entries = knowledgeByCollection.get(collectionId) || []
        entries.push(knowledge.entry)
        knowledgeByCollection.set(collectionId, entries)
      }
    }

    // Fetch user emails for display
    const allUsers = await payload.find({
      collection: 'users',
      limit: 1000,
      overrideAccess: true,
    })
    const userIdToEmail = new Map<number, string>()
    for (const u of allUsers.docs) {
      const user = u as { id: number; email: string }
      userIdToEmail.set(user.id, user.email)
    }

    // Find collections with empty descriptions (excluding user persona which we handle separately)
    const emptyCollections: Array<{
      collectionId: number
      collectionName: string
      description: string
      userId: number
      userEmail?: string
      tags: string[]
      knowledgeEntries: string[]
      knowledgeCount: number
      suggestedDescription: string
      status: 'ready' | 'no_content' | 'excluded'
      reason?: string
    }> = []

    for (const col of allCollections.docs) {
      const c = col as any

      // Check if has empty/minimal description
      if (c.description && c.description.trim().length > 10) continue

      // Get tags
      const rawTags = c.collection_metadata?.tags || []
      const tags: string[] = rawTags.map((t: any) => (typeof t === 'string' ? t : t?.tag || ''))

      // Skip user persona collections (handled by /api/admin/fix/empty-personas)
      if (tags.includes('migrated:user persona')) continue

      // Filter by tag if specified
      if (filterTag && !tags.includes(filterTag)) continue

      const userId = getRelationId(c.user)
      if (!userId) continue

      const knowledgeEntries = knowledgeByCollection.get(c.id) || []

      // Build suggested description from knowledge entries
      let suggestedDescription = ''
      let status: 'ready' | 'no_content' | 'excluded' = 'ready'

      if (knowledgeEntries.length > 0) {
        // Combine knowledge entries into a description (up to 500 chars)
        const combined = knowledgeEntries.join('\n\n')
        if (combined.length <= 500) {
          suggestedDescription = combined
        } else {
          // Try to find a natural break point
          let cutoff = 497
          const lastPeriod = combined.lastIndexOf('.', 497)
          const lastNewline = combined.lastIndexOf('\n', 497)
          if (lastPeriod > 300) cutoff = lastPeriod + 1
          else if (lastNewline > 300) cutoff = lastNewline
          suggestedDescription = combined.substring(0, cutoff).trim() + '...'
        }
      } else {
        status = 'no_content'
      }

      emptyCollections.push({
        collectionId: c.id,
        collectionName: c.name,
        description: c.description || '',
        userId,
        userEmail: userIdToEmail.get(userId),
        tags,
        knowledgeEntries: knowledgeEntries.slice(0, 3), // Preview first 3
        knowledgeCount: knowledgeEntries.length,
        suggestedDescription,
        status,
        reason: status === 'no_content' ? 'Collection has no knowledge entries' : undefined,
      })
    }

    // Summary by tag
    const tagSummary: Record<string, { total: number; ready: number; noContent: number }> = {}
    for (const col of emptyCollections) {
      const tagKey = col.tags[0] || 'no-tag'
      if (!tagSummary[tagKey]) {
        tagSummary[tagKey] = { total: 0, ready: 0, noContent: 0 }
      }
      tagSummary[tagKey].total++
      if (col.status === 'ready') tagSummary[tagKey].ready++
      if (col.status === 'no_content') tagSummary[tagKey].noContent++
    }

    const summary = {
      totalEmptyCollections: emptyCollections.length,
      ready: emptyCollections.filter((c) => c.status === 'ready').length,
      noContent: emptyCollections.filter((c) => c.status === 'no_content').length,
      byTag: tagSummary,
    }

    return NextResponse.json({
      success: true,
      summary,
      collections: emptyCollections.slice(0, 100),
      message:
        emptyCollections.length > 100
          ? `Showing first 100 of ${emptyCollections.length} collections`
          : 'Preview complete. Use POST /api/admin/fix/empty-collections to populate descriptions.',
    })
  } catch (error: any) {
    console.error('Empty collections preview error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Preview failed' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/fix/empty-collections
 *
 * Populate descriptions for knowledge collections that have empty descriptions.
 * Uses knowledge entries content as the description.
 *
 * Body:
 * - collectionIds?: number[] - Only process specific collections
 * - userId?: number - Only process for a specific user
 * - tag?: string - Only process collections with this tag
 * - includeEmpty?: boolean - Update collections even without knowledge content (default: false)
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

    // Only admins can access this endpoint
    if (payloadUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse body
    const body = (await request.json().catch(() => ({}))) as {
      collectionIds?: number[]
      userId?: number
      tag?: string
      includeEmpty?: boolean
    }

    const specificCollectionIds = body.collectionIds
    const filterUserId = body.userId
    const filterTag = body.tag
    const includeEmpty = body.includeEmpty === true // Default false

    // Fetch all knowledge collections
    const collectionQuery: Record<string, unknown> = {}
    if (filterUserId) {
      collectionQuery.user = { equals: filterUserId }
    }

    const allCollections = await payload.find({
      collection: 'knowledgeCollections',
      where: Object.keys(collectionQuery).length > 0 ? collectionQuery : undefined,
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    })

    // Fetch all knowledge entries
    const allKnowledge = await payload.find({
      collection: 'knowledge',
      limit: 5000,
      depth: 0,
      overrideAccess: true,
    })

    // Build map of knowledge entries by collection
    const knowledgeByCollection = new Map<number, string[]>()
    for (const k of allKnowledge.docs) {
      const knowledge = k as { id: number; entry: string; knowledge_collection: number | { id: number } | null }
      const collectionId = getRelationId(knowledge.knowledge_collection)
      if (collectionId) {
        const entries = knowledgeByCollection.get(collectionId) || []
        entries.push(knowledge.entry)
        knowledgeByCollection.set(collectionId, entries)
      }
    }

    // Filter to collections with empty descriptions (excluding user persona)
    let collectionsToProcess = allCollections.docs.filter((col: any) => {
      const hasEmptyDescription = !col.description || col.description.trim().length <= 10
      if (!hasEmptyDescription) return false

      const rawTags = col.collection_metadata?.tags || []
      const tags: string[] = rawTags.map((t: any) => (typeof t === 'string' ? t : t?.tag || ''))

      // Skip user persona collections
      if (tags.includes('migrated:user persona')) return false

      // Filter by tag if specified
      if (filterTag && !tags.includes(filterTag)) return false

      return true
    })

    // Filter to specific collection IDs if provided
    if (specificCollectionIds && specificCollectionIds.length > 0) {
      const idSet = new Set(specificCollectionIds)
      collectionsToProcess = collectionsToProcess.filter((col: any) => idSet.has(col.id))
    }

    const results: Array<{
      collectionId: number
      collectionName: string
      tags: string[]
      status: 'updated' | 'skipped' | 'error'
      description?: string
      reason?: string
    }> = []

    for (const col of collectionsToProcess) {
      const c = col as {
        id: number
        name: string
        description: string
        user: number | { id: number } | null
        collection_metadata?: { tags?: Array<string | { tag: string }> }
      }

      const rawTags = c.collection_metadata?.tags || []
      const tags: string[] = rawTags.map((t: any) => (typeof t === 'string' ? t : t?.tag || ''))

      const knowledgeEntries = knowledgeByCollection.get(c.id) || []

      // Build description from knowledge entries
      let description = ''

      if (knowledgeEntries.length > 0) {
        const combined = knowledgeEntries.join('\n\n')
        if (combined.length <= 500) {
          description = combined
        } else {
          // Try to find a natural break point
          let cutoff = 497
          const lastPeriod = combined.lastIndexOf('.', 497)
          const lastNewline = combined.lastIndexOf('\n', 497)
          if (lastPeriod > 300) cutoff = lastPeriod + 1
          else if (lastNewline > 300) cutoff = lastNewline
          description = combined.substring(0, cutoff).trim() + '...'
        }
      } else if (!includeEmpty) {
        results.push({
          collectionId: c.id,
          collectionName: c.name,
          tags,
          status: 'skipped',
          reason: 'No knowledge content and includeEmpty=false',
        })
        continue
      } else {
        // Use name as fallback description
        description = `Knowledge collection: ${c.name.trim()}`
      }

      // Update the collection
      try {
        await payload.update({
          collection: 'knowledgeCollections',
          id: c.id,
          data: {
            description,
          },
          overrideAccess: true,
        })

        results.push({
          collectionId: c.id,
          collectionName: c.name,
          tags,
          status: 'updated',
          description: description.substring(0, 100) + (description.length > 100 ? '...' : ''),
        })
      } catch (updateError: any) {
        results.push({
          collectionId: c.id,
          collectionName: c.name,
          tags,
          status: 'error',
          reason: updateError.message,
        })
      }
    }

    // Summary by tag
    const tagSummary: Record<string, { updated: number; skipped: number; error: number }> = {}
    for (const r of results) {
      const tagKey = r.tags[0] || 'no-tag'
      if (!tagSummary[tagKey]) {
        tagSummary[tagKey] = { updated: 0, skipped: 0, error: 0 }
      }
      if (r.status === 'updated') tagSummary[tagKey].updated++
      if (r.status === 'skipped') tagSummary[tagKey].skipped++
      if (r.status === 'error') tagSummary[tagKey].error++
    }

    const summary = {
      processed: results.length,
      updated: results.filter((r) => r.status === 'updated').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
      errors: results.filter((r) => r.status === 'error').length,
      byTag: tagSummary,
    }

    return NextResponse.json({
      success: true,
      summary,
      results,
      message: `Updated ${summary.updated} collection descriptions.`,
    })
  } catch (error: any) {
    console.error('Empty collections fix error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Fix failed' },
      { status: 500 }
    )
  }
}
