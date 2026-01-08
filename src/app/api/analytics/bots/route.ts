import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

// GET /api/analytics/bots - Get detailed bot analytics
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const botId = searchParams.get('botId')
    const period = searchParams.get('period') || '30' // days

    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Find the Payload user by email
    const users = await payload.find({
      collection: 'users',
      where: {
        email: { equals: user.emailAddresses[0]?.emailAddress },
      },
      overrideAccess: true,
    })

    if (users.docs.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const payloadUser = users.docs[0]

    // If specific bot requested
    if (botId) {
      const bot = await payload.findByID({
        collection: 'bot',
        id: botId,
        overrideAccess: true,
      })

      if (!bot || ((bot as any).createdBy as any)?.id !== payloadUser.id) {
        return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
      }

      // Get bot interactions
      const interactions = await payload.find({
        collection: 'botInteractions',
        where: {
          bot: { equals: botId },
        },
        overrideAccess: true,
      })

      // Get conversations for this bot
      const conversations = await payload.find({
        collection: 'conversation',
        where: {
          bot: { equals: botId },
        },
        sort: '-createdAt',
        limit: 100,
        overrideAccess: true,
      })

      // Get knowledge collections linked to this bot
      const knowledge = await payload.find({
        collection: 'knowledge',
        where: {
          bot: { equals: botId },
        },
        overrideAccess: true,
      })

      // Calculate daily stats for the period
      const periodDays = parseInt(period)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - periodDays)

      const dailyStats = generateDailyStats(conversations.docs, periodDays)

      return NextResponse.json({
        bot: {
          id: bot.id,
          name: bot.name,
          description: bot.description,
          avatar: ((bot as any).avatar as any)?.url || null,
          is_public: bot.is_public,
          createdAt: bot.createdAt,
        },
        stats: {
          totalConversations: conversations.totalDocs,
          totalLikes: interactions.docs.filter((i) => (i as any).interaction_type === 'like').length,
          totalFavorites: interactions.docs.filter((i) => (i as any).interaction_type === 'favorite').length,
          totalKnowledge: knowledge.totalDocs,
          rating: (bot as any).rating || 0,
        },
        dailyStats,
        recentConversations: conversations.docs.slice(0, 10).map((c) => ({
          id: c.id,
          createdAt: c.createdAt,
          messageCount: (c as any).message_count || 0,
        })),
      })
    }

    // Get all user's bots with stats
    const bots = await payload.find({
      collection: 'bot',
      where: {
        user: { equals: payloadUser.id },
      },
      limit: 100,
      depth: 1, // Include creator profile
      overrideAccess: true,
    })

    const botAnalytics = await Promise.all(
      bots.docs.map(async (bot) => {
        const interactions = await payload.find({
          collection: 'botInteractions',
          where: {
            bot: { equals: bot.id },
          },
          overrideAccess: true,
        })

        // Get creator username from creator_profile
        const creatorProfile = (bot as any).creator_profile
        const creatorUsername =
          typeof creatorProfile === 'object' ? creatorProfile.username : null

        return {
          id: bot.id,
          name: bot.name,
          slug: bot.slug,
          avatar: ((bot as any).avatar as any)?.url || null,
          is_public: bot.is_public,
          conversationCount: (bot as any).conversation_count || 0,
          likes: interactions.docs.filter((i) => (i as any).interaction_type === 'like').length,
          favorites: interactions.docs.filter((i) => (i as any).interaction_type === 'favorite').length,
          rating: (bot as any).rating || 0,
          createdAt: bot.createdAt,
          creator_username: creatorUsername,
        }
      })
    )

    // Sort by conversation count
    botAnalytics.sort((a, b) => b.conversationCount - a.conversationCount)

    return NextResponse.json({
      bots: botAnalytics,
      total: bots.totalDocs,
      summary: {
        totalBots: bots.totalDocs,
        totalPublic: bots.docs.filter((b) => b.is_public).length,
        totalConversations: botAnalytics.reduce((sum, b) => sum + b.conversationCount, 0),
        totalLikes: botAnalytics.reduce((sum, b) => sum + b.likes, 0),
        totalFavorites: botAnalytics.reduce((sum, b) => sum + b.favorites, 0),
      },
    })
  } catch (error) {
    console.error('Error fetching bot analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bot analytics' },
      { status: 500 }
    )
  }
}

function generateDailyStats(conversations: any[], days: number) {
  const stats: { date: string; conversations: number }[] = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    const count = conversations.filter((c) => {
      const cDate = new Date(c.createdAt).toISOString().split('T')[0]
      return cDate === dateStr
    }).length

    stats.push({ date: dateStr, conversations: count })
  }

  return stats
}
