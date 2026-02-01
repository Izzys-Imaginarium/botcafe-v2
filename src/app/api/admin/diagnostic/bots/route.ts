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
 * GET /api/admin/diagnostic/bots
 *
 * Admin endpoint to diagnose bot data integrity issues.
 * Checks for:
 * - Bots with missing or invalid creator_profile references
 * - Bots with missing user references
 * - Bots where the user exists but has no creator profile
 *
 * Query params:
 * - userId: Only check bots for a specific user ID
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

    // Fetch all users and their creator profiles
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

    // Fetch all creator profiles
    const allCreatorProfiles = await payload.find({
      collection: 'creatorProfiles',
      limit: 1000,
      overrideAccess: true,
    })

    const creatorProfileIdSet = new Set<number>()
    const userIdToCreatorProfile = new Map<number, { id: number; username: string }>()
    for (const cp of allCreatorProfiles.docs) {
      const profile = cp as { id: number; username: string; user: number | { id: number } }
      creatorProfileIdSet.add(profile.id)
      const userId = getRelationId(profile.user)
      if (userId) {
        userIdToCreatorProfile.set(userId, { id: profile.id, username: profile.username })
      }
    }

    // Fetch bots (optionally filtered by user)
    const botQuery: Record<string, unknown> = {}
    if (filterUserId) {
      botQuery.user = { equals: parseInt(filterUserId, 10) }
    }

    const allBots = await payload.find({
      collection: 'bot',
      where: Object.keys(botQuery).length > 0 ? botQuery : undefined,
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    })

    // Analyze each bot
    const issues: Array<{
      botId: number
      botName: string
      botSlug: string
      userId: number | null
      userEmail: string | null
      userExists: boolean
      creatorProfileId: number | null
      creatorProfileExists: boolean
      userHasCreatorProfile: boolean
      suggestedCreatorProfile?: { id: number; username: string }
      issue: string
    }> = []

    for (const bot of allBots.docs) {
      const b = bot as {
        id: number
        name: string
        slug: string
        user: number | { id: number } | null
        creator_profile: number | { id: number } | null
      }

      const userId = getRelationId(b.user)
      const creatorProfileId = getRelationId(b.creator_profile)

      const userExists = userId ? userIdSet.has(userId) : false
      const userEmail = userId ? userIdToEmail.get(userId) || null : null
      const creatorProfileExists = creatorProfileId ? creatorProfileIdSet.has(creatorProfileId) : false
      const userCreatorProfile = userId ? userIdToCreatorProfile.get(userId) : null

      // Check for issues
      if (!userId) {
        issues.push({
          botId: b.id,
          botName: b.name,
          botSlug: b.slug,
          userId: null,
          userEmail: null,
          userExists: false,
          creatorProfileId,
          creatorProfileExists,
          userHasCreatorProfile: false,
          issue: 'Bot has no user reference',
        })
      } else if (!userExists) {
        issues.push({
          botId: b.id,
          botName: b.name,
          botSlug: b.slug,
          userId,
          userEmail: null,
          userExists: false,
          creatorProfileId,
          creatorProfileExists,
          userHasCreatorProfile: false,
          issue: `User ID ${userId} does not exist`,
        })
      } else if (!creatorProfileId || !creatorProfileExists) {
        issues.push({
          botId: b.id,
          botName: b.name,
          botSlug: b.slug,
          userId,
          userEmail,
          userExists: true,
          creatorProfileId,
          creatorProfileExists,
          userHasCreatorProfile: !!userCreatorProfile,
          suggestedCreatorProfile: userCreatorProfile || undefined,
          issue: creatorProfileId
            ? `Creator profile ID ${creatorProfileId} does not exist`
            : 'Bot has no creator_profile reference',
        })
      }
    }

    // Summary
    const summary = {
      totalBots: allBots.totalDocs,
      botsWithIssues: issues.length,
      byIssueType: {
        noUser: issues.filter((i) => i.issue.includes('no user')).length,
        userNotFound: issues.filter((i) => i.issue.includes('does not exist') && i.userId).length,
        noCreatorProfile: issues.filter((i) => i.issue.includes('creator_profile')).length,
      },
      fixableWithExistingProfile: issues.filter((i) => i.suggestedCreatorProfile).length,
    }

    return NextResponse.json({
      success: true,
      summary,
      issues,
      message:
        'Diagnostic complete. Use POST /api/admin/fix/bots to fix bots with missing creator profiles.',
    })
  } catch (error: any) {
    console.error('Bot diagnostic error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Diagnostic failed' },
      { status: 500 }
    )
  }
}
