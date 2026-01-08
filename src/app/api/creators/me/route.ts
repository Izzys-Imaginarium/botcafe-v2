import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

/**
 * GET /api/creators/me
 *
 * Fetch the authenticated user's creator profile.
 *
 * Response:
 * - success: boolean
 * - creator: CreatorProfile object (or null if no profile exists)
 * - hasProfile: boolean
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
      overrideAccess: true,
    })

    if (users.docs.length === 0) {
      // User not synced to Payload yet - return no profile
      return NextResponse.json({
        success: true,
        creator: null,
        hasProfile: false,
      })
    }

    const payloadUser = users.docs[0]

    // Fetch user's creator profile
    const creators = await payload.find({
      collection: 'creatorProfiles',
      where: {
        user: {
          equals: payloadUser.id,
        },
      },
      depth: 2,
      overrideAccess: true,
    })

    if (creators.docs.length === 0) {
      return NextResponse.json({
        success: true,
        creator: null,
        hasProfile: false,
      })
    }

    const creator = creators.docs[0]

    // Update last_active
    await payload.update({
      collection: 'creatorProfiles',
      id: creator.id,
      data: {
        last_active: new Date().toISOString(),
      },
      overrideAccess: true,
    })

    return NextResponse.json({
      success: true,
      creator,
      hasProfile: true,
    })
  } catch (error: any) {
    console.error('Fetch my creator profile error:', error)
    // Return no profile instead of error for better UX
    return NextResponse.json({
      success: true,
      creator: null,
      hasProfile: false,
    })
  }
}
