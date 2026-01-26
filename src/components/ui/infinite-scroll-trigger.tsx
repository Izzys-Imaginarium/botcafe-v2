'use client'

/**
 * InfiniteScrollTrigger Component
 *
 * Uses IntersectionObserver to trigger loadMore when the element becomes visible.
 * Place at the bottom of your list to trigger loading more items.
 */

import { useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'

export interface InfiniteScrollTriggerProps {
  onLoadMore: () => void
  hasMore: boolean
  isLoading: boolean
  /** Distance from viewport to trigger load (default: 200px) */
  rootMargin?: string
  /** Custom loading component */
  loader?: React.ReactNode
  /** Message to show when no more items */
  endMessage?: React.ReactNode
  /** Show end message (default: true) */
  showEndMessage?: boolean
}

export function InfiniteScrollTrigger({
  onLoadMore,
  hasMore,
  isLoading,
  rootMargin = '200px',
  loader,
  endMessage,
  showEndMessage = true,
}: InfiniteScrollTriggerProps) {
  const triggerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = triggerRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && hasMore && !isLoading) {
          onLoadMore()
        }
      },
      {
        rootMargin,
        threshold: 0.1,
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [hasMore, isLoading, onLoadMore, rootMargin])

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        {loader || <Loader2 className="h-6 w-6 animate-spin text-gold-rich" />}
      </div>
    )
  }

  // Show end message when no more items
  if (!hasMore && showEndMessage) {
    return (
      <div className="flex justify-center py-6 text-sm text-parchment-dim">
        {endMessage || "You've reached the end"}
      </div>
    )
  }

  // Invisible trigger element
  return <div ref={triggerRef} className="h-1" aria-hidden="true" />
}
