'use client'

/**
 * ChatMessage Component
 *
 * Renders a single message in the chat, handling both user and bot messages.
 * Supports Discord-style markdown formatting.
 */

import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, Bot, User } from 'lucide-react'
import { DiscordMarkdown } from './discord-markdown'

export interface ChatMessageProps {
  content: string
  isAI: boolean
  isStreaming?: boolean
  botName?: string
  botAvatar?: string
  timestamp?: string
  model?: string
  tokens?: {
    input: number
    output: number
    total: number
  }
  className?: string
}

export function ChatMessage({
  content,
  isAI,
  isStreaming = false,
  botName,
  botAvatar,
  timestamp,
  model,
  tokens,
  className,
}: ChatMessageProps) {
  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <div
      className={cn(
        'flex gap-3 p-4',
        isAI ? 'bg-background/30' : 'bg-transparent',
        className
      )}
    >
      {/* Avatar */}
      <Avatar className="h-8 w-8 shrink-0 border border-border/50">
        {isAI ? (
          <>
            <AvatarImage src={botAvatar} alt={botName || 'Bot'} />
            <AvatarFallback className="bg-primary/10 text-primary">
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </>
        ) : (
          <AvatarFallback className="bg-secondary/10 text-secondary-foreground">
            <User className="h-4 w-4" />
          </AvatarFallback>
        )}
      </Avatar>

      {/* Content */}
      <div className="flex-1 space-y-1 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-foreground">
            {isAI ? botName || 'Assistant' : 'You'}
          </span>
          {formattedTime && (
            <span className="text-muted-foreground text-xs">{formattedTime}</span>
          )}
          {isAI && model && (
            <span className="text-muted-foreground text-xs px-1.5 py-0.5 bg-muted/50 rounded">
              {model}
            </span>
          )}
        </div>

        {/* Message content with Discord-style markdown */}
        <div className="text-foreground/90 break-words">
          {content ? (
            <>
              <DiscordMarkdown content={content} />
              {isStreaming && (
                <span className="inline-block w-1.5 h-4 bg-primary/50 ml-0.5 animate-pulse" />
              )}
            </>
          ) : (
            isStreaming && (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Thinking...
              </span>
            )
          )}
        </div>

        {/* Token info (for AI messages) */}
        {isAI && tokens && !isStreaming && (
          <div className="text-xs text-muted-foreground mt-2">
            {tokens.total.toLocaleString()} tokens
          </div>
        )}
      </div>
    </div>
  )
}
