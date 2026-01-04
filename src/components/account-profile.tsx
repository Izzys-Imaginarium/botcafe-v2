'use client'

import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Edit3 } from 'lucide-react'
import { toast } from 'sonner'

export const AccountProfile = () => {
  const { user, isLoaded } = useUser()

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

  const handleSaveChanges = () => {
    // Profile management is handled by Clerk
    // Users can update their profile via Clerk's user button or dedicated profile page
    toast.info(
      'Profile updates are managed through your account settings. Click your profile icon in the navigation.'
    )
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
          <p className="text-sm text-parchment-dim font-lore">
            Profile information is managed by your Clerk account. To update your name, username, or
            email, click your profile icon in the top navigation and select "Manage account".
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
