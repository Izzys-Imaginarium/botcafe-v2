'use client'

/**
 * useInfiniteList Hook
 *
 * Reusable hook for infinite scroll lists with search and filtering.
 * Handles pagination, loading states, and parameter changes.
 */

import { useState, useCallback, useEffect, useRef } from 'react'

export interface UseInfiniteListOptions {
  endpoint: string
  limit?: number
  initialParams?: Record<string, string>
  autoLoad?: boolean
  /** Key in response that contains the items array (default: auto-detect) */
  itemsKey?: string
}

export interface UseInfiniteListReturn<T> {
  items: T[]
  isLoading: boolean
  isLoadingMore: boolean
  error: string | null
  hasMore: boolean
  total: number
  page: number
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  setParams: (params: Record<string, string>) => void
  params: Record<string, string>
}

interface PaginatedResponse {
  [key: string]: unknown
  totalPages?: number
  currentPage?: number
  page?: number
  totalDocs?: number
  total?: number
  hasNextPage?: boolean
  hasMore?: boolean
}

export function useInfiniteList<T extends { id: string | number }>(
  options: UseInfiniteListOptions
): UseInfiniteListReturn<T> {
  const { endpoint, limit = 20, initialParams = {}, autoLoad = true, itemsKey } = options

  const [items, setItems] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)
  const [params, setParamsState] = useState<Record<string, string>>(initialParams)

  // Track if initial load has happened
  const hasLoadedRef = useRef(false)
  // Track current fetch to prevent race conditions
  const fetchIdRef = useRef(0)

  const fetchItems = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      const fetchId = ++fetchIdRef.current

      if (append) {
        setIsLoadingMore(true)
      } else {
        setIsLoading(true)
      }
      setError(null)

      try {
        const urlParams = new URLSearchParams({
          page: String(pageNum),
          limit: String(limit),
          ...params,
        })

        // Remove empty params
        for (const [key, value] of urlParams.entries()) {
          if (!value) urlParams.delete(key)
        }

        const response = await fetch(`${endpoint}?${urlParams}`)
        const data = (await response.json()) as PaginatedResponse

        // Check if this fetch is still relevant
        if (fetchId !== fetchIdRef.current) return

        if (!response.ok) {
          throw new Error((data as { message?: string }).message || 'Failed to fetch items')
        }

        // Auto-detect the items array key
        let itemsArray: T[] = []
        if (itemsKey && data[itemsKey]) {
          itemsArray = data[itemsKey] as T[]
        } else {
          // Try common keys
          const possibleKeys = ['items', 'docs', 'bots', 'creators', 'memories', 'personas', 'collections', 'entries']
          for (const key of possibleKeys) {
            if (Array.isArray(data[key])) {
              itemsArray = data[key] as T[]
              break
            }
          }
        }

        if (append) {
          // Dedupe by id when appending
          setItems((prev) => {
            const existingIds = new Set(prev.map((item) => item.id))
            const newItems = itemsArray.filter((item) => !existingIds.has(item.id))
            return [...prev, ...newItems]
          })
        } else {
          setItems(itemsArray)
        }

        // Handle pagination metadata (check both root level and nested pagination object)
        const pagination = (data.pagination || data) as PaginatedResponse
        const currentPage = pagination.currentPage || pagination.page || data.page || pageNum
        const totalDocs = pagination.totalDocs || pagination.total || data.totalDocs || data.total || 0
        const totalPages = pagination.totalPages || data.totalPages || Math.ceil(totalDocs / limit)
        const nextPageExists =
          pagination.hasNextPage ?? pagination.hasMore ?? data.hasNextPage ?? data.hasMore ?? currentPage < totalPages

        setPage(currentPage)
        setHasMore(nextPageExists)
        setTotal(totalDocs)
        hasLoadedRef.current = true
      } catch (err) {
        if (fetchId === fetchIdRef.current) {
          setError(err instanceof Error ? err.message : 'Unknown error')
        }
      } finally {
        if (fetchId === fetchIdRef.current) {
          setIsLoading(false)
          setIsLoadingMore(false)
        }
      }
    },
    [endpoint, limit, params, itemsKey]
  )

  const loadMore = useCallback(async () => {
    if (!isLoading && !isLoadingMore && hasMore) {
      await fetchItems(page + 1, true)
    }
  }, [isLoading, isLoadingMore, hasMore, page, fetchItems])

  const refresh = useCallback(async () => {
    setPage(1)
    setHasMore(true)
    await fetchItems(1, false)
  }, [fetchItems])

  const setParams = useCallback((newParams: Record<string, string>) => {
    setParamsState(newParams)
    // Reset pagination when params change
    setPage(1)
    setHasMore(true)
    setItems([])
  }, [])

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad && !hasLoadedRef.current) {
      fetchItems(1, false)
    }
  }, [autoLoad, fetchItems])

  // Refetch when params change (after initial load)
  useEffect(() => {
    if (hasLoadedRef.current) {
      fetchItems(1, false)
    }
  }, [params, fetchItems])

  return {
    items,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    total,
    page,
    loadMore,
    refresh,
    setParams,
    params,
  }
}
