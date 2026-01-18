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

export interface ConversationDetails {
  id: number
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

  const [selectedApiKeyId, setSelectedApiKeyId] = useState<number | null>(null)
  const [selectedModel, setSelectedModel] = useState<string | null>(null)

  const streamingMessageIdRef = useRef<number | null>(null)

  const streaming = useStreaming({
    onChunk: (content) => {
      // Update the streaming message content
      if (streamingMessageIdRef.current) {
        setMessages(prev => prev.map(m =>
          m.id === streamingMessageIdRef.current
            ? { ...m, content: m.content + content }
            : m
        ))
      }
    },
    onComplete: (fullContent, usage) => {
      // Finalize the streaming message
      if (streamingMessageIdRef.current) {
        setMessages(prev => prev.map(m =>
          m.id === streamingMessageIdRef.current
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

        const finalMessage = messages.find(m => m.id === streamingMessageIdRef.current)
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
      const params = new URLSearchParams({ limit: '50' })
      if (before) {
        params.set('before', String(before))
      }

      const response = await fetch(
        `/api/chat/conversations/${conversationId}/messages?${params}`
      )
      const data = await response.json() as { message?: string; messages?: ChatMessage[] }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch messages')
      }

      if (before) {
        setMessages(prev => [...(data.messages || []), ...prev])
      } else {
        setMessages(data.messages || [])
      }

      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    }
  }, [conversationId])

  // Send a message
  const sendMessage = useCallback(async (
    content: string,
    targetBotId?: number
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

  return {
    // State
    conversation,
    messages,
    isLoading,
    isSending,
    isStreaming: streaming.isStreaming,
    error,

    // API key / model selection
    selectedApiKeyId,
    setSelectedApiKeyId,
    selectedModel,
    setSelectedModel,

    // Actions
    sendMessage,
    stopStreaming,
    addBot,
    removeBot,
    switchPersona,
    refresh: () => {
      fetchConversation()
      fetchMessages()
    },
    loadMoreMessages: () => {
      if (messages.length > 0) {
        fetchMessages(messages[0].id)
      }
    },
  }
}
