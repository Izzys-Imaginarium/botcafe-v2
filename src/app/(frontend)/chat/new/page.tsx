'use client'

/**
 * New Chat Page
 *
 * Select a bot to start a new conversation.
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import { Bot, Search, ChevronLeft, Loader2, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export const dynamic = 'force-dynamic'

interface BotOption {
  id: number
  name: string
  description?: string
  avatar?: { url: string }
  creator_username?: string
}

export default function NewChatPage() {
  const router = useRouter()
  const [bots, setBots] = useState<BotOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedBotId, setSelectedBotId] = useState<number | null>(null)

  // Fetch available bots
  useEffect(() => {
    const fetchBots = async () => {
      try {
        // Fetch user's own bots and public bots
        const response = await fetch('/api/bots/explore?limit=50')
        const data = await response.json() as { bots?: BotOption[] }

        if (response.ok) {
          setBots(data.bots || [])
        }
      } catch (error) {
        console.error('Failed to fetch bots:', error)
        toast.error('Failed to load bots')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBots()
  }, [])

  // Filter bots by search
  const filteredBots = bots.filter((bot) =>
    bot.name.toLowerCase().includes(search.toLowerCase()) ||
    bot.description?.toLowerCase().includes(search.toLowerCase())
  )

  // Start conversation with selected bot
  const handleStartChat = async () => {
    if (!selectedBotId) return

    setIsCreating(true)
    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botId: selectedBotId,
        }),
      })

      const data = await response.json() as { message?: string; conversation?: { id: number } }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create conversation')
      }

      // Redirect to the new conversation
      router.push(`/chat/${data.conversation!.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start chat')
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/chat">
                <ChevronLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold">Start New Chat</h1>
              <p className="text-sm text-muted-foreground">
                Choose a bot to chat with
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bots..."
              className="pl-10"
            />
          </div>

          {/* Bot list */}
          <ScrollArea className="h-[60vh]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredBots.length === 0 ? (
              <div className="text-center py-12">
                <Bot className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No bots found</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  {search ? 'Try a different search' : 'Create a bot to get started'}
                </p>
                <Button asChild className="mt-4">
                  <Link href="/create">Create Bot</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredBots.map((bot) => (
                  <Card
                    key={bot.id}
                    className={cn(
                      'cursor-pointer transition-colors',
                      selectedBotId === bot.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    )}
                    onClick={() => setSelectedBotId(bot.id)}
                  >
                    <CardContent className="flex items-center gap-4 p-4">
                      <Avatar className="h-12 w-12 border border-border/50">
                        <AvatarImage src={bot.avatar?.url} alt={bot.name} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <Bot className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{bot.name}</h3>
                        {bot.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {bot.description}
                          </p>
                        )}
                        {bot.creator_username && (
                          <p className="text-xs text-muted-foreground/70">
                            by @{bot.creator_username}
                          </p>
                        )}
                      </div>
                      {selectedBotId === bot.id && (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Start button */}
          <div className="sticky bottom-0 bg-background pt-4 mt-4 border-t border-border/50">
            <Button
              onClick={handleStartChat}
              disabled={!selectedBotId || isCreating}
              className="w-full gap-2"
              size="lg"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageSquare className="h-4 w-4" />
              )}
              Start Chat
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
