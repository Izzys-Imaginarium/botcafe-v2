/**
 * Individual Message API
 *
 * PATCH - Edit a message (user messages only)
 * DELETE - Delete a single message
 */

import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

// PATCH /api/chat/messages/[id] - Edit a message
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
    const messageId = parseInt(id)
    const payload = await getPayload({ config })

    // Parse body
    const body = await request.json() as { content?: string }
    const newContent = body.content?.trim()

    if (!newContent) {
      return NextResponse.json(
        { message: 'Content is required and cannot be empty' },
        { status: 400 }
      )
    }

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

    // Find the message
    const message = await payload.findByID({
      collection: 'message',
      id: messageId,
      overrideAccess: true,
    })

    if (!message) {
      return NextResponse.json(
        { message: 'Message not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    const messageUserId = typeof message.user === 'object'
      ? message.user.id
      : message.user

    if (messageUserId !== payloadUser.id) {
      return NextResponse.json(
        { message: 'Not authorized to edit this message' },
        { status: 403 }
      )
    }

    // Only allow editing non-AI messages
    if (message.message_attribution?.is_ai_generated) {
      return NextResponse.json(
        { message: 'Cannot edit AI-generated messages' },
        { status: 403 }
      )
    }

    // Build edit history
    const now = new Date().toISOString()
    const existingHistory = message.message_status?.edit_history || []
    const newHistoryEntry = {
      previous_content: message.entry,
      edited_at: now,
    }

    // Update message
    const updated = await payload.update({
      collection: 'message',
      id: messageId,
      data: {
        entry: newContent,
        modified_timestamp: now,
        message_status: {
          ...message.message_status,
          is_edited: true,
          edited_at: now,
          edit_history: [...existingHistory, newHistoryEntry],
        },
      },
      overrideAccess: true,
    })

    return NextResponse.json({
      success: true,
      message: {
        id: updated.id,
        content: updated.entry,
        isEdited: true,
        editedAt: now,
      },
    })
  } catch (error: unknown) {
    console.error('Error editing message:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to edit message' },
      { status: 500 }
    )
  }
}

// DELETE /api/chat/messages/[id] - Delete a single message
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
    const messageId = parseInt(id)
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

    // Find the message
    const message = await payload.findByID({
      collection: 'message',
      id: messageId,
      overrideAccess: true,
    })

    if (!message) {
      return NextResponse.json(
        { message: 'Message not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    const messageUserId = typeof message.user === 'object'
      ? message.user.id
      : message.user

    if (messageUserId !== payloadUser.id) {
      return NextResponse.json(
        { message: 'Not authorized to delete this message' },
        { status: 403 }
      )
    }

    // Capture token data for metadata update
    const tokensToRemove = message.token_tracking?.total_tokens || 0

    // Get conversation ID
    const conversationId = typeof message.conversation === 'object'
      ? message.conversation.id
      : message.conversation

    // Delete the message
    await payload.delete({
      collection: 'message',
      id: messageId,
      overrideAccess: true,
    })

    // Update conversation metadata
    try {
      const conversation = await payload.findByID({
        collection: 'conversation',
        id: conversationId,
        overrideAccess: true,
      })

      if (conversation) {
        await payload.update({
          collection: 'conversation',
          id: conversationId,
          data: {
            conversation_metadata: {
              ...conversation.conversation_metadata,
              total_messages: Math.max(0, (conversation.conversation_metadata?.total_messages || 0) - 1),
              last_activity: new Date().toISOString(),
            },
            total_tokens: Math.max(0, (conversation.total_tokens || 0) - tokensToRemove),
          },
          overrideAccess: true,
        })
      }
    } catch (metaError) {
      // Non-fatal: message is already deleted, just log the metadata update failure
      console.error('Failed to update conversation metadata after message delete:', metaError)
    }

    return NextResponse.json({
      success: true,
      message: 'Message deleted',
    })
  } catch (error: unknown) {
    console.error('Error deleting message:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to delete message' },
      { status: 500 }
    )
  }
}
