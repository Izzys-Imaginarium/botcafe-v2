import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

/**
 * GET /api/creators
 *
 * Fetch all public creator profiles with optional filtering.
 *
 * Query params:
 * - page: number (default 1)
 * - limit: number (default 20)
 * - featured: boolean - filter to featured creators only
 * - specialty: string - filter by specialty
 * - verification: string - filter by verification status
 * - sort: string - sort field (default 'follower_count')
 * - search: string - search by username or display name
 *
 * Response:
 * - success: boolean
 * - creators: Array of CreatorProfile objects
 * - pagination: { page, limit, totalPages, totalDocs }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const featured = searchParams.get('featured') === 'true'
    const specialty = searchParams.get('specialty')
    const verification = searchParams.get('verification')
    // Payload sort uses dot notation for nested fields
    const sort = searchParams.get('sort') || '-community_stats.follower_count'
    const search = searchParams.get('search')
    const filterFollowed = searchParams.get('followed') === 'true'

    // Get Payload instance
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Get current user's followed creators if filter is active
    let followedCreatorIds: number[] = []
    if (filterFollowed) {
      const clerkUser = await currentUser()
      if (clerkUser) {
        // Find the Payload user
        const users = await payload.find({
          collection: 'users',
          where: {
            email: { equals: clerkUser.emailAddresses[0]?.emailAddress },
          },
          limit: 1,
          overrideAccess: true,
        })

        if (users.docs.length > 0) {
          const payloadUserId = users.docs[0].id

          // Fetch all creators this user follows
          const follows = await payload.find({
            collection: 'creatorFollows',
            where: {
              follower: { equals: payloadUserId },
            },
            limit: 500,
            overrideAccess: true,
          })

          for (const follow of follows.docs as any[]) {
            const followingId = typeof follow.following === 'object' ? follow.following?.id : follow.following
            if (followingId) {
              const numericId = typeof followingId === 'number' ? followingId : parseInt(followingId, 10)
              if (!isNaN(numericId)) {
                followedCreatorIds.push(numericId)
              }
            }
          }
        }
      }
    }

    // Build where clause - filter to public profiles only
    // Then apply additional filters in-memory for D1 compatibility
    const whereClause: any = {}

    // Only add search filter if provided (simple fields work with D1)
    if (search) {
      whereClause.or = [
        {
          username: {
            contains: search.toLowerCase(),
          },
        },
        {
          display_name: {
            contains: search,
          },
        },
      ]
    }

    if (featured) {
      whereClause.featured_creator = { equals: true }
    }

    if (verification) {
      whereClause.verification_status = { equals: verification }
    }

    // Fetch ALL creators - we need them all for proper in-memory sorting
    // Don't pass page here since we paginate in memory after sorting
    const creators = await payload.find({
      collection: 'creatorProfiles',
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      limit: 500, // Fetch all creators (increase if needed)
      sort: '-createdAt',
      depth: 2,
      overrideAccess: true,
    })

    // Filter to public profiles in memory (D1 nested field query workaround)
    const publicCreators = creators.docs.filter((creator: any) => {
      const visibility = creator.profile_settings?.profile_visibility
      return visibility === 'public' || !visibility // Default to public if not set
    })

    // Apply specialty filter in memory if needed
    let filteredCreators = specialty
      ? publicCreators.filter((creator: any) => {
          const specialties = creator.creator_info?.specialties || []
          return specialties.some((s: any) => s.specialty === specialty)
        })
      : publicCreators

    // Apply followed filter if requested
    if (filterFollowed) {
      if (followedCreatorIds.length === 0) {
        // User doesn't follow anyone, return empty results
        filteredCreators = []
      } else {
        filteredCreators = filteredCreators.filter((creator: any) =>
          followedCreatorIds.includes(typeof creator.id === 'number' ? creator.id : parseInt(creator.id, 10))
        )
      }
    }

    // Paginate the filtered results
    const startIndex = (page - 1) * limit
    const paginatedCreators = filteredCreators.slice(startIndex, startIndex + limit)

    // Create a mock creators object with the filtered/paginated results
    const creatorsResult = {
      docs: paginatedCreators,
      totalDocs: filteredCreators.length,
      page,
      limit,
      totalPages: Math.ceil(filteredCreators.length / limit),
    }

    // Compute real stats for each creator
    // Get all creator profile IDs and user IDs for efficient batch lookup
    // Ensure IDs are numbers and filter out invalid values
    const creatorProfileIds = filteredCreators
      .map((creator: any) => typeof creator.id === 'number' ? creator.id : parseInt(creator.id, 10))
      .filter((id: number) => !isNaN(id) && id > 0)

    // Also extract user IDs for fallback bot lookup (migrated bots may only have user, not creator_profile)
    const userIds = filteredCreators.map((creator: any) => {
      const userId = typeof creator.user === 'object' && creator.user !== null
        ? creator.user.id
        : creator.user
      return typeof userId === 'number' ? userId : parseInt(userId, 10)
    }).filter((id: number) => !isNaN(id) && id > 0)

    // Batch fetch all bots - try by creator_profile first, then by user as fallback
    // D1/SQLite has a limit on IN clause parameters, so batch in smaller chunks
    let allBots: any[] = []
    const BATCH_SIZE = 30  // Reduced from 50 for D1 safety

    // Try fetching by creator_profile first
    if (creatorProfileIds.length > 0) {
      try {
        for (let i = 0; i < creatorProfileIds.length; i += BATCH_SIZE) {
          const batchIds = creatorProfileIds.slice(i, i + BATCH_SIZE)
          const botsResult = await payload.find({
            collection: 'bot',
            where: {
              creator_profile: { in: batchIds },
            },
            limit: 500,
            overrideAccess: true,
          })
          allBots = allBots.concat(botsResult.docs)
        }
      } catch (e: any) {
        console.warn('Could not fetch bots by creator_profile:', e?.message || e)
      }
    }

    // If no bots found by creator_profile, try by user (for migrated data)
    if (allBots.length === 0 && userIds.length > 0) {
      try {
        for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
          const batchIds = userIds.slice(i, i + BATCH_SIZE)
          const botsResult = await payload.find({
            collection: 'bot',
            where: {
              user: { in: batchIds },
            },
            limit: 500,
            overrideAccess: true,
          })
          allBots = allBots.concat(botsResult.docs)
        }
      } catch (e: any) {
        console.warn('Could not fetch bots by user:', e?.message || e)
      }
    }

    // Get all bot IDs for interaction lookup - ensure they're numbers
    const allBotIds = allBots
      .map((bot) => typeof bot.id === 'number' ? bot.id : parseInt(bot.id, 10))
      .filter((id: number) => !isNaN(id) && id > 0)

    // Batch fetch all likes on these bots
    // D1/SQLite has a limit on IN clause parameters, so batch in smaller chunks
    let allLikes: any[] = []
    if (allBotIds.length > 0) {
      try {
        const LIKES_BATCH_SIZE = 30
        for (let i = 0; i < allBotIds.length; i += LIKES_BATCH_SIZE) {
          const batchIds = allBotIds.slice(i, i + LIKES_BATCH_SIZE)
          const likesResult = await payload.find({
            collection: 'botInteractions',
            where: {
              and: [
                { bot: { in: batchIds } },
                { liked: { equals: true } },
              ],
            },
            limit: 1000,
            overrideAccess: true,
          })
          allLikes = allLikes.concat(likesResult.docs)
        }
      } catch (e: any) {
        console.warn('Could not fetch bot interactions:', e?.message || e)
      }
    }

    // Batch fetch all follower counts for these creators
    // Wrapped in try-catch in case table doesn't exist, batched for D1 limits
    // Uses creatorProfileIds computed above
    let allFollows: any[] = []
    if (creatorProfileIds.length > 0) {
      try {
        const FOLLOWS_BATCH_SIZE = 30
        for (let i = 0; i < creatorProfileIds.length; i += FOLLOWS_BATCH_SIZE) {
          const batchIds = creatorProfileIds.slice(i, i + FOLLOWS_BATCH_SIZE)
          const followsResult = await payload.find({
            collection: 'creatorFollows',
            where: {
              following: { in: batchIds },
            },
            limit: 1000,
            overrideAccess: true,
          })
          allFollows = allFollows.concat(followsResult.docs)
        }
      } catch (e: any) {
        console.warn('Could not fetch creator follows:', e?.message || e)
      }
    }

    // Batch fetch conversations that involve these bots
    // Note: Nested array field queries don't work reliably with D1/SQLite,
    // so we fetch all recent conversations and filter in code
    let allConversations: any[] = []
    if (allBotIds.length > 0) {
      try {
        const allBotIdStrings = allBotIds.map(String)
        const conversationsResult = await payload.find({
          collection: 'conversation',
          limit: 2000,
          depth: 1,
          overrideAccess: true,
        })
        // Filter to only conversations that include any of our bots
        allConversations = conversationsResult.docs.filter((conv) => {
          const botParticipation = (conv as any).bot_participation || []
          const hasInParticipation = botParticipation.some((bp: any) => {
            const botId = typeof bp.bot_id === 'object' && bp.bot_id !== null
              ? String(bp.bot_id.id)
              : String(bp.bot_id)
            return allBotIdStrings.includes(botId)
          })
          if (hasInParticipation) return true

          let participants = (conv as any).participants
          if (typeof participants === 'string') {
            try {
              participants = JSON.parse(participants)
            } catch {
              participants = null
            }
          }
          if (participants && Array.isArray(participants.bots)) {
            return participants.bots.some((botId: any) => allBotIdStrings.includes(String(botId)))
          }
          return false
        })
      } catch (e: any) {
        console.warn('Could not fetch conversations:', e?.message || e)
      }
    }

    // First, compute stats for ALL filtered creators (before pagination) for proper sorting
    const allCreatorsWithStats = filteredCreators.map((creator: any) => {
      // Get creator's user ID for matching
      const creatorUserId = typeof creator.user === 'object' && creator.user !== null
        ? creator.user.id
        : creator.user

      // Find bots belonging to this creator (try creator_profile first, then user)
      const creatorBots = allBots.filter((bot) => {
        // Try matching by creator_profile
        const botCreatorProfileId = typeof bot.creator_profile === 'object' && bot.creator_profile !== null
          ? bot.creator_profile.id
          : bot.creator_profile
        if (botCreatorProfileId && String(botCreatorProfileId) === String(creator.id)) {
          return true
        }
        // Fall back to matching by user (for migrated bots)
        const botUserId = typeof bot.user === 'object' && bot.user !== null
          ? bot.user.id
          : bot.user
        return creatorUserId && String(botUserId) === String(creatorUserId)
      })

      const creatorBotIds = creatorBots.map((bot) => String(bot.id))
      const realBotCount = creatorBots.length

      // Count conversations
      const realTotalConversations = allConversations.filter((conv) => {
        const botParticipation = conv.bot_participation || []
        const hasInParticipation = botParticipation.some((bp: any) => {
          const botId = typeof bp.bot_id === 'object' && bp.bot_id !== null
            ? bp.bot_id.id
            : bp.bot_id
          return creatorBotIds.includes(String(botId))
        })
        if (hasInParticipation) return true
        let participants = conv.participants
        if (typeof participants === 'string') {
          try { participants = JSON.parse(participants) } catch { participants = null }
        }
        if (participants && Array.isArray(participants.bots)) {
          return participants.bots.some((botId: any) => creatorBotIds.includes(String(botId)))
        }
        return false
      }).length

      const realTotalLikes = allLikes.filter((like) => {
        const likeBotId = typeof like.bot === 'object' && like.bot !== null
          ? like.bot.id
          : like.bot
        return creatorBotIds.includes(String(likeBotId))
      }).length

      const realFollowerCount = allFollows.filter((follow) => {
        const followingId = typeof follow.following === 'object' && follow.following !== null
          ? follow.following.id
          : follow.following
        return String(followingId) === String(creator.id)
      }).length

      return {
        ...creator,
        portfolio: {
          ...creator.portfolio,
          bot_count: realBotCount,
          total_conversations: realTotalConversations,
        },
        community_stats: {
          ...creator.community_stats,
          follower_count: realFollowerCount,
          total_likes: realTotalLikes,
        },
      }
    })

    // Sort in memory based on sort parameter
    const sortedCreators = [...allCreatorsWithStats].sort((a: any, b: any) => {
      switch (sort) {
        case '-followers':
          return (b.community_stats?.follower_count || 0) - (a.community_stats?.follower_count || 0)
        case '-bots':
          return (b.portfolio?.bot_count || 0) - (a.portfolio?.bot_count || 0)
        case '-conversations':
          return (b.portfolio?.total_conversations || 0) - (a.portfolio?.total_conversations || 0)
        case '-createdAt':
        default:
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      }
    })

    // Paginate after sorting
    const paginatedSortedCreators = sortedCreators.slice(startIndex, startIndex + limit)

    // Update the result with correctly sorted data
    const creatorsWithRealStats = paginatedSortedCreators

    // Update pagination to reflect sorted total
    const finalCreatorsResult = {
      ...creatorsResult,
      totalDocs: sortedCreators.length,
      totalPages: Math.ceil(sortedCreators.length / limit),
    }

    // Calculate aggregate stats across ALL creators (not just paginated)
    const aggregateStats = {
      totalCreators: sortedCreators.length,
      totalBots: sortedCreators.reduce((sum: number, c: any) => sum + (c.portfolio?.bot_count || 0), 0),
      totalConversations: sortedCreators.reduce((sum: number, c: any) => sum + (c.portfolio?.total_conversations || 0), 0),
      totalFollowers: sortedCreators.reduce((sum: number, c: any) => sum + (c.community_stats?.follower_count || 0), 0),
    }

    return NextResponse.json({
      success: true,
      creators: creatorsWithRealStats,
      pagination: {
        page: finalCreatorsResult.page,
        limit: finalCreatorsResult.limit,
        totalPages: finalCreatorsResult.totalPages,
        totalDocs: finalCreatorsResult.totalDocs,
      },
      aggregateStats,
    })
  } catch (error: any) {
    console.error('Fetch creators error:', error?.message || error)
    console.error('Error stack:', error?.stack)
    // Return error message for debugging
    return NextResponse.json({
      success: false,
      error: error?.message || 'Unknown error',
      creators: [],
      pagination: {
        page: 1,
        limit: 20,
        totalPages: 0,
        totalDocs: 0,
      },
    })
  }
}

/**
 * POST /api/creators
 *
 * Create a new creator profile for the authenticated user.
 *
 * Request body:
 * - username: string (required)
 * - display_name: string (required)
 * - bio: string (required)
 * - social_links?: object
 * - creator_info?: object
 * - profile_settings?: object
 * - tags?: Array<{ tag: string }>
 *
 * Response:
 * - success: boolean
 * - creator: CreatorProfile object
 * - message?: string
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

    // Check if user already has a creator profile
    const existingProfile = await payload.find({
      collection: 'creatorProfiles',
      where: {
        user: {
          equals: payloadUser.id,
        },
      },
      overrideAccess: true,
    })

    if (existingProfile.docs.length > 0) {
      return NextResponse.json(
        { success: false, message: 'You already have a creator profile' },
        { status: 400 }
      )
    }

    // Get request body
    const body = (await request.json()) as {
      username: string
      display_name: string
      bio: string
      social_links?: {
        website?: string
        github?: string
        twitter?: string
        linkedin?: string
        discord?: string
        youtube?: string
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

    // Validate required fields
    if (!body.username || !body.display_name || !body.bio) {
      return NextResponse.json(
        { success: false, message: 'Username, display name, and bio are required' },
        { status: 400 }
      )
    }

    // Check username availability
    const existingUsername = await payload.find({
      collection: 'creatorProfiles',
      where: {
        username: {
          equals: body.username.toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
        },
      },
      overrideAccess: true,
    })

    if (existingUsername.docs.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Username is already taken' },
        { status: 400 }
      )
    }

    // Create creator profile
    const creatorProfile = await payload.create({
      collection: 'creatorProfiles',
      data: {
        user: payloadUser.id,
        username: body.username,
        display_name: body.display_name,
        bio: body.bio,
        social_links: body.social_links || {},
        creator_info: {
          creator_type: (body.creator_info?.creator_type as 'individual' | 'studio' | 'organization' | 'educational' | 'open-source') || 'individual',
          specialties: body.creator_info?.specialties as any,
          experience_level: body.creator_info?.experience_level as any,
          location: body.creator_info?.location,
          languages: body.creator_info?.languages,
        },
        profile_settings: {
          profile_visibility: (body.profile_settings?.profile_visibility as 'public' | 'unlisted' | 'private') || 'public',
          allow_collaborations: body.profile_settings?.allow_collaborations ?? true,
          accept_commissions: body.profile_settings?.accept_commissions ?? false,
          commission_info: body.profile_settings?.commission_info,
        },
        tags: body.tags || [],
        verification_status: 'unverified',
        featured_creator: false,
        portfolio: {
          bot_count: 0,
          total_conversations: 0,
        },
        community_stats: {
          follower_count: 0,
          following_count: 0,
          total_likes: 0,
        },
        created_timestamp: new Date().toISOString(),
        modified_timestamp: new Date().toISOString(),
        last_active: new Date().toISOString(),
      },
      overrideAccess: true,
    })

    return NextResponse.json({
      success: true,
      creator: creatorProfile,
      message: 'Creator profile created successfully',
    })
  } catch (error: any) {
    console.error('Create creator profile error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create creator profile' },
      { status: 500 }
    )
  }
}
