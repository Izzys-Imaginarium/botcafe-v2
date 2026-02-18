/**
 * Memory Service
 *
 * Handles automatic memory generation during conversations.
 * Triggers summarization when message/token thresholds are reached.
 */

import type { Payload } from 'payload'
import type { Conversation, Message, Memory, Knowledge, KnowledgeCollection } from '@/payload-types'
import { sendMessage, type ProviderName } from '@/lib/llm'

/**
 * Cloudflare Workers Note:
 * Previously we created a fresh Payload instance for background operations,
 * but this causes issues in Cloudflare Workers where creating a new instance
 * in a background context can fail and trigger process.exit(1).
 * Instead, we now use the Payload instance passed to us.
 */

export interface MemoryTriggerConfig {
  firstMemoryThreshold: number // Generate first memory after N messages
  messageThreshold: number // Generate subsequent memories every N messages
  importanceThreshold: number // Minimum importance to save (0-1)
}

const DEFAULT_CONFIG: MemoryTriggerConfig = {
  firstMemoryThreshold: 5,
  messageThreshold: 20,
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
  reason?: 'message_threshold'
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

  const hasEverSummarized = lastSummarizedIndex > 0

  // First memory: trigger after firstMemoryThreshold messages
  if (!hasEverSummarized && messagesSinceLast >= mergedConfig.firstMemoryThreshold) {
    return {
      shouldGenerate: true,
      reason: 'message_threshold',
      messagesSinceLast,
    }
  }

  // Subsequent memories: trigger every messageThreshold messages
  if (hasEverSummarized && messagesSinceLast >= mergedConfig.messageThreshold) {
    return {
      shouldGenerate: true,
      reason: 'message_threshold',
      messagesSinceLast,
    }
  }

  return { shouldGenerate: false, messagesSinceLast }
}

/**
 * Check if a memory with similar content already exists
 * Uses text similarity based on keyword overlap
 */
async function checkForDuplicateMemory(
  payload: Payload,
  userId: number,
  conversationId: number,
  newSummary: string,
  similarityThreshold: number = 0.6
): Promise<{ isDuplicate: boolean; existingMemoryId?: number }> {
  try {
    // Get existing memories for this conversation from Knowledge collection
    // Check both legacy and non-legacy entries to prevent any duplicates
    const existingMemories = await payload.find({
      collection: 'knowledge',
      where: {
        user: { equals: userId },
        source_conversation_id: { equals: conversationId },
      },
      limit: 10,
      sort: '-createdAt',
      overrideAccess: true,
    })

    if (existingMemories.docs.length === 0) {
      return { isDuplicate: false }
    }

    // Calculate similarity with each existing memory
    const newKeywords = extractKeywords(newSummary)

    for (const existing of existingMemories.docs) {
      const existingKeywords = extractKeywords(existing.entry || '')
      const similarity = calculateKeywordSimilarity(newKeywords, existingKeywords)

      if (similarity >= similarityThreshold) {
        console.log(`[Memory Service] Found similar memory (ID: ${existing.id}, similarity: ${similarity.toFixed(2)})`)
        return { isDuplicate: true, existingMemoryId: existing.id }
      }
    }

    return { isDuplicate: false }
  } catch (error) {
    console.error('[Memory Service] Error checking for duplicates:', error)
    return { isDuplicate: false } // Proceed with creation on error
  }
}

/**
 * Extract significant keywords from text for similarity comparison
 */
function extractKeywords(text: string): Set<string> {
  // Common stop words to filter out
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought',
    'used', 'it', 'its', 'this', 'that', 'these', 'those', 'i', 'you', 'he',
    'she', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your',
    'his', 'her', 'our', 'their', 'what', 'which', 'who', 'whom', 'whose',
    'where', 'when', 'why', 'how', 'all', 'each', 'every', 'both', 'few',
    'more', 'most', 'other', 'some', 'such', 'no', 'not', 'only', 'same',
    'so', 'than', 'too', 'very', 'just', 'also', 'now', 'here', 'there',
    'then', 'once', 'if', 'about', 'after', 'before', 'between', 'into',
    'through', 'during', 'above', 'below', 'up', 'down', 'out', 'off', 'over',
    'under', 'again', 'further', 'conversation', 'messages', 'user', 'bot',
    'sent', 'responded', 'times', 'discussing', 'discussed', 'recently',
    'started', 'message', 'total',
  ])

  // Extract words, filter stop words, and normalize
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))

  return new Set(words)
}

/**
 * Calculate Jaccard similarity between two keyword sets
 */
function calculateKeywordSimilarity(set1: Set<string>, set2: Set<string>): number {
  if (set1.size === 0 && set2.size === 0) return 1
  if (set1.size === 0 || set2.size === 0) return 0

  const intersection = new Set([...set1].filter(x => set2.has(x)))
  const union = new Set([...set1, ...set2])

  return intersection.size / union.size
}

/**
 * Find or create a memory tome (KnowledgeCollection) for a conversation
 * The tome is named after the conversation title
 */
async function findOrCreateMemoryTome(
  payload: Payload,
  conversation: Conversation,
  userId: number,
  botIds: number[]
): Promise<KnowledgeCollection> {
  // Check if conversation already has a linked tome
  const existingTomeId = typeof conversation.memory_tome === 'object'
    ? conversation.memory_tome?.id
    : conversation.memory_tome

  if (existingTomeId) {
    const existingTome = await payload.findByID({
      collection: 'knowledgeCollections',
      id: existingTomeId,
      overrideAccess: true,
    })
    if (existingTome) {
      console.log(`[Memory Service] Using existing tome: ${existingTome.name} (ID: ${existingTome.id})`)
      return existingTome as KnowledgeCollection
    }
  }

  // Generate tome name from conversation title or create default
  const tomeName = conversation.title || `Memories from Conversation #${conversation.id}`

  console.log(`[Memory Service] Creating new tome: "${tomeName}"`)

  // Create new tome for this conversation
  const newTome = await payload.create({
    collection: 'knowledgeCollections',
    data: {
      name: tomeName,
      user: userId,
      bot: botIds,
      description: `Auto-generated memory collection from conversation "${tomeName}"`,
      sharing_settings: {
        sharing_level: 'private',
        allow_collaboration: false,
        allow_fork: false,
        knowledge_count: 0,
        is_public: false,
      },
      collection_metadata: {
        collection_category: 'memories',
        tags: [{ tag: 'auto-generated' }, { tag: 'conversation-memory' }],
      },
    },
    overrideAccess: true,
  })

  // Link the tome to the conversation
  await payload.update({
    collection: 'conversation',
    id: conversation.id,
    data: {
      memory_tome: newTome.id,
    },
    overrideAccess: true,
  })

  console.log(`[Memory Service] Created and linked new tome: ${newTome.name} (ID: ${newTome.id})`)
  return newTome as KnowledgeCollection
}

/**
 * Generate a memory from recent conversation messages
 * Saves as a lore entry in the conversation's memory tome
 *
 * Note: Uses the passed Payload instance directly. In Cloudflare Workers,
 * creating a new instance in background contexts can trigger process.exit(1).
 */
export interface SummarizationConfig {
  apiKey: string
  provider: ProviderName
  model?: string
}

export async function generateConversationMemory(
  payloadInstance: Payload,
  conversationId: number,
  options: {
    forceGenerate?: boolean
    config?: Partial<MemoryTriggerConfig>
    summarization?: SummarizationConfig // Optional AI summarization config
  } = {}
): Promise<{
  success: boolean
  memoryId?: number
  summary?: string
  error?: string
}> {
  console.log(`[Memory Service] generateConversationMemory called for conversation ${conversationId}, forceGenerate=${options.forceGenerate}`)

  // Validate we have a Payload instance
  if (!payloadInstance) {
    console.error(`[Memory Service] ERROR: No Payload instance provided`)
    return { success: false, error: 'No Payload instance provided' }
  }

  const payload = payloadInstance

  try {

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

    // Fetch newest messages first to avoid the limit:100 cap missing recent messages
    // when conversations grow beyond 100 messages. We then slice to only the
    // unsummarized portion and reverse back to chronological order.
    const messages = await payload.find({
      collection: 'message',
      where: {
        conversation: { equals: conversationId },
      },
      sort: '-created_timestamp',
      limit: 100,
      depth: 1,
      overrideAccess: true,
    })

    const totalMessageCount = messages.totalDocs
    console.log(`[Memory Service] Found ${totalMessageCount} total messages (fetched ${messages.docs.length})`)

    // Extract only the unsummarized messages from the newest-first results
    const unsummarizedCount = Math.max(totalMessageCount - lastIndex, 0)
    const newMessages = messages.docs
      .slice(0, Math.min(unsummarizedCount, messages.docs.length))
      .reverse() // Reverse to chronological order (oldest first)
    console.log(`[Memory Service] ${newMessages.length} new messages to summarize (after index ${lastIndex})`)

    if (newMessages.length === 0) {
      return { success: false, error: 'No new messages to summarize' }
    }

    // Build summary text - try AI summarization if config provided, fall back to simple
    let summary: string
    if (options.summarization) {
      console.log(`[Memory Service] Attempting AI summarization with ${options.summarization.provider}`)
      const aiSummary = await buildAISummary(newMessages, options.summarization)
      if (aiSummary) {
        summary = aiSummary
        console.log(`[Memory Service] AI summarization successful`)
      } else {
        console.log(`[Memory Service] AI summarization failed, using simple summary`)
        summary = buildSimpleSummary(newMessages)
      }
    } else {
      console.log(`[Memory Service] No API key provided, using simple summary`)
      summary = buildSimpleSummary(newMessages)
    }

    // Get participants
    const participants = conversation.participants as {
      bots?: string[]
      personas?: string[]
    } | null

    // Get user ID
    const userId = typeof conversation.user === 'object'
      ? conversation.user.id
      : conversation.user

    // Collect ALL bot IDs from participants (supports multi-bot conversations)
    const botIds: number[] = []
    if (participants?.bots?.length) {
      for (const botIdStr of participants.bots) {
        const parsed = parseInt(botIdStr)
        if (!isNaN(parsed)) botIds.push(parsed)
      }
    }
    // Fallback to bot_participation if no bots in participants
    if (botIds.length === 0 && conversation.bot_participation && Array.isArray(conversation.bot_participation)) {
      for (const participation of conversation.bot_participation) {
        const botParticipation = participation as { bot_id?: number }
        if (botParticipation.bot_id) botIds.push(botParticipation.bot_id)
      }
    }

    // Collect ALL persona IDs from participants
    const personaIds: number[] = []
    if (participants?.personas?.length) {
      for (const personaIdStr of participants.personas) {
        const parsed = parseInt(personaIdStr)
        if (!isNaN(parsed)) personaIds.push(parsed)
      }
    }

    console.log(`[Memory Service] Participants:`, JSON.stringify(participants))
    console.log(`[Memory Service] Bot participation:`, JSON.stringify(conversation.bot_participation))
    console.log(`[Memory Service] Collected bot IDs:`, botIds)
    console.log(`[Memory Service] Collected persona IDs:`, personaIds)

    // If no bots found, we can't create the memory (bot is required)
    if (botIds.length === 0) {
      console.error(`[Memory Service] No bots found for conversation ${conversationId}`)
      return { success: false, error: 'No bots found in conversation' }
    }

    // Find or create the memory tome for this conversation
    const memoryTome = await findOrCreateMemoryTome(payload, conversation, userId, botIds)

    // Calculate importance and emotional context for tagging
    const importance = calculateImportance(newMessages)
    const emotionalContext = extractEmotionalContext(newMessages)

    // Build tags array
    const tags: Array<{ tag: string }> = [
      { tag: 'auto-generated' },
      { tag: `importance-${importance}` },
    ]
    if (emotionalContext) {
      emotionalContext.split(', ').forEach(emotion => {
        tags.push({ tag: `mood-${emotion}` })
      })
    }

    // Check for duplicate memories before creating
    const duplicateCheck = await checkForDuplicateMemory(
      payload,
      userId,
      conversationId,
      summary
    )

    if (duplicateCheck.isDuplicate) {
      console.log(`[Memory Service] Skipping duplicate memory for conversation ${conversationId}`)
      return {
        success: false,
        error: `Similar memory already exists (ID: ${duplicateCheck.existingMemoryId})`,
      }
    }

    // Create lore entry in the tome
    console.log(`[Memory Service] Creating lore entry in tome "${memoryTome.name}" for conversation=${conversationId}`)
    const loreEntry = await payload.create({
      collection: 'knowledge',
      data: {
        user: userId,
        knowledge_collection: memoryTome.id,
        type: 'legacy_memory',
        entry: summary,
        tags,
        is_legacy_memory: true,
        source_conversation_id: conversationId,
        original_participants: {
          personas: participants?.personas || [],
          bots: participants?.bots || [],
        },
        memory_date_range: {
          start: newMessages[0]?.createdAt || new Date().toISOString(),
          end: newMessages[newMessages.length - 1]?.createdAt || new Date().toISOString(),
        },
        applies_to_bots: botIds,
        applies_to_personas: personaIds.length > 0 ? personaIds : undefined,
        tokens: Math.ceil(summary.length / 4), // Rough estimate
        activation_settings: {
          activation_mode: 'vector', // Semantic search for memories
          vector_similarity_threshold: 0.6,
          max_vector_results: 5,
          probability: 100,
          use_probability: false,
        },
        positioning: {
          position: 'after_character',
          order: 50, // Medium priority
        },
        privacy_settings: {
          privacy_level: 'private',
        },
      },
      overrideAccess: true,
    })
    console.log(`[Memory Service] Lore entry created with ID: ${loreEntry.id}`)

    // Update tome's knowledge count
    const currentCount = memoryTome.sharing_settings?.knowledge_count || 0
    await payload.update({
      collection: 'knowledgeCollections',
      id: memoryTome.id,
      data: {
        sharing_settings: {
          ...memoryTome.sharing_settings,
          knowledge_count: currentCount + 1,
          last_updated: new Date().toISOString(),
        },
      },
      overrideAccess: true,
    })

    // Update conversation
    await payload.update({
      collection: 'conversation',
      id: conversationId,
      data: {
        last_summarized_at: new Date().toISOString(),
        last_summarized_message_index: totalMessageCount,
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
      memoryId: loreEntry.id, // Now returns the lore entry ID
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
 * Build an AI-powered summary from messages
 * Returns null if AI call fails (caller should fall back to simple summary)
 */
async function buildAISummary(
  messages: Message[],
  config: SummarizationConfig
): Promise<string | null> {
  try {
    // Format messages for the summarization prompt
    const formattedMessages = messages.map(m => {
      const isBot = m.message_attribution?.is_ai_generated
      const speaker = isBot ? 'Bot' : 'User'
      return `${speaker}: ${m.entry || ''}`
    }).join('\n')

    // Build the summarization prompt
    const prompt = `You are a memory summarizer for a roleplay chat application. Summarize the following conversation into a concise memory that captures:
- Key topics discussed
- Important information shared
- Emotional tone of the conversation
- Any promises, plans, or significant moments

Keep the summary under 200 words. Write in third person, as if describing what happened in the conversation. Focus on what would be useful to remember for future conversations.

CONVERSATION:
${formattedMessages}

SUMMARY:`

    const response = await sendMessage(
      config.provider,
      {
        messages: [
          { role: 'user', content: prompt }
        ],
        model: config.model || 'gpt-4o-mini', // Use fast model for summarization
        temperature: 0.3, // Low temperature for consistent summaries
        maxTokens: 500,
      },
      { apiKey: config.apiKey }
    )

    if (response.content && response.content.trim().length > 0) {
      return response.content.trim()
    }

    return null
  } catch (error) {
    console.error('[Memory Service] AI summarization error:', error)
    return null
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
 * Importance signal patterns - things that indicate a conversation is significant
 */
const IMPORTANCE_SIGNALS = {
  // Personal revelations and self-disclosure
  personal: {
    patterns: [
      /\b(my (name|birthday|favorite|secret|fear|dream|hope|wish|story))\b/i,
      /\b(i('m| am) (from|born|raised|living))\b/i,
      /\b(tell you (something|about|a secret))\b/i,
      /\b(never told anyone|first time (i'?ve?|telling))\b/i,
      /\b(confession|confess|admit)\b/i,
      /\b(personal|private|intimate)\b/i,
    ],
    weight: 0.15,
  },
  // Commitments and promises
  commitments: {
    patterns: [
      /\b(promise[ds]?|swear|vow|pledge|commit)\b/i,
      /\b(i will (always|never)|i won't (ever|forget))\b/i,
      /\b(remember this|don't forget|keep this)\b/i,
      /\b(our secret|between us|just us)\b/i,
    ],
    weight: 0.12,
  },
  // Emotional intensity
  emotional: {
    patterns: [
      /\b(love|hate|adore|despise|cherish)\b/i,
      /\b(amazing|incredible|terrible|horrible|wonderful|awful)\b/i,
      /\b(best|worst) (day|moment|thing|time) (ever|of my life)\b/i,
      /\b(so (happy|sad|angry|scared|excited))\b/i,
      /\b(can't stop (thinking|feeling|crying|laughing))\b/i,
    ],
    weight: 0.1,
  },
  // Significant life events
  lifeEvents: {
    patterns: [
      /\b(married|engaged|pregnant|baby|child|born|died|passed away)\b/i,
      /\b(graduated|promotion|fired|hired|new job|retired)\b/i,
      /\b(moved|moving|new (home|house|apartment|place))\b/i,
      /\b(anniversary|birthday|holiday|celebration)\b/i,
      /\b(first (time|date|kiss|love))\b/i,
    ],
    weight: 0.15,
  },
  // Narrative and storytelling
  narrative: {
    patterns: [
      /\b(once upon a time|let me tell you|story|tale)\b/i,
      /\b(happened (to me|when)|this one time)\b/i,
      /\b(remember when|back when|years ago)\b/i,
      /\b(beginning|middle|end|finally|eventually)\b/i,
    ],
    weight: 0.08,
  },
  // Questions seeking deep engagement
  deepQuestions: {
    patterns: [
      /\b(what do you (think|feel|believe))\b/i,
      /\b(why do you|how do you|what made you)\b/i,
      /\b(what('s| is) (your|the meaning))\b/i,
      /\b(tell me (more|about yourself|everything))\b/i,
    ],
    weight: 0.08,
  },
  // Plans and future intentions
  plans: {
    patterns: [
      /\b(going to|gonna|will|planning to|want to)\b/i,
      /\b(tomorrow|next (week|month|year)|someday|eventually)\b/i,
      /\b(goal[s]?|dream[s]?|aspir(e|ation)|ambition)\b/i,
    ],
    weight: 0.06,
  },
}

/**
 * Calculate importance score for a set of messages (returns 1-10)
 * Uses multiple signals to determine how significant/memorable a conversation is
 */
function calculateImportance(messages: Message[]): number {
  let score = 0.3 // Base score (0-1 scale internally)

  const allText = messages.map(m => m.entry || '').join(' ')
  const textLower = allText.toLowerCase()

  // Factor 1: Conversation length and engagement
  const msgCount = messages.length
  if (msgCount >= 5) score += 0.05
  if (msgCount >= 10) score += 0.05
  if (msgCount >= 20) score += 0.05
  if (msgCount >= 30) score += 0.05

  // Factor 2: Average message length (longer messages = more engagement)
  const avgLength = allText.length / Math.max(msgCount, 1)
  if (avgLength > 100) score += 0.05
  if (avgLength > 200) score += 0.05

  // Factor 3: Back-and-forth engagement (both parties contributing)
  const userMsgs = messages.filter(m => !m.message_attribution?.is_ai_generated).length
  const botMsgs = messages.filter(m => m.message_attribution?.is_ai_generated).length
  const engagementRatio = Math.min(userMsgs, botMsgs) / Math.max(userMsgs, botMsgs, 1)
  if (engagementRatio > 0.5) score += 0.05 // Balanced conversation

  // Factor 4: Check importance signals
  for (const [, config] of Object.entries(IMPORTANCE_SIGNALS)) {
    let signalMatches = 0
    for (const pattern of config.patterns) {
      const matches = allText.match(new RegExp(pattern.source, 'gi'))
      if (matches) {
        signalMatches += matches.length
      }
    }
    // Add weighted score (diminishing returns for many matches)
    if (signalMatches > 0) {
      score += config.weight * Math.min(signalMatches, 3) / 3
    }
  }

  // Factor 5: Punctuation indicating emotional engagement
  const exclamations = (allText.match(/!/g) || []).length
  const questions = (allText.match(/\?/g) || []).length
  score += Math.min(exclamations * 0.01, 0.05)
  score += Math.min(questions * 0.01, 0.05)

  // Factor 6: Presence of names (personalization)
  const namePatterns = /\b[A-Z][a-z]+\b/g
  const possibleNames = allText.match(namePatterns) || []
  const uniqueNames = new Set(possibleNames.filter(n =>
    !['The', 'This', 'That', 'What', 'When', 'Where', 'How', 'Why', 'But', 'And', 'Yes', 'No'].includes(n)
  ))
  if (uniqueNames.size > 0) score += 0.05

  // Factor 7: Emoji usage (emotional expression)
  const emojiPattern = /[\u{1F300}-\u{1F9FF}]/gu
  const emojis = allText.match(emojiPattern) || []
  if (emojis.length > 0) score += Math.min(emojis.length * 0.02, 0.08)

  // Factor 8: Check for detected emotions (reuse emotion patterns)
  let emotionCount = 0
  for (const [, config] of Object.entries(EMOTION_PATTERNS)) {
    for (const pattern of config.patterns) {
      if (pattern.test(allText)) {
        emotionCount++
        break // Count each emotion category once
      }
    }
  }
  score += Math.min(emotionCount * 0.03, 0.15)

  // Cap at 1.0 and scale to 1-10 range
  const normalized = Math.min(Math.max(score, 0), 1.0)
  return Math.round(normalized * 9) + 1 // Maps 0-1 to 1-10
}

/**
 * Emotion detection configuration
 * Each emotion has a list of trigger words/phrases and a weight
 */
const EMOTION_PATTERNS: Record<string, { patterns: RegExp[], weight: number }> = {
  joyful: {
    patterns: [
      /\b(happy|joy(ful)?|excited|thrilled|delighted|elated|ecstatic|overjoyed|blissful|gleeful)\b/i,
      /\b(wonderful|amazing|fantastic|incredible|awesome|brilliant|marvelous)\b/i,
      /\b(laugh(ing|ed)?|smile[ds]?|grin(ning|ned)?|beam(ing|ed)?)\b/i,
      /\b(yay|woohoo|hurray|hooray)\b/i,
      /[😊😃😄😁🎉🥳]/,
    ],
    weight: 1,
  },
  melancholic: {
    patterns: [
      /\b(sad|unhappy|depressed|down|blue|gloomy|sorrowful|heartbroken|grief|mourning)\b/i,
      /\b(disappointed|let down|disheartened|dejected|crestfallen|despondent)\b/i,
      /\b(cry(ing)?|cried|tears?|weep(ing)?|sob(bing)?)\b/i,
      /\b(miss(ing)?|missed|long(ing)?|yearn(ing)?|nostalgic)\b/i,
      /\b(lonely|alone|isolated|abandoned)\b/i,
      /[😢😭💔😞😔]/,
    ],
    weight: 1,
  },
  tense: {
    patterns: [
      /\b(angry|furious|enraged|livid|irate|outraged|seething)\b/i,
      /\b(frustrated|annoyed|irritated|aggravated|exasperated)\b/i,
      /\b(hate|despise|loathe|detest|resent)\b/i,
      /\b(argue[ds]?|arguing|fight(ing)?|fought|conflict|clash)\b/i,
      /\b(yell(ing|ed)?|shout(ing|ed)?|scream(ing|ed)?)\b/i,
      /[😠😡🤬💢]/,
    ],
    weight: 1,
  },
  romantic: {
    patterns: [
      /\b(love[ds]?|loving|adore[ds]?|cherish(es)?|devoted)\b/i,
      /\b(affection(ate)?|tender(ness)?|fond(ness)?|caring)\b/i,
      /\b(kiss(ed|ing)?|embrace[ds]?|hug(ged|ging)?|cuddle[ds]?)\b/i,
      /\b(darling|sweetheart|beloved|dear|honey)\b/i,
      /\b(romance|romantic|passion(ate)?|intimate|flirt(ing)?)\b/i,
      /[❤️💕💗💖😍🥰💋]/,
    ],
    weight: 1,
  },
  anxious: {
    patterns: [
      /\b(scared|afraid|frightened|terrified|fearful|petrified)\b/i,
      /\b(worried|anxious|nervous|uneasy|apprehensive|dread(ing)?)\b/i,
      /\b(panic(king)?|panicked|stress(ed)?|tense|on edge)\b/i,
      /\b(uncertain|unsure|doubt(ful)?|hesitant)\b/i,
      /[😰😨😱😟😧]/,
    ],
    weight: 1,
  },
  curious: {
    patterns: [
      /\b(curious|intrigued|fascinated|interested|wondering)\b/i,
      /\b(wonder(ing)?|ponder(ing)?|contemplate|muse[ds]?)\b/i,
      /\b(what if|how come|why would|tell me (more|about))\b/i,
      /\b(explore|discover|investigate|learn(ing)?)\b/i,
      /[🤔🧐❓]/,
    ],
    weight: 1,
  },
  playful: {
    patterns: [
      /\b(funny|hilarious|amusing|comical|humorous)\b/i,
      /\b(joke[ds]?|joking|tease[ds]?|teasing|banter)\b/i,
      /\b(silly|goofy|playful|mischievous|whimsical)\b/i,
      /\b(lol|lmao|haha|hehe|rofl)\b/i,
      /[😂🤣😜😝😛🤪]/,
    ],
    weight: 1,
  },
  surprised: {
    patterns: [
      /\b(surprised|shocked|astonished|amazed|stunned|startled)\b/i,
      /\b(unexpected|unbelievable|wow|whoa|omg|no way)\b/i,
      /\b(can't believe|didn't expect|out of nowhere)\b/i,
      /[😮😲🤯😳]/,
    ],
    weight: 1,
  },
  grateful: {
    patterns: [
      /\b(thank(s|ful|ing)?|grateful|appreciat(e|ive|ion))\b/i,
      /\b(blessed|fortunate|lucky)\b/i,
      /[🙏💝🤗]/,
    ],
    weight: 1,
  },
  reflective: {
    patterns: [
      /\b(remember(ing)?|recall(ing)?|reminisce|reflect(ing)?)\b/i,
      /\b(thought(s)?|thinking|ponder(ing)?|consider(ing)?)\b/i,
      /\b(realize[ds]?|understand|insight|perspective)\b/i,
      /\b(meaningful|significant|important to me)\b/i,
    ],
    weight: 1,
  },
}

/**
 * Extract emotional context from messages using enhanced pattern matching
 * Returns a comma-separated string of detected emotions, prioritized by frequency
 */
function extractEmotionalContext(messages: Message[]): string | null {
  const allText = messages.map(m => m.entry || '').join(' ')

  // Count matches for each emotion
  const emotionScores: Record<string, number> = {}

  for (const [emotion, config] of Object.entries(EMOTION_PATTERNS)) {
    let score = 0
    for (const pattern of config.patterns) {
      const matches = allText.match(new RegExp(pattern.source, 'gi'))
      if (matches) {
        score += matches.length * config.weight
      }
    }
    if (score > 0) {
      emotionScores[emotion] = score
    }
  }

  // Sort emotions by score and take top 3
  const sortedEmotions = Object.entries(emotionScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([emotion]) => emotion)

  return sortedEmotions.length > 0 ? sortedEmotions.join(', ') : null
}

/**
 * Consolidate related memories for a user/bot combination
 * Finds memories with similar content and merges them into consolidated entries
 *
 * @param payload - Payload CMS instance
 * @param userId - User ID to consolidate memories for
 * @param options - Consolidation options
 * @returns Result with count of memories consolidated
 */
export async function consolidateMemories(
  payload: Payload,
  userId: number,
  options: {
    botId?: number
    collectionId?: number
    similarityThreshold?: number
    maxMemoriesToProcess?: number
    summarization?: SummarizationConfig
  } = {}
): Promise<{
  success: boolean
  consolidated: number
  grouped: number
  error?: string
}> {
  const {
    botId,
    collectionId,
    similarityThreshold = 0.5,
    maxMemoriesToProcess = 100,
    summarization,
  } = options

  try {
    console.log(`[Memory Service] Starting memory consolidation for user ${userId}`)

    // Build query for memories to consolidate
    const whereClause: Record<string, unknown> = {
      user: { equals: userId },
      is_legacy_memory: { equals: true },
    }

    if (botId) {
      whereClause.applies_to_bots = { contains: botId }
    }

    if (collectionId) {
      whereClause.knowledge_collection = { equals: collectionId }
    }

    // Fetch memories sorted by creation date
    const memories = await payload.find({
      collection: 'knowledge',
      where: whereClause,
      limit: maxMemoriesToProcess,
      sort: 'createdAt',
      overrideAccess: true,
    })

    if (memories.docs.length < 2) {
      return { success: true, consolidated: 0, grouped: 0, error: 'Not enough memories to consolidate' }
    }

    console.log(`[Memory Service] Found ${memories.docs.length} memories to analyze`)

    // Group memories by similarity
    const groups: Array<typeof memories.docs> = []
    const processed = new Set<number>()

    for (const memory of memories.docs) {
      if (processed.has(memory.id)) continue

      const group = [memory]
      processed.add(memory.id)

      const memoryKeywords = extractKeywords(memory.entry || '')

      // Find similar memories
      for (const otherMemory of memories.docs) {
        if (processed.has(otherMemory.id)) continue
        if (memory.id === otherMemory.id) continue

        const otherKeywords = extractKeywords(otherMemory.entry || '')
        const similarity = calculateKeywordSimilarity(memoryKeywords, otherKeywords)

        if (similarity >= similarityThreshold) {
          group.push(otherMemory)
          processed.add(otherMemory.id)
        }
      }

      // Only create groups with multiple memories
      if (group.length > 1) {
        groups.push(group)
      }
    }

    console.log(`[Memory Service] Found ${groups.length} groups of similar memories`)

    if (groups.length === 0) {
      return { success: true, consolidated: 0, grouped: 0, error: 'No similar memories found to consolidate' }
    }

    let consolidatedCount = 0

    // Merge each group into a single consolidated memory
    for (const group of groups) {
      try {
        // Combine entries from all memories in the group
        const combinedEntries = group.map(m => m.entry || '').join('\n\n---\n\n')

        // Generate consolidated summary
        let consolidatedSummary: string
        if (summarization) {
          // Use AI to create a cohesive summary
          const aiSummary = await createConsolidatedSummary(combinedEntries, summarization)
          consolidatedSummary = aiSummary || `Consolidated memory from ${group.length} related entries:\n${combinedEntries.slice(0, 500)}...`
        } else {
          // Simple concatenation with header
          consolidatedSummary = `Consolidated memory from ${group.length} related entries:\n${combinedEntries}`
        }

        // Get the collection from the first memory
        const firstMemory = group[0]
        const collId = typeof firstMemory.knowledge_collection === 'object'
          ? firstMemory.knowledge_collection?.id
          : firstMemory.knowledge_collection

        // Calculate max importance from group
        let maxImportance = 5
        for (const mem of group) {
          const tags = mem.tags || []
          const importanceTag = tags.find(t => t.tag?.startsWith('importance-'))
          if (importanceTag?.tag) {
            const parsed = parseInt(importanceTag.tag.replace('importance-', ''), 10)
            if (!isNaN(parsed) && parsed > maxImportance) {
              maxImportance = parsed
            }
          }
        }

        // Collect all emotional contexts
        const allEmotions = new Set<string>()
        for (const mem of group) {
          const tags = mem.tags || []
          for (const tag of tags) {
            if (tag.tag?.startsWith('mood-')) {
              allEmotions.add(tag.tag.replace('mood-', ''))
            }
          }
        }

        // Build tags for consolidated memory
        const consolidatedTags: { tag: string }[] = [
          { tag: 'consolidated' },
          { tag: `importance-${maxImportance}` },
          { tag: `merged-from-${group.length}` },
        ]
        allEmotions.forEach(emotion => {
          consolidatedTags.push({ tag: `mood-${emotion}` })
        })

        // Collect all bot IDs
        const allBotIds = new Set<number>()
        for (const mem of group) {
          const botIds = mem.applies_to_bots || []
          for (const bid of botIds) {
            const id = typeof bid === 'object' ? bid.id : bid
            if (id) allBotIds.add(id)
          }
        }

        // Create consolidated memory entry
        await payload.create({
          collection: 'knowledge',
          data: {
            user: userId,
            knowledge_collection: collId,
            type: 'legacy_memory',
            entry: consolidatedSummary,
            tags: consolidatedTags,
            is_legacy_memory: true,
            applies_to_bots: Array.from(allBotIds),
            tokens: Math.ceil(consolidatedSummary.length / 4),
            activation_settings: {
              activation_mode: 'vector',
              vector_similarity_threshold: 0.6,
              max_vector_results: 5,
              probability: 100,
              use_probability: false,
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

        // Delete the original memories that were consolidated
        for (const mem of group) {
          await payload.delete({
            collection: 'knowledge',
            id: mem.id,
            overrideAccess: true,
          })
        }

        consolidatedCount++
        console.log(`[Memory Service] Consolidated group of ${group.length} memories`)
      } catch (groupError) {
        console.error('[Memory Service] Error consolidating group:', groupError)
      }
    }

    return {
      success: true,
      consolidated: consolidatedCount,
      grouped: groups.reduce((sum, g) => sum + g.length, 0),
    }
  } catch (error) {
    console.error('[Memory Service] Consolidation error:', error)
    return {
      success: false,
      consolidated: 0,
      grouped: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Create a consolidated summary from multiple memory entries using AI
 */
async function createConsolidatedSummary(
  combinedEntries: string,
  config: SummarizationConfig
): Promise<string | null> {
  try {
    const prompt = `You are a memory consolidation assistant. Multiple related memories have been identified that should be merged into a single, cohesive summary.

Combine these related memory entries into one clear, concise summary that:
- Preserves all important information
- Eliminates redundancy
- Maintains a coherent narrative
- Keeps the summary under 300 words

MEMORY ENTRIES TO CONSOLIDATE:
${combinedEntries}

CONSOLIDATED SUMMARY:`

    const response = await sendMessage(
      config.provider,
      {
        messages: [{ role: 'user', content: prompt }],
        model: config.model || 'gpt-4o-mini',
        temperature: 0.3,
        maxTokens: 600,
      },
      { apiKey: config.apiKey }
    )

    return response.content?.trim() || null
  } catch (error) {
    console.error('[Memory Service] AI consolidation error:', error)
    return null
  }
}

/**
 * Helper function to extract importance from knowledge entry tags
 * Tags are stored as: { tag: 'importance-7' }
 */
function extractImportanceFromTags(tags?: { tag?: string | null }[] | null): number {
  if (!tags) return 5
  const importanceTag = tags.find(t => t.tag?.startsWith('importance-'))
  if (!importanceTag?.tag) return 5
  const importance = parseInt(importanceTag.tag.replace('importance-', ''), 10)
  return isNaN(importance) ? 5 : importance
}

/**
 * Helper function to extract emotional context from knowledge entry tags
 * Tags are stored as: { tag: 'mood-joyful' }, { tag: 'mood-romantic' }
 */
function extractEmotionalContextFromTags(tags?: { tag?: string | null }[] | null): string | null {
  if (!tags) return null
  const moodTags = tags.filter(t => t.tag?.startsWith('mood-'))
  if (moodTags.length === 0) return null
  return moodTags.map(t => t.tag?.replace('mood-', '')).filter(Boolean).join(', ')
}

/**
 * Interface for retrieved memories (normalized from Knowledge entries)
 */
export interface RetrievedMemory {
  id: number
  entry: string | null
  importance: number
  emotional_context: string | null
  createdAt: string
  tags?: Array<{ tag?: string | null }>
  source_conversation_id?: number | null
  applies_to_bots?: number[] | null
}

/**
 * Retrieve relevant memories for a conversation
 * Queries the knowledge collection for legacy memories (is_legacy_memory: true)
 * These are auto-generated summaries from past conversations
 */
export async function retrieveRelevantMemories(
  payload: Payload,
  userId: number,
  botId: number,
  options: {
    personaId?: number
    conversationId?: number // Prioritize memories from this conversation
    limit?: number
    minImportance?: number // 1-10 scale
  } = {}
): Promise<RetrievedMemory[]> {
  const { personaId, conversationId, limit = 5, minImportance = 3 } = options

  // Helper to transform knowledge docs to RetrievedMemory format
  const transformDoc = (doc: Knowledge): RetrievedMemory => {
    const importance = extractImportanceFromTags(doc.tags)
    const emotional_context = extractEmotionalContextFromTags(doc.tags)
    const docBotIds = doc.applies_to_bots?.map((b: number | { id: number }) =>
      typeof b === 'object' ? b.id : b
    ).filter((id: number | null | undefined): id is number => id != null) || null
    const docConvId = typeof doc.source_conversation_id === 'object'
      ? doc.source_conversation_id?.id
      : doc.source_conversation_id
    return {
      id: doc.id,
      entry: doc.entry,
      importance,
      emotional_context,
      createdAt: doc.createdAt,
      tags: doc.tags,
      source_conversation_id: docConvId,
      applies_to_bots: docBotIds,
    }
  }

  // PRIMARY: Memories from THIS conversation (bot-agnostic — fixes bot-switching issue)
  const sameConvResult = conversationId
    ? await payload.find({
        collection: 'knowledge',
        where: {
          user: { equals: userId },
          is_legacy_memory: { equals: true },
          source_conversation_id: { equals: conversationId },
        },
        sort: '-createdAt',
        limit: limit,
        overrideAccess: true,
      })
    : { docs: [] as Knowledge[] }

  const sameConvIds = new Set(sameConvResult.docs.map(d => d.id))

  // SECONDARY: Bot-scoped memories from OTHER conversations (cross-conversation knowledge)
  const remainingSlots = limit - sameConvResult.docs.length
  let crossConvDocs: Knowledge[] = []

  if (remainingSlots > 0) {
    const crossConvWhere: Record<string, unknown> = {
      user: { equals: userId },
      is_legacy_memory: { equals: true },
      applies_to_bots: { contains: botId },
    }
    // Exclude same-conversation memories we already fetched
    if (conversationId) {
      crossConvWhere.source_conversation_id = { not_equals: conversationId }
    }
    if (personaId) {
      crossConvWhere.applies_to_personas = { contains: personaId }
    }

    const crossConvResult = await payload.find({
      collection: 'knowledge',
      where: crossConvWhere,
      sort: '-createdAt',
      limit: remainingSlots * 2, // Fetch extra to filter by importance
      overrideAccess: true,
    })
    crossConvDocs = crossConvResult.docs.filter(d => !sameConvIds.has(d.id))
  }

  // Merge: same-conversation first (most relevant), then cross-conversation
  const allDocs = [...sameConvResult.docs, ...crossConvDocs]
  const transformed = allDocs.map(transformDoc)

  // Filter by minimum importance and sort by importance desc
  const filtered = transformed
    .filter(m => m.importance >= minImportance)
    .sort((a, b) => {
      if (b.importance !== a.importance) return b.importance - a.importance
      const dateA = new Date(a.createdAt || 0).getTime()
      const dateB = new Date(b.createdAt || 0).getTime()
      return dateB - dateA
    })
    .slice(0, limit)

  return filtered
}
