'use client'

/**
 * BotSidebar Component
 *
 * Sidebar panel for managing bots in a multi-bot conversation.
 */

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Bot, Plus, X, GripVertical, Search } from 'lucide-react'

export interface BotParticipant {
  id: number
  name: string
  avatar?: string
  role: 'primary' | 'secondary' | 'moderator'
  isActive: boolean
}

export interface AvailableBot {
  id: number
  name: string
  avatar?: string
  description?: string
}

export interface BotSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bots: BotParticipant[]
  availableBots?: AvailableBot[]
  onAddBot?: (botId: number) => void
  onRemoveBot?: (botId: number) => void
  onReorderBots?: (botIds: number[]) => void
  minBots?: number
  className?: string
}

export function BotSidebar({
  open,
  onOpenChange,
  bots,
  availableBots = [],
  onAddBot,
  onRemoveBot,
  onReorderBots,
  minBots = 1,
  className,
}: BotSidebarProps) {
  const [addBotDialogOpen, setAddBotDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const canRemoveBots = bots.length > minBots

  // Filter out bots already in conversation
  const botsToAdd = availableBots.filter(
    ab => !bots.some(b => b.id === ab.id)
  )

  // Filter bots by search query
  const filteredBotsToAdd = searchQuery.trim()
    ? botsToAdd.filter(bot =>
        bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bot.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : botsToAdd

  const handleAddBot = (botId: number) => {
    onAddBot?.(botId)
    setAddBotDialogOpen(false)
    setSearchQuery('')
  }

  const handleDialogChange = (open: boolean) => {
    setAddBotDialogOpen(open)
    if (!open) {
      setSearchQuery('')
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'primary':
        return 'default'
      case 'moderator':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className={cn('w-80 p-0', className)}>
        <SheetHeader className="px-4 py-3 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Conversation Bots
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 h-[calc(100vh-8rem)]">
          <div className="p-3 space-y-2">
            {bots.map((bot) => (
              <div
                key={bot.id}
                className={cn(
                  'flex items-center gap-2 p-2 rounded-lg',
                  'bg-muted/30 border border-border/50',
                  !bot.isActive && 'opacity-50'
                )}
              >
                {/* Drag handle (for future reordering) */}
                <div className="cursor-grab text-muted-foreground shrink-0">
                  <GripVertical className="h-4 w-4" />
                </div>

                {/* Avatar */}
                <Avatar className="h-9 w-9 border border-border/50 shrink-0">
                  <AvatarImage src={bot.avatar} alt={bot.name} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="font-medium truncate text-sm">{bot.name}</div>
                  <Badge
                    variant={getRoleBadgeVariant(bot.role)}
                    className="text-xs capitalize"
                  >
                    {bot.role}
                  </Badge>
                </div>

                {/* Remove button */}
                {canRemoveBots && onRemoveBot && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveBot(bot.id)}
                    className="shrink-0 h-7 w-7 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Add bot button */}
        {onAddBot && botsToAdd.length > 0 && (
          <div className="p-4 border-t">
            <Dialog open={addBotDialogOpen} onOpenChange={handleDialogChange}>
              <DialogTrigger asChild>
                <Button className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Add Bot
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Bot to Conversation</DialogTitle>
                </DialogHeader>
                {/* Search input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search bots..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <ScrollArea className="max-h-80">
                  <div className="space-y-2 p-1">
                    {filteredBotsToAdd.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {searchQuery ? 'No bots found matching your search' : 'No bots available'}
                      </div>
                    ) : (
                      filteredBotsToAdd.map((bot) => (
                        <button
                          key={bot.id}
                          onClick={() => handleAddBot(bot.id)}
                          className={cn(
                            'flex items-center gap-3 w-full p-3 rounded-lg',
                            'hover:bg-muted/50 transition-colors text-left'
                          )}
                        >
                          <Avatar className="h-10 w-10 border border-border/50">
                            <AvatarImage src={bot.avatar} alt={bot.name} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              <Bot className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{bot.name}</div>
                            {bot.description && (
                              <div className="text-xs text-muted-foreground truncate">
                                {bot.description}
                              </div>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
