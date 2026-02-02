import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

// Helper to extract ID from relationship field
function getRelationId(field: number | { id: number } | null | undefined): number | null {
  if (field === null || field === undefined) return null
  if (typeof field === 'object') return field.id
  return field
}

/**
 * GET /api/admin/fix/empty-personas
 *
 * Preview user persona collections with empty descriptions that can be converted
 * to personas (using knowledge content if available, or just the name).
 *
 * Query params:
 * - userId: Only check for a specific user
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

    // Fetch all knowledge collections
    const collectionQuery: Record<string, unknown> = {}
    if (filterUserId) {
      collectionQuery.user = { equals: parseInt(filterUserId, 10) }
    }

    const allCollections = await payload.find({
      collection: 'knowledgeCollections',
      where: Object.keys(collectionQuery).length > 0 ? collectionQuery : undefined,
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    })

    // Fetch all existing personas to check for duplicates
    const allPersonas = await payload.find({
      collection: 'personas',
      limit: 2000,
      depth: 0,
      overrideAccess: true,
    })

    // Build map of existing persona names by user
    const existingPersonasByUser = new Map<number, Set<string>>()
    for (const p of allPersonas.docs) {
      const persona = p as { id: number; name: string; user: number | { id: number } }
      const userId = getRelationId(persona.user)
      if (userId) {
        const names = existingPersonasByUser.get(userId) || new Set()
        names.add(persona.name.toLowerCase().trim())
        existingPersonasByUser.set(userId, names)
      }
    }

    // Fetch all knowledge entries
    const allKnowledge = await payload.find({
      collection: 'knowledge',
      limit: 5000,
      depth: 0,
      overrideAccess: true,
    })

    // Build map of knowledge entries by collection
    const knowledgeByCollection = new Map<number, string[]>()
    for (const k of allKnowledge.docs) {
      const knowledge = k as { id: number; entry: string; knowledge_collection: number | { id: number } | null }
      const collectionId = getRelationId(knowledge.knowledge_collection)
      if (collectionId) {
        const entries = knowledgeByCollection.get(collectionId) || []
        entries.push(knowledge.entry)
        knowledgeByCollection.set(collectionId, entries)
      }
    }

    // Find user persona collections with empty descriptions
    const emptyPersonaCollections: Array<{
      collectionId: number
      collectionName: string
      description: string
      userId: number
      userEmail?: string
      knowledgeEntries: string[]
      knowledgeCount: number
      suggestedDescription: string
      status: 'ready' | 'duplicate' | 'no_content'
      reason?: string
    }> = []

    // Fetch user emails
    const allUsers = await payload.find({
      collection: 'users',
      limit: 1000,
      overrideAccess: true,
    })
    const userIdToEmail = new Map<number, string>()
    for (const u of allUsers.docs) {
      const user = u as { id: number; email: string }
      userIdToEmail.set(user.id, user.email)
    }

    for (const col of allCollections.docs) {
      const c = col as any

      // Tags can be array of strings or array of {tag: string} objects
      const rawTags = c.collection_metadata?.tags || []
      const tags: string[] = rawTags.map((t: any) => (typeof t === 'string' ? t : t?.tag || ''))
      const isUserPersona = tags.includes('migrated:user persona')

      // Only process user persona collections with empty/minimal descriptions
      if (!isUserPersona) continue
      if (c.description && c.description.trim().length > 10) continue // Skip if has meaningful description

      const userId = getRelationId(c.user)
      if (!userId) continue

      const knowledgeEntries = knowledgeByCollection.get(c.id) || []
      const existingNames = existingPersonasByUser.get(userId) || new Set()
      const normalizedName = c.name.toLowerCase().trim()

      // Check for duplicate
      if (existingNames.has(normalizedName)) {
        emptyPersonaCollections.push({
          collectionId: c.id,
          collectionName: c.name,
          description: c.description || '',
          userId,
          userEmail: userIdToEmail.get(userId),
          knowledgeEntries: knowledgeEntries.slice(0, 3), // Preview first 3
          knowledgeCount: knowledgeEntries.length,
          suggestedDescription: '',
          status: 'duplicate',
          reason: `Persona "${c.name}" already exists for this user`,
        })
        continue
      }

      // Build suggested description from knowledge entries
      let suggestedDescription = ''
      if (knowledgeEntries.length > 0) {
        // Combine knowledge entries into a description (up to 500 chars)
        const combined = knowledgeEntries.join('\n\n')
        suggestedDescription = combined.length > 500 ? combined.substring(0, 497) + '...' : combined
      }

      emptyPersonaCollections.push({
        collectionId: c.id,
        collectionName: c.name,
        description: c.description || '',
        userId,
        userEmail: userIdToEmail.get(userId),
        knowledgeEntries: knowledgeEntries.slice(0, 3),
        knowledgeCount: knowledgeEntries.length,
        suggestedDescription,
        status: 'ready',
      })
    }

    // Summary
    const summary = {
      totalEmptyPersonaCollections: emptyPersonaCollections.length,
      ready: emptyPersonaCollections.filter((c) => c.status === 'ready').length,
      duplicate: emptyPersonaCollections.filter((c) => c.status === 'duplicate').length,
      withKnowledge: emptyPersonaCollections.filter((c) => c.knowledgeCount > 0).length,
      withoutKnowledge: emptyPersonaCollections.filter((c) => c.knowledgeCount === 0).length,
    }

    return NextResponse.json({
      success: true,
      summary,
      collections: emptyPersonaCollections.slice(0, 100),
      message:
        emptyPersonaCollections.length > 100
          ? `Showing first 100 of ${emptyPersonaCollections.length} collections`
          : 'Preview complete. Use POST /api/admin/fix/empty-personas to create personas.',
    })
  } catch (error: any) {
    console.error('Empty personas preview error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Preview failed' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/fix/empty-personas
 *
 * Create personas from user persona collections that have empty descriptions.
 * Uses knowledge entries as the description if available.
 *
 * Body:
 * - collectionIds?: number[] - Only process specific collections
 * - userId?: number - Only process for a specific user
 * - includeEmpty?: boolean - Create personas even without any knowledge content (default: true)
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
      userId?: number
      includeEmpty?: boolean
    }

    const specificCollectionIds = body.collectionIds
    const filterUserId = body.userId
    const includeEmpty = body.includeEmpty !== false // Default true

    // Fetch all knowledge collections
    const collectionQuery: Record<string, unknown> = {}
    if (filterUserId) {
      collectionQuery.user = { equals: filterUserId }
    }

    const allCollections = await payload.find({
      collection: 'knowledgeCollections',
      where: Object.keys(collectionQuery).length > 0 ? collectionQuery : undefined,
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    })

    // Fetch all existing personas to check for duplicates
    const allPersonas = await payload.find({
      collection: 'personas',
      limit: 2000,
      depth: 0,
      overrideAccess: true,
    })

    // Build map of existing persona names by user
    const existingPersonasByUser = new Map<number, Set<string>>()
    for (const p of allPersonas.docs) {
      const persona = p as { id: number; name: string; user: number | { id: number } }
      const userId = getRelationId(persona.user)
      if (userId) {
        const names = existingPersonasByUser.get(userId) || new Set()
        names.add(persona.name.toLowerCase().trim())
        existingPersonasByUser.set(userId, names)
      }
    }

    // Fetch all knowledge entries
    const allKnowledge = await payload.find({
      collection: 'knowledge',
      limit: 5000,
      depth: 0,
      overrideAccess: true,
    })

    // Build map of knowledge entries by collection
    const knowledgeByCollection = new Map<number, string[]>()
    for (const k of allKnowledge.docs) {
      const knowledge = k as { id: number; entry: string; knowledge_collection: number | { id: number } | null }
      const collectionId = getRelationId(knowledge.knowledge_collection)
      if (collectionId) {
        const entries = knowledgeByCollection.get(collectionId) || []
        entries.push(knowledge.entry)
        knowledgeByCollection.set(collectionId, entries)
      }
    }

    // Filter to user persona collections with empty descriptions
    let collectionsToProcess = allCollections.docs.filter((col: any) => {
      const rawTags = col.collection_metadata?.tags || []
      const tags: string[] = rawTags.map((t: any) => (typeof t === 'string' ? t : t?.tag || ''))
      const isUserPersona = tags.includes('migrated:user persona')
      const hasEmptyDescription = !col.description || col.description.trim().length <= 10
      return isUserPersona && hasEmptyDescription
    })

    // Filter to specific collection IDs if provided
    if (specificCollectionIds && specificCollectionIds.length > 0) {
      const idSet = new Set(specificCollectionIds)
      collectionsToProcess = collectionsToProcess.filter((col: any) => idSet.has(col.id))
    }

    const results: Array<{
      collectionId: number
      collectionName: string
      status: 'created' | 'skipped' | 'error'
      personaId?: number
      description?: string
      reason?: string
    }> = []

    for (const col of collectionsToProcess) {
      const c = col as {
        id: number
        name: string
        description: string
        user: number | { id: number } | null
      }

      const userId = getRelationId(c.user)
      if (!userId) {
        results.push({
          collectionId: c.id,
          collectionName: c.name,
          status: 'skipped',
          reason: 'Collection has no user',
        })
        continue
      }

      const existingNames = existingPersonasByUser.get(userId) || new Set()
      const normalizedName = c.name.toLowerCase().trim()

      // Check for duplicate
      if (existingNames.has(normalizedName)) {
        results.push({
          collectionId: c.id,
          collectionName: c.name,
          status: 'skipped',
          reason: `Persona "${c.name}" already exists`,
        })
        continue
      }

      // Build description and custom_instructions from knowledge entries
      const knowledgeEntries = knowledgeByCollection.get(c.id) || []
      let description = ''
      let customInstructions = ''

      if (knowledgeEntries.length > 0) {
        // Consolidate all knowledge entries
        const combined = knowledgeEntries.join('\n\n')

        // Description: first 500 chars or a summary
        if (combined.length <= 500) {
          description = combined
        } else {
          // Try to find a natural break point (sentence or paragraph)
          let cutoff = 497
          const lastPeriod = combined.lastIndexOf('.', 497)
          const lastNewline = combined.lastIndexOf('\n', 497)
          if (lastPeriod > 300) cutoff = lastPeriod + 1
          else if (lastNewline > 300) cutoff = lastNewline

          description = combined.substring(0, cutoff).trim()
          if (description.length < combined.length) {
            description += '...'
          }
        }

        // Custom instructions: full content if it exceeds description
        if (combined.length > 500) {
          customInstructions = combined
        }
      } else if (!includeEmpty) {
        results.push({
          collectionId: c.id,
          collectionName: c.name,
          status: 'skipped',
          reason: 'No knowledge content and includeEmpty=false',
        })
        continue
      }

      // Create the persona
      try {
        const personaData = {
          user: userId,
          name: c.name.trim(),
          description: description || `Persona: ${c.name.trim()}`,
          custom_instructions: customInstructions || undefined,
        }

        const newPersona = await payload.create({
          collection: 'personas',
          data: personaData as any,
          overrideAccess: true,
        })

        results.push({
          collectionId: c.id,
          collectionName: c.name,
          status: 'created',
          personaId: newPersona.id,
          description: description.substring(0, 100) + (description.length > 100 ? '...' : ''),
        })

        // Update tracking to prevent duplicates in this batch
        existingNames.add(normalizedName)
        existingPersonasByUser.set(userId, existingNames)
      } catch (createError: any) {
        results.push({
          collectionId: c.id,
          collectionName: c.name,
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
    }

    return NextResponse.json({
      success: true,
      summary,
      results,
      message: `Created ${summary.created} personas from empty-description collections.`,
    })
  } catch (error: any) {
    console.error('Empty personas fix error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Fix failed' },
      { status: 500 }
    )
  }
}
