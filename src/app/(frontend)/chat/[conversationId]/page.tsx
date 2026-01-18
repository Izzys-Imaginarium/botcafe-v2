'use client'

/**
 * Chat Conversation Page
 *
 * The main chat interface for a specific conversation.
 */

import { use } from 'react'
import { ChatView } from '@/modules/chat/ui/views/chat-view'

export const dynamic = 'force-dynamic'

interface ChatConversationPageProps {
  params: Promise<{ conversationId: string }>
}

export default function ChatConversationPage({ params }: ChatConversationPageProps) {
  const { conversationId } = use(params)
  const id = parseInt(conversationId, 10)

  if (isNaN(id)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-destructive">Invalid conversation ID</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      <ChatView conversationId={id} className="flex-1" />
    </div>
  )
}
