'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Bot, Plus, Edit, Eye, Trash2, Heart, Globe, Lock, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface UserBot {
  id: string | number
  name: string
  slug: string
  description: string
  picture?: string | number | { id: number; url?: string; filename?: string } | null
  is_public: boolean
  likes_count: number
  created_date: string
  creator_username: string
}

export const MyBots = () => {
  const { user } = useUser()
  const [userBots, setUserBots] = useState<UserBot[]>([])
  const [isLoadingBots, setIsLoadingBots] = useState(true)
  const [deletingBotId, setDeletingBotId] = useState<string | number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchUserBots = async () => {
      if (!user) return

      try {
        const response = await fetch('/api/bots/my-bots')
        if (response.ok) {
          const data = (await response.json()) as { bots: UserBot[]; total: number }
          setUserBots(data.bots || [])
        }
      } catch (error) {
        console.error('Error fetching user bots:', error)
      } finally {
        setIsLoadingBots(false)
      }
    }

    fetchUserBots()
  }, [user])

  const handleDeleteBot = async (botId: string | number, botName: string) => {
    if (!confirm(`Are you sure you want to delete "${botName}"? This action cannot be undone.`)) {
      return
    }

    setDeletingBotId(botId)

    try {
      const response = await fetch(`/api/bots/${botId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = (await response.json()) as { message?: string }
        throw new Error(error.message || 'Failed to delete bot')
      }

      setUserBots((prev) => prev.filter((bot) => bot.id !== botId))
      toast.success(`"${botName}" has been deleted successfully`)
    } catch (error: any) {
      console.error('Error deleting bot:', error)
      toast.error(error.message || 'Failed to delete bot')
    } finally {
      setDeletingBotId(null)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getPictureUrl = (
    picture?: string | number | { id: number; url?: string; filename?: string } | null
  ) => {
    if (!picture) return undefined
    if (typeof picture === 'string') return picture
    if (typeof picture === 'object' && picture.url) return picture.url
    return undefined
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header with stats and create button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-parchment">My Bots</h2>
          <p className="text-parchment-dim font-lore">
            {userBots.length} {userBots.length === 1 ? 'bot' : 'bots'} created
          </p>
        </div>
        <Link href="/create">
          <Button className="bg-forest hover:bg-forest/90 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Create New Bot
          </Button>
        </Link>
      </div>

      {/* Search */}
      {userBots.length > 0 && (
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-parchment-dim" />
          <Input
            placeholder="Search your bots..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-[#0a140a]/50 border-gold-ancient/20 text-parchment placeholder:text-parchment-dim"
          />
        </div>
      )}

      {/* Bots Grid */}
      {isLoadingBots ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest"></div>
        </div>
      ) : userBots.length === 0 ? (
        <Card className="glass-rune">
          <CardContent className="py-16">
            <div className="text-center">
              <Bot className="w-20 h-20 mx-auto text-parchment-dim mb-6" />
              <h3 className="text-xl font-display text-parchment mb-2">No Bots Yet</h3>
              <p className="text-parchment-dim font-lore mb-6 max-w-md mx-auto">
                Create your first bot to start conversations and bring your characters to life.
              </p>
              <Link href="/create">
                <Button className="bg-forest hover:bg-forest/90 text-white" size="lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Bot
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {searchQuery && (
            <p className="text-sm text-parchment-dim font-lore">
              Showing {userBots.filter((bot) =>
                bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                bot.description?.toLowerCase().includes(searchQuery.toLowerCase())
              ).length} of {userBots.length} bots
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userBots
              .filter((bot) =>
                bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                bot.description?.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((bot) => (
              <Card
              key={bot.id}
              className="glass-rune hover:border-gold-ancient/50 transition-colors"
            >
              <CardContent className="p-5">
                <div className="flex gap-4">
                  {/* Bot Avatar */}
                  <Avatar className="h-16 w-16 border-2 border-gold-ancient/30 flex-shrink-0">
                    <AvatarImage src={getPictureUrl(bot.picture)} />
                    <AvatarFallback className="bg-[#0a140a] text-gold-rich font-display text-lg">
                      {getInitials(bot.name)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Bot Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-lg font-display font-semibold text-parchment truncate">
                        {bot.name}
                      </h3>
                      <Badge
                        variant="outline"
                        className={
                          bot.is_public
                            ? 'border-green-500/30 text-green-400 flex-shrink-0'
                            : 'border-yellow-500/30 text-yellow-400 flex-shrink-0'
                        }
                      >
                        {bot.is_public ? (
                          <>
                            <Globe className="w-3 h-3 mr-1" />
                            Public
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3 mr-1" />
                            Private
                          </>
                        )}
                      </Badge>
                    </div>

                    <p className="text-sm text-parchment-dim font-lore line-clamp-2 mb-3">
                      {bot.description || 'No description'}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-parchment-dim mb-3">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {bot.likes_count} likes
                      </span>
                      <span>Created {formatDate(bot.created_date)}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <Link href={`/${bot.creator_username}/${bot.slug}`}>
                        <Button variant="outline" size="sm" className="ornate-border">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Link href={`/${bot.creator_username}/${bot.slug}/edit`}>
                        <Button variant="outline" size="sm" className="ornate-border">
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        onClick={() => handleDeleteBot(bot.id, bot.name)}
                        disabled={deletingBotId === bot.id}
                      >
                        {deletingBotId === bot.id ? (
                          <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        </>
      )}
    </div>
  )
}
