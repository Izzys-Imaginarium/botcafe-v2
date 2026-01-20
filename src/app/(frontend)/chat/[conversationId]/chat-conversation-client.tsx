'use client'

/**
 * Chat Conversation Client Component
 *
 * The main chat interface for a specific conversation.
 */

import { ChatView } from '@/modules/chat/ui/views/chat-view'
import { MagicalBackground } from '@/modules/home/ui/components/magical-background'

interface ChatConversationClientProps {
  conversationId: number
}

export function ChatConversationClient({ conversationId }: ChatConversationClientProps) {
  return (
    <>
      {/* Magical background effects */}
      <MagicalBackground />

      {/*
        Full viewport chat container
        - fixed inset-0: fills the entire viewport
        - top-20: accounts for navbar height (80px = 5rem = 20 in tailwind)
        - z-10: above the background
        - overflow-hidden: prevents any page scrolling
      */}
      <div className="fixed top-20 left-0 right-0 bottom-0 z-10 flex flex-col overflow-hidden">
        <ChatView conversationId={conversationId} className="flex-1 min-h-0" />
      </div>
    </>
  )
}

export function InvalidConversationId() {
  return (
    <>
      <MagicalBackground />
      <div className="relative z-10 min-h-screen flex items-center justify-center pt-20">
        <p className="text-destructive">Invalid conversation ID</p>
      </div>
    </>
  )
}
