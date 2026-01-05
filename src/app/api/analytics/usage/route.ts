import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

// GET /api/analytics/usage - Get user's usage statistics
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // days

    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Find the Payload user
    const users = await payload.find({
      collection: 'users',
      where: {
        clerkUserId: { equals: user.id },
      },
    })

    if (users.docs.length === 0) {
      return NextResponse.json({
        usage: getEmptyUsage(),
        dailyActivity: [],
        contentBreakdown: getEmptyContentBreakdown(),
      })
    }

    const payloadUser = users.docs[0]
    const periodDays = parseInt(period)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    // Fetch various user content
    const [bots, conversations, personas, knowledge, memories, moods] = await Promise.all([
      payload.find({
        collection: 'bot',
        where: { createdBy: { equals: payloadUser.id } },
      }),
      payload.find({
        collection: 'conversation',
        where: { user: { equals: payloadUser.id } },
        sort: '-createdAt',
        limit: 500,
      }),
      payload.find({
        collection: 'personas',
        where: { user: { equals: payloadUser.id } },
      }),
      payload.find({
        collection: 'knowledge',
        where: { createdBy: { equals: payloadUser.id } },
      }),
      payload.find({
        collection: 'memory',
        where: { user: { equals: payloadUser.id } },
      }),
      payload.find({
        collection: 'mood',
        where: {
          user: { equals: payloadUser.id },
          timestamp: { greater_than: startDate.toISOString() },
        },
        sort: '-timestamp',
      }),
    ])

    // Calculate usage statistics
    const usage = {
      totalBots: bots.totalDocs,
      totalConversations: conversations.totalDocs,
      totalPersonas: personas.totalDocs,
      totalKnowledge: knowledge.totalDocs,
      totalMemories: memories.totalDocs,
      totalMoodEntries: moods.totalDocs,
      activeDays: calculateActiveDays(conversations.docs, periodDays),
      averageConversationsPerDay: Math.round(
        conversations.docs.filter((c) => new Date(c.createdAt) > startDate).length / periodDays * 10
      ) / 10,
    }

    // Generate daily activity for the period
    const dailyActivity = generateDailyActivity(
      conversations.docs,
      moods.docs,
      periodDays
    )

    // Content breakdown
    const contentBreakdown = {
      bots: {
        total: bots.totalDocs,
        public: bots.docs.filter((b) => b.is_public).length,
        private: bots.docs.filter((b) => !b.is_public).length,
      },
      knowledge: {
        total: knowledge.totalDocs,
        vectorized: knowledge.docs.filter((k) => k.is_vectorized).length,
        pending: knowledge.docs.filter((k) => !k.is_vectorized).length,
      },
      memories: {
        total: memories.totalDocs,
        summarized: memories.docs.filter((m) => (m as any).summary).length,
        raw: memories.docs.filter((m) => !(m as any).summary).length,
      },
      personas: {
        total: personas.totalDocs,
        active: personas.docs.filter((p) => p.is_default).length,
      },
    }

    // Calculate engagement metrics
    const engagementMetrics = {
      moodTrackingStreak: calculateMoodStreak(moods.docs),
      averageMood: calculateAverageMood(moods.docs),
      mostActiveDay: findMostActiveDay(conversations.docs),
      peakHour: findPeakHour(conversations.docs),
    }

    return NextResponse.json({
      usage,
      dailyActivity,
      contentBreakdown,
      engagementMetrics,
      period: periodDays,
    })
  } catch (error) {
    console.error('Error fetching usage analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage analytics' },
      { status: 500 }
    )
  }
}

function getEmptyUsage() {
  return {
    totalBots: 0,
    totalConversations: 0,
    totalPersonas: 0,
    totalKnowledge: 0,
    totalMemories: 0,
    totalMoodEntries: 0,
    activeDays: 0,
    averageConversationsPerDay: 0,
  }
}

function getEmptyContentBreakdown() {
  return {
    bots: { total: 0, public: 0, private: 0 },
    knowledge: { total: 0, vectorized: 0, pending: 0 },
    memories: { total: 0, summarized: 0, raw: 0 },
    personas: { total: 0, active: 0 },
  }
}

function calculateActiveDays(conversations: any[], periodDays: number): number {
  const today = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - periodDays)

  const activeDates = new Set<string>()
  conversations.forEach((c) => {
    const date = new Date(c.createdAt)
    if (date >= startDate && date <= today) {
      activeDates.add(date.toISOString().split('T')[0])
    }
  })

  return activeDates.size
}

function generateDailyActivity(
  conversations: any[],
  moods: any[],
  days: number
) {
  const stats: { date: string; conversations: number; moods: number }[] = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    const convCount = conversations.filter((c) => {
      const cDate = new Date(c.createdAt).toISOString().split('T')[0]
      return cDate === dateStr
    }).length

    const moodCount = moods.filter((m) => {
      const mDate = new Date(m.timestamp).toISOString().split('T')[0]
      return mDate === dateStr
    }).length

    stats.push({ date: dateStr, conversations: convCount, moods: moodCount })
  }

  return stats
}

function calculateMoodStreak(moods: any[]): number {
  if (moods.length === 0) return 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let streak = 0
  let currentDate = new Date(today)

  const moodDates = new Set<string>()
  moods.forEach((m) => {
    const date = new Date(m.timestamp)
    date.setHours(0, 0, 0, 0)
    moodDates.add(date.toISOString())
  })

  while (moodDates.has(currentDate.toISOString())) {
    streak++
    currentDate.setDate(currentDate.getDate() - 1)
  }

  return streak
}

function calculateAverageMood(moods: any[]): string | null {
  if (moods.length === 0) return null

  const moodScores: Record<string, number> = {
    'very-happy': 5, 'happy': 4, 'excited': 4, 'content': 3,
    'neutral': 2, 'anxious': 1, 'frustrated': 1, 'sad': 0,
    'angry': 0, 'very-sad': -1,
  }

  let total = 0
  moods.forEach((m) => {
    total += moodScores[m.mood as string] ?? 2
  })

  const avg = total / moods.length
  if (avg >= 4) return 'Positive'
  if (avg >= 2.5) return 'Neutral'
  return 'Needs attention'
}

function findMostActiveDay(conversations: any[]): string | null {
  if (conversations.length === 0) return null

  const dayCounts: Record<number, number> = {}
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  conversations.forEach((c) => {
    const day = new Date(c.createdAt).getDay()
    dayCounts[day] = (dayCounts[day] || 0) + 1
  })

  let maxDay = 0
  let maxCount = 0
  Object.entries(dayCounts).forEach(([day, count]) => {
    if (count > maxCount) {
      maxDay = parseInt(day)
      maxCount = count
    }
  })

  return dayNames[maxDay]
}

function findPeakHour(conversations: any[]): string | null {
  if (conversations.length === 0) return null

  const hourCounts: Record<number, number> = {}

  conversations.forEach((c) => {
    const hour = new Date(c.createdAt).getHours()
    hourCounts[hour] = (hourCounts[hour] || 0) + 1
  })

  let maxHour = 0
  let maxCount = 0
  Object.entries(hourCounts).forEach(([hour, count]) => {
    if (count > maxCount) {
      maxHour = parseInt(hour)
      maxCount = count
    }
  })

  const period = maxHour >= 12 ? 'PM' : 'AM'
  const displayHour = maxHour % 12 || 12
  return `${displayHour}:00 ${period}`
}
