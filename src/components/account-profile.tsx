'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Edit3 } from 'lucide-react'

// Mock user data
const mockUser = {
  displayName: 'The Arcane Creator',
  username: 'arcane_wizard',
  bio: 'Master of digital realms, conjurer of AI companions, keeper of ancient code.',
}

export const AccountProfile = () => {
  return (
    <Card className="glass-rune">
      <CardHeader>
        <CardTitle className="text-parchment font-display flex items-center gap-2">
          <Edit3 className="w-5 h-5" />
          Profile Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-parchment font-lore">Display Name</Label>
            <Input
              defaultValue={mockUser.displayName}
              className="bg-[#0a140a]/50 border-gold-ancient/30 text-parchment"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-parchment font-lore">Username</Label>
            <Input
              defaultValue={mockUser.username}
              className="bg-[#0a140a]/50 border-gold-ancient/30 text-parchment"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-parchment font-lore">Bio</Label>
          <textarea
            defaultValue={mockUser.bio}
            className="w-full h-24 px-3 py-2 bg-[#0a140a]/50 border border-gold-ancient/30 rounded-md text-parchment font-lore resize-none"
          />
        </div>
        <div className="flex justify-end">
          <Button className="ornate-border bg-gold-ancient/20 hover:bg-gold-ancient/30 text-gold-rich">
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
