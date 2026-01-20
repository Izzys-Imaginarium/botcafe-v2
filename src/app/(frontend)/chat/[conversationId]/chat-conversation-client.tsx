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

      <div className="relative z-10 h-screen flex flex-col pt-20">
        <ChatView conversationId={conversationId} className="flex-1" />
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
