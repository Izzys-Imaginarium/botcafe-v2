import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/migrate/persona-collections
 *
 * Preview what will be migrated from "user persona" knowledge collections
 * to actual persona records.
 *
 * Query params:
 * - userId: Only show collections for a specific user
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const filterUserId = searchParams.get('userId')

    // Build set of valid user IDs
    const allUsers = await payload.find({
      collection: 'users',
      limit: 1000,
      overrideAccess: true,
    })
    const userIdSet = new Set<number>()
    const userIdToEmail = new Map<number, string>()
    for (const user of allUsers.docs) {
      const u = user as { id: number; email: string }
      userIdSet.add(u.id)
      userIdToEmail.set(u.id, u.email)
    }

    // Find all knowledge collections with "user persona" tag
    const allCollections = await payload.find({
      collection: 'knowledgeCollections',
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    })

    // Filter to user persona collections
    const userPersonaCollections = allCollections.docs.filter((col: any) => {
      const tags = col.collection_metadata?.tags || []
      const isUserPersona = tags.some((t: { tag: string }) => t.tag === 'migrated:user persona')
      if (!isUserPersona) return false

      // Filter by user if specified
      if (filterUserId) {
        const userId = typeof col.user === 'object' ? col.user?.id : col.user
        return userId === parseInt(filterUserId, 10)
      }
      return true
    })

    // Get existing personas to check for duplicates
    const existingPersonas = await payload.find({
      collection: 'personas',
      limit: 1000,
      overrideAccess: true,
    })

    // Build map of existing personas by user+name for duplicate detection
    const existingPersonaKeys = new Set<string>()
    for (const persona of existingPersonas.docs) {
      const p = persona as { user: number | { id: number }; name: string }
      const userId = typeof p.user === 'object' ? p.user?.id : p.user
      existingPersonaKeys.add(`${userId}:${p.name.toLowerCase().trim()}`)
    }

    // Analyze each collection for migration
    const migrationPreview: Array<{
      collectionId: number
      collectionName: string
      description: string
      userId: number | null
      userEmail: string | null
      userExists: boolean
      wouldCreatePersona: {
        name: string
        description: string
      }
      status: 'ready' | 'duplicate' | 'orphaned' | 'empty'
      reason?: string
    }> = []

    for (const col of userPersonaCollections) {
      const collection = col as {
        id: number
        name: string
        description?: string
        user: number | { id: number } | null
      }

      const userId =
        typeof collection.user === 'object' && collection.user !== null
          ? collection.user.id
          : collection.user

      const userExists = userId ? userIdSet.has(userId as number) : false
      const userEmail = userId ? userIdToEmail.get(userId as number) || null : null

      // The collection name becomes the persona name
      // The collection description becomes the persona description
      const personaName = collection.name.trim()
      const personaDescription = collection.description?.trim() || ''

      // Check status
      let status: 'ready' | 'duplicate' | 'orphaned' | 'empty' = 'ready'
      let reason: string | undefined

      if (!userId || !userExists) {
        status = 'orphaned'
        reason = `User ${userId || 'null'} does not exist`
      } else if (!personaDescription) {
        status = 'empty'
        reason = 'Collection has no description to use as persona description'
      } else if (existingPersonaKeys.has(`${userId}:${personaName.toLowerCase()}`)) {
        status = 'duplicate'
        reason = `A persona named "${personaName}" already exists for this user`
      }

      migrationPreview.push({
        collectionId: collection.id,
        collectionName: collection.name,
        description: collection.description || '',
        userId: userId as number | null,
        userEmail,
        userExists,
        wouldCreatePersona: {
          name: personaName,
          description: personaDescription,
        },
        status,
        reason,
      })
    }

    // Summary
    const summary = {
      totalUserPersonaCollections: userPersonaCollections.length,
      ready: migrationPreview.filter((m) => m.status === 'ready').length,
      duplicate: migrationPreview.filter((m) => m.status === 'duplicate').length,
      orphaned: migrationPreview.filter((m) => m.status === 'orphaned').length,
      empty: migrationPreview.filter((m) => m.status === 'empty').length,
      existingPersonas: existingPersonas.totalDocs,
    }

    return NextResponse.json({
      success: true,
      summary,
      collections: migrationPreview,
      message:
        'Preview complete. Use POST /api/admin/migrate/persona-collections to execute migration.',
    })
  } catch (error: any) {
    console.error('Persona collection migration preview error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Preview failed' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/migrate/persona-collections
 *
 * Execute migration: Convert "user persona" knowledge collections to actual persona records.
 *
 * Body (optional):
 * - collectionIds: number[] - Only migrate specific collections (if not provided, migrates all ready)
 * - deleteAfterMigration: boolean - Whether to delete the knowledge collection after migration (default: false)
 */
export async function POST(request: NextRequest) {
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

    // Parse body
    const body = (await request.json().catch(() => ({}))) as {
      collectionIds?: number[]
      deleteAfterMigration?: boolean
    }

    const specificIds = body.collectionIds
    const deleteAfterMigration = body.deleteAfterMigration ?? false

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

    // Find all knowledge collections with "user persona" tag
    const allCollections = await payload.find({
      collection: 'knowledgeCollections',
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    })

    // Filter to user persona collections
    let userPersonaCollections = allCollections.docs.filter((col: any) => {
      const tags = col.collection_metadata?.tags || []
      return tags.some((t: { tag: string }) => t.tag === 'migrated:user persona')
    })

    // If specific IDs provided, filter further
    if (specificIds && specificIds.length > 0) {
      const idSet = new Set(specificIds)
      userPersonaCollections = userPersonaCollections.filter((col: any) => idSet.has(col.id))
    }

    // Get existing personas to check for duplicates
    const existingPersonas = await payload.find({
      collection: 'personas',
      limit: 1000,
      overrideAccess: true,
    })

    // Build map of existing personas by user+name for duplicate detection
    const existingPersonaKeys = new Set<string>()
    for (const persona of existingPersonas.docs) {
      const p = persona as { user: number | { id: number }; name: string }
      const userId = typeof p.user === 'object' ? p.user?.id : p.user
      existingPersonaKeys.add(`${userId}:${p.name.toLowerCase().trim()}`)
    }

    // Migrate each collection
    const results: Array<{
      collectionId: number
      collectionName: string
      status: 'created' | 'skipped' | 'error'
      personaId?: number
      reason?: string
    }> = []

    for (const col of userPersonaCollections) {
      const collection = col as {
        id: number
        name: string
        description?: string
        user: number | { id: number } | null
      }

      const userId =
        typeof collection.user === 'object' && collection.user !== null
          ? collection.user.id
          : collection.user

      const userExists = userId ? userIdSet.has(userId as number) : false
      const personaName = collection.name.trim()
      const personaDescription = collection.description?.trim() || ''

      // Skip if not ready
      if (!userId || !userExists) {
        results.push({
          collectionId: collection.id,
          collectionName: collection.name,
          status: 'skipped',
          reason: 'User does not exist',
        })
        continue
      }

      if (!personaDescription) {
        results.push({
          collectionId: collection.id,
          collectionName: collection.name,
          status: 'skipped',
          reason: 'No description available',
        })
        continue
      }

      if (existingPersonaKeys.has(`${userId}:${personaName.toLowerCase()}`)) {
        results.push({
          collectionId: collection.id,
          collectionName: collection.name,
          status: 'skipped',
          reason: 'Duplicate persona name',
        })
        continue
      }

      // Create the persona
      try {
        const newPersona = await payload.create({
          collection: 'personas',
          data: {
            user: userId,
            name: personaName,
            description: personaDescription,
            is_default: false,
            usage_count: 0,
          },
          overrideAccess: true,
        })

        results.push({
          collectionId: collection.id,
          collectionName: collection.name,
          status: 'created',
          personaId: newPersona.id,
        })

        // Add to existing set to prevent duplicates within this batch
        existingPersonaKeys.add(`${userId}:${personaName.toLowerCase()}`)

        // Delete the collection if requested
        if (deleteAfterMigration) {
          try {
            // First delete any knowledge entries in this collection
            await payload.delete({
              collection: 'knowledge',
              where: {
                knowledge_collection: { equals: collection.id },
              },
              overrideAccess: true,
            })

            // Then delete the collection
            await payload.delete({
              collection: 'knowledgeCollections',
              id: collection.id,
              overrideAccess: true,
            })
          } catch (deleteError) {
            console.error(`Failed to delete collection ${collection.id}:`, deleteError)
          }
        }
      } catch (createError: any) {
        results.push({
          collectionId: collection.id,
          collectionName: collection.name,
          status: 'error',
          reason: createError.message,
        })
      }
    }

    // Summary
    const summary = {
      processed: results.length,
      created: results.filter((r) => r.status === 'created').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
      errors: results.filter((r) => r.status === 'error').length,
      deletedCollections: deleteAfterMigration
        ? results.filter((r) => r.status === 'created').length
        : 0,
    }

    return NextResponse.json({
      success: true,
      summary,
      results,
      message: `Migration complete. Created ${summary.created} personas.`,
    })
  } catch (error: any) {
    console.error('Persona collection migration error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Migration failed' },
      { status: 500 }
    )
  }
}
