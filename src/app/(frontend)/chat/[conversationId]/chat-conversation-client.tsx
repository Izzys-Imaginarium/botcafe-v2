'use client'

/**
 * Chat Conversation Client Component
 *
 * The main chat interface for a specific conversation.
 */

import { ChatView } from '@/modules/chat/ui/views/chat-view'

interface ChatConversationClientProps {
  conversationId: number
}

export function ChatConversationClient({ conversationId }: ChatConversationClientProps) {
  return (
    <div className="h-screen flex flex-col">
      <ChatView conversationId={conversationId} className="flex-1" />
    </div>
  )
}

export function InvalidConversationId() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-destructive">Invalid conversation ID</p>
    </div>
  )
}
