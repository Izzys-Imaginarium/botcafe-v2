import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

/**
 * POST /api/creators/[username]/follow
 *
 * Toggle follow/unfollow for a creator profile.
 * If the user is already following, this will unfollow.
 * If the user is not following, this will follow.
 *
 * Response:
 * - success: boolean
 * - following: boolean - whether the user is now following
 * - followerCount: number - updated follower count
 * - message?: string
 */
export async function POST(
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
        email: { equals: clerkUser.emailAddresses[0]?.emailAddress },
      },
      overrideAccess: true,
    })

    if (users.docs.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    const payloadUser = users.docs[0]

    // Find creator profile by username
    const creators = await payload.find({
      collection: 'creatorProfiles',
      where: {
        username: { equals: username.toLowerCase() },
      },
      overrideAccess: true,
    })

    if (creators.docs.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Creator not found' },
        { status: 404 }
      )
    }

    const creator = creators.docs[0]

    // Check if user is trying to follow themselves
    const creatorUserId = typeof creator.user === 'object' && creator.user !== null
      ? creator.user.id
      : creator.user

    if (String(creatorUserId) === String(payloadUser.id)) {
      return NextResponse.json(
        { success: false, message: 'You cannot follow yourself' },
        { status: 400 }
      )
    }

    // Check if already following
    const existingFollow = await payload.find({
      collection: 'creatorFollows',
      where: {
        and: [
          { follower: { equals: payloadUser.id } },
          { following: { equals: creator.id } },
        ],
      },
      overrideAccess: true,
    })

    let isNowFollowing: boolean

    if (existingFollow.docs.length > 0) {
      // Unfollow - delete the follow relationship
      await payload.delete({
        collection: 'creatorFollows',
        id: existingFollow.docs[0].id,
        overrideAccess: true,
      })
      isNowFollowing = false
    } else {
      // Follow - create a new follow relationship
      await payload.create({
        collection: 'creatorFollows',
        data: {
          follower: payloadUser.id,
          following: creator.id,
          created_timestamp: new Date().toISOString(),
        },
        overrideAccess: true,
      })
      isNowFollowing = true
    }

    // Get updated follower count
    const followerCount = await payload.find({
      collection: 'creatorFollows',
      where: {
        following: { equals: creator.id },
      },
      limit: 0,
      overrideAccess: true,
    })

    return NextResponse.json({
      success: true,
      following: isNowFollowing,
      followerCount: followerCount.totalDocs,
      message: isNowFollowing ? 'Now following' : 'Unfollowed',
    })
  } catch (error: any) {
    console.error('Follow/unfollow error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to follow/unfollow' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/creators/[username]/follow
 *
 * Check if the current user is following this creator.
 *
 * Response:
 * - success: boolean
 * - following: boolean - whether the user is following
 * - followerCount: number - total follower count
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

    // Find creator profile by username
    const creators = await payload.find({
      collection: 'creatorProfiles',
      where: {
        username: { equals: username.toLowerCase() },
      },
      overrideAccess: true,
    })

    if (creators.docs.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Creator not found' },
        { status: 404 }
      )
    }

    const creator = creators.docs[0]

    // Get follower count
    const followerCount = await payload.find({
      collection: 'creatorFollows',
      where: {
        following: { equals: creator.id },
      },
      limit: 0,
      overrideAccess: true,
    })

    // Check if current user is following (if authenticated)
    let isFollowing = false
    const clerkUser = await currentUser()

    if (clerkUser) {
      const users = await payload.find({
        collection: 'users',
        where: {
          email: { equals: clerkUser.emailAddresses[0]?.emailAddress },
        },
        overrideAccess: true,
      })

      if (users.docs.length > 0) {
        const existingFollow = await payload.find({
          collection: 'creatorFollows',
          where: {
            and: [
              { follower: { equals: users.docs[0].id } },
              { following: { equals: creator.id } },
            ],
          },
          overrideAccess: true,
        })
        isFollowing = existingFollow.docs.length > 0
      }
    }

    return NextResponse.json({
      success: true,
      following: isFollowing,
      followerCount: followerCount.totalDocs,
    })
  } catch (error: any) {
    console.error('Check follow status error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to check follow status' },
      { status: 500 }
    )
  }
}
