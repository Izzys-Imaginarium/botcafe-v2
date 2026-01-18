/**
 * Multi-Bot Orchestrator
 *
 * Handles coordination of multiple bots responding in a conversation.
 * Supports sequential responses where each bot sees previous responses.
 */

import type { Payload } from 'payload'
import type { Bot, Persona, Conversation, Message } from '@/payload-types'
import type { ProviderName, ChatMessage, StreamChunk } from '@/lib/llm'
import { streamMessage, getDefaultModel } from '@/lib/llm'
import { buildChatContext } from './context-builder'

export interface MultiResponseConfig {
  responseOrder: 'sequential' | 'first-only'
  primaryBotFirst: boolean
  maxBotsToRespond: number
}

export interface BotResponseStream {
  botId: number
  botName: string
  stream: AsyncGenerator<StreamChunk, void, unknown>
}

export interface OrchestrationContext {
  payload: Payload
  userId: number
  conversation: Conversation
  bots: Bot[]
  persona: Persona | null
  recentMessages: Message[]
  userMessage: string
  apiKeys: Map<number, { id: number; key: string; provider: ProviderName }>
  config?: Partial<MultiResponseConfig>
}

const DEFAULT_CONFIG: MultiResponseConfig = {
  responseOrder: 'sequential',
  primaryBotFirst: true,
  maxBotsToRespond: 3, // Limit how many bots respond to avoid token explosion
}

/**
 * Orchestrate multi-bot responses
 *
 * Yields response streams for each bot in sequence.
 * Each bot sees the previous bot's response in context.
 */
export async function* orchestrateMultiBotResponse(
  context: OrchestrationContext
): AsyncGenerator<{
  type: 'bot_start' | 'chunk' | 'bot_end' | 'error'
  botId: number
  botName: string
  content?: string
  finishReason?: string
  error?: string
}, void, unknown> {
  const config = { ...DEFAULT_CONFIG, ...context.config }
  const { payload, userId, conversation, bots, persona, recentMessages, userMessage, apiKeys } = context

  // Order bots
  let orderedBots = [...bots]

  if (config.primaryBotFirst) {
    // Find primary bot from conversation participants
    const botParticipants = conversation.bot_participation || []
    const primaryParticipant = botParticipants.find(
      (bp) => bp.role === 'primary'
    )

    if (primaryParticipant) {
      const primaryBotId = typeof primaryParticipant.bot_id === 'object'
        ? (primaryParticipant.bot_id as Bot).id
        : primaryParticipant.bot_id

      orderedBots = orderedBots.sort((a, b) => {
        if (a.id === primaryBotId) return -1
        if (b.id === primaryBotId) return 1
        return 0
      })
    }
  }

  // Limit number of responding bots
  orderedBots = orderedBots.slice(0, config.maxBotsToRespond)

  // Track accumulated responses for context
  const accumulatedResponses: Array<{ botId: number; botName: string; content: string }> = []

  // Build initial messages with user's new message
  const messagesWithUser = [
    ...recentMessages,
    {
      entry: userMessage,
      message_attribution: { is_ai_generated: false },
    } as Message,
  ]

  for (const bot of orderedBots) {
    // Get API key for this bot's response
    // Use the first available key from the map
    const apiKeyEntry = apiKeys.values().next().value
    if (!apiKeyEntry) {
      yield {
        type: 'error',
        botId: bot.id,
        botName: bot.name,
        error: 'No API key available',
      }
      continue
    }

    yield {
      type: 'bot_start',
      botId: bot.id,
      botName: bot.name,
    }

    try {
      // Build context for this bot
      // Include previous bots' responses in the context
      const contextMessages = [...messagesWithUser]

      for (const prevResponse of accumulatedResponses) {
        contextMessages.push({
          entry: prevResponse.content,
          message_attribution: {
            is_ai_generated: true,
          },
          bot: { id: prevResponse.botId, name: prevResponse.botName } as Bot,
        } as unknown as Message)
      }

      const chatContext = await buildChatContext({
        payload,
        userId,
        conversation,
        bot,
        persona,
        recentMessages: contextMessages,
      })

      // Stream response from this bot
      let fullContent = ''
      const model = getDefaultModel(apiKeyEntry.provider)

      for await (const chunk of streamMessage(
        apiKeyEntry.provider,
        {
          messages: chatContext.messages as ChatMessage[],
          model,
          temperature: 0.7,
          maxTokens: 1024, // Lower limit for multi-bot to save tokens
        },
        {
          apiKey: apiKeyEntry.key,
        }
      )) {
        if (chunk.content) {
          fullContent += chunk.content
          yield {
            type: 'chunk',
            botId: bot.id,
            botName: bot.name,
            content: chunk.content,
          }
        }

        if (chunk.done) {
          yield {
            type: 'bot_end',
            botId: bot.id,
            botName: bot.name,
            finishReason: chunk.finishReason || undefined,
          }
        }
      }

      // Store this bot's response for next bot's context
      accumulatedResponses.push({
        botId: bot.id,
        botName: bot.name,
        content: fullContent,
      })
    } catch (error) {
      yield {
        type: 'error',
        botId: bot.id,
        botName: bot.name,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}

/**
 * Get which bots should respond to a message
 */
export function getRespondingBots(
  conversation: Conversation,
  targetBotId?: number
): number[] {
  const botParticipants = conversation.bot_participation || []
  const activeBots = botParticipants
    .filter((bp) => bp.is_active)
    .map((bp) =>
      typeof bp.bot_id === 'object' ? (bp.bot_id as Bot).id : bp.bot_id
    )

  // If specific bot targeted, only that bot responds
  if (targetBotId && activeBots.includes(targetBotId)) {
    return [targetBotId]
  }

  // For single-bot conversations, just the one bot
  if (conversation.conversation_type === 'single-bot') {
    return activeBots.slice(0, 1)
  }

  // For multi-bot, all active bots respond
  return activeBots
}

/**
 * Determine the order of bot responses
 */
export function orderBotsForResponse(
  conversation: Conversation,
  bots: Bot[]
): Bot[] {
  const botParticipants = conversation.bot_participation || []

  // Create a map of bot ID to role
  const roleMap = new Map<number, string>()
  for (const bp of botParticipants) {
    const botId = typeof bp.bot_id === 'object' ? (bp.bot_id as Bot).id : bp.bot_id
    roleMap.set(botId, bp.role)
  }

  // Sort: primary first, then secondary, then moderator
  const roleOrder = { primary: 0, secondary: 1, moderator: 2 }

  return [...bots].sort((a, b) => {
    const roleA = roleMap.get(a.id) || 'secondary'
    const roleB = roleMap.get(b.id) || 'secondary'
    return (roleOrder[roleA as keyof typeof roleOrder] || 1) -
           (roleOrder[roleB as keyof typeof roleOrder] || 1)
  })
}
