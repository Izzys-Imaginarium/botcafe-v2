/**
 * Chat Send Message API
 *
 * POST - Send a message and initiate LLM response
 *
 * This endpoint:
 * 1. Creates the user's message
 * 2. Creates a placeholder for the bot's response
 * 3. Returns both message IDs so the client can connect to the stream
 */

import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

// POST /api/chat/send - Send a message
export async function POST(request: NextRequest) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json(
        { message: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

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
      conversationId?: number
      content?: string
      apiKeyId?: number
      model?: string
      targetBotId?: number
      personaId?: number | null // Which persona is speaking (null = user themselves)
    }
    const {
      conversationId,
      content,
      apiKeyId,
      model,
      targetBotId, // For multi-bot - which bot should respond
      personaId, // Which persona the user is acting as (null/undefined = themselves)
    } = body

    if (!conversationId || !content) {
      return NextResponse.json(
        { message: 'Conversation ID and content are required' },
        { status: 400 }
      )
    }

    // Verify conversation exists and user owns it
    const conversation = await payload.findByID({
      collection: 'conversation',
      id: conversationId,
      depth: 2,
      overrideAccess: true,
    })

    if (!conversation) {
      return NextResponse.json(
        { message: 'Conversation not found' },
        { status: 404 }
      )
    }

    const conversationUserId = typeof conversation.user === 'object'
      ? conversation.user.id
      : conversation.user

    if (conversationUserId !== payloadUser.id) {
      return NextResponse.json(
        { message: 'Not authorized to send messages in this conversation' },
        { status: 403 }
      )
    }

    // Track persona changes - users can switch personas mid-conversation
    const currentParticipants = (conversation.participants || {}) as {
      personas?: string[]
      bots?: string[]
      primary_persona?: string
      persona_changes?: Array<{ personaId: string; timestamp: string }>
    }

    let updatedParticipants = { ...currentParticipants }

    if (personaId) {
      // Verify persona exists and belongs to user
      const persona = await payload.findByID({
        collection: 'personas',
        id: personaId,
        overrideAccess: true,
      })

      if (!persona) {
        return NextResponse.json(
          { message: 'Persona not found' },
          { status: 404 }
        )
      }

      const personaUserId = typeof persona.user === 'object' ? persona.user.id : persona.user
      if (personaUserId !== payloadUser.id) {
        return NextResponse.json(
          { message: 'Not authorized to use this persona' },
          { status: 403 }
        )
      }

      const personaIdStr = String(personaId)

      // Add to personas array if not already present
      if (!updatedParticipants.personas) {
        updatedParticipants.personas = []
      }
      if (!updatedParticipants.personas.includes(personaIdStr)) {
        updatedParticipants.personas = [...updatedParticipants.personas, personaIdStr]
      }

      // Track persona change if different from current primary
      if (updatedParticipants.primary_persona !== personaIdStr) {
        if (!updatedParticipants.persona_changes) {
          updatedParticipants.persona_changes = []
        }
        updatedParticipants.persona_changes = [
          ...updatedParticipants.persona_changes,
          { personaId: personaIdStr, timestamp: new Date().toISOString() }
        ]
        updatedParticipants.primary_persona = personaIdStr
      }
    } else {
      // User is speaking as themselves (no persona)
      if (updatedParticipants.primary_persona) {
        // Track the switch back to no persona
        if (!updatedParticipants.persona_changes) {
          updatedParticipants.persona_changes = []
        }
        updatedParticipants.persona_changes = [
          ...updatedParticipants.persona_changes,
          { personaId: 'self', timestamp: new Date().toISOString() }
        ]
        updatedParticipants.primary_persona = undefined
      }
    }

    // Verify API key if provided
    let apiKey = null
    if (apiKeyId) {
      const apiKeys = await payload.find({
        collection: 'api-key',
        where: {
          id: { equals: apiKeyId },
          user: { equals: payloadUser.id },
          'security_features.is_active': { equals: true },
        },
        limit: 1,
        overrideAccess: true,
      })

      if (apiKeys.docs.length === 0) {
        return NextResponse.json(
          { message: 'API key not found or inactive' },
          { status: 404 }
        )
      }

      apiKey = apiKeys.docs[0]
    } else {
      // Try to find a default active API key
      const apiKeys = await payload.find({
        collection: 'api-key',
        where: {
          user: { equals: payloadUser.id },
          'security_features.is_active': { equals: true },
        },
        limit: 1,
        sort: '-createdAt',
        overrideAccess: true,
      })

      if (apiKeys.docs.length > 0) {
        apiKey = apiKeys.docs[0]
      }
    }

    if (!apiKey) {
      return NextResponse.json(
        { message: 'No active API key found. Please add an API key in your account settings.' },
        { status: 400 }
      )
    }

    // Determine which bot should respond
    const botParticipants = conversation.bot_participation || []
    let respondingBot = null

    if (targetBotId) {
      // Find specific bot - convert to numbers for reliable comparison
      const targetId = Number(targetBotId)
      const botParticipant = botParticipants.find((bp) => {
        const participantBotId = typeof bp.bot_id === 'object'
          ? Number(bp.bot_id.id)
          : Number(bp.bot_id)
        return participantBotId === targetId
      })
      if (botParticipant) {
        respondingBot = typeof botParticipant.bot_id === 'object'
          ? botParticipant.bot_id
          : await payload.findByID({
              collection: 'bot',
              id: botParticipant.bot_id as number,
              overrideAccess: true,
            })
      }
    } else {
      // Get primary bot
      const primaryParticipant = botParticipants.find(
        (bp) => bp.role === 'primary'
      ) || botParticipants[0]

      if (primaryParticipant) {
        respondingBot = typeof primaryParticipant.bot_id === 'object'
          ? primaryParticipant.bot_id
          : await payload.findByID({
              collection: 'bot',
              id: primaryParticipant.bot_id as number,
              overrideAccess: true,
            })
      }
    }

    if (!respondingBot) {
      return NextResponse.json(
        { message: 'No bot available to respond' },
        { status: 400 }
      )
    }

    // Estimate tokens for user message (rough estimate)
    const estimatedTokens = Math.ceil(content.length / 4)

    // Create user message (with persona if acting as one)
    const userMessage = await payload.create({
      collection: 'message',
      data: {
        user: payloadUser.id,
        conversation: conversationId,
        message_type: 'text',
        entry: content,
        message_attribution: {
          is_ai_generated: false,
          persona_id: personaId || undefined, // Track which persona sent this message
        },
        token_tracking: {
          input_tokens: estimatedTokens,
          output_tokens: 0,
          total_tokens: estimatedTokens,
        },
        byo_key: true,
        message_status: {
          delivery_status: 'sent',
        },
      },
      overrideAccess: true,
    })

    // Create placeholder for bot response (will be updated by stream)
    const botMessage = await payload.create({
      collection: 'message',
      data: {
        user: payloadUser.id,
        conversation: conversationId,
        bot: respondingBot.id,
        message_type: 'text',
        entry: '...', // Placeholder - will be filled by streaming
        message_attribution: {
          source_bot_id: respondingBot.id,
          is_ai_generated: true,
          model_used: model || null,
        },
        token_tracking: {
          input_tokens: 0,
          output_tokens: 0,
          total_tokens: 0,
        },
        byo_key: true,
        message_status: {
          delivery_status: 'sent', // Will update to 'delivered' when complete
        },
      },
      overrideAccess: true,
    })

    // Update conversation metadata and participants
    const currentMessageCount = conversation.conversation_metadata?.total_messages || 0
    await payload.update({
      collection: 'conversation',
      id: conversationId,
      data: {
        modified_timestamp: new Date().toISOString(),
        participants: updatedParticipants, // Updated with new persona if changed
        conversation_metadata: {
          ...conversation.conversation_metadata,
          total_messages: currentMessageCount + 2,
          last_activity: new Date().toISOString(),
        },
      },
      overrideAccess: true,
    })

    // Return message IDs for streaming
    return NextResponse.json({
      success: true,
      userMessageId: userMessage.id,
      botMessageId: botMessage.id,
      conversationId,
      bot: {
        id: respondingBot.id,
        name: respondingBot.name,
        picture: respondingBot.picture,
      },
      provider: apiKey.provider,
      model: model || null,
      // Stream URL for client to connect
      streamUrl: `/api/chat/stream/${botMessage.id}?apiKeyId=${apiKey.id}${model ? `&model=${model}` : ''}`,
    })
  } catch (error: unknown) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to send message' },
      { status: 500 }
    )
  }
}
