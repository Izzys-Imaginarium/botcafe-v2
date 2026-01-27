import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

interface UserPreferencesUpdate {
  nickname?: string
  pronouns?: string
  custom_pronouns?: string
  description?: string
  avatar?: number | null
}

interface MediaDoc {
  id: number
  url?: string
  filename?: string
}

/**
 * GET /api/user/preferences
 * Fetch current user's chat preferences (nickname, pronouns, description)
 */
export async function GET() {
  try {
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return NextResponse.json(
        { message: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    const payload = await getPayloadHMR({ config })

    // Find Payload user by email
    const payloadUsers = await payload.find({
      collection: 'users',
      where: {
        email: { equals: clerkUser.emailAddresses[0]?.emailAddress },
      },
      limit: 1,
      overrideAccess: true,
    })

    if (payloadUsers.docs.length === 0) {
      return NextResponse.json(
        { message: 'User not found in database' },
        { status: 404 }
      )
    }

    const payloadUser = payloadUsers.docs[0]

    // Get avatar URL if avatar exists
    let avatarUrl: string | null = null
    let avatarId: number | null = null
    if (payloadUser.avatar) {
      const avatarData = payloadUser.avatar as MediaDoc | number
      if (typeof avatarData === 'object' && avatarData.url) {
        avatarUrl = avatarData.url
        avatarId = avatarData.id
      } else if (typeof avatarData === 'number') {
        avatarId = avatarData
        // Fetch the media to get URL
        const media = await payload.findByID({
          collection: 'media',
          id: avatarData,
          overrideAccess: true,
        })
        if (media?.url) {
          avatarUrl = media.url as string
        }
      }
    }

    return NextResponse.json({
      success: true,
      preferences: {
        nickname: payloadUser.nickname || '',
        pronouns: payloadUser.pronouns || '',
        custom_pronouns: payloadUser.custom_pronouns || '',
        description: payloadUser.description || '',
        avatar: avatarUrl,
        avatarId: avatarId,
      },
    })
  } catch (error: unknown) {
    console.error('Error fetching user preferences:', error)
    return NextResponse.json(
      { message: 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/user/preferences
 * Update current user's chat preferences
 */
export async function PATCH(request: NextRequest) {
  try {
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return NextResponse.json(
        { message: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    const body = (await request.json()) as UserPreferencesUpdate

    const payload = await getPayloadHMR({ config })

    // Find Payload user by email
    const payloadUsers = await payload.find({
      collection: 'users',
      where: {
        email: { equals: clerkUser.emailAddresses[0]?.emailAddress },
      },
      limit: 1,
      overrideAccess: true,
    })

    if (payloadUsers.docs.length === 0) {
      return NextResponse.json(
        { message: 'User not found in database' },
        { status: 404 }
      )
    }

    const payloadUser = payloadUsers.docs[0]

    // Build update data - only include fields that are provided
    const updateData: Record<string, string | number | null> = {}

    if (body.nickname !== undefined) {
      updateData.nickname = body.nickname || null
    }
    if (body.pronouns !== undefined) {
      updateData.pronouns = body.pronouns || null
    }
    if (body.custom_pronouns !== undefined) {
      updateData.custom_pronouns = body.custom_pronouns || null
    }
    if (body.description !== undefined) {
      updateData.description = body.description || null
    }
    if (body.avatar !== undefined) {
      updateData.avatar = body.avatar
    }

    // Update user preferences
    const updatedUser = await payload.update({
      collection: 'users',
      id: payloadUser.id,
      data: updateData,
      overrideAccess: true,
    })

    // Get avatar URL for response
    let updatedAvatarUrl: string | null = null
    let updatedAvatarId: number | null = null
    if (updatedUser.avatar) {
      const avatarData = updatedUser.avatar as MediaDoc | number
      if (typeof avatarData === 'object' && avatarData.url) {
        updatedAvatarUrl = avatarData.url
        updatedAvatarId = avatarData.id
      } else if (typeof avatarData === 'number') {
        updatedAvatarId = avatarData
        const media = await payload.findByID({
          collection: 'media',
          id: avatarData,
          overrideAccess: true,
        })
        if (media?.url) {
          updatedAvatarUrl = media.url as string
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: {
        nickname: updatedUser.nickname || '',
        pronouns: updatedUser.pronouns || '',
        custom_pronouns: updatedUser.custom_pronouns || '',
        description: updatedUser.description || '',
        avatar: updatedAvatarUrl,
        avatarId: updatedAvatarId,
      },
    })
  } catch (error: unknown) {
    console.error('Error updating user preferences:', error)
    return NextResponse.json(
      { message: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}
