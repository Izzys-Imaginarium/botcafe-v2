import { NextRequest, NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import { currentUser } from '@clerk/nextjs/server'
import config from '@payload-config'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const sort = searchParams.get('sort') || 'recent'
    const search = searchParams.get('search') || ''
    const classifications = searchParams.get('classifications')?.split(',').filter(Boolean) || []
    const includeShared = searchParams.get('includeShared') !== 'false' // Default true
    const excludeOwn = searchParams.get('excludeOwn') === 'true'
    const filterLiked = searchParams.get('liked') === 'true'
    const filterFavorited = searchParams.get('favorited') === 'true'

    // Get Payload instance with error handling
    let payload
    try {
      payload = await getPayloadHMR({ config })
    } catch (dbError) {
      console.error('Database connection error:', dbError)
      return NextResponse.json({
        bots: [],
        totalPages: 0,
        currentPage: 1,
        totalDocs: 0,
        hasNextPage: false,
        hasPrevPage: false,
      })
    }

    // Get current user for shared bot access, excludeOwn, liked/favorited filters, or recently-chatted sort
    let payloadUserId: number | null = null
    const needsUserId = includeShared || excludeOwn || sort === 'recently-chatted' || filterLiked || filterFavorited
    if (needsUserId) {
      const clerkUser = await currentUser()
      if (clerkUser) {
        const payloadUsers = await payload.find({
          collection: 'users',
          where: {
            email: { equals: clerkUser.emailAddresses[0]?.emailAddress },
          },
          limit: 1,
          overrideAccess: true,
        })
        if (payloadUsers.docs.length > 0) {
          payloadUserId = payloadUsers.docs[0].id as number
        }
      }
    }

    // Get IDs of bots shared with this user via AccessControl
    const sharedBotIds: number[] = []
    if (payloadUserId && includeShared) {
      const accessControls = await payload.find({
        collection: 'access-control',
        where: {
          and: [
            { user: { equals: payloadUserId } },
            { resource_type: { equals: 'bot' } },
            { is_revoked: { equals: false } },
          ],
        },
        limit: 100,
        overrideAccess: true,
      })

      for (const ac of accessControls.docs as any[]) {
        if (ac.resource_id) {
          const botId = parseInt(ac.resource_id, 10)
          if (!isNaN(botId)) {
            sharedBotIds.push(botId)
          }
        }
      }
    }

    // Get IDs of bots the user has liked or favorited (for filtering)
    let likedBotIds: number[] = []
    let favoritedBotIds: number[] = []
    if (payloadUserId && (filterLiked || filterFavorited)) {
      const interactions = await payload.find({
        collection: 'botInteractions' as any,
        where: {
          user: { equals: payloadUserId },
        },
        limit: 500,
        overrideAccess: true,
      })

      for (const interaction of interactions.docs as any[]) {
        const botId = typeof interaction.bot === 'object' ? interaction.bot?.id : interaction.bot
        if (botId) {
          const numericBotId = typeof botId === 'number' ? botId : parseInt(botId, 10)
          if (!isNaN(numericBotId)) {
            if (interaction.liked) {
              likedBotIds.push(numericBotId)
            }
            if (interaction.favorited) {
              favoritedBotIds.push(numericBotId)
            }
          }
        }
      }
    }

    // Determine which bot IDs to fetch based on filters
    // When liked/favorited filters are active, we fetch those specific bots directly
    let targetBotIds: number[] | null = null
    if (filterLiked && filterFavorited) {
      // Intersection: bots that are both liked AND favorited
      targetBotIds = likedBotIds.filter(id => favoritedBotIds.includes(id))
    } else if (filterLiked) {
      targetBotIds = likedBotIds
    } else if (filterFavorited) {
      targetBotIds = favoritedBotIds
    }

    // Build query
    let where: any
    let fetchSharedBotsSeparately = false

    if (targetBotIds !== null) {
      // When filtering by liked/favorited, fetch those specific bots
      if (targetBotIds.length === 0) {
        // User hasn't liked/favorited any bots, return empty results immediately
        return NextResponse.json({
          bots: [],
          totalPages: 0,
          currentPage: page,
          totalDocs: 0,
          hasNextPage: false,
          hasPrevPage: false,
        })
      }
      // D1/SQLite has a limit on IN clause parameters, so batch if > 50
      if (targetBotIds.length <= 50) {
        where = { id: { in: targetBotIds } }
      } else {
        // Fetch in batches - start with first 50, fetch rest separately
        where = { id: { in: targetBotIds.slice(0, 50) } }
      }
    } else {
      // Normal explore: public bots + shared bots
      // Note: For D1/SQLite, checkbox fields are stored as 0/1 integers
      const orConditions: any[] = [
        { is_public: { equals: true } },
        { 'sharing.visibility': { equals: 'public' } },
      ]

      // Add shared bots if user is logged in
      // D1/SQLite has a limit on IN clause parameters, so only include in query if <= 50
      fetchSharedBotsSeparately = sharedBotIds.length > 50
      if (sharedBotIds.length > 0 && !fetchSharedBotsSeparately) {
        orConditions.push({ id: { in: sharedBotIds } })
      }

      where = { or: orConditions }
    }

    // If excludeOwn is true, explicitly exclude user's bots
    if (excludeOwn && payloadUserId) {
      where.and = where.and || []
      where.and.push({ user: { not_equals: payloadUserId } })
    }

    // Add search filter if provided
    if (search) {
      where.and = where.and || []
      where.and.push({
        or: [
          { name: { contains: search } },
          { description: { contains: search } },
          { creator_display_name: { contains: search } },
        ],
      })
    }

    // For "recently-chatted" sort, get bot IDs ordered by last chat activity
    let recentlyChatted: Map<number, Date> = new Map()
    if (sort === 'recently-chatted' && payloadUserId) {
      const conversations = await payload.find({
        collection: 'conversation',
        where: {
          user: { equals: payloadUserId },
        },
        sort: '-conversation_metadata.last_activity',
        limit: 100,
        depth: 0,
        overrideAccess: true,
      })

      // Build a map of bot_id -> last activity time
      for (const conv of conversations.docs as any[]) {
        const lastActivity = conv.conversation_metadata?.last_activity
          ? new Date(conv.conversation_metadata.last_activity)
          : new Date(conv.modified_timestamp || conv.created_timestamp)

        if (conv.bot_participation && Array.isArray(conv.bot_participation)) {
          for (const bp of conv.bot_participation) {
            const botId = typeof bp.bot_id === 'object' ? bp.bot_id?.id : bp.bot_id
            if (botId && (!recentlyChatted.has(botId) || lastActivity > recentlyChatted.get(botId)!)) {
              recentlyChatted.set(botId, lastActivity)
            }
          }
        }
      }
    }

    // Determine sort order
    let sortField = '-created_date' // default: newest first
    const useInMemorySort = sort === 'random' || sort === 'recently-chatted'
    switch (sort) {
      case 'name':
        sortField = 'name'
        break
      case 'name-desc':
        sortField = '-name'
        break
      case 'creator':
        sortField = 'creator_display_name'
        break
      case 'likes':
        sortField = '-likes_count'
        break
      case 'favorites':
        sortField = '-favorites_count'
        break
      case 'recent':
        sortField = '-created_date'
        break
      case 'random':
      case 'recently-chatted':
        // These need in-memory sorting, use default DB sort
        sortField = '-created_date'
        break
    }

    // Fetch bots from Payload with creator profile populated
    // If filtering by classifications, liked/favorited, using in-memory sort, or fetching shared bots separately,
    // we need to fetch more due to D1/SQLite limitations
    const needsInMemoryProcessing = classifications.length > 0 || useInMemorySort || fetchSharedBotsSeparately || filterLiked || filterFavorited
    const fetchLimit = needsInMemoryProcessing ? Math.max(limit * 3, 100) : limit

    const result = await payload.find({
      collection: 'bot',
      where,
      sort: sortField,
      limit: fetchLimit,
      page: needsInMemoryProcessing ? 1 : page, // Fetch from page 1 if doing in-memory processing
      depth: 1, // Include related data
      overrideAccess: true,
    })

    // If we have more than 50 shared bot IDs, fetch them separately in batches
    // D1/SQLite has a limit on IN clause parameters
    let sharedBotsDocs: any[] = []
    if (fetchSharedBotsSeparately && sharedBotIds.length > 0) {
      const BATCH_SIZE = 50
      for (let i = 0; i < sharedBotIds.length; i += BATCH_SIZE) {
        const batchIds = sharedBotIds.slice(i, i + BATCH_SIZE)
        const batchResult = await payload.find({
          collection: 'bot',
          where: { id: { in: batchIds } },
          depth: 1,
          overrideAccess: true,
        })
        sharedBotsDocs = sharedBotsDocs.concat(batchResult.docs)
      }
    }

    // Merge shared bots with main results (dedupe by id)
    let allDocs = result.docs
    if (sharedBotsDocs.length > 0) {
      const existingIds = new Set(result.docs.map((d: any) => d.id))
      const newSharedBots = sharedBotsDocs.filter((d: any) => !existingIds.has(d.id))
      allDocs = [...result.docs, ...newSharedBots]
    }

    // IMPORTANT: Filter to ensure ONLY public/shared bots are shown
    // This is a safety check in case the database query returns unexpected results
    // The explore page should only show public bots (not user's own private bots)
    let filteredDocs = allDocs.filter((bot: any) => {
      const botUserId = typeof bot.user === 'object' ? bot.user?.id : bot.user

      // If excludeOwn is true, filter out user's bots entirely
      if (excludeOwn && payloadUserId && botUserId === payloadUserId) {
        return false
      }

      // Allow if bot is public (checking both boolean and integer values)
      if (bot.is_public === true || bot.is_public === 1) return true

      // Allow if sharing visibility is public
      if (bot.sharing?.visibility === 'public') return true

      // Allow if shared with user
      if (sharedBotIds.includes(bot.id)) return true

      // Otherwise, filter out - this includes user's own PRIVATE bots
      // (they should access those via their profile, not explore)
      return false
    })

    // Filter by liked bots if requested
    if (filterLiked && payloadUserId) {
      if (likedBotIds.length === 0) {
        // User hasn't liked any bots, return empty results
        filteredDocs = []
      } else {
        filteredDocs = filteredDocs.filter((bot: any) => likedBotIds.includes(bot.id))
      }
    }

    // Filter by favorited bots if requested
    if (filterFavorited && payloadUserId) {
      if (favoritedBotIds.length === 0) {
        // User hasn't favorited any bots, return empty results
        filteredDocs = []
      } else {
        filteredDocs = filteredDocs.filter((bot: any) => favoritedBotIds.includes(bot.id))
      }
    }

    // Filter by classifications if specified
    if (classifications.length > 0) {
      filteredDocs = filteredDocs.filter((bot: any) => {
        if (!bot.classifications || bot.classifications.length === 0) return false
        return bot.classifications.some((c: any) =>
          classifications.includes(c.classification)
        )
      })
    }

    // Apply in-memory sorting for random or recently-chatted
    if (sort === 'random') {
      // Fisher-Yates shuffle
      for (let i = filteredDocs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[filteredDocs[i], filteredDocs[j]] = [filteredDocs[j], filteredDocs[i]]
      }
    } else if (sort === 'recently-chatted' && recentlyChatted.size > 0) {
      // Sort by last chat activity, putting chatted bots first
      filteredDocs.sort((a: any, b: any) => {
        const aTime = recentlyChatted.get(a.id)
        const bTime = recentlyChatted.get(b.id)

        // Bots the user has chatted with come first
        if (aTime && !bTime) return -1
        if (!aTime && bTime) return 1
        if (aTime && bTime) {
          return bTime.getTime() - aTime.getTime() // Most recent first
        }
        // For bots not chatted with, maintain creation date order
        return new Date(b.created_date).getTime() - new Date(a.created_date).getTime()
      })
    }

    // Apply pagination manually if we did in-memory processing or fetched shared bots separately
    let paginatedDocs = filteredDocs
    let totalDocs = result.totalDocs
    let totalPages = result.totalPages
    let hasNextPage = result.hasNextPage
    let hasPrevPage = result.hasPrevPage

    // Need in-memory pagination if we filtered by classification, used special sort, or fetched shared bots separately
    if (needsInMemoryProcessing || fetchSharedBotsSeparately) {
      totalDocs = filteredDocs.length
      totalPages = Math.ceil(totalDocs / limit)
      const startIndex = (page - 1) * limit
      paginatedDocs = filteredDocs.slice(startIndex, startIndex + limit)
      hasNextPage = page < totalPages
      hasPrevPage = page > 1
    }

    // Transform docs to include creator username and access info
    const botsWithCreatorUsername = paginatedDocs.map((bot: any) => {
      const creatorProfile = bot.creator_profile
      const botUserId = typeof bot.user === 'object' ? bot.user?.id : bot.user

      // Determine access type for this user
      let accessType: 'public' | 'shared' | 'owned' = 'public'
      if (payloadUserId && botUserId === payloadUserId) {
        accessType = 'owned'
      } else if (sharedBotIds.includes(bot.id)) {
        accessType = 'shared'
      }

      return {
        ...bot,
        creator_username:
          typeof creatorProfile === 'object' ? creatorProfile.username : null,
        accessType,
      }
    })

    return NextResponse.json({
      bots: botsWithCreatorUsername,
      totalPages,
      currentPage: page,
      totalDocs,
      hasNextPage,
      hasPrevPage,
    })
  } catch (error: any) {
    console.error('Error fetching bots:', error)
    return NextResponse.json({
      bots: [],
      totalPages: 0,
      currentPage: 1,
      totalDocs: 0,
      hasNextPage: false,
      hasPrevPage: false,
    })
  }
}
