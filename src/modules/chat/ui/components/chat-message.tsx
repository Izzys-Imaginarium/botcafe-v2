'use client'

/**
 * ChatMessage Component
 *
 * Renders a single message in the chat, handling both user and bot messages.
 * Supports Discord-style markdown formatting and collapsible reasoning display.
 */

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Loader2, Bot, User, RefreshCw, AlertCircle, Brain, ChevronRight } from 'lucide-react'
import { DiscordMarkdown } from './discord-markdown'

export interface ChatMessageProps {
  content: string
  reasoning?: string
  isAI: boolean
  isStreaming?: boolean
  isReasoningStreaming?: boolean
  botName?: string
  botAvatar?: string
  userName?: string
  userAvatar?: string
  timestamp?: string
  model?: string
  tokens?: {
    input: number
    output: number
    total: number
  }
  className?: string
  // Retry/regenerate support
  messageId?: number
  status?: string
  onRegenerate?: (messageId: number) => void
  canRegenerate?: boolean
}

export function ChatMessage({
  content,
  reasoning,
  isAI,
  isStreaming = false,
  isReasoningStreaming = false,
  botName,
  botAvatar,
  userName,
  userAvatar,
  timestamp,
  model,
  tokens,
  className,
  messageId,
  status,
  onRegenerate,
  canRegenerate = true,
}: ChatMessageProps) {
  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  const isFailed = status === 'failed'
  const showRegenerateButton = isAI && !isStreaming && onRegenerate && messageId && canRegenerate

  // Auto-expand reasoning while it's actively streaming, collapse when content starts
  const [isReasoningOpen, setIsReasoningOpen] = useState(false)
  useEffect(() => {
    if (isReasoningStreaming) {
      setIsReasoningOpen(true)
    } else if (isStreaming && content) {
      // Content has started arriving, collapse reasoning
      setIsReasoningOpen(false)
    }
  }, [isReasoningStreaming, isStreaming, content])

  return (
    <div
      className={cn(
        'group flex gap-3 p-4 relative',
        isAI ? 'bg-background/30' : 'bg-transparent',
        isFailed && 'border-l-2 border-destructive/50',
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
          <>
            <AvatarImage src={userAvatar} alt={userName || 'You'} />
            <AvatarFallback className="bg-secondary/10 text-secondary-foreground">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </>
        )}
      </Avatar>

      {/* Content */}
      <div className="flex-1 space-y-1 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-foreground">
            {isAI ? botName || 'Assistant' : userName || 'You'}
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

        {/* Collapsible reasoning/thinking box */}
        {reasoning && (
          <Collapsible open={isReasoningOpen} onOpenChange={setIsReasoningOpen}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-1 transition-colors">
                <Brain className="h-3 w-3" />
                <span>Thinking{isReasoningStreaming ? '...' : ''}</span>
                <ChevronRight className={cn('h-3 w-3 transition-transform duration-200', isReasoningOpen && 'rotate-90')} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mb-3 p-3 rounded-md bg-muted/30 border border-border/50 text-xs text-muted-foreground leading-relaxed max-h-96 overflow-y-auto">
                <DiscordMarkdown content={reasoning} />
                {isReasoningStreaming && (
                  <span className="inline-block w-1.5 h-3 bg-muted-foreground/50 ml-0.5 animate-pulse" />
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

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
                {reasoning ? 'Thinking...' : 'Generating...'}
              </span>
            )
          )}
        </div>

        {/* Token info and actions row */}
        {isAI && !isStreaming && (
          <div className="flex items-center gap-2 mt-2">
            {/* Token count */}
            {tokens && (
              <span className="text-xs text-muted-foreground">
                {tokens.total.toLocaleString()} tokens
              </span>
            )}

            {/* Failed indicator */}
            {isFailed && (
              <span className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Failed
              </span>
            )}

            {/* Regenerate/Retry button - visible on hover or always for failed */}
            {showRegenerateButton && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        'h-6 w-6 transition-opacity',
                        isFailed
                          ? 'opacity-100'
                          : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'
                      )}
                      onClick={() => onRegenerate(messageId)}
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isFailed ? 'Retry' : 'Regenerate response'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
