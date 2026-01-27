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
import { Edit3, ExternalLink, MessageCircle, Save, Loader2, Camera, X, ImageIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { useRef } from 'react'

interface UserPreferences {
  nickname: string
  pronouns: string
  custom_pronouns: string
  description: string
  avatar: string | null
  avatarId: number | null
}

export const AccountProfile = () => {
  const { user, isLoaded } = useUser()
  const { openUserProfile } = useClerk()

  const [preferences, setPreferences] = useState<UserPreferences>({
    nickname: '',
    pronouns: '',
    custom_pronouns: '',
    description: '',
    avatar: null,
    avatarId: null,
  })
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [originalPreferences, setOriginalPreferences] = useState<UserPreferences>({
    nickname: '',
    pronouns: '',
    custom_pronouns: '',
    description: '',
    avatar: null,
    avatarId: null,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP)')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setIsUploadingAvatar(true)
    try {
      // Upload image
      const formData = new FormData()
      formData.append('file', file)
      formData.append('alt', 'User profile picture')

      const uploadResponse = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorData = (await uploadResponse.json()) as { error?: string }
        throw new Error(errorData.error || 'Failed to upload image')
      }

      const uploadData = (await uploadResponse.json()) as { doc?: { id: number } }
      const mediaId = uploadData.doc?.id

      if (!mediaId) {
        throw new Error('No media ID returned')
      }

      // Update user preferences with new avatar
      const updateResponse = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: mediaId }),
      })

      if (!updateResponse.ok) {
        throw new Error('Failed to update profile picture')
      }

      const updateData = await updateResponse.json()
      if (updateData.success && updateData.preferences) {
        setPreferences(updateData.preferences)
        setOriginalPreferences(updateData.preferences)
        toast.success('Profile picture updated!')
      }
    } catch (error) {
      console.error('Avatar upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload profile picture')
    } finally {
      setIsUploadingAvatar(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveAvatar = async () => {
    setIsUploadingAvatar(true)
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: null }),
      })

      if (!response.ok) {
        throw new Error('Failed to remove profile picture')
      }

      const data = await response.json()
      if (data.success && data.preferences) {
        setPreferences(data.preferences)
        setOriginalPreferences(data.preferences)
        toast.success('Profile picture removed')
      }
    } catch (error) {
      console.error('Remove avatar error:', error)
      toast.error('Failed to remove profile picture')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    }
    if (user?.username) {
      return user.username.slice(0, 2).toUpperCase()
    }
    return 'U'
  }

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
      {/* Profile Picture */}
      <Card className="glass-rune">
        <CardHeader>
          <CardTitle className="text-parchment font-display flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Profile Picture
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-2 border-gold-ancient/30">
                <AvatarImage src={preferences.avatar || user?.imageUrl} />
                <AvatarFallback className="bg-[#0a140a] text-gold-rich font-display text-2xl">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              {isUploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <Loader2 className="h-8 w-8 animate-spin text-gold-rich" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-sm text-parchment-dim font-lore text-center sm:text-left">
                Upload a custom profile picture. Supported formats: JPEG, PNG, GIF, WebP (max 5MB).
              </p>
              <div className="flex gap-2 justify-center sm:justify-start">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  id="avatar-upload"
                />
                <Button
                  variant="outline"
                  className="ornate-border"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {preferences.avatar ? 'Change Picture' : 'Upload Picture'}
                </Button>
                {preferences.avatar && (
                  <Button
                    variant="outline"
                    className="ornate-border text-destructive hover:text-destructive"
                    onClick={handleRemoveAvatar}
                    disabled={isUploadingAvatar}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
