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
 * GET /api/admin/fix/knowledge
 *
 * Preview which knowledge entries can be fixed.
 * Shows orphaned knowledge entries that can be reassigned to collections.
 *
 * Query params:
 * - userId: Only show knowledge for a specific user
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

    // Fetch all users
    const allUsers = await payload.find({
      collection: 'users',
      limit: 1000,
      overrideAccess: true,
    })

    const userIdSet = new Set<number>()
    for (const user of allUsers.docs) {
      userIdSet.add((user as { id: number }).id)
    }

    // Fetch all knowledge collections
    const allCollections = await payload.find({
      collection: 'knowledgeCollections',
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    })

    const collectionIdSet = new Set<number>()
    const userIdToCollections = new Map<number, Array<{ id: number; name: string }>>()
    for (const col of allCollections.docs) {
      const c = col as { id: number; name: string; user: number | { id: number } | null }
      collectionIdSet.add(c.id)
      const userId = getRelationId(c.user)
      if (userId) {
        const existing = userIdToCollections.get(userId) || []
        existing.push({ id: c.id, name: c.name })
        userIdToCollections.set(userId, existing)
      }
    }

    // Fetch knowledge (optionally filtered)
    const knowledgeQuery: Record<string, unknown> = {}
    if (filterUserId) {
      knowledgeQuery.user = { equals: parseInt(filterUserId, 10) }
    }

    const allKnowledge = await payload.find({
      collection: 'knowledge',
      where: Object.keys(knowledgeQuery).length > 0 ? knowledgeQuery : undefined,
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    })

    // Find fixable and unfixable knowledge
    const fixableKnowledge: Array<{
      knowledgeId: number
      entryPreview: string
      userId: number
      collectionId: number | null
      issue: string
      userCollections: Array<{ id: number; name: string }>
    }> = []

    const unfixableKnowledge: Array<{
      knowledgeId: number
      entryPreview: string
      userId: number | null
      reason: string
    }> = []

    for (const knowledge of allKnowledge.docs) {
      const k = knowledge as {
        id: number
        entry: string
        user: number | { id: number } | null
        knowledge_collection: number | { id: number } | null
      }

      const userId = getRelationId(k.user)
      const collectionId = getRelationId(k.knowledge_collection)

      const userExists = userId ? userIdSet.has(userId) : false
      const collectionExists = collectionId ? collectionIdSet.has(collectionId) : false
      const entryPreview = k.entry.substring(0, 100) + (k.entry.length > 100 ? '...' : '')

      // Skip knowledge that's already properly linked
      if (userId && userExists && collectionId && collectionExists) {
        continue
      }

      // Check if fixable
      if (!userId || !userExists) {
        unfixableKnowledge.push({
          knowledgeId: k.id,
          entryPreview,
          userId,
          reason: userId ? `User ID ${userId} does not exist` : 'No user reference',
        })
        continue
      }

      const userCollections = userIdToCollections.get(userId) || []

      if (userCollections.length === 0) {
        unfixableKnowledge.push({
          knowledgeId: k.id,
          entryPreview,
          userId,
          reason: 'User has no collections - will create "Recovered" collection on fix',
        })
        // Actually this IS fixable - we can create a collection
        fixableKnowledge.push({
          knowledgeId: k.id,
          entryPreview,
          userId,
          collectionId,
          issue: collectionId
            ? `Collection ID ${collectionId} does not exist`
            : 'No collection reference',
          userCollections: [],
        })
        // Remove from unfixable since we added to fixable
        unfixableKnowledge.pop()
        continue
      }

      fixableKnowledge.push({
        knowledgeId: k.id,
        entryPreview,
        userId,
        collectionId,
        issue: collectionId
          ? `Collection ID ${collectionId} does not exist`
          : 'No collection reference',
        userCollections,
      })
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalKnowledge: allKnowledge.totalDocs,
        fixable: fixableKnowledge.length,
        unfixable: unfixableKnowledge.length,
      },
      fixableKnowledge: fixableKnowledge.slice(0, 50),
      unfixableKnowledge: unfixableKnowledge.slice(0, 50),
      message:
        'Preview complete. Use POST /api/admin/fix/knowledge to execute the fix.',
    })
  } catch (error: any) {
    console.error('Knowledge fix preview error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Preview failed' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/fix/knowledge
 *
 * Fix orphaned knowledge entries by reassigning them to collections.
 *
 * Body:
 * - strategy: 'first_collection' | 'create_recovered' (default: 'create_recovered')
 *   - first_collection: Assign to user's first existing collection
 *   - create_recovered: Create a "Recovered Knowledge" collection for orphaned entries
 * - knowledgeIds?: number[] - Only fix specific knowledge entries
 * - userId?: number - Only fix knowledge for a specific user
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
      strategy?: 'first_collection' | 'create_recovered'
      knowledgeIds?: number[]
      userId?: number
    }

    const strategy = body.strategy || 'create_recovered'
    const specificKnowledgeIds = body.knowledgeIds
    const filterUserId = body.userId

    // Fetch all users
    const allUsers = await payload.find({
      collection: 'users',
      limit: 1000,
      overrideAccess: true,
    })

    const userIdSet = new Set<number>()
    for (const user of allUsers.docs) {
      userIdSet.add((user as { id: number }).id)
    }

    // Fetch all knowledge collections
    const allCollections = await payload.find({
      collection: 'knowledgeCollections',
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    })

    const collectionIdSet = new Set<number>()
    const userIdToCollections = new Map<number, Array<{ id: number; name: string }>>()
    for (const col of allCollections.docs) {
      const c = col as { id: number; name: string; user: number | { id: number } | null }
      collectionIdSet.add(c.id)
      const userId = getRelationId(c.user)
      if (userId) {
        const existing = userIdToCollections.get(userId) || []
        existing.push({ id: c.id, name: c.name })
        userIdToCollections.set(userId, existing)
      }
    }

    // Track created recovery collections
    const userIdToRecoveryCollection = new Map<number, number>()

    // Fetch knowledge to fix
    const knowledgeQuery: Record<string, unknown> = {}
    if (filterUserId) {
      knowledgeQuery.user = { equals: filterUserId }
    }

    const allKnowledge = await payload.find({
      collection: 'knowledge',
      where: Object.keys(knowledgeQuery).length > 0 ? knowledgeQuery : undefined,
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    })

    // Filter to knowledge that needs fixing
    let knowledgeToFix = allKnowledge.docs.filter((k: any) => {
      const userId = getRelationId(k.user)
      const collectionId = getRelationId(k.knowledge_collection)

      const userExists = userId ? userIdSet.has(userId) : false
      const collectionExists = collectionId ? collectionIdSet.has(collectionId) : false

      // Only include orphaned knowledge with valid users
      return userId && userExists && (!collectionId || !collectionExists)
    })

    // Filter to specific IDs if provided
    if (specificKnowledgeIds && specificKnowledgeIds.length > 0) {
      const idSet = new Set(specificKnowledgeIds)
      knowledgeToFix = knowledgeToFix.filter((k: any) => idSet.has(k.id))
    }

    const results: Array<{
      knowledgeId: number
      status: 'fixed' | 'skipped' | 'error'
      collectionId?: number
      collectionName?: string
      reason?: string
    }> = []

    for (const knowledge of knowledgeToFix) {
      const k = knowledge as {
        id: number
        entry: string
        user: number | { id: number } | null
      }

      const userId = getRelationId(k.user)!
      let targetCollectionId: number | null = null
      let targetCollectionName: string | null = null

      if (strategy === 'first_collection') {
        // Use the first existing collection for this user
        const userCollections = userIdToCollections.get(userId) || []
        if (userCollections.length > 0) {
          targetCollectionId = userCollections[0].id
          targetCollectionName = userCollections[0].name
        }
      }

      if (strategy === 'create_recovered' || !targetCollectionId) {
        // Check if we already created a recovery collection for this user
        let recoveryCollectionId = userIdToRecoveryCollection.get(userId)

        if (!recoveryCollectionId) {
          // Check if user already has a "Recovered Knowledge" collection
          const existingCollections = userIdToCollections.get(userId) || []
          const existingRecovery = existingCollections.find(
            (c) => c.name === 'Recovered Knowledge'
          )

          if (existingRecovery) {
            recoveryCollectionId = existingRecovery.id
          } else {
            // Create a new recovery collection
            try {
              const newCollection = await payload.create({
                collection: 'knowledgeCollections',
                data: {
                  name: 'Recovered Knowledge',
                  user: userId,
                  description:
                    'Automatically created collection for recovered orphaned knowledge entries.',
                  sharing_settings: {
                    sharing_level: 'private',
                    allow_collaboration: false,
                    allow_fork: false,
                    is_public: false,
                  },
                },
                overrideAccess: true,
              })

              recoveryCollectionId = newCollection.id

              // Add to tracking maps
              collectionIdSet.add(newCollection.id)
              const existing = userIdToCollections.get(userId) || []
              existing.push({ id: newCollection.id, name: 'Recovered Knowledge' })
              userIdToCollections.set(userId, existing)
            } catch (createError: any) {
              results.push({
                knowledgeId: k.id,
                status: 'error',
                reason: `Failed to create recovery collection: ${createError.message}`,
              })
              continue
            }
          }

          userIdToRecoveryCollection.set(userId, recoveryCollectionId)
        }

        targetCollectionId = recoveryCollectionId
        targetCollectionName = 'Recovered Knowledge'
      }

      if (!targetCollectionId) {
        results.push({
          knowledgeId: k.id,
          status: 'skipped',
          reason: 'No target collection available',
        })
        continue
      }

      // Update the knowledge entry
      try {
        await payload.update({
          collection: 'knowledge',
          id: k.id,
          data: {
            knowledge_collection: targetCollectionId,
          },
          overrideAccess: true,
        })

        results.push({
          knowledgeId: k.id,
          status: 'fixed',
          collectionId: targetCollectionId,
          collectionName: targetCollectionName || undefined,
        })
      } catch (updateError: any) {
        results.push({
          knowledgeId: k.id,
          status: 'error',
          reason: updateError.message,
        })
      }
    }

    // Summary
    const summary = {
      processed: results.length,
      fixed: results.filter((r) => r.status === 'fixed').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
      errors: results.filter((r) => r.status === 'error').length,
      recoveryCollectionsCreated: userIdToRecoveryCollection.size,
    }

    return NextResponse.json({
      success: true,
      summary,
      results,
      message: `Fix complete. Fixed ${summary.fixed} knowledge entries.`,
    })
  } catch (error: any) {
    console.error('Knowledge fix error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Fix failed' },
      { status: 500 }
    )
  }
}
