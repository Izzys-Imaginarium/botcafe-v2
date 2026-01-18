import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import config from '@payload-config'
import {
  grantResourceAccess,
  type Permission,
  type ResourceType,
} from '@/lib/permissions/check-access'

export const dynamic = 'force-dynamic'

interface ShareRequest {
  resourceType: ResourceType
  resourceId: string | number
  username: string
  permission: Permission
}

/**
 * POST /api/sharing
 *
 * Grant access to a resource for a specific user by their username.
 * Only owners can grant access.
 */
export async function POST(request: NextRequest) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json(
        { message: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    const body = (await request.json()) as ShareRequest

    // Validate required fields
    if (!body.resourceType || !body.resourceId || !body.username || !body.permission) {
      return NextResponse.json(
        { message: 'Missing required fields: resourceType, resourceId, username, permission' },
        { status: 400 }
      )
    }

    // Validate resource type
    if (!['bot', 'knowledgeCollection'].includes(body.resourceType)) {
      return NextResponse.json(
        { message: 'Invalid resource type. Must be "bot" or "knowledgeCollection"' },
        { status: 400 }
      )
    }

    // Validate permission
    if (!['owner', 'editor', 'readonly'].includes(body.permission)) {
      return NextResponse.json(
        { message: 'Invalid permission. Must be "owner", "editor", or "readonly"' },
        { status: 400 }
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
        { message: 'User not found. Please try again.' },
        { status: 404 }
      )
    }

    const grantorId = payloadUsers.docs[0].id

    // Look up the target user by username
    const normalizedUsername = body.username.trim().toLowerCase()
    const targetProfiles = await payload.find({
      collection: 'creatorProfiles',
      where: {
        username: { equals: normalizedUsername },
      },
      limit: 1,
      overrideAccess: true,
    })

    if (targetProfiles.docs.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: `No user found with username "${body.username}". They may need to create a bot first to set up their profile.`,
        },
        { status: 404 }
      )
    }

    const targetProfile = targetProfiles.docs[0] as any
    const targetUserId = typeof targetProfile.user === 'object'
      ? targetProfile.user.id
      : targetProfile.user

    // Cannot share with yourself
    if (targetUserId === grantorId) {
      return NextResponse.json(
        { success: false, message: 'You cannot share with yourself' },
        { status: 400 }
      )
    }

    // Grant the access
    const result = await grantResourceAccess(
      payload,
      grantorId,
      targetUserId,
      body.resourceType,
      body.resourceId,
      body.permission
    )

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error || 'Failed to grant access' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Access granted to ${targetProfile.display_name} (@${targetProfile.username})`,
      share: {
        userId: targetUserId,
        username: targetProfile.username,
        displayName: targetProfile.display_name,
        permission: body.permission,
      },
    })
  } catch (error: any) {
    console.error('Error granting access:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to grant access' },
      { status: 500 }
    )
  }
}
