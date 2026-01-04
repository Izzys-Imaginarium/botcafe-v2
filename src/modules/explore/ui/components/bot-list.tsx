'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface BotData {
  id: string | number
  name: string
  description: string
  creator_display_name: string
  likes_count: number
  favorites_count: number
  gender?: string
  picture?: string | number | null
  is_public: boolean
  slug: string
}

interface BotListResponse {
  bots: BotData[]
  totalPages: number
  currentPage: number
  totalDocs: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export const BotList = () => {
  const searchParams = useSearchParams()
  const [bots, setBots] = useState<BotData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const fetchBots = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        params.set('page', currentPage.toString())
        params.set('limit', '12')

        const sort = searchParams.get('sort')
        const search = searchParams.get('search')

        if (sort) params.set('sort', sort)
        if (search) params.set('search', search)

        const response = await fetch(`/api/bots/explore?${params.toString()}`)

        if (!response.ok) {
          throw new Error('Failed to fetch bots')
        }

        const data: BotListResponse = await response.json()
        setBots(data.bots)
        setTotalPages(data.totalPages)
      } catch (err: any) {
        console.error('Error fetching bots:', err)
        setError(err.message || 'Failed to load bots')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBots()
  }, [searchParams, currentPage])

  if (isLoading) {
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="glass-rune border-gold-ancient/30 hover:border-gold-rich"
          >
            Previous
          </Button>
          <span className="text-parchment font-lore">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="glass-rune border-gold-ancient/30 hover:border-gold-rich"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

interface BotCardProps {
  bot: BotData
}

const BotCard = ({ bot }: BotCardProps) => {
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

  // Handle picture - it could be a media ID or URL
  const getPictureUrl = (picture?: string | number | null) => {
    if (!picture) return undefined
    if (typeof picture === 'string') return picture
    // If it's a number (media ID), we'd need to fetch the media URL
    // For now, return undefined and show initials
    return undefined
  }

  return (
    <Link href={`/bot/${bot.slug}`}>
      <Card className="glass-rune hover:scale-105 hover:shadow-[0_10px_40px_-10px_rgba(212,175,55,0.3)] transition-all duration-300 group cursor-pointer">
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
                <CardTitle className="text-parchment font-display text-lg group-hover:text-gold-rich transition-all">
                  {bot.name}
                </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {bot.gender && (
                  <span className="text-xs text-parchment-dim">{getGenderIcon(bot.gender)}</span>
                )}
                <span className="text-xs text-parchment-dim font-lore">
                  by {bot.creator_display_name}
                </span>
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
          >
            Chat
          </Button>
        </div>
      </CardContent>
    </Card>
    </Link>
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
