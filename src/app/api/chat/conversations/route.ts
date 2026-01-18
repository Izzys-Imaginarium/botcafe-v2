/**
 * Chat Conversations API
 *
 * GET - List user's conversations
 * POST - Create a new conversation
 */

import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

// GET /api/chat/conversations - List user's conversations
export async function GET(request: NextRequest) {
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
      return NextResponse.json({ conversations: [], total: 0 })
    }

    const payloadUser = payloadUsers.docs[0]

    // Get query params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || 'active'
    const botId = searchParams.get('botId')

    // Build query
    const where: Record<string, unknown> = {
      user: { equals: payloadUser.id },
    }

    if (status !== 'all') {
      where.status = { equals: status }
    }

    if (botId) {
      where['bot_participation.bot_id'] = { equals: parseInt(botId) }
    }

    // Fetch conversations
    const result = await payload.find({
      collection: 'conversation',
      where,
      sort: '-conversation_metadata.last_activity',
      page,
      limit,
      depth: 2, // Include bot details
      overrideAccess: true,
    })

    // Format response
    const conversations = result.docs.map((conv) => ({
      id: conv.id,
      type: conv.conversation_type,
      status: conv.status,
      createdAt: conv.created_timestamp,
      lastActivity: conv.conversation_metadata?.last_activity,
      messageCount: conv.conversation_metadata?.total_messages || 0,
      summary: conv.conversation_metadata?.conversation_summary,
      participants: conv.participants,
      bots: conv.bot_participation?.map((bp) => ({
        bot: bp.bot_id,
        role: bp.role,
        isActive: bp.is_active,
      })) || [],
      totalTokens: conv.total_tokens || 0,
    }))

    return NextResponse.json({
      conversations,
      total: result.totalDocs,
      page: result.page,
      totalPages: result.totalPages,
      hasNextPage: result.hasNextPage,
    })
  } catch (error: unknown) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}

// POST /api/chat/conversations - Create a new conversation
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
      botId?: number
      botIds?: number[]
      personaId?: number
      type?: string
    }
    const { botId, botIds, personaId, type } = body

    // Validate bot(s)
    const botIdsToAdd = botIds || (botId ? [botId] : [])

    if (botIdsToAdd.length === 0) {
      return NextResponse.json(
        { message: 'At least one bot is required' },
        { status: 400 }
      )
    }

    // Verify bots exist
    const bots = await payload.find({
      collection: 'bot',
      where: {
        id: { in: botIdsToAdd },
      },
      overrideAccess: true,
    })

    if (bots.docs.length !== botIdsToAdd.length) {
      return NextResponse.json(
        { message: 'One or more bots not found' },
        { status: 404 }
      )
    }

    // Verify persona if provided
    if (personaId) {
      const personas = await payload.find({
        collection: 'personas',
        where: {
          id: { equals: personaId },
          user: { equals: payloadUser.id },
        },
        limit: 1,
        overrideAccess: true,
      })

      if (personas.docs.length === 0) {
        return NextResponse.json(
          { message: 'Persona not found or not owned by user' },
          { status: 404 }
        )
      }
    }

    // Determine conversation type
    const conversationType = (type || (botIdsToAdd.length > 1 ? 'multi-bot' : 'single-bot')) as 'single-bot' | 'multi-bot' | 'group-chat'

    // Create conversation
    const conversation = await payload.create({
      collection: 'conversation',
      data: {
        user: payloadUser.id,
        conversation_type: conversationType,
        status: 'active',
        bot_participation: botIdsToAdd.map((id: number, index: number) => ({
          bot_id: id,
          role: index === 0 ? 'primary' : 'secondary',
          is_active: true,
          joined_at: new Date().toISOString(),
        })),
        participants: {
          personas: personaId ? [String(personaId)] : [],
          bots: botIdsToAdd.map(String),
          primary_persona: personaId ? String(personaId) : undefined,
          persona_changes: [],
        },
        total_tokens: 0,
        conversation_metadata: {
          total_messages: 0,
          participant_count: botIdsToAdd.length + 1,
          last_activity: new Date().toISOString(),
        },
        conversation_settings: {
          allow_file_sharing: true,
          message_retention_days: 365,
          auto_save_conversations: true,
        },
      },
      overrideAccess: true,
    })

    // Fetch with depth to include bot details
    const fullConversation = await payload.findByID({
      collection: 'conversation',
      id: conversation.id,
      depth: 2,
      overrideAccess: true,
    })

    return NextResponse.json({
      success: true,
      conversation: {
        id: fullConversation.id,
        type: fullConversation.conversation_type,
        status: fullConversation.status,
        createdAt: fullConversation.created_timestamp,
        bots: fullConversation.bot_participation?.map((bp) => ({
          bot: bp.bot_id,
          role: bp.role,
        })) || [],
        participants: fullConversation.participants,
      },
    })
  } catch (error: unknown) {
    console.error('Error creating conversation:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to create conversation' },
      { status: 500 }
    )
  }
}
