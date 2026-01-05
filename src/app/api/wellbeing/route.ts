import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

// GET /api/wellbeing - Get user's overall wellbeing dashboard data
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
        clerkUserId: { equals: user.id },
      },
    })

    if (users.docs.length === 0) {
      return NextResponse.json({
        hasSettings: false,
        settings: null,
        moodSummary: null,
        usageSummary: null,
        recommendations: getDefaultRecommendations(),
      })
    }

    const payloadUser = users.docs[0]

    // Fetch self-moderation settings
    const settingsResult = await payload.find({
      collection: 'self-moderation',
      where: {
        user: { equals: payloadUser.id },
      },
    })

    const settings = settingsResult.docs[0] || null

    // Fetch recent mood entries (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const moodEntries = await payload.find({
      collection: 'mood',
      where: {
        user: { equals: payloadUser.id },
        timestamp: { greater_than: sevenDaysAgo.toISOString() },
      },
      sort: '-timestamp',
      limit: 50,
    })

    // Calculate mood summary
    const moodSummary = calculateMoodSummary(moodEntries.docs)

    // Calculate usage summary
    const usageSummary = settings
      ? calculateUsageSummary(settings)
      : null

    // Generate personalized recommendations
    const recommendations = generateRecommendations(settings, moodSummary, usageSummary)

    return NextResponse.json({
      hasSettings: !!settings,
      settings,
      moodSummary,
      usageSummary,
      recommendations,
    })
  } catch (error) {
    console.error('Error fetching wellbeing dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wellbeing data' },
      { status: 500 }
    )
  }
}

function calculateMoodSummary(entries: any[]) {
  if (entries.length === 0) {
    return {
      totalEntries: 0,
      averageMood: null,
      trend: 'neutral',
      mostCommon: null,
      streakDays: 0,
      lastEntry: null,
    }
  }

  const moodScores: Record<string, number> = {
    'very-happy': 5,
    'happy': 4,
    'excited': 4,
    'content': 3,
    'neutral': 2,
    'anxious': 1,
    'frustrated': 1,
    'sad': 0,
    'angry': 0,
    'very-sad': -1,
  }

  // Calculate average mood score
  let totalScore = 0
  const moodCounts: Record<string, number> = {}

  entries.forEach((entry) => {
    const mood = entry.mood as string
    totalScore += moodScores[mood] ?? 2
    moodCounts[mood] = (moodCounts[mood] || 0) + 1
  })

  const averageScore = totalScore / entries.length

  // Find most common mood
  let mostCommon: string | null = null
  let maxCount = 0
  Object.entries(moodCounts).forEach(([mood, count]) => {
    if (count > maxCount) {
      mostCommon = mood
      maxCount = count
    }
  })

  // Calculate trend (compare first half vs second half)
  const midpoint = Math.floor(entries.length / 2)
  const recentEntries = entries.slice(0, midpoint || 1)
  const olderEntries = entries.slice(midpoint || 1)

  let recentScore = 0
  let olderScore = 0

  recentEntries.forEach((e) => (recentScore += moodScores[e.mood as string] ?? 2))
  olderEntries.forEach((e) => (olderScore += moodScores[e.mood as string] ?? 2))

  const recentAvg = recentEntries.length > 0 ? recentScore / recentEntries.length : 2
  const olderAvg = olderEntries.length > 0 ? olderScore / olderEntries.length : 2

  let trend = 'stable'
  if (recentAvg > olderAvg + 0.5) trend = 'improving'
  else if (recentAvg < olderAvg - 0.5) trend = 'declining'

  // Calculate streak
  const streakDays = calculateStreak(entries)

  return {
    totalEntries: entries.length,
    averageMood: averageScore,
    trend,
    mostCommon,
    streakDays,
    lastEntry: entries[0]?.timestamp || null,
  }
}

function calculateStreak(entries: any[]): number {
  if (entries.length === 0) return 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let streak = 0
  let currentDate = new Date(today)

  const entryDates = new Set<string>()
  entries.forEach((entry) => {
    const date = new Date(entry.timestamp)
    date.setHours(0, 0, 0, 0)
    entryDates.add(date.toISOString())
  })

  while (entryDates.has(currentDate.toISOString())) {
    streak++
    currentDate.setDate(currentDate.getDate() - 1)
  }

  return streak
}

function calculateUsageSummary(settings: any) {
  const progress = settings.progress_tracking as any

  const dailyUsed = progress?.total_usage_minutes_today || 0
  const dailyLimit = settings.daily_usage_limit || 60
  const weeklyUsed = progress?.total_usage_minutes_week || 0
  const weeklyLimit = settings.weekly_usage_limit || 420

  return {
    dailyUsed,
    dailyLimit,
    dailyPercentage: Math.min(100, (dailyUsed / dailyLimit) * 100),
    weeklyUsed,
    weeklyLimit,
    weeklyPercentage: Math.min(100, (weeklyUsed / weeklyLimit) * 100),
    consecutiveHealthyDays: progress?.consecutive_healthy_days || 0,
    lastBreak: progress?.last_break_time || null,
    isWithinLimits: dailyUsed <= dailyLimit && weeklyUsed <= weeklyLimit,
  }
}

function generateRecommendations(settings: any, moodSummary: any, usageSummary: any): string[] {
  const recommendations: string[] = []

  // No mood entries
  if (!moodSummary || moodSummary.totalEntries === 0) {
    recommendations.push('Start tracking your mood to better understand your emotional patterns.')
  } else {
    // Streak recommendations
    if (moodSummary.streakDays === 0) {
      recommendations.push("Log your mood today to start building a streak!")
    } else if (moodSummary.streakDays >= 7) {
      recommendations.push(`Great job! You've logged your mood for ${moodSummary.streakDays} days in a row.`)
    }

    // Trend-based recommendations
    if (moodSummary.trend === 'declining') {
      recommendations.push('Your mood has been trending down. Consider taking a break or reaching out for support.')
    } else if (moodSummary.trend === 'improving') {
      recommendations.push("Your mood is improving! Keep up the positive habits you've been practicing.")
    }
  }

  // Usage-based recommendations
  if (usageSummary) {
    if (usageSummary.dailyPercentage > 80) {
      recommendations.push("You're approaching your daily usage limit. Consider taking a mindful break.")
    }
    if (usageSummary.weeklyPercentage > 90) {
      recommendations.push("You've nearly reached your weekly limit. Plan some screen-free activities.")
    }
    if (usageSummary.consecutiveHealthyDays >= 5) {
      recommendations.push(`Excellent! ${usageSummary.consecutiveHealthyDays} consecutive days within your limits.`)
    }
  }

  // Settings-based recommendations
  if (!settings) {
    recommendations.push('Set up your wellbeing preferences to enable personalized tracking and reminders.')
  } else {
    if (!settings.healthy_habits?.enable_break_reminders) {
      recommendations.push('Enable break reminders to maintain healthy usage patterns.')
    }
  }

  return recommendations.length > 0 ? recommendations : getDefaultRecommendations()
}

function getDefaultRecommendations(): string[] {
  return [
    'Track your mood regularly to identify patterns.',
    'Set usage limits to maintain healthy habits.',
    "Take breaks every 25-30 minutes to rest your eyes and mind.",
    'Explore our crisis support resources if you need help.',
  ]
}
