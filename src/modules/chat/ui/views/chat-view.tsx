'use client'

/**
 * ChatView Component
 *
 * Main chat interface view that brings together all chat components.
 */

import { useState, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { useChat } from '../../hooks/use-chat'
import { ChatHeader } from '../components/chat-header'
import { MessageList, type Message } from '../components/message-list'
import { ChatInput } from '../components/chat-input'
import { BotSidebar, type BotParticipant } from '../components/bot-sidebar'
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

  // Get primary bot info for header
  const primaryBot = useMemo(() => {
    const primary = conversation?.bots?.find((b) => b.role === 'primary')
    return primary?.bot || conversation?.bots?.[0]?.bot
  }, [conversation?.bots])

  const handleSend = useCallback((content: string) => {
    sendMessage(content)
  }, [sendMessage])

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
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <ChatHeader
        botName={primaryBot?.name}
        botAvatar={primaryBot?.avatar?.url}
        botCount={conversation?.bots?.length || 1}
        conversationType={conversation?.type}
        totalTokens={conversation?.totalTokens}
        onOpenBotSidebar={() => setBotSidebarOpen(true)}
      />

      {/* Settings bar - Persona, API Key & Model selectors */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/30 bg-muted/30 flex-wrap">
        <PersonaSwitcher
          currentPersonaId={currentPersonaId}
          onSelect={handlePersonaChange}
          disabled={isSending || isStreaming}
        />
        <div className="h-4 w-px bg-border/50" />
        <ApiKeySelector
          currentKeyId={selectedApiKeyId}
          onSelect={setSelectedApiKeyId}
          onProviderChange={setSelectedProvider}
          disabled={isSending || isStreaming}
        />
        <div className="h-4 w-px bg-border/50" />
        <ModelSelector
          provider={selectedProvider}
          currentModel={selectedModel}
          onSelect={setSelectedModel}
          disabled={isSending || isStreaming}
        />
      </div>

      {/* Messages */}
      <MessageList
        messages={formattedMessages}
        isLoading={isLoading}
        hasMore={false} // TODO: Implement pagination
        onLoadMore={loadMoreMessages}
        className="flex-1"
      />

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        onStop={stopStreaming}
        isLoading={isSending}
        isStreaming={isStreaming}
        placeholder={`Message ${primaryBot?.name || 'bot'}...`}
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
