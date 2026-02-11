'use client'

/**
 * useChat Hook
 *
 * Main chat state management hook.
 * Handles messages, sending, and streaming.
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useStreaming } from './use-streaming'

export interface ChatMessage {
  id: number
  type: 'text' | 'image' | 'file' | 'system' | 'voice' | 'code'
  content: string
  createdAt: string
  isAI: boolean
  model?: string
  bot?: {
    id: number
    name: string
    avatar?: { url: string }
  }
  tokens?: {
    input: number
    output: number
    total: number
    cost: number
  }
  status?: string
  isStreaming?: boolean
}

export interface ConversationSettings {
  allow_file_sharing?: boolean
  message_retention_days?: number
  auto_save_conversations?: boolean
  api_key_id?: number | null
  model?: string | null
  provider?: string | null
}

export interface ConversationDetails {
  id: number
  title?: string | null
  type: string
  status: string
  bots: Array<{
    bot: {
      id: number
      name: string
      avatar?: { url: string }
    }
    role: string
    isActive: boolean
  }>
  participants: {
    primary_persona?: string
    personas?: string[]
    bots?: string[]
  }
  totalTokens: number
  settings?: ConversationSettings
}

export interface UseChatOptions {
  conversationId: number
  onMessageSent?: (message: ChatMessage) => void
  onStreamComplete?: (message: ChatMessage) => void
  onError?: (error: string) => void
}

export function useChat(options: UseChatOptions) {
  const { conversationId, onMessageSent, onStreamComplete, onError } = options

  const [conversation, setConversation] = useState<ConversationDetails | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const [selectedApiKeyId, setSelectedApiKeyId] = useState<number | null>(null)
  const [selectedModel, setSelectedModel] = useState<string | null>(null)

  const streamingMessageIdRef = useRef<number | null>(null)

  const streaming = useStreaming({
    onChunk: (content) => {
      // Update the streaming message content
      // Capture message ID before setMessages - React batches updates so the mapper runs later
      const messageId = streamingMessageIdRef.current
      if (messageId) {
        setMessages(prev => prev.map(m =>
          m.id === messageId
            ? { ...m, content: m.content + content }
            : m
        ))
      }
    },
    onComplete: (fullContent, usage) => {
      // Finalize the streaming message
      // IMPORTANT: Capture message ID before setMessages because React batches state updates.
      // The mapper function runs later, and by then streamingMessageIdRef.current would be null.
      const messageId = streamingMessageIdRef.current
      if (messageId) {
        setMessages(prev => prev.map(m =>
          m.id === messageId
            ? {
                ...m,
                content: fullContent,
                isStreaming: false,
                tokens: usage ? {
                  input: usage.inputTokens,
                  output: usage.outputTokens,
                  total: usage.totalTokens,
                  cost: 0,
                } : m.tokens,
              }
            : m
        ))

        const finalMessage = messages.find(m => m.id === messageId)
        if (finalMessage) {
          onStreamComplete?.({ ...finalMessage, content: fullContent, isStreaming: false })
        }

        streamingMessageIdRef.current = null
      }
    },
    onError: (err) => {
      setError(err)
      onError?.(err)
    },
  })

  // Fetch conversation details
  const fetchConversation = useCallback(async () => {
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}`)
      const data = await response.json() as { message?: string; conversation?: ConversationDetails }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch conversation')
      }

      setConversation(data.conversation || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [conversationId])

  // Fetch messages
  const fetchMessages = useCallback(async (before?: number) => {
    try {
      if (before) {
        setIsLoadingMore(true)
      }

      const params = new URLSearchParams({ limit: '50' })
      if (before) {
        params.set('before', String(before))
      }

      const response = await fetch(
        `/api/chat/conversations/${conversationId}/messages?${params}`
      )
      const data = await response.json() as {
        message?: string
        messages?: Array<{
          id: number
          type: string
          content: string
          createdAt: string
          isAI: boolean
          model?: string
          bot?: { id: number; name: string; picture?: { url: string } }
          tokens?: { input: number; output: number; total: number; cost: number }
          status?: string
        }>
        total?: number
        page?: number
        totalPages?: number
        hasNextPage?: boolean
        hasPrevPage?: boolean
      }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch messages')
      }

      // Transform messages to map bot.picture to bot.avatar
      const transformedMessages: ChatMessage[] = (data.messages || []).map(msg => ({
        id: msg.id,
        type: msg.type as ChatMessage['type'],
        content: msg.content,
        createdAt: msg.createdAt,
        isAI: msg.isAI,
        model: msg.model,
        bot: msg.bot ? {
          id: msg.bot.id,
          name: msg.bot.name,
          avatar: msg.bot.picture, // Map picture to avatar
        } : undefined,
        tokens: msg.tokens,
        status: msg.status,
      }))

      if (before) {
        // Loading older messages - prepend to existing
        setMessages(prev => [...transformedMessages, ...prev])
        // After loading older messages, check if there are even older ones
        // hasPrevPage from the API indicates if there are more messages before these
        setHasMore(data.hasPrevPage ?? false)
      } else {
        // Initial load - replace all
        setMessages(transformedMessages)
        // For initial load sorted descending then reversed, hasPrevPage indicates older messages exist
        setHasMore(data.hasPrevPage ?? false)
      }

      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setIsLoadingMore(false)
    }
  }, [conversationId])

  // Send a message
  const sendMessage = useCallback(async (
    content: string,
    targetBotId?: number,
    personaId?: number | null
  ) => {
    if (!content.trim() || isSending || streaming.isStreaming) {
      return
    }

    setIsSending(true)
    setError(null)

    try {
      // Call send API
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          content,
          apiKeyId: selectedApiKeyId,
          model: selectedModel,
          targetBotId,
          personaId,
        }),
      })

      const data = await response.json() as {
        message?: string
        userMessageId?: number
        botMessageId?: number
        bot?: { id: number; name: string; picture?: { url: string } }
        model?: string
        streamUrl?: string
      }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message')
      }

      // Add user message to state
      const userMessage: ChatMessage = {
        id: data.userMessageId!,
        type: 'text',
        content,
        createdAt: new Date().toISOString(),
        isAI: false,
        status: 'sent',
      }
      setMessages(prev => [...prev, userMessage])
      onMessageSent?.(userMessage)

      // Add placeholder for bot message
      const botMessage: ChatMessage = {
        id: data.botMessageId!,
        type: 'text',
        content: '',
        createdAt: new Date().toISOString(),
        isAI: true,
        bot: data.bot ? { id: data.bot.id, name: data.bot.name, avatar: data.bot.picture } : undefined,
        model: data.model,
        isStreaming: true,
        status: 'sent',
      }
      setMessages(prev => [...prev, botMessage])
      streamingMessageIdRef.current = data.botMessageId!

      // Start streaming
      streaming.startStream(data.streamUrl!)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsSending(false)
    }
  }, [
    conversationId,
    isSending,
    streaming,
    selectedApiKeyId,
    selectedModel,
    onMessageSent,
    onError,
  ])

  // Stop streaming
  const stopStreaming = useCallback(() => {
    streaming.stopStream()
    if (streamingMessageIdRef.current) {
      setMessages(prev => prev.map(m =>
        m.id === streamingMessageIdRef.current
          ? { ...m, isStreaming: false }
          : m
      ))
      streamingMessageIdRef.current = null
    }
  }, [streaming])

  // Regenerate an AI message (retry failed or get new response)
  const regenerateMessage = useCallback(async (messageId: number) => {
    if (isSending || streaming.isStreaming) {
      return
    }

    setIsSending(true)
    setError(null)

    try {
      const response = await fetch('/api/chat/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          apiKeyId: selectedApiKeyId,
          model: selectedModel,
        }),
      })

      const data = await response.json() as {
        message?: string
        botMessageId?: number
        bot?: { id: number; name: string; picture?: { url: string } }
        model?: string
        streamUrl?: string
      }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to regenerate message')
      }

      // Remove old AI message from state
      setMessages(prev => prev.filter(m => m.id !== messageId))

      // Add new placeholder for regenerated message
      const newBotMessage: ChatMessage = {
        id: data.botMessageId!,
        type: 'text',
        content: '',
        createdAt: new Date().toISOString(),
        isAI: true,
        bot: data.bot ? { id: data.bot.id, name: data.bot.name, avatar: data.bot.picture } : undefined,
        model: data.model,
        isStreaming: true,
        status: 'sent',
      }
      setMessages(prev => [...prev, newBotMessage])
      streamingMessageIdRef.current = data.botMessageId!

      // Start streaming
      streaming.startStream(data.streamUrl!)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsSending(false)
    }
  }, [isSending, streaming, selectedApiKeyId, selectedModel, onError])

  // Add a bot to the conversation
  const addBot = useCallback(async (botId: number) => {
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addBotId: botId }),
      })

      if (!response.ok) {
        const data = await response.json() as { message?: string }
        throw new Error(data.message || 'Failed to add bot')
      }

      // Refresh conversation details
      await fetchConversation()
    } catch (err) {
      throw err
    }
  }, [conversationId, fetchConversation])

  // Remove a bot from the conversation
  const removeBot = useCallback(async (botId: number) => {
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ removeBotId: botId }),
      })

      if (!response.ok) {
        const data = await response.json() as { message?: string }
        throw new Error(data.message || 'Failed to remove bot')
      }

      // Refresh conversation details
      await fetchConversation()
    } catch (err) {
      throw err
    }
  }, [conversationId, fetchConversation])

  // Switch persona
  const switchPersona = useCallback(async (personaId: number | null) => {
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personaId }),
      })

      if (!response.ok) {
        const data = await response.json() as { message?: string }
        throw new Error(data.message || 'Failed to switch persona')
      }

      // Refresh conversation details
      await fetchConversation()

      // Add system message
      setMessages(prev => [...prev, {
        id: Date.now(), // Temporary ID
        type: 'system',
        content: personaId ? 'Persona changed' : 'Persona removed',
        createdAt: new Date().toISOString(),
        isAI: false,
      } as ChatMessage])
    } catch (err) {
      throw err
    }
  }, [conversationId, fetchConversation])

  // Update AI settings - debounced to batch rapid changes (e.g. api key + provider + model)
  // into a single PATCH request, preventing concurrent update conflicts on D1.
  const pendingSettingsRef = useRef<Record<string, unknown>>({})
  const settingsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flushSettings = useCallback(async () => {
    const pending = pendingSettingsRef.current
    pendingSettingsRef.current = {}
    settingsTimerRef.current = null

    if (Object.keys(pending).length === 0) return

    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: pending }),
      })

      if (!response.ok) {
        const data = await response.json() as { message?: string }
        throw new Error(data.message || 'Failed to update settings')
      }
    } catch (err) {
      console.error('Failed to save AI settings:', err)
    }
  }, [conversationId])

  const updateAISettings = useCallback((settings: {
    api_key_id?: number | null
    model?: string | null
    provider?: string | null
  }) => {
    // Merge with any pending settings
    pendingSettingsRef.current = { ...pendingSettingsRef.current, ...settings }

    // Reset debounce timer
    if (settingsTimerRef.current) {
      clearTimeout(settingsTimerRef.current)
    }
    settingsTimerRef.current = setTimeout(flushSettings, 100)
  }, [flushSettings])

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (settingsTimerRef.current) {
        clearTimeout(settingsTimerRef.current)
      }
    }
  }, [])

  // Sync streaming state - when streaming stops, ensure message is updated
  // This is a safety net in case the onComplete callback doesn't fire properly
  useEffect(() => {
    if (!streaming.isStreaming && streamingMessageIdRef.current) {
      const messageId = streamingMessageIdRef.current
      setMessages(prev => prev.map(m =>
        m.id === messageId
          ? {
              ...m,
              isStreaming: false,
              // Also update tokens if we have usage data
              tokens: streaming.usage ? {
                input: streaming.usage.inputTokens,
                output: streaming.usage.outputTokens,
                total: streaming.usage.totalTokens,
                cost: 0,
              } : m.tokens,
            }
          : m
      ))
      streamingMessageIdRef.current = null
    }
  }, [streaming.isStreaming, streaming.usage])

  // Initial load
  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      await Promise.all([
        fetchConversation(),
        fetchMessages(),
      ])
      setIsLoading(false)
    }
    load()
  }, [fetchConversation, fetchMessages])

  // Initialize AI settings from conversation when loaded
  useEffect(() => {
    if (conversation?.settings) {
      if (conversation.settings.api_key_id && !selectedApiKeyId) {
        setSelectedApiKeyId(conversation.settings.api_key_id)
      }
      if (conversation.settings.model && !selectedModel) {
        setSelectedModel(conversation.settings.model)
      }
    }
  }, [conversation?.settings])

  return {
    // State
    conversation,
    messages,
    isLoading,
    isSending,
    isStreaming: streaming.isStreaming,
    error,
    hasMore,
    isLoadingMore,

    // API key / model selection
    selectedApiKeyId,
    setSelectedApiKeyId,
    selectedModel,
    setSelectedModel,

    // Saved settings (for initializing provider in parent)
    savedSettings: conversation?.settings,

    // Actions
    sendMessage,
    stopStreaming,
    regenerateMessage,
    addBot,
    removeBot,
    switchPersona,
    updateAISettings,
    refresh: () => {
      fetchConversation()
      fetchMessages()
    },
    loadMoreMessages: () => {
      if (messages.length > 0 && hasMore && !isLoadingMore) {
        fetchMessages(messages[0].id)
      }
    },
  }
}
