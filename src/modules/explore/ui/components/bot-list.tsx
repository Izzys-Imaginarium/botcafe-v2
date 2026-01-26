'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useInfiniteList } from '@/hooks/use-infinite-list'
import { InfiniteScrollTrigger } from '@/components/ui/infinite-scroll-trigger'

interface BotData {
  id: string | number
  name: string
  description: string
  creator_display_name: string
  likes_count: number
  favorites_count: number
  gender?: string
  picture?: string | number | { id: number; url?: string; filename?: string } | null
  is_public: boolean
  slug: string
  creator_username: string
}

export const BotList = () => {
  const searchParams = useSearchParams()

  // Build initial params from URL
  const getInitialParams = useCallback(() => {
    const params: Record<string, string> = {}
    const sort = searchParams.get('sort')
    const search = searchParams.get('search')
    if (sort) params.sort = sort
    if (search) params.search = search
    return params
  }, [searchParams])

  const {
    items: bots,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    setParams,
  } = useInfiniteList<BotData>({
    endpoint: '/api/bots/explore',
    limit: 12,
    initialParams: getInitialParams(),
    itemsKey: 'bots',
  })

  // Update params when URL search params change
  useEffect(() => {
    setParams(getInitialParams())
  }, [searchParams, setParams, getInitialParams])

  if (isLoading && bots.length === 0) {
    return <BotListSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-parchment-dim font-lore">{error}</p>
        <Button
          onClick={() => window.location.reload()}
          className="mt-4 bg-forest hover:bg-forest/90 text-white"
        >
          Try Again
        </Button>
      </div>
    )
  }

  if (bots.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-parchment-dim font-lore text-lg">No bots found</p>
        <p className="text-parchment-dim font-lore text-sm mt-2">
          Try adjusting your filters or create your own bot!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {bots.map((bot) => (
          <BotCard key={bot.id} bot={bot} />
        ))}
      </div>

      <InfiniteScrollTrigger
        onLoadMore={loadMore}
        hasMore={hasMore}
        isLoading={isLoadingMore}
        endMessage="You've seen all the bots!"
      />
    </div>
  )
}

interface BotCardProps {
  bot: BotData
}

const BotCard = ({ bot }: BotCardProps) => {
  const router = useRouter()
  const [isStartingChat, setIsStartingChat] = useState(false)

  const getGenderIcon = (gender?: string) => {
    switch (gender) {
      case 'male':
        return '♂'
      case 'female':
        return '♀'
      case 'non-binary':
        return '⚧'
      default:
        return '❓'
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Handle picture - it could be a media ID, URL, or Media object
  const getPictureUrl = (picture?: string | number | { id: number; url?: string; filename?: string } | null) => {
    if (!picture) return undefined
    if (typeof picture === 'string') return picture
    if (typeof picture === 'object' && picture.url) return picture.url
    return undefined
  }

  const handleStartChat = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setIsStartingChat(true)
    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botId: bot.id,
        }),
      })

      const data = await response.json() as { message?: string; conversation?: { id: number } }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create conversation')
      }

      router.push(`/chat/${data.conversation!.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start chat')
      setIsStartingChat(false)
    }
  }

  return (
    <Card className="glass-rune hover:shadow-[0_10px_40px_-10px_rgba(212,175,55,0.3)] transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-gold-ancient/30">
              <AvatarImage src={getPictureUrl(bot.picture)} />
              <AvatarFallback className="bg-[#0a140a] text-gold-rich font-display">
                {getInitials(bot.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-parchment font-display text-lg">
                {bot.name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {bot.gender && (
                  <span className="text-xs text-parchment-dim">{getGenderIcon(bot.gender)}</span>
                )}
                <Link
                  href={`/creators/${bot.creator_username}`}
                  className="text-xs text-parchment-dim font-lore hover:text-gold-rich transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  by {bot.creator_display_name}
                </Link>
              </div>
            </div>
          </div>
          {bot.is_public && (
            <Badge
              variant="secondary"
              className="bg-gold-ancient/20 text-gold-rich border-gold-ancient/30"
            >
              Public
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-parchment-dim font-lore text-sm mb-4 line-clamp-3">
          {bot.description || 'No description provided'}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span className="text-magic-glow">♥</span>
              <span className="text-parchment font-lore text-sm">{bot.likes_count || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-magic-teal">★</span>
              <span className="text-parchment font-lore text-sm">{bot.favorites_count || 0}</span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="ornate-border hover:bg-gold-ancient/20 hover:border-gold-rich"
            onClick={handleStartChat}
            disabled={isStartingChat}
          >
            {isStartingChat ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Chat'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export const BotListSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {[...Array(8)].map((_, i) => (
        <Card key={i} className="glass-rune animate-pulse">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-[#0a140a] rounded-full border-2 border-gold-ancient/30" />
                <div className="space-y-2">
                  <div className="h-4 bg-[#0a140a] rounded w-24" />
                  <div className="h-3 bg-[#0a140a] rounded w-16" />
                </div>
              </div>
              <div className="h-6 bg-[#0a140a] rounded w-12" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <div className="h-3 bg-[#0a140a] rounded w-full" />
              <div className="h-3 bg-[#0a140a] rounded w-3/4" />
              <div className="h-3 bg-[#0a140a] rounded w-1/2" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-4 bg-[#0a140a] rounded w-8" />
                <div className="h-4 bg-[#0a140a] rounded w-8" />
              </div>
              <div className="h-8 bg-[#0a140a] rounded w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
