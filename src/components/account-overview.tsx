'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot, MessageCircle, Clock } from 'lucide-react'

// Mock user stats
const mockStats = {
  botsCreated: 12,
  conversations: 847,
  messagesExchanged: 12500,
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
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={<Bot className="w-5 h-5" />}
          label="Bots Created"
          value={mockStats.botsCreated.toString()}
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
