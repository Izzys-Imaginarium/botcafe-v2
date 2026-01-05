'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Bot,
  MessageSquare,
  Star,
  Heart,
  ExternalLink,
  Play,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'

interface BotData {
  id: string
  name: string
  description?: string
  avatar?: {
    url: string
  }
  tags?: Array<{ tag: string }>
  stats?: {
    conversation_count?: number
    rating?: number
    likes?: number
  }
  is_featured?: boolean
  is_public?: boolean
}

interface BotShowcaseGalleryProps {
  bots: BotData[]
  title?: string
  showViewAll?: boolean
  viewAllHref?: string
  maxDisplay?: number
  layout?: 'grid' | 'carousel'
  emptyMessage?: string
}

export const BotShowcaseGallery = ({
  bots,
  title = 'Bot Showcase',
  showViewAll = false,
  viewAllHref = '/bots',
  maxDisplay = 6,
  layout = 'grid',
  emptyMessage = 'No bots to display',
}: BotShowcaseGalleryProps) => {
  const [selectedBot, setSelectedBot] = useState<BotData | null>(null)

  const displayBots = bots.slice(0, maxDisplay)

  if (displayBots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{emptyMessage}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              {title}
            </CardTitle>
            {showViewAll && bots.length > maxDisplay && (
              <Link href={viewAllHref}>
                <Button variant="outline" size="sm">
                  View All ({bots.length})
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={
              layout === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 snap-x snap-mandatory'
            }
          >
            {displayBots.map((bot) => (
              <Card
                key={bot.id}
                className={`overflow-hidden hover:border-purple-500/50 transition-colors cursor-pointer ${
                  layout === 'carousel' ? 'flex-shrink-0 w-72 snap-center' : ''
                }`}
                onClick={() => setSelectedBot(bot)}
              >
                {/* Featured Badge */}
                {bot.is_featured && (
                  <div className="absolute top-2 right-2 z-10">
                    <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500">
                      <Star className="mr-1 h-3 w-3 fill-current" />
                      Featured
                    </Badge>
                  </div>
                )}

                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar className="h-12 w-12 border-2 border-purple-500/20">
                      <AvatarImage src={bot.avatar?.url} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                        {bot.name?.charAt(0) || 'B'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{bot.name || 'Unnamed Bot'}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {bot.description || 'No description'}
                      </p>
                    </div>
                  </div>

                  {/* Tags */}
                  {bot.tags && bot.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {bot.tags.slice(0, 3).map((t, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {t.tag}
                        </Badge>
                      ))}
                      {bot.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{bot.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>{bot.stats?.conversation_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        <span>{bot.stats?.likes || 0}</span>
                      </div>
                    </div>
                    {bot.stats?.rating !== undefined && bot.stats.rating > 0 && (
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span>{bot.stats.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bot Detail Dialog */}
      <Dialog open={!!selectedBot} onOpenChange={() => setSelectedBot(null)}>
        <DialogContent className="sm:max-w-lg">
          {selectedBot && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-purple-500/20">
                    <AvatarImage src={selectedBot.avatar?.url} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xl">
                      {selectedBot.name?.charAt(0) || 'B'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-xl">{selectedBot.name}</DialogTitle>
                    <DialogDescription className="flex items-center gap-2">
                      {selectedBot.is_featured && (
                        <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500">
                          <Star className="mr-1 h-3 w-3 fill-current" />
                          Featured
                        </Badge>
                      )}
                      {selectedBot.is_public && (
                        <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                          Public
                        </Badge>
                      )}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <p className="text-sm">{selectedBot.description || 'No description available'}</p>

                {/* Tags */}
                {selectedBot.tags && selectedBot.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedBot.tags.map((t, idx) => (
                      <Badge key={idx} variant="outline">
                        {t.tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <div className="flex items-center justify-center text-blue-400 mb-1">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <p className="font-semibold">{selectedBot.stats?.conversation_count || 0}</p>
                    <p className="text-xs text-muted-foreground">Conversations</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center text-pink-400 mb-1">
                      <Heart className="h-5 w-5" />
                    </div>
                    <p className="font-semibold">{selectedBot.stats?.likes || 0}</p>
                    <p className="text-xs text-muted-foreground">Likes</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center text-yellow-400 mb-1">
                      <Star className="h-5 w-5 fill-current" />
                    </div>
                    <p className="font-semibold">{selectedBot.stats?.rating?.toFixed(1) || '-'}</p>
                    <p className="text-xs text-muted-foreground">Rating</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link href={`/chat/${selectedBot.id}`} className="flex-1">
                    <Button className="w-full">
                      <Play className="mr-2 h-4 w-4" />
                      Start Chat
                    </Button>
                  </Link>
                  <Link href={`/bots/${selectedBot.id}`}>
                    <Button variant="outline">
                      <Sparkles className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
