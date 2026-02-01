import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/diagnostic/persona-collections
 *
 * Admin endpoint to diagnose knowledge collections that store persona data.
 * These are collections with type "user persona" from the old BotCafe migration.
 *
 * Checks for:
 * - Collections with persona-related metadata tags
 * - Collections that may need to be linked to actual persona records
 * - Orphaned persona collections (user doesn't exist)
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

    // Find user in Payload and verify admin
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

    const payloadUser = users.docs[0] as { id: number; role?: string }

    // Only admins can access this endpoint
    if (payloadUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    // Build set of valid user IDs
    const allUsers = await payload.find({
      collection: 'users',
      limit: 1000,
      overrideAccess: true,
    })
    const userIdSet = new Set<number>()
    for (const user of allUsers.docs) {
      userIdSet.add((user as { id: number }).id)
    }

    // Fetch all knowledge collections
    const allCollections = await payload.find({
      collection: 'knowledgeCollections',
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    })

    // Categorize collections
    const personaCollections: Array<{
      id: number
      name: string
      description?: string
      userId: number | null
      userExists: boolean
      migratedType?: string
      knowledgeCount?: number
    }> = []

    const botPersonaCollections: Array<{
      id: number
      name: string
      description?: string
      userId: number | null
      userExists: boolean
      migratedType?: string
    }> = []

    const memoryCollections: Array<{
      id: number
      name: string
      userId: number | null
      userExists: boolean
    }> = []

    for (const collection of allCollections.docs) {
      const col = collection as {
        id: number
        name: string
        description?: string
        user: number | { id: number } | null
        collection_metadata?: {
          tags?: Array<{ tag: string }>
        }
        sharing_settings?: {
          knowledge_count?: number
        }
      }

      const userId =
        typeof col.user === 'object' && col.user !== null ? col.user.id : col.user
      const userExists = userId ? userIdSet.has(userId as number) : false

      // Check for migration tags that indicate collection type
      const tags = col.collection_metadata?.tags || []
      const migratedTag = tags.find((t) => t.tag?.startsWith('migrated:'))
      const migratedType = migratedTag?.tag?.replace('migrated:', '')

      if (migratedType === 'user persona' || col.name.toLowerCase().includes('persona')) {
        personaCollections.push({
          id: col.id,
          name: col.name,
          description: col.description,
          userId: userId as number | null,
          userExists,
          migratedType,
          knowledgeCount: col.sharing_settings?.knowledge_count,
        })
      } else if (migratedType === 'bot persona') {
        botPersonaCollections.push({
          id: col.id,
          name: col.name,
          description: col.description,
          userId: userId as number | null,
          userExists,
          migratedType,
        })
      } else if (migratedType === 'memory' || col.name.toLowerCase().includes('memor')) {
        memoryCollections.push({
          id: col.id,
          name: col.name,
          userId: userId as number | null,
          userExists,
        })
      }
    }

    // Fetch actual persona records for comparison
    const allPersonas = await payload.find({
      collection: 'personas',
      limit: 1000,
      overrideAccess: true,
    })

    // Build summary
    const summary = {
      totalKnowledgeCollections: allCollections.totalDocs,
      userPersonaCollections: personaCollections.length,
      botPersonaCollections: botPersonaCollections.length,
      memoryCollections: memoryCollections.length,
      actualPersonaRecords: allPersonas.totalDocs,
      orphanedUserPersonaCollections: personaCollections.filter((p) => !p.userExists).length,
      orphanedBotPersonaCollections: botPersonaCollections.filter((p) => !p.userExists).length,
    }

    return NextResponse.json({
      success: true,
      summary,
      userPersonaCollections: personaCollections,
      botPersonaCollections: botPersonaCollections,
      memoryCollections: memoryCollections.slice(0, 20), // Limit for readability
      actualPersonas: allPersonas.docs.map((p: any) => ({
        id: p.id,
        name: p.name,
        userId: typeof p.user === 'object' ? p.user?.id : p.user,
      })),
      message:
        'Analysis complete. User persona collections may need to be migrated to actual persona records.',
    })
  } catch (error: any) {
    console.error('Persona collections diagnostic error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Diagnostic failed' },
      { status: 500 }
    )
  }
}
