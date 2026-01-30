import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

/**
 * GET /api/creators/[username]
 *
 * Fetch a single creator profile by username.
 *
 * Response:
 * - success: boolean
 * - creator: CreatorProfile object
 * - isOwner: boolean - whether the authenticated user owns this profile
 * - message?: string
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params

    // Get Payload instance
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Fetch creator profile by username
    const creators = await payload.find({
      collection: 'creatorProfiles',
      where: {
        username: {
          equals: username.toLowerCase(),
        },
      },
      depth: 2,
      overrideAccess: true,
    })

    if (creators.docs.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Creator profile not found' },
        { status: 404 }
      )
    }

    const creator = creators.docs[0]

    // Check if profile is accessible
    const clerkUser = await currentUser()
    let isOwner = false
    let payloadUserId: string | null = null

    if (clerkUser) {
      const users = await payload.find({
        collection: 'users',
        where: {
          email: {
            equals: clerkUser.emailAddresses[0]?.emailAddress,
          },
        },
        overrideAccess: true,
      })

      if (users.docs.length > 0) {
        payloadUserId = String(users.docs[0].id)
        isOwner =
          typeof creator.user === 'object' && creator.user !== null
            ? String(creator.user.id) === payloadUserId
            : String(creator.user) === payloadUserId
      }
    }

    // Check visibility
    const visibility = creator.profile_settings?.profile_visibility || 'public'

    if (visibility === 'private' && !isOwner) {
      return NextResponse.json(
        { success: false, message: 'This creator profile is private' },
        { status: 403 }
      )
    }

    // Update last_active if owner is viewing
    if (isOwner) {
      await payload.update({
        collection: 'creatorProfiles',
        id: creator.id,
        data: {
          last_active: new Date().toISOString(),
        },
        overrideAccess: true,
      })
    }

    // Compute real portfolio stats from actual data
    const creatorUserId = typeof creator.user === 'object' && creator.user !== null
      ? creator.user.id
      : creator.user

    // Get all bots created by this user
    const userBots = await payload.find({
      collection: 'bot',
      where: {
        user: { equals: creatorUserId },
      },
      limit: 500,
      overrideAccess: true,
    })

    // Calculate real bot count
    const realBotCount = userBots.totalDocs

    // Get bot IDs for interaction and conversation lookup
    const botIds = userBots.docs.map((bot) => bot.id)

    // Count actual conversations that include these bots
    // We need to query differently because array field queries don't work reliably in D1/SQLite
    let realTotalConversations = 0
    if (botIds.length > 0) {
      // Fetch conversations with depth to get bot_participation data
      const conversations = await payload.find({
        collection: 'conversation',
        depth: 1,
        limit: 1000, // Get a reasonable sample
        overrideAccess: true,
      })

      // Count conversations that have any of the creator's bots
      // Check both bot_participation array AND participants.bots JSON field
      const botIdSet = new Set(botIds.map(id => String(id)))
      realTotalConversations = conversations.docs.filter(conv => {
        // Check bot_participation array (newer format)
        const participation = conv.bot_participation as Array<{ bot_id: number | { id: number } }> | undefined
        if (participation && Array.isArray(participation)) {
          const found = participation.some(p => {
            const botId = typeof p.bot_id === 'object' ? String(p.bot_id?.id) : String(p.bot_id)
            return botIdSet.has(botId)
          })
          if (found) return true
        }
        // Check participants.bots JSON field (older format)
        // Note: JSON fields in D1/SQLite may be stored as strings
        let participants = (conv as any).participants
        if (typeof participants === 'string') {
          try {
            participants = JSON.parse(participants)
          } catch {
            participants = null
          }
        }
        if (participants && Array.isArray(participants.bots)) {
          return participants.bots.some((id: any) => botIdSet.has(String(id)))
        }
        return false
      }).length
    }

    // Get all likes/favorites on the creator's bots
    // D1/SQLite has a limit on IN clause parameters, so batch in chunks of 50
    let realTotalLikes = 0
    if (botIds.length > 0) {
      const BATCH_SIZE = 50
      for (let i = 0; i < botIds.length; i += BATCH_SIZE) {
        const batchIds = botIds.slice(i, i + BATCH_SIZE)
        const interactions = await payload.find({
          collection: 'botInteractions',
          where: {
            and: [
              { bot: { in: batchIds } },
              { liked: { equals: true } },
            ],
          },
          limit: 0, // Just get count
          overrideAccess: true,
        })
        realTotalLikes += interactions.totalDocs
      }
    }

    // Get real follower count
    const followers = await payload.find({
      collection: 'creatorFollows',
      where: {
        following: { equals: creator.id },
      },
      limit: 0,
      overrideAccess: true,
    })
    const realFollowerCount = followers.totalDocs

    // Get real following count (how many creators this user follows)
    const following = await payload.find({
      collection: 'creatorFollows',
      where: {
        follower: { equals: creatorUserId },
      },
      limit: 0,
      overrideAccess: true,
    })
    const realFollowingCount = following.totalDocs

    // Check if current user is following this creator
    let isFollowing = false
    if (payloadUserId && !isOwner) {
      const userFollow = await payload.find({
        collection: 'creatorFollows',
        where: {
          and: [
            { follower: { equals: payloadUserId } },
            { following: { equals: creator.id } },
          ],
        },
        overrideAccess: true,
      })
      isFollowing = userFollow.docs.length > 0
    }

    // Get all public bots by this creator (for profile display)
    const publicBots = userBots.docs
      .filter((bot: any) => bot.is_public || bot.sharing?.visibility === 'public')
      .map((bot: any) => ({
        id: bot.id,
        name: bot.name,
        slug: bot.slug,
        description: bot.description,
        picture: bot.picture,
        likes_count: bot.likes_count || 0,
        favorites_count: bot.favorites_count || 0,
        created_date: bot.created_date,
      }))

    // Get recent activity (bot creations and updates) - sorted by date
    const recentActivity = userBots.docs
      .slice(0, 10) // Get up to 10 most recent
      .map((bot: any) => {
        const createdDate = bot.created_date ? new Date(bot.created_date) : null
        const modifiedDate = bot.updatedAt ? new Date(bot.updatedAt) : null

        // If modified date is significantly after created date, it's an update
        const isUpdate = modifiedDate && createdDate &&
          (modifiedDate.getTime() - createdDate.getTime()) > 60000 // More than 1 minute difference

        return {
          type: isUpdate ? 'bot_updated' : 'bot_created',
          bot: {
            id: bot.id,
            name: bot.name,
            slug: bot.slug,
            picture: bot.picture,
          },
          date: isUpdate ? bot.updatedAt : bot.created_date,
        }
      })
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10) // Keep top 10 most recent activities

    // Merge computed stats into the creator object
    const creatorWithRealStats = {
      ...creator,
      portfolio: {
        ...creator.portfolio,
        bot_count: realBotCount,
        total_conversations: realTotalConversations,
      },
      community_stats: {
        ...creator.community_stats,
        total_likes: realTotalLikes,
        follower_count: realFollowerCount,
        following_count: realFollowingCount,
      },
    }

    return NextResponse.json({
      success: true,
      creator: creatorWithRealStats,
      publicBots,
      recentActivity,
      isOwner,
      isFollowing,
    })
  } catch (error: any) {
    console.error('Fetch creator profile error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch creator profile' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/creators/[username]
 *
 * Update a creator profile. Only the owner can update their profile.
 *
 * Request body: Same as POST, all fields optional
 *
 * Response:
 * - success: boolean
 * - creator: Updated CreatorProfile object
 * - message?: string
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params

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

    // Fetch creator profile by username
    const creators = await payload.find({
      collection: 'creatorProfiles',
      where: {
        username: {
          equals: username.toLowerCase(),
        },
      },
      overrideAccess: true,
    })

    if (creators.docs.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Creator profile not found' },
        { status: 404 }
      )
    }

    const creator = creators.docs[0]

    // Verify ownership
    const isOwner =
      typeof creator.user === 'object' && creator.user !== null
        ? String(creator.user.id) === String(payloadUser.id)
        : String(creator.user) === String(payloadUser.id)

    if (!isOwner) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: You do not own this profile' },
        { status: 403 }
      )
    }

    // Get request body
    const body = (await request.json()) as {
      display_name?: string
      bio?: string
      profile_media?: {
        avatar?: number | null
        banner_image?: number | null
      }
      portfolio?: {
        featured_bots?: number[]
      }
      social_links?: {
        website?: string
        github?: string
        twitter?: string
        linkedin?: string
        discord?: string
        youtube?: string
        kofi?: string
        patreon?: string
        other_links?: Array<{ platform: string; url: string }>
      }
      creator_info?: {
        creator_type?: string
        specialties?: Array<{ specialty: string }>
        experience_level?: string
        location?: string
        languages?: Array<{ language: string }>
      }
      profile_settings?: {
        profile_visibility?: string
        allow_collaborations?: boolean
        accept_commissions?: boolean
        commission_info?: string
      }
      tags?: Array<{ tag: string }>
    }

    // Update creator profile
    const updatedCreator = await payload.update({
      collection: 'creatorProfiles',
      id: creator.id,
      data: {
        ...body,
        modified_timestamp: new Date().toISOString(),
        last_active: new Date().toISOString(),
      } as any,
      overrideAccess: true,
    })

    return NextResponse.json({
      success: true,
      creator: updatedCreator,
      message: 'Creator profile updated successfully',
    })
  } catch (error: any) {
    console.error('Update creator profile error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update creator profile' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/creators/[username]
 *
 * Delete a creator profile. Only the owner can delete their profile.
 *
 * Response:
 * - success: boolean
 * - message: string
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params

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

    // Fetch creator profile by username
    const creators = await payload.find({
      collection: 'creatorProfiles',
      where: {
        username: {
          equals: username.toLowerCase(),
        },
      },
      overrideAccess: true,
    })

    if (creators.docs.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Creator profile not found' },
        { status: 404 }
      )
    }

    const creator = creators.docs[0]

    // Verify ownership
    const deleteIsOwner =
      typeof creator.user === 'object' && creator.user !== null
        ? String(creator.user.id) === String(payloadUser.id)
        : String(creator.user) === String(payloadUser.id)

    if (!deleteIsOwner) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: You do not own this profile' },
        { status: 403 }
      )
    }

    // Delete creator profile
    await payload.delete({
      collection: 'creatorProfiles',
      id: creator.id,
      overrideAccess: true,
    })

    return NextResponse.json({
      success: true,
      message: 'Creator profile deleted successfully',
    })
  } catch (error: any) {
    console.error('Delete creator profile error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete creator profile' },
      { status: 500 }
    )
  }
}
