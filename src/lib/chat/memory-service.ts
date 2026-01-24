/**
 * Memory Service
 *
 * Handles automatic memory generation during conversations.
 * Triggers summarization when message/token thresholds are reached.
 */

import type { Payload } from 'payload'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Conversation, Message, Memory } from '@/payload-types'

/**
 * Get a fresh Payload instance for background operations
 * This ensures the instance isn't tied to request lifecycle
 */
async function getBackgroundPayload(): Promise<Payload> {
  const payloadConfig = await config
  return getPayload({ config: payloadConfig })
}

export interface MemoryTriggerConfig {
  messageThreshold: number // Generate every N messages
  tokenThreshold: number // Or when tokens exceed
  importanceThreshold: number // Minimum importance to save (0-1)
}

const DEFAULT_CONFIG: MemoryTriggerConfig = {
  messageThreshold: 20,
  tokenThreshold: 4000,
  importanceThreshold: 0.5,
}

/**
 * Check if a conversation needs memory generation
 */
export async function checkMemoryTrigger(
  payload: Payload,
  conversationId: number,
  config: Partial<MemoryTriggerConfig> = {}
): Promise<{
  shouldGenerate: boolean
  reason?: 'message_threshold' | 'token_threshold'
  messagesSinceLast: number
}> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }

  // Fetch conversation
  const conversation = await payload.findByID({
    collection: 'conversation',
    id: conversationId,
    overrideAccess: true,
  })

  if (!conversation) {
    return { shouldGenerate: false, messagesSinceLast: 0 }
  }

  const lastSummarizedIndex = conversation.last_summarized_message_index || 0
  const totalMessages = conversation.conversation_metadata?.total_messages || 0
  const messagesSinceLast = totalMessages - lastSummarizedIndex

  // Check message threshold (primary trigger for subsequent memories)
  if (messagesSinceLast >= mergedConfig.messageThreshold) {
    return {
      shouldGenerate: true,
      reason: 'message_threshold',
      messagesSinceLast,
    }
  }

  // Check token threshold only if we haven't summarized yet
  // This ensures the first memory is created when hitting token limit
  // Subsequent memories are triggered by message count to avoid duplicates
  const totalTokens = conversation.total_tokens || 0
  const hasEverSummarized = lastSummarizedIndex > 0
  if (!hasEverSummarized && totalTokens >= mergedConfig.tokenThreshold) {
    return {
      shouldGenerate: true,
      reason: 'token_threshold',
      messagesSinceLast,
    }
  }

  return { shouldGenerate: false, messagesSinceLast }
}

/**
 * Generate a memory from recent conversation messages
 * Note: Creates its own Payload instance for background operations to avoid
 * issues with request lifecycle terminating the connection
 */
export async function generateConversationMemory(
  _payload: Payload | null, // Ignored - we create our own instance for background safety
  conversationId: number,
  options: {
    forceGenerate?: boolean
    config?: Partial<MemoryTriggerConfig>
  } = {}
): Promise<{
  success: boolean
  memoryId?: number
  summary?: string
  error?: string
}> {
  console.log(`[Memory Service] generateConversationMemory called for conversation ${conversationId}, forceGenerate=${options.forceGenerate}`)

  try {
    // Create our own Payload instance to avoid request lifecycle issues
    console.log(`[Memory Service] Creating fresh Payload instance...`)
    const payload = await getBackgroundPayload()
    console.log(`[Memory Service] Payload instance ready`)

    // Check if generation is needed (unless forced)
    if (!options.forceGenerate) {
      const trigger = await checkMemoryTrigger(payload, conversationId, options.config)
      console.log(`[Memory Service] Trigger check result:`, trigger)
      if (!trigger.shouldGenerate) {
        return { success: false, error: 'Memory generation not needed yet' }
      }
    } else {
      console.log(`[Memory Service] Skipping trigger check (forceGenerate=true)`)
    }

    // Fetch conversation with details
    console.log(`[Memory Service] Fetching conversation ${conversationId} from database...`)
    let conversation: Conversation | null = null
    try {
      conversation = await payload.findByID({
        collection: 'conversation',
        id: conversationId,
        depth: 2,
        overrideAccess: true,
      }) as Conversation | null
      console.log(`[Memory Service] Conversation fetch complete: ${conversation ? `found (user: ${typeof conversation.user === 'object' ? conversation.user.id : conversation.user})` : 'NOT FOUND'}`)
    } catch (fetchError) {
      console.error(`[Memory Service] ERROR fetching conversation:`, fetchError)
      return { success: false, error: `Failed to fetch conversation: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}` }
    }

    if (!conversation) {
      console.log(`[Memory Service] ERROR: Conversation ${conversationId} not found in database`)
      return { success: false, error: 'Conversation not found' }
    }

    // Get messages since last summarization
    const lastIndex = conversation.last_summarized_message_index || 0
    console.log(`[Memory Service] Fetching messages for conversation ${conversationId}, lastIndex=${lastIndex}`)

    const messages = await payload.find({
      collection: 'message',
      where: {
        conversation: { equals: conversationId },
      },
      sort: 'created_timestamp',
      limit: 100, // Get enough messages
      depth: 1,
      overrideAccess: true,
    })

    console.log(`[Memory Service] Found ${messages.docs.length} total messages`)

    // Filter to messages after last summarization
    const newMessages = messages.docs.slice(lastIndex)
    console.log(`[Memory Service] ${newMessages.length} new messages to summarize (after index ${lastIndex})`)

    if (newMessages.length === 0) {
      return { success: false, error: 'No new messages to summarize' }
    }

    // Build summary text (will be enhanced with AI summarization later)
    const summary = buildSimpleSummary(newMessages)

    // Get participants
    const participants = conversation.participants as {
      bots?: string[]
      personas?: string[]
    } | null

    // Get user ID
    const userId = typeof conversation.user === 'object'
      ? conversation.user.id
      : conversation.user

    // Get first bot from participants, fallback to bot_participation
    let botId: number | null = null
    if (participants?.bots?.[0]) {
      botId = parseInt(participants.bots[0])
    } else if (conversation.bot_participation && Array.isArray(conversation.bot_participation)) {
      // Fallback to bot_participation array
      const firstParticipation = conversation.bot_participation[0] as { bot_id?: number } | undefined
      botId = firstParticipation?.bot_id || null
    }

    console.log(`[Memory Service] Participants:`, JSON.stringify(participants))
    console.log(`[Memory Service] Bot participation:`, JSON.stringify(conversation.bot_participation))

    // If still no bot, we can't create the memory (bot is required)
    if (!botId) {
      console.error(`[Memory Service] No bot found for conversation ${conversationId}`)
      return { success: false, error: 'No bot found in conversation' }
    }

    // Create memory
    console.log(`[Memory Service] Creating memory for user=${userId}, bot=${botId}, conversation=${conversationId}`)
    const memory = await payload.create({
      collection: 'memory',
      data: {
        user: userId,
        bot: botId,
        conversation: conversationId,
        type: 'short_term',
        entry: summary,
        participants: {
          personas: participants?.personas || [],
          bots: participants?.bots || [],
        },
        importance: calculateImportance(newMessages),
        emotional_context: extractEmotionalContext(newMessages),
        is_vectorized: false,
      },
      overrideAccess: true,
    })
    console.log(`[Memory Service] Memory created with ID: ${memory.id}`)

    // Update conversation
    await payload.update({
      collection: 'conversation',
      id: conversationId,
      data: {
        last_summarized_at: new Date().toISOString(),
        last_summarized_message_index: messages.docs.length,
        requires_summarization: false,
        conversation_metadata: {
          ...conversation.conversation_metadata,
          conversation_summary: summary,
        },
      },
      overrideAccess: true,
    })

    return {
      success: true,
      memoryId: memory.id,
      summary,
    }
  } catch (error) {
    console.error('[Memory Service] ERROR - Exception in generateConversationMemory:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Build a simple summary from messages (fallback when AI not available)
 */
function buildSimpleSummary(messages: Message[]): string {
  const messageCount = messages.length

  // Extract key points
  const userMessages = messages.filter(m => !m.message_attribution?.is_ai_generated)
  const botMessages = messages.filter(m => m.message_attribution?.is_ai_generated)

  // Get first and last few messages for context
  const firstMessages = messages.slice(0, 3).map(m => m.entry?.slice(0, 100)).join(' ')
  const lastMessages = messages.slice(-3).map(m => m.entry?.slice(0, 100)).join(' ')

  // Build summary
  const parts = [
    `Conversation with ${messageCount} messages.`,
    `User sent ${userMessages.length} messages, bot responded ${botMessages.length} times.`,
  ]

  if (firstMessages) {
    parts.push(`Started discussing: ${firstMessages.slice(0, 200)}...`)
  }

  if (lastMessages) {
    parts.push(`Recently discussed: ${lastMessages.slice(0, 200)}...`)
  }

  return parts.join('\n')
}

/**
 * Calculate importance score for a set of messages
 */
function calculateImportance(messages: Message[]): number {
  let score = 0.5 // Base score

  // More messages = more important
  if (messages.length > 10) score += 0.1
  if (messages.length > 20) score += 0.1

  // Check for emotional content (simple heuristic)
  const allText = messages.map(m => m.entry || '').join(' ').toLowerCase()

  const emotionalKeywords = [
    'love', 'hate', 'amazing', 'terrible', 'wonderful', 'horrible',
    'important', 'crucial', 'remember', 'never forget', 'always',
    'promise', 'secret', 'confession', 'truth', 'revelation',
  ]

  const emotionalMatches = emotionalKeywords.filter(k => allText.includes(k))
  score += emotionalMatches.length * 0.05

  // Check for questions and revelations
  if (allText.includes('?')) score += 0.05
  if (allText.includes('!')) score += 0.03

  // Cap at 1.0
  return Math.min(score, 1.0)
}

/**
 * Extract emotional context from messages
 */
function extractEmotionalContext(messages: Message[]): string | null {
  const allText = messages.map(m => m.entry || '').join(' ').toLowerCase()

  const emotions: string[] = []

  if (/happy|joy|excited|wonderful|great/i.test(allText)) emotions.push('positive')
  if (/sad|upset|disappointed|hurt/i.test(allText)) emotions.push('melancholic')
  if (/angry|frustrated|annoyed/i.test(allText)) emotions.push('tense')
  if (/love|care|affection/i.test(allText)) emotions.push('romantic')
  if (/scared|afraid|worried/i.test(allText)) emotions.push('anxious')
  if (/curious|interested|wonder/i.test(allText)) emotions.push('curious')

  return emotions.length > 0 ? emotions.join(', ') : null
}

/**
 * Retrieve relevant memories for a conversation
 */
export async function retrieveRelevantMemories(
  payload: Payload,
  userId: number,
  botId: number,
  options: {
    personaId?: number
    limit?: number
    minImportance?: number
  } = {}
): Promise<Memory[]> {
  const { limit = 5, minImportance = 0.3 } = options

  const where: Record<string, unknown> = {
    user: { equals: userId },
    bot: { equals: botId },
  }

  if (minImportance > 0) {
    where.importance = { greater_than_equal: minImportance }
  }

  const memories = await payload.find({
    collection: 'memory',
    where,
    sort: '-importance,-createdAt',
    limit,
    overrideAccess: true,
  })

  return memories.docs as Memory[]
}
