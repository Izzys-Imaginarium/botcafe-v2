'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Shield,
  Clock,
  Moon,
  Bell,
  Brain,
  AlertTriangle,
  Heart,
  RefreshCw,
  Check,
  AlertCircle,
  Save,
} from 'lucide-react'

interface HealthyHabits {
  enable_break_reminders: boolean
  enable_usage_tracking: boolean
  enable_mood_checkins: boolean
  night_mode_hours: {
    enabled: boolean
    start_hour: number
    end_hour: number
  }
  mindfulness_breaks: boolean
}

interface InterventionTriggers {
  excessive_daily_usage: boolean
  late_night_usage: boolean
  consecutive_days_overuse: number
  declining_mood_trend: boolean
}

interface Settings {
  daily_usage_limit: number
  weekly_usage_limit: number
  break_reminder_interval: number
  healthy_habits: HealthyHabits
  intervention_triggers: InterventionTriggers
  is_active: boolean
}

const defaultSettings: Settings = {
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
  is_active: true,
}

export const SelfModerationSettingsView = () => {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/wellbeing/settings')
      if (!response.ok) throw new Error('Failed to fetch settings')
      const data = await response.json() as { settings?: Settings; isNew?: boolean }
      if (data.settings) {
        setSettings({
          ...defaultSettings,
          ...data.settings,
          healthy_habits: {
            ...defaultSettings.healthy_habits,
            ...data.settings.healthy_habits,
            night_mode_hours: {
              ...defaultSettings.healthy_habits.night_mode_hours,
              ...data.settings.healthy_habits?.night_mode_hours,
            },
          },
          intervention_triggers: {
            ...defaultSettings.intervention_triggers,
            ...data.settings.intervention_triggers,
          },
        })
      }
    } catch (err) {
      console.error('Error fetching settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      const response = await fetch('/api/wellbeing/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        const data = await response.json() as { error?: string }
        throw new Error(data.error || 'Failed to save settings')
      }

      setSuccess(true)
      setHasChanges(false)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const updateSettings = (updates: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...updates }))
    setHasChanges(true)
  }

  const updateHealthyHabits = (updates: Partial<HealthyHabits>) => {
    setSettings((prev) => ({
      ...prev,
      healthy_habits: { ...prev.healthy_habits, ...updates },
    }))
    setHasChanges(true)
  }

  const updateNightMode = (updates: Partial<HealthyHabits['night_mode_hours']>) => {
    setSettings((prev) => ({
      ...prev,
      healthy_habits: {
        ...prev.healthy_habits,
        night_mode_hours: { ...prev.healthy_habits.night_mode_hours, ...updates },
      },
    }))
    setHasChanges(true)
  }

  const updateInterventions = (updates: Partial<InterventionTriggers>) => {
    setSettings((prev) => ({
      ...prev,
      intervention_triggers: { ...prev.intervention_triggers, ...updates },
    }))
    setHasChanges(true)
  }

  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:00 ${period}`
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/wellbeing">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Self-Moderation Settings
          </h1>
          <p className="text-muted-foreground">Configure your wellbeing preferences</p>
        </div>
        <Button onClick={handleSave} disabled={saving || !hasChanges}>
          {saving ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : success ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Saved!
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {error && (
        <Card className="mb-6 border-red-500/20 bg-red-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Usage Limits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-400" />
              Usage Limits
            </CardTitle>
            <CardDescription>Set daily and weekly usage boundaries</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <Label>Daily Limit</Label>
                  <span className="text-sm text-muted-foreground">
                    {settings.daily_usage_limit} minutes
                  </span>
                </div>
                <Slider
                  value={[settings.daily_usage_limit]}
                  onValueChange={([value]) => updateSettings({ daily_usage_limit: value })}
                  min={15}
                  max={480}
                  step={15}
                />
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>15 min</span>
                  <span>8 hours</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <Label>Weekly Limit</Label>
                  <span className="text-sm text-muted-foreground">
                    {Math.floor(settings.weekly_usage_limit / 60)}h {settings.weekly_usage_limit % 60}m
                  </span>
                </div>
                <Slider
                  value={[settings.weekly_usage_limit]}
                  onValueChange={([value]) => updateSettings({ weekly_usage_limit: value })}
                  min={60}
                  max={3360}
                  step={60}
                />
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>1 hour</span>
                  <span>56 hours</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <Label>Break Reminder Interval</Label>
                  <span className="text-sm text-muted-foreground">
                    Every {settings.break_reminder_interval} minutes
                  </span>
                </div>
                <Slider
                  value={[settings.break_reminder_interval]}
                  onValueChange={([value]) => updateSettings({ break_reminder_interval: value })}
                  min={10}
                  max={60}
                  step={5}
                />
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>10 min</span>
                  <span>60 min</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Healthy Habits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-400" />
              Healthy Habits
            </CardTitle>
            <CardDescription>Enable features to support your wellbeing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-yellow-400" />
                <div>
                  <Label>Break Reminders</Label>
                  <p className="text-xs text-muted-foreground">Get notified to take breaks</p>
                </div>
              </div>
              <Switch
                checked={settings.healthy_habits.enable_break_reminders}
                onCheckedChange={(checked) =>
                  updateHealthyHabits({ enable_break_reminders: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-400" />
                <div>
                  <Label>Usage Tracking</Label>
                  <p className="text-xs text-muted-foreground">Track your usage time</p>
                </div>
              </div>
              <Switch
                checked={settings.healthy_habits.enable_usage_tracking}
                onCheckedChange={(checked) =>
                  updateHealthyHabits({ enable_usage_tracking: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Heart className="h-5 w-5 text-pink-400" />
                <div>
                  <Label>Mood Check-ins</Label>
                  <p className="text-xs text-muted-foreground">Periodic mood prompts</p>
                </div>
              </div>
              <Switch
                checked={settings.healthy_habits.enable_mood_checkins}
                onCheckedChange={(checked) =>
                  updateHealthyHabits({ enable_mood_checkins: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Brain className="h-5 w-5 text-purple-400" />
                <div>
                  <Label>Mindfulness Breaks</Label>
                  <p className="text-xs text-muted-foreground">Guided mindfulness prompts</p>
                </div>
              </div>
              <Switch
                checked={settings.healthy_habits.mindfulness_breaks}
                onCheckedChange={(checked) =>
                  updateHealthyHabits({ mindfulness_breaks: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Night Mode */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-indigo-400" />
              Night Mode
            </CardTitle>
            <CardDescription>Limit usage during nighttime hours</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <Label>Enable Night Mode</Label>
                <p className="text-xs text-muted-foreground">
                  Get alerts when using during night hours
                </p>
              </div>
              <Switch
                checked={settings.healthy_habits.night_mode_hours.enabled}
                onCheckedChange={(checked) => updateNightMode({ enabled: checked })}
              />
            </div>

            {settings.healthy_habits.night_mode_hours.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block">Start Time</Label>
                  <Select
                    value={settings.healthy_habits.night_mode_hours.start_hour.toString()}
                    onValueChange={(value) => updateNightMode({ start_hour: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {formatHour(i)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-2 block">End Time</Label>
                  <Select
                    value={settings.healthy_habits.night_mode_hours.end_hour.toString()}
                    onValueChange={(value) => updateNightMode({ end_hour: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {formatHour(i)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Intervention Triggers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-400" />
              Intervention Triggers
            </CardTitle>
            <CardDescription>When to show wellbeing alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <Label>Daily Limit Exceeded</Label>
                <p className="text-xs text-muted-foreground">Alert when daily limit is reached</p>
              </div>
              <Switch
                checked={settings.intervention_triggers.excessive_daily_usage}
                onCheckedChange={(checked) =>
                  updateInterventions({ excessive_daily_usage: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <Label>Late Night Usage</Label>
                <p className="text-xs text-muted-foreground">Alert during night mode hours</p>
              </div>
              <Switch
                checked={settings.intervention_triggers.late_night_usage}
                onCheckedChange={(checked) =>
                  updateInterventions({ late_night_usage: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <Label>Declining Mood Trend</Label>
                <p className="text-xs text-muted-foreground">Alert when mood trends down</p>
              </div>
              <Switch
                checked={settings.intervention_triggers.declining_mood_trend}
                onCheckedChange={(checked) =>
                  updateInterventions({ declining_mood_trend: checked })
                }
              />
            </div>

            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex justify-between mb-2">
                <Label>Consecutive Days Alert</Label>
                <span className="text-sm text-muted-foreground">
                  After {settings.intervention_triggers.consecutive_days_overuse} days
                </span>
              </div>
              <Slider
                value={[settings.intervention_triggers.consecutive_days_overuse]}
                onValueChange={([value]) =>
                  updateInterventions({ consecutive_days_overuse: value })
                }
                min={0}
                max={7}
                step={1}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Alert after this many consecutive days over limit (0 = disabled)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Master Toggle */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-400" />
              Self-Moderation Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <Label className="text-lg">Enable Self-Moderation</Label>
                <p className="text-sm text-muted-foreground">
                  Turn all self-moderation features on or off
                </p>
              </div>
              <Switch
                checked={settings.is_active}
                onCheckedChange={(checked) => updateSettings({ is_active: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
