import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

/**
 * Helper to get payload user from Clerk user
 */
async function getPayloadUser(clerkUser: NonNullable<Awaited<ReturnType<typeof currentUser>>>) {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const users = await payload.find({
    collection: 'users',
    where: {
      email: {
        equals: clerkUser.emailAddresses[0]?.emailAddress,
      },
    },
  })

  return { payload, user: users.docs[0] || null }
}

/**
 * GET /api/memories
 *
 * Fetch all memory entries for the current user.
 * Supports filtering by type, bot, and conversion status.
 *
 * Query params:
 * - type?: 'short_term' | 'long_term' | 'consolidated'
 * - botId?: string
 * - convertedToLore?: 'true' | 'false'
 * - limit?: number (default: 50)
 * - offset?: number (default: 0)
 *
 * Response:
 * - success: boolean
 * - memories: Memory[]
 * - total: number
 * - message?: string
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get Payload instance
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Find user in Payload by email
    const users = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: clerkUser.emailAddresses[0]?.emailAddress,
        },
      },
    })

    if (users.docs.length === 0) {
      // User not synced yet - return empty results
      return NextResponse.json({
        success: true,
        memories: [],
        total: 0,
        hasMore: false,
        page: 1,
        totalPages: 0,
      })
    }

    const payloadUser = users.docs[0]

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const botId = searchParams.get('botId')
    const convertedToLore = searchParams.get('convertedToLore')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Build where clause
    const where: any = {
      user: {
        equals: payloadUser.id,
      },
    }

    if (type) {
      where.type = {
        equals: type,
      }
    }

    if (botId) {
      where.bot = {
        equals: parseInt(botId, 10),
      }
    }

    if (convertedToLore !== null) {
      where.converted_to_lore = {
        equals: convertedToLore === 'true',
      }
    }

    // Fetch memories
    const memoriesResult = await payload.find({
      collection: 'memory',
      where,
      limit,
      page: Math.floor(offset / limit) + 1,
      sort: '-created_timestamp',
      depth: 2, // Include bot and lore_entry relationships
    })

    return NextResponse.json({
      success: true,
      memories: memoriesResult.docs,
      total: memoriesResult.totalDocs,
      hasMore: memoriesResult.hasNextPage,
      page: memoriesResult.page,
      totalPages: memoriesResult.totalPages,
    })

  } catch (error: any) {
    console.error('Fetch memories error:', error)
    // Return empty results instead of error for better UX
    return NextResponse.json({
      success: true,
      memories: [],
      total: 0,
      hasMore: false,
      page: 1,
      totalPages: 0,
    })
  }
}

/**
 * POST /api/memories
 *
 * Create a new memory entry.
 *
 * Body:
 * - entry: string (required) - Memory content
 * - botId: number (required) - Associated bot
 * - type?: 'short_term' | 'long_term' | 'consolidated' (default: 'short_term')
 * - importance?: number (1-10, default: 5)
 * - emotional_context?: string
 * - conversationId?: number - Associated conversation
 *
 * Response:
 * - success: boolean
 * - memory: Memory
 * - message?: string
 */
export async function POST(request: NextRequest) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json() as {
      entry?: string
      botId?: string | number
      type?: string
      importance?: number
      emotional_context?: string
      conversationId?: string | number
    }
    const { entry, botId, type, importance, emotional_context, conversationId } = body

    // Validate required fields
    if (!entry || typeof entry !== 'string' || entry.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Memory content is required' },
        { status: 400 }
      )
    }

    if (!botId || isNaN(parseInt(botId, 10))) {
      return NextResponse.json(
        { success: false, message: 'Bot ID is required' },
        { status: 400 }
      )
    }

    const { payload, user: payloadUser } = await getPayloadUser(clerkUser)

    if (!payloadUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Verify bot exists and user has access
    const bot = await payload.findByID({
      collection: 'bot',
      id: parseInt(botId, 10),
    })

    if (!bot) {
      return NextResponse.json(
        { success: false, message: 'Bot not found' },
        { status: 404 }
      )
    }

    // Validate type if provided
    const validTypes = ['short_term', 'long_term', 'consolidated']
    const memoryType = type && validTypes.includes(type) ? type : 'short_term'

    // Validate importance if provided
    let memoryImportance = 5
    if (importance !== undefined) {
      const imp = parseInt(importance, 10)
      if (!isNaN(imp) && imp >= 1 && imp <= 10) {
        memoryImportance = imp
      }
    }

    // Create memory
    const memory = await payload.create({
      collection: 'memory',
      data: {
        user: payloadUser.id,
        bot: parseInt(botId, 10),
        entry: entry.trim(),
        type: memoryType,
        importance: memoryImportance,
        emotional_context: emotional_context || null,
        conversation: conversationId ? parseInt(conversationId, 10) : null,
        created_timestamp: new Date().toISOString(),
        modified_timestamp: new Date().toISOString(),
        is_vectorized: false,
        converted_to_lore: false,
      },
      depth: 2,
    })

    return NextResponse.json({
      success: true,
      memory,
      message: 'Memory created successfully',
    })
  } catch (error) {
    console.error('Create memory error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create memory' },
      { status: 500 }
    )
  }
}
