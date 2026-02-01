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
 * GET /api/admin/diagnostic/knowledge
 *
 * Admin endpoint to diagnose knowledge entry data integrity issues.
 * Checks for:
 * - Knowledge entries with missing/invalid knowledge_collection references
 * - Knowledge entries with missing/invalid user references
 * - Knowledge entries where user doesn't match the collection's user
 * - Orphaned knowledge (collection was deleted)
 *
 * Query params:
 * - userId: Only check knowledge for a specific user ID
 * - collectionId: Only check knowledge in a specific collection
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
    const filterCollectionId = searchParams.get('collectionId')

    // Fetch all users
    const allUsers = await payload.find({
      collection: 'users',
      limit: 1000,
      overrideAccess: true,
    })

    const userIdSet = new Set<number>()
    const userIdToEmail = new Map<number, string>()
    for (const user of allUsers.docs) {
      const u = user as { id: number; email: string }
      userIdSet.add(u.id)
      userIdToEmail.set(u.id, u.email)
    }

    // Fetch all knowledge collections
    const allCollections = await payload.find({
      collection: 'knowledgeCollections',
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    })

    const collectionIdSet = new Set<number>()
    const collectionIdToData = new Map<number, { id: number; name: string; userId: number | null }>()
    for (const col of allCollections.docs) {
      const c = col as { id: number; name: string; user: number | { id: number } | null }
      collectionIdSet.add(c.id)
      collectionIdToData.set(c.id, {
        id: c.id,
        name: c.name,
        userId: getRelationId(c.user),
      })
    }

    // Fetch knowledge (optionally filtered)
    const knowledgeQuery: Record<string, unknown> = {}
    if (filterUserId) {
      knowledgeQuery.user = { equals: parseInt(filterUserId, 10) }
    }
    if (filterCollectionId) {
      knowledgeQuery.knowledge_collection = { equals: parseInt(filterCollectionId, 10) }
    }

    const allKnowledge = await payload.find({
      collection: 'knowledge',
      where: Object.keys(knowledgeQuery).length > 0 ? knowledgeQuery : undefined,
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    })

    // Analyze each knowledge entry
    const issues: Array<{
      knowledgeId: number
      entryPreview: string
      userId: number | null
      userEmail: string | null
      userExists: boolean
      collectionId: number | null
      collectionName: string | null
      collectionExists: boolean
      collectionUserId: number | null
      userMismatch: boolean
      issue: string
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
      const userEmail = userId ? userIdToEmail.get(userId) || null : null
      const collectionData = collectionId ? collectionIdToData.get(collectionId) : null
      const collectionExists = collectionId ? collectionIdSet.has(collectionId) : false

      const entryPreview = k.entry.substring(0, 100) + (k.entry.length > 100 ? '...' : '')

      // Check for issues
      if (!userId) {
        issues.push({
          knowledgeId: k.id,
          entryPreview,
          userId: null,
          userEmail: null,
          userExists: false,
          collectionId,
          collectionName: collectionData?.name || null,
          collectionExists,
          collectionUserId: collectionData?.userId || null,
          userMismatch: false,
          issue: 'Knowledge has no user reference',
        })
      } else if (!userExists) {
        issues.push({
          knowledgeId: k.id,
          entryPreview,
          userId,
          userEmail: null,
          userExists: false,
          collectionId,
          collectionName: collectionData?.name || null,
          collectionExists,
          collectionUserId: collectionData?.userId || null,
          userMismatch: false,
          issue: `User ID ${userId} does not exist`,
        })
      } else if (!collectionId) {
        issues.push({
          knowledgeId: k.id,
          entryPreview,
          userId,
          userEmail,
          userExists: true,
          collectionId: null,
          collectionName: null,
          collectionExists: false,
          collectionUserId: null,
          userMismatch: false,
          issue: 'Knowledge has no collection reference',
        })
      } else if (!collectionExists) {
        issues.push({
          knowledgeId: k.id,
          entryPreview,
          userId,
          userEmail,
          userExists: true,
          collectionId,
          collectionName: null,
          collectionExists: false,
          collectionUserId: null,
          userMismatch: false,
          issue: `Collection ID ${collectionId} does not exist (orphaned knowledge)`,
        })
      } else if (collectionData && collectionData.userId !== userId) {
        issues.push({
          knowledgeId: k.id,
          entryPreview,
          userId,
          userEmail,
          userExists: true,
          collectionId,
          collectionName: collectionData.name,
          collectionExists: true,
          collectionUserId: collectionData.userId,
          userMismatch: true,
          issue: `User mismatch: knowledge user (${userId}) != collection user (${collectionData.userId})`,
        })
      }
    }

    // Summary
    const summary = {
      totalKnowledge: allKnowledge.totalDocs,
      totalCollections: allCollections.totalDocs,
      knowledgeWithIssues: issues.length,
      byIssueType: {
        noUser: issues.filter((i) => i.issue.includes('no user')).length,
        userNotFound: issues.filter((i) => i.issue.includes('does not exist') && i.userId).length,
        noCollection: issues.filter((i) => i.issue.includes('no collection')).length,
        orphanedKnowledge: issues.filter((i) => i.issue.includes('orphaned')).length,
        userMismatch: issues.filter((i) => i.userMismatch).length,
      },
    }

    return NextResponse.json({
      success: true,
      summary,
      issues: issues.slice(0, 100), // Limit to first 100 issues
      message:
        issues.length > 100
          ? `Showing first 100 of ${issues.length} issues. Use filters to narrow down.`
          : 'Diagnostic complete.',
    })
  } catch (error: any) {
    console.error('Knowledge diagnostic error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Diagnostic failed' },
      { status: 500 }
    )
  }
}
