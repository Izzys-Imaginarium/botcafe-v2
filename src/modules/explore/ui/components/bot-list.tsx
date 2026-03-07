'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, Heart, Star, Link2, Copy, Check, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@clerk/nextjs'
import { useInfiniteList } from '@/hooks/use-infinite-list'
import { InfiniteScrollTrigger } from '@/components/ui/infinite-scroll-trigger'
import { type ExploreTheme, mainTheme } from '../../explore-theme'

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
  backrooms_classifications?: Array<{ classification: string }>
}

interface BotListProps {
  theme?: ExploreTheme
}

export const BotList = ({ theme = mainTheme }: BotListProps) => {
  const searchParams = useSearchParams()
  const t = theme

  // Build initial params from URL
  const getInitialParams = useCallback(() => {
    const params: Record<string, string> = { venue: t.venue }
    const sort = searchParams.get('sort')
    const search = searchParams.get('search')
    const classifications = searchParams.get(t.classificationParam)
    const excludeOwn = searchParams.get('excludeOwn')
    const liked = searchParams.get('liked')
    const favorited = searchParams.get('favorited')
    params.sort = sort || 'random'
    if (search) params.search = search
    if (classifications) params[t.classificationParam] = classifications
    if (excludeOwn) params.excludeOwn = excludeOwn
    if (liked) params.liked = liked
    if (favorited) params.favorited = favorited
    return params
  }, [searchParams, t.venue, t.classificationParam])

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
    return <BotListSkeleton theme={t} />
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className={`${t.classes.textDim} font-lore`}>{error}</p>
        <Button
          onClick={() => window.location.reload()}
          className={`mt-4 ${t.classes.retryButtonBg}`}
        >
          Try Again
        </Button>
      </div>
    )
  }

  if (bots.length === 0) {
    return (
      <div className="text-center py-12">
        <p className={`${t.classes.textDim} font-lore text-lg`}>{t.strings.emptyTitle}</p>
        <p className={`${t.classes.textDim} font-lore text-sm mt-2`}>
          {t.strings.emptySubtitle}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {bots.map((bot) => (
          <BotCard key={bot.id} bot={bot} theme={t} />
        ))}
      </div>

      <InfiniteScrollTrigger
        onLoadMore={loadMore}
        hasMore={hasMore}
        isLoading={isLoadingMore}
        endMessage={t.strings.endMessage}
      />
    </div>
  )
}

interface BotCardProps {
  bot: BotData
  theme?: ExploreTheme
}

export const BotCard = ({ bot, theme = mainTheme }: BotCardProps) => {
  const router = useRouter()
  const { isSignedIn } = useAuth()
  const [isStartingChat, setIsStartingChat] = useState(false)
  const [liked, setLiked] = useState(false)
  const [favorited, setFavorited] = useState(false)
  const [likesCount, setLikesCount] = useState(bot.likes_count || 0)
  const [favoritesCount, setFavoritesCount] = useState(bot.favorites_count || 0)
  const [isLiking, setIsLiking] = useState(false)
  const [isFavoriting, setIsFavoriting] = useState(false)
  const t = theme.classes

  // Fetch user's interaction status
  useEffect(() => {
    const fetchInteractionStatus = async () => {
      if (!isSignedIn) return
      try {
        const response = await fetch(`/api/bots/${bot.id}/status`)
        if (response.ok) {
          const data = (await response.json()) as { liked?: boolean; favorited?: boolean }
          setLiked(data.liked || false)
          setFavorited(data.favorited || false)
        }
      } catch (error) {
        // Silent fail - just show default state
      }
    }
    fetchInteractionStatus()
  }, [bot.id, isSignedIn])

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isSignedIn) {
      router.push('/sign-in')
      return
    }

    setIsLiking(true)
    try {
      const response = await fetch(`/api/bots/${bot.id}/like`, { method: 'POST' })
      if (response.ok) {
        const data = (await response.json()) as { liked: boolean; likesCount: number }
        setLiked(data.liked)
        setLikesCount(data.likesCount)
      }
    } catch (error) {
      toast.error('Failed to update like')
    } finally {
      setIsLiking(false)
    }
  }

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isSignedIn) {
      router.push('/sign-in')
      return
    }

    setIsFavoriting(true)
    try {
      const response = await fetch(`/api/bots/${bot.id}/favorite`, { method: 'POST' })
      if (response.ok) {
        const data = (await response.json()) as { favorited: boolean; favoritesCount: number }
        setFavorited(data.favorited)
        setFavoritesCount(data.favoritesCount)
      }
    } catch (error) {
      toast.error('Failed to update favorite')
    } finally {
      setIsFavoriting(false)
    }
  }

  const [copied, setCopied] = useState(false)
  const botUrl = `/${bot.creator_username}/${bot.slug}`

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${botUrl}`)
      setCopied(true)
      toast.success('Link copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

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
    <Card className={`${t.glassPanel} ${t.cardHoverShadow} transition-all duration-300`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className={`h-12 w-12 border-2 ${t.avatarBorder}`}>
              <AvatarImage src={getPictureUrl(bot.picture)} />
              <AvatarFallback className={`${t.avatarFallbackBg} ${t.avatarFallbackText} font-display`}>
                {getInitials(bot.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className={`${t.text} font-display text-lg`}>
                {bot.name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {bot.gender && (
                  <span className={`text-xs ${t.textDim}`}>{getGenderIcon(bot.gender)}</span>
                )}
                <Link
                  href={`/creators/${bot.creator_username}`}
                  className={`text-xs ${t.textDim} font-lore ${t.accentHover} transition-colors`}
                  onClick={(e) => e.stopPropagation()}
                >
                  by {bot.creator_username || bot.creator_display_name}
                </Link>
              </div>
            </div>
          </div>
          {bot.is_public && (
            <Badge
              variant="secondary"
              className={`${t.badgeBg} ${t.badgeText} ${t.badgeBorder}`}
            >
              Public
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className={`${t.textDim} font-lore text-sm mb-3 line-clamp-3`}>
          {bot.description || 'No description provided'}
        </p>

        {/* Backrooms tags */}
        {bot.backrooms_classifications && bot.backrooms_classifications.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {bot.backrooms_classifications.map((c, i) => (
              <Badge
                key={i}
                variant="secondary"
                className={`${t.badgeBg} ${t.badgeText} ${t.badgeBorder} text-xs`}
              >
                {c.classification}
              </Badge>
            ))}
          </div>
        )}

        {/* Share Link */}
        <div className={`flex items-center gap-2 mb-3 p-2 ${t.linkBg} rounded-md border ${t.linkBorder}`}>
          <Link2 className={`h-3.5 w-3.5 ${t.textDim} flex-shrink-0`} />
          <Link
            href={botUrl}
            className={`text-xs ${t.textDim} font-mono truncate ${t.accentHover} transition-colors flex-1`}
            onClick={(e) => e.stopPropagation()}
          >
            {bot.creator_username}/{bot.slug}
          </Link>
          <button
            onClick={handleCopyLink}
            className={`p-1 ${t.buttonHover} rounded transition-colors flex-shrink-0`}
            title="Copy link"
          >
            {copied ? (
              <Check className={`h-3.5 w-3.5 ${t.copySuccessText}`} />
            ) : (
              <Copy className={`h-3.5 w-3.5 ${t.textDim}`} />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                liked ? t.likeActive : t.likeHover
              }`}
              title={liked ? 'Unlike' : 'Like'}
            >
              <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
              <span className="text-sm font-lore">{likesCount}</span>
            </button>
            <button
              onClick={handleFavorite}
              disabled={isFavoriting}
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                favorited ? t.favoriteActive : t.favoriteHover
              }`}
              title={favorited ? 'Unfavorite' : 'Favorite'}
            >
              <Star className={`h-4 w-4 ${favorited ? 'fill-current' : ''}`} />
              <span className="text-sm font-lore">{favoritesCount}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className={t.buttonBorder}
              asChild
            >
              <Link href={botUrl}>
                <Eye className="mr-1 h-3.5 w-3.5" />
                View
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={t.buttonBorder}
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
        </div>
      </CardContent>
    </Card>
  )
}

interface BotListSkeletonProps {
  theme?: ExploreTheme
}

export const BotListSkeleton = ({ theme = mainTheme }: BotListSkeletonProps) => {
  const t = theme.classes
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {[...Array(8)].map((_, i) => (
        <Card key={i} className={`${t.glassPanel} animate-pulse`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-12 w-12 ${t.skeletonBg} rounded-full border-2 ${t.skeletonBorder}`} />
                <div className="space-y-2">
                  <div className={`h-4 ${t.skeletonBg} rounded w-24`} />
                  <div className={`h-3 ${t.skeletonBg} rounded w-16`} />
                </div>
              </div>
              <div className={`h-6 ${t.skeletonBg} rounded w-12`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <div className={`h-3 ${t.skeletonBg} rounded w-full`} />
              <div className={`h-3 ${t.skeletonBg} rounded w-3/4`} />
              <div className={`h-3 ${t.skeletonBg} rounded w-1/2`} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`h-4 ${t.skeletonBg} rounded w-8`} />
                <div className={`h-4 ${t.skeletonBg} rounded w-8`} />
              </div>
              <div className={`h-8 ${t.skeletonBg} rounded w-16`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
