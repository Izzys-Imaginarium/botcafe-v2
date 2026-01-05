'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  MessageSquare,
  Heart,
  Star,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Calendar,
  BarChart3,
} from 'lucide-react'

interface BotAnalytic {
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

interface BotSummary {
  totalBots: number
  totalPublic: number
  totalConversations: number
  totalLikes: number
  totalFavorites: number
}

interface AnalyticsResponse {
  bots: BotAnalytic[]
  total: number
  summary: BotSummary
}

export const BotAnalyticsView = () => {
  const [data, setData] = useState<AnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState('conversations')

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/analytics/bots')
      if (!response.ok) throw new Error('Failed to fetch bot analytics')
      const result = await response.json() as AnalyticsResponse
      setData(result)
    } catch (err) {
      setError('Failed to load bot analytics')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const sortedBots = data?.bots
    ? [...data.bots].sort((a, b) => {
        switch (sortBy) {
          case 'conversations':
            return b.conversationCount - a.conversationCount
          case 'likes':
            return b.likes - a.likes
          case 'favorites':
            return b.favorites - a.favorites
          case 'rating':
            return b.rating - a.rating
          case 'newest':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          default:
            return 0
        }
      })
    : []

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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Bot Analytics
          </h1>
          <p className="text-muted-foreground">Detailed performance metrics for your bots</p>
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="conversations">Most Conversations</SelectItem>
              <SelectItem value="likes">Most Likes</SelectItem>
              <SelectItem value="favorites">Most Favorites</SelectItem>
              <SelectItem value="rating">Highest Rating</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchData} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      {data?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <Bot className="h-6 w-6 mx-auto mb-2 text-purple-400" />
              <p className="text-2xl font-bold">{data.summary.totalBots}</p>
              <p className="text-xs text-muted-foreground">Total Bots</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-400" />
              <p className="text-2xl font-bold">{data.summary.totalPublic}</p>
              <p className="text-xs text-muted-foreground">Public Bots</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <MessageSquare className="h-6 w-6 mx-auto mb-2 text-blue-400" />
              <p className="text-2xl font-bold">{data.summary.totalConversations}</p>
              <p className="text-xs text-muted-foreground">Conversations</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Heart className="h-6 w-6 mx-auto mb-2 text-pink-400" />
              <p className="text-2xl font-bold">{data.summary.totalLikes}</p>
              <p className="text-xs text-muted-foreground">Total Likes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Star className="h-6 w-6 mx-auto mb-2 text-yellow-400" />
              <p className="text-2xl font-bold">{data.summary.totalFavorites}</p>
              <p className="text-xs text-muted-foreground">Total Favorites</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bot List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-400" />
            All Bots
          </CardTitle>
          <CardDescription>{data?.total || 0} bots total</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedBots.length > 0 ? (
            <div className="space-y-4">
              {sortedBots.map((bot, index) => (
                <div
                  key={bot.id}
                  className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
                >
                  <span className="text-lg font-bold text-muted-foreground w-8">
                    #{index + 1}
                  </span>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold overflow-hidden">
                    {bot.avatar ? (
                      <img
                        src={bot.avatar}
                        alt={bot.name}
                        className="w-12 h-12 object-cover"
                      />
                    ) : (
                      <span className="text-lg">{bot.name?.charAt(0) || 'B'}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold truncate">{bot.name}</h4>
                      {bot.is_public ? (
                        <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                          Public
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-gray-500/20 text-gray-400">
                          Private
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Created {new Date(bot.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-6 text-center">
                    <div>
                      <div className="flex items-center justify-center gap-1 text-blue-400">
                        <MessageSquare className="h-4 w-4" />
                        <span className="font-bold">{bot.conversationCount}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Chats</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 text-pink-400">
                        <Heart className="h-4 w-4" />
                        <span className="font-bold">{bot.likes}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Likes</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 text-yellow-400">
                        <Star className="h-4 w-4" />
                        <span className="font-bold">{bot.favorites}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Favs</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 text-orange-400">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="font-bold">{bot.rating > 0 ? bot.rating.toFixed(1) : '-'}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Rating</p>
                    </div>
                  </div>
                  <Link href={`/bot/${bot.id}`}>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bot className="h-16 w-16 mx-auto mb-4 opacity-50 text-purple-400" />
              <h3 className="font-semibold mb-2">No Bots Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first bot to see analytics here
              </p>
              <Link href="/create">
                <Button>Create a Bot</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
