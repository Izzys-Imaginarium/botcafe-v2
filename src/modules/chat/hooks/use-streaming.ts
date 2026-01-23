'use client'

/**
 * useStreaming Hook
 *
 * Manages SSE connection for streaming LLM responses.
 */

import { useState, useCallback, useRef, useEffect } from 'react'

export interface StreamingState {
  isStreaming: boolean
  content: string
  error: string | null
  usage: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  } | null
  finishReason: string | null
}

export interface UseStreamingOptions {
  onChunk?: (content: string) => void
  onComplete?: (fullContent: string, usage: StreamingState['usage']) => void
  onError?: (error: string) => void
}

export function useStreaming(options: UseStreamingOptions = {}) {
  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    content: '',
    error: null,
    usage: null,
    finishReason: null,
  })

  const eventSourceRef = useRef<EventSource | null>(null)
  const contentRef = useRef('')

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  const startStream = useCallback((streamUrl: string) => {
    // Close any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    // Reset state
    contentRef.current = ''
    let hasCompleted = false
    let lastUsage: StreamingState['usage'] = null

    setState({
      isStreaming: true,
      content: '',
      error: null,
      usage: null,
      finishReason: null,
    })

    // Create new EventSource connection
    const eventSource = new EventSource(streamUrl)
    eventSourceRef.current = eventSource

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.error) {
          setState(prev => ({
            ...prev,
            isStreaming: false,
            error: data.message || 'Stream error',
          }))
          options.onError?.(data.message || 'Stream error')
          eventSource.close()
          return
        }

        switch (data.type) {
          case 'start':
            // Stream started, we can show model info if needed
            break

          case 'chunk':
            if (data.content) {
              contentRef.current += data.content
              setState(prev => ({
                ...prev,
                content: contentRef.current,
              }))
              options.onChunk?.(data.content)
            }
            break

          case 'end':
            hasCompleted = true
            lastUsage = data.usage || null
            setState(prev => ({
              ...prev,
              isStreaming: false,
              finishReason: data.finishReason,
              usage: data.usage || null,
            }))
            options.onComplete?.(contentRef.current, data.usage || null)
            eventSource.close()
            break
        }
      } catch {
        // Skip malformed messages
      }
    }

    eventSource.onerror = () => {
      if (eventSource.readyState === EventSource.CLOSED) {
        // Normal closure - call onComplete if we haven't already
        if (!hasCompleted && contentRef.current) {
          hasCompleted = true
          options.onComplete?.(contentRef.current, lastUsage)
        }
        setState(prev => ({
          ...prev,
          isStreaming: false,
        }))
      } else {
        // Error
        setState(prev => ({
          ...prev,
          isStreaming: false,
          error: 'Connection error',
        }))
        options.onError?.('Connection error')
      }
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [options])

  const stopStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setState(prev => ({
      ...prev,
      isStreaming: false,
    }))
  }, [])

  const reset = useCallback(() => {
    stopStream()
    contentRef.current = ''
    setState({
      isStreaming: false,
      content: '',
      error: null,
      usage: null,
      finishReason: null,
    })
  }, [stopStream])

  return {
    ...state,
    startStream,
    stopStream,
    reset,
  }
}
