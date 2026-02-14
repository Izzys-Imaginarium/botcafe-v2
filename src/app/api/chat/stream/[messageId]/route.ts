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
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { streamMessage, getDefaultModel, getMaxOutputTokens, getContextWindow, type ProviderName, type ChatMessage } from '@/lib/llm'
import { buildChatContext } from '@/lib/chat/context-builder'
import { extractThinkTags } from '@/lib/llm/reasoning-utils'
import { generateConversationMemory } from '@/lib/chat/memory-service'

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

        // Determine model early so we can size the message window
        const modelPreference = apiKey.key_configuration?.model_preferences?.[0]
        const modelPrefString = typeof modelPreference === 'object' ? modelPreference?.model : modelPreference
        const model = modelOverride || modelPrefString || getDefaultModel(provider)
        const contextWindow = getContextWindow(model)

        // Scale message limit to model's context window
        // Small context (4K): 20, Medium (32K): 40, Large (128K): 60, Very large (200K+): 80
        let messageLimit: number
        if (contextWindow >= 200000) messageLimit = 80
        else if (contextWindow >= 100000) messageLimit = 60
        else if (contextWindow >= 32000) messageLimit = 40
        else messageLimit = 20

        console.log(`[Chat Stream] Dynamic message limit: ${messageLimit} (model: ${model}, context: ${contextWindow})`)

        // Get recent messages
        const recentMessages = await payload.find({
          collection: 'message',
          where: {
            conversation: { equals: conversation.id },
            id: { not_equals: parseInt(messageId) }, // Exclude current bot message
          },
          sort: '-created_timestamp',
          limit: messageLimit,
          depth: 1,
          overrideAccess: true,
        })

        // Get Cloudflare context for vector activation
        const { env } = await getCloudflareContext()

        // Build context with knowledge activation
        // Pass user for profile context when no persona is selected
        const context = await buildChatContext({
          payload,
          userId: payloadUser.id,
          conversation,
          bot,
          persona,
          user: persona ? null : payloadUser, // Only use user profile when no persona
          recentMessages: recentMessages.docs.reverse(), // Oldest first
          env: { VECTORIZE: env.VECTORIZE, AI: env.AI },
        })

        // Send initial event
        sendEvent({
          type: 'start',
          messageId: parseInt(messageId),
          model,
          provider,
        })

        // Stream from LLM
        let fullContent = ''
        let fullReasoning = ''
        let finalUsage = null
        let finishReason = null

        // Log the LLM request details
        console.log('[Chat Stream] ========== LLM REQUEST ==========')
        console.log('[Chat Stream] Provider:', provider)
        console.log('[Chat Stream] Model:', model)
        console.log('[Chat Stream] API Key ID:', apiKey.id)
        console.log('[Chat Stream] API Key (first 8 chars):', apiKey.key?.substring(0, 8) + '...')
        console.log('[Chat Stream] Message count:', context.messages.length)
        const maxOutputTokens = getMaxOutputTokens(model)

        console.log('[Chat Stream] Temperature: 0.7')
        console.log('[Chat Stream] Max tokens:', maxOutputTokens)
        console.log('[Chat Stream] Context stats:')
        console.log('[Chat Stream]   - System prompt:', context.systemPrompt.length, 'chars')
        console.log('[Chat Stream]   - Activated lore:', context.activatedLoreCount)
        console.log('[Chat Stream]   - Retrieved memories:', context.retrievedMemoriesCount)
        console.log('[Chat Stream]   - Estimated tokens:', context.totalTokensEstimate)
        console.log('[Chat Stream] ========== END REQUEST ==========')

        try {
          for await (const chunk of streamMessage(
            provider,
            {
              messages: context.messages as ChatMessage[],
              model,
              temperature: 0.7,
              maxTokens: maxOutputTokens,
            },
            {
              apiKey: apiKey.key,
            }
          )) {
            if (chunk.reasoning) {
              fullReasoning += chunk.reasoning
              sendEvent({
                type: 'reasoning',
                content: chunk.reasoning,
              })
            }

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

          // Fallback: extract <think> tags from content if no structured reasoning received
          if (!fullReasoning && fullContent.startsWith('<think>')) {
            const extracted = extractThinkTags(fullContent)
            if (extracted.reasoning) {
              fullReasoning = extracted.reasoning
              fullContent = extracted.content
            }
          }

          // Send end event after loop completes (ensures we have all data)
          sendEvent({
            type: 'end',
            finishReason,
            usage: finalUsage,
          })
        } catch (llmError: unknown) {
          // Enhanced error logging for LLM failures
          console.error('[Chat Stream] ========== LLM ERROR ==========')
          console.error('[Chat Stream] Provider:', provider)
          console.error('[Chat Stream] Model:', model)
          console.error('[Chat Stream] Error type:', llmError?.constructor?.name)
          console.error('[Chat Stream] Error message:', llmError instanceof Error ? llmError.message : String(llmError))
          if (llmError && typeof llmError === 'object' && 'code' in llmError) {
            console.error('[Chat Stream] Error code:', (llmError as { code?: string }).code)
          }
          if (llmError && typeof llmError === 'object' && 'statusCode' in llmError) {
            console.error('[Chat Stream] Status code:', (llmError as { statusCode?: number }).statusCode)
          }
          if (llmError && typeof llmError === 'object' && 'details' in llmError) {
            console.error('[Chat Stream] Error details:', JSON.stringify((llmError as { details?: unknown }).details))
          }
          console.error('[Chat Stream] Full error:', llmError)
          console.error('[Chat Stream] ========== END ERROR ==========')

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

        // Update the message with final content and reasoning
        await payload.update({
          collection: 'message',
          id: parseInt(messageId),
          data: {
            entry: fullContent,
            ...(fullReasoning && { reasoning_content: fullReasoning }),
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

        // Update conversation token count (total_messages already incremented by send route)
        const currentTokens = conversation.total_tokens || 0
        const newTokens = currentTokens + (finalUsage?.totalTokens || 0)
        const totalMessages = conversation.conversation_metadata?.total_messages || 0

        await payload.update({
          collection: 'conversation',
          id: conversation.id,
          data: {
            total_tokens: newTokens,
            modified_timestamp: new Date().toISOString(),
          },
          overrideAccess: true,
        })

        // Trigger memory auto-generation with timeout protection for Cloudflare Workers
        // First memory: after 5 messages, subsequent: every 20 messages
        // checkMemoryTrigger handles the threshold logic, so we always attempt it
        console.log(`[Memory Trigger] Conversation ${conversation.id}: tokens=${newTokens}, totalMessages=${totalMessages}`)

        {
          console.log(`[Memory Trigger] Checking memory generation for conversation ${conversation.id}`)

          // Create a timeout wrapper to prevent waitUntil() timeouts in Cloudflare Workers
          // Memory generation can involve LLM calls which may take too long
          const MEMORY_TIMEOUT_MS = 15000 // 15 seconds max

          const memoryPromise = generateConversationMemory(payload, conversation.id, {
            summarization: {
              apiKey: apiKey.key,
              provider: provider,
              model: model,
            },
          })

          const timeoutPromise = new Promise<{ success: false; error: string }>((resolve) => {
            setTimeout(() => {
              resolve({ success: false, error: 'Memory generation timed out' })
            }, MEMORY_TIMEOUT_MS)
          })

          try {
            const result = await Promise.race([memoryPromise, timeoutPromise])
            if (result.success) {
              console.log(`[Memory Trigger] SUCCESS - Memory auto-generated for conversation ${conversation.id}:`, result.memoryId)
            } else {
              console.log(`[Memory Trigger] SKIPPED - Conversation ${conversation.id}:`, result.error)
            }
          } catch (memoryError) {
            console.error('[Memory Trigger] ERROR (caught and contained):', memoryError instanceof Error ? memoryError.message : 'Unknown error')
          }
        }

        // Update API key usage
        try {
          await payload.update({
            collection: 'api-key',
            id: apiKey.id,
            data: {
              security_features: {
                ...apiKey.security_features,
                last_used: new Date().toISOString(),
              },
            },
            overrideAccess: true,
          })
        } catch (apiKeyError) {
          console.error('[API Key Update] ERROR:', apiKeyError)
        }

        // Close the stream after all database updates complete
        controller.close()
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
