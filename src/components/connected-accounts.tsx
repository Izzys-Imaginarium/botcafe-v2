'use client'

import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link2, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'

// Discord brand color
const DISCORD_COLOR = '#5865F2'

// Discord SVG icon
const DiscordIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
)

export const ConnectedAccounts = () => {
  const { user, isLoaded } = useUser()
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  if (!isLoaded) {
    return (
      <Card className="glass-rune">
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-forest" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!user) {
    return null
  }

  // Find Discord external account
  const discordAccount = user.externalAccounts?.find(
    (account) => account.provider === 'discord'
  )

  const handleConnectDiscord = async () => {
    setIsConnecting(true)
    try {
      await user.createExternalAccount({
        strategy: 'oauth_discord',
        redirectUrl: window.location.href,
      })
    } catch (error) {
      console.error('Failed to connect Discord:', error)
      toast.error('Failed to connect Discord account')
      setIsConnecting(false)
    }
  }

  const handleDisconnectDiscord = async () => {
    if (!discordAccount) return

    setIsDisconnecting(true)
    try {
      await discordAccount.destroy()
      toast.success('Discord account disconnected')
    } catch (error) {
      console.error('Failed to disconnect Discord:', error)
      toast.error('Failed to disconnect Discord account')
    } finally {
      setIsDisconnecting(false)
    }
  }

  return (
    <Card className="glass-rune">
      <CardHeader>
        <CardTitle className="text-parchment font-display flex items-center gap-2">
          <Link2 className="w-5 h-5" />
          Connected Accounts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-parchment-dim font-lore">
          Connect external accounts to access BotCafe features on other platforms.
        </p>

        {/* Discord Connection */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#0a140a]/30 rounded-lg border border-gold-ancient/20">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: DISCORD_COLOR }}
            >
              <DiscordIcon className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-parchment">Discord</p>
              {discordAccount ? (
                <p className="text-sm text-parchment-dim truncate">
                  Connected as {discordAccount.username || discordAccount.providerUserId}
                </p>
              ) : (
                <p className="text-sm text-parchment-dim">
                  Connect to use BotCafe bots in Discord
                </p>
              )}
            </div>
          </div>

          {discordAccount ? (
            <div className="flex items-center gap-3 sm:gap-2">
              <span className="flex items-center gap-1 text-sm text-emerald-400">
                <Check className="w-4 h-4" />
                Connected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnectDiscord}
                disabled={isDisconnecting}
                className="ornate-border text-red-400 hover:text-red-300 hover:border-red-400/50"
              >
                {isDisconnecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Disconnect'
                )}
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleConnectDiscord}
              disabled={isConnecting}
              className="text-white hover:opacity-90 w-full sm:w-auto"
              style={{ backgroundColor: DISCORD_COLOR }}
            >
              {isConnecting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <DiscordIcon className="w-4 h-4 mr-2" />
              )}
              Connect
            </Button>
          )}
        </div>

        <p className="text-xs text-parchment-dim font-lore">
          Once connected, you can use <code className="text-gold-ancient">/chat</code> and other
          commands with BotCafe Barista in any Discord server where the bot is installed.
        </p>
      </CardContent>
    </Card>
  )
}
