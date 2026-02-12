/**
 * Conversation Messages API
 *
 * GET - Get messages for a conversation (paginated)
 * DELETE - Clear all messages in a conversation (keep conversation)
 */

import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

// GET /api/chat/conversations/[id]/messages - Get messages
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

    // Verify conversation exists and user owns it
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

    const conversationUserId = typeof conversation.user === 'object'
      ? conversation.user.id
      : conversation.user

    if (conversationUserId !== payloadUser.id) {
      return NextResponse.json(
        { message: 'Not authorized to access this conversation' },
        { status: 403 }
      )
    }

    // Get query params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '500')
    const before = searchParams.get('before') // Message ID to get messages before
    const after = searchParams.get('after') // Message ID to get messages after

    // Build query
    const where: Record<string, unknown> = {
      conversation: { equals: parseInt(id) },
    }

    // Pagination by message ID for infinite scroll
    if (before) {
      where.id = { less_than: parseInt(before) }
    }
    if (after) {
      where.id = { greater_than: parseInt(after) }
    }

    // Fetch messages
    // For initial load (no before/after): get most recent messages, sorted descending, then reverse for display
    // For loading older (before): get messages before ID, sorted descending, then reverse
    // For loading newer (after): get messages after ID, sorted ascending
    const sortDescending = !after // Sort descending unless we're loading newer messages

    const result = await payload.find({
      collection: 'message',
      where,
      sort: sortDescending ? '-created_timestamp' : 'created_timestamp',
      page,
      limit,
      depth: 2, // Include bot details and nested relationships (like bot.picture)
      overrideAccess: true,
    })

    // Reverse if sorted descending (for proper chronological display order)
    const messages = sortDescending ? result.docs.reverse() : result.docs

    // Format response
    const formattedMessages = messages.map((msg) => {
      const bot = typeof msg.bot === 'object' ? msg.bot : null

      return {
        id: msg.id,
        type: msg.message_type,
        content: msg.entry,
        richContent: msg.message_content?.text_content,
        createdAt: msg.created_timestamp,
        isAI: msg.message_attribution?.is_ai_generated,
        model: msg.message_attribution?.model_used,
        bot: bot ? {
          id: bot.id,
          name: bot.name,
          picture: bot.picture,
        } : null,
        tokens: msg.token_tracking ? {
          input: msg.token_tracking.input_tokens,
          output: msg.token_tracking.output_tokens,
          total: msg.token_tracking.total_tokens,
          cost: msg.token_tracking.cost_estimate,
        } : null,
        byoKey: msg.byo_key,
        status: msg.message_status?.delivery_status,
        isEdited: msg.message_status?.is_edited,
        editedAt: msg.message_status?.edited_at,
        replyTo: msg.message_thread?.reply_to_id,
        attachments: msg.message_content?.media_attachments || [],
        codeSnippets: msg.message_content?.code_snippets || [],
      }
    })

    return NextResponse.json({
      messages: formattedMessages,
      total: result.totalDocs,
      page: result.page,
      totalPages: result.totalPages,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    })
  } catch (error: unknown) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// DELETE /api/chat/conversations/[id]/messages - Clear all messages
export async function DELETE(
  _request: NextRequest,
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

    // Verify conversation exists and user owns it
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

    const conversationUserId = typeof conversation.user === 'object'
      ? conversation.user.id
      : conversation.user

    if (conversationUserId !== payloadUser.id) {
      return NextResponse.json(
        { message: 'Not authorized to modify this conversation' },
        { status: 403 }
      )
    }

    // Delete all messages in the conversation
    const result = await payload.delete({
      collection: 'message',
      where: {
        conversation: { equals: parseInt(id) },
      },
      overrideAccess: true,
    })

    // Reset conversation metadata
    await payload.update({
      collection: 'conversation',
      id: parseInt(id),
      data: {
        conversation_metadata: {
          total_messages: 0,
          last_activity: new Date().toISOString(),
        },
        total_tokens: 0,
      },
      overrideAccess: true,
    })

    return NextResponse.json({
      message: 'Chat history cleared',
      deletedCount: result.docs?.length || 0,
    })
  } catch (error: unknown) {
    console.error('Error clearing messages:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to clear messages' },
      { status: 500 }
    )
  }
}
