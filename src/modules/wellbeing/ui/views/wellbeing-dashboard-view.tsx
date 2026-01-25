'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Heart,
  Brain,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Shield,
  Target,
  Flame,
  RefreshCw,
  AlertCircle,
  Lightbulb,
  Settings,
} from 'lucide-react'

interface WellbeingData {
  hasSettings: boolean
  settings: any
  moodSummary: {
    totalEntries: number
    averageMood: number | null
    trend: string
    mostCommon: string | null
    streakDays: number
    lastEntry: string | null
  } | null
  usageSummary: {
    dailyUsed: number
    dailyLimit: number
    dailyPercentage: number
    weeklyUsed: number
    weeklyLimit: number
    weeklyPercentage: number
    consecutiveHealthyDays: number
    lastBreak: string | null
    isWithinLimits: boolean
  } | null
  recommendations: string[]
}

const moodLabels: Record<string, { label: string; color: string; emoji: string }> = {
  'very-happy': { label: 'Very Happy', color: 'text-green-400', emoji: '😄' },
  'happy': { label: 'Happy', color: 'text-green-300', emoji: '😊' },
  'content': { label: 'Content', color: 'text-blue-300', emoji: '😌' },
  'neutral': { label: 'Neutral', color: 'text-gray-300', emoji: '😐' },
  'excited': { label: 'Excited', color: 'text-yellow-400', emoji: '🤩' },
  'anxious': { label: 'Anxious', color: 'text-orange-400', emoji: '😰' },
  'frustrated': { label: 'Frustrated', color: 'text-orange-500', emoji: '😤' },
  'sad': { label: 'Sad', color: 'text-blue-400', emoji: '😢' },
  'angry': { label: 'Angry', color: 'text-red-400', emoji: '😠' },
  'very-sad': { label: 'Very Sad', color: 'text-purple-400', emoji: '😭' },
}

export const WellbeingDashboardView = () => {
  const [data, setData] = useState<WellbeingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/wellbeing')
      if (!response.ok) throw new Error('Failed to fetch wellbeing data')
      const result = await response.json() as WellbeingData
      setData(result)
    } catch (err) {
      setError('Failed to load wellbeing data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

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

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-green-400'
      case 'declining':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Wellbeing Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your mood and manage your usage limits
          </p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Link href="/wellbeing/settings">
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link href="/wellbeing/mood">
          <Card className="hover:border-purple-500/50 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6 text-center">
              <Heart className="h-8 w-8 mx-auto mb-2 text-pink-400" />
              <h3 className="font-semibold">Mood Journal</h3>
              <p className="text-xs text-muted-foreground mt-1">Track how you feel</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/wellbeing/settings">
          <Card className="hover:border-purple-500/50 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6 text-center">
              <Shield className="h-8 w-8 mx-auto mb-2 text-blue-400" />
              <h3 className="font-semibold">Self-Moderation</h3>
              <p className="text-xs text-muted-foreground mt-1">Set usage limits</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Mood Summary */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-400" />
              Mood Overview
            </CardTitle>
            <CardDescription>Your emotional wellbeing this week</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.moodSummary && data.moodSummary.totalEntries > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-3xl mb-1">
                    {data.moodSummary.mostCommon
                      ? moodLabels[data.moodSummary.mostCommon]?.emoji || '😐'
                      : '😐'}
                  </div>
                  <p className="text-xs text-muted-foreground">Most Common</p>
                  <p className="font-semibold text-sm">
                    {data.moodSummary.mostCommon
                      ? moodLabels[data.moodSummary.mostCommon]?.label || 'Neutral'
                      : 'N/A'}
                  </p>
                </div>

                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {getTrendIcon(data.moodSummary.trend)}
                  </div>
                  <p className="text-xs text-muted-foreground">Trend</p>
                  <p className={`font-semibold text-sm capitalize ${getTrendColor(data.moodSummary.trend)}`}>
                    {data.moodSummary.trend}
                  </p>
                </div>

                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Flame className="h-6 w-6 mx-auto mb-1 text-orange-400" />
                  <p className="text-xs text-muted-foreground">Streak</p>
                  <p className="font-semibold text-sm">{data.moodSummary.streakDays} days</p>
                </div>

                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Target className="h-6 w-6 mx-auto mb-1 text-blue-400" />
                  <p className="text-xs text-muted-foreground">Entries</p>
                  <p className="font-semibold text-sm">{data.moodSummary.totalEntries} this week</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Heart className="h-12 w-12 mx-auto mb-4 opacity-50 text-pink-400" />
                <p className="text-muted-foreground mb-4">No mood entries yet this week</p>
                <Link href="/wellbeing/mood">
                  <Button>
                    <Heart className="mr-2 h-4 w-4" />
                    Log Your First Mood
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-400" />
              Usage Tracking
            </CardTitle>
            <CardDescription>Stay within healthy limits</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.usageSummary ? (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Today</span>
                    <span>
                      {data.usageSummary.dailyUsed}m / {data.usageSummary.dailyLimit}m
                    </span>
                  </div>
                  <Progress
                    value={data.usageSummary.dailyPercentage}
                    className={data.usageSummary.dailyPercentage > 80 ? 'bg-red-500/20' : ''}
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>This Week</span>
                    <span>
                      {data.usageSummary.weeklyUsed}m / {data.usageSummary.weeklyLimit}m
                    </span>
                  </div>
                  <Progress
                    value={data.usageSummary.weeklyPercentage}
                    className={data.usageSummary.weeklyPercentage > 80 ? 'bg-red-500/20' : ''}
                  />
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Healthy Days Streak</span>
                    <Badge variant={data.usageSummary.isWithinLimits ? 'default' : 'destructive'}>
                      {data.usageSummary.consecutiveHealthyDays} days
                    </Badge>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Shield className="h-10 w-10 mx-auto mb-3 opacity-50 text-blue-400" />
                <p className="text-sm text-muted-foreground mb-3">
                  Set up self-moderation to track usage
                </p>
                <Link href="/wellbeing/settings">
                  <Button variant="outline" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Configure
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-400" />
              Personalized Insights
            </CardTitle>
            <CardDescription>Recommendations based on your activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                >
                  <Sparkles className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{rec}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
