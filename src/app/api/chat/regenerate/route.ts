/**
 * Chat Regenerate Message API
 *
 * POST - Regenerate an AI response
 *
 * This endpoint:
 * 1. Finds the original AI message
 * 2. Deletes it from the database
 * 3. Creates a new placeholder for the regenerated response
 * 4. Returns the stream URL for the client to connect
 */

import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

// POST /api/chat/regenerate - Regenerate an AI message
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
      messageId?: number
      apiKeyId?: number
      model?: string
    }
    const { messageId, apiKeyId, model } = body

    if (!messageId) {
      return NextResponse.json(
        { message: 'Message ID is required' },
        { status: 400 }
      )
    }

    // Find the original AI message
    const originalMessage = await payload.findByID({
      collection: 'message',
      id: messageId,
      depth: 2,
      overrideAccess: true,
    })

    if (!originalMessage) {
      return NextResponse.json(
        { message: 'Message not found' },
        { status: 404 }
      )
    }

    // Verify it's an AI message
    if (!originalMessage.message_attribution?.is_ai_generated) {
      return NextResponse.json(
        { message: 'Can only regenerate AI messages' },
        { status: 400 }
      )
    }

    // Get conversation and verify ownership
    const conversationId = typeof originalMessage.conversation === 'object'
      ? originalMessage.conversation.id
      : originalMessage.conversation

    const conversation = await payload.findByID({
      collection: 'conversation',
      id: conversationId as number,
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
        { message: 'Not authorized to regenerate messages in this conversation' },
        { status: 403 }
      )
    }

    // Get the bot from the original message
    const botId = typeof originalMessage.bot === 'object'
      ? originalMessage.bot.id
      : originalMessage.bot

    if (!botId) {
      return NextResponse.json(
        { message: 'Original message has no associated bot' },
        { status: 400 }
      )
    }

    const bot = typeof originalMessage.bot === 'object'
      ? originalMessage.bot
      : await payload.findByID({
          collection: 'bot',
          id: botId,
          overrideAccess: true,
        })

    if (!bot) {
      return NextResponse.json(
        { message: 'Bot not found' },
        { status: 404 }
      )
    }

    // Verify API key
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

    // Delete the old AI message
    await payload.delete({
      collection: 'message',
      id: messageId,
      overrideAccess: true,
    })

    // Create new placeholder for bot response
    const newBotMessage = await payload.create({
      collection: 'message',
      data: {
        user: payloadUser.id,
        conversation: conversationId,
        bot: bot.id,
        message_type: 'text',
        entry: '...', // Placeholder - will be filled by streaming
        message_attribution: {
          source_bot_id: bot.id,
          is_ai_generated: true,
          model_used: model || originalMessage.message_attribution?.model_used || null,
        },
        token_tracking: {
          input_tokens: 0,
          output_tokens: 0,
          total_tokens: 0,
        },
        byo_key: true,
        message_status: {
          delivery_status: 'sent',
        },
      },
      overrideAccess: true,
    })

    // Update conversation last activity
    await payload.update({
      collection: 'conversation',
      id: conversationId as number,
      data: {
        modified_timestamp: new Date().toISOString(),
        conversation_metadata: {
          ...conversation.conversation_metadata,
          last_activity: new Date().toISOString(),
        },
      },
      overrideAccess: true,
    })

    const selectedModel = model || originalMessage.message_attribution?.model_used || null

    // Return new message ID for streaming
    return NextResponse.json({
      success: true,
      botMessageId: newBotMessage.id,
      conversationId,
      bot: {
        id: bot.id,
        name: bot.name,
        picture: bot.picture,
      },
      provider: apiKey.provider,
      model: selectedModel,
      streamUrl: `/api/chat/stream/${newBotMessage.id}?apiKeyId=${apiKey.id}${selectedModel ? `&model=${selectedModel}` : ''}`,
    })
  } catch (error: unknown) {
    console.error('Error regenerating message:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to regenerate message' },
      { status: 500 }
    )
  }
}
