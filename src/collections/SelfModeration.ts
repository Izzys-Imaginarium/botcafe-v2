import type { CollectionConfig } from 'payload'

export const SelfModeration: CollectionConfig = {
  slug: 'self-moderation',
  admin: {
    useAsTitle: 'user',
  },
  access: {
    read: ({ req: { user } }) => {
      return {
        user: {
          equals: user?.id,
        },
      }
    },
    create: ({ req: { user } }) => {
      return {
        user: {
          equals: user?.id,
        },
      }
    },
    update: ({ req: { user } }) => {
      return {
        user: {
          equals: user?.id,
        },
      }
    },
    delete: ({ req: { user } }) => {
      return {
        user: {
          equals: user?.id,
        },
      }
    },
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'daily_usage_limit',
      type: 'number',
      defaultValue: 60, // minutes
      min: 15,
      max: 480,
      admin: {
        description: 'Daily usage limit in minutes',
      },
    },
    {
      name: 'weekly_usage_limit',
      type: 'number',
      defaultValue: 420, // minutes (7 hours)
      min: 60,
      max: 3360, // 56 hours
      admin: {
        description: 'Weekly usage limit in minutes',
      },
    },
    {
      name: 'break_reminder_interval',
      type: 'number',
      defaultValue: 25, // minutes (Pomodoro technique)
      min: 10,
      max: 60,
      admin: {
        description: 'Break reminder interval in minutes',
      },
    },
    {
      name: 'healthy_habits',
      type: 'group',
      fields: [
        {
          name: 'enable_break_reminders',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'enable_usage_tracking',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'enable_mood_checkins',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'night_mode_hours',
          type: 'group',
          fields: [
            {
              name: 'enabled',
              type: 'checkbox',
              defaultValue: false,
            },
            {
              name: 'start_hour',
              type: 'number',
              min: 0,
              max: 23,
              defaultValue: 22,
            },
            {
              name: 'end_hour',
              type: 'number',
              min: 0,
              max: 23,
              defaultValue: 8,
            },
          ],
        },
        {
          name: 'mindfulness_breaks',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Enable guided mindfulness break reminders',
          },
        },
      ],
    },
    {
      name: 'intervention_triggers',
      type: 'group',
      fields: [
        {
          name: 'excessive_daily_usage',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Alert when daily limit is exceeded',
          },
        },
        {
          name: 'late_night_usage',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Alert for usage during night mode hours',
          },
        },
        {
          name: 'consecutive_days_overuse',
          type: 'number',
          min: 0,
          max: 7,
          defaultValue: 2,
          admin: {
            description: 'Alert after consecutive days of overuse',
          },
        },
        {
          name: 'declining_mood_trend',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Alert when mood trends decline over time',
          },
        },
      ],
    },
    {
      name: 'progress_tracking',
      type: 'group',
      fields: [
        {
          name: 'total_usage_minutes_today',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'total_usage_minutes_week',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'last_reset_date',
          type: 'date',
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'consecutive_healthy_days',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'last_break_time',
          type: 'date',
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'mood_entries_count_week',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
          },
        },
      ],
    },
    {
      name: 'last_checkin',
      type: 'date',
      admin: {
        readOnly: true,
        description: 'Last time user checked in with self-moderation system',
      },
    },
    {
      name: 'is_active',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
}
