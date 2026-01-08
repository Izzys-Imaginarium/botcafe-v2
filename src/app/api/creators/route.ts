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
    const sort = searchParams.get('sort') || '-community_stats.follower_count'
    const search = searchParams.get('search')

    // Get Payload instance
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Build where clause
    const whereConditions: any[] = [
      {
        'profile_settings.profile_visibility': {
          equals: 'public',
        },
      },
    ]

    if (featured) {
      whereConditions.push({
        featured_creator: {
          equals: true,
        },
      })
    }

    if (specialty) {
      whereConditions.push({
        'creator_info.specialties.specialty': {
          equals: specialty,
        },
      })
    }

    if (verification) {
      whereConditions.push({
        verification_status: {
          equals: verification,
        },
      })
    }

    if (search) {
      whereConditions.push({
        or: [
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
        ],
      })
    }

    // Fetch creators
    const creators = await payload.find({
      collection: 'creatorProfiles',
      where: {
        and: whereConditions,
      },
      page,
      limit,
      sort,
      depth: 2,
      overrideAccess: true,
    })

    return NextResponse.json({
      success: true,
      creators: creators.docs,
      pagination: {
        page: creators.page,
        limit: creators.limit,
        totalPages: creators.totalPages,
        totalDocs: creators.totalDocs,
      },
    })
  } catch (error: any) {
    console.error('Fetch creators error:', error)
    // Return empty results instead of error for better UX
    return NextResponse.json({
      success: true,
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
