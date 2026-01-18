import type { Payload } from 'payload'

export type Permission = 'owner' | 'editor' | 'readonly'
export type ResourceType = 'bot' | 'knowledgeCollection'

interface AccessCheckResult {
  hasAccess: boolean
  permission: Permission | null
  isOriginalCreator: boolean
}

/**
 * Maps our simplified permission levels to AccessControl permission_type values
 */
const PERMISSION_MAPPING: Record<Permission, string[]> = {
  owner: ['admin'],
  editor: ['write', 'admin'],
  readonly: ['read', 'write', 'admin'],
}

/**
 * Check what level of access a user has to a specific resource.
 *
 * Access can come from:
 * 1. Being the original creator (user field on the resource)
 * 2. Having an AccessControl record granting access
 * 3. The resource being public (for read-only access)
 *
 * @param payload - Payload instance
 * @param userId - The user ID to check access for
 * @param resourceType - 'bot' or 'knowledgeCollection'
 * @param resourceId - The resource ID
 * @returns AccessCheckResult with permission level
 */
export async function checkResourceAccess(
  payload: Payload,
  userId: number | string,
  resourceType: ResourceType,
  resourceId: number | string
): Promise<AccessCheckResult> {
  const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId
  const resourceIdStr = String(resourceId)

  // First, check if user is the original creator
  const isOriginalCreator = await checkIsOriginalCreator(
    payload,
    userIdNum,
    resourceType,
    resourceId
  )

  if (isOriginalCreator) {
    return {
      hasAccess: true,
      permission: 'owner',
      isOriginalCreator: true,
    }
  }

  // Check AccessControl records for this user and resource
  const accessControls = await payload.find({
    collection: 'access-control',
    where: {
      and: [
        { user: { equals: userIdNum } },
        { resource_type: { equals: resourceType } },
        { resource_id: { equals: resourceIdStr } },
        { is_revoked: { equals: false } },
      ],
    },
    limit: 10,
    overrideAccess: true,
  })

  if (accessControls.docs.length > 0) {
    // Find the highest permission level
    const permissions = accessControls.docs.map((ac: any) => ac.permission_type)

    if (permissions.includes('admin')) {
      return {
        hasAccess: true,
        permission: 'owner',
        isOriginalCreator: false,
      }
    }
    if (permissions.includes('write')) {
      return {
        hasAccess: true,
        permission: 'editor',
        isOriginalCreator: false,
      }
    }
    if (permissions.includes('read')) {
      return {
        hasAccess: true,
        permission: 'readonly',
        isOriginalCreator: false,
      }
    }
  }

  // Check if resource is public (grants read-only access)
  const isPublic = await checkIsPublic(payload, resourceType, resourceId)
  if (isPublic) {
    return {
      hasAccess: true,
      permission: 'readonly',
      isOriginalCreator: false,
    }
  }

  return {
    hasAccess: false,
    permission: null,
    isOriginalCreator: false,
  }
}

/**
 * Check if a user has at least the required permission level for a resource.
 */
export async function canUserAccess(
  payload: Payload,
  userId: number | string,
  resourceType: ResourceType,
  resourceId: number | string,
  requiredPermission: Permission
): Promise<boolean> {
  const result = await checkResourceAccess(payload, userId, resourceType, resourceId)

  if (!result.hasAccess || !result.permission) {
    return false
  }

  // Permission hierarchy: owner > editor > readonly
  const permissionOrder: Permission[] = ['readonly', 'editor', 'owner']
  const userPermissionIndex = permissionOrder.indexOf(result.permission)
  const requiredPermissionIndex = permissionOrder.indexOf(requiredPermission)

  return userPermissionIndex >= requiredPermissionIndex
}

/**
 * Check if user is the original creator of a resource.
 */
async function checkIsOriginalCreator(
  payload: Payload,
  userId: number,
  resourceType: ResourceType,
  resourceId: number | string
): Promise<boolean> {
  const collection = resourceType === 'bot' ? 'bot' : 'knowledgeCollections'

  try {
    const resource = await payload.findByID({
      collection,
      id: typeof resourceId === 'string' ? parseInt(resourceId, 10) : resourceId,
      overrideAccess: true,
    })

    if (!resource) {
      return false
    }

    // Handle both number and object (populated) user field
    const resourceUserId = typeof resource.user === 'object'
      ? (resource.user as any)?.id
      : resource.user

    return resourceUserId === userId
  } catch {
    return false
  }
}

/**
 * Check if a resource is publicly accessible.
 */
async function checkIsPublic(
  payload: Payload,
  resourceType: ResourceType,
  resourceId: number | string
): Promise<boolean> {
  const collection = resourceType === 'bot' ? 'bot' : 'knowledgeCollections'

  try {
    const resource = await payload.findByID({
      collection,
      id: typeof resourceId === 'string' ? parseInt(resourceId, 10) : resourceId,
      overrideAccess: true,
    }) as any

    if (!resource) {
      return false
    }

    if (resourceType === 'bot') {
      // Check both legacy is_public and new sharing.visibility
      return resource.is_public === true || resource.sharing?.visibility === 'public'
    } else {
      return resource.sharing_settings?.sharing_level === 'public'
    }
  } catch {
    return false
  }
}

/**
 * Get all users who have access to a resource (excluding the original creator).
 */
export async function getResourceCollaborators(
  payload: Payload,
  resourceType: ResourceType,
  resourceId: number | string
): Promise<Array<{
  userId: number
  username: string
  displayName: string
  permission: Permission
  grantedAt: string
}>> {
  const resourceIdStr = String(resourceId)

  const accessControls = await payload.find({
    collection: 'access-control',
    where: {
      and: [
        { resource_type: { equals: resourceType } },
        { resource_id: { equals: resourceIdStr } },
        { is_revoked: { equals: false } },
      ],
    },
    depth: 1, // Populate user relationship
    limit: 100,
    overrideAccess: true,
  })

  const collaborators: Array<{
    userId: number
    username: string
    displayName: string
    permission: Permission
    grantedAt: string
  }> = []

  for (const ac of accessControls.docs as any[]) {
    const user = ac.user
    if (!user || typeof user !== 'object') continue

    // Get the user's creator profile for username
    const profiles = await payload.find({
      collection: 'creatorProfiles',
      where: {
        user: { equals: user.id },
      },
      limit: 1,
      overrideAccess: true,
    })

    const profile = profiles.docs[0] as any

    let permission: Permission = 'readonly'
    if (ac.permission_type === 'admin') {
      permission = 'owner'
    } else if (ac.permission_type === 'write') {
      permission = 'editor'
    }

    collaborators.push({
      userId: user.id,
      username: profile?.username || user.email?.split('@')[0] || 'unknown',
      displayName: profile?.display_name || user.name || user.email || 'Unknown User',
      permission,
      grantedAt: ac.created_timestamp || ac.createdAt,
    })
  }

  return collaborators
}

/**
 * Grant access to a resource for a specific user.
 */
export async function grantResourceAccess(
  payload: Payload,
  grantorId: number | string,
  targetUserId: number | string,
  resourceType: ResourceType,
  resourceId: number | string,
  permission: Permission
): Promise<{ success: boolean; error?: string }> {
  const grantorIdNum = typeof grantorId === 'string' ? parseInt(grantorId, 10) : grantorId
  const targetUserIdNum = typeof targetUserId === 'string' ? parseInt(targetUserId, 10) : targetUserId
  const resourceIdStr = String(resourceId)

  // Check if grantor has owner permission
  const grantorAccess = await checkResourceAccess(payload, grantorIdNum, resourceType, resourceId)
  if (!grantorAccess.hasAccess || grantorAccess.permission !== 'owner') {
    return { success: false, error: 'Only owners can grant access' }
  }

  // Map permission to AccessControl permission_type
  let permissionType: 'read' | 'write' | 'admin'
  switch (permission) {
    case 'owner':
      permissionType = 'admin'
      break
    case 'editor':
      permissionType = 'write'
      break
    case 'readonly':
    default:
      permissionType = 'read'
      break
  }

  // Check if access already exists
  const existing = await payload.find({
    collection: 'access-control',
    where: {
      and: [
        { user: { equals: targetUserIdNum } },
        { resource_type: { equals: resourceType } },
        { resource_id: { equals: resourceIdStr } },
        { is_revoked: { equals: false } },
      ],
    },
    limit: 1,
    overrideAccess: true,
  })

  if (existing.docs.length > 0) {
    // Update existing access
    await payload.update({
      collection: 'access-control',
      id: existing.docs[0].id,
      data: {
        permission_type: permissionType,
      },
      overrideAccess: true,
    })
  } else {
    // Create new access control record
    await payload.create({
      collection: 'access-control',
      data: {
        user: targetUserIdNum,
        granted_by: grantorIdNum,
        resource_type: resourceType,
        resource_id: resourceIdStr,
        permission_type: permissionType,
        grant_method: 'direct-share',
        is_revoked: false,
      },
      overrideAccess: true,
    })
  }

  return { success: true }
}

/**
 * Revoke access to a resource for a specific user.
 */
export async function revokeResourceAccess(
  payload: Payload,
  revokerId: number | string,
  targetUserId: number | string,
  resourceType: ResourceType,
  resourceId: number | string
): Promise<{ success: boolean; error?: string }> {
  const revokerIdNum = typeof revokerId === 'string' ? parseInt(revokerId, 10) : revokerId
  const targetUserIdNum = typeof targetUserId === 'string' ? parseInt(targetUserId, 10) : targetUserId
  const resourceIdStr = String(resourceId)

  // Check if revoker has owner permission
  const revokerAccess = await checkResourceAccess(payload, revokerIdNum, resourceType, resourceId)
  if (!revokerAccess.hasAccess || revokerAccess.permission !== 'owner') {
    return { success: false, error: 'Only owners can revoke access' }
  }

  // Cannot revoke the original creator's access
  const isTargetOriginalCreator = await checkIsOriginalCreator(
    payload,
    targetUserIdNum,
    resourceType,
    resourceId
  )
  if (isTargetOriginalCreator) {
    return { success: false, error: 'Cannot revoke access from the original creator' }
  }

  // Find and revoke the access control record
  const existing = await payload.find({
    collection: 'access-control',
    where: {
      and: [
        { user: { equals: targetUserIdNum } },
        { resource_type: { equals: resourceType } },
        { resource_id: { equals: resourceIdStr } },
        { is_revoked: { equals: false } },
      ],
    },
    limit: 10,
    overrideAccess: true,
  })

  for (const ac of existing.docs) {
    await payload.update({
      collection: 'access-control',
      id: ac.id,
      data: {
        is_revoked: true,
        revoked_by: revokerIdNum,
        revoked_timestamp: new Date().toISOString(),
        revoked_reason: 'Access revoked by owner',
      },
      overrideAccess: true,
    })
  }

  return { success: true }
}
