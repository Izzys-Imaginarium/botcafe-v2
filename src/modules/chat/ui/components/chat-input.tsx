'use client'

/**
 * ChatInput Component
 *
 * Message input with send button and optional controls.
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Square, Loader2 } from 'lucide-react'

export interface ChatInputProps {
  onSend: (content: string) => void
  onStop?: () => void
  isLoading?: boolean
  isStreaming?: boolean
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function ChatInput({
  onSend,
  onStop,
  isLoading = false,
  isStreaming = false,
  disabled = false,
  placeholder = 'Type a message...',
  className,
}: ChatInputProps) {
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [content])

  const handleSend = useCallback(() => {
    const trimmed = content.trim()
    if (trimmed && !isLoading && !disabled) {
      onSend(trimmed)
      setContent('')
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }, [content, isLoading, disabled, onSend])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  return (
    <div className={cn('flex gap-2 items-end p-4 border-t border-border/50', className)}>
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || isLoading}
        className={cn(
          'min-h-[44px] max-h-[200px] resize-none py-3',
          'bg-background/50 border-border/50',
          'focus:border-primary/50 focus:ring-primary/20',
        )}
        rows={1}
      />

      {isStreaming ? (
        <Button
          onClick={onStop}
          variant="destructive"
          size="icon"
          className="shrink-0 h-11 w-11"
        >
          <Square className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          onClick={handleSend}
          disabled={!content.trim() || isLoading || disabled}
          size="icon"
          className="shrink-0 h-11 w-11"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  )
}
