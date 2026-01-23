/**
 * Chat Stream API
 *
 * GET - Server-Sent Events endpoint for streaming LLM responses
 *
 * This endpoint:
 * 1. Builds the conversation context with lore/knowledge
 * 2. Streams the LLM response
 * 3. Updates the message with final content and token counts
 */

import { NextRequest } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { streamMessage, getDefaultModel, type ProviderName, type ChatMessage } from '@/lib/llm'
import { buildChatContext } from '@/lib/chat/context-builder'

export const dynamic = 'force-dynamic'
// Note: Cannot use edge runtime here because Payload CMS requires Node.js modules

// GET /api/chat/stream/[messageId] - Stream LLM response
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const encoder = new TextEncoder()

  // Create the SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      const sendError = (message: string, code?: string) => {
        sendEvent({ error: true, message, code })
        controller.close()
      }

      try {
        const clerkUser = await currentUser()
        if (!clerkUser) {
          sendError('Unauthorized - Please sign in', 'UNAUTHORIZED')
          return
        }

        const { messageId } = await params
        const { searchParams } = new URL(request.url)
        const apiKeyId = searchParams.get('apiKeyId')
        const modelOverride = searchParams.get('model')

        if (!apiKeyId) {
          sendError('API key ID is required', 'MISSING_API_KEY')
          return
        }

        const payload = await getPayload({ config })

        // Find Payload user
        const payloadUsers = await payload.find({
          collection: 'users',
          where: {
            email: { equals: clerkUser.emailAddresses[0]?.emailAddress },
          },
          limit: 1,
          overrideAccess: true,
        })

        if (payloadUsers.docs.length === 0) {
          sendError('User not found', 'USER_NOT_FOUND')
          return
        }

        const payloadUser = payloadUsers.docs[0]

        // Fetch the bot message
        const botMessage = await payload.findByID({
          collection: 'message',
          id: parseInt(messageId),
          depth: 2,
          overrideAccess: true,
        })

        if (!botMessage) {
          sendError('Message not found', 'MESSAGE_NOT_FOUND')
          return
        }

        // Verify ownership via conversation
        const conversation = typeof botMessage.conversation === 'object'
          ? botMessage.conversation
          : await payload.findByID({
              collection: 'conversation',
              id: botMessage.conversation as number,
              depth: 2,
              overrideAccess: true,
            })

        if (!conversation) {
          sendError('Conversation not found', 'CONVERSATION_NOT_FOUND')
          return
        }

        const conversationUserId = typeof conversation.user === 'object'
          ? conversation.user.id
          : conversation.user

        if (conversationUserId !== payloadUser.id) {
          sendError('Not authorized', 'FORBIDDEN')
          return
        }

        // Fetch API key
        const apiKeys = await payload.find({
          collection: 'api-key',
          where: {
            id: { equals: parseInt(apiKeyId) },
            user: { equals: payloadUser.id },
          },
          limit: 1,
          overrideAccess: true,
        })

        if (apiKeys.docs.length === 0) {
          sendError('API key not found', 'API_KEY_NOT_FOUND')
          return
        }

        const apiKey = apiKeys.docs[0]
        const provider = apiKey.provider as ProviderName

        // Get the bot
        const bot = typeof botMessage.bot === 'object'
          ? botMessage.bot
          : await payload.findByID({
              collection: 'bot',
              id: botMessage.bot as number,
              overrideAccess: true,
            })

        if (!bot) {
          sendError('Bot not found', 'BOT_NOT_FOUND')
          return
        }

        // Get persona if set
        const participants = conversation.participants as {
          primary_persona?: string
          personas?: string[]
        } | null

        let persona = null
        if (participants?.primary_persona) {
          const personas = await payload.find({
            collection: 'personas',
            where: {
              id: { equals: parseInt(participants.primary_persona) },
            },
            limit: 1,
            overrideAccess: true,
          })
          if (personas.docs.length > 0) {
            persona = personas.docs[0]
          }
        }

        // Get recent messages
        const recentMessages = await payload.find({
          collection: 'message',
          where: {
            conversation: { equals: conversation.id },
            id: { not_equals: parseInt(messageId) }, // Exclude current bot message
          },
          sort: '-created_timestamp',
          limit: 20, // Get last 20 messages for context
          depth: 1,
          overrideAccess: true,
        })

        // Build context with knowledge activation
        const context = await buildChatContext({
          payload,
          userId: payloadUser.id,
          conversation,
          bot,
          persona,
          recentMessages: recentMessages.docs.reverse(), // Oldest first
        })

        // Determine model to use
        const modelPreference = apiKey.key_configuration?.model_preferences?.[0]
        const modelPrefString = typeof modelPreference === 'object' ? modelPreference?.model : modelPreference
        const model = modelOverride || modelPrefString || getDefaultModel(provider)

        // Send initial event
        sendEvent({
          type: 'start',
          messageId: parseInt(messageId),
          model,
          provider,
        })

        // Stream from LLM
        let fullContent = ''
        let finalUsage = null
        let finishReason = null

        try {
          for await (const chunk of streamMessage(
            provider,
            {
              messages: context.messages as ChatMessage[],
              model,
              temperature: 0.7,
              maxTokens: 2048,
            },
            {
              apiKey: apiKey.key,
            }
          )) {
            if (chunk.content) {
              fullContent += chunk.content
              sendEvent({
                type: 'chunk',
                content: chunk.content,
              })
            }

            if (chunk.usage) {
              finalUsage = chunk.usage
            }

            if (chunk.finishReason) {
              finishReason = chunk.finishReason
            }
          }

          // Send end event after loop completes (ensures we have all data)
          sendEvent({
            type: 'end',
            finishReason,
            usage: finalUsage,
          })

          // Close the stream immediately after sending end event
          // Database updates happen after, but client doesn't need to wait
          controller.close()
        } catch (llmError: unknown) {
          const errorMessage = llmError instanceof Error ? llmError.message : 'LLM error'
          sendError(errorMessage, 'LLM_ERROR')

          // Update message with error
          await payload.update({
            collection: 'message',
            id: parseInt(messageId),
            data: {
              entry: `[Error: ${errorMessage}]`,
              message_status: {
                delivery_status: 'failed',
              },
            },
            overrideAccess: true,
          })

          return
        }

        // Update the message with final content
        await payload.update({
          collection: 'message',
          id: parseInt(messageId),
          data: {
            entry: fullContent,
            message_attribution: {
              source_bot_id: bot.id,
              is_ai_generated: true,
              model_used: model,
            },
            token_tracking: finalUsage ? {
              input_tokens: finalUsage.inputTokens,
              output_tokens: finalUsage.outputTokens,
              total_tokens: finalUsage.totalTokens,
            } : undefined,
            message_status: {
              delivery_status: 'delivered',
            },
            modified_timestamp: new Date().toISOString(),
          },
          overrideAccess: true,
        })

        // Update conversation token count
        const currentTokens = conversation.total_tokens || 0
        const newTokens = currentTokens + (finalUsage?.totalTokens || 0)

        await payload.update({
          collection: 'conversation',
          id: conversation.id,
          data: {
            total_tokens: newTokens,
            requires_summarization: newTokens > 4000, // Flag for summarization
            modified_timestamp: new Date().toISOString(),
          },
          overrideAccess: true,
        })

        // Update API key usage (non-blocking)
        payload.update({
          collection: 'api-key',
          id: apiKey.id,
          data: {
            security_features: {
              ...apiKey.security_features,
              last_used: new Date().toISOString(),
            },
          },
          overrideAccess: true,
        }).catch(console.error)

        // Note: controller.close() already called after sending 'end' event
      } catch (error: unknown) {
        console.error('Stream error:', error)
        sendError(
          error instanceof Error ? error.message : 'Stream error',
          'STREAM_ERROR'
        )
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  })
}
