'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Bot,
  MessageCircle,
  BookOpen,
  Heart,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Brain,
  Users,
  Zap,
  Activity,
  BarChart3,
  Loader2,
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

// Helper components
const StatCard = ({
  icon,
  label,
  value,
  subtext,
  color,
  trend,
}: {
  icon: React.ReactNode
  label: string
  value: string
  subtext?: string
  color: string
  trend?: number
}) => {
  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-3 w-3 text-green-400" />
    if (value < 0) return <TrendingDown className="h-3 w-3 text-red-400" />
    return <Minus className="h-3 w-3 text-parchment/40" />
  }

  return (
    <Card className="glass-rune">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center bg-[#0a140a]/50 ${color}`}
          >
            {icon}
          </div>
          <div className="flex-1">
            <p className="text-2xl font-display text-parchment">{value}</p>
            <p className="text-xs text-parchment-dim font-lore">{label}</p>
            {(subtext || trend !== undefined) && (
              <div className="flex items-center gap-1 mt-1">
                {trend !== undefined && getTrendIcon(trend)}
                <span className="text-xs text-parchment/50">
                  {subtext || `${trend}% vs last week`}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export const AccountOverview = () => {
  const { user } = useUser()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState('30')

  const fetchAnalytics = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/analytics?period=${period}`)
      if (response.ok) {
        const result = (await response.json()) as AnalyticsData
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [user, period])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gold-rich" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with period selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-display text-parchment">Analytics Overview</h2>
          <p className="text-sm text-parchment-dim font-lore">Track your activity and engagement</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32 glass-rune border-gold-ancient/30 text-parchment">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-rune border-gold-ancient/30">
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={fetchAnalytics}
            variant="outline"
            size="icon"
            className="ornate-border"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<MessageCircle className="w-5 h-5" />}
          label="Conversations"
          value={(data?.overview.totalConversations || 0).toString()}
          color="text-magic-glow"
          trend={data?.trends.conversationTrend}
        />
        <StatCard
          icon={<Heart className="w-5 h-5" />}
          label="Engagement"
          value={((data?.overview.totalLikes || 0) + (data?.overview.totalFavorites || 0)).toString()}
          subtext={`${data?.overview.totalLikes || 0} likes, ${data?.overview.totalFavorites || 0} favorites`}
          color="text-pink-400"
        />
        <StatCard
          icon={<BookOpen className="w-5 h-5" />}
          label="Knowledge Entries"
          value={(data?.overview.totalKnowledge || 0).toString()}
          subtext={`+${data?.trends.knowledgeAddedThisWeek || 0} this week`}
          color="text-magic-teal"
        />
        <StatCard
          icon={<Brain className="w-5 h-5" />}
          label="Memories"
          value={(data?.overview.totalMemories || 0).toString()}
          color="text-purple-400"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Bot Performance */}
        <Card className="glass-rune lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-parchment font-display">
                  <BarChart3 className="h-5 w-5 text-gold-rich" />
                  Top Performing Bots
                </CardTitle>
                <CardDescription className="text-parchment-dim font-lore">
                  Your most popular creations
                </CardDescription>
              </div>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-gold-rich hover:text-gold-ancient">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data?.botStats && data.botStats.length > 0 ? (
              <div className="space-y-3">
                {data.botStats.slice(0, 5).map((bot, index) => (
                  <div
                    key={bot.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-[#0a140a]/20 hover:bg-[#0a140a]/30 transition-colors"
                  >
                    <span className="text-lg font-bold text-parchment/50 w-6">
                      #{index + 1}
                    </span>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-rich to-gold-ancient flex items-center justify-center text-[#0a140a] font-bold">
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
                        <h4 className="font-semibold text-parchment truncate">{bot.name}</h4>
                        {bot.is_public && (
                          <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">
                            Public
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-parchment-dim">
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
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
                      <div className="flex items-center gap-1 text-gold-rich">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm font-semibold">{bot.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 text-parchment/30" />
                <p className="text-parchment-dim font-lore">No bots created yet</p>
                <Link href="/dashboard">
                  <Button className="mt-4 bg-gold-rich hover:bg-gold-rich/90 text-[#0a140a]">
                    <Zap className="mr-2 h-4 w-4" />
                    Create Your First Bot
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* This Week Stats */}
        <Card className="glass-rune">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-parchment font-display">
              <Zap className="h-5 w-5 text-gold-rich" />
              This Week
            </CardTitle>
            <CardDescription className="text-parchment-dim font-lore">
              Quick overview of your activity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#0a140a]/20">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-magic-glow" />
                <span className="text-sm text-parchment font-lore">Conversations</span>
              </div>
              <span className="font-bold text-parchment">{data?.trends.conversationsThisWeek || 0}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-[#0a140a]/20">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-gold-rich" />
                <span className="text-sm text-parchment font-lore">New Bots</span>
              </div>
              <span className="font-bold text-parchment">{data?.trends.botsCreatedThisWeek || 0}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-[#0a140a]/20">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-magic-teal" />
                <span className="text-sm text-parchment font-lore">Knowledge Added</span>
              </div>
              <span className="font-bold text-parchment">{data?.trends.knowledgeAddedThisWeek || 0}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-[#0a140a]/20">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-pink-400" />
                <span className="text-sm text-parchment font-lore">Personas</span>
              </div>
              <span className="font-bold text-parchment">{data?.overview.totalPersonas || 0}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-[#0a140a]/20">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-forest-light" />
                <span className="text-sm text-parchment font-lore">Total Bots</span>
              </div>
              <span className="font-bold text-parchment">
                {data?.overview.totalBots || 0}
                <span className="text-xs text-parchment/50 ml-1">
                  ({data?.overview.publicBots || 0} public)
                </span>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="glass-rune">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-parchment font-display">
            <Activity className="h-5 w-5 text-forest-light" />
            Recent Activity
          </CardTitle>
          <CardDescription className="text-parchment-dim font-lore">
            Latest actions on your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data?.recentActivity && data.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {data.recentActivity.slice(0, 10).map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-3 rounded-lg bg-[#0a140a]/20 hover:bg-[#0a140a]/30 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#0a140a]/50">
                    {activity.type === 'bot_created' ? (
                      <Bot className="w-4 h-4 text-gold-rich" />
                    ) : (
                      <MessageCircle className="w-4 h-4 text-magic-glow" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-parchment font-lore">
                      {activity.type === 'bot_created' ? (
                        <>
                          Created bot <span className="font-semibold text-gold-rich">{activity.name}</span>
                        </>
                      ) : (
                        <>
                          Conversation with <span className="font-semibold text-magic-glow">{activity.name}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <span className="text-xs text-parchment-dim">{formatDate(activity.date)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 mx-auto mb-4 text-parchment/30" />
              <p className="text-parchment-dim font-lore">No recent activity</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
