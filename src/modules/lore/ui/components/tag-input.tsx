'use client'

import { useState, KeyboardEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  className?: string
  maxTags?: number
}

export const TagInput = ({
  value = [],
  onChange,
  placeholder = 'Type and press Enter',
  className,
  maxTags,
}: TagInputProps) => {
  const [inputValue, setInputValue] = useState('')

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault()

      // Check max tags
      if (maxTags && value.length >= maxTags) {
        return
      }

      // Check for duplicates
      if (!value.includes(inputValue.trim())) {
        onChange([...value, inputValue.trim()])
      }

      setInputValue('')
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      // Remove last tag on backspace if input is empty
      onChange(value.slice(0, -1))
    }
  }

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove))
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Tags Display */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="bg-gold-ancient/20 text-gold-rich border-gold-ancient/30 hover:bg-gold-ancient/30 transition-colors"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1.5 hover:text-gold-rich/70"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Input */}
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={maxTags ? value.length >= maxTags : false}
        className="glass-rune border-gold-ancient/30 text-parchment placeholder:text-parchment/40"
      />

      {/* Helper Text */}
      <p className="text-xs text-parchment/50">
        Press Enter to add tags
        {maxTags && ` (${value.length}/${maxTags})`}
      </p>
    </div>
  )
}
