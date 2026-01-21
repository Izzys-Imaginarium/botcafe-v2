'use client'

/**
 * ChatView Component
 *
 * Main chat interface view that brings together all chat components.
 * Supports multi-bot conversations with turn-taking modes.
 */

import { useState, useCallback, useMemo, useRef } from 'react'
import { cn } from '@/lib/utils'
import { useChat } from '../../hooks/use-chat'
import { ChatHeader } from '../components/chat-header'
import { MessageList, type Message } from '../components/message-list'
import { ChatInput, type BotForMention } from '../components/chat-input'
import { BotSidebar, type BotParticipant } from '../components/bot-sidebar'
import { BotSelector, type TurnMode, type BotOption } from '../components/bot-selector'
import { PersonaSwitcher } from '../components/persona-switcher'
import { ApiKeySelector } from '../components/api-key-selector'
import { ModelSelector } from '../components/model-selector'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export interface ChatViewProps {
  conversationId: number
  className?: string
}

export function ChatView({ conversationId, className }: ChatViewProps) {
  const [botSidebarOpen, setBotSidebarOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)

  // Multi-bot orchestration state
  const [turnMode, setTurnMode] = useState<TurnMode>('manual')
  const [targetBotId, setTargetBotId] = useState<number | null>(null)
  const [mentionedBotId, setMentionedBotId] = useState<number | null>(null)
  const roundRobinIndexRef = useRef(0)

  const {
    conversation,
    messages,
    isLoading,
    isSending,
    isStreaming,
    error,
    selectedApiKeyId,
    setSelectedApiKeyId,
    selectedModel,
    setSelectedModel,
    sendMessage,
    stopStreaming,
    addBot,
    removeBot,
    switchPersona,
    loadMoreMessages,
  } = useChat({
    conversationId,
    onError: (err) => {
      toast.error(err)
    },
  })

  // Get current persona from conversation
  const currentPersonaId = useMemo(() => {
    const primaryPersona = conversation?.participants?.primary_persona
    return primaryPersona ? parseInt(primaryPersona, 10) : null
  }, [conversation?.participants?.primary_persona])

  // Handle persona change
  const handlePersonaChange = useCallback(async (personaId: number | null) => {
    try {
      await switchPersona(personaId)
      toast.success(personaId ? 'Persona switched' : 'Persona removed')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to switch persona')
    }
  }, [switchPersona])

  // Transform messages for MessageList
  const formattedMessages: Message[] = useMemo(() => {
    return messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      isAI: msg.isAI,
      isStreaming: msg.isStreaming,
      botName: msg.bot?.name,
      botAvatar: msg.bot?.avatar?.url,
      timestamp: msg.createdAt,
      model: msg.model,
      tokens: msg.tokens,
    }))
  }, [messages])

  // Transform bots for sidebar
  const botParticipants: BotParticipant[] = useMemo(() => {
    if (!conversation?.bots) return []
    return conversation.bots.map((b) => ({
      id: b.bot.id,
      name: b.bot.name,
      avatar: b.bot.avatar?.url,
      role: b.role as 'primary' | 'secondary' | 'moderator',
      isActive: b.isActive,
    }))
  }, [conversation?.bots])

  // Transform bots for selector dropdown
  const botOptions: BotOption[] = useMemo(() => {
    return botParticipants.map((b) => ({
      id: b.id,
      name: b.name,
      avatar: b.avatar,
      role: b.role,
    }))
  }, [botParticipants])

  // Transform bots for @mention detection
  const botsForMention: BotForMention[] = useMemo(() => {
    return botParticipants.map((b) => ({
      id: b.id,
      name: b.name,
    }))
  }, [botParticipants])

  // Get primary bot info for header
  const primaryBot = useMemo(() => {
    const primary = conversation?.bots?.find((b) => b.role === 'primary')
    return primary?.bot || conversation?.bots?.[0]?.bot
  }, [conversation?.bots])

  // Determine which bot should respond based on turn mode
  const getNextBotId = useCallback((): number | null => {
    if (botParticipants.length <= 1) {
      return botParticipants[0]?.id || null
    }

    switch (turnMode) {
      case 'manual':
        // Use targeted bot or primary
        return targetBotId || botParticipants.find((b) => b.role === 'primary')?.id || botParticipants[0].id

      case 'round-robin':
        // Cycle through bots in order
        const nextBot = botParticipants[roundRobinIndexRef.current % botParticipants.length]
        roundRobinIndexRef.current = (roundRobinIndexRef.current + 1) % botParticipants.length
        return nextBot.id

      case 'random':
        // Pick a random bot
        const randomIndex = Math.floor(Math.random() * botParticipants.length)
        return botParticipants[randomIndex].id

      case 'all':
        // Will be handled specially - return null to indicate all bots
        return null

      default:
        return botParticipants[0]?.id || null
    }
  }, [turnMode, targetBotId, botParticipants])

  // Handle sending message with bot orchestration
  const handleSend = useCallback(async (content: string, mentionedId?: number) => {
    // If @mentioned, use that bot regardless of turn mode
    const effectiveTargetId = mentionedId || (turnMode === 'manual' ? targetBotId : null)

    if (turnMode === 'all' && !effectiveTargetId && botParticipants.length > 1) {
      // Send to all bots sequentially
      // For now, just send to the first bot - full "all bots" implementation
      // would require backend changes to handle multiple responses
      const firstBotId = botParticipants[0]?.id
      sendMessage(content, firstBotId)
      toast.info('All-bots mode: Currently responds with primary bot')
    } else {
      // Normal single-bot response
      const botId = effectiveTargetId || getNextBotId()
      sendMessage(content, botId || undefined)
    }

    // Reset @mention target after sending
    setMentionedBotId(null)
  }, [turnMode, targetBotId, botParticipants, sendMessage, getNextBotId])

  const handleAddBot = useCallback(async (botId: number) => {
    try {
      await addBot(botId)
      toast.success('Bot added to conversation')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add bot')
    }
  }, [addBot])

  const handleRemoveBot = useCallback(async (botId: number) => {
    try {
      await removeBot(botId)
      toast.success('Bot removed from conversation')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove bot')
    }
  }, [removeBot])

  // Loading state
  if (isLoading && !conversation) {
    return (
      <div className={cn('flex flex-col h-full items-center justify-center', className)}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">Loading conversation...</p>
      </div>
    )
  }

  // Error state
  if (error && !conversation) {
    return (
      <div className={cn('flex flex-col h-full items-center justify-center', className)}>
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col h-full overflow-hidden', className)}>
      {/* Header - fixed height */}
      <ChatHeader
        botName={primaryBot?.name}
        botAvatar={primaryBot?.avatar?.url}
        botCount={conversation?.bots?.length || 1}
        conversationType={conversation?.type}
        totalTokens={conversation?.totalTokens}
        onOpenBotSidebar={() => setBotSidebarOpen(true)}
      />

      {/* Settings bar - fixed height */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-border/20 bg-background/40 backdrop-blur-sm flex-wrap shrink-0">
        {/* Bot selector for multi-bot conversations */}
        {botParticipants.length > 1 && (
          <>
            <BotSelector
              bots={botOptions}
              selectedBotId={targetBotId}
              turnMode={turnMode}
              onSelectBot={setTargetBotId}
              onChangeTurnMode={setTurnMode}
              disabled={isSending || isStreaming}
            />
            <div className="h-5 w-px bg-border/30" />
          </>
        )}
        <PersonaSwitcher
          currentPersonaId={currentPersonaId}
          onSelect={handlePersonaChange}
          disabled={isSending || isStreaming}
        />
        <div className="h-5 w-px bg-border/30" />
        <ApiKeySelector
          currentKeyId={selectedApiKeyId}
          onSelect={setSelectedApiKeyId}
          onProviderChange={setSelectedProvider}
          disabled={isSending || isStreaming}
        />
        <div className="h-5 w-px bg-border/30" />
        <ModelSelector
          provider={selectedProvider}
          currentModel={selectedModel}
          onSelect={setSelectedModel}
          disabled={isSending || isStreaming}
        />
      </div>

      {/* Messages - scrollable area, takes remaining space */}
      <MessageList
        messages={formattedMessages}
        isLoading={isLoading}
        hasMore={false} // TODO: Implement pagination
        onLoadMore={loadMoreMessages}
        className="flex-1 min-h-0 overflow-hidden"
      />

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        onStop={stopStreaming}
        onMentionDetected={setMentionedBotId}
        isLoading={isSending}
        isStreaming={isStreaming}
        placeholder={`Message ${primaryBot?.name || 'bot'}...`}
        bots={botsForMention}
      />

      {/* Bot sidebar for multi-bot */}
      <BotSidebar
        open={botSidebarOpen}
        onOpenChange={setBotSidebarOpen}
        bots={botParticipants}
        onAddBot={handleAddBot}
        onRemoveBot={handleRemoveBot}
      />
    </div>
  )
}
