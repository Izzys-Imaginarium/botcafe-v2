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

    return NextResponse.json({
      success: true,
      preferences: {
        nickname: payloadUser.nickname || '',
        pronouns: payloadUser.pronouns || '',
        custom_pronouns: payloadUser.custom_pronouns || '',
        description: payloadUser.description || '',
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
    const updateData: Record<string, string | null> = {}

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

    // Update user preferences
    const updatedUser = await payload.update({
      collection: 'users',
      id: payloadUser.id,
      data: updateData,
      overrideAccess: true,
    })

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: {
        nickname: updatedUser.nickname || '',
        pronouns: updatedUser.pronouns || '',
        custom_pronouns: updatedUser.custom_pronouns || '',
        description: updatedUser.description || '',
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
