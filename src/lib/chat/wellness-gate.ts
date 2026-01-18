/**
 * Wellness Gate Service
 *
 * Checks self-moderation settings before allowing chat messages.
 * Implements usage limits, break reminders, and night mode.
 */

import type { Payload } from 'payload'

export interface WellnessCheckResult {
  allowed: boolean
  reason?: 'daily_limit' | 'weekly_limit' | 'night_mode' | 'break_needed'
  message?: string
  minutesUntilReset?: number
  suggestBreak?: boolean
  breakMinutesSinceLastBreak?: number
}

export interface WellnessSettings {
  daily_usage_limit?: number // minutes
  weekly_usage_limit?: number // minutes
  break_reminder_interval?: number // minutes
  night_mode_enabled?: boolean
  night_mode_start_hour?: number
  night_mode_end_hour?: number
  total_usage_minutes_today?: number
  total_usage_minutes_this_week?: number
  last_break_time?: string
  is_enabled?: boolean
}

/**
 * Check if the user is allowed to send a message based on wellness settings
 */
export async function checkWellnessLimits(
  payload: Payload,
  userId: number
): Promise<WellnessCheckResult> {
  try {
    // Fetch user's self-moderation settings
    const settings = await payload.find({
      collection: 'self-moderation',
      where: {
        user: { equals: userId },
      },
      limit: 1,
      overrideAccess: true,
    })

    // If no settings or not enabled, allow
    if (settings.docs.length === 0) {
      return { allowed: true }
    }

    const selfMod = settings.docs[0]

    // If self-moderation is not enabled, allow
    if (!selfMod.is_active) {
      return { allowed: true }
    }

    const now = new Date()
    const currentHour = now.getHours()

    // Check night mode
    if (selfMod.healthy_habits?.night_mode_hours?.enabled) {
      const startHour = selfMod.healthy_habits.night_mode_hours.start_hour || 22
      const endHour = selfMod.healthy_habits.night_mode_hours.end_hour || 6

      const isNightTime = startHour > endHour
        ? currentHour >= startHour || currentHour < endHour // Overnight (e.g., 22-6)
        : currentHour >= startHour && currentHour < endHour // Same day range

      if (isNightTime) {
        // Calculate minutes until night mode ends
        let minutesUntilEnd = 0
        if (currentHour >= startHour) {
          minutesUntilEnd = (24 - currentHour + endHour) * 60
        } else {
          minutesUntilEnd = (endHour - currentHour) * 60
        }

        return {
          allowed: false,
          reason: 'night_mode',
          message: `Night mode is active. Time to rest! Chat will be available at ${endHour}:00.`,
          minutesUntilReset: minutesUntilEnd,
        }
      }
    }

    // Check daily limit
    const dailyLimit = selfMod.daily_usage_limit
    const usedToday = selfMod.progress_tracking?.total_usage_minutes_today || 0

    if (dailyLimit && dailyLimit > 0 && usedToday >= dailyLimit) {
      // Calculate minutes until midnight
      const minutesUntilMidnight = (24 - currentHour) * 60 - now.getMinutes()

      return {
        allowed: false,
        reason: 'daily_limit',
        message: `You've reached your daily usage limit of ${dailyLimit} minutes. Take a break and come back tomorrow!`,
        minutesUntilReset: minutesUntilMidnight,
      }
    }

    // Check weekly limit
    const weeklyLimit = selfMod.weekly_usage_limit
    const usedThisWeek = selfMod.progress_tracking?.total_usage_minutes_week || 0

    if (weeklyLimit && weeklyLimit > 0 && usedThisWeek >= weeklyLimit) {
      // Calculate days until next week (assuming week resets on Monday)
      const daysUntilMonday = (8 - now.getDay()) % 7 || 7
      const minutesUntilWeekReset = daysUntilMonday * 24 * 60

      return {
        allowed: false,
        reason: 'weekly_limit',
        message: `You've reached your weekly usage limit of ${weeklyLimit} minutes. Time for a longer break!`,
        minutesUntilReset: minutesUntilWeekReset,
      }
    }

    // Check break reminder (suggest but don't block)
    const breakInterval = selfMod.break_reminder_interval
    const lastBreak = selfMod.progress_tracking?.last_break_time ? new Date(selfMod.progress_tracking.last_break_time) : null

    if (breakInterval && breakInterval > 0 && lastBreak) {
      const minutesSinceBreak = Math.floor(
        (now.getTime() - lastBreak.getTime()) / (1000 * 60)
      )

      if (minutesSinceBreak >= breakInterval) {
        return {
          allowed: true,
          suggestBreak: true,
          breakMinutesSinceLastBreak: minutesSinceBreak,
          message: `You've been chatting for ${minutesSinceBreak} minutes. Consider taking a short break!`,
        }
      }
    }

    return { allowed: true }
  } catch (error) {
    console.error('Error checking wellness limits:', error)
    // On error, allow the message (fail open)
    return { allowed: true }
  }
}

/**
 * Update usage tracking after a message
 */
export async function updateUsageTracking(
  payload: Payload,
  userId: number,
  minutesUsed: number = 1
): Promise<void> {
  try {
    // Fetch current settings
    const settings = await payload.find({
      collection: 'self-moderation',
      where: {
        user: { equals: userId },
      },
      limit: 1,
      overrideAccess: true,
    })

    if (settings.docs.length === 0) {
      // Create default settings
      await payload.create({
        collection: 'self-moderation',
        data: {
          user: userId,
          is_active: false,
          progress_tracking: {
            total_usage_minutes_today: minutesUsed,
            total_usage_minutes_week: minutesUsed,
            last_break_time: new Date().toISOString(),
          },
        },
        overrideAccess: true,
      })
      return
    }

    const selfMod = settings.docs[0]

    // Check if we need to reset daily/weekly counters
    const now = new Date()
    const lastUpdated = selfMod.updatedAt ? new Date(selfMod.updatedAt) : now

    let todayMinutes = selfMod.progress_tracking?.total_usage_minutes_today || 0
    let weekMinutes = selfMod.progress_tracking?.total_usage_minutes_week || 0

    // Reset daily if it's a new day
    if (lastUpdated.toDateString() !== now.toDateString()) {
      todayMinutes = 0
    }

    // Reset weekly if it's a new week (Monday)
    const lastWeek = getWeekNumber(lastUpdated)
    const thisWeek = getWeekNumber(now)
    if (lastWeek !== thisWeek) {
      weekMinutes = 0
    }

    // Update usage
    await payload.update({
      collection: 'self-moderation',
      id: selfMod.id,
      data: {
        progress_tracking: {
          total_usage_minutes_today: todayMinutes + minutesUsed,
          total_usage_minutes_week: weekMinutes + minutesUsed,
        },
      },
      overrideAccess: true,
    })
  } catch (error) {
    console.error('Error updating usage tracking:', error)
    // Non-blocking - don't fail the chat
  }
}

/**
 * Record that the user took a break
 */
export async function recordBreak(
  payload: Payload,
  userId: number
): Promise<void> {
  try {
    const settings = await payload.find({
      collection: 'self-moderation',
      where: {
        user: { equals: userId },
      },
      limit: 1,
      overrideAccess: true,
    })

    if (settings.docs.length > 0) {
      await payload.update({
        collection: 'self-moderation',
        id: settings.docs[0].id,
        data: {
          progress_tracking: {
            last_break_time: new Date().toISOString(),
          },
        },
        overrideAccess: true,
      })
    }
  } catch (error) {
    console.error('Error recording break:', error)
  }
}

/**
 * Get ISO week number
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}
