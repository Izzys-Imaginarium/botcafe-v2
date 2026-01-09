'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Bot, MessageCircle, Clock, Plus, Edit, Eye, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

// Mock user stats
const mockStats = {
  botsCreated: 12,
  conversations: 847,
  messagesExchanged: 12500,
  memoryEntries: 234,
  totalPlaytime: '142h 30m',
}

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

// Helper components
const StatCard = ({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
}) => (
  <Card className="glass-rune">
    <CardContent className="p-6">
      <div className="flex items-center gap-4">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center bg-[#0a140a]/50 ${color}`}
        >
          {icon}
        </div>
        <div>
          <p className="text-2xl font-display text-parchment">{value}</p>
          <p className="text-xs text-parchment-dim font-lore">{label}</p>
        </div>
      </div>
    </CardContent>
  </Card>
)

export const AccountOverview = () => {
  const { user } = useUser()
  const [userBots, setUserBots] = useState<UserBot[]>([])
  const [isLoadingBots, setIsLoadingBots] = useState(true)
  const [deletingBotId, setDeletingBotId] = useState<string | number | null>(null)

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

      // Remove the bot from the local state
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

  const getPictureUrl = (picture?: string | number | { id: number; url?: string; filename?: string } | null) => {
    if (!picture) return undefined
    if (typeof picture === 'string') return picture
    if (typeof picture === 'object' && picture.url) return picture.url
    return undefined
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={<Bot className="w-5 h-5" />}
          label="Bots Created"
          value={userBots.length.toString()}
          color="text-gold-rich"
        />
        <StatCard
          icon={<MessageCircle className="w-5 h-5" />}
          label="Conversations"
          value={mockStats.conversations.toString()}
          color="text-magic-glow"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Total Playtime"
          value={mockStats.totalPlaytime}
          color="text-magic-teal"
        />
      </div>

      {/* My Bots Section */}
      <Card className="glass-rune">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-parchment font-display">My Bots</CardTitle>
            <Link href="/create">
              <Button className="bg-forest hover:bg-forest/90 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Bot
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingBots ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest"></div>
            </div>
          ) : userBots.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="w-16 h-16 mx-auto text-parchment-dim mb-4" />
              <p className="text-parchment-dim font-lore mb-4">
                You haven't created any bots yet
              </p>
              <Link href="/create">
                <Button className="bg-forest hover:bg-forest/90 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Bot
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {userBots.map((bot) => (
                <div
                  key={bot.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-[#0a140a]/20 hover:bg-[#0a140a]/40 transition-colors border border-gold-ancient/20"
                >
                  <Avatar className="h-12 w-12 border-2 border-gold-ancient/30">
                    <AvatarImage src={getPictureUrl(bot.picture)} />
                    <AvatarFallback className="bg-[#0a140a] text-gold-rich font-display">
                      {getInitials(bot.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-parchment font-display font-semibold truncate">
                      {bot.name}
                    </h3>
                    <p className="text-sm text-parchment-dim font-lore truncate">
                      {bot.description}
                    </p>
                  </div>

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
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-rune">
        <CardHeader>
          <CardTitle className="text-parchment font-display">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 rounded-lg bg-[#0a140a]/20">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#0a140a]/50 text-gold-rich">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-parchment font-lore">
                  Created new bot 'Forest Guardian'
                </p>
                <p className="text-xs text-parchment-dim">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 rounded-lg bg-[#0a140a]/20">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#0a140a]/50 text-magic-glow">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-parchment font-lore">
                  Started conversation with Mystic Sage
                </p>
                <p className="text-xs text-parchment-dim">1 day ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
