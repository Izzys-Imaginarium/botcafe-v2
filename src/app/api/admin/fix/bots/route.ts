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
 * GET /api/admin/fix/bots
 *
 * Preview which bots would be fixed.
 * Returns a list of bots with missing creator_profile that can be auto-fixed.
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

    // Find bots that need fixing
    const fixableBots: Array<{
      botId: number
      botName: string
      botSlug: string
      userId: number
      currentCreatorProfileId: number | null
      suggestedCreatorProfile: { id: number; username: string }
    }> = []

    const unfixableBots: Array<{
      botId: number
      botName: string
      userId: number | null
      reason: string
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
      const creatorProfileExists = creatorProfileId ? creatorProfileIdSet.has(creatorProfileId) : false

      // Skip bots with valid creator profiles
      if (creatorProfileId && creatorProfileExists) {
        continue
      }

      // Bot needs fixing
      if (!userId) {
        unfixableBots.push({
          botId: b.id,
          botName: b.name,
          userId: null,
          reason: 'Bot has no user - cannot determine owner',
        })
        continue
      }

      const userCreatorProfile = userIdToCreatorProfile.get(userId)
      if (!userCreatorProfile) {
        unfixableBots.push({
          botId: b.id,
          botName: b.name,
          userId,
          reason: 'User has no creator profile - must create one first',
        })
        continue
      }

      fixableBots.push({
        botId: b.id,
        botName: b.name,
        botSlug: b.slug,
        userId,
        currentCreatorProfileId: creatorProfileId,
        suggestedCreatorProfile: userCreatorProfile,
      })
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalBots: allBots.totalDocs,
        fixable: fixableBots.length,
        unfixable: unfixableBots.length,
      },
      fixableBots,
      unfixableBots,
      message:
        'Preview complete. Use POST /api/admin/fix/bots to execute the fix.',
    })
  } catch (error: any) {
    console.error('Bot fix preview error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Preview failed' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/fix/bots
 *
 * Fix bots with missing creator_profile by linking them to their owner's existing creator profile.
 *
 * Body (optional):
 * - botIds: number[] - Only fix specific bots (if not provided, fixes all fixable bots)
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
      botIds?: number[]
    }

    const specificBotIds = body.botIds

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

    // Fetch all bots
    const allBots = await payload.find({
      collection: 'bot',
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    })

    // Filter to bots that need fixing
    let botsToFix = allBots.docs.filter((bot: any) => {
      const creatorProfileId = getRelationId(bot.creator_profile)
      const creatorProfileExists = creatorProfileId ? creatorProfileIdSet.has(creatorProfileId) : false
      return !creatorProfileId || !creatorProfileExists
    })

    // Filter to specific IDs if provided
    if (specificBotIds && specificBotIds.length > 0) {
      const idSet = new Set(specificBotIds)
      botsToFix = botsToFix.filter((bot: any) => idSet.has(bot.id))
    }

    const results: Array<{
      botId: number
      botName: string
      status: 'fixed' | 'skipped' | 'error'
      creatorProfileId?: number
      creatorUsername?: string
      reason?: string
    }> = []

    for (const bot of botsToFix) {
      const b = bot as {
        id: number
        name: string
        slug: string
        user: number | { id: number } | null
        creator_profile: number | { id: number } | null
        creator_display_name?: string
      }

      const userId = getRelationId(b.user)

      if (!userId) {
        results.push({
          botId: b.id,
          botName: b.name,
          status: 'skipped',
          reason: 'Bot has no user reference',
        })
        continue
      }

      const creatorProfile = userIdToCreatorProfile.get(userId)

      if (!creatorProfile) {
        results.push({
          botId: b.id,
          botName: b.name,
          status: 'skipped',
          reason: 'User has no creator profile',
        })
        continue
      }

      // Update the bot with the creator profile
      try {
        await payload.update({
          collection: 'bot',
          id: b.id,
          data: {
            creator_profile: creatorProfile.id,
            // Also ensure creator_display_name is set
            creator_display_name: b.creator_display_name || creatorProfile.username,
          },
          overrideAccess: true,
        })

        results.push({
          botId: b.id,
          botName: b.name,
          status: 'fixed',
          creatorProfileId: creatorProfile.id,
          creatorUsername: creatorProfile.username,
        })
      } catch (updateError: any) {
        results.push({
          botId: b.id,
          botName: b.name,
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
    }

    return NextResponse.json({
      success: true,
      summary,
      results,
      message: `Fix complete. Fixed ${summary.fixed} bots.`,
    })
  } catch (error: any) {
    console.error('Bot fix error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Fix failed' },
      { status: 500 }
    )
  }
}
