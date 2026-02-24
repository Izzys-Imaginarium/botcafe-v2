'use client'

/**
 * MessageList Component
 *
 * Scrollable container for chat messages with auto-scroll.
 */

import { useRef, useEffect, useLayoutEffect, useCallback } from 'react'
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

  // Single scroll effect — handles initial load, new messages, history, and streaming.
  // useLayoutEffect runs synchronously after DOM mutation but before paint,
  // so the user never sees a frame at the wrong scroll position.
  useLayoutEffect(() => {
    const container = scrollRef.current
    if (!container) return

    const prevCount = prevMessageCountRef.current
    const currentCount = messages.length
    const prevHeight = prevScrollHeightRef.current
    const currentHeight = container.scrollHeight

    if (prevCount === 0 && currentCount > 0) {
      // Initial load — jump to bottom
      container.scrollTop = currentHeight - container.clientHeight
    } else if (currentCount > prevCount + 2) {
      // Bulk insert (loading older history) — keep user at same visual position
      container.scrollTop += currentHeight - prevHeight
    } else if (isNearBottomRef.current) {
      // New messages or streaming content growth — stay pinned to bottom
      container.scrollTop = currentHeight - container.clientHeight
    }

    prevMessageCountRef.current = currentCount
    prevScrollHeightRef.current = currentHeight
  }, [messages])

  // Track whether the user has scrolled away from the bottom
  const handleScroll = useCallback(() => {
    const container = scrollRef.current
    if (!container) return
    const threshold = 100
    isNearBottomRef.current =
      container.scrollHeight - container.scrollTop - container.clientHeight < threshold
  }, [])

  // Mobile keyboard resize — stay at bottom if we were there
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return

    const handleResize = () => {
      if (isNearBottomRef.current && scrollRef.current) {
        const container = scrollRef.current
        container.scrollTop = container.scrollHeight - container.clientHeight
      }
    }

    viewport.addEventListener('resize', handleResize)
    return () => viewport.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className={cn('overflow-y-auto overflow-x-hidden', className)}
      style={{ overflowAnchor: 'none' }}
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
