import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/fix/slugs
 *
 * Preview bots with non-lowercase slugs that need normalization.
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

    // Find user in Payload and verify admin
    const users = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: clerkUser.emailAddresses[0]?.emailAddress,
        },
      },
      overrideAccess: true,
    })

    if (users.docs.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found in database' },
        { status: 404 }
      )
    }

    const payloadUser = users.docs[0] as { id: number; role?: string }

    // Only admins can access this endpoint
    if (payloadUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    // Fetch all bots
    const allBots = await payload.find({
      collection: 'bot',
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    })

    // Find bots with non-lowercase slugs
    const botsToFix: Array<{
      id: number
      name: string
      currentSlug: string
      normalizedSlug: string
    }> = []

    for (const bot of allBots.docs) {
      const b = bot as { id: number; name: string; slug: string }
      const normalizedSlug = b.slug?.toLowerCase()

      if (b.slug && b.slug !== normalizedSlug) {
        botsToFix.push({
          id: b.id,
          name: b.name,
          currentSlug: b.slug,
          normalizedSlug: normalizedSlug,
        })
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalBots: allBots.totalDocs,
        botsNeedingFix: botsToFix.length,
      },
      botsToFix: botsToFix.slice(0, 100),
      message: botsToFix.length > 100
        ? `Showing first 100 of ${botsToFix.length} bots needing slug normalization`
        : 'Preview complete. Use POST /api/admin/fix/slugs to normalize slugs.',
    })
  } catch (error: any) {
    console.error('Slug fix preview error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Preview failed' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/fix/slugs
 *
 * Normalize all bot slugs to lowercase.
 *
 * Body (optional):
 * - botIds: number[] - Only fix specific bots
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

    // Get Payload instance
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Find user in Payload and verify admin
    const users = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: clerkUser.emailAddresses[0]?.emailAddress,
        },
      },
      overrideAccess: true,
    })

    if (users.docs.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found in database' },
        { status: 404 }
      )
    }

    const payloadUser = users.docs[0] as { id: number; role?: string }

    // Only admins can access this endpoint
    if (payloadUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse body
    const body = (await request.json().catch(() => ({}))) as {
      botIds?: number[]
    }

    const specificBotIds = body.botIds

    // Fetch all bots
    const allBots = await payload.find({
      collection: 'bot',
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    })

    // Find bots needing fix
    let botsToFix = allBots.docs.filter((bot: any) => {
      const normalizedSlug = bot.slug?.toLowerCase()
      return bot.slug && bot.slug !== normalizedSlug
    })

    // Filter to specific IDs if provided
    if (specificBotIds && specificBotIds.length > 0) {
      const idSet = new Set(specificBotIds)
      botsToFix = botsToFix.filter((bot: any) => idSet.has(bot.id))
    }

    const results: Array<{
      botId: number
      botName: string
      status: 'fixed' | 'error'
      oldSlug?: string
      newSlug?: string
      reason?: string
    }> = []

    for (const bot of botsToFix) {
      const b = bot as { id: number; name: string; slug: string }
      const normalizedSlug = b.slug.toLowerCase()

      try {
        await payload.update({
          collection: 'bot',
          id: b.id,
          data: {
            slug: normalizedSlug,
          },
          overrideAccess: true,
        })

        results.push({
          botId: b.id,
          botName: b.name,
          status: 'fixed',
          oldSlug: b.slug,
          newSlug: normalizedSlug,
        })
      } catch (updateError: any) {
        results.push({
          botId: b.id,
          botName: b.name,
          status: 'error',
          reason: updateError.message,
        })
      }
    }

    // Summary
    const summary = {
      processed: results.length,
      fixed: results.filter((r) => r.status === 'fixed').length,
      errors: results.filter((r) => r.status === 'error').length,
    }

    return NextResponse.json({
      success: true,
      summary,
      results,
      message: `Slug normalization complete. Fixed ${summary.fixed} bots.`,
    })
  } catch (error: any) {
    console.error('Slug fix error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Fix failed' },
      { status: 500 }
    )
  }
}
