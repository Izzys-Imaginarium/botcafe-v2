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
    <div className={cn(
      'flex gap-3 items-end px-6 py-5 border-t border-border/20 shrink-0',
      'bg-background/60 backdrop-blur-md',
      className
    )}>
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || isLoading}
        className={cn(
          'min-h-12 max-h-50 resize-none py-3 px-4',
          'bg-background/50 border-border/30 rounded-xl',
          'focus:border-primary/50 focus:ring-primary/20',
        )}
        rows={1}
      />

      {isStreaming ? (
        <Button
          onClick={onStop}
          variant="destructive"
          size="icon"
          className="shrink-0 h-12 w-12 rounded-xl"
        >
          <Square className="h-5 w-5" />
        </Button>
      ) : (
        <Button
          onClick={handleSend}
          disabled={!content.trim() || isLoading || disabled}
          size="icon"
          className="shrink-0 h-12 w-12 rounded-xl"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      )}
    </div>
  )
}
