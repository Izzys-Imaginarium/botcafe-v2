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
        { message: 'Not authorized to update this conversation' },
        { status: 403 }
      )
    }

    const body = await request.json() as {
      title?: string
      status?: string
      addBotId?: number
      removeBotId?: number
      personaId?: number | null
      settings?: Record<string, unknown>
    }
    const { title, status, addBotId, removeBotId, personaId, settings } = body

    const updateData: Record<string, unknown> = {
      modified_timestamp: new Date().toISOString(),
    }

    // Update title
    if (title !== undefined) {
      updateData.title = title || null // Allow clearing the title
    }

    // Update status
    if (status) {
      updateData.status = status
    }

    // Add bot
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

      // Verify user has access to this bot (public, owned, or shared)
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

      const currentBots = conversation.bot_participation || []
      const alreadyInConvo = currentBots.some(
        (bp) =>
          (typeof bp.bot_id === 'object' ? bp.bot_id.id : bp.bot_id) === addBotId
      )

      if (!alreadyInConvo) {
        updateData.bot_participation = [
          ...currentBots,
          {
            bot_id: addBotId,
            role: 'secondary',
            is_active: true,
            joined_at: new Date().toISOString(),
          },
        ]

        // Update conversation type if going from single to multi
        if (currentBots.length === 1) {
          updateData.conversation_type = 'multi-bot'
        }

        // Update participants
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

    // Remove bot
    if (removeBotId) {
      const currentBots = conversation.bot_participation || []

      if (currentBots.length <= 1) {
        return NextResponse.json(
          { message: 'Cannot remove the last bot from conversation' },
          { status: 400 }
        )
      }

      updateData.bot_participation = currentBots.filter(
        (bp) =>
          (typeof bp.bot_id === 'object' ? bp.bot_id.id : bp.bot_id) !== removeBotId
      )

      // Update conversation type if going from multi to single
      if (currentBots.length === 2) {
        updateData.conversation_type = 'single-bot'
      }

      // Update participants
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

    // Delete all messages in conversation
    await payload.delete({
      collection: 'message',
      where: {
        conversation: { equals: parseInt(id) },
      },
      overrideAccess: true,
    })

    // Delete conversation
    await payload.delete({
      collection: 'conversation',
      id: parseInt(id),
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
