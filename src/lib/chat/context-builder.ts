/**
 * Chat Context Builder
 *
 * Builds the complete context for an LLM call including:
 * - System prompt with bot personality
 * - Knowledge/lore entries from activation engine
 * - Conversation history
 * - Persona context
 */

import type { Payload } from 'payload'
import type { Bot, Persona, Conversation, Message } from '@/payload-types'
import type { ChatMessage } from '@/lib/llm'
import { ActivationEngine } from '@/lib/knowledge-activation/activation-engine'
import { PromptBuilder } from '@/lib/knowledge-activation/prompt-builder'

export interface BuildContextParams {
  payload: Payload
  userId: number
  conversation: Conversation
  bot: Bot
  persona: Persona | null
  recentMessages: Message[]
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
  const { payload, userId, conversation, bot, persona, recentMessages, env } = params

  // Build base system prompt from bot
  let systemPrompt = buildBotSystemPrompt(bot, persona)

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
  for (const msg of recentMessages) {
    const isAI = msg.message_attribution?.is_ai_generated
    const content = msg.entry || ''

    if (!content) continue

    messages.push({
      role: isAI ? 'assistant' : 'user',
      content,
      name: isAI
        ? (typeof msg.bot === 'object' ? msg.bot?.name : undefined)
        : persona?.name,
    })
  }

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
 * Build the base system prompt from bot and persona
 */
function buildBotSystemPrompt(bot: Bot, persona: Persona | null): string {
  const parts: string[] = []

  // Bot identity
  parts.push(`You are ${bot.name}.`)

  if (bot.description) {
    parts.push(bot.description)
  }

  // Bot personality traits
  if (bot.personality_traits) {
    const traits: string[] = []

    if (bot.personality_traits.tone) {
      traits.push(`Your tone is ${bot.personality_traits.tone}.`)
    }
    if (bot.personality_traits.formality_level) {
      traits.push(`Your formality level is ${bot.personality_traits.formality_level}.`)
    }
    if (bot.personality_traits.humor_style) {
      traits.push(`Your humor style is ${bot.personality_traits.humor_style}.`)
    }
    if (bot.personality_traits.communication_style) {
      traits.push(`Your communication style is ${bot.personality_traits.communication_style}.`)
    }

    if (traits.length > 0) {
      parts.push('\n' + traits.join(' '))
    }
  }

  // Bot behavior settings
  if (bot.behavior_settings) {
    const behaviors: string[] = []

    if (bot.behavior_settings.response_length) {
      behaviors.push(`Keep responses ${bot.behavior_settings.response_length}.`)
    }
    if (bot.behavior_settings.creativity_level) {
      behaviors.push(`Be ${bot.behavior_settings.creativity_level} in your responses.`)
    }

    if (behaviors.length > 0) {
      parts.push('\n' + behaviors.join(' '))
    }
  }

  // Speech examples
  if (bot.speech_examples && bot.speech_examples.length > 0) {
    const examples = bot.speech_examples
      .filter(e => e.example)
      .map(e => `"${e.example}"`)
      .slice(0, 3)
      .join('\n')

    if (examples) {
      parts.push(`\nExamples of how you speak:\n${examples}`)
    }
  }

  // Signature phrases
  if (bot.signature_phrases && bot.signature_phrases.length > 0) {
    const phrases = bot.signature_phrases
      .filter(p => p.phrase)
      .map(p => p.phrase)
      .slice(0, 5)
      .join(', ')

    if (phrases) {
      parts.push(`\nYou sometimes use phrases like: ${phrases}`)
    }
  }

  // Greeting (for first message context)
  if (bot.greeting) {
    parts.push(`\nYour greeting style: ${bot.greeting}`)
  }

  // Persona context
  if (persona) {
    parts.push(`\n\n[User Persona: ${persona.name}]`)

    if (persona.description) {
      parts.push(persona.description)
    }

    if (persona.gender || persona.age || persona.pronouns) {
      const details: string[] = []
      if (persona.gender) details.push(`Gender: ${persona.gender}`)
      if (persona.age) details.push(`Age: ${persona.age}`)
      if (persona.pronouns) {
        const pronounText = persona.pronouns === 'other'
          ? persona.custom_pronouns || 'custom pronouns'
          : persona.pronouns
        details.push(`Pronouns: ${pronounText}`)
      }
      parts.push(details.join(', '))
    }

    // Interaction preferences
    if (persona.interaction_preferences) {
      if (persona.interaction_preferences.preferred_topics?.length) {
        const topics = persona.interaction_preferences.preferred_topics
          .map((t) => t.topic)
          .filter(Boolean)
          .join(', ')
        if (topics) parts.push(`Preferred topics: ${topics}`)
      }
      if (persona.interaction_preferences.avoid_topics?.length) {
        const topics = persona.interaction_preferences.avoid_topics
          .map((t) => t.topic)
          .filter(Boolean)
          .join(', ')
        if (topics) parts.push(`Avoid topics: ${topics}`)
      }
    }
  }

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
