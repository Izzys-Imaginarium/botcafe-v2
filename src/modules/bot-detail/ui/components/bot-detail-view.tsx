'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageSquare, Heart, Star, Edit, User, Calendar, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface BotDetailViewProps {
  slug: string
}

interface BotData {
  id: string | number
  name: string
  description: string
  creator_display_name: string
  system_prompt: string
  greeting?: string
  gender?: string
  age?: number
  likes_count: number
  favorites_count: number
  picture?: string | number | null
  is_public: boolean
  created_date: string
  user: string | number | { id: string | number; email: string }
  slug: string
  speech_examples?: Array<{ example: string }>
  knowledge_collections?: Array<string | number>
}

export function BotDetailView({ slug }: BotDetailViewProps) {
  const router = useRouter()
  const { user: clerkUser } = useUser()
  const [bot, setBot] = useState<BotData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    const fetchBot = async () => {
      try {
        const response = await fetch(`/api/bots/${slug}`)

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Bot not found')
          }
          throw new Error('Failed to fetch bot')
        }

        const data = (await response.json()) as BotData
        setBot(data)

        // Check if current user is the bot owner
        if (clerkUser) {
          const botUserId = typeof data.user === 'object' ? data.user.id : data.user
          // We'll need to compare with Payload user ID
          // For now, we'll implement a simpler check via API
        }
      } catch (err: any) {
        console.error('Error fetching bot:', err)
        setError(err.message || 'Failed to load bot')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBot()
  }, [slug, clerkUser])

  const handleStartChat = () => {
    toast.info('Chat functionality coming soon!')
    // router.push(`/chat/new?bot=${bot?.id}`)
  }

  const handleEdit = () => {
    router.push(`/bot/${slug}/edit`)
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
        return null
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

  const getPictureUrl = (picture?: string | number | null) => {
    if (!picture) return undefined
    if (typeof picture === 'string') return picture
    return undefined
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-24">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-forest"></div>
      </div>
    )
  }

  if (error || !bot) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-24">
        <Card className="glass-rune max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-parchment-dim font-lore text-lg mb-4">
              {error || 'Bot not found'}
            </p>
            <Button
              onClick={() => router.push('/explore')}
              className="bg-forest hover:bg-forest/90 text-white"
            >
              Back to Explore
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            {/* Avatar */}
            <Avatar className="h-32 w-32 border-4 border-gold-ancient/30">
              <AvatarImage src={getPictureUrl(bot.picture)} />
              <AvatarFallback className="bg-[#0a140a] text-gold-rich font-display text-3xl">
                {getInitials(bot.name)}
              </AvatarFallback>
            </Avatar>

            {/* Bot Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h1 className="text-4xl font-bold text-gold-rich font-display mb-2">
                    {bot.name}
                    {bot.gender && (
                      <span className="ml-2 text-2xl text-parchment-dim">
                        {getGenderIcon(bot.gender)}
                      </span>
                    )}
                  </h1>
                  <p className="text-parchment-dim font-lore">
                    Created by <span className="text-gold-rich">{bot.creator_display_name}</span>
                  </p>
                </div>

                {bot.is_public && (
                  <Badge variant="secondary" className="bg-gold-ancient/20 text-gold-rich border-gold-ancient/30">
                    Public
                  </Badge>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-magic-glow" />
                  <span className="text-parchment font-lore">{bot.likes_count || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-magic-teal" />
                  <span className="text-parchment font-lore">{bot.favorites_count || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-parchment-dim" />
                  <span className="text-parchment-dim font-lore text-sm">
                    {new Date(bot.created_date).toLocaleDateString()}
                  </span>
                </div>
                {bot.age && (
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-parchment-dim" />
                    <span className="text-parchment-dim font-lore text-sm">
                      Age {bot.age}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleStartChat}
                  className="bg-forest hover:bg-forest/90 text-white"
                  size="lg"
                >
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Start Chat
                </Button>

                {isOwner && (
                  <Button
                    onClick={handleEdit}
                    variant="outline"
                    className="ornate-border"
                    size="lg"
                  >
                    <Edit className="mr-2 h-5 w-5" />
                    Edit Bot
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Description Section */}
        {bot.description && (
          <Card className="glass-rune mb-6">
            <CardHeader>
              <CardTitle className="text-gold-rich font-display">About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-parchment font-lore text-lg leading-relaxed">
                {bot.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Greeting Section */}
        {bot.greeting && (
          <Card className="glass-rune mb-6">
            <CardHeader>
              <CardTitle className="text-gold-rich font-display">Greeting</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-parchment font-lore italic">
                "{bot.greeting}"
              </p>
            </CardContent>
          </Card>
        )}

        {/* Speech Examples */}
        {bot.speech_examples && bot.speech_examples.length > 0 && (
          <Card className="glass-rune mb-6">
            <CardHeader>
              <CardTitle className="text-gold-rich font-display">Speech Examples</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bot.speech_examples.map((item, index) => (
                  <div
                    key={index}
                    className="p-3 bg-[#0a140a]/50 rounded-lg border border-gold-ancient/20"
                  >
                    <p className="text-parchment font-lore italic">"{item.example}"</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Knowledge Collections */}
        {bot.knowledge_collections && bot.knowledge_collections.length > 0 && (
          <Card className="glass-rune">
            <CardHeader>
              <CardTitle className="text-gold-rich font-display flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Knowledge Collections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-parchment-dim font-lore">
                This bot has access to {bot.knowledge_collections.length} knowledge{' '}
                {bot.knowledge_collections.length === 1 ? 'collection' : 'collections'}.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
