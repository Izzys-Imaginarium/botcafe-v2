'use client'

/**
 * ChatMessage Component
 *
 * Renders a single message in the chat, handling both user and bot messages.
 * Supports Discord-style markdown formatting, collapsible reasoning display,
 * inline editing for user messages, and message deletion.
 */

import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
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
import { Loader2, Bot, User, RefreshCw, AlertCircle, Brain, ChevronRight, Pencil, Trash2, Check, X } from 'lucide-react'
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
  // Edit support
  isEdited?: boolean
  onEdit?: (messageId: number, newContent: string) => void
  canEdit?: boolean
  // Delete support
  onDelete?: (messageId: number) => void
  canDelete?: boolean
}

export const ChatMessage = memo(function ChatMessage({
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
  isEdited,
  onEdit,
  canEdit = true,
  onDelete,
  canDelete = true,
}: ChatMessageProps) {
  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  const isFailed = status === 'failed'
  const showRegenerateButton = isAI && !isStreaming && onRegenerate && messageId && canRegenerate
  const showEditButton = !isAI && !isStreaming && onEdit && messageId && canEdit
  const showDeleteButton = !isStreaming && onDelete && messageId && canDelete

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const editTextareaRef = useRef<HTMLTextAreaElement>(null)

  const handleStartEdit = useCallback(() => {
    setEditContent(content)
    setIsEditing(true)
  }, [content])

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false)
    setEditContent('')
  }, [])

  const handleSaveEdit = useCallback(() => {
    const trimmed = editContent.trim()
    if (trimmed && trimmed !== content && messageId && onEdit) {
      onEdit(messageId, trimmed)
    }
    setIsEditing(false)
    setEditContent('')
  }, [editContent, content, messageId, onEdit])

  // Auto-focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && editTextareaRef.current) {
      const textarea = editTextareaRef.current
      textarea.focus()
      textarea.setSelectionRange(textarea.value.length, textarea.value.length)
    }
  }, [isEditing])

  // Auto-expand reasoning while it's actively streaming, collapse when content starts
  const [isReasoningOpen, setIsReasoningOpen] = useState(false)
  const hasContent = content.length > 0
  useEffect(() => {
    if (isReasoningStreaming) {
      setIsReasoningOpen(true)
    } else if (isStreaming && hasContent) {
      // Content has started arriving, collapse reasoning
      setIsReasoningOpen(false)
    }
  }, [isReasoningStreaming, isStreaming, hasContent])

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
          {isEdited && !isEditing && (
            <span className="text-muted-foreground text-xs italic">(edited)</span>
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
            <CollapsibleContent forceMount={isStreaming || isReasoningStreaming ? true : undefined}>
              <div
                className={cn(
                  'mb-3 p-3 rounded-md bg-muted/30 border border-border/50 text-xs text-muted-foreground leading-relaxed max-h-96 overflow-y-auto',
                  (isStreaming || isReasoningStreaming) && 'animation-duration-[0s]'
                )}
              >
                <DiscordMarkdown content={reasoning} />
                {isReasoningStreaming && (
                  <span className="inline-block w-1.5 h-3 bg-muted-foreground/50 ml-0.5 animate-pulse" />
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Message content with Discord-style markdown / Edit mode */}
        <div className="text-foreground/90 break-words">
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                ref={editTextareaRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSaveEdit()
                  }
                  if (e.key === 'Escape') {
                    handleCancelEdit()
                  }
                }}
                className="min-h-15 resize-none bg-background/50 border-border/30 rounded-lg"
                rows={3}
              />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleSaveEdit}
                  disabled={!editContent.trim() || editContent.trim() === content}
                  className="h-7 px-3 text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  className="h-7 px-3 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
                <span className="text-xs text-muted-foreground">
                  Esc to cancel, Enter to save
                </span>
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* Actions row */}
        {!isStreaming && !isEditing && (
          <div className="flex items-center gap-2 mt-2">
            {/* Token count - AI only */}
            {isAI && tokens && (
              <span className="text-xs text-muted-foreground">
                {tokens.total.toLocaleString()} tokens
              </span>
            )}

            {/* Failed indicator - AI only */}
            {isAI && isFailed && (
              <span className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Failed
              </span>
            )}

            {/* Regenerate/Retry button - AI only */}
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

            {/* Edit button - user messages only */}
            {showEditButton && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                      onClick={handleStartEdit}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit message</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Delete button - all messages */}
            {showDeleteButton && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-destructive/70 hover:text-destructive"
                      onClick={() => onDelete(messageId)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete message</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}
      </div>
    </div>
  )
})
