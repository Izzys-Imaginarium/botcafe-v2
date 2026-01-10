import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

/**
 * POST /api/memories/convert-to-lore
 *
 * Convert a memory entry into a permanent Knowledge (lore) entry.
 * This "promotes" an imported or conversation memory to permanent knowledge.
 *
 * Request body:
 * - memoryId: string (required) - ID of memory to convert
 * - collectionId: string (required) - Knowledge collection to add to
 * - tags?: string[] (optional tags for the knowledge entry)
 *
 * Response:
 * - success: boolean
 * - knowledge: Knowledge object (created lore entry)
 * - memory: Memory object (updated with conversion info)
 * - message: string
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

    // Get request body
    const body = (await request.json()) as {
      memoryId?: string
      collectionId?: string
      tags?: string[]
    }

    const { memoryId, collectionId, tags = [] } = body

    if (!memoryId) {
      return NextResponse.json(
        { success: false, message: 'memoryId is required' },
        { status: 400 }
      )
    }

    if (!collectionId) {
      return NextResponse.json(
        { success: false, message: 'collectionId is required' },
        { status: 400 }
      )
    }

    // Get Payload instance
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Find user in Payload
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

    const payloadUser = users.docs[0]

    // Fetch memory entry
    const memory = await payload.findByID({
      collection: 'memory',
      id: memoryId,
    })

    // Verify ownership
    if (typeof memory.user === 'object' && memory.user.id !== payloadUser.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: You do not own this memory' },
        { status: 403 }
      )
    }

    // Check if already converted
    if (memory.converted_to_lore) {
      return NextResponse.json(
        { success: false, message: 'Memory has already been converted to lore' },
        { status: 400 }
      )
    }

    // Verify collection exists and user owns it
    const collection = await payload.findByID({
      collection: 'knowledgeCollections',
      id: collectionId,
    })

    if (typeof collection.user === 'object' && collection.user.id !== payloadUser.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: You do not own this collection' },
        { status: 403 }
      )
    }

    // Extract bot IDs and persona IDs from memory participants
    const participants = memory.participants as { personas?: string[]; bots?: string[] } | null
    const botIds = participants?.bots || []
    const personaIds = participants?.personas || []

    // Create Knowledge entry from memory
    const knowledge = await payload.create({
      collection: 'knowledge',
      data: {
        user: payloadUser.id,
        entry: memory.entry,
        type: 'text', // Converted memories are text entries
        knowledge_collection: parseInt(collectionId, 10),
        tags: tags.map((tag) => ({ tag })),
        applies_to_bots: botIds.map((id) => parseInt(id, 10)),
        tokens: memory.tokens || 0,
        is_vectorized: false, // Will be vectorized separately if needed
        privacy_settings: {
          privacy_level: 'private',
          allow_sharing: true,
          access_count: 0,
        },
        // Hybrid activation system defaults
        activation_settings: {
          activation_mode: 'vector',
          vector_similarity_threshold: 0.7,
          max_vector_results: 5,
          probability: 100,
          use_probability: false,
          scan_depth: 2,
          match_in_user_messages: true,
          match_in_bot_messages: true,
          match_in_system_prompts: false,
        },
        positioning: {
          position: 'before_character',
          depth: 0,
          role: 'system',
          order: 100,
        },
      },
      overrideAccess: true,
    })

    // Update memory to mark it as converted
    const updatedMemory = await payload.update({
      collection: 'memory',
      id: memoryId,
      data: {
        converted_to_lore: true,
        lore_entry: knowledge.id,
        converted_at: new Date().toISOString(),
      },
      overrideAccess: true,
    })

    return NextResponse.json({
      success: true,
      knowledge: knowledge,
      memory: updatedMemory,
      message: 'Memory successfully converted to lore',
    })

  } catch (error: any) {
    console.error('Convert to lore error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to convert memory to lore' },
      { status: 500 }
    )
  }
}
