'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

// Mock data for now - will be replaced with actual data fetching
interface BotData {
  id: string
  name: string
  description: string
  creator_display_name: string
  likes_count: number
  favorites_count: number
  gender: string
  picture: string | null
  is_public: boolean
}

const mockBots: BotData[] = [
  {
    id: '1',
    name: 'Mystic Sage',
    description: 'An ancient wisdom keeper with knowledge of the arcane arts and mystical realms.',
    creator_display_name: 'Elena the Wise',
    likes_count: 42,
    favorites_count: 18,
    gender: 'female',
    picture: null,
    is_public: true,
  },
  {
    id: '2',
    name: 'Forest Guardian',
    description:
      'A protective spirit of the woodland, offering guidance to those who respect nature.',
    creator_display_name: 'Thorn Keeper',
    likes_count: 35,
    favorites_count: 24,
    gender: 'non-binary',
    picture: null,
    is_public: true,
  },
  {
    id: '3',
    name: 'Quantum Scholar',
    description:
      'A brilliant mind focused on science and technology, helping users understand complex concepts.',
    creator_display_name: 'Dr. Astra Nova',
    likes_count: 67,
    favorites_count: 45,
    gender: 'prefer-not-to-say',
    picture: null,
    is_public: true,
  },
  {
    id: '4',
    name: 'Ember Heart',
    description:
      'A warm and nurturing companion perfect for emotional support and creative conversations.',
    creator_display_name: 'Luna Dawn',
    likes_count: 89,
    favorites_count: 67,
    gender: 'female',
    picture: null,
    is_public: true,
  },
]

export const BotList = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {mockBots.map((bot) => (
        <BotCard key={bot.id} bot={bot} />
      ))}
    </div>
  )
}

interface BotCardProps {
  bot: BotData
}

const BotCard = ({ bot }: BotCardProps) => {
  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'male':
        return '♂'
      case 'female':
        return '♀'
      case 'non-binary':
        return '⚧'
      default:
        return '❓'
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

  return (
    <Card className="glass-rune hover:scale-105 hover:shadow-[0_10px_40px_-10px_rgba(212,175,55,0.3)] transition-all duration-300 group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-gold-ancient/30">
              <AvatarImage src={bot.picture || undefined} />
              <AvatarFallback className="bg-[#0a140a] text-gold-rich font-display">
                {getInitials(bot.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-parchment font-display text-lg group-hover:text-glow-gold transition-all">
                {bot.name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-parchment-dim">{getGenderIcon(bot.gender)}</span>
                <span className="text-xs text-parchment-dim font-lore">
                  by {bot.creator_display_name}
                </span>
              </div>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="bg-gold-ancient/20 text-gold-rich border-gold-ancient/30"
          >
            Public
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-parchment-dim font-lore text-sm mb-4 line-clamp-3">{bot.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span className="text-magic-glow">♥</span>
              <span className="text-parchment font-lore text-sm">{bot.likes_count}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-magic-teal">★</span>
              <span className="text-parchment font-lore text-sm">{bot.favorites_count}</span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="ornate-border hover:bg-gold-ancient/20 hover:border-gold-rich"
          >
            Chat
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export const BotListSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <Card key={i} className="glass-rune animate-pulse">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-[#0a140a] rounded-full border-2 border-gold-ancient/30" />
                <div className="space-y-2">
                  <div className="h-4 bg-[#0a140a] rounded w-24" />
                  <div className="h-3 bg-[#0a140a] rounded w-16" />
                </div>
              </div>
              <div className="h-6 bg-[#0a140a] rounded w-12" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <div className="h-3 bg-[#0a140a] rounded w-full" />
              <div className="h-3 bg-[#0a140a] rounded w-3/4" />
              <div className="h-3 bg-[#0a140a] rounded w-1/2" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-4 bg-[#0a140a] rounded w-8" />
                <div className="h-4 bg-[#0a140a] rounded w-8" />
              </div>
              <div className="h-8 bg-[#0a140a] rounded w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
