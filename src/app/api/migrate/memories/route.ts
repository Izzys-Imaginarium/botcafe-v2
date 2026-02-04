import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import type { Memory } from '@/payload-types'

export const dynamic = 'force-dynamic'

/**
 * Find or create a "Legacy Memories" KnowledgeCollection for a user
 */
async function findOrCreateLegacyMemoriesTome(
  payload: Payload,
  userId: number,
  botIds: number[]
): Promise<number> {
  const tomeName = 'Legacy Memories (Migrated)'

  // Look for existing legacy memories tome
  const existing = await payload.find({
    collection: 'knowledgeCollections',
    where: {
      user: { equals: userId },
      name: { equals: tomeName },
    },
    limit: 1,
    overrideAccess: true,
  })

  if (existing.docs.length > 0) {
    return existing.docs[0].id
  }

  // Create new tome
  const newTome = await payload.create({
    collection: 'knowledgeCollections',
    data: {
      name: tomeName,
      user: userId,
      bot: botIds.length > 0 ? botIds : undefined,
      description: 'Auto-migrated memories from the legacy Memory collection',
      sharing_settings: {
        sharing_level: 'private',
        allow_collaboration: false,
        allow_fork: false,
        knowledge_count: 0,
        is_public: false,
      },
      collection_metadata: {
        collection_category: 'memories',
        tags: [{ tag: 'migrated' }, { tag: 'from-memory-collection' }],
      },
    },
    overrideAccess: true,
  })

  return newTome.id
}

/**
 * Transform a Memory entry to Knowledge entry data
 */
function transformMemoryToKnowledge(
  memory: Memory,
  tomeId: number,
  userId: number
): Record<string, unknown> {
  // Build tags from importance and emotional_context
  const tags: { tag: string }[] = [
    { tag: 'migrated' },
    { tag: `importance-${memory.importance || 5}` },
    { tag: `memory-type-${memory.type || 'short_term'}` },
  ]

  // Parse emotional_context into mood tags
  if (memory.emotional_context) {
    const emotions = memory.emotional_context.split(/[,\s]+/).filter(Boolean)
    emotions.forEach(emotion => {
      tags.push({ tag: `mood-${emotion.toLowerCase().trim()}` })
    })
  }

  // Extract bot IDs (hasMany -> array)
  const botIds: number[] = (memory.bot || []).map(b =>
    typeof b === 'object' ? b.id : b
  ).filter((id): id is number => id != null)

  // Extract persona IDs (hasMany -> array)
  const personaIds: number[] = (memory.persona || []).map(p =>
    typeof p === 'object' ? p.id : p
  ).filter((id): id is number => id != null)

  // Extract conversation ID
  const conversationId = typeof memory.conversation === 'object'
    ? memory.conversation?.id
    : memory.conversation

  return {
    user: userId,
    knowledge_collection: tomeId,
    entry: memory.entry,
    type: 'legacy_memory',
    tags,
    is_legacy_memory: true,
    source_memory_id: memory.id,
    source_conversation_id: conversationId || undefined,
    original_participants: memory.participants || { personas: [], bots: [] },
    applies_to_bots: botIds.length > 0 ? botIds : undefined,
    applies_to_personas: personaIds.length > 0 ? personaIds : undefined,
    tokens: memory.tokens || 0,
    is_vectorized: false, // Will need re-vectorization

    // Activation settings for memories
    activation_settings: {
      activation_mode: 'vector',
      vector_similarity_threshold: 0.6,
      max_vector_results: 5,
      probability: 100,
      use_probability: false,
    },

    positioning: {
      position: 'after_character',
      order: 50,
    },

    privacy_settings: {
      privacy_level: 'private',
    },
  }
}

/**
 * GET /api/migrate/memories
 *
 * Get migration status - count of memories to migrate
 */
export async function GET(request: NextRequest) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Find user
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

    const user = users.docs[0]
    const isAdmin = user.role === 'admin'

    // Count total memories not yet converted
    const pendingQuery: Record<string, unknown> = {
      converted_to_lore: { not_equals: true },
    }

    // Non-admins can only see their own memories
    if (!isAdmin) {
      pendingQuery.user = { equals: user.id }
    }

    const pendingMemories = await payload.find({
      collection: 'memory',
      where: pendingQuery,
      limit: 0, // Just get count
      overrideAccess: true,
    })

    // Count already converted
    const convertedQuery: Record<string, unknown> = {
      converted_to_lore: { equals: true },
    }

    if (!isAdmin) {
      convertedQuery.user = { equals: user.id }
    }

    const convertedMemories = await payload.find({
      collection: 'memory',
      where: convertedQuery,
      limit: 0,
      overrideAccess: true,
    })

    return NextResponse.json({
      success: true,
      status: {
        pending: pendingMemories.totalDocs,
        alreadyMigrated: convertedMemories.totalDocs,
        total: pendingMemories.totalDocs + convertedMemories.totalDocs,
      },
      isAdmin,
      message: pendingMemories.totalDocs > 0
        ? `${pendingMemories.totalDocs} memories pending migration`
        : 'All memories have been migrated',
    })

  } catch (error: unknown) {
    console.error('Migration status error:', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to get migration status' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/migrate/memories
 *
 * Execute bulk migration of Memory entries to Knowledge entries
 *
 * Body:
 * - batchSize?: number (default: 100)
 * - userId?: number (admin only - migrate specific user)
 * - dryRun?: boolean (preview without executing)
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await currentUser()
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json() as {
      batchSize?: number
      userId?: number
      dryRun?: boolean
    }

    const { batchSize = 100, userId: targetUserId, dryRun = false } = body

    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Find current user
    const foundUsers = await payload.find({
      collection: 'users',
      where: {
        email: { equals: authUser.emailAddresses[0]?.emailAddress },
      },
      overrideAccess: true,
    })

    if (foundUsers.docs.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    const payloadUser = foundUsers.docs[0]
    const isAdmin = payloadUser.role === 'admin'

    // Non-admins can only migrate their own memories
    if (targetUserId && !isAdmin && targetUserId !== payloadUser.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Cannot migrate other users\' memories' },
        { status: 403 }
      )
    }

    // Build query for memories to migrate
    const whereClause: Record<string, unknown> = {
      converted_to_lore: { not_equals: true },
    }

    // Filter by user if specified or if not admin
    if (targetUserId) {
      whereClause.user = { equals: targetUserId }
    } else if (!isAdmin) {
      whereClause.user = { equals: payloadUser.id }
    }

    // Fetch memories to migrate
    const memoriesToMigrate = await payload.find({
      collection: 'memory',
      where: whereClause,
      limit: batchSize,
      depth: 1,
      overrideAccess: true,
    })

    if (memoriesToMigrate.docs.length === 0) {
      return NextResponse.json({
        success: true,
        results: {
          processed: 0,
          migrated: 0,
          skipped: 0,
          failed: 0,
          errors: [],
        },
        message: 'No memories to migrate',
      })
    }

    // If dry run, just return what would be migrated
    if (dryRun) {
      const preview = memoriesToMigrate.docs.map(m => ({
        id: m.id,
        entry: m.entry?.substring(0, 100) + (m.entry && m.entry.length > 100 ? '...' : ''),
        importance: m.importance,
        type: m.type,
        botCount: Array.isArray(m.bot) ? m.bot.length : 0,
      }))

      return NextResponse.json({
        success: true,
        dryRun: true,
        results: {
          wouldProcess: memoriesToMigrate.docs.length,
          totalPending: memoriesToMigrate.totalDocs,
        },
        preview,
        message: `Would migrate ${memoriesToMigrate.docs.length} memories (${memoriesToMigrate.totalDocs} total pending)`,
      })
    }

    // Group memories by user for efficient tome creation
    const memoriesByUser = new Map<number, Memory[]>()
    for (const memory of memoriesToMigrate.docs) {
      const memUserId = typeof memory.user === 'object' ? memory.user.id : memory.user
      if (!memoriesByUser.has(memUserId)) {
        memoriesByUser.set(memUserId, [])
      }
      memoriesByUser.get(memUserId)!.push(memory as Memory)
    }

    // Track results
    let migrated = 0
    let skipped = 0
    let failed = 0
    const errors: string[] = []

    // Process each user's memories
    for (const [memUserId, userMemories] of memoriesByUser) {
      try {
        // Collect all bot IDs from this user's memories
        const allBotIds = new Set<number>()
        for (const mem of userMemories) {
          if (Array.isArray(mem.bot)) {
            for (const b of mem.bot) {
              const botId = typeof b === 'object' ? b.id : b
              if (botId) allBotIds.add(botId)
            }
          }
        }

        // Find or create legacy memories tome for this user
        const tomeId = await findOrCreateLegacyMemoriesTome(
          payload,
          memUserId,
          Array.from(allBotIds)
        )

        // Migrate each memory
        for (const memory of userMemories) {
          try {
            // Check if already migrated (double-check)
            if (memory.converted_to_lore) {
              skipped++
              continue
            }

            // Transform and create knowledge entry
            const knowledgeData = transformMemoryToKnowledge(memory, tomeId, memUserId)
            const knowledge = await payload.create({
              collection: 'knowledge',
              // @ts-expect-error - knowledgeData has all required fields, TypeScript just can't infer it
              data: knowledgeData,
              overrideAccess: true,
            })

            // Mark original memory as converted
            await payload.update({
              collection: 'memory',
              id: memory.id,
              data: {
                converted_to_lore: true,
                lore_entry: knowledge.id,
                converted_at: new Date().toISOString(),
              },
              overrideAccess: true,
            })

            migrated++
          } catch (memError) {
            failed++
            const errMsg = memError instanceof Error ? memError.message : 'Unknown error'
            errors.push(`Memory ${memory.id}: ${errMsg}`)
            console.error(`Failed to migrate memory ${memory.id}:`, memError)
          }
        }

        // Update tome's knowledge count
        const tome = await payload.findByID({
          collection: 'knowledgeCollections',
          id: tomeId,
          overrideAccess: true,
        })
        if (tome) {
          const currentCount = tome.sharing_settings?.knowledge_count || 0
          await payload.update({
            collection: 'knowledgeCollections',
            id: tomeId,
            data: {
              sharing_settings: {
                ...tome.sharing_settings,
                knowledge_count: currentCount + userMemories.length - skipped,
                last_updated: new Date().toISOString(),
              },
            },
            overrideAccess: true,
          })
        }

      } catch (userError) {
        const errMsg = userError instanceof Error ? userError.message : 'Unknown error'
        errors.push(`User ${memUserId}: ${errMsg}`)
        console.error(`Failed to process user ${memUserId}:`, userError)
        failed += userMemories.length
      }
    }

    return NextResponse.json({
      success: true,
      results: {
        processed: memoriesToMigrate.docs.length,
        migrated,
        skipped,
        failed,
        errors: errors.slice(0, 10), // Limit errors in response
        totalPending: memoriesToMigrate.totalDocs - migrated,
      },
      message: `Migrated ${migrated} memories (${skipped} skipped, ${failed} failed)`,
    })

  } catch (error: unknown) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Migration failed' },
      { status: 500 }
    )
  }
}
