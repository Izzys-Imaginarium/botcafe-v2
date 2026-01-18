/**
 * Chat Conversation Page
 *
 * Server component wrapper to prevent static prerendering.
 */

import { ChatConversationClient, InvalidConversationId } from './chat-conversation-client'

export const dynamic = 'force-dynamic'

interface ChatConversationPageProps {
  params: Promise<{ conversationId: string }>
}

export default async function ChatConversationPage({ params }: ChatConversationPageProps) {
  const { conversationId } = await params
  const id = parseInt(conversationId, 10)

  if (isNaN(id)) {
    return <InvalidConversationId />
  }

  return <ChatConversationClient conversationId={id} />
}
