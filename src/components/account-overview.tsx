'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot, MessageCircle, Clock, BookOpen, Heart, ArrowRight } from 'lucide-react'

// Mock user stats - will be replaced with real data later
const mockStats = {
  conversations: 847,
  memoryEntries: 234,
  totalPlaytime: '142h 30m',
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
  const [botCount, setBotCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchBotCount = async () => {
      if (!user) return

      try {
        const response = await fetch('/api/bots/my-bots')
        if (response.ok) {
          const data = (await response.json()) as { bots: any[]; total: number }
          setBotCount(data.total || data.bots?.length || 0)
        }
      } catch (error) {
        console.error('Error fetching bot count:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBotCount()
  }, [user])

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Bot className="w-5 h-5" />}
          label="Bots Created"
          value={isLoading ? '...' : botCount.toString()}
          color="text-gold-rich"
        />
        <StatCard
          icon={<MessageCircle className="w-5 h-5" />}
          label="Conversations"
          value={mockStats.conversations.toString()}
          color="text-magic-glow"
        />
        <StatCard
          icon={<BookOpen className="w-5 h-5" />}
          label="Memory Entries"
          value={mockStats.memoryEntries.toString()}
          color="text-magic-teal"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Total Playtime"
          value={mockStats.totalPlaytime}
          color="text-purple-400"
        />
      </div>

      {/* Quick Actions */}
      <Card className="glass-rune">
        <CardHeader>
          <CardTitle className="text-parchment font-display">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/dashboard" className="block">
              <div className="p-4 rounded-lg bg-[#0a140a]/20 hover:bg-[#0a140a]/40 transition-colors border border-gold-ancient/20 group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bot className="w-5 h-5 text-gold-rich" />
                    <span className="text-parchment font-lore">My Bots</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-parchment-dim group-hover:text-parchment transition-colors" />
                </div>
              </div>
            </Link>
            <Link href="/create" className="block">
              <div className="p-4 rounded-lg bg-[#0a140a]/20 hover:bg-[#0a140a]/40 transition-colors border border-gold-ancient/20 group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bot className="w-5 h-5 text-forest-light" />
                    <span className="text-parchment font-lore">Create Bot</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-parchment-dim group-hover:text-parchment transition-colors" />
                </div>
              </div>
            </Link>
            <Link href="/dashboard?tab=lore" className="block">
              <div className="p-4 rounded-lg bg-[#0a140a]/20 hover:bg-[#0a140a]/40 transition-colors border border-gold-ancient/20 group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-magic-teal" />
                    <span className="text-parchment font-lore">Lore Library</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-parchment-dim group-hover:text-parchment transition-colors" />
                </div>
              </div>
            </Link>
            <Link href="/explore" className="block">
              <div className="p-4 rounded-lg bg-[#0a140a]/20 hover:bg-[#0a140a]/40 transition-colors border border-gold-ancient/20 group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5 text-pink-400" />
                    <span className="text-parchment font-lore">Explore Bots</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-parchment-dim group-hover:text-parchment transition-colors" />
                </div>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
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
            <div className="flex items-center gap-4 p-3 rounded-lg bg-[#0a140a]/20">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#0a140a]/50 text-magic-teal">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-parchment font-lore">
                  Added new lore entry 'Ancient Spells'
                </p>
                <p className="text-xs text-parchment-dim">3 days ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
