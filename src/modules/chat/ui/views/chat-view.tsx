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
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export interface ChatViewProps {
  conversationId: number
  className?: string
}

export function ChatView({ conversationId, className }: ChatViewProps) {
  const [botSidebarOpen, setBotSidebarOpen] = useState(false)

  const {
    conversation,
    messages,
    isLoading,
    isSending,
    isStreaming,
    error,
    sendMessage,
    stopStreaming,
    addBot,
    removeBot,
    loadMoreMessages,
  } = useChat({
    conversationId,
    onError: (err) => {
      toast.error(err)
    },
  })

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
