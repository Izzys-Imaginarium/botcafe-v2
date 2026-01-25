import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Knowledge } from '@/payload-types'

export const dynamic = 'force-dynamic'

/**
 * Helper to get payload user from Clerk user
 */
async function getPayloadUser(clerkUser: NonNullable<Awaited<ReturnType<typeof currentUser>>>) {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const users = await payload.find({
    collection: 'users',
    where: {
      email: {
        equals: clerkUser.emailAddresses[0]?.emailAddress,
      },
    },
  })

  return { payload, user: users.docs[0] || null }
}

/**
 * Normalize a Knowledge entry (lore-based memory) to match Memory interface
 * This allows the frontend to display both types consistently
 */
function normalizeKnowledgeToMemory(knowledge: Knowledge): Record<string, unknown> {
  // Extract importance from tags (format: "importance-N")
  let importance = 5
  if (knowledge.tags) {
    const importanceTag = knowledge.tags.find(t => t.tag?.startsWith('importance-'))
    if (importanceTag?.tag) {
      const parsed = parseInt(importanceTag.tag.replace('importance-', ''), 10)
      if (!isNaN(parsed)) importance = parsed
    }
  }

  // Extract emotional context from tags (format: "mood-X")
  const moodTags = knowledge.tags?.filter(t => t.tag?.startsWith('mood-')) || []
  const emotionalContext = moodTags.map(t => t.tag?.replace('mood-', '')).filter(Boolean).join(', ')

  return {
    id: `lore-${knowledge.id}`, // Prefix to distinguish from Memory IDs
    _sourceType: 'knowledge', // Internal marker for source type
    _knowledgeId: knowledge.id, // Original knowledge ID
    entry: knowledge.entry,
    type: 'long_term', // Auto-generated memories are long-term
    tokens: knowledge.tokens || 0,
    created_timestamp: knowledge.created_timestamp || knowledge.createdAt,
    is_vectorized: knowledge.is_vectorized || false,
    converted_to_lore: true, // Already in lore format
    importance,
    emotional_context: emotionalContext || null,
    bot: knowledge.applies_to_bots, // Already an array
    persona: knowledge.applies_to_personas,
    conversation: knowledge.source_conversation_id,
    lore_entry: { id: knowledge.id }, // Self-reference since it IS a lore entry
    knowledge_collection: knowledge.knowledge_collection,
    participants: knowledge.original_participants,
  }
}

/**
 * GET /api/memories
 *
 * Fetch all memory entries for the current user.
 * Includes both legacy Memory collection entries AND auto-generated
 * memories stored as Knowledge entries (is_legacy_memory=true).
 *
 * Query params:
 * - type?: 'short_term' | 'long_term' | 'consolidated'
 * - botId?: string
 * - convertedToLore?: 'true' | 'false'
 * - source?: 'memory' | 'knowledge' | 'all' (default: 'all')
 * - limit?: number (default: 50)
 * - offset?: number (default: 0)
 *
 * Response:
 * - success: boolean
 * - memories: Memory[] (unified format, includes _sourceType field)
 * - total: number
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

    // Find user in Payload by email
    const users = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: clerkUser.emailAddresses[0]?.emailAddress,
        },
      },
    })

    if (users.docs.length === 0) {
      // User not synced yet - return empty results
      return NextResponse.json({
        success: true,
        memories: [],
        total: 0,
        hasMore: false,
        page: 1,
        totalPages: 0,
      })
    }

    const payloadUser = users.docs[0]

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const botId = searchParams.get('botId')
    const convertedToLore = searchParams.get('convertedToLore')
    const source = searchParams.get('source') || 'all' // 'memory', 'knowledge', or 'all'
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const allMemories: Record<string, unknown>[] = []
    let totalCount = 0

    // Fetch from Memory collection (unless source is 'knowledge' only)
    if (source === 'all' || source === 'memory') {
      // Build where clause for Memory collection
      const memoryWhere: Record<string, unknown> = {
        user: { equals: payloadUser.id },
      }

      if (type) {
        memoryWhere.type = { equals: type }
      }

      if (botId) {
        memoryWhere.bot = { contains: parseInt(botId, 10) }
      }

      if (convertedToLore !== null) {
        memoryWhere.converted_to_lore = { equals: convertedToLore === 'true' }
      }

      const memoriesResult = await payload.find({
        collection: 'memory',
        where: memoryWhere,
        limit: source === 'all' ? 1000 : limit, // Fetch more if combining
        sort: '-created_timestamp',
        depth: 2,
        overrideAccess: true,
      })

      // Add source type marker to each memory
      const markedMemories = memoriesResult.docs.map(m => ({
        ...m,
        _sourceType: 'memory',
      }))
      allMemories.push(...markedMemories)
      totalCount += memoriesResult.totalDocs
    }

    // Fetch from Knowledge collection (unless source is 'memory' only)
    // Only get entries where is_legacy_memory=true (auto-generated memories)
    if (source === 'all' || source === 'knowledge') {
      // Build where clause for Knowledge collection
      const knowledgeWhere: Record<string, unknown> = {
        user: { equals: payloadUser.id },
        is_legacy_memory: { equals: true },
      }

      if (botId) {
        knowledgeWhere.applies_to_bots = { contains: parseInt(botId, 10) }
      }

      // For type filter, only show knowledge entries for 'long_term' or 'all'
      // (auto-generated memories are effectively long-term)
      if (type && type !== 'long_term') {
        // Skip knowledge entries if filtering for short_term or consolidated
        // (knowledge-based memories are always long_term)
      } else {
        const knowledgeResult = await payload.find({
          collection: 'knowledge',
          where: knowledgeWhere,
          limit: source === 'all' ? 1000 : limit,
          sort: '-created_timestamp',
          depth: 2,
          overrideAccess: true,
        })

        // Normalize knowledge entries to memory format
        const normalizedKnowledge = knowledgeResult.docs.map(k =>
          normalizeKnowledgeToMemory(k as Knowledge)
        )
        allMemories.push(...normalizedKnowledge)
        totalCount += knowledgeResult.totalDocs
      }
    }

    // Sort combined results by created_timestamp descending
    allMemories.sort((a, b) => {
      const dateA = new Date(a.created_timestamp as string).getTime()
      const dateB = new Date(b.created_timestamp as string).getTime()
      return dateB - dateA
    })

    // Apply pagination to combined results
    const paginatedMemories = allMemories.slice(offset, offset + limit)
    const hasMore = offset + limit < allMemories.length

    return NextResponse.json({
      success: true,
      memories: paginatedMemories,
      total: totalCount,
      hasMore,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(allMemories.length / limit),
    })

  } catch (error: unknown) {
    console.error('Fetch memories error:', error)
    // Return empty results instead of error for better UX
    return NextResponse.json({
      success: true,
      memories: [],
      total: 0,
      hasMore: false,
      page: 1,
      totalPages: 0,
    })
  }
}

/**
 * POST /api/memories
 *
 * Create a new memory entry.
 *
 * Body:
 * - entry: string (required) - Memory content
 * - botId: number (required) - Associated bot
 * - type?: 'short_term' | 'long_term' | 'consolidated' (default: 'short_term')
 * - importance?: number (1-10, default: 5)
 * - emotional_context?: string
 * - conversationId?: number - Associated conversation
 *
 * Response:
 * - success: boolean
 * - memory: Memory
 * - message?: string
 */
export async function POST(request: NextRequest) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json() as {
      entry?: string
      botId?: string | number // Single bot (backwards compatibility)
      botIds?: (string | number)[] // Multiple bots (new)
      personaIds?: (string | number)[] // Personas involved (new)
      type?: string
      importance?: number
      emotional_context?: string
      conversationId?: string | number
    }
    const { entry, botId, botIds, personaIds, type, importance, emotional_context, conversationId } = body

    // Validate required fields
    if (!entry || typeof entry !== 'string' || entry.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Memory content is required' },
        { status: 400 }
      )
    }

    // Support both single botId (backwards compat) and array of botIds
    let botIdNums: number[] = []
    if (botIds && Array.isArray(botIds) && botIds.length > 0) {
      botIdNums = botIds.map(id => typeof id === 'number' ? id : parseInt(String(id), 10)).filter(id => !isNaN(id))
    } else if (botId) {
      const singleId = typeof botId === 'number' ? botId : parseInt(String(botId), 10)
      if (!isNaN(singleId)) botIdNums = [singleId]
    }

    if (botIdNums.length === 0) {
      return NextResponse.json(
        { success: false, message: 'At least one Bot ID is required' },
        { status: 400 }
      )
    }

    // Parse persona IDs (optional)
    let personaIdNums: number[] = []
    if (personaIds && Array.isArray(personaIds) && personaIds.length > 0) {
      personaIdNums = personaIds.map(id => typeof id === 'number' ? id : parseInt(String(id), 10)).filter(id => !isNaN(id))
    }

    const { payload, user: payloadUser } = await getPayloadUser(clerkUser)

    if (!payloadUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Verify all bots exist
    for (const bId of botIdNums) {
      const bot = await payload.findByID({
        collection: 'bot',
        id: bId,
      })
      if (!bot) {
        return NextResponse.json(
          { success: false, message: `Bot not found: ${bId}` },
          { status: 404 }
        )
      }
    }

    // Validate type if provided
    const validTypes = ['short_term', 'long_term', 'consolidated'] as const
    type MemoryType = 'short_term' | 'long_term' | 'consolidated'
    const memoryType: MemoryType = type && validTypes.includes(type as MemoryType)
      ? (type as MemoryType)
      : 'short_term'

    // Validate importance if provided
    let memoryImportance = 5
    if (importance !== undefined && typeof importance === 'number') {
      if (importance >= 1 && importance <= 10) {
        memoryImportance = importance
      }
    }

    // Create memory
    const conversationIdNum = conversationId
      ? (typeof conversationId === 'number' ? conversationId : parseInt(String(conversationId), 10))
      : null

    const memory = await payload.create({
      collection: 'memory',
      data: {
        user: payloadUser.id,
        bot: botIdNums, // Array of bot IDs
        persona: personaIdNums.length > 0 ? personaIdNums : undefined, // Array of persona IDs (optional)
        entry: entry.trim(),
        type: memoryType,
        importance: memoryImportance,
        emotional_context: emotional_context || null,
        conversation: conversationIdNum,
        created_timestamp: new Date().toISOString(),
        modified_timestamp: new Date().toISOString(),
        is_vectorized: false,
        converted_to_lore: false,
      },
      depth: 2,
    })

    return NextResponse.json({
      success: true,
      memory,
      message: 'Memory created successfully',
    })
  } catch (error) {
    console.error('Create memory error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create memory' },
      { status: 500 }
    )
  }
}
