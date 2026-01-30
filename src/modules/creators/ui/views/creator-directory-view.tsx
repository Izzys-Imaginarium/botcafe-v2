'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Users,
  Search,
  Loader2,
  Star,
  Bot,
  MessageSquare,
  CheckCircle2,
  Crown,
  MapPin,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useInfiniteList } from '@/hooks/use-infinite-list'
import { InfiniteScrollTrigger } from '@/components/ui/infinite-scroll-trigger'

// Format numbers with K/M suffix only when appropriate
function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M'
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K'
  }
  return num.toString()
}

interface CreatorProfile {
  id: string
  username: string
  display_name: string
  bio: string
  profile_media?: {
    avatar?: { url: string }
    banner_image?: { url: string }
  }
  social_links?: {
    website?: string
    github?: string
    twitter?: string
  }
  creator_info?: {
    creator_type?: string
    specialties?: Array<{ specialty: string }>
    experience_level?: string
    location?: string
  }
  portfolio?: {
    featured_bots?: any[]
    bot_count?: number
    total_conversations?: number
    average_rating?: number
  }
  community_stats?: {
    follower_count?: number
    following_count?: number
    total_likes?: number
  }
  verification_status?: string
  featured_creator?: boolean
  tags?: Array<{ tag: string }>
}

const verificationIcons: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  verified: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    label: 'Verified',
    color: 'text-blue-500',
  },
  premium: {
    icon: <Crown className="h-4 w-4" />,
    label: 'Premium',
    color: 'text-yellow-500',
  },
}

export const CreatorDirectoryView = () => {
  const [hasProfile, setHasProfile] = useState(false)
  const [myProfile, setMyProfile] = useState<CreatorProfile | null>(null)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortBy, setSortBy] = useState<string>('-createdAt')

  // Use infinite list hook
  const {
    items: creators,
    isLoading,
    isLoadingMore,
    hasMore,
    total: totalCreators,
    loadMore,
    setParams,
  } = useInfiniteList<CreatorProfile>({
    endpoint: '/api/creators',
    limit: 12,
    initialParams: { sort: '-createdAt' },
    itemsKey: 'creators',
  })

  // Debounce search query to prevent flickering
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Update params when filters change
  useEffect(() => {
    const params: Record<string, string> = { sort: sortBy }
    if (debouncedSearch) {
      params.search = debouncedSearch
    }
    setParams(params)
  }, [debouncedSearch, sortBy, setParams])

  // Check my profile on mount
  useEffect(() => {
    checkMyProfile()
  }, [])

  const checkMyProfile = async () => {
    try {
      const response = await fetch('/api/creators/me')
      const data = (await response.json()) as { success?: boolean; hasProfile?: boolean; creator?: CreatorProfile }

      if (data.success && data.hasProfile) {
        setHasProfile(true)
        setMyProfile(data.creator || null)
      }
    } catch (error) {
      console.error('Error checking profile:', error)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Creator Directory
            </h1>
            <p className="text-muted-foreground">
              Discover talented bot creators and their amazing creations
            </p>
          </div>
          {hasProfile && (
            <Link href={`/creators/${myProfile?.username}`}>
              <Button>
                <Users className="mr-2 h-4 w-4" />
                View My Profile
              </Button>
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Creators</p>
                  <p className="text-2xl font-bold">{totalCreators}</p>
                </div>
                <Users className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Bots</p>
                  <p className="text-2xl font-bold">
                    {creators.reduce((sum, c) => sum + (c.portfolio?.bot_count || 0), 0)}
                  </p>
                </div>
                <Bot className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Conversations</p>
                  <p className="text-2xl font-bold">
                    {formatCompactNumber(creators.reduce((sum, c) => sum + (c.portfolio?.total_conversations || 0), 0))}
                  </p>
                </div>
                <MessageSquare className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search creators..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-createdAt">Newest</SelectItem>
                    <SelectItem value="createdAt">Oldest</SelectItem>
                    <SelectItem value="username">Username A-Z</SelectItem>
                    <SelectItem value="-username">Username Z-A</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('')
                    setSortBy('-createdAt')
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Creator List */}
      {isLoading && creators.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : creators.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No creators found</h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'Try adjusting your search'
                  : 'No creators yet'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creators.map((creator) => (
              <Link key={creator.id} href={`/creators/${creator.username}`}>
                <Card className="relative overflow-hidden hover:border-purple-500/50 transition-colors cursor-pointer h-full">
                  {/* Banner */}
                  {creator.profile_media?.banner_image?.url ? (
                    <div
                      className="h-24 bg-cover bg-center"
                      style={{ backgroundImage: `url(${creator.profile_media.banner_image.url})` }}
                    />
                  ) : (
                    <div className="h-24 bg-gradient-to-r from-purple-500/20 to-pink-500/20" />
                  )}

                  {/* Badges */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {creator.featured_creator && (
                      <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500">
                        <Star className="mr-1 h-3 w-3 fill-current" />
                        Featured
                      </Badge>
                    )}
                    {creator.verification_status && verificationIcons[creator.verification_status] && (
                      <Badge variant="secondary" className={`bg-opacity-10 ${verificationIcons[creator.verification_status].color}`}>
                        {verificationIcons[creator.verification_status].icon}
                        <span className="ml-1">{verificationIcons[creator.verification_status].label}</span>
                      </Badge>
                    )}
                  </div>

                  <CardHeader className="pb-2 pt-0 -mt-8 relative">
                    <Avatar className="h-16 w-16 border-4 border-background">
                      <AvatarImage src={creator.profile_media?.avatar?.url} />
                      <AvatarFallback className="text-lg">
                        {creator.display_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="mt-2">
                      <CardTitle className="text-lg">{creator.display_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">@{creator.username}</p>
                    </div>
                  </CardHeader>

                  <CardContent className="pb-3">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {creator.bio}
                    </p>

                    {/* Location */}
                    {creator.creator_info?.location && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                        <MapPin className="h-3 w-3" />
                        {creator.creator_info.location}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="flex items-center justify-center text-purple-400 mb-1">
                          <Bot className="h-4 w-4" />
                        </div>
                        <p className="text-sm font-semibold">{creator.portfolio?.bot_count || 0}</p>
                        <p className="text-xs text-muted-foreground">Bots</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-center text-blue-400 mb-1">
                          <MessageSquare className="h-4 w-4" />
                        </div>
                        <p className="text-sm font-semibold">
                          {formatCompactNumber(creator.portfolio?.total_conversations || 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">Chats</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-center text-green-400 mb-1">
                          <Users className="h-4 w-4" />
                        </div>
                        <p className="text-sm font-semibold">{creator.community_stats?.follower_count || 0}</p>
                        <p className="text-xs text-muted-foreground">Followers</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <InfiniteScrollTrigger
            onLoadMore={loadMore}
            hasMore={hasMore}
            isLoading={isLoadingMore}
            endMessage="You've seen all the creators!"
          />
        </>
      )}
    </div>
  )
}
