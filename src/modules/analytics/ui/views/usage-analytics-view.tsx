'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Bot,
  MessageSquare,
  Brain,
  Heart,
  BookOpen,
  Users,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Calendar,
  Clock,
  Flame,
  Activity,
  TrendingUp,
  Zap,
} from 'lucide-react'

interface UsageStats {
  totalBots: number
  totalConversations: number
  totalPersonas: number
  totalKnowledge: number
  totalMemories: number
  totalMoodEntries: number
  activeDays: number
  averageConversationsPerDay: number
}

interface ContentBreakdown {
  bots: { total: number; public: number; private: number }
  knowledge: { total: number; vectorized: number; pending: number }
  memories: { total: number; summarized: number; raw: number }
  personas: { total: number; active: number }
}

interface EngagementMetrics {
  moodTrackingStreak: number
  averageMood: string | null
  mostActiveDay: string | null
  peakHour: string | null
}

interface DailyActivity {
  date: string
  conversations: number
  moods: number
}

interface UsageResponse {
  usage: UsageStats
  dailyActivity: DailyActivity[]
  contentBreakdown: ContentBreakdown
  engagementMetrics: EngagementMetrics
  period: number
}

export const UsageAnalyticsView = () => {
  const [data, setData] = useState<UsageResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState('30')

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/usage?period=${period}`)
      if (!response.ok) throw new Error('Failed to fetch usage analytics')
      const result = await response.json() as UsageResponse
      setData(result)
    } catch (err) {
      setError('Failed to load usage analytics')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [period])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-500/20">
          <CardContent className="pt-6">
            <div className="text-center text-red-400">
              <AlertCircle className="h-12 w-12 mx-auto mb-4" />
              <p>{error}</p>
              <Button onClick={fetchData} variant="outline" className="mt-4">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const maxConversations = Math.max(...(data?.dailyActivity.map((d) => d.conversations) || [1]))

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/analytics">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
            Usage Statistics
          </h1>
          <p className="text-muted-foreground">Your platform usage over time</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchData} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Days</p>
                <p className="text-2xl font-bold">{data?.usage.activeDays || 0}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-400" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              of {data?.period || 30} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Conversations</p>
                <p className="text-2xl font-bold">{data?.usage.averageConversationsPerDay || 0}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-400" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">per day</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Mood Streak</p>
                <p className="text-2xl font-bold">{data?.engagementMetrics.moodTrackingStreak || 0}</p>
              </div>
              <Flame className="h-8 w-8 text-orange-400" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">days in a row</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Peak Activity</p>
                <p className="text-2xl font-bold">{data?.engagementMetrics.peakHour || 'N/A'}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-400" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {data?.engagementMetrics.mostActiveDay || 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-400" />
              Daily Activity
            </CardTitle>
            <CardDescription>Conversations and mood entries over time</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.dailyActivity && data.dailyActivity.length > 0 ? (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-4">
                  <span>Conversations</span>
                  <span>Mood Entries</span>
                </div>
                <div className="space-y-1 max-h-80 overflow-y-auto">
                  {data.dailyActivity.slice(-14).map((day) => (
                    <div key={day.date} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-20">
                        {new Date(day.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 h-6 bg-muted/50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                            style={{
                              width: `${(day.conversations / maxConversations) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-semibold w-6 text-right">
                          {day.conversations}
                        </span>
                      </div>
                      <div className="w-8 text-center">
                        {day.moods > 0 && (
                          <Badge variant="secondary" className="bg-pink-500/20 text-pink-400">
                            {day.moods}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-400" />
                <p className="text-muted-foreground">No activity data yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Engagement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-400" />
              Engagement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">Average Mood</span>
                <Badge
                  variant="secondary"
                  className={
                    data?.engagementMetrics.averageMood === 'Positive'
                      ? 'bg-green-500/20 text-green-400'
                      : data?.engagementMetrics.averageMood === 'Needs attention'
                      ? 'bg-red-500/20 text-red-400'
                      : ''
                  }
                >
                  {data?.engagementMetrics.averageMood || 'N/A'}
                </Badge>
              </div>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">Most Active Day</span>
                <span className="font-semibold">
                  {data?.engagementMetrics.mostActiveDay || 'N/A'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">Peak Hour</span>
                <span className="font-semibold">
                  {data?.engagementMetrics.peakHour || 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Breakdown */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-400" />
              Content Breakdown
            </CardTitle>
            <CardDescription>Overview of your created content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              {/* Bots */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-purple-400" />
                  <h4 className="font-semibold">Bots</h4>
                </div>
                <div className="text-3xl font-bold">{data?.contentBreakdown.bots.total || 0}</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Public</span>
                    <span>{data?.contentBreakdown.bots.public || 0}</span>
                  </div>
                  <Progress
                    value={
                      data?.contentBreakdown.bots.total
                        ? (data.contentBreakdown.bots.public / data.contentBreakdown.bots.total) * 100
                        : 0
                    }
                    className="h-2"
                  />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Private</span>
                    <span>{data?.contentBreakdown.bots.private || 0}</span>
                  </div>
                </div>
              </div>

              {/* Knowledge */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-green-400" />
                  <h4 className="font-semibold">Knowledge</h4>
                </div>
                <div className="text-3xl font-bold">{data?.contentBreakdown.knowledge.total || 0}</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Vectorized</span>
                    <span>{data?.contentBreakdown.knowledge.vectorized || 0}</span>
                  </div>
                  <Progress
                    value={
                      data?.contentBreakdown.knowledge.total
                        ? (data.contentBreakdown.knowledge.vectorized / data.contentBreakdown.knowledge.total) * 100
                        : 0
                    }
                    className="h-2"
                  />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pending</span>
                    <span>{data?.contentBreakdown.knowledge.pending || 0}</span>
                  </div>
                </div>
              </div>

              {/* Memories */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-orange-400" />
                  <h4 className="font-semibold">Memories</h4>
                </div>
                <div className="text-3xl font-bold">{data?.contentBreakdown.memories.total || 0}</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Summarized</span>
                    <span>{data?.contentBreakdown.memories.summarized || 0}</span>
                  </div>
                  <Progress
                    value={
                      data?.contentBreakdown.memories.total
                        ? (data.contentBreakdown.memories.summarized / data.contentBreakdown.memories.total) * 100
                        : 0
                    }
                    className="h-2"
                  />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Raw</span>
                    <span>{data?.contentBreakdown.memories.raw || 0}</span>
                  </div>
                </div>
              </div>

              {/* Personas */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-pink-400" />
                  <h4 className="font-semibold">Personas</h4>
                </div>
                <div className="text-3xl font-bold">{data?.contentBreakdown.personas.total || 0}</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Active</span>
                    <span>{data?.contentBreakdown.personas.active || 0}</span>
                  </div>
                  <Progress
                    value={
                      data?.contentBreakdown.personas.total
                        ? (data.contentBreakdown.personas.active / data.contentBreakdown.personas.total) * 100
                        : 0
                    }
                    className="h-2"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
