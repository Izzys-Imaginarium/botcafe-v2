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

    // Clean up all related records that have foreign keys to this conversation.
    // These must be cleaned up before the conversation itself to avoid FK constraint errors.
    // Each operation is wrapped in try/catch so a failure in one doesn't block the others.

    // 1. Delete records that have no value without the conversation
    const deleteOps = [
      payload.delete({
        collection: 'message',
        where: { conversation: { equals: convId } },
        overrideAccess: true,
      }).catch((e: unknown) => console.error('[Conversation Delete] Failed to delete messages:', e)),

      payload.delete({
        collection: 'knowledgeActivationLog',
        where: { conversation_id: { equals: convId } },
        overrideAccess: true,
      }).catch((e: unknown) => console.error('[Conversation Delete] Failed to delete activation logs:', e)),

      payload.delete({
        collection: 'memory',
        where: { conversation: { equals: convId } },
        overrideAccess: true,
      }).catch((e: unknown) => console.error('[Conversation Delete] Failed to delete memories:', e)),

      payload.delete({
        collection: 'memory-insights',
        where: { conversation: { equals: convId } },
        overrideAccess: true,
      }).catch((e: unknown) => console.error('[Conversation Delete] Failed to delete memory insights:', e)),
    ]

    await Promise.all(deleteOps)

    // 2. Unlink records that should be preserved (null out the conversation FK)
    const unlinkCollection = async (
      collection: string,
      field: string,
      label: string,
    ) => {
      try {
        const slug = collection as import('payload').CollectionSlug
        const linked = await payload.find({
          collection: slug,
          where: { [field]: { equals: convId } },
          limit: 500,
          overrideAccess: true,
        })
        if (linked.docs.length > 0) {
          await Promise.all(
            linked.docs.map((doc) =>
              payload.update({
                collection: slug,
                id: doc.id,
                data: { [field]: null } as any,
                overrideAccess: true,
              })
            )
          )
        }
      } catch (e: unknown) {
        console.error(`[Conversation Delete] Failed to unlink ${label}:`, e)
      }
    }

    await Promise.all([
      unlinkCollection('knowledge', 'source_conversation_id', 'knowledge entries'),
      unlinkCollection('usage-analytics', 'resource_details.conversation_id', 'usage analytics'),
    ])

    // 3. Delete the conversation itself
    await payload.delete({
      collection: 'conversation',
      id: convId,
      overrideAccess: true,
    })

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
