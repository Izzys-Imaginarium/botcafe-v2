import { NextRequest, NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import config from '@payload-config'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const sort = searchParams.get('sort') || 'recent'
    const search = searchParams.get('search') || ''

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

    // Build query
    const where: any = {
      is_public: {
        equals: true,
      },
    }

    // Add search filter if provided
    if (search) {
      where.or = [
        {
          name: {
            contains: search,
          },
        },
        {
          description: {
            contains: search,
          },
        },
        {
          creator_display_name: {
            contains: search,
          },
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
    const result = await payload.find({
      collection: 'bot',
      where,
      sort: sortField,
      limit,
      page,
      depth: 1, // Include related data
      overrideAccess: true,
    })

    // Transform docs to include creator username from the creator profile
    const botsWithCreatorUsername = result.docs.map((bot: any) => {
      const creatorProfile = bot.creator_profile
      return {
        ...bot,
        creator_username:
          typeof creatorProfile === 'object' ? creatorProfile.username : null,
      }
    })

    return NextResponse.json({
      bots: botsWithCreatorUsername,
      totalPages: result.totalPages,
      currentPage: result.page,
      totalDocs: result.totalDocs,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
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
