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

    // Get current user for shared bot access
    let payloadUserId: number | null = null
    if (includeShared) {
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
    if (payloadUserId) {
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

    // Build query - include public bots OR shared bots OR user's own bots
    const orConditions: any[] = [
      { is_public: { equals: true } },
      { 'sharing.visibility': { equals: 'public' } },
    ]

    // Add shared bots if user is logged in
    if (sharedBotIds.length > 0) {
      orConditions.push({ id: { in: sharedBotIds } })
    }

    // Add user's own bots
    if (payloadUserId) {
      orConditions.push({ user: { equals: payloadUserId } })
    }

    const where: any = {
      or: orConditions,
    }

    // Add search filter if provided
    if (search) {
      where.and = [
        {
          or: [
            { name: { contains: search } },
            { description: { contains: search } },
            { creator_display_name: { contains: search } },
          ],
        },
      ]
    }

    // Determine sort order
    let sortField = '-created_date' // default: newest first
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
    }

    // Fetch bots from Payload with creator profile populated
    // If filtering by classifications, we need to fetch more and filter in-memory
    // due to D1/SQLite limitations with nested array queries
    const fetchLimit = classifications.length > 0 ? Math.max(limit * 3, 100) : limit

    const result = await payload.find({
      collection: 'bot',
      where,
      sort: sortField,
      limit: fetchLimit,
      page: classifications.length > 0 ? 1 : page, // Fetch from page 1 if filtering
      depth: 1, // Include related data
      overrideAccess: true,
    })

    // Filter by classifications if specified
    let filteredDocs = result.docs
    if (classifications.length > 0) {
      filteredDocs = result.docs.filter((bot: any) => {
        if (!bot.classifications || bot.classifications.length === 0) return false
        return bot.classifications.some((c: any) =>
          classifications.includes(c.classification)
        )
      })
    }

    // Apply pagination manually if we filtered by classifications
    let paginatedDocs = filteredDocs
    let totalDocs = result.totalDocs
    let totalPages = result.totalPages
    let hasNextPage = result.hasNextPage
    let hasPrevPage = result.hasPrevPage

    if (classifications.length > 0) {
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
