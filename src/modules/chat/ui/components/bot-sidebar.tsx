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
import { Bot, Plus, X, GripVertical } from 'lucide-react'

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

  const canRemoveBots = bots.length > minBots

  // Filter out bots already in conversation
  const botsToAdd = availableBots.filter(
    ab => !bots.some(b => b.id === ab.id)
  )

  const handleAddBot = (botId: number) => {
    onAddBot?.(botId)
    setAddBotDialogOpen(false)
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
          <div className="p-4 space-y-3">
            {bots.map((bot) => (
              <div
                key={bot.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg',
                  'bg-muted/30 border border-border/50',
                  !bot.isActive && 'opacity-50'
                )}
              >
                {/* Drag handle (for future reordering) */}
                <div className="cursor-grab text-muted-foreground">
                  <GripVertical className="h-4 w-4" />
                </div>

                {/* Avatar */}
                <Avatar className="h-10 w-10 border border-border/50">
                  <AvatarImage src={bot.avatar} alt={bot.name} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{bot.name}</div>
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
                    className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
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
            <Dialog open={addBotDialogOpen} onOpenChange={setAddBotDialogOpen}>
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
                <ScrollArea className="max-h-96">
                  <div className="space-y-2 p-1">
                    {botsToAdd.map((bot) => (
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
                    ))}
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
