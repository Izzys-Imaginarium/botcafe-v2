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
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Clock,
  BarChart3,
  Activity,
  RefreshCw,
  AlertCircle,
  Sparkles,
  BookOpen,
  Users,
  Zap,
} from 'lucide-react'

interface OverviewStats {
  totalBots: number
  publicBots: number
  totalConversations: number
  totalPersonas: number
  totalKnowledge: number
  totalMemories: number
  totalLikes: number
  totalFavorites: number
}

interface BotStat {
  id: string
  name: string
  avatar: string | null
  is_public: boolean
  conversationCount: number
  likes: number
  favorites: number
  rating: number
  createdAt: string
}

interface Trends {
  conversationsThisWeek: number
  conversationTrend: number
  botsCreatedThisWeek: number
  knowledgeAddedThisWeek: number
}

interface ActivityItem {
  type: 'bot_created' | 'conversation'
  name: string
  date: string
}

interface AnalyticsData {
  overview: OverviewStats
  botStats: BotStat[]
  recentActivity: ActivityItem[]
  trends: Trends
}

export const AnalyticsDashboardView = () => {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState('30')

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics?period=${period}`)
      if (!response.ok) throw new Error('Failed to fetch analytics')
      const result = await response.json() as AnalyticsData
      setData(result)
    } catch (err) {
      setError('Failed to load analytics data')
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

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-400" />
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-400" />
    return <Minus className="h-4 w-4 text-gray-400" />
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your bot performance and usage statistics
          </p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
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
                <p className="text-sm text-muted-foreground">Total Bots</p>
                <p className="text-2xl font-bold">{data?.overview.totalBots || 0}</p>
              </div>
              <Bot className="h-8 w-8 text-purple-400" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {data?.overview.publicBots || 0} public
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversations</p>
                <p className="text-2xl font-bold">{data?.overview.totalConversations || 0}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-400" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              {getTrendIcon(data?.trends.conversationTrend || 0)}
              <span className="text-xs text-muted-foreground">
                {data?.trends.conversationTrend || 0}% vs last week
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Knowledge</p>
                <p className="text-2xl font-bold">{data?.overview.totalKnowledge || 0}</p>
              </div>
              <BookOpen className="h-8 w-8 text-green-400" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              +{data?.trends.knowledgeAddedThisWeek || 0} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Engagement</p>
                <p className="text-2xl font-bold">
                  {(data?.overview.totalLikes || 0) + (data?.overview.totalFavorites || 0)}
                </p>
              </div>
              <Heart className="h-8 w-8 text-pink-400" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {data?.overview.totalLikes || 0} likes, {data?.overview.totalFavorites || 0} favorites
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Bot Performance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-400" />
                  Bot Performance
                </CardTitle>
                <CardDescription>Your top performing bots</CardDescription>
              </div>
              <Link href="/analytics/bots">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data?.botStats && data.botStats.length > 0 ? (
              <div className="space-y-4">
                {data.botStats.slice(0, 5).map((bot, index) => (
                  <div
                    key={bot.id}
                    className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg"
                  >
                    <span className="text-lg font-bold text-muted-foreground w-6">
                      #{index + 1}
                    </span>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                      {bot.avatar ? (
                        <img
                          src={bot.avatar}
                          alt={bot.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        bot.name?.charAt(0) || 'B'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold truncate">{bot.name}</h4>
                        {bot.is_public && (
                          <Badge variant="secondary" className="text-xs">
                            Public
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {bot.conversationCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {bot.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {bot.favorites}
                        </span>
                      </div>
                    </div>
                    {bot.rating > 0 && (
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm font-semibold">{bot.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50 text-purple-400" />
                <p className="text-muted-foreground">No bots created yet</p>
                <Link href="/create">
                  <Button className="mt-4">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Create Your First Bot
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-400" />
              This Week
            </CardTitle>
            <CardDescription>Quick overview of your activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-400" />
                <span className="text-sm">Conversations</span>
              </div>
              <span className="font-bold">{data?.trends.conversationsThisWeek || 0}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-purple-400" />
                <span className="text-sm">New Bots</span>
              </div>
              <span className="font-bold">{data?.trends.botsCreatedThisWeek || 0}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-green-400" />
                <span className="text-sm">Knowledge Added</span>
              </div>
              <span className="font-bold">{data?.trends.knowledgeAddedThisWeek || 0}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-pink-400" />
                <span className="text-sm">Personas</span>
              </div>
              <span className="font-bold">{data?.overview.totalPersonas || 0}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-orange-400" />
                <span className="text-sm">Memories</span>
              </div>
              <span className="font-bold">{data?.overview.totalMemories || 0}</span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-400" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest actions on your account</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.recentActivity && data.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {data.recentActivity.slice(0, 10).map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors"
                  >
                    {activity.type === 'bot_created' ? (
                      <Bot className="h-5 w-5 text-purple-400" />
                    ) : (
                      <MessageSquare className="h-5 w-5 text-blue-400" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm">
                        {activity.type === 'bot_created' ? (
                          <>
                            Created bot <span className="font-semibold">{activity.name}</span>
                          </>
                        ) : (
                          <>
                            Conversation with <span className="font-semibold">{activity.name}</span>
                          </>
                        )}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(activity.date)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-400" />
                <p className="text-muted-foreground">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* More Analytics Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              Explore More
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/analytics/bots" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Bot className="mr-2 h-4 w-4" />
                Bot Analytics
              </Button>
            </Link>
            <Link href="/analytics/usage" className="block">
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="mr-2 h-4 w-4" />
                Usage Statistics
              </Button>
            </Link>
            <Link href="/wellbeing" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Heart className="mr-2 h-4 w-4" />
                Wellbeing Center
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
