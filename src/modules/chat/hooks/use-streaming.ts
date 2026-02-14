'use client'

/**
 * useStreaming Hook
 *
 * Manages SSE connection for streaming LLM responses.
 * Supports both content and reasoning/thinking streams.
 */

import { useState, useCallback, useRef, useEffect } from 'react'

export interface StreamingState {
  isStreaming: boolean
  content: string
  reasoning: string
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
  onReasoning?: (reasoning: string) => void
  onComplete?: (fullContent: string, usage: StreamingState['usage'], fullReasoning: string) => void
  onError?: (error: string) => void
}

export function useStreaming(options: UseStreamingOptions = {}) {
  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    content: '',
    reasoning: '',
    error: null,
    usage: null,
    finishReason: null,
  })

  const eventSourceRef = useRef<EventSource | null>(null)
  const contentRef = useRef('')
  const reasoningRef = useRef('')

  // Use refs to always call the latest callbacks (avoids stale closure issues)
  const onChunkRef = useRef(options.onChunk)
  const onReasoningRef = useRef(options.onReasoning)
  const onCompleteRef = useRef(options.onComplete)
  const onErrorRef = useRef(options.onError)

  // Keep refs updated with latest callbacks
  useEffect(() => {
    onChunkRef.current = options.onChunk
    onReasoningRef.current = options.onReasoning
    onCompleteRef.current = options.onComplete
    onErrorRef.current = options.onError
  }, [options.onChunk, options.onReasoning, options.onComplete, options.onError])

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
    reasoningRef.current = ''
    let hasCompleted = false
    let lastUsage: StreamingState['usage'] = null

    setState({
      isStreaming: true,
      content: '',
      reasoning: '',
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
          onErrorRef.current?.(data.message || 'Stream error')
          eventSource.close()
          return
        }

        switch (data.type) {
          case 'start':
            // Stream started, we can show model info if needed
            break

          case 'reasoning':
            if (data.content) {
              reasoningRef.current += data.content
              setState(prev => ({
                ...prev,
                reasoning: reasoningRef.current,
              }))
              onReasoningRef.current?.(data.content)
            }
            break

          case 'chunk':
            if (data.content) {
              contentRef.current += data.content
              setState(prev => ({
                ...prev,
                content: contentRef.current,
              }))
              onChunkRef.current?.(data.content)
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
            onCompleteRef.current?.(contentRef.current, data.usage || null, reasoningRef.current)
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
          onCompleteRef.current?.(contentRef.current, lastUsage, reasoningRef.current)
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
        onErrorRef.current?.('Connection error')
      }
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, []) // No dependencies - uses refs for callbacks

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
    reasoningRef.current = ''
    setState({
      isStreaming: false,
      content: '',
      reasoning: '',
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
