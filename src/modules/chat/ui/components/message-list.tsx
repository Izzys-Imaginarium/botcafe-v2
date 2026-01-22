'use client'

/**
 * MessageList Component
 *
 * Scrollable container for chat messages with auto-scroll.
 */

import { useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { ChatMessage, type ChatMessageProps } from './chat-message'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { ChevronUp, Loader2 } from 'lucide-react'

export interface Message extends Omit<ChatMessageProps, 'className'> {
  id: number
}

export interface MessageListProps {
  messages: Message[]
  isLoading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  userName?: string
  userAvatar?: string
  className?: string
}

export function MessageList({
  messages,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  userName,
  userAvatar,
  className,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const isNearBottomRef = useRef(true)

  // Check if user is near the bottom
  const checkIfNearBottom = useCallback(() => {
    const container = scrollRef.current
    if (container) {
      const threshold = 100
      const isNear =
        container.scrollHeight - container.scrollTop - container.clientHeight < threshold
      isNearBottomRef.current = isNear
    }
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isNearBottomRef.current && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Handle scroll events
  const handleScroll = useCallback(() => {
    checkIfNearBottom()
  }, [checkIfNearBottom])

  // Scroll to bottom on initial load
  useEffect(() => {
    if (messages.length > 0 && bottomRef.current) {
      bottomRef.current.scrollIntoView()
    }
  }, [messages.length > 0])

  return (
    <ScrollArea
      className={cn('flex-1 h-full', className)}
    >
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex flex-col px-4 py-6"
      >
        {/* Load more button */}
        {hasMore && (
          <div className="flex justify-center py-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onLoadMore}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
              Load earlier messages
            </Button>
          </div>
        )}

        {/* Loading state */}
        {isLoading && messages.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground">
              No messages yet. Start the conversation!
            </p>
          </div>
        )}

        {/* Messages with spacing */}
        <div className="space-y-6">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              content={message.content}
              isAI={message.isAI}
              isStreaming={message.isStreaming}
              botName={message.botName}
              botAvatar={message.botAvatar}
              userName={userName}
              userAvatar={userAvatar}
              timestamp={message.timestamp}
              model={message.model}
              tokens={message.tokens}
            />
          ))}
        </div>

        {/* Scroll anchor */}
        <div ref={bottomRef} className="h-4" />
      </div>
    </ScrollArea>
  )
}
