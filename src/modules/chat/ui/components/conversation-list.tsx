'use client'

/**
 * ConversationList Component
 *
 * List of conversations for the chat sidebar/home.
 */

import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Bot,
  MessageSquare,
  Plus,
  Archive,
  Pin,
  MoreVertical,
  Trash2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'

export interface ConversationItem {
  id: number
  type: 'single-bot' | 'multi-bot' | 'group-chat'
  status: 'active' | 'archived' | 'muted' | 'pinned'
  lastActivity: string
  messageCount: number
  summary?: string
  bots: Array<{
    bot: {
      id: number
      name: string
      avatar?: { url: string }
    }
    role: string
  }>
}

export interface ConversationListProps {
  conversations: ConversationItem[]
  selectedId?: number
  onSelect?: (id: number) => void
  onArchive?: (id: number) => void
  onDelete?: (id: number) => void
  onNewChat?: () => void
  isLoading?: boolean
  className?: string
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  onArchive,
  onDelete,
  onNewChat,
  isLoading = false,
  className,
}: ConversationListProps) {
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'now'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return date.toLocaleDateString()
  }

  const getPrimaryBot = (item: ConversationItem) => {
    const primary = item.bots.find(b => b.role === 'primary')
    return primary?.bot || item.bots[0]?.bot
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Chats</h2>
          {onNewChat && (
            <Button size="sm" onClick={onNewChat} className="gap-2">
              <Plus className="h-4 w-4" />
              New
            </Button>
          )}
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading && conversations.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              Loading conversations...
            </div>
          )}

          {!isLoading && conversations.length === 0 && (
            <div className="py-8 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No conversations yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Start a new chat to begin
              </p>
            </div>
          )}

          {conversations.map((item) => {
            const primaryBot = getPrimaryBot(item)
            const isSelected = selectedId === item.id
            const isPinned = item.status === 'pinned'
            const isArchived = item.status === 'archived'

            return (
              <div
                key={item.id}
                className={cn(
                  'group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer',
                  'transition-colors',
                  isSelected
                    ? 'bg-primary/10 border border-primary/30'
                    : 'hover:bg-muted/50',
                  isArchived && 'opacity-60'
                )}
                onClick={() => onSelect?.(item.id)}
              >
                {/* Avatar */}
                <Avatar className="h-10 w-10 shrink-0 border border-border/50">
                  <AvatarImage src={primaryBot?.avatar?.url} alt={primaryBot?.name} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">
                      {primaryBot?.name || 'Chat'}
                    </span>
                    {item.bots.length > 1 && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        +{item.bots.length - 1}
                      </Badge>
                    )}
                    {isPinned && (
                      <Pin className="h-3 w-3 text-muted-foreground shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="truncate">
                      {item.summary || `${item.messageCount} messages`}
                    </span>
                  </div>
                </div>

                {/* Time and menu */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {formatTimeAgo(item.lastActivity)}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/chat/${item.id}`}>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Open
                        </Link>
                      </DropdownMenuItem>
                      {onArchive && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            onArchive(item.id)
                          }}
                        >
                          <Archive className="h-4 w-4 mr-2" />
                          {isArchived ? 'Unarchive' : 'Archive'}
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            onDelete(item.id)
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
