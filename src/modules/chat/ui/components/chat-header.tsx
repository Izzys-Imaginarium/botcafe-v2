'use client'

/**
 * ChatHeader Component
 *
 * Header bar for the chat view showing bot info and controls.
 */

import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Bot,
  ChevronLeft,
  MoreVertical,
  Archive,
  Trash2,
  Users,
  UserPlus,
  Eraser,
  Download,
  Pencil,
} from 'lucide-react'
import Link from 'next/link'

export interface ChatHeaderProps {
  title?: string | null
  botName?: string
  botAvatar?: string
  botCount?: number
  conversationType?: string
  totalTokens?: number
  onOpenBotSidebar?: () => void
  onAddBot?: () => void
  onRename?: () => void
  onArchive?: () => void
  onDelete?: () => void
  onClearHistory?: () => void
  onExport?: () => void
  isArchived?: boolean
  className?: string
}

export function ChatHeader({
  title,
  botName,
  botAvatar,
  botCount = 1,
  conversationType = 'single-bot',
  totalTokens,
  onOpenBotSidebar,
  onAddBot,
  onRename,
  onArchive,
  onDelete,
  onClearHistory,
  onExport,
  isArchived,
  className,
}: ChatHeaderProps) {
  const isMultiBot = conversationType !== 'single-bot' || botCount > 1

  return (
    <div
      className={cn(
        'flex items-center gap-5 px-6 py-5 border-b border-border/20 shrink-0',
        'bg-background/60 backdrop-blur-md',
        className
      )}
    >
      {/* Back button */}
      <Link href="/chat">
        <Button variant="ghost" size="icon" className="shrink-0 hover:bg-primary/10">
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </Link>

      {/* Bot avatar */}
      <Avatar className="h-12 w-12 border-2 border-primary/20 shadow-md">
        <AvatarImage src={botAvatar} alt={botName || 'Bot'} />
        <AvatarFallback className="bg-primary/10 text-primary">
          <Bot className="h-6 w-6" />
        </AvatarFallback>
      </Avatar>

      {/* Bot info */}
      <div className="flex-1 min-w-0">
        <h2 className="font-semibold text-lg text-foreground truncate">
          {title || botName || 'Chat'}
        </h2>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {title && botName && (
            <span className="truncate">with {botName}</span>
          )}
          {isMultiBot && (
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {botCount} bots
            </span>
          )}
          {totalTokens !== undefined && totalTokens > 0 && (
            <span>{totalTokens.toLocaleString()} tokens</span>
          )}
        </div>
      </div>

      {/* Multi-bot sidebar toggle */}
      {isMultiBot && onOpenBotSidebar && (
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenBotSidebar}
          className="gap-2"
        >
          <Users className="h-4 w-4" />
          Bots
        </Button>
      )}

      {/* More menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="shrink-0">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {onRename && (
            <DropdownMenuItem onClick={onRename}>
              <Pencil className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
          )}
          {/* Add Bot - only for single-bot chats */}
          {!isMultiBot && onAddBot && (
            <DropdownMenuItem onClick={onAddBot}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Bot
            </DropdownMenuItem>
          )}
          {onExport && (
            <DropdownMenuItem onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Chat
            </DropdownMenuItem>
          )}
          {onClearHistory && (
            <DropdownMenuItem onClick={onClearHistory}>
              <Eraser className="h-4 w-4 mr-2" />
              Clear History
            </DropdownMenuItem>
          )}
          {onArchive && (
            <DropdownMenuItem onClick={onArchive}>
              <Archive className="h-4 w-4 mr-2" />
              {isArchived ? 'Unarchive' : 'Archive'}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {onDelete && (
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
