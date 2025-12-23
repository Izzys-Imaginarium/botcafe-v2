'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

// Mock user data
const mockUser = {
  id: '1',
  email: 'wizard@botcafe.com',
  displayName: 'The Arcane Creator',
  username: 'arcane_wizard',
  bio: 'Master of digital realms, conjurer of AI companions, keeper of ancient code.',
  avatar: null as string | null,
  memberSince: '2024-01-15',
  isVerified: true,
}

export const ProfileSidebar = () => {
  return (
    <Card className="glass-rune sticky top-24">
      <CardHeader className="text-center">
        <div className="relative mx-auto">
          <Avatar className="h-20 w-20 border-2 border-gold-ancient/30">
            <AvatarImage src={mockUser.avatar || undefined} />
            <AvatarFallback className="bg-[#0a140a] text-gold-rich font-display text-xl">
              AC
            </AvatarFallback>
          </Avatar>
          {mockUser.isVerified && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gold-rich rounded-full flex items-center justify-center">
              <span className="text-xs">✓</span>
            </div>
          )}
        </div>
        <div className="mt-4">
          <CardTitle className="text-parchment font-display">{mockUser.displayName}</CardTitle>
          <p className="text-sm text-parchment-dim font-lore">@{mockUser.username}</p>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-parchment-dim font-lore text-center mb-4 line-clamp-3">
          {mockUser.bio}
        </p>
        <Separator className="bg-gold-ancient/30 mb-4" />
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-parchment-dim">Member since</span>
            <span className="text-parchment font-lore">Jan 15, 2024</span>
          </div>
          <div className="flex justify-between">
            <span className="text-parchment-dim">Status</span>
            <Badge
              variant="secondary"
              className="bg-magic-glow/20 text-magic-glow border-magic-glow/30 text-xs"
            >
              Active
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
