'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'

export const AccountSecurity = () => {
  return (
    <Card className="glass-rune">
      <CardHeader>
        <CardTitle className="text-parchment font-display">Security Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-parchment font-lore">Two-Factor Authentication</Label>
              <p className="text-xs text-parchment-dim font-lore">Add an extra layer of security</p>
            </div>
            <Switch />
          </div>
          <Separator className="bg-gold-ancient/30" />
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-parchment font-lore">Email Notifications</Label>
              <p className="text-xs text-parchment-dim font-lore">
                Receive updates about your account
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator className="bg-gold-ancient/30" />
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-parchment font-lore">Activity Logging</Label>
              <p className="text-xs text-parchment-dim font-lore">
                Track login activity and sessions
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
        <div className="pt-4 border-t border-gold-ancient/30">
          <Button
            variant="outline"
            className="ornate-border hover:bg-red-900/20 hover:border-red-500/50 text-red-400"
          >
            Change Password
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
