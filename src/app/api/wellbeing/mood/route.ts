import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

// GET /api/wellbeing/mood - Get user's mood entries
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '30')
    const page = parseInt(searchParams.get('page') || '1')
    const days = parseInt(searchParams.get('days') || '30') // Get last N days

    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Find the Payload user by email
    const users = await payload.find({
      collection: 'users',
      where: {
        email: { equals: user.emailAddresses[0]?.emailAddress },
      },
    })

    if (users.docs.length === 0) {
      return NextResponse.json({ entries: [], total: 0, stats: null })
    }

    const payloadUser = users.docs[0]

    // Calculate date range
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Fetch mood entries
    const moodEntries = await payload.find({
      collection: 'mood',
      where: {
        user: { equals: payloadUser.id },
        timestamp: { greater_than: startDate.toISOString() },
      },
      sort: '-timestamp',
      limit,
      page,
    })

    // Calculate mood statistics
    const moodCounts: Record<string, number> = {}
    moodEntries.docs.forEach((entry) => {
      const mood = entry.mood as string
      moodCounts[mood] = (moodCounts[mood] || 0) + 1
    })

    // Find most common mood
    let mostCommonMood: string | null = null
    let maxCount = 0
    Object.entries(moodCounts).forEach(([mood, count]) => {
      if (count > maxCount) {
        mostCommonMood = mood
        maxCount = count
      }
    })

    // Calculate mood trend (positive/negative/neutral)
    const recentEntries = moodEntries.docs.slice(0, 7)
    const positiveMoods = ['very-happy', 'happy', 'content', 'excited']
    const negativeMoods = ['sad', 'very-sad', 'anxious', 'angry', 'frustrated']

    let positiveCount = 0
    let negativeCount = 0
    recentEntries.forEach((entry) => {
      const mood = entry.mood as string
      if (positiveMoods.includes(mood)) positiveCount++
      if (negativeMoods.includes(mood)) negativeCount++
    })

    let trend = 'neutral'
    if (positiveCount > negativeCount + 2) trend = 'improving'
    else if (negativeCount > positiveCount + 2) trend = 'declining'

    const stats = {
      totalEntries: moodEntries.totalDocs,
      moodCounts,
      mostCommonMood,
      trend,
      streakDays: calculateStreak(moodEntries.docs),
    }

    return NextResponse.json({
      entries: moodEntries.docs,
      total: moodEntries.totalDocs,
      totalPages: moodEntries.totalPages,
      page: moodEntries.page,
      stats,
    })
  } catch (error) {
    console.error('Error fetching mood entries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch mood entries' },
      { status: 500 }
    )
  }
}

// POST /api/wellbeing/mood - Create a new mood entry
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as { mood?: string; note?: string }
    const { mood, note } = body

    if (!mood) {
      return NextResponse.json(
        { error: 'Mood is required' },
        { status: 400 }
      )
    }

    const validMoods = [
      'very-happy', 'happy', 'content', 'neutral',
      'sad', 'very-sad', 'anxious', 'excited', 'angry', 'frustrated'
    ]

    if (!validMoods.includes(mood)) {
      return NextResponse.json(
        { error: 'Invalid mood value' },
        { status: 400 }
      )
    }

    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Find or create the Payload user by email
    let users = await payload.find({
      collection: 'users',
      where: {
        email: { equals: user.emailAddresses[0]?.emailAddress },
      },
    })

    let payloadUser
    if (users.docs.length === 0) {
      payloadUser = await payload.create({
        collection: 'users',
        data: {
          email: user.emailAddresses[0]?.emailAddress || '',
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
        } as any,
        overrideAccess: true,
      })
    } else {
      payloadUser = users.docs[0]
    }

    // Create the mood entry
    const moodEntry = await payload.create({
      collection: 'mood',
      data: {
        user: payloadUser.id,
        mood: mood as any,
        note: note || '',
        timestamp: new Date().toISOString(),
      },
      overrideAccess: true,
    })

    // Update self-moderation tracking if enabled
    try {
      const selfMod = await payload.find({
        collection: 'self-moderation',
        where: {
          user: { equals: payloadUser.id },
        },
      })

      if (selfMod.docs.length > 0) {
        const currentCount = (selfMod.docs[0].progress_tracking as any)?.mood_entries_count_week || 0
        await payload.update({
          collection: 'self-moderation',
          id: selfMod.docs[0].id,
          data: {
            progress_tracking: {
              ...(selfMod.docs[0].progress_tracking as any),
              mood_entries_count_week: currentCount + 1,
            },
          },
          overrideAccess: true,
        })
      }
    } catch (e) {
      // Non-critical, continue
    }

    return NextResponse.json({ entry: moodEntry, success: true })
  } catch (error) {
    console.error('Error creating mood entry:', error)
    return NextResponse.json(
      { error: 'Failed to create mood entry' },
      { status: 500 }
    )
  }
}

// Helper function to calculate check-in streak
function calculateStreak(entries: any[]): number {
  if (entries.length === 0) return 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let streak = 0
  let currentDate = new Date(today)

  // Create a set of dates with entries
  const entryDates = new Set<string>()
  entries.forEach((entry) => {
    const date = new Date(entry.timestamp)
    date.setHours(0, 0, 0, 0)
    entryDates.add(date.toISOString())
  })

  // Count consecutive days
  while (entryDates.has(currentDate.toISOString())) {
    streak++
    currentDate.setDate(currentDate.getDate() - 1)
  }

  return streak
}
