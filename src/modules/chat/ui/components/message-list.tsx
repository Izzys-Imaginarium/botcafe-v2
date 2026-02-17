'use client'

/**
 * MessageList Component
 *
 * Scrollable container for chat messages with auto-scroll.
 */

import { useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { ChatMessage, type ChatMessageProps } from './chat-message'
import { Button } from '@/components/ui/button'
import { ChevronUp, Loader2 } from 'lucide-react'

export interface Message extends Omit<ChatMessageProps, 'className'> {
  id: number
}

export interface MessageListProps {
  messages: Message[]
  isLoading?: boolean
  isLoadingMore?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  userName?: string
  userAvatar?: string
  className?: string
  // Regenerate support
  onRegenerateMessage?: (messageId: number) => void
  canRegenerate?: boolean
  // Edit support
  onEditMessage?: (messageId: number, newContent: string) => void
  canEdit?: boolean
  // Delete support
  onDeleteMessage?: (messageId: number) => void
  canDelete?: boolean
}

export function MessageList({
  messages,
  isLoading = false,
  isLoadingMore = false,
  hasMore = false,
  onLoadMore,
  userName,
  userAvatar,
  className,
  onRegenerateMessage,
  canRegenerate = true,
  onEditMessage,
  canEdit = true,
  onDeleteMessage,
  canDelete = true,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const isNearBottomRef = useRef(true)
  const prevMessageCountRef = useRef(0)
  const prevScrollHeightRef = useRef(0)

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

  // Auto-scroll to bottom when new messages arrive (not when loading older)
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    const prevCount = prevMessageCountRef.current
    const currentCount = messages.length

    if (currentCount > prevCount && prevCount > 0) {
      // New messages were added
      if (currentCount - prevCount <= 2 && isNearBottomRef.current) {
        // Small number of new messages (user sent or bot replied) and near bottom — auto-scroll
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      } else if (currentCount - prevCount > 2) {
        // Many messages added at once — likely loading older messages
        // Preserve scroll position so user stays at the same visible message
        const newScrollHeight = container.scrollHeight
        const addedHeight = newScrollHeight - prevScrollHeightRef.current
        container.scrollTop += addedHeight
      }
    }

    prevMessageCountRef.current = currentCount
    prevScrollHeightRef.current = container.scrollHeight
  }, [messages])

  // Handle scroll events
  const handleScroll = useCallback(() => {
    checkIfNearBottom()
  }, [checkIfNearBottom])

  // Scroll to bottom on initial load
  useEffect(() => {
    if (messages.length > 0 && bottomRef.current) {
      bottomRef.current.scrollIntoView()
      // After initial scroll, capture baseline
      if (scrollRef.current) {
        prevMessageCountRef.current = messages.length
        prevScrollHeightRef.current = scrollRef.current.scrollHeight
      }
    }
  }, [messages.length > 0])

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className={cn('overflow-y-auto overflow-x-hidden', className)}
    >
      <div className="flex flex-col px-4 py-6">
        {/* Load more button */}
        {hasMore && (
          <div className="flex justify-center py-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Capture scroll height before loading more
                if (scrollRef.current) {
                  prevScrollHeightRef.current = scrollRef.current.scrollHeight
                }
                onLoadMore?.()
              }}
              disabled={isLoadingMore}
              className="gap-2"
            >
              {isLoadingMore ? (
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
              messageId={message.id}
              content={message.content}
              reasoning={message.reasoning}
              isAI={message.isAI}
              isStreaming={message.isStreaming}
              isReasoningStreaming={message.isReasoningStreaming}
              botName={message.botName}
              botAvatar={message.botAvatar}
              userName={userName}
              userAvatar={userAvatar}
              timestamp={message.timestamp}
              model={message.model}
              tokens={message.tokens}
              status={message.status}
              onRegenerate={onRegenerateMessage}
              canRegenerate={canRegenerate && !message.isStreaming}
              isEdited={message.isEdited}
              onEdit={onEditMessage}
              canEdit={canEdit && !message.isStreaming}
              onDelete={onDeleteMessage}
              canDelete={canDelete && !message.isStreaming}
            />
          ))}
        </div>

        {/* Scroll anchor */}
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  )
}
