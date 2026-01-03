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

    // Get Payload instance
    const payload = await getPayloadHMR({ config })

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

    // Fetch bots from Payload
    const result = await payload.find({
      collection: 'bot',
      where,
      sort: sortField,
      limit,
      page,
    })

    return NextResponse.json({
      bots: result.docs,
      totalPages: result.totalPages,
      currentPage: result.page,
      totalDocs: result.totalDocs,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    })
  } catch (error: any) {
    console.error('Error fetching bots:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to fetch bots' },
      { status: 500 }
    )
  }
}
