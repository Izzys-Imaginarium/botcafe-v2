'use client'

/**
 * useConversations Hook
 *
 * Manages conversation list fetching and state.
 */

import { useState, useCallback, useEffect } from 'react'

export interface ConversationSummary {
  id: number
  type: 'single-bot' | 'multi-bot' | 'group-chat'
  status: 'active' | 'archived' | 'muted' | 'pinned'
  createdAt: string
  lastActivity: string
  messageCount: number
  summary: string | null
  bots: Array<{
    bot: {
      id: number
      name: string
      avatar?: { url: string }
    }
    role: string
    isActive: boolean
  }>
  totalTokens: number
}

export interface UseConversationsOptions {
  status?: string
  botId?: number
  limit?: number
  autoLoad?: boolean
}

export function useConversations(options: UseConversationsOptions = {}) {
  const { status = 'active', botId, limit = 20, autoLoad = true } = options

  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)

  const fetchConversations = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: String(limit),
        status,
      })

      if (botId) {
        params.set('botId', String(botId))
      }

      const response = await fetch(`/api/chat/conversations?${params}`)
      const data = await response.json() as {
        message?: string
        conversations?: ConversationSummary[]
        page?: number
        hasNextPage?: boolean
        total?: number
      }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch conversations')
      }

      if (append) {
        setConversations(prev => [...prev, ...(data.conversations || [])])
      } else {
        setConversations(data.conversations || [])
      }

      setPage(data.page || 1)
      setHasMore(data.hasNextPage || false)
      setTotal(data.total || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [status, botId, limit])

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchConversations(page + 1, true)
    }
  }, [isLoading, hasMore, page, fetchConversations])

  const refresh = useCallback(() => {
    setPage(1)
    fetchConversations(1, false)
  }, [fetchConversations])

  const createConversation = useCallback(async (
    botIds: number[],
    personaId?: number,
    type?: string
  ) => {
    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botIds: botIds.length > 1 ? botIds : undefined,
          botId: botIds.length === 1 ? botIds[0] : undefined,
          personaId,
          type,
        }),
      })

      const data = await response.json() as { message?: string; conversation?: ConversationSummary }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create conversation')
      }

      // Refresh list to include new conversation
      refresh()

      return data.conversation!
    } catch (err) {
      throw err
    }
  }, [refresh])

  const deleteConversation = useCallback(async (conversationId: number) => {
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json() as { message?: string }
        throw new Error(data.message || 'Failed to delete conversation')
      }

      // Remove from local state
      setConversations(prev => prev.filter(c => c.id !== conversationId))
      setTotal(prev => prev - 1)

      return true
    } catch (err) {
      throw err
    }
  }, [])

  const archiveConversation = useCallback(async (conversationId: number, currentStatus?: string) => {
    const newStatus = currentStatus === 'archived' ? 'active' : 'archived'
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const data = await response.json() as { message?: string }
        throw new Error(data.message || `Failed to ${newStatus === 'archived' ? 'archive' : 'unarchive'} conversation`)
      }

      // Update local state
      setConversations(prev =>
        prev.map(c => c.id === conversationId ? { ...c, status: newStatus as 'active' | 'archived' } : c)
      )

      return newStatus
    } catch (err) {
      throw err
    }
  }, [])

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      fetchConversations(1, false)
    }
  }, [autoLoad, fetchConversations])

  return {
    conversations,
    isLoading,
    error,
    page,
    hasMore,
    total,
    loadMore,
    refresh,
    createConversation,
    deleteConversation,
    archiveConversation,
  }
}
