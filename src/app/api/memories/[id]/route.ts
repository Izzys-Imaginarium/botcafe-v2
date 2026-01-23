import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

/**
 * GET /api/memories/[id]
 * Fetch a single memory by ID
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
    const memoryId = parseInt(id, 10)
    if (isNaN(memoryId)) {
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

    // Fetch memory
    const memory = await payload.findByID({
      collection: 'memory',
      id: memoryId,
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
    const memoryId = parseInt(id, 10)
    if (isNaN(memoryId)) {
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
      collection: 'memory',
      id: memoryId,
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

    // Build update data
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
      id: memoryId,
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
    const memoryId = parseInt(id, 10)
    if (isNaN(memoryId)) {
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
      collection: 'memory',
      id: memoryId,
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
    if (existingMemory.is_vectorized && existingMemory.vector_records) {
      const vectorRecordIds = Array.isArray(existingMemory.vector_records)
        ? existingMemory.vector_records.map((vr: { id: number } | number) =>
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

    // Delete the memory
    await payload.delete({
      collection: 'memory',
      id: memoryId,
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
