import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

/**
 * POST /api/memories/summarize
 *
 * Auto-summarization endpoint for conversation memories.
 * Triggers when a conversation reaches token threshold or message count.
 *
 * Request body:
 * - conversationId: string (required) - ID of conversation to summarize
 * - forceFullSummary?: boolean - Force full conversation summary instead of incremental
 *
 * Response:
 * - success: boolean
 * - memory: Memory object (if created)
 * - message: string
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get request body
    const body = (await request.json()) as {
      conversationId?: string
      forceFullSummary?: boolean
    }
    const { conversationId, forceFullSummary = false } = body

    if (!conversationId) {
      return NextResponse.json(
        { success: false, message: 'conversationId is required' },
        { status: 400 }
      )
    }

    // Get Payload instance
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Find user in Payload
    const users = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: clerkUser.emailAddresses[0]?.emailAddress,
        },
      },
      overrideAccess: true,
    })

    if (users.docs.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found in database' },
        { status: 404 }
      )
    }

    const payloadUser = users.docs[0]

    // Fetch conversation
    const conversation = await payload.findByID({
      collection: 'conversation',
      id: conversationId,
    })

    // Verify ownership
    if (typeof conversation.user === 'object' && conversation.user.id !== payloadUser.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: You do not own this conversation' },
        { status: 403 }
      )
    }

    // Fetch messages for this conversation
    const messagesResult = await payload.find({
      collection: 'message',
      where: {
        conversation: {
          equals: conversationId,
        },
      },
      sort: 'created_timestamp',
      limit: 1000, // Adjust based on your needs
    })

    const messages = messagesResult.docs

    if (messages.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No messages found in conversation' },
        { status: 400 }
      )
    }

    // Determine which messages to summarize
    let messagesToSummarize = messages
    let isIncremental = false

    if (!forceFullSummary && conversation.last_summarized_message_index) {
      // Incremental summary: only new messages since last summary
      messagesToSummarize = messages.filter((_, index) => index > conversation.last_summarized_message_index)
      isIncremental = true

      if (messagesToSummarize.length === 0) {
        return NextResponse.json(
          { success: false, message: 'No new messages to summarize' },
          { status: 400 }
        )
      }
    }

    // Build conversation text for summarization
    const conversationText = messagesToSummarize
      .map((msg: any) => {
        // Determine speaker (user or bot)
        const speaker = msg.bot ? 'Bot' : 'User'

        // Extract text content from the complex message structure
        let textContent = ''
        if (msg.message_content?.text_content?.root) {
          // Try to extract text from Lexical editor format
          const children = msg.message_content.text_content.root.children || []
          textContent = children
            .map((child: any) => {
              if (child.text) return child.text
              if (child.children) {
                return child.children.map((c: any) => c.text || '').join('')
              }
              return ''
            })
            .join(' ')
        }

        return textContent ? `${speaker}: ${textContent}` : ''
      })
      .filter((line) => line.trim())
      .join('\n\n')

    // Generate summary using AI (placeholder for now)
    // TODO: Integrate with Cloudflare Workers AI for actual summarization
    const summary = await generateSummary(conversationText, isIncremental)

    // Calculate token count (rough estimate: 1 token ≈ 4 characters)
    const tokenCount = Math.ceil(summary.length / 4)

    // Extract participants from conversation
    const participants = conversation.participants || { personas: [], bots: [] }

    // Create memory entry
    const memory = await payload.create({
      collection: 'memory',
      data: {
        user: payloadUser.id,
        bot: typeof conversation.bot_participation?.[0]?.bot_id === 'object'
          ? conversation.bot_participation[0].bot_id.id
          : conversation.bot_participation?.[0]?.bot_id,
        conversation: parseInt(conversationId, 10),
        entry: summary,
        tokens: tokenCount,
        type: 'short_term',
        participants: participants,
        is_vectorized: false, // Will be vectorized separately
        importance: 5, // Default importance
      },
    })

    // Update conversation's last summarized timestamp and message index
    await payload.update({
      collection: 'conversation',
      id: conversationId,
      data: {
        last_summarized_at: new Date().toISOString(),
        last_summarized_message_index: messages.length - 1,
        requires_summarization: false,
      },
    })

    return NextResponse.json({
      success: true,
      memory: memory,
      summary: summary,
      messagesProcessed: messagesToSummarize.length,
      isIncremental: isIncremental,
    })

  } catch (error: any) {
    console.error('Summarization error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create memory summary' },
      { status: 500 }
    )
  }
}

/**
 * Generate AI summary of conversation text
 * TODO: Replace with actual Cloudflare Workers AI integration
 */
async function generateSummary(conversationText: string, isIncremental: boolean): Promise<string> {
  // Placeholder implementation
  // In production, this would call Cloudflare Workers AI with a summarization prompt

  const summaryType = isIncremental ? 'Recent updates' : 'Full conversation'
  const lines = conversationText.split('\n').filter(line => line.trim())
  const messageCount = lines.length
  const firstFewLines = lines.slice(0, 3).join('\n')

  return `[${summaryType}] Summary of ${messageCount} messages:\n\n${firstFewLines}\n\n[This is a placeholder summary. Real AI summarization will be implemented with Cloudflare Workers AI]`
}
