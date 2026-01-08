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

    return NextResponse.json({
      success: true,
      creator,
      isOwner,
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
        avatar?: string
        banner_image?: string
      }
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
