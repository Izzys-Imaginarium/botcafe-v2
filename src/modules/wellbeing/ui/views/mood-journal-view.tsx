'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Heart,
  ArrowLeft,
  RefreshCw,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Flame,
  Check,
  AlertCircle,
} from 'lucide-react'

interface MoodEntry {
  id: string
  mood: string
  note?: string
  timestamp: string
}

interface MoodStats {
  totalEntries: number
  moodCounts: Record<string, number>
  mostCommonMood: string | null
  trend: string
  streakDays: number
}

const moodOptions = [
  { value: 'very-happy', label: 'Very Happy', emoji: '😄', color: 'bg-green-500/20 border-green-500/50 hover:bg-green-500/30' },
  { value: 'happy', label: 'Happy', emoji: '😊', color: 'bg-green-400/20 border-green-400/50 hover:bg-green-400/30' },
  { value: 'excited', label: 'Excited', emoji: '🤩', color: 'bg-yellow-500/20 border-yellow-500/50 hover:bg-yellow-500/30' },
  { value: 'content', label: 'Content', emoji: '😌', color: 'bg-blue-400/20 border-blue-400/50 hover:bg-blue-400/30' },
  { value: 'neutral', label: 'Neutral', emoji: '😐', color: 'bg-gray-400/20 border-gray-400/50 hover:bg-gray-400/30' },
  { value: 'anxious', label: 'Anxious', emoji: '😰', color: 'bg-orange-400/20 border-orange-400/50 hover:bg-orange-400/30' },
  { value: 'frustrated', label: 'Frustrated', emoji: '😤', color: 'bg-orange-500/20 border-orange-500/50 hover:bg-orange-500/30' },
  { value: 'sad', label: 'Sad', emoji: '😢', color: 'bg-blue-500/20 border-blue-500/50 hover:bg-blue-500/30' },
  { value: 'angry', label: 'Angry', emoji: '😠', color: 'bg-red-500/20 border-red-500/50 hover:bg-red-500/30' },
  { value: 'very-sad', label: 'Very Sad', emoji: '😭', color: 'bg-purple-500/20 border-purple-500/50 hover:bg-purple-500/30' },
]

const moodLabels: Record<string, { label: string; emoji: string }> = Object.fromEntries(
  moodOptions.map((m) => [m.value, { label: m.label, emoji: m.emoji }])
)

export const MoodJournalView = () => {
  const [entries, setEntries] = useState<MoodEntry[]>([])
  const [stats, setStats] = useState<MoodStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEntries = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/wellbeing/mood?days=30&limit=50')
      if (!response.ok) throw new Error('Failed to fetch mood entries')
      const data = await response.json() as { entries: MoodEntry[]; stats: MoodStats | null }
      setEntries(data.entries)
      setStats(data.stats)
    } catch (err) {
      console.error('Error fetching mood entries:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEntries()
  }, [])

  const handleSubmit = async () => {
    if (!selectedMood) return

    try {
      setSubmitting(true)
      setError(null)

      const response = await fetch('/api/wellbeing/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood: selectedMood, note }),
      })

      if (!response.ok) {
        const data = await response.json() as { error?: string }
        throw new Error(data.error || 'Failed to save mood')
      }

      setSuccess(true)
      setSelectedMood(null)
      setNote('')
      fetchEntries()

      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save mood entry')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-400" />
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-400" />
      default:
        return <Minus className="h-4 w-4 text-gray-400" />
    }
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
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            Mood Journal
          </h1>
          <p className="text-muted-foreground">Track your emotional wellbeing</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Log New Mood */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-400" />
              How are you feeling?
            </CardTitle>
            <CardDescription>Select a mood that best describes how you feel right now</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mood Selection */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {moodOptions.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => setSelectedMood(mood.value)}
                  className={`p-4 rounded-lg border-2 transition-all ${mood.color} ${
                    selectedMood === mood.value
                      ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-background'
                      : ''
                  }`}
                >
                  <div className="text-3xl mb-1">{mood.emoji}</div>
                  <div className="text-xs font-medium">{mood.label}</div>
                </button>
              ))}
            </div>

            {/* Note */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Add a note (optional)
              </label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What's on your mind? Any thoughts about why you're feeling this way?"
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <div className="flex items-center gap-4">
              <Button
                onClick={handleSubmit}
                disabled={!selectedMood || submitting}
                className="flex-1"
              >
                {submitting ? (
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
                    <Heart className="mr-2 h-4 w-4" />
                    Log Mood
                  </>
                )}
              </Button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-400" />
              Your Stats
            </CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats ? (
              <>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">Total Entries</span>
                  <Badge variant="secondary">{stats.totalEntries}</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">Current Streak</span>
                  <div className="flex items-center gap-1">
                    <Flame className="h-4 w-4 text-orange-400" />
                    <span className="font-semibold">{stats.streakDays} days</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">Mood Trend</span>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(stats.trend)}
                    <span className="capitalize text-sm">{stats.trend}</span>
                  </div>
                </div>

                {stats.mostCommonMood && (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">Most Common</span>
                    <div className="flex items-center gap-1">
                      <span>{moodLabels[stats.mostCommonMood]?.emoji}</span>
                      <span className="text-sm">{moodLabels[stats.mostCommonMood]?.label}</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4 text-muted-foreground text-sm">
                {loading ? 'Loading...' : 'No stats available yet'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Entries */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-400" />
                Recent Entries
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={fetchEntries}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-purple-500" />
              </div>
            ) : entries.length > 0 ? (
              <div className="space-y-3">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg"
                  >
                    <div className="text-3xl">
                      {moodLabels[entry.mood]?.emoji || '😐'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">
                          {moodLabels[entry.mood]?.label || 'Unknown'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(entry.timestamp)}
                        </span>
                      </div>
                      {entry.note && (
                        <p className="text-sm text-muted-foreground">{entry.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Heart className="h-12 w-12 mx-auto mb-4 opacity-50 text-pink-400" />
                <p className="text-muted-foreground">No mood entries yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Start tracking your mood to see your history here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
