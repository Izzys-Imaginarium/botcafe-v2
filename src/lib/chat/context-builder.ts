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
  totalTokensEstimate: number
}

/**
 * Build the complete chat context for an LLM call
 */
export async function buildChatContext(params: BuildContextParams): Promise<ChatContext> {
  const { payload, userId, conversation, bot, persona, user, recentMessages, additionalBots, env } = params

  // Build base system prompt from bot (includes user/persona context)
  let systemPrompt = buildBotSystemPrompt(bot, persona, user, additionalBots)

  // Try to activate knowledge entries
  let activatedLoreCount = 0

  try {
    // Get the user's message (last user message in recent messages)
    const lastUserMessage = [...recentMessages].reverse().find(
      m => !m.message_attribution?.is_ai_generated
    )

    if (lastUserMessage) {
      const engine = new ActivationEngine()

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
        const promptBuilder = new PromptBuilder()
        systemPrompt = promptBuilder.buildPrompt(
          systemPrompt,
          activationResult.activatedEntries,
          bot,
          persona || undefined
        )
        activatedLoreCount = activationResult.activatedEntries.length
      }
    }
  } catch (error) {
    console.error('Knowledge activation error:', error)
    // Continue without lore - don't fail the chat
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

  return {
    messages,
    systemPrompt,
    activatedLoreCount,
    totalTokensEstimate,
  }
}

/**
 * Build the base system prompt from bot and persona/user
 * Incorporates proven prompt structure from original BotCafé
 */
function buildBotSystemPrompt(bot: Bot, persona: Persona | null, user?: User | null, additionalBots?: Bot[]): string {
  const parts: string[] = []

  // === ROLEPLAY INSTRUCTIONS (from original BotCafé) ===
  parts.push(`You are roleplaying as ${bot.name}. Stay in character at all times and respond as ${bot.name} would.`)

  // Bot description/backstory
  if (bot.description) {
    parts.push(`\n${bot.description}`)
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
  } else if (user) {
    // User is speaking as themselves (no persona) - use profile info
    const hasUserInfo = user.nickname || user.name || user.pronouns || user.description
    if (hasUserInfo) {
      parts.push(`\n\n--- User Context ---`)

      // Prefer nickname for addressing the user, fall back to name
      if (user.nickname) {
        parts.push(`The user should be called ${user.nickname}.`)
        if (user.name && user.name !== user.nickname) {
          parts.push(`Their full name is ${user.name}.`)
        }
      } else if (user.name) {
        parts.push(`The user's name is ${user.name}.`)
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

  // === MULTI-BOT CONTEXT (from original BotCafé) ===
  if (additionalBots && additionalBots.length > 0) {
    parts.push(`\n\n--- Other Characters ---`)
    parts.push(`This is a group conversation. Other characters present:`)
    for (const otherBot of additionalBots) {
      parts.push(`- ${otherBot.name}${otherBot.description ? `: ${otherBot.description.slice(0, 100)}...` : ''}`)
    }
    parts.push(`\nWhen responding, only speak as ${bot.name}. Do not speak for the other characters or the user.`)
  }

  // === KNOWLEDGE INSTRUCTIONS (from original BotCafé) ===
  parts.push(`\n\n--- Knowledge & Context ---`)
  parts.push(`You have access to different types of knowledge that may be provided:
- Memories: Specific memories or past interactions - prioritize these when relevant
- Bot Persona: Your character traits, background, and personality details
- User Persona: Traits and preferences of the person you're talking to
- Lore: Worldbuilding context relevant to your setting
- General: Supplementary information that doesn't fit other categories

When responding, naturally incorporate relevant memories, traits, lore, and knowledge. Do not explicitly reference these categories or say things like "according to my memories" or "based on the lore". Instead, speak as if this knowledge is simply part of who you are and what you know.`)

  // === ROLEPLAY GUIDELINES ===
  parts.push(`\n\n--- Roleplay Guidelines ---`)
  parts.push(`- Stay in character as ${bot.name} throughout the conversation
- Respond naturally to the user's messages as ${bot.name} would
- Use your established personality, speech patterns, and mannerisms
- If the user refers to you by a different name, gently correct them in character
- Engage with the conversation topic while maintaining your character's perspective
- Keep content appropriate and respectful`)

  return parts.join('\n')
}

/**
 * Build a greeting message from the bot
 */
export function buildGreeting(bot: Bot, persona: Persona | null): string {
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

    return greeting
  }

  // Default greeting
  return `Hello! I'm ${bot.name}. How can I help you today?`
}
