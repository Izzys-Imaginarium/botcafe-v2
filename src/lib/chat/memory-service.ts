/**
 * Memory Service
 *
 * Handles automatic memory generation during conversations.
 * Triggers summarization when message/token thresholds are reached.
 */

import type { Payload } from 'payload'
import type { Conversation, Message, Memory } from '@/payload-types'

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

  // Check message threshold
  if (messagesSinceLast >= mergedConfig.messageThreshold) {
    return {
      shouldGenerate: true,
      reason: 'message_threshold',
      messagesSinceLast,
    }
  }

  // Check token threshold
  const totalTokens = conversation.total_tokens || 0
  if (totalTokens >= mergedConfig.tokenThreshold) {
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
 */
export async function generateConversationMemory(
  payload: Payload,
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
  try {
    // Check if generation is needed (unless forced)
    if (!options.forceGenerate) {
      const trigger = await checkMemoryTrigger(payload, conversationId, options.config)
      if (!trigger.shouldGenerate) {
        return { success: false, error: 'Memory generation not needed yet' }
      }
    }

    // Fetch conversation with details
    const conversation = await payload.findByID({
      collection: 'conversation',
      id: conversationId,
      depth: 2,
      overrideAccess: true,
    }) as Conversation | null

    if (!conversation) {
      return { success: false, error: 'Conversation not found' }
    }

    // Get messages since last summarization
    const lastIndex = conversation.last_summarized_message_index || 0

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

    // Filter to messages after last summarization
    const newMessages = messages.docs.slice(lastIndex)

    if (newMessages.length < 5) {
      return { success: false, error: 'Not enough new messages to summarize' }
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

    // Get first bot from participants
    const botId = participants?.bots?.[0]
      ? parseInt(participants.bots[0])
      : null

    // Create memory
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
    console.error('Error generating memory:', error)
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
