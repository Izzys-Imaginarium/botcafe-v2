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
  Loader2,
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
  'neutral': { label: 'Neutral', color: 'text-parchment/60', emoji: '😐' },
  'excited': { label: 'Excited', color: 'text-gold-rich', emoji: '🤩' },
  'anxious': { label: 'Anxious', color: 'text-orange-400', emoji: '😰' },
  'frustrated': { label: 'Frustrated', color: 'text-orange-500', emoji: '😤' },
  'sad': { label: 'Sad', color: 'text-blue-400', emoji: '😢' },
  'angry': { label: 'Angry', color: 'text-red-400', emoji: '😠' },
  'very-sad': { label: 'Very Sad', color: 'text-purple-400', emoji: '😭' },
}

export const AccountWellbeing = () => {
  const [data, setData] = useState<WellbeingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/wellbeing')
      if (!response.ok) throw new Error('Failed to fetch wellbeing data')
      const result = (await response.json()) as WellbeingData
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

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-400" />
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-400" />
      default:
        return <Minus className="h-4 w-4 text-parchment/40" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-green-400'
      case 'declining':
        return 'text-red-400'
      default:
        return 'text-parchment/60'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gold-rich" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="glass-rune border-red-500/20">
        <CardContent className="pt-6">
          <div className="text-center text-red-400">
            <AlertCircle className="h-12 w-12 mx-auto mb-4" />
            <p className="font-lore">{error}</p>
            <Button onClick={fetchData} variant="outline" className="mt-4 ornate-border">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display text-parchment">Wellbeing Center</h2>
          <p className="text-sm text-parchment-dim font-lore">
            Track your mood and manage your usage limits
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/wellbeing/settings">
            <Button variant="outline" size="sm" className="ornate-border">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
          <Button onClick={fetchData} variant="outline" size="icon" className="ornate-border">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/wellbeing/mood">
          <Card className="glass-rune hover:border-pink-500/50 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6 text-center">
              <Heart className="h-8 w-8 mx-auto mb-2 text-pink-400" />
              <h3 className="font-display text-parchment">Mood Journal</h3>
              <p className="text-xs text-parchment-dim font-lore mt-1">Track how you feel</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/wellbeing/settings">
          <Card className="glass-rune hover:border-magic-glow/50 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6 text-center">
              <Shield className="h-8 w-8 mx-auto mb-2 text-magic-glow" />
              <h3 className="font-display text-parchment">Self-Moderation</h3>
              <p className="text-xs text-parchment-dim font-lore mt-1">Set usage limits</p>
            </CardContent>
          </Card>
        </Link>

      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Mood Summary */}
        <Card className="glass-rune lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-parchment font-display">
              <Brain className="h-5 w-5 text-purple-400" />
              Mood Overview
            </CardTitle>
            <CardDescription className="text-parchment-dim font-lore">
              Your emotional wellbeing this week
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data?.moodSummary && data.moodSummary.totalEntries > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-[#0a140a]/20 rounded-lg">
                  <div className="text-3xl mb-1">
                    {data.moodSummary.mostCommon
                      ? moodLabels[data.moodSummary.mostCommon]?.emoji || '😐'
                      : '😐'}
                  </div>
                  <p className="text-xs text-parchment-dim font-lore">Most Common</p>
                  <p className="font-semibold text-sm text-parchment">
                    {data.moodSummary.mostCommon
                      ? moodLabels[data.moodSummary.mostCommon]?.label || 'Neutral'
                      : 'N/A'}
                  </p>
                </div>

                <div className="text-center p-4 bg-[#0a140a]/20 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1 h-8">
                    {getTrendIcon(data.moodSummary.trend)}
                  </div>
                  <p className="text-xs text-parchment-dim font-lore">Trend</p>
                  <p className={`font-semibold text-sm capitalize ${getTrendColor(data.moodSummary.trend)}`}>
                    {data.moodSummary.trend}
                  </p>
                </div>

                <div className="text-center p-4 bg-[#0a140a]/20 rounded-lg">
                  <Flame className="h-6 w-6 mx-auto mb-1 text-orange-400" />
                  <p className="text-xs text-parchment-dim font-lore">Streak</p>
                  <p className="font-semibold text-sm text-parchment">{data.moodSummary.streakDays} days</p>
                </div>

                <div className="text-center p-4 bg-[#0a140a]/20 rounded-lg">
                  <Target className="h-6 w-6 mx-auto mb-1 text-magic-glow" />
                  <p className="text-xs text-parchment-dim font-lore">Entries</p>
                  <p className="font-semibold text-sm text-parchment">{data.moodSummary.totalEntries} this week</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Heart className="h-12 w-12 mx-auto mb-4 text-parchment/30" />
                <p className="text-parchment-dim font-lore mb-4">No mood entries yet this week</p>
                <Link href="/wellbeing/mood">
                  <Button className="bg-gold-rich hover:bg-gold-rich/90 text-[#0a140a]">
                    <Heart className="mr-2 h-4 w-4" />
                    Log Your First Mood
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Summary */}
        <Card className="glass-rune">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-parchment font-display">
              <Clock className="h-5 w-5 text-magic-glow" />
              Usage Tracking
            </CardTitle>
            <CardDescription className="text-parchment-dim font-lore">
              Stay within healthy limits
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data?.usageSummary ? (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-parchment font-lore">Today</span>
                    <span className="text-parchment-dim">
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
                    <span className="text-parchment font-lore">This Week</span>
                    <span className="text-parchment-dim">
                      {data.usageSummary.weeklyUsed}m / {data.usageSummary.weeklyLimit}m
                    </span>
                  </div>
                  <Progress
                    value={data.usageSummary.weeklyPercentage}
                    className={data.usageSummary.weeklyPercentage > 80 ? 'bg-red-500/20' : ''}
                  />
                </div>

                <div className="pt-4 border-t border-gold-ancient/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-parchment-dim font-lore">Healthy Days Streak</span>
                    <Badge
                      variant={data.usageSummary.isWithinLimits ? 'default' : 'destructive'}
                      className={data.usageSummary.isWithinLimits ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}
                    >
                      {data.usageSummary.consecutiveHealthyDays} days
                    </Badge>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Shield className="h-10 w-10 mx-auto mb-3 text-parchment/30" />
                <p className="text-sm text-parchment-dim font-lore mb-3">
                  Set up self-moderation to track usage
                </p>
                <Link href="/wellbeing/settings">
                  <Button variant="outline" size="sm" className="ornate-border">
                    <Settings className="mr-2 h-4 w-4" />
                    Configure
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="glass-rune lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-parchment font-display">
              <Lightbulb className="h-5 w-5 text-gold-rich" />
              Personalized Insights
            </CardTitle>
            <CardDescription className="text-parchment-dim font-lore">
              Recommendations based on your activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-[#0a140a]/20 rounded-lg"
                >
                  <Sparkles className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-parchment font-lore">{rec}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
