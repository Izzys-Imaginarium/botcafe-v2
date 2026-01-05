import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/memories/auto-process
 *
 * Automatic memory processing endpoint.
 * This endpoint should be called when:
 * 1. A conversation reaches a token threshold (e.g., 4000 tokens)
 * 2. A conversation reaches a message count threshold (e.g., 50 messages)
 * 3. A conversation is manually archived/saved
 *
 * It will:
 * 1. Summarize the conversation
 * 2. Create a memory entry
 * 3. Vectorize the memory for semantic search
 *
 * Request body:
 * - conversationId: string (required) - ID of conversation to process
 * - forceFullSummary?: boolean - Force full conversation summary
 * - autoVectorize?: boolean - Automatically vectorize after summarization (default: true)
 *
 * Response:
 * - success: boolean
 * - memory: Memory object
 * - vectorized: boolean
 * - chunkCount?: number (if vectorized)
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

    // Get request body
    const body = (await request.json()) as {
      conversationId?: string
      forceFullSummary?: boolean
      autoVectorize?: boolean
    }
    const { conversationId, forceFullSummary = false, autoVectorize = true } = body

    if (!conversationId) {
      return NextResponse.json(
        { success: false, message: 'conversationId is required' },
        { status: 400 }
      )
    }

    // Step 1: Summarize the conversation
    const summarizeResponse = await fetch(
      new URL('/api/memories/summarize', request.url).toString(),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Forward authentication headers
          ...(request.headers.get('authorization') && {
            authorization: request.headers.get('authorization')!,
          }),
        },
        body: JSON.stringify({
          conversationId,
          forceFullSummary,
        }),
      }
    )

    const summarizeData = (await summarizeResponse.json()) as {
      success?: boolean
      message?: string
      memory?: any
      summary?: string
      messagesProcessed?: number
      isIncremental?: boolean
    }

    if (!summarizeData.success) {
      return NextResponse.json(
        {
          success: false,
          message: `Summarization failed: ${summarizeData.message}`,
        },
        { status: summarizeResponse.status }
      )
    }

    const memory = summarizeData.memory

    // Step 2: Vectorize the memory (if enabled)
    let vectorized = false
    let chunkCount = 0

    if (autoVectorize && memory?.id) {
      const vectorizeResponse = await fetch(
        new URL('/api/memories/vectorize', request.url).toString(),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(request.headers.get('authorization') && {
              authorization: request.headers.get('authorization')!,
            }),
          },
          body: JSON.stringify({
            memoryId: memory.id,
          }),
        }
      )

      const vectorizeData = (await vectorizeResponse.json()) as {
        success?: boolean
        message?: string
        chunkCount?: number
      }

      if (vectorizeData.success) {
        vectorized = true
        chunkCount = vectorizeData.chunkCount || 0
      } else {
        // Log error but don't fail the entire operation
        console.error('Vectorization failed:', vectorizeData.message)
      }
    }

    return NextResponse.json({
      success: true,
      memory: memory,
      vectorized: vectorized,
      chunkCount: chunkCount,
      summary: summarizeData.summary,
      messagesProcessed: summarizeData.messagesProcessed,
      isIncremental: summarizeData.isIncremental,
      message: vectorized
        ? `Conversation processed: ${summarizeData.messagesProcessed} messages summarized and vectorized into ${chunkCount} chunks`
        : `Conversation summarized: ${summarizeData.messagesProcessed} messages processed`,
    })

  } catch (error: any) {
    console.error('Auto-process error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to auto-process conversation' },
      { status: 500 }
    )
  }
}
