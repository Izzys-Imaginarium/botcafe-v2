import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

/**
 * Helper to parse memory ID - supports both numeric IDs (Memory collection)
 * and lore-XXX IDs (Knowledge collection for memories in tomes)
 */
function parseMemoryId(id: string): { collection: 'memory' | 'knowledge'; numericId: number } | null {
  if (id.startsWith('lore-')) {
    const numericId = parseInt(id.replace('lore-', ''), 10)
    if (isNaN(numericId)) return null
    return { collection: 'knowledge', numericId }
  }
  const numericId = parseInt(id, 10)
  if (isNaN(numericId)) return null
  return { collection: 'memory', numericId }
}

/**
 * GET /api/memories/[id]
 * Fetch a single memory by ID
 * Supports both Memory collection IDs and lore-XXX Knowledge IDs
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const parsed = parseMemoryId(id)
    if (!parsed) {
      return NextResponse.json(
        { success: false, message: 'Invalid memory ID' },
        { status: 400 }
      )
    }

    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Find user in Payload
    const users = await payload.find({
      collection: 'users',
      where: {
        email: { equals: clerkUser.emailAddresses[0]?.emailAddress },
      },
    })

    if (users.docs.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    const payloadUser = users.docs[0]

    // Fetch from appropriate collection
    const memory = await payload.findByID({
      collection: parsed.collection,
      id: parsed.numericId,
      depth: 2,
    })

    if (!memory) {
      return NextResponse.json(
        { success: false, message: 'Memory not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    const memoryUserId = typeof memory.user === 'object' ? memory.user.id : memory.user
    if (memoryUserId !== payloadUser.id) {
      return NextResponse.json(
        { success: false, message: 'Not authorized' },
        { status: 403 }
      )
    }

    return NextResponse.json({ success: true, memory })
  } catch (error) {
    console.error('Fetch memory error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch memory' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/memories/[id]
 * Update a memory
 * Supports both Memory collection IDs and lore-XXX Knowledge IDs
 *
 * Body:
 * - entry?: string - Memory content
 * - type?: 'short_term' | 'long_term' | 'consolidated'
 * - importance?: number (1-10)
 * - emotional_context?: string
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const parsed = parseMemoryId(id)
    if (!parsed) {
      return NextResponse.json(
        { success: false, message: 'Invalid memory ID' },
        { status: 400 }
      )
    }

    const body = await request.json() as {
      entry?: string
      type?: string
      importance?: number
      emotional_context?: string
    }
    const { entry, type, importance, emotional_context } = body

    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Find user in Payload
    const users = await payload.find({
      collection: 'users',
      where: {
        email: { equals: clerkUser.emailAddresses[0]?.emailAddress },
      },
    })

    if (users.docs.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    const payloadUser = users.docs[0]

    // Fetch existing memory to verify ownership
    const existingMemory = await payload.findByID({
      collection: parsed.collection,
      id: parsed.numericId,
    })

    if (!existingMemory) {
      return NextResponse.json(
        { success: false, message: 'Memory not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    const memoryUserId = typeof existingMemory.user === 'object'
      ? existingMemory.user.id
      : existingMemory.user
    if (memoryUserId !== payloadUser.id) {
      return NextResponse.json(
        { success: false, message: 'Not authorized' },
        { status: 403 }
      )
    }

    // Handle Knowledge collection (memories in tomes)
    if (parsed.collection === 'knowledge') {
      const updateData: Record<string, unknown> = {
        modified_timestamp: new Date().toISOString(),
      }

      if (entry !== undefined) {
        updateData.entry = entry
      }

      // For Knowledge entries, update tags for importance/type/emotional_context
      if (importance !== undefined || type !== undefined || emotional_context !== undefined) {
        // Get existing tags and filter out the ones we're updating
        const existingTags = (existingMemory as any).tags || []
        const filteredTags = existingTags.filter((t: { tag?: string }) => {
          if (!t.tag) return true
          if (importance !== undefined && t.tag.startsWith('importance-')) return false
          if (type !== undefined && t.tag.startsWith('memory-type-')) return false
          if (emotional_context !== undefined && t.tag.startsWith('mood-')) return false
          return true
        })

        // Add new tags
        const newTags = [...filteredTags]
        if (importance !== undefined) {
          if (typeof importance !== 'number' || importance < 1 || importance > 10) {
            return NextResponse.json(
              { success: false, message: 'Importance must be between 1 and 10' },
              { status: 400 }
            )
          }
          newTags.push({ tag: `importance-${importance}` })
        }
        if (type !== undefined) {
          if (!['short_term', 'long_term', 'consolidated'].includes(type)) {
            return NextResponse.json(
              { success: false, message: 'Invalid memory type' },
              { status: 400 }
            )
          }
          newTags.push({ tag: `memory-type-${type}` })
        }
        if (emotional_context !== undefined && emotional_context) {
          newTags.push({ tag: `mood-${emotional_context}` })
        }

        updateData.tags = newTags
      }

      const updatedKnowledge = await payload.update({
        collection: 'knowledge',
        id: parsed.numericId,
        data: updateData,
        depth: 2,
      })

      return NextResponse.json({
        success: true,
        memory: updatedKnowledge,
        message: 'Memory updated successfully',
      })
    }

    // Handle Memory collection (legacy)
    const updateData: Record<string, unknown> = {
      modified_timestamp: new Date().toISOString(),
    }

    if (entry !== undefined) {
      updateData.entry = entry
    }

    if (type !== undefined) {
      if (!['short_term', 'long_term', 'consolidated'].includes(type)) {
        return NextResponse.json(
          { success: false, message: 'Invalid memory type' },
          { status: 400 }
        )
      }
      updateData.type = type
    }

    if (importance !== undefined) {
      if (typeof importance !== 'number' || importance < 1 || importance > 10) {
        return NextResponse.json(
          { success: false, message: 'Importance must be between 1 and 10' },
          { status: 400 }
        )
      }
      updateData.importance = importance
    }

    if (emotional_context !== undefined) {
      updateData.emotional_context = emotional_context
    }

    // Update memory
    const updatedMemory = await payload.update({
      collection: 'memory',
      id: parsed.numericId,
      data: updateData,
      depth: 2,
    })

    return NextResponse.json({
      success: true,
      memory: updatedMemory,
      message: 'Memory updated successfully',
    })
  } catch (error) {
    console.error('Update memory error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update memory' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/memories/[id]
 * Delete a memory and its associated vector records
 * Supports both Memory collection IDs and lore-XXX Knowledge IDs
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const parsed = parseMemoryId(id)
    if (!parsed) {
      return NextResponse.json(
        { success: false, message: 'Invalid memory ID' },
        { status: 400 }
      )
    }

    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Find user in Payload
    const users = await payload.find({
      collection: 'users',
      where: {
        email: { equals: clerkUser.emailAddresses[0]?.emailAddress },
      },
    })

    if (users.docs.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    const payloadUser = users.docs[0]

    // Fetch existing memory to verify ownership
    const existingMemory = await payload.findByID({
      collection: parsed.collection,
      id: parsed.numericId,
      depth: 1,
    })

    if (!existingMemory) {
      return NextResponse.json(
        { success: false, message: 'Memory not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    const memoryUserId = typeof existingMemory.user === 'object'
      ? existingMemory.user.id
      : existingMemory.user
    if (memoryUserId !== payloadUser.id) {
      return NextResponse.json(
        { success: false, message: 'Not authorized' },
        { status: 403 }
      )
    }

    // Delete associated vector records if any
    const vectorRecords = (existingMemory as any).vector_records
    const isVectorized = (existingMemory as any).is_vectorized
    if (isVectorized && vectorRecords) {
      const vectorRecordIds = Array.isArray(vectorRecords)
        ? vectorRecords.map((vr: { id: number } | number) =>
            typeof vr === 'object' ? vr.id : vr
          )
        : []

      for (const vrId of vectorRecordIds) {
        try {
          await payload.delete({
            collection: 'vectorRecords',
            id: vrId,
          })
        } catch (e) {
          console.warn(`Failed to delete vector record ${vrId}:`, e)
        }
      }
    }

    // Clean up FK constraints before deletion using D1 SQL directly
    // SQLite CASCADE doesn't work reliably in D1, so we delete explicitly
    const d1 = (payload.db as any).client as D1Database

    if (d1 && parsed.collection === 'memory') {
      const tables = [
        // Optional FK: knowledge.source_memory_id -> nullify
        { name: 'knowledge (nullify source_memory_id)', sql: 'UPDATE knowledge SET source_memory_id_id = NULL WHERE source_memory_id_id = ?' },
        // Clean up locked documents
        { name: 'payload_locked_documents_rels', sql: 'DELETE FROM payload_locked_documents_rels WHERE memory_id = ?' },
        // Own _rels table
        { name: 'memory_rels', sql: 'DELETE FROM memory_rels WHERE parent_id = ?' },
      ]

      for (const table of tables) {
        try {
          const result = await d1.prepare(table.sql).bind(parsed.numericId).run()
          console.log(`[Memory Delete ${parsed.numericId}] ${table.name}: OK, rows affected:`, result.meta?.changes ?? 'unknown')
        } catch (e: any) {
          console.error(`[Memory Delete ${parsed.numericId}] ${table.name}: FAILED -`, e.message || e)
        }
      }
    }

    // Delete the memory from appropriate collection
    await payload.delete({
      collection: parsed.collection,
      id: parsed.numericId,
    })

    return NextResponse.json({
      success: true,
      message: 'Memory deleted successfully',
    })
  } catch (error) {
    console.error('Delete memory error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete memory' },
      { status: 500 }
    )
  }
}
