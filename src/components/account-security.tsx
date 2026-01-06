'use client'

import { useClerk } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, ExternalLink } from 'lucide-react'

export const AccountSecurity = () => {
  const { openUserProfile } = useClerk()

  const handleOpenSecuritySettings = () => {
    openUserProfile()
  }

  return (
    <Card className="glass-rune">
      <CardHeader>
        <CardTitle className="text-parchment font-display flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Security Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-[#0a140a]/30 rounded-lg border border-gold-ancient/20">
          <p className="text-sm text-parchment-dim font-lore mb-4">
            Security settings including two-factor authentication, password changes, and active
            sessions are managed through your Clerk account. Click the button below to access these
            settings.
          </p>
          <Button onClick={handleOpenSecuritySettings} variant="outline" className="ornate-border">
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Security Settings
          </Button>
        </div>
        <div className="text-xs text-parchment-dim font-lore space-y-2">
          <p>• Enable two-factor authentication for enhanced security</p>
          <p>• Manage your active sessions and sign out of other devices</p>
          <p>• Update your password or add additional sign-in methods</p>
        </div>
      </CardContent>
    </Card>
  )
}
