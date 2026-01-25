import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

/**
 * POST /api/memories/import
 *
 * Import legacy conversations from external platforms (old BotCafe, Character.AI, etc.)
 * and convert them into Memory entries.
 *
 * Request body:
 * - file: FormData with uploaded conversation file
 * - OR
 * - conversationText: string (raw conversation text)
 * - format: 'plain' | 'json' | 'characterai' (default: 'plain')
 * - collectionName?: string (optional memory collection name)
 * - botId?: string (optional bot to associate with)
 * - personaIds?: string[] (optional personas that participated)
 *
 * Response:
 * - success: boolean
 * - memories: Memory[] (created memory entries)
 * - collectionId?: string (if collection was created)
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

    // Check if request is multipart/form-data (file upload) or JSON
    const contentType = request.headers.get('content-type') || ''

    let conversationText: string
    let format: 'plain' | 'json' | 'characterai' = 'plain'
    let collectionName: string | undefined
    let botId: string | undefined
    let personaIds: string[] = []

    if (contentType.includes('multipart/form-data')) {
      // File upload
      const formData = await request.formData()
      const file = formData.get('file') as File | null

      if (!file) {
        return NextResponse.json(
          { success: false, message: 'No file provided' },
          { status: 400 }
        )
      }

      // Read file content
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      conversationText = buffer.toString('utf-8')

      // Get optional parameters
      format = (formData.get('format') as any) || 'plain'
      collectionName = formData.get('collectionName') as string | undefined
      botId = formData.get('botId') as string | undefined

      const personaIdsStr = formData.get('personaIds') as string | undefined
      if (personaIdsStr) {
        personaIds = JSON.parse(personaIdsStr)
      }
    } else {
      // JSON request
      const body = (await request.json()) as {
        conversationText?: string
        format?: 'plain' | 'json' | 'characterai'
        collectionName?: string
        botId?: string
        personaIds?: string[]
      }

      conversationText = body.conversationText || ''
      format = body.format || 'plain'
      collectionName = body.collectionName
      botId = body.botId
      personaIds = body.personaIds || []
    }

    if (!conversationText || conversationText.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'No conversation text provided' },
        { status: 400 }
      )
    }

    // Parse conversation based on format
    const parsedMessages = await parseConversation(conversationText, format)

    if (parsedMessages.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No messages found in conversation' },
        { status: 400 }
      )
    }

    // Generate summary for the conversation
    const summary = await generateConversationSummary(parsedMessages)

    // Calculate token count
    const tokenCount = Math.ceil(summary.length / 4)

    // Build participants JSON
    const participants = {
      personas: personaIds,
      bots: botId ? [botId] : [],
    }

    // Create memory entry
    const memory = await payload.create({
      collection: 'memory',
      data: {
        user: payloadUser.id,
        bot: botId ? [parseInt(botId, 10)] : [],
        conversation: undefined, // No associated conversation for imports
        entry: summary,
        tokens: tokenCount,
        type: 'long_term', // Imported memories are long-term
        participants: participants,
        is_vectorized: false,
        importance: 7, // Higher importance for manually imported memories
        emotional_context: extractEmotionalContext(parsedMessages),
      },
      overrideAccess: true,
    })

    return NextResponse.json({
      success: true,
      memory: memory,
      messagesImported: parsedMessages.length,
      summary: summary,
      message: `Successfully imported conversation with ${parsedMessages.length} messages`,
    })

  } catch (error: any) {
    console.error('Import error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to import conversation' },
      { status: 500 }
    )
  }
}

/**
 * Parse conversation text into structured messages
 */
async function parseConversation(
  text: string,
  format: 'plain' | 'json' | 'characterai'
): Promise<Array<{ speaker: string; message: string; timestamp?: string }>> {
  const messages: Array<{ speaker: string; message: string; timestamp?: string }> = []

  switch (format) {
    case 'json':
      try {
        // Expect format: [{ speaker: "User", message: "Hello", timestamp?: "..." }, ...]
        const parsed = JSON.parse(text)
        if (Array.isArray(parsed)) {
          return parsed.map((msg: any) => ({
            speaker: msg.speaker || msg.author || msg.name || 'Unknown',
            message: msg.message || msg.text || msg.content || '',
            timestamp: msg.timestamp || msg.time || msg.date,
          }))
        }
      } catch (e) {
        console.error('Failed to parse JSON conversation:', e)
      }
      break

    case 'characterai':
      // Character.AI export format (specific to their platform)
      // Format: "Character Name: message text\nUser: message text\n"
      const caiLines = text.split('\n')
      for (const line of caiLines) {
        const match = line.match(/^(.+?):\s*(.+)$/)
        if (match) {
          messages.push({
            speaker: match[1].trim(),
            message: match[2].trim(),
          })
        }
      }
      break

    case 'plain':
    default:
      // Plain text format: "Speaker: message" per line
      // Also supports "- Speaker: message" or "* Speaker: message"
      const plainLines = text.split('\n')
      for (const line of plainLines) {
        // Match various formats
        const match = line.match(/^[\-\*]?\s*(.+?):\s*(.+)$/)
        if (match) {
          messages.push({
            speaker: match[1].trim(),
            message: match[2].trim(),
          })
        }
      }
      break
  }

  return messages.filter((m) => m.message.length > 0)
}

/**
 * Generate summary from parsed messages
 * TODO: Integrate with Cloudflare Workers AI for actual summarization
 */
async function generateConversationSummary(
  messages: Array<{ speaker: string; message: string; timestamp?: string }>
): Promise<string> {
  // Placeholder implementation
  const conversationText = messages
    .map((m) => `${m.speaker}: ${m.message}`)
    .join('\n')

  const preview = conversationText.substring(0, 500)
  const speakers = [...new Set(messages.map((m) => m.speaker))].join(', ')

  return `[Imported Conversation]\nParticipants: ${speakers}\nMessages: ${messages.length}\n\nPreview:\n${preview}...\n\n[This is a placeholder summary. Real AI summarization will be implemented with Cloudflare Workers AI]`
}

/**
 * Extract emotional context from messages
 */
function extractEmotionalContext(
  messages: Array<{ speaker: string; message: string; timestamp?: string }>
): string {
  // Simple keyword-based emotion detection (placeholder)
  const emotionKeywords = {
    happy: ['happy', 'joy', 'excited', 'love', 'wonderful', 'great'],
    sad: ['sad', 'sorry', 'miss', 'cry', 'hurt', 'pain'],
    angry: ['angry', 'mad', 'hate', 'frustrated', 'annoyed'],
    afraid: ['afraid', 'scared', 'worried', 'anxious', 'nervous'],
  }

  const allText = messages.map((m) => m.message.toLowerCase()).join(' ')
  const detectedEmotions: string[] = []

  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    if (keywords.some((keyword) => allText.includes(keyword))) {
      detectedEmotions.push(emotion)
    }
  }

  return detectedEmotions.length > 0
    ? detectedEmotions.join(', ')
    : 'neutral'
}
