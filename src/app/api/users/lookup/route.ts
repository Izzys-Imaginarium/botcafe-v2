import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

/**
 * GET /api/users/lookup?username=xxx
 *
 * Look up a user by their CreatorProfile username (case-insensitive).
 * Used for sharing resources with other users.
 *
 * Returns minimal user info for the share dialog.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify the requester is authenticated
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json(
        { message: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    // Get username from query params
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    if (!username || username.trim().length === 0) {
      return NextResponse.json(
        { message: 'Username is required' },
        { status: 400 }
      )
    }

    // Normalize username to lowercase for case-insensitive matching
    const normalizedUsername = username.trim().toLowerCase()

    const payload = await getPayloadHMR({ config })

    // Look up the CreatorProfile by username
    const profiles = await payload.find({
      collection: 'creatorProfiles',
      where: {
        username: {
          equals: normalizedUsername,
        },
      },
      limit: 1,
      depth: 1, // Populate user relationship
      overrideAccess: true,
    })

    if (profiles.docs.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: `No user found with username "${username}". They may need to create a bot first to set up their profile.`,
        },
        { status: 404 }
      )
    }

    const profile = profiles.docs[0] as any

    // Get the user info
    const user = profile.user
    const userId = typeof user === 'object' ? user.id : user

    // Get avatar from profile or user
    let avatarUrl: string | null = null
    if (profile.profile_media?.avatar) {
      const avatar = profile.profile_media.avatar
      avatarUrl = typeof avatar === 'object' ? avatar.url : null
    }

    return NextResponse.json({
      success: true,
      user: {
        userId,
        username: profile.username,
        displayName: profile.display_name,
        avatar: avatarUrl,
      },
    })
  } catch (error: any) {
    console.error('Error looking up user:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to look up user' },
      { status: 500 }
    )
  }
}
