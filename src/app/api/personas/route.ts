import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

/**
 * GET /api/personas
 *
 * Fetch all personas for the current user (owned + public personas).
 *
 * Query params:
 * - includePublic?: 'true' | 'false' (default: 'true')
 * - limit?: number (default: 50)
 * - offset?: number (default: 0)
 *
 * Response:
 * - success: boolean
 * - personas: Persona[]
 * - total: number
 * - message?: string
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

    // Find user in Payload
    const users = await payload.find({
      collection: 'users',
      where: {
        clerkUserId: {
          equals: clerkUser.id,
        },
      },
    })

    if (users.docs.length === 0) {
      // User not synced to Payload yet - return empty personas
      return NextResponse.json({
        success: true,
        personas: [],
        total: 0,
        hasMore: false,
        page: 1,
        totalPages: 0,
      })
    }

    const payloadUser = users.docs[0]

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const includePublic = searchParams.get('includePublic') !== 'false'
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Build where clause
    const where: any = includePublic
      ? {
          or: [
            {
              user: {
                equals: payloadUser.id,
              },
            },
            {
              is_public: {
                equals: true,
              },
            },
          ],
        }
      : {
          user: {
            equals: payloadUser.id,
          },
        }

    // Fetch personas
    const personasResult = await payload.find({
      collection: 'personas',
      where,
      limit,
      page: Math.floor(offset / limit) + 1,
      sort: '-created_timestamp',
      depth: 2, // Include avatar relationship
    })

    return NextResponse.json({
      success: true,
      personas: personasResult.docs,
      total: personasResult.totalDocs,
      hasMore: personasResult.hasNextPage,
      page: personasResult.page,
      totalPages: personasResult.totalPages,
    })
  } catch (error: any) {
    console.error('Fetch personas error:', error)
    // Return empty data instead of error for better UX
    return NextResponse.json({
      success: true,
      personas: [],
      total: 0,
      hasMore: false,
      page: 1,
      totalPages: 0,
    })
  }
}

/**
 * POST /api/personas
 *
 * Create a new persona for the current user.
 *
 * Request body:
 * - name: string (required)
 * - description: string (required)
 * - personality_traits?: object
 * - appearance?: object
 * - behavior_settings?: object
 * - interaction_preferences?: object
 * - is_default?: boolean
 * - is_public?: boolean
 * - tags?: array
 * - custom_instructions?: string
 *
 * Response:
 * - success: boolean
 * - persona: Persona object
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
        clerkUserId: {
          equals: clerkUser.id,
        },
      },
    })

    if (users.docs.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found in database' },
        { status: 404 }
      )
    }

    const payloadUser = users.docs[0]

    // Get request body
    const body = (await request.json()) as {
      name?: string
      description?: string
      personality_traits?: any
      appearance?: any
      behavior_settings?: any
      interaction_preferences?: any
      is_default?: boolean
      is_public?: boolean
      tags?: Array<{ tag: string }>
      custom_instructions?: string
    }

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { success: false, message: 'name is required' },
        { status: 400 }
      )
    }

    if (!body.description) {
      return NextResponse.json(
        { success: false, message: 'description is required' },
        { status: 400 }
      )
    }

    // If setting as default, unset other default personas
    if (body.is_default) {
      const existingDefaults = await payload.find({
        collection: 'personas',
        where: {
          and: [
            {
              user: {
                equals: payloadUser.id,
              },
            },
            {
              is_default: {
                equals: true,
              },
            },
          ],
        },
      })

      // Update existing defaults to not be default
      for (const defaultPersona of existingDefaults.docs) {
        await payload.update({
          collection: 'personas',
          id: defaultPersona.id,
          data: {
            is_default: false,
          },
          overrideAccess: true,
        })
      }
    }

    // Create persona
    const persona = await payload.create({
      collection: 'personas',
      data: {
        user: payloadUser.id,
        name: body.name,
        description: body.description,
        personality_traits: body.personality_traits || {},
        appearance: body.appearance || {},
        behavior_settings: body.behavior_settings || {},
        interaction_preferences: body.interaction_preferences || {},
        is_default: body.is_default || false,
        is_public: body.is_public || false,
        tags: body.tags || [],
        custom_instructions: body.custom_instructions || '',
        usage_count: 0,
      },
      overrideAccess: true,
    })

    return NextResponse.json({
      success: true,
      persona: persona,
      message: 'Persona created successfully',
    })
  } catch (error: any) {
    console.error('Create persona error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create persona' },
      { status: 500 }
    )
  }
}
