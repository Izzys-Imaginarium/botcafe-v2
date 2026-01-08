import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

// GET /api/wellbeing/settings - Get user's self-moderation settings
export async function GET() {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
      // Return default settings for new users
      return NextResponse.json({
        settings: getDefaultSettings(),
        isNew: true,
      })
    }

    const payloadUser = users.docs[0]

    // Fetch self-moderation settings
    const settings = await payload.find({
      collection: 'self-moderation',
      where: {
        user: { equals: payloadUser.id },
      },
      overrideAccess: true,
    })

    if (settings.docs.length === 0) {
      return NextResponse.json({
        settings: getDefaultSettings(),
        isNew: true,
      })
    }

    return NextResponse.json({
      settings: settings.docs[0],
      isNew: false,
    })
  } catch (error) {
    console.error('Error fetching wellbeing settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// POST /api/wellbeing/settings - Create or update self-moderation settings
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as any

    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Find or create the Payload user by email
    let users = await payload.find({
      collection: 'users',
      where: {
        email: { equals: user.emailAddresses[0]?.emailAddress },
      },
      overrideAccess: true,
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

    // Check for existing settings
    const existingSettings = await payload.find({
      collection: 'self-moderation',
      where: {
        user: { equals: payloadUser.id },
      },
      overrideAccess: true,
    })

    const settingsData = {
      user: payloadUser.id,
      daily_usage_limit: body.daily_usage_limit ?? 60,
      weekly_usage_limit: body.weekly_usage_limit ?? 420,
      break_reminder_interval: body.break_reminder_interval ?? 25,
      healthy_habits: {
        enable_break_reminders: body.healthy_habits?.enable_break_reminders ?? true,
        enable_usage_tracking: body.healthy_habits?.enable_usage_tracking ?? true,
        enable_mood_checkins: body.healthy_habits?.enable_mood_checkins ?? true,
        night_mode_hours: {
          enabled: body.healthy_habits?.night_mode_hours?.enabled ?? false,
          start_hour: body.healthy_habits?.night_mode_hours?.start_hour ?? 22,
          end_hour: body.healthy_habits?.night_mode_hours?.end_hour ?? 8,
        },
        mindfulness_breaks: body.healthy_habits?.mindfulness_breaks ?? false,
      },
      intervention_triggers: {
        excessive_daily_usage: body.intervention_triggers?.excessive_daily_usage ?? true,
        late_night_usage: body.intervention_triggers?.late_night_usage ?? true,
        consecutive_days_overuse: body.intervention_triggers?.consecutive_days_overuse ?? 2,
        declining_mood_trend: body.intervention_triggers?.declining_mood_trend ?? true,
      },
      is_active: body.is_active ?? true,
    }

    let settings
    if (existingSettings.docs.length > 0) {
      // Update existing settings
      settings = await payload.update({
        collection: 'self-moderation',
        id: existingSettings.docs[0].id,
        data: settingsData,
        overrideAccess: true,
      })
    } else {
      // Create new settings
      settings = await payload.create({
        collection: 'self-moderation',
        data: {
          ...settingsData,
          progress_tracking: {
            total_usage_minutes_today: 0,
            total_usage_minutes_week: 0,
            last_reset_date: new Date().toISOString(),
            consecutive_healthy_days: 0,
            mood_entries_count_week: 0,
          },
        },
        overrideAccess: true,
      })
    }

    return NextResponse.json({ settings, success: true })
  } catch (error) {
    console.error('Error saving wellbeing settings:', error)
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    )
  }
}

// PUT /api/wellbeing/settings - Update usage tracking
export async function PUT(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as { action?: string; minutes?: number }
    const { action, minutes } = body

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

    // Fetch self-moderation settings
    const settings = await payload.find({
      collection: 'self-moderation',
      where: {
        user: { equals: payloadUser.id },
      },
      overrideAccess: true,
    })

    if (settings.docs.length === 0) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 })
    }

    const currentSettings = settings.docs[0]
    const progressTracking = currentSettings.progress_tracking as any

    let updatedProgress = { ...progressTracking }

    switch (action) {
      case 'log_usage':
        updatedProgress.total_usage_minutes_today = (progressTracking.total_usage_minutes_today || 0) + (minutes || 0)
        updatedProgress.total_usage_minutes_week = (progressTracking.total_usage_minutes_week || 0) + (minutes || 0)
        break

      case 'take_break':
        updatedProgress.last_break_time = new Date().toISOString()
        break

      case 'reset_daily':
        updatedProgress.total_usage_minutes_today = 0
        updatedProgress.last_reset_date = new Date().toISOString()
        // Check if user stayed within limits
        if (progressTracking.total_usage_minutes_today <= currentSettings.daily_usage_limit) {
          updatedProgress.consecutive_healthy_days = (progressTracking.consecutive_healthy_days || 0) + 1
        } else {
          updatedProgress.consecutive_healthy_days = 0
        }
        break

      case 'reset_weekly':
        updatedProgress.total_usage_minutes_week = 0
        updatedProgress.mood_entries_count_week = 0
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const updated = await payload.update({
      collection: 'self-moderation',
      id: currentSettings.id,
      data: {
        progress_tracking: updatedProgress,
        last_checkin: new Date().toISOString(),
      },
      overrideAccess: true,
    })

    // Check for intervention triggers
    const interventions = checkInterventions(currentSettings, updatedProgress)

    return NextResponse.json({
      settings: updated,
      interventions,
      success: true,
    })
  } catch (error) {
    console.error('Error updating usage tracking:', error)
    return NextResponse.json(
      { error: 'Failed to update tracking' },
      { status: 500 }
    )
  }
}

function getDefaultSettings() {
  return {
    daily_usage_limit: 60,
    weekly_usage_limit: 420,
    break_reminder_interval: 25,
    healthy_habits: {
      enable_break_reminders: true,
      enable_usage_tracking: true,
      enable_mood_checkins: true,
      night_mode_hours: {
        enabled: false,
        start_hour: 22,
        end_hour: 8,
      },
      mindfulness_breaks: false,
    },
    intervention_triggers: {
      excessive_daily_usage: true,
      late_night_usage: true,
      consecutive_days_overuse: 2,
      declining_mood_trend: true,
    },
    progress_tracking: {
      total_usage_minutes_today: 0,
      total_usage_minutes_week: 0,
      consecutive_healthy_days: 0,
      mood_entries_count_week: 0,
    },
    is_active: true,
  }
}

function checkInterventions(settings: any, progress: any): string[] {
  const interventions: string[] = []
  const triggers = settings.intervention_triggers as any

  // Check daily usage
  if (triggers?.excessive_daily_usage && progress.total_usage_minutes_today > settings.daily_usage_limit) {
    interventions.push('daily_limit_exceeded')
  }

  // Check weekly usage
  if (progress.total_usage_minutes_week > settings.weekly_usage_limit) {
    interventions.push('weekly_limit_exceeded')
  }

  // Check late night usage
  if (triggers?.late_night_usage && settings.healthy_habits?.night_mode_hours?.enabled) {
    const now = new Date().getHours()
    const startHour = settings.healthy_habits.night_mode_hours.start_hour
    const endHour = settings.healthy_habits.night_mode_hours.end_hour

    if (startHour > endHour) {
      // Night mode spans midnight
      if (now >= startHour || now < endHour) {
        interventions.push('late_night_usage')
      }
    } else {
      if (now >= startHour && now < endHour) {
        interventions.push('late_night_usage')
      }
    }
  }

  return interventions
}
