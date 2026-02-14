/**
 * Chat Context Builder
 *
 * Builds the complete context for an LLM call including:
 * - System prompt with bot personality
 * - Knowledge/lore entries from activation engine
 * - Conversation history
 * - Persona context
 * - Natural conversation instructions
 */

import type { Payload } from 'payload'
import type { Bot, Persona, Conversation, Message, User } from '@/payload-types'
import type { ChatMessage } from '@/lib/llm'
import { ActivationEngine } from '@/lib/knowledge-activation/activation-engine'
import { PromptBuilder } from '@/lib/knowledge-activation/prompt-builder'
import { retrieveRelevantMemories } from '@/lib/chat/memory-service'
import { getAllPrompts, getPrompt } from '@/lib/chat/system-prompts'

export interface BuildContextParams {
  payload: Payload
  userId: number
  conversation: Conversation
  bot: Bot
  persona: Persona | null
  /** User profile - used when no persona is selected */
  user?: User | null
  recentMessages: Message[]
  /** Additional bots in multi-bot conversations */
  additionalBots?: Bot[]
  env?: {
    VECTORIZE?: unknown
    AI?: unknown
  }
}

export interface ChatContext {
  messages: ChatMessage[]
  systemPrompt: string
  activatedLoreCount: number
  retrievedMemoriesCount: number
  totalTokensEstimate: number
}

/**
 * Build the complete chat context for an LLM call
 */
export async function buildChatContext(params: BuildContextParams): Promise<ChatContext> {
  const { payload, userId, conversation, bot, persona, user, recentMessages, additionalBots, env } = params

  console.log('[Context Builder] ========== CONTEXT BUILD START ==========')
  console.log('[Context Builder] Conversation ID:', conversation.id)
  console.log('[Context Builder] Bot:', bot.name, '(ID:', bot.id, ')')
  console.log('[Context Builder] Persona:', persona ? `${persona.name} (ID: ${persona.id})` : 'None')
  console.log('[Context Builder] User ID:', userId)
  console.log('[Context Builder] Recent messages count:', recentMessages.length)
  console.log('[Context Builder] Additional bots:', additionalBots?.map(b => b.name).join(', ') || 'None')

  // Build base system prompt from bot (includes user/persona context)
  let systemPrompt = await buildBotSystemPrompt(payload, bot, persona, user, additionalBots)
  console.log('[Context Builder] Base system prompt length:', systemPrompt.length, 'chars')

  // Try to activate knowledge entries
  let activatedLoreCount = 0

  try {
    // Get the user's message (last user message in recent messages)
    const lastUserMessage = [...recentMessages].reverse().find(
      m => !m.message_attribution?.is_ai_generated
    )

    if (lastUserMessage) {
      const engine = new ActivationEngine()

      // Extract bot's linked knowledge collection IDs for isolation
      const botKnowledgeCollectionIds = (bot.knowledge_collections || []).map((col) =>
        typeof col === 'object' && col !== null ? Number(col.id) : Number(col)
      ).filter((id) => !isNaN(id))

      console.log('[Context Builder] Bot knowledge collections:', botKnowledgeCollectionIds.length, 'collections')

      // Build activation context
      const activationResult = await engine.activate({
        payload,
        userId: userId,
        conversationId: String(conversation.id),
        currentMessageIndex: conversation.conversation_metadata?.total_messages || 0,
        messages: recentMessages,
        filters: {
          userId: userId,
          currentBotId: bot.id,
          currentPersonaId: persona ? persona.id : undefined,
          // Knowledge isolation: only activate entries from bot's linked collections
          botKnowledgeCollectionIds,
        },
        budgetConfig: {
          maxContextTokens: 8000,
          budgetPercentage: 25,
          budgetCapTokens: 2000,
          reservedForConversation: 4000,
          minActivations: 0,
        },
        env,
      })

      // If we have activated entries, insert them into the prompt
      if (activationResult.activatedEntries.length > 0) {
        console.log('[Context Builder] Lore activation results:')
        console.log('[Context Builder]   - Activated entries:', activationResult.activatedEntries.length)
        console.log('[Context Builder]   - Entry types:', activationResult.activatedEntries.map(e => e.entry?.type || 'unknown').join(', '))
        console.log('[Context Builder]   - Activation methods:', activationResult.activatedEntries.map(e => e.activationMethod).join(', '))
        console.log('[Context Builder]   - Token budget used:', activationResult.totalTokens)

        const promptBuilder = new PromptBuilder()
        systemPrompt = promptBuilder.buildPrompt(
          systemPrompt,
          activationResult.activatedEntries,
          bot,
          persona || undefined
        )
        activatedLoreCount = activationResult.activatedEntries.length
        console.log('[Context Builder]   - System prompt after lore:', systemPrompt.length, 'chars')
      } else {
        console.log('[Context Builder] No lore entries activated')
      }
    }
  } catch (error) {
    // Extract underlying error from ActivationError wrapper
    const underlyingError = (error as { details?: { error?: unknown } })?.details?.error
    const errorCode = (error as { code?: string })?.code
    console.error('[Context Builder] Knowledge activation error:', {
      message: error instanceof Error ? error.message : String(error),
      code: errorCode,
      underlyingError: underlyingError instanceof Error
        ? { message: underlyingError.message, stack: underlyingError.stack }
        : underlyingError,
    })
    // Continue without lore - don't fail the chat
  }

  // Retrieve relevant memories for this bot/user/persona combination
  let retrievedMemoriesCount = 0
  try {
    const memories = await retrieveRelevantMemories(payload, userId, bot.id, {
      personaId: persona?.id,
      conversationId: conversation.id,
      limit: 5,
      minImportance: 3,
    })

    if (memories.length > 0) {
      retrievedMemoriesCount = memories.length
      console.log('[Context Builder] Memory retrieval results:')
      console.log('[Context Builder]   - Retrieved memories:', memories.length)
      console.log('[Context Builder]   - Memory importance levels:', memories.map(m => m.importance || 'n/a').join(', '))
      console.log('[Context Builder]   - Emotional contexts:', memories.map(m => m.emotional_context || 'none').join(', '))

      // Format memories for injection into prompt
      const memorySection = formatMemoriesForPrompt(memories)

      // Inject memories into the system prompt before the roleplay guidelines
      const guidelinesMarker = '--- Roleplay Guidelines ---'
      const guidelinesIndex = systemPrompt.indexOf(guidelinesMarker)

      if (guidelinesIndex !== -1) {
        systemPrompt =
          systemPrompt.slice(0, guidelinesIndex) +
          memorySection + '\n\n' +
          systemPrompt.slice(guidelinesIndex)
      } else {
        // Fallback: append to end if marker not found
        systemPrompt += '\n\n' + memorySection
      }
    }
  } catch (error) {
    console.error('Memory retrieval error:', error)
    // Continue without memories - don't fail the chat
  }

  // Inject conversation summary (bot-agnostic bridge to content outside message window)
  const conversationSummary = (conversation.conversation_metadata as Record<string, unknown>)?.conversation_summary as string | undefined
  if (conversationSummary) {
    const summarySection = [
      '--- Previous Conversation Context ---',
      'Here is a summary of what happened earlier in this conversation (before the messages shown below):',
      '',
      conversationSummary,
      '',
      'Use this context naturally. The messages below are the most recent part of the conversation.',
    ].join('\n')

    const knowledgeMarker = '--- Knowledge & Context ---'
    const knowledgeIndex = systemPrompt.indexOf(knowledgeMarker)
    if (knowledgeIndex !== -1) {
      systemPrompt = systemPrompt.slice(0, knowledgeIndex) + summarySection + '\n\n' + systemPrompt.slice(knowledgeIndex)
    } else {
      systemPrompt += '\n\n' + summarySection
    }
    console.log('[Context Builder] Injected conversation summary:', conversationSummary.length, 'chars')
  }

  // Build message array
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: systemPrompt,
    },
  ]

  // Add conversation history
  // For multi-bot conversations, messages from OTHER bots should be represented
  // as "user" messages with the bot's name prefix, so the LLM knows they weren't its own responses
  console.log(`[Context Builder] Building context for bot: ${bot.name} (ID: ${bot.id})`)

  for (const msg of recentMessages) {
    const isAI = msg.message_attribution?.is_ai_generated
    const content = msg.entry || ''

    if (!content) continue

    if (isAI) {
      // Get the bot ID from this message - convert to numbers for reliable comparison
      const msgBotId = typeof msg.bot === 'object' ? Number(msg.bot?.id) : Number(msg.bot)
      const msgBotName = typeof msg.bot === 'object' ? msg.bot?.name : undefined
      const currentBotId = Number(bot.id)

      // Check if this message was from the current responding bot or a different bot
      const isFromCurrentBot = msgBotId === currentBotId

      console.log(`[Context Builder] AI message from bot ID ${msgBotId} (${msgBotName}), current bot ID ${currentBotId}, isFromCurrentBot: ${isFromCurrentBot}`)

      if (isFromCurrentBot) {
        // This bot's own previous messages - use 'assistant' role
        messages.push({
          role: 'assistant',
          content,
        })
      } else {
        // Another bot's message - represent as a character speaking
        // This helps the LLM understand it shouldn't continue this character's voice
        messages.push({
          role: 'user',
          content: `[${msgBotName || 'Other character'}]: ${content}`,
        })
      }
    } else {
      // User message
      messages.push({
        role: 'user',
        content,
        name: persona?.name,
      })
    }
  }

  console.log(`[Context Builder] Final message count: ${messages.length}, roles: ${messages.map(m => m.role).join(', ')}`)

  // Estimate tokens (rough)
  let totalTokensEstimate = 0
  for (const msg of messages) {
    totalTokensEstimate += Math.ceil(msg.content.length / 4) + 4
  }
  totalTokensEstimate += 3 // Conversation overhead

  // Final context summary
  console.log('[Context Builder] ========== CONTEXT BUILD COMPLETE ==========')
  console.log('[Context Builder] Final system prompt length:', systemPrompt.length, 'chars')
  console.log('[Context Builder] Total messages:', messages.length)
  console.log('[Context Builder] Activated lore entries:', activatedLoreCount)
  console.log('[Context Builder] Retrieved memories:', retrievedMemoriesCount)
  console.log('[Context Builder] Estimated tokens:', totalTokensEstimate)
  console.log('[Context Builder] Message breakdown:')
  messages.forEach((msg, i) => {
    const preview = msg.content.substring(0, 100).replace(/\n/g, '\\n')
    console.log(`[Context Builder]   [${i}] ${msg.role}: "${preview}${msg.content.length > 100 ? '...' : ''}" (${msg.content.length} chars)`)
  })
  console.log('[Context Builder] ========== END CONTEXT ==========')

  return {
    messages,
    systemPrompt,
    activatedLoreCount,
    retrievedMemoriesCount,
    totalTokensEstimate,
  }
}

/**
 * Build the base system prompt from bot and persona/user
 * Uses configurable prompts from the database with fallbacks to defaults
 */
async function buildBotSystemPrompt(
  payload: Payload,
  bot: Bot,
  persona: Persona | null,
  user?: User | null,
  additionalBots?: Bot[]
): Promise<string> {
  const parts: string[] = []

  // Determine user name for {{user}} placeholder
  const userName = persona?.name || user?.nickname || 'the user'

  // Fetch all configurable prompts at once (cached)
  // Supports both {{bot_name}}/{{char}} and {{user_name}}/{{user}} placeholders
  const prompts = await getAllPrompts(payload, { bot_name: bot.name, user_name: userName })

  // === ROLEPLAY INSTRUCTIONS (configurable) ===
  parts.push(prompts.roleplay_intro)

  // === BOT'S CUSTOM SYSTEM PROMPT ===
  // This is the creator's core instruction for this specific bot
  if (bot.system_prompt) {
    parts.push(`\n\n${bot.system_prompt}`)
  }

  // Bot description/backstory
  if (bot.description) {
    parts.push(`\n${bot.description}`)
  }

  // Bot demographics
  if (bot.gender || bot.age) {
    const details: string[] = []
    if (bot.gender) details.push(`gender: ${bot.gender}`)
    if (bot.age) details.push(`age: ${bot.age}`)
    parts.push(`\n${bot.name}'s ${details.join(', ')}.`)
  }

  // === CHARACTER PERSONALITY ===
  if (bot.personality_traits) {
    const traits: string[] = []

    if (bot.personality_traits.tone) {
      traits.push(`tone is ${bot.personality_traits.tone}`)
    }
    if (bot.personality_traits.formality_level) {
      traits.push(`formality is ${bot.personality_traits.formality_level}`)
    }
    if (bot.personality_traits.humor_style) {
      traits.push(`humor style is ${bot.personality_traits.humor_style}`)
    }
    if (bot.personality_traits.communication_style) {
      traits.push(`communication style is ${bot.personality_traits.communication_style}`)
    }

    if (traits.length > 0) {
      parts.push(`\nYour ${traits.join(', ')}.`)
    }
  }

  // === BEHAVIOR SETTINGS ===
  if (bot.behavior_settings) {
    const behaviors: string[] = []

    if (bot.behavior_settings.response_length) {
      behaviors.push(`Keep your responses ${bot.behavior_settings.response_length}.`)
    }
    if (bot.behavior_settings.creativity_level) {
      behaviors.push(`Be ${bot.behavior_settings.creativity_level} in your responses.`)
    }
    if (bot.behavior_settings.knowledge_sharing) {
      behaviors.push(`Be ${bot.behavior_settings.knowledge_sharing} with sharing information and knowledge.`)
    }

    if (behaviors.length > 0) {
      parts.push('\n' + behaviors.join(' '))
    }
  }

  // === SPEECH EXAMPLES ===
  if (bot.speech_examples && bot.speech_examples.length > 0) {
    const examples = bot.speech_examples
      .filter(e => e.example)
      .map(e => `"${e.example}"`)
      .slice(0, 3)
      .join('\n')

    if (examples) {
      parts.push(`\nExamples of how ${bot.name} speaks:\n${examples}`)
    }
  }

  // === SIGNATURE PHRASES ===
  if (bot.signature_phrases && bot.signature_phrases.length > 0) {
    const phrases = bot.signature_phrases
      .filter(p => p.phrase)
      .map(p => p.phrase)
      .slice(0, 5)
      .join(', ')

    if (phrases) {
      parts.push(`\n${bot.name} sometimes uses phrases like: ${phrases}`)
    }
  }

  // === GREETING STYLE ===
  if (bot.greeting) {
    parts.push(`\nWhen greeting someone, ${bot.name} might say something like: "${bot.greeting}"`)
  }

  // === USER CONTEXT (persona or user profile) ===
  if (persona) {
    // User is acting as a persona
    parts.push(`\n\n--- User Context ---`)
    parts.push(`The user's name is ${persona.name}.`)

    if (persona.pronouns) {
      const pronounText = persona.pronouns === 'other'
        ? persona.custom_pronouns || 'they/them'
        : persona.pronouns
      parts.push(`Their pronouns are ${pronounText}.`)
    }

    if (persona.description) {
      parts.push(`\nAbout the user: ${persona.description}`)
    }

    if (persona.gender || persona.age) {
      const details: string[] = []
      if (persona.gender) details.push(`gender: ${persona.gender}`)
      if (persona.age) details.push(`age: ${persona.age}`)
      parts.push(`User details: ${details.join(', ')}`)
    }

    // Interaction preferences
    if (persona.interaction_preferences) {
      if (persona.interaction_preferences.preferred_topics?.length) {
        const topics = persona.interaction_preferences.preferred_topics
          .map((t) => t.topic)
          .filter(Boolean)
          .join(', ')
        if (topics) parts.push(`The user enjoys discussing: ${topics}`)
      }
      if (persona.interaction_preferences.avoid_topics?.length) {
        const topics = persona.interaction_preferences.avoid_topics
          .map((t) => t.topic)
          .filter(Boolean)
          .join(', ')
        if (topics) parts.push(`Topics to avoid with this user: ${topics}`)
      }
    }

    // Custom instructions from persona creator
    if (persona.custom_instructions) {
      parts.push(`\nAdditional instructions for interacting with ${persona.name}:\n${persona.custom_instructions}`)
    }
  } else if (user) {
    // User is speaking as themselves (no persona) - use profile info
    // IMPORTANT: Only use nickname (user-set display name), never user.name
    // which may contain private account info like firstName/lastName from Clerk
    const hasUserInfo = user.nickname || user.pronouns || user.description
    if (hasUserInfo) {
      parts.push(`\n\n--- User Context ---`)

      // Only use nickname - this is explicitly set by the user for bot interactions
      if (user.nickname) {
        parts.push(`The user should be called ${user.nickname}.`)
      }

      if (user.pronouns) {
        const pronounText = user.pronouns === 'other'
          ? user.custom_pronouns || 'they/them'
          : user.pronouns
        parts.push(`Their pronouns are ${pronounText}.`)
      }

      if (user.description) {
        parts.push(`\nAbout the user: ${user.description}`)
      }
    }
  }

  // === MULTI-BOT CONTEXT (configurable) ===
  if (additionalBots && additionalBots.length > 0) {
    parts.push(`\n\n--- Other Characters ---`)
    const otherBotsList = additionalBots
      .map(otherBot => `- ${otherBot.name}${otherBot.description ? `: ${otherBot.description.slice(0, 100)}...` : ''}`)
      .join('\n')
    const multiBotPrompt = prompts.multibot_instructions.replace('{{other_bots}}', otherBotsList)
    parts.push(multiBotPrompt)
  }

  // === KNOWLEDGE INSTRUCTIONS (configurable) ===
  parts.push(`\n\n--- Knowledge & Context ---`)
  parts.push(prompts.knowledge_instructions)

  // === ROLEPLAY GUIDELINES (configurable) ===
  parts.push(`\n\n--- Roleplay Guidelines ---`)
  parts.push(prompts.roleplay_guidelines)

  // === PERSONA REMINDER (reinforcement for long conversations) ===
  // Placing at the end of system prompt ensures it gets high attention weight
  if (persona?.name) {
    parts.push(`\nRemember: You are interacting with ${persona.name}. Address them by name when appropriate.`)
  }

  return parts.join('\n')
}

/**
 * Build a greeting message from the bot
 * Uses configurable AI disclaimer from database
 */
export async function buildGreeting(payload: Payload, bot: Bot, persona: Persona | null): Promise<string> {
  // Get configurable AI disclaimer
  const aiDisclaimer = '\n\n' + await getPrompt(payload, 'ai_disclaimer')

  if (bot.greeting) {
    let greeting = bot.greeting

    // Replace persona placeholders if present
    if (persona) {
      greeting = greeting.replace(/\{\{user\}\}/gi, persona.name)
      greeting = greeting.replace(/\{\{char\}\}/gi, bot.name)
    } else {
      greeting = greeting.replace(/\{\{user\}\}/gi, 'friend')
      greeting = greeting.replace(/\{\{char\}\}/gi, bot.name)
    }

    return greeting + aiDisclaimer
  }

  // Default greeting
  return `Hello! I'm ${bot.name}. How can I help you today?` + aiDisclaimer
}

/**
 * Format retrieved memories for injection into the system prompt
 */
function formatMemoriesForPrompt(memories: Awaited<ReturnType<typeof retrieveRelevantMemories>>): string {
  const parts: string[] = []

  parts.push('--- Memories ---')
  parts.push('These are memories from past conversations that may be relevant:')

  for (const memory of memories) {
    // Memory uses 'entry' field for content (from Payload CMS schema)
    const content = memory.entry
    if (!content) continue

    let memoryText = `• ${content}`

    // Add emotional context if available
    if (memory.emotional_context) {
      memoryText += ` (mood: ${memory.emotional_context})`
    }

    parts.push(memoryText)
  }

  parts.push('')
  parts.push('Use these memories naturally in conversation when relevant. Do not explicitly mention "according to my memories" - just recall the information as if it were your own recollection.')

  return parts.join('\n')
}
