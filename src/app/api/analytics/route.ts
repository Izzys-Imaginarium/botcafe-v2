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
        createdBy: { equals: payloadUser.id },
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

    // Fetch conversations
    const conversations = await payload.find({
      collection: 'conversation',
      where: {
        user: { equals: payloadUser.id },
      },
      sort: '-createdAt',
      limit: 100,
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
        createdBy: { equals: payloadUser.id },
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
      totalLikes: interactions.docs.filter((i) => (i as any).interaction_type === 'like').length,
      totalFavorites: interactions.docs.filter((i) => (i as any).interaction_type === 'favorite').length,
    }

    // Calculate bot statistics
    const botStats = bots.docs.map((bot) => {
      const botInteractions = interactions.docs.filter(
        (i) => ((i as any).bot as any)?.id === bot.id || (i as any).bot === bot.id
      )
      return {
        id: bot.id,
        name: bot.name,
        avatar: ((bot as any).avatar as any)?.url || null,
        is_public: bot.is_public,
        conversationCount: (bot as any).conversation_count || 0,
        likes: botInteractions.filter((i) => (i as any).interaction_type === 'like').length,
        favorites: botInteractions.filter((i) => (i as any).interaction_type === 'favorite').length,
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
        .map((c) => ({
          type: 'conversation' as const,
          name: ((c as any).bot as any)?.name || 'Unknown Bot',
          date: c.createdAt,
        })),
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
