import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import config from '@payload-config'
import {
  checkResourceAccess,
  getResourceCollaborators,
  revokeResourceAccess,
  type ResourceType,
} from '@/lib/permissions/check-access'

export const dynamic = 'force-dynamic'

/**
 * GET /api/sharing/[resourceType]/[resourceId]
 *
 * List all users who have been granted access to a resource.
 * Only owners and the original creator can view the full list.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resourceType: string; resourceId: string }> }
) {
  try {
    const { resourceType, resourceId } = await params

    // Validate resource type
    if (!['bot', 'knowledgeCollection'].includes(resourceType)) {
      return NextResponse.json(
        { message: 'Invalid resource type. Must be "bot" or "knowledgeCollection"' },
        { status: 400 }
      )
    }

    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json(
        { message: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    const payload = await getPayloadHMR({ config })

    // Get the current user's Payload ID
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
        { message: 'User not found' },
        { status: 404 }
      )
    }

    const userId = payloadUsers.docs[0].id

    // Check if user has owner access
    const access = await checkResourceAccess(
      payload,
      userId,
      resourceType as ResourceType,
      resourceId
    )

    if (!access.hasAccess || access.permission !== 'owner') {
      return NextResponse.json(
        { message: 'Only owners can view collaborators' },
        { status: 403 }
      )
    }

    // Get list of collaborators
    const collaborators = await getResourceCollaborators(
      payload,
      resourceType as ResourceType,
      resourceId
    )

    // Get the original creator info
    const collection = resourceType === 'bot' ? 'bot' : 'knowledgeCollections'
    const resource = await payload.findByID({
      collection,
      id: parseInt(resourceId, 10),
      depth: 1,
      overrideAccess: true,
    }) as any

    let originalCreator = null
    if (resource) {
      const creatorUser = resource.user
      const creatorUserId = typeof creatorUser === 'object' ? creatorUser.id : creatorUser

      // Get creator's profile
      const creatorProfiles = await payload.find({
        collection: 'creatorProfiles',
        where: {
          user: { equals: creatorUserId },
        },
        limit: 1,
        overrideAccess: true,
      })

      const creatorProfile = creatorProfiles.docs[0] as any

      // Get avatar
      let avatarUrl: string | null = null
      if (creatorProfile?.profile_media?.avatar) {
        const avatar = creatorProfile.profile_media.avatar
        avatarUrl = typeof avatar === 'object' ? avatar.url : null
      }

      originalCreator = {
        userId: creatorUserId,
        username: creatorProfile?.username || 'unknown',
        displayName: creatorProfile?.display_name || (typeof creatorUser === 'object' ? creatorUser.email : 'Unknown'),
        avatar: avatarUrl,
        isOriginalCreator: true,
      }
    }

    return NextResponse.json({
      success: true,
      originalCreator,
      collaborators,
    })
  } catch (error: any) {
    console.error('Error fetching collaborators:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch collaborators' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/sharing/[resourceType]/[resourceId]?userId=xxx
 *
 * Revoke a user's access to a resource.
 * Only owners can revoke access. Original creator cannot be revoked.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ resourceType: string; resourceId: string }> }
) {
  try {
    const { resourceType, resourceId } = await params

    // Validate resource type
    if (!['bot', 'knowledgeCollection'].includes(resourceType)) {
      return NextResponse.json(
        { message: 'Invalid resource type. Must be "bot" or "knowledgeCollection"' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get('userId')

    if (!targetUserId) {
      return NextResponse.json(
        { message: 'userId query parameter is required' },
        { status: 400 }
      )
    }

    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json(
        { message: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    const payload = await getPayloadHMR({ config })

    // Get the current user's Payload ID
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
        { message: 'User not found' },
        { status: 404 }
      )
    }

    const revokerId = payloadUsers.docs[0].id

    // Revoke access
    const result = await revokeResourceAccess(
      payload,
      revokerId,
      parseInt(targetUserId, 10),
      resourceType as ResourceType,
      resourceId
    )

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error || 'Failed to revoke access' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Access revoked successfully',
    })
  } catch (error: any) {
    console.error('Error revoking access:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to revoke access' },
      { status: 500 }
    )
  }
}
