'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export const ProfileSidebar = () => {
  const { user, isLoaded } = useUser()
  const [customAvatar, setCustomAvatar] = useState<string | null>(null)

  // Fetch custom avatar from user preferences
  useEffect(() => {
    const fetchCustomAvatar = async () => {
      try {
        const response = await fetch('/api/user/preferences')
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.preferences?.avatar) {
            setCustomAvatar(data.preferences.avatar)
          }
        }
      } catch (error) {
        console.error('Failed to fetch custom avatar:', error)
      }
    }

    if (isLoaded && user) {
      fetchCustomAvatar()
    }
  }, [isLoaded, user])

  if (!isLoaded) {
    return (
      <Card className="glass-rune sticky top-24">
        <CardContent className="py-12">
          <div className="animate-spin rounded-full h-12 w-12 mx-auto border-b-2 border-forest"></div>
        </CardContent>
      </Card>
    )
  }

  if (!user) {
    return null
  }

  const getInitials = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    }
    if (user.username) {
      return user.username.slice(0, 2).toUpperCase()
    }
    if (user.emailAddresses[0]?.emailAddress) {
      return user.emailAddresses[0].emailAddress.slice(0, 2).toUpperCase()
    }
    return 'U'
  }

  const displayName =
    user.fullName || user.username || user.emailAddresses[0]?.emailAddress || 'User'

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recently'

  return (
    <Card className="glass-rune sticky top-24">
      <CardHeader className="text-center">
        <div className="relative mx-auto">
          <Avatar className="h-20 w-20 border-2 border-gold-ancient/30">
            <AvatarImage src={customAvatar || user.imageUrl} />
            <AvatarFallback className="bg-[#0a140a] text-gold-rich font-display text-xl">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          {user.emailAddresses[0]?.verification?.status === 'verified' && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gold-rich rounded-full flex items-center justify-center">
              <span className="text-xs">✓</span>
            </div>
          )}
        </div>
        <div className="mt-4">
          <CardTitle className="text-parchment font-display">{displayName}</CardTitle>
          {user.username && (
            <p className="text-sm text-parchment-dim font-lore">@{user.username}</p>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Separator className="bg-gold-ancient/30 mb-4" />
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-parchment-dim">Email</span>
            <span className="text-parchment font-lore truncate ml-2">
              {user.emailAddresses[0]?.emailAddress}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-parchment-dim">Member since</span>
            <span className="text-parchment font-lore">{memberSince}</span>
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
