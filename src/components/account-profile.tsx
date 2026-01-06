'use client'

import { useUser, useClerk } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Edit3, ExternalLink } from 'lucide-react'

export const AccountProfile = () => {
  const { user, isLoaded } = useUser()
  const { openUserProfile } = useClerk()

  if (!isLoaded) {
    return (
      <Card className="glass-rune">
        <CardContent className="py-12">
          <div className="animate-spin rounded-full h-12 w-12 mx-auto border-b-2 border-forest"></div>
        </CardContent>
      </Card>
    )
  }

  if (!user) {
    return null
  }

  const handleOpenProfileSettings = () => {
    openUserProfile()
  }

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
            <Label className="text-parchment font-lore">First Name</Label>
            <Input
              value={user.firstName || ''}
              disabled
              className="bg-[#0a140a]/50 border-gold-ancient/30 text-parchment"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-parchment font-lore">Last Name</Label>
            <Input
              value={user.lastName || ''}
              disabled
              className="bg-[#0a140a]/50 border-gold-ancient/30 text-parchment"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-parchment font-lore">Username</Label>
          <Input
            value={user.username || 'Not set'}
            disabled
            className="bg-[#0a140a]/50 border-gold-ancient/30 text-parchment"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-parchment font-lore">Email</Label>
          <Input
            value={user.emailAddresses[0]?.emailAddress || ''}
            disabled
            className="bg-[#0a140a]/50 border-gold-ancient/30 text-parchment"
          />
        </div>
        <div className="p-4 bg-[#0a140a]/30 rounded-lg border border-gold-ancient/20">
          <p className="text-sm text-parchment-dim font-lore mb-4">
            Profile information is managed by your Clerk account. To update your name, username, or
            email, click the button below.
          </p>
          <Button
            onClick={handleOpenProfileSettings}
            variant="outline"
            className="ornate-border"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Edit Profile Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
