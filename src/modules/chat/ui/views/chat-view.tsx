'use client'

/**
 * ChatView Component
 *
 * Main chat interface view that brings together all chat components.
 * Supports multi-bot conversations with turn-taking modes.
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { cn } from '@/lib/utils'
import { useChat } from '../../hooks/use-chat'
import { useConversations } from '../../hooks/use-conversations'
import { ChatHeader } from '../components/chat-header'
import { MessageList, type Message } from '../components/message-list'
import { ChatInput, type BotForMention } from '../components/chat-input'
import { BotSidebar, type BotParticipant } from '../components/bot-sidebar'
import { BotSelector, type TurnMode, type BotOption } from '../components/bot-selector'
import { PersonaSwitcher } from '../components/persona-switcher'
import { ApiKeySelector } from '../components/api-key-selector'
import { ModelSelector } from '../components/model-selector'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export interface ChatViewProps {
  conversationId: number
  className?: string
}

export function ChatView({ conversationId, className }: ChatViewProps) {
  const router = useRouter()
  const { user } = useUser()
  const [botSidebarOpen, setBotSidebarOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)

  // Multi-bot orchestration state
  const [turnMode, setTurnMode] = useState<TurnMode>('manual')
  const [targetBotId, setTargetBotId] = useState<number | null>(null)
  const [mentionedBotId, setMentionedBotId] = useState<number | null>(null)
  const roundRobinIndexRef = useRef(0)

  // Confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [clearHistoryDialogOpen, setClearHistoryDialogOpen] = useState(false)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [conversationTitle, setConversationTitle] = useState<string | null>(null)

  // Available bots for adding to conversation
  const [availableBots, setAvailableBots] = useState<Array<{
    id: number
    name: string
    avatar?: string
    description?: string
  }>>([])

  // Conversation management
  const { deleteConversation, archiveConversation } = useConversations()

  // Fetch available bots when sidebar opens
  useEffect(() => {
    if (botSidebarOpen && availableBots.length === 0) {
      const fetchBots = async () => {
        try {
          const response = await fetch('/api/bots/explore?limit=50')
          const data = await response.json() as { bots?: Array<{ id: number; name: string; avatar?: { url: string }; description?: string }> }
          if (response.ok && data.bots) {
            setAvailableBots(data.bots.map(bot => ({
              id: bot.id,
              name: bot.name,
              avatar: bot.avatar?.url,
              description: bot.description,
            })))
          }
        } catch (error) {
          console.error('Failed to fetch available bots:', error)
        }
      }
      fetchBots()
    }
  }, [botSidebarOpen, availableBots.length])

  const {
    conversation,
    messages,
    isLoading,
    isSending,
    isStreaming,
    error,
    hasMore,
    isLoadingMore,
    selectedApiKeyId,
    setSelectedApiKeyId,
    selectedModel,
    setSelectedModel,
    sendMessage,
    stopStreaming,
    regenerateMessage,
    addBot,
    removeBot,
    switchPersona,
    updateAISettings,
    savedSettings,
    loadMoreMessages,
  } = useChat({
    conversationId,
    onError: (err) => {
      toast.error(err)
    },
  })

  // Handle API key change and persist
  const handleApiKeyChange = useCallback((keyId: number | null) => {
    setSelectedApiKeyId(keyId)
    updateAISettings({ api_key_id: keyId })
  }, [setSelectedApiKeyId, updateAISettings])

  // Handle model change and persist
  const handleModelChange = useCallback((model: string | null) => {
    setSelectedModel(model)
    updateAISettings({ model })
  }, [setSelectedModel, updateAISettings])

  // Handle provider change and persist
  const handleProviderChange = useCallback((provider: string | null) => {
    setSelectedProvider(provider)
    updateAISettings({ provider })
  }, [updateAISettings])

  // Sync conversation title from API
  useEffect(() => {
    if (conversation && (conversation as any).title !== undefined) {
      setConversationTitle((conversation as any).title || null)
    }
  }, [conversation])

  // Initialize provider from saved settings
  useEffect(() => {
    if (savedSettings?.provider && !selectedProvider) {
      setSelectedProvider(savedSettings.provider)
    }
  }, [savedSettings?.provider, selectedProvider])

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
      status: msg.status,
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
      sendMessage(content, firstBotId, currentPersonaId)
      toast.info('All-bots mode: Currently responds with primary bot')
    } else {
      // Normal single-bot response
      const botId = effectiveTargetId || getNextBotId()
      sendMessage(content, botId || undefined, currentPersonaId)
    }

    // Reset @mention target after sending
    setMentionedBotId(null)
  }, [turnMode, targetBotId, botParticipants, sendMessage, getNextBotId, currentPersonaId])

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

  // Handle opening bot sidebar for adding bots
  const handleOpenAddBot = useCallback(() => {
    setBotSidebarOpen(true)
  }, [])

  // Handle archive/unarchive conversation
  const handleArchive = useCallback(async () => {
    try {
      const currentStatus = conversation?.status || 'active'
      const newStatus = await archiveConversation(conversationId, currentStatus)
      if (newStatus === 'archived') {
        toast.success('Conversation archived')
        router.push('/chat')
      } else {
        toast.success('Conversation unarchived')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update conversation')
    }
  }, [archiveConversation, conversationId, conversation?.status, router])

  // Handle delete conversation
  const handleDelete = useCallback(async () => {
    setIsDeleting(true)
    try {
      await deleteConversation(conversationId)
      toast.success('Conversation deleted')
      router.push('/chat')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete conversation')
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }, [deleteConversation, conversationId, router])

  // Handle clear history
  const handleClearHistory = useCallback(async () => {
    setIsClearing(true)
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to clear history')
      }
      toast.success('Chat history cleared')
      // Refresh messages
      window.location.reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to clear history')
    } finally {
      setIsClearing(false)
      setClearHistoryDialogOpen(false)
    }
  }, [conversationId])

  // Handle rename conversation
  const handleOpenRename = useCallback(() => {
    setNewTitle(conversationTitle || '')
    setRenameDialogOpen(true)
  }, [conversationTitle])

  const handleRename = useCallback(async () => {
    setIsRenaming(true)
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() || null }),
      })
      if (!response.ok) {
        throw new Error('Failed to rename conversation')
      }
      setConversationTitle(newTitle.trim() || null)
      toast.success('Conversation renamed')
      setRenameDialogOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to rename conversation')
    } finally {
      setIsRenaming(false)
    }
  }, [conversationId, newTitle])

  // Handle export chat
  const handleExport = useCallback(async () => {
    try {
      // Build export data
      const exportData = {
        conversation: {
          id: conversationId,
          type: conversation?.type,
          bots: conversation?.bots?.map(b => b.bot.name),
          exportedAt: new Date().toISOString(),
        },
        messages: messages.map(msg => ({
          role: msg.isAI ? 'assistant' : 'user',
          content: msg.content,
          bot: msg.bot?.name,
          timestamp: msg.createdAt,
        })),
      }

      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `chat-${conversationId}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Chat exported')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to export chat')
    }
  }, [conversationId, conversation, messages])

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
        title={conversationTitle}
        botName={primaryBot?.name}
        botAvatar={primaryBot?.avatar?.url}
        botCount={conversation?.bots?.length || 1}
        conversationType={conversation?.type}
        totalTokens={conversation?.totalTokens}
        onOpenBotSidebar={() => setBotSidebarOpen(true)}
        onAddBot={handleOpenAddBot}
        onRename={handleOpenRename}
        onArchive={handleArchive}
        isArchived={conversation?.status === 'archived'}
        onDelete={() => setDeleteDialogOpen(true)}
        onClearHistory={() => setClearHistoryDialogOpen(true)}
        onExport={handleExport}
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
          onSelect={handleApiKeyChange}
          onProviderChange={handleProviderChange}
          disabled={isSending || isStreaming}
        />
        <div className="h-5 w-px bg-border/30" />
        <ModelSelector
          provider={selectedProvider}
          currentModel={selectedModel}
          onSelect={handleModelChange}
          disabled={isSending || isStreaming}
        />
      </div>

      {/* Messages - scrollable area, takes remaining space */}
      <MessageList
        messages={formattedMessages}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        onLoadMore={loadMoreMessages}
        userName={user?.firstName || user?.username || undefined}
        userAvatar={user?.imageUrl}
        className="flex-1 min-h-0"
        onRegenerateMessage={regenerateMessage}
        canRegenerate={!isSending && !isStreaming}
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
        availableBots={availableBots}
        onAddBot={handleAddBot}
        onRemoveBot={handleRemoveBot}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This action cannot be undone
              and all messages will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear history confirmation dialog */}
      <AlertDialog open={clearHistoryDialogOpen} onOpenChange={setClearHistoryDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Chat History</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all messages in this conversation?
              The conversation will remain but all messages will be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearHistory}
              disabled={isClearing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isClearing ? 'Clearing...' : 'Clear History'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Conversation</DialogTitle>
            <DialogDescription>
              Give this conversation a custom name to find it easily later.
              Leave empty to use the bot name.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder={primaryBot?.name || 'Conversation name...'}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isRenaming) {
                handleRename()
              }
            }}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameDialogOpen(false)}
              disabled={isRenaming}
            >
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={isRenaming}>
              {isRenaming ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
