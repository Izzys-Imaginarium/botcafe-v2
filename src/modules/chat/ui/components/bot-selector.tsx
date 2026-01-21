'use client'

/**
 * BotSelector Component
 *
 * Dropdown for selecting which bot should respond to a message.
 * Used in multi-bot conversations to target specific bots.
 */

import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Bot, ChevronDown, Shuffle, RotateCcw, Users } from 'lucide-react'

export type TurnMode = 'manual' | 'round-robin' | 'random' | 'all'

export interface BotOption {
  id: number
  name: string
  avatar?: string
  role?: 'primary' | 'secondary' | 'moderator'
}

export interface BotSelectorProps {
  bots: BotOption[]
  selectedBotId: number | null
  turnMode: TurnMode
  onSelectBot: (botId: number | null) => void
  onChangeTurnMode: (mode: TurnMode) => void
  disabled?: boolean
  className?: string
}

export function BotSelector({
  bots,
  selectedBotId,
  turnMode,
  onSelectBot,
  onChangeTurnMode,
  disabled = false,
  className,
}: BotSelectorProps) {
  // Don't show selector for single-bot conversations
  if (bots.length <= 1) {
    return null
  }

  const selectedBot = bots.find((b) => b.id === selectedBotId)
  const primaryBot = bots.find((b) => b.role === 'primary') || bots[0]

  const getTurnModeIcon = () => {
    switch (turnMode) {
      case 'round-robin':
        return <RotateCcw className="h-3.5 w-3.5" />
      case 'random':
        return <Shuffle className="h-3.5 w-3.5" />
      case 'all':
        return <Users className="h-3.5 w-3.5" />
      default:
        return null
    }
  }

  const getTurnModeLabel = () => {
    switch (turnMode) {
      case 'round-robin':
        return 'Round Robin'
      case 'random':
        return 'Random'
      case 'all':
        return 'All Bots'
      default:
        return 'Manual'
    }
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Bot selector dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className={cn(
              'gap-2 h-9 px-3 bg-background/50 border-border/30',
              'hover:bg-background/80 hover:border-border/50'
            )}
          >
            {selectedBot ? (
              <>
                <Avatar className="h-5 w-5">
                  <AvatarImage src={selectedBot.avatar} alt={selectedBot.name} />
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {selectedBot.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="max-w-24 truncate">{selectedBot.name}</span>
              </>
            ) : turnMode === 'manual' ? (
              <>
                <Avatar className="h-5 w-5">
                  <AvatarImage src={primaryBot?.avatar} alt={primaryBot?.name} />
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {primaryBot?.name.charAt(0) || 'B'}
                  </AvatarFallback>
                </Avatar>
                <span className="max-w-24 truncate">{primaryBot?.name || 'Bot'}</span>
              </>
            ) : (
              <>
                {getTurnModeIcon()}
                <span>{getTurnModeLabel()}</span>
              </>
            )}
            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Select Bot to Respond
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Individual bot options */}
          {bots.map((bot) => (
            <DropdownMenuItem
              key={bot.id}
              onClick={() => {
                onSelectBot(bot.id)
                onChangeTurnMode('manual')
              }}
              className={cn(
                'gap-3 cursor-pointer',
                selectedBotId === bot.id && turnMode === 'manual' && 'bg-accent'
              )}
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={bot.avatar} alt={bot.name} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {bot.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="truncate">{bot.name}</div>
                {bot.role === 'primary' && (
                  <div className="text-xs text-muted-foreground">Primary</div>
                )}
              </div>
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Turn Modes
          </DropdownMenuLabel>

          {/* Round-robin mode */}
          <DropdownMenuItem
            onClick={() => {
              onSelectBot(null)
              onChangeTurnMode('round-robin')
            }}
            className={cn(
              'gap-3 cursor-pointer',
              turnMode === 'round-robin' && 'bg-accent'
            )}
          >
            <div className="h-6 w-6 flex items-center justify-center rounded-full bg-muted">
              <RotateCcw className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1">
              <div>Round Robin</div>
              <div className="text-xs text-muted-foreground">
                Bots take turns responding
              </div>
            </div>
          </DropdownMenuItem>

          {/* Random mode */}
          <DropdownMenuItem
            onClick={() => {
              onSelectBot(null)
              onChangeTurnMode('random')
            }}
            className={cn(
              'gap-3 cursor-pointer',
              turnMode === 'random' && 'bg-accent'
            )}
          >
            <div className="h-6 w-6 flex items-center justify-center rounded-full bg-muted">
              <Shuffle className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1">
              <div>Random</div>
              <div className="text-xs text-muted-foreground">
                Random bot responds each time
              </div>
            </div>
          </DropdownMenuItem>

          {/* All bots mode */}
          <DropdownMenuItem
            onClick={() => {
              onSelectBot(null)
              onChangeTurnMode('all')
            }}
            className={cn(
              'gap-3 cursor-pointer',
              turnMode === 'all' && 'bg-accent'
            )}
          >
            <div className="h-6 w-6 flex items-center justify-center rounded-full bg-muted">
              <Users className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1">
              <div>All Bots</div>
              <div className="text-xs text-muted-foreground">
                Every bot responds to each message
              </div>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Visual indicator when @mentioning */}
      {selectedBot && turnMode === 'manual' && (
        <span className="text-xs text-muted-foreground">
          @{selectedBot.name} will respond
        </span>
      )}
    </div>
  )
}
