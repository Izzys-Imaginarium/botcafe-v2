'use client'

import { useState, useEffect } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Edit3, ExternalLink, MessageCircle, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface UserPreferences {
  nickname: string
  pronouns: string
  custom_pronouns: string
  description: string
}

export const AccountProfile = () => {
  const { user, isLoaded } = useUser()
  const { openUserProfile } = useClerk()

  const [preferences, setPreferences] = useState<UserPreferences>({
    nickname: '',
    pronouns: '',
    custom_pronouns: '',
    description: '',
  })
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [originalPreferences, setOriginalPreferences] = useState<UserPreferences>({
    nickname: '',
    pronouns: '',
    custom_pronouns: '',
    description: '',
  })

  // Fetch user preferences on mount
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await fetch('/api/user/preferences')
        if (response.ok) {
          const data = (await response.json()) as {
            success?: boolean
            preferences?: UserPreferences
          }
          if (data.success && data.preferences) {
            setPreferences(data.preferences)
            setOriginalPreferences(data.preferences)
          }
        }
      } catch (error) {
        console.error('Failed to fetch preferences:', error)
      } finally {
        setIsLoadingPreferences(false)
      }
    }

    if (isLoaded && user) {
      fetchPreferences()
    }
  }, [isLoaded, user])

  // Track changes
  useEffect(() => {
    const changed =
      preferences.nickname !== originalPreferences.nickname ||
      preferences.pronouns !== originalPreferences.pronouns ||
      preferences.custom_pronouns !== originalPreferences.custom_pronouns ||
      preferences.description !== originalPreferences.description
    setHasChanges(changed)
  }, [preferences, originalPreferences])

  const handleSavePreferences = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      })

      if (response.ok) {
        const data = (await response.json()) as {
          success?: boolean
          preferences?: UserPreferences
        }
        if (data.success && data.preferences) {
          setOriginalPreferences(data.preferences)
          setPreferences(data.preferences)
          toast.success('Chat preferences saved successfully!')
        }
      } else {
        toast.error('Failed to save preferences')
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
      toast.error('Failed to save preferences')
    } finally {
      setIsSaving(false)
    }
  }

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
    <div className="space-y-6">
      {/* Account Information (Clerk-managed) */}
      <Card className="glass-rune">
        <CardHeader>
          <CardTitle className="text-parchment font-display flex items-center gap-2">
            <Edit3 className="w-5 h-5" />
            Account Information
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
              Account information is managed by your Clerk account. To update your name, username, or
              email, click the button below.
            </p>
            <Button
              onClick={handleOpenProfileSettings}
              variant="outline"
              className="ornate-border"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Edit Account Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Chat Preferences (BotCafe-managed) */}
      <Card className="glass-rune">
        <CardHeader>
          <CardTitle className="text-parchment font-display flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Chat Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoadingPreferences ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-forest" />
            </div>
          ) : (
            <>
              <p className="text-sm text-parchment-dim font-lore">
                These preferences are used when chatting without a persona. Bots will use this
                information to address you properly.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nickname" className="text-parchment font-lore">
                    Nickname
                  </Label>
                  <Input
                    id="nickname"
                    value={preferences.nickname}
                    onChange={(e) =>
                      setPreferences((prev) => ({ ...prev, nickname: e.target.value }))
                    }
                    placeholder="What should bots call you?"
                    className="bg-[#0a140a]/50 border-gold-ancient/30 text-parchment placeholder:text-parchment-dim/50"
                  />
                  <p className="text-xs text-parchment-dim">
                    e.g., &quot;Alex&quot;, &quot;Captain&quot;, &quot;Boss&quot;
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pronouns" className="text-parchment font-lore">
                    Pronouns
                  </Label>
                  <Select
                    value={preferences.pronouns}
                    onValueChange={(value) =>
                      setPreferences((prev) => ({ ...prev, pronouns: value }))
                    }
                  >
                    <SelectTrigger
                      id="pronouns"
                      className="bg-[#0a140a]/50 border-gold-ancient/30 text-parchment"
                    >
                      <SelectValue placeholder="Select pronouns" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="he/him">He/Him</SelectItem>
                      <SelectItem value="she/her">She/Her</SelectItem>
                      <SelectItem value="they/them">They/Them</SelectItem>
                      <SelectItem value="other">Other (specify below)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {preferences.pronouns === 'other' && (
                <div className="space-y-2">
                  <Label htmlFor="custom_pronouns" className="text-parchment font-lore">
                    Custom Pronouns
                  </Label>
                  <Input
                    id="custom_pronouns"
                    value={preferences.custom_pronouns}
                    onChange={(e) =>
                      setPreferences((prev) => ({ ...prev, custom_pronouns: e.target.value }))
                    }
                    placeholder="Enter your preferred pronouns"
                    className="bg-[#0a140a]/50 border-gold-ancient/30 text-parchment placeholder:text-parchment-dim/50"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description" className="text-parchment font-lore">
                  About You
                </Label>
                <Textarea
                  id="description"
                  value={preferences.description}
                  onChange={(e) =>
                    setPreferences((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="A brief description about yourself that bots will know..."
                  className="bg-[#0a140a]/50 border-gold-ancient/30 text-parchment placeholder:text-parchment-dim/50 min-h-[100px]"
                />
                <p className="text-xs text-parchment-dim">
                  This helps bots understand who they&apos;re talking to.
                </p>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSavePreferences}
                  disabled={!hasChanges || isSaving}
                  className="bg-forest hover:bg-forest/80 text-parchment"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Preferences
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
