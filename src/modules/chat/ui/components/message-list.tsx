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
  // Prevents onScroll from mis-detecting "not near bottom" during programmatic scrolls
  const isProgrammaticScrollRef = useRef(false)
  // Throttle streaming scroll updates to one per animation frame
  const rafIdRef = useRef<number | null>(null)

  // Check if user is near the bottom — skipped during programmatic scrolls
  const checkIfNearBottom = useCallback(() => {
    if (isProgrammaticScrollRef.current) return
    const container = scrollRef.current
    if (container) {
      const threshold = 100
      const isNear =
        container.scrollHeight - container.scrollTop - container.clientHeight < threshold
      isNearBottomRef.current = isNear
    }
  }, [])

  // Check if any message is currently streaming
  const hasStreamingMessage = messages.some(m => m.isStreaming)

  // Helper: instantly scroll to bottom without triggering isNearBottom = false
  const scrollToBottom = useCallback(() => {
    const container = scrollRef.current
    if (!container) return
    isProgrammaticScrollRef.current = true
    container.scrollTop = container.scrollHeight - container.clientHeight
    // Reset flag after the browser has processed the scroll event
    requestAnimationFrame(() => {
      isProgrammaticScrollRef.current = false
    })
  }, [])

  // Handle structural changes (new messages added, history loaded).
  // useLayoutEffect runs synchronously after DOM mutation but before paint,
  // so the user never sees the old scroll position flash.
  useLayoutEffect(() => {
    const container = scrollRef.current
    if (!container) return

    const prevCount = prevMessageCountRef.current
    const currentCount = messages.length

    if (currentCount > prevCount && prevCount > 0) {
      if (currentCount - prevCount <= 2 && isNearBottomRef.current) {
        // New message(s) near bottom — scroll instantly.
        // Using instant (not smooth) avoids a long-running animation that
        // conflicts with the streaming scroll updates that follow.
        scrollToBottom()
      } else if (currentCount - prevCount > 2) {
        // Many messages added at once — likely loading older history.
        // Preserve scroll position so user stays at the same visible message.
        isProgrammaticScrollRef.current = true
        const newScrollHeight = container.scrollHeight
        const addedHeight = newScrollHeight - prevScrollHeightRef.current
        container.scrollTop += addedHeight
        requestAnimationFrame(() => {
          isProgrammaticScrollRef.current = false
        })
      }
    }

    prevMessageCountRef.current = currentCount
    prevScrollHeightRef.current = container.scrollHeight
  }, [messages.length, scrollToBottom])

  // Streaming content scroll — keep pinned to bottom as content grows.
  // Throttled to one update per animation frame to prevent scroll thrashing.
  useEffect(() => {
    if (!hasStreamingMessage || !isNearBottomRef.current) return

    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
    }

    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null
      if (isNearBottomRef.current) {
        scrollToBottom()
      }
    })

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
    }
  }, [messages, hasStreamingMessage, scrollToBottom])

  // Handle scroll events
  const handleScroll = useCallback(() => {
    checkIfNearBottom()
  }, [checkIfNearBottom])

  // Handle mobile keyboard / visual viewport resize —
  // when the keyboard opens or closes the viewport height changes,
  // which shifts visible content. Re-scroll to bottom if we were near it.
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return

    const handleResize = () => {
      if (isNearBottomRef.current && bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: 'instant' })
      }
    }

    viewport.addEventListener('resize', handleResize)
    return () => viewport.removeEventListener('resize', handleResize)
  }, [])

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
