import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/diagnostic/user-data
 *
 * Admin endpoint to check a specific user's data linkage.
 * Shows all data associated with a user including:
 * - User record
 * - Personas
 * - Creator profile
 * - Bots
 * - Knowledge collections
 *
 * Query params:
 * - email: User's email address to look up
 * - userId: Payload user ID to look up (alternative to email)
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

    // Find current user in Payload and verify admin
    const currentUsers = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: clerkUser.emailAddresses[0]?.emailAddress,
        },
      },
      overrideAccess: true,
    })

    if (currentUsers.docs.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found in database' },
        { status: 404 }
      )
    }

    const currentPayloadUser = currentUsers.docs[0] as { id: number; role?: string }

    // Only admins can access this endpoint
    if (currentPayloadUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const userId = searchParams.get('userId')

    if (!email && !userId) {
      return NextResponse.json(
        { success: false, message: 'Either email or userId query parameter is required' },
        { status: 400 }
      )
    }

    // Find the target user
    let targetUser: any
    if (userId) {
      targetUser = await payload.findByID({
        collection: 'users',
        id: parseInt(userId, 10),
        overrideAccess: true,
      })
    } else if (email) {
      const targetUsers = await payload.find({
        collection: 'users',
        where: {
          email: {
            equals: email.toLowerCase(),
          },
        },
        overrideAccess: true,
      })
      targetUser = targetUsers.docs[0]
    }

    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: 'Target user not found' },
        { status: 404 }
      )
    }

    // Fetch all related data

    // 1. Personas linked to this user
    const personas = await payload.find({
      collection: 'personas',
      where: {
        user: {
          equals: targetUser.id,
        },
      },
      limit: 100,
      overrideAccess: true,
    })

    // 2. Creator profile
    const creatorProfiles = await payload.find({
      collection: 'creatorProfiles',
      where: {
        user: {
          equals: targetUser.id,
        },
      },
      limit: 1,
      overrideAccess: true,
    })

    // 3. Bots created by this user (via creator profile)
    let bots: any = { docs: [], totalDocs: 0 }
    if (creatorProfiles.docs.length > 0) {
      bots = await payload.find({
        collection: 'bot',
        where: {
          creator_profile: {
            equals: creatorProfiles.docs[0].id,
          },
        },
        limit: 100,
        overrideAccess: true,
      })
    }

    // 4. Knowledge collections
    const knowledgeCollections = await payload.find({
      collection: 'knowledgeCollections',
      where: {
        user: {
          equals: targetUser.id,
        },
      },
      limit: 100,
      overrideAccess: true,
    })

    // 5. API Keys
    const apiKeys = await payload.find({
      collection: 'api-key',
      where: {
        user: {
          equals: targetUser.id,
        },
      },
      limit: 100,
      overrideAccess: true,
    })

    // 6. Access control entries (what resources does user have access to)
    const accessControl = await payload.find({
      collection: 'access-control',
      where: {
        user: {
          equals: targetUser.id,
        },
      },
      limit: 100,
      overrideAccess: true,
    })

    // Build response
    const userData = {
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        role: targetUser.role,
        migration_completed: targetUser.migration_completed,
        old_user_id: targetUser.old_user_id,
        createdAt: targetUser.createdAt,
        updatedAt: targetUser.updatedAt,
      },
      personas: {
        count: personas.totalDocs,
        items: personas.docs.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description?.substring(0, 100) + (p.description?.length > 100 ? '...' : ''),
          is_default: p.is_default,
          created_timestamp: p.created_timestamp,
        })),
      },
      creatorProfile: creatorProfiles.docs[0]
        ? {
            id: creatorProfiles.docs[0].id,
            username: (creatorProfiles.docs[0] as any).username,
            display_name: (creatorProfiles.docs[0] as any).display_name,
          }
        : null,
      bots: {
        count: bots.totalDocs,
        items: bots.docs.map((b: any) => ({
          id: b.id,
          name: b.name,
          slug: b.slug,
          is_public: b.is_public,
        })),
      },
      knowledgeCollections: {
        count: knowledgeCollections.totalDocs,
        // Categorize by migration type
        byType: (() => {
          const categorized: Record<string, Array<{ id: number; name: string }>> = {
            userPersona: [],
            botPersona: [],
            memory: [],
            lore: [],
            general: [],
            other: [],
          }
          for (const k of knowledgeCollections.docs) {
            const col = k as {
              id: number
              name: string
              collection_metadata?: { tags?: Array<{ tag: string }> }
            }
            const tags = col.collection_metadata?.tags || []
            const migratedTag = tags.find((t) => t.tag?.startsWith('migrated:'))
            const migratedType = migratedTag?.tag?.replace('migrated:', '') || ''

            const item = { id: col.id, name: col.name }
            if (migratedType === 'user persona') {
              categorized.userPersona.push(item)
            } else if (migratedType === 'bot persona') {
              categorized.botPersona.push(item)
            } else if (migratedType === 'memory') {
              categorized.memory.push(item)
            } else if (migratedType === 'lore') {
              categorized.lore.push(item)
            } else if (migratedType === 'general') {
              categorized.general.push(item)
            } else {
              categorized.other.push(item)
            }
          }
          return categorized
        })(),
      },
      apiKeys: {
        count: apiKeys.totalDocs,
        // Don't expose actual keys
        items: apiKeys.docs.map((a: any) => ({
          id: a.id,
          nickname: a.nickname,
          provider: a.provider,
        })),
      },
      accessControl: {
        count: accessControl.totalDocs,
        items: accessControl.docs.map((ac: any) => ({
          id: ac.id,
          resource_type: ac.resource_type,
          resource_id: ac.resource_id,
          permission: ac.permission,
        })),
      },
    }

    // Check for potential issues
    const issues: string[] = []

    if (!targetUser.migration_completed && targetUser.old_user_id) {
      issues.push('User has old_user_id but migration_completed is false')
    }

    if (personas.totalDocs === 0 && targetUser.migration_completed) {
      issues.push('Migration completed but no personas found - may need persona migration')
    }

    if (!creatorProfiles.docs[0] && bots.totalDocs > 0) {
      issues.push('User has bots but no creator profile')
    }

    // Check for user persona collections that might need migration to actual persona records
    const userPersonaCollections = knowledgeCollections.docs.filter((k: any) => {
      const tags = k.collection_metadata?.tags || []
      return tags.some((t: { tag: string }) => t.tag === 'migrated:user persona')
    })
    if (userPersonaCollections.length > 0 && personas.totalDocs === 0) {
      issues.push(
        `User has ${userPersonaCollections.length} "user persona" collection(s) but no actual persona records - data may need migration`
      )
    }

    return NextResponse.json({
      success: true,
      data: userData,
      issues: issues.length > 0 ? issues : undefined,
    })
  } catch (error: any) {
    console.error('User data diagnostic error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Diagnostic failed' },
      { status: 500 }
    )
  }
}
