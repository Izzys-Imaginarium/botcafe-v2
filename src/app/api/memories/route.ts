import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

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
