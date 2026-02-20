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
 * - search?: string - Search by name or description
 * - sort?: string - Sort field (default: '-created_timestamp')
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
        email: {
          equals: clerkUser.emailAddresses[0]?.emailAddress,
        },
      },
      overrideAccess: true,
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
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || '-created_timestamp'
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Personas are always private - only fetch user's own personas
    const where: Record<string, unknown> = {
      user: {
        equals: payloadUser.id,
      },
    }

    // Add search filter for name and description
    if (search) {
      where.or = [
        { name: { contains: search } },
        { description: { contains: search } },
      ]
    }

    // Fetch personas
    const personasResult = await payload.find({
      collection: 'personas',
      where,
      limit,
      page: Math.floor(offset / limit) + 1,
      sort,
      depth: 2, // Include avatar relationship
      overrideAccess: true,
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
 * - gender?: 'male' | 'female' | 'non-binary' | 'unspecified' | 'other'
 * - age?: number
 * - pronouns?: 'he-him' | 'she-her' | 'they-them' | 'he-they' | 'she-they' | 'any' | 'other'
 * - custom_pronouns?: string
 * - appearance?: object (with avatar field)
 * - is_default?: boolean
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

    // Get request body
    const body = (await request.json()) as {
      name?: string
      description?: string
      gender?: ('male' | 'female' | 'non-binary' | 'unspecified' | 'other') | null
      age?: number | null
      pronouns?: ('he-him' | 'she-her' | 'they-them' | 'he-they' | 'she-they' | 'any' | 'other') | null
      custom_pronouns?: string | null
      appearance?: {
        avatar?: number | null
      }
      personality?: string | null
      appearance_description?: string | null
      backstory?: string | null
      additional_details?: Array<{ label?: string; content?: string }> | null
      interaction_preferences?: {
        preferred_topics?: Array<{ topic?: string }>
        avoid_topics?: Array<{ topic?: string }>
      }
      is_default?: boolean
      custom_instructions?: string | null
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
        overrideAccess: true,
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

    // Create persona - filter out empty strings for select fields (Payload doesn't accept empty strings)
    const persona = await payload.create({
      collection: 'personas',
      data: {
        user: payloadUser.id,
        name: body.name,
        description: body.description,
        gender: body.gender || undefined,
        age: body.age,
        pronouns: body.pronouns || undefined,
        custom_pronouns: body.custom_pronouns,
        appearance: body.appearance || {},
        personality: body.personality || '',
        appearance_description: body.appearance_description || '',
        backstory: body.backstory || '',
        additional_details: (body.additional_details || []).filter(
          (d): d is { label: string; content: string } => Boolean(d.label && d.content)
        ),
        interaction_preferences: body.interaction_preferences || {
          preferred_topics: [],
          avoid_topics: [],
        },
        is_default: body.is_default || false,
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
