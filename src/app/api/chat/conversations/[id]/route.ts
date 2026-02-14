/**
 * Single Conversation API
 *
 * GET - Get conversation details
 * PATCH - Update conversation (status, settings, add/remove bots)
 * DELETE - Delete conversation
 */

import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { checkResourceAccess } from '@/lib/permissions/check-access'

export const dynamic = 'force-dynamic'

// GET /api/chat/conversations/[id] - Get conversation details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json(
        { message: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    const { id } = await params
    const payload = await getPayload({ config })

    // Find Payload user
    const payloadUsers = await payload.find({
      collection: 'users',
      where: {
        email: { equals: clerkUser.emailAddresses[0]?.emailAddress },
      },
      limit: 1,
      overrideAccess: true,
    })

    if (payloadUsers.docs.length === 0) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    const payloadUser = payloadUsers.docs[0]

    // Fetch conversation
    const conversation = await payload.findByID({
      collection: 'conversation',
      id: parseInt(id),
      depth: 2,
      overrideAccess: true,
    })

    if (!conversation) {
      return NextResponse.json(
        { message: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    const conversationUserId = typeof conversation.user === 'object'
      ? conversation.user.id
      : conversation.user

    if (conversationUserId !== payloadUser.id) {
      return NextResponse.json(
        { message: 'Not authorized to access this conversation' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        title: (conversation as any).title || null,
        type: conversation.conversation_type,
        status: conversation.status,
        createdAt: conversation.created_timestamp,
        modifiedAt: conversation.modified_timestamp,
        lastActivity: conversation.conversation_metadata?.last_activity,
        messageCount: conversation.conversation_metadata?.total_messages || 0,
        summary: conversation.conversation_metadata?.conversation_summary,
        participants: conversation.participants,
        bots: conversation.bot_participation?.map((bp) => ({
          bot: bp.bot_id,
          role: bp.role,
          isActive: bp.is_active,
          joinedAt: bp.joined_at,
        })) || [],
        totalTokens: conversation.total_tokens || 0,
        lastSummarizedAt: conversation.last_summarized_at,
        requiresSummarization: conversation.requires_summarization,
        settings: conversation.conversation_settings,
        tags: conversation.conversation_metadata?.tags || [],
      },
    })
  } catch (error: unknown) {
    console.error('Error fetching conversation:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch conversation' },
      { status: 500 }
    )
  }
}

// Helper: Build bot_participation update data from fresh conversation state
function buildBotParticipationUpdate(
  conversation: Record<string, any>,
  addBotId?: number,
  removeBotId?: number,
): Record<string, unknown> | null {
  const updateData: Record<string, unknown> = {}

  if (addBotId) {
    const currentBots = conversation.bot_participation || []
    const alreadyInConvo = currentBots.some(
      (bp: any) =>
        (typeof bp.bot_id === 'object' ? bp.bot_id.id : bp.bot_id) === addBotId
    )

    if (!alreadyInConvo) {
      const normalizedCurrentBots = currentBots.map((bp: any) => {
        const normalized: Record<string, unknown> = {
          bot_id: typeof bp.bot_id === 'object' ? bp.bot_id.id : bp.bot_id,
          role: bp.role,
          is_active: bp.is_active,
          joined_at: bp.joined_at,
        }
        if (bp.id) {
          normalized.id = bp.id
        }
        return normalized
      })

      updateData.bot_participation = [
        ...normalizedCurrentBots,
        {
          bot_id: addBotId,
          role: 'secondary',
          is_active: true,
          joined_at: new Date().toISOString(),
        },
      ]

      if (currentBots.length === 1) {
        updateData.conversation_type = 'multi-bot'
      }

      const participants = (conversation.participants || { bots: [], personas: [] }) as {
        bots?: string[]
        personas?: string[]
        primary_persona?: string
        persona_changes?: unknown[]
      }
      updateData.participants = {
        ...participants,
        bots: [...(participants.bots || []), String(addBotId)],
      }
    }
  }

  if (removeBotId) {
    const currentBots = conversation.bot_participation || []

    if (currentBots.length <= 1) {
      return null // Signal that removal is invalid
    }

    updateData.bot_participation = currentBots
      .filter(
        (bp: any) =>
          (typeof bp.bot_id === 'object' ? bp.bot_id.id : bp.bot_id) !== removeBotId
      )
      .map((bp: any) => {
        const normalized: Record<string, unknown> = {
          bot_id: typeof bp.bot_id === 'object' ? bp.bot_id.id : bp.bot_id,
          role: bp.role,
          is_active: bp.is_active,
          joined_at: bp.joined_at,
        }
        if (bp.id) {
          normalized.id = bp.id
        }
        return normalized
      })

    if (currentBots.length === 2) {
      updateData.conversation_type = 'single-bot'
    }

    const participants = (conversation.participants || { bots: [], personas: [] }) as {
      bots?: string[]
      personas?: string[]
      primary_persona?: string
      persona_changes?: unknown[]
    }
    updateData.participants = {
      ...participants,
      bots: (participants.bots || []).filter((id: string) => id !== String(removeBotId)),
    }
  }

  return updateData
}

// PATCH /api/chat/conversations/[id] - Update conversation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json(
        { message: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    const { id } = await params
    const payload = await getPayload({ config })

    // Find Payload user
    const payloadUsers = await payload.find({
      collection: 'users',
      where: {
        email: { equals: clerkUser.emailAddresses[0]?.emailAddress },
      },
      limit: 1,
      overrideAccess: true,
    })

    if (payloadUsers.docs.length === 0) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    const payloadUser = payloadUsers.docs[0]

    const body = await request.json() as {
      title?: string
      status?: string
      addBotId?: number
      removeBotId?: number
      personaId?: number | null
      settings?: Record<string, unknown>
    }
    const { title, status, addBotId, removeBotId, personaId, settings } = body

    // Validate bot access upfront (doesn't depend on conversation state)
    if (addBotId) {
      const bot = await payload.findByID({
        collection: 'bot',
        id: addBotId,
        overrideAccess: true,
      })

      if (!bot) {
        return NextResponse.json(
          { message: 'Bot not found' },
          { status: 404 }
        )
      }

      const accessResult = await checkResourceAccess(
        payload,
        payloadUser.id,
        'bot',
        addBotId
      )

      if (!accessResult.hasAccess) {
        return NextResponse.json(
          { message: `You do not have access to the bot "${bot.name}"` },
          { status: 403 }
        )
      }
    }

    // Retry loop to handle concurrent update conflicts on bot_participation.
    // Payload's D1 adapter deletes and re-inserts array rows on update.
    // Concurrent updates can race, causing UNIQUE constraint errors on the array id.
    // Retrying with fresh conversation state resolves this.
    const MAX_RETRIES = 3
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        // Fetch conversation (re-read on each retry to get fresh state)
        const conversation = await payload.findByID({
          collection: 'conversation',
          id: parseInt(id),
          overrideAccess: true,
        })

        if (!conversation) {
          return NextResponse.json(
            { message: 'Conversation not found' },
            { status: 404 }
          )
        }

        // Verify ownership
        if (attempt === 0) {
          const conversationUserId = typeof conversation.user === 'object'
            ? conversation.user.id
            : conversation.user

          if (conversationUserId !== payloadUser.id) {
            return NextResponse.json(
              { message: 'Not authorized to update this conversation' },
              { status: 403 }
            )
          }
        }

        const updateData: Record<string, unknown> = {
          modified_timestamp: new Date().toISOString(),
        }

        // Update title
        if (title !== undefined) {
          updateData.title = title || null
        }

        // Update status
        if (status) {
          updateData.status = status
        }

        // Build bot_participation changes from fresh conversation state
        if (addBotId || removeBotId) {
          const botUpdate = buildBotParticipationUpdate(conversation, addBotId, removeBotId)
          if (botUpdate === null) {
            // removeBotId on last bot
            return NextResponse.json(
              { message: 'Cannot remove the last bot from conversation' },
              { status: 400 }
            )
          }
          Object.assign(updateData, botUpdate)
        }

        // Switch persona
        if (personaId !== undefined) {
          const participants = (conversation.participants || { bots: [], personas: [], persona_changes: [] }) as {
            bots?: string[]
            personas?: string[]
            primary_persona?: string
            persona_changes?: unknown[]
          }
          const messageCount = conversation.conversation_metadata?.total_messages || 0

          updateData.participants = {
            ...participants,
            ...(updateData.participants as object || {}),
            primary_persona: personaId ? String(personaId) : undefined,
            personas: personaId && !participants.personas?.includes(String(personaId))
              ? [...(participants.personas || []), String(personaId)]
              : participants.personas,
            persona_changes: [
              ...(participants.persona_changes || []),
              {
                persona_id: personaId ? String(personaId) : null,
                switched_at: new Date().toISOString(),
                message_index: messageCount,
              },
            ],
          }
        }

        // Update settings
        if (settings) {
          updateData.conversation_settings = {
            ...conversation.conversation_settings,
            ...settings,
          }
        }

        // Perform update
        const updated = await payload.update({
          collection: 'conversation',
          id: parseInt(id),
          data: updateData,
          depth: 2,
          overrideAccess: true,
        })

        return NextResponse.json({
          success: true,
          conversation: {
            id: updated.id,
            title: (updated as any).title || null,
            type: updated.conversation_type,
            status: updated.status,
            bots: updated.bot_participation?.map((bp) => ({
              bot: bp.bot_id,
              role: bp.role,
              isActive: bp.is_active,
            })) || [],
            participants: updated.participants,
          },
        })
      } catch (error: unknown) {
        const isConstraintError = error instanceof Error &&
          error.message?.includes('SQLITE_CONSTRAINT') &&
          error.message?.includes('conversation_bot_participation')

        if (isConstraintError && attempt < MAX_RETRIES - 1) {
          console.warn(`Retrying conversation ${id} update (attempt ${attempt + 2}/${MAX_RETRIES}) due to bot_participation constraint conflict`)
          continue
        }
        throw error
      }
    }

    // Should never reach here
    throw new Error('Max retries exceeded for conversation update')
  } catch (error: unknown) {
    console.error('Error updating conversation:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to update conversation' },
      { status: 500 }
    )
  }
}

// DELETE /api/chat/conversations/[id] - Delete conversation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json(
        { message: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    const { id } = await params
    const payload = await getPayload({ config })

    // Find Payload user
    const payloadUsers = await payload.find({
      collection: 'users',
      where: {
        email: { equals: clerkUser.emailAddresses[0]?.emailAddress },
      },
      limit: 1,
      overrideAccess: true,
    })

    if (payloadUsers.docs.length === 0) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    const payloadUser = payloadUsers.docs[0]

    // Fetch conversation
    const conversation = await payload.findByID({
      collection: 'conversation',
      id: parseInt(id),
      overrideAccess: true,
    })

    if (!conversation) {
      return NextResponse.json(
        { message: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    const conversationUserId = typeof conversation.user === 'object'
      ? conversation.user.id
      : conversation.user

    if (conversationUserId !== payloadUser.id) {
      return NextResponse.json(
        { message: 'Not authorized to delete this conversation' },
        { status: 403 }
      )
    }

    const convId = parseInt(id)

    // Use direct D1 SQL for cascade cleanup to avoid loading all records into memory.
    // Payload's ORM loads every matching doc as a full object, which causes
    // "Worker exceeded memory limit" on conversations with many messages.
    const d1 = (payload.db as any).client as D1Database

    if (!d1) {
      console.error(`[Conversation Delete ${convId}] D1 client not available, falling back to Payload`)
      // Minimal fallback - just delete conversation and let FK errors happen
      await payload.delete({ collection: 'conversation', id: convId, overrideAccess: true })
      return NextResponse.json({ success: true, message: 'Conversation deleted' })
    }

    // 1. Delete records that have no value without the conversation
    const deleteOps = [
      { name: 'message', sql: 'DELETE FROM message WHERE conversation_id = ?' },
      { name: 'knowledge_activation_log', sql: 'DELETE FROM knowledge_activation_log WHERE conversation_id_id = ?' },
      { name: 'memory', sql: 'DELETE FROM memory WHERE conversation_id = ?' },
      { name: 'memory_insights', sql: 'DELETE FROM memory_insights WHERE conversation_id = ?' },
    ]

    for (const op of deleteOps) {
      try {
        const result = await d1.prepare(op.sql).bind(convId).run()
        console.log(`[Conversation Delete ${convId}] ${op.name}: OK, rows: ${result.meta?.changes ?? '?'}`)
      } catch (e: any) {
        console.error(`[Conversation Delete ${convId}] ${op.name}: FAILED -`, e.message || e)
      }
    }

    // 2. Unlink records that should be preserved (null out the conversation FK)
    const unlinkOps = [
      { name: 'knowledge', sql: 'UPDATE knowledge SET source_conversation_id_id = NULL WHERE source_conversation_id_id = ?' },
      { name: 'usage_analytics', sql: 'UPDATE usage_analytics SET resource_details_conversation_id_id = NULL WHERE resource_details_conversation_id_id = ?' },
    ]

    for (const op of unlinkOps) {
      try {
        const result = await d1.prepare(op.sql).bind(convId).run()
        console.log(`[Conversation Delete ${convId}] unlink ${op.name}: OK, rows: ${result.meta?.changes ?? '?'}`)
      } catch (e: any) {
        console.error(`[Conversation Delete ${convId}] unlink ${op.name}: FAILED -`, e.message || e)
      }
    }

    // 3. Clean up _rels tables and child tables
    const relOps = [
      { name: 'conversation_rels', sql: 'DELETE FROM conversation_rels WHERE parent_id = ?' },
      { name: 'conversation_bot_participation', sql: 'DELETE FROM conversation_bot_participation WHERE _parent_id = ?' },
      { name: 'payload_locked_documents_rels', sql: 'DELETE FROM payload_locked_documents_rels WHERE conversation_id = ?' },
    ]

    for (const op of relOps) {
      try {
        await d1.prepare(op.sql).bind(convId).run()
      } catch (e: any) {
        // These tables may not exist or have different column names - non-fatal
        console.warn(`[Conversation Delete ${convId}] ${op.name}: ${e.message || e}`)
      }
    }

    // 4. Delete the conversation itself
    // Use exec() with PRAGMA foreign_keys=OFF to bypass NOT NULL + SET NULL FK contradictions.
    // D1 doesn't honor PRAGMA via prepare().run() or batch() (ignored inside implicit transactions).
    // exec() runs raw SQL outside transaction context, same mechanism migrations use.
    try {
      await d1.exec(`PRAGMA foreign_keys = OFF; DELETE FROM conversation WHERE id = ${convId}; PRAGMA foreign_keys = ON;`)
      console.log(`[Conversation Delete ${convId}] Conversation deleted successfully via D1 exec (FK disabled)`)
    } catch (e: any) {
      console.error(`[Conversation Delete ${convId}] Final delete failed:`, e.message || e)
      // Fallback to Payload delete which will give a better error
      await payload.delete({ collection: 'conversation', id: convId, overrideAccess: true })
    }

    return NextResponse.json({
      success: true,
      message: 'Conversation deleted',
    })
  } catch (error: unknown) {
    console.error('Error deleting conversation:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to delete conversation' },
      { status: 500 }
    )
  }
}
