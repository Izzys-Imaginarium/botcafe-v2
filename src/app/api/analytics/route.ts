import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

// GET /api/analytics - Get user's overall analytics dashboard data
export async function GET() {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Find the Payload user
    const users = await payload.find({
      collection: 'users',
      where: {
        email: { equals: user.emailAddresses[0]?.emailAddress },
      },
      overrideAccess: true,
    })

    if (users.docs.length === 0) {
      return NextResponse.json({
        overview: getEmptyOverview(),
        botStats: [],
        recentActivity: [],
        trends: getEmptyTrends(),
      })
    }

    const payloadUser = users.docs[0]

    // Fetch user's bots
    const bots = await payload.find({
      collection: 'bot',
      where: {
        user: { equals: payloadUser.id },
      },
      limit: 100,
      overrideAccess: true,
    })

    // Fetch bot interactions (likes/favorites)
    const interactions = await payload.find({
      collection: 'botInteractions',
      where: {
        user: { equals: payloadUser.id },
      },
      limit: 500,
      overrideAccess: true,
    })

    // Fetch conversations (with depth to populate bot_participation.bot_id relationship)
    const conversations = await payload.find({
      collection: 'conversation',
      where: {
        user: { equals: payloadUser.id },
      },
      sort: '-createdAt',
      limit: 100,
      depth: 2, // Populate bot_participation.bot_id relationship to get bot name
      overrideAccess: true,
    })

    // Fetch personas
    const personas = await payload.find({
      collection: 'personas',
      where: {
        user: { equals: payloadUser.id },
      },
      overrideAccess: true,
    })

    // Fetch knowledge entries
    const knowledge = await payload.find({
      collection: 'knowledge',
      where: {
        user: { equals: payloadUser.id },
      },
      overrideAccess: true,
    })

    // Fetch memories
    const memories = await payload.find({
      collection: 'memory',
      where: {
        user: { equals: payloadUser.id },
      },
      overrideAccess: true,
    })

    // Calculate overview statistics
    const overview = {
      totalBots: bots.totalDocs,
      publicBots: bots.docs.filter((b) => b.is_public).length,
      totalConversations: conversations.totalDocs,
      totalPersonas: personas.totalDocs,
      totalKnowledge: knowledge.totalDocs,
      totalMemories: memories.totalDocs,
      totalLikes: interactions.docs.filter((i) => (i as any).liked === true).length,
      totalFavorites: interactions.docs.filter((i) => (i as any).favorited === true).length,
    }

    // Calculate bot statistics
    const botStats = bots.docs.map((bot) => {
      const botInteractions = interactions.docs.filter(
        (i) => ((i as any).bot as any)?.id === bot.id || (i as any).bot === bot.id
      )
      // Count conversations where this bot appears in bot_participation array OR participants.bots
      const botConversationCount = conversations.docs.filter((conv) => {
        // Check bot_participation array (newer format)
        const participation = (conv as any).bot_participation as any[] | undefined
        if (participation && Array.isArray(participation)) {
          const found = participation.some((p) => {
            const botId = p.bot_id?.id || p.bot_id
            return String(botId) === String(bot.id)
          })
          if (found) return true
        }
        // Check participants.bots JSON field (older format)
        const participants = (conv as any).participants
        if (participants && Array.isArray(participants.bots)) {
          return participants.bots.some((id: any) => String(id) === String(bot.id))
        }
        return false
      }).length
      return {
        id: bot.id,
        name: bot.name,
        avatar: ((bot as any).avatar as any)?.url || null,
        is_public: bot.is_public,
        conversationCount: botConversationCount,
        likes: botInteractions.filter((i) => (i as any).liked === true).length,
        favorites: botInteractions.filter((i) => (i as any).favorited === true).length,
        rating: (bot as any).rating || 0,
        createdAt: bot.createdAt,
      }
    }).sort((a, b) => b.conversationCount - a.conversationCount)

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentActivity = [
      ...bots.docs
        .filter((b) => new Date(b.createdAt) > thirtyDaysAgo)
        .map((b) => ({
          type: 'bot_created' as const,
          name: b.name,
          date: b.createdAt,
        })),
      ...conversations.docs
        .filter((c) => new Date(c.createdAt) > thirtyDaysAgo)
        .slice(0, 10)
        .map((c) => {
          // Get bot name from bot_participation array (first/primary bot) OR participants.bots
          let botName = 'Unknown Bot'

          // Try bot_participation array first (newer format)
          const participation = (c as any).bot_participation as any[] | undefined
          if (participation && participation.length > 0) {
            const primaryBot = participation[0]?.bot_id
            if (primaryBot?.name) {
              botName = primaryBot.name
            }
          }

          // If still unknown, try participants.bots and look up bot name
          if (botName === 'Unknown Bot') {
            const participants = (c as any).participants
            if (participants && Array.isArray(participants.bots) && participants.bots.length > 0) {
              const firstBotId = String(participants.bots[0])
              const matchingBot = bots.docs.find((b) => String(b.id) === firstBotId)
              if (matchingBot) {
                botName = matchingBot.name
              }
            }
          }

          // Fallback to conversation title
          if (botName === 'Unknown Bot' && (c as any).title) {
            botName = (c as any).title
          }

          return {
            type: 'conversation' as const,
            name: botName,
            date: c.createdAt,
          }
        }),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20)

    // Calculate trends (simplified - comparing last 7 days to previous 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const recentConversations = conversations.docs.filter(
      (c) => new Date(c.createdAt) > sevenDaysAgo
    ).length
    const previousConversations = conversations.docs.filter(
      (c) => new Date(c.createdAt) > fourteenDaysAgo && new Date(c.createdAt) <= sevenDaysAgo
    ).length

    const conversationTrend = previousConversations > 0
      ? ((recentConversations - previousConversations) / previousConversations) * 100
      : recentConversations > 0 ? 100 : 0

    const trends = {
      conversationsThisWeek: recentConversations,
      conversationTrend: Math.round(conversationTrend),
      botsCreatedThisWeek: bots.docs.filter((b) => new Date(b.createdAt) > sevenDaysAgo).length,
      knowledgeAddedThisWeek: knowledge.docs.filter((k) => new Date(k.createdAt) > sevenDaysAgo).length,
    }

    return NextResponse.json({
      overview,
      botStats: botStats.slice(0, 10), // Top 10 bots
      recentActivity,
      trends,
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    // Return empty data instead of error for better UX
    return NextResponse.json({
      overview: getEmptyOverview(),
      botStats: [],
      recentActivity: [],
      trends: getEmptyTrends(),
    })
  }
}

function getEmptyOverview() {
  return {
    totalBots: 0,
    publicBots: 0,
    totalConversations: 0,
    totalPersonas: 0,
    totalKnowledge: 0,
    totalMemories: 0,
    totalLikes: 0,
    totalFavorites: 0,
  }
}

function getEmptyTrends() {
  return {
    conversationsThisWeek: 0,
    conversationTrend: 0,
    botsCreatedThisWeek: 0,
    knowledgeAddedThisWeek: 0,
  }
}
