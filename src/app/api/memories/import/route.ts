import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

/**
 * Find or create a memory tome (KnowledgeCollection) for imported memories
 */
async function findOrCreateImportTome(
  payload: Payload,
  userId: number,
  botIds: number[],
  collectionName?: string
): Promise<number> {
  const tomeName = collectionName || 'Imported Memories'

  // Look for existing import tome
  const existing = await payload.find({
    collection: 'knowledgeCollections',
    where: {
      user: { equals: userId },
      name: { equals: tomeName },
    },
    limit: 1,
    overrideAccess: true,
  })

  if (existing.docs.length > 0) {
    return existing.docs[0].id
  }

  // Create new tome
  const newTome = await payload.create({
    collection: 'knowledgeCollections',
    data: {
      name: tomeName,
      user: userId,
      bot: botIds.length > 0 ? botIds : undefined,
      description: `Imported memories from external conversations`,
      sharing_settings: {
        sharing_level: 'private',
        allow_collaboration: false,
        allow_fork: false,
        knowledge_count: 0,
        is_public: false,
      },
      collection_metadata: {
        collection_category: 'memories',
        tags: [{ tag: 'imported' }, { tag: 'external-source' }],
      },
    },
    overrideAccess: true,
  })

  return newTome.id
}

/**
 * POST /api/memories/import
 *
 * Import legacy conversations from external platforms (old BotCafe, Character.AI, etc.)
 * and convert them into Knowledge entries (legacy memories).
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

    // Parse bot and persona IDs
    const botIds = botId ? [parseInt(botId, 10)] : []
    const personaIdNums = personaIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id))

    // Find or create import tome (KnowledgeCollection)
    const importTomeId = await findOrCreateImportTome(
      payload,
      payloadUser.id,
      botIds,
      collectionName
    )

    // Extract emotional context for tags
    const emotionalContext = extractEmotionalContext(parsedMessages)

    // Build tags array (importance and mood stored as tags in Knowledge schema)
    const tags: { tag: string }[] = [
      { tag: 'imported' },
      { tag: 'importance-7' }, // Higher importance for manually imported memories
    ]
    if (emotionalContext && emotionalContext !== 'neutral') {
      emotionalContext.split(', ').forEach(emotion => {
        tags.push({ tag: `mood-${emotion}` })
      })
    }

    // Create as Knowledge entry (legacy memory) in the import tome
    const knowledge = await payload.create({
      collection: 'knowledge',
      data: {
        user: payloadUser.id,
        knowledge_collection: importTomeId,
        type: 'legacy_memory',
        entry: summary,
        tags,
        is_legacy_memory: true,
        original_participants: participants,
        applies_to_bots: botIds.length > 0 ? botIds : undefined,
        applies_to_personas: personaIdNums.length > 0 ? personaIdNums : undefined,
        tokens: tokenCount,
        is_vectorized: false,
        activation_settings: {
          activation_mode: 'vector',
          vector_similarity_threshold: 0.6,
          max_vector_results: 5,
          probability: 100,
        },
        positioning: {
          position: 'after_character',
          order: 50,
        },
        privacy_settings: {
          privacy_level: 'private',
        },
      },
      overrideAccess: true,
    })

    // Update tome's knowledge count
    const tome = await payload.findByID({
      collection: 'knowledgeCollections',
      id: importTomeId,
      overrideAccess: true,
    })
    if (tome) {
      const currentCount = tome.sharing_settings?.knowledge_count || 0
      await payload.update({
        collection: 'knowledgeCollections',
        id: importTomeId,
        data: {
          sharing_settings: {
            ...tome.sharing_settings,
            knowledge_count: currentCount + 1,
            last_updated: new Date().toISOString(),
          },
        },
        overrideAccess: true,
      })
    }

    return NextResponse.json({
      success: true,
      memory: knowledge, // Return the knowledge entry
      collectionId: importTomeId,
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
