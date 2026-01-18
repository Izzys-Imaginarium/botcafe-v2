'use client'

/**
 * Chat Home Page
 *
 * Shows conversation list and allows starting new chats.
 */

import { useRouter } from 'next/navigation'
import { useConversations } from '@/modules/chat/hooks/use-conversations'
import { ConversationList } from '@/modules/chat/ui/components/conversation-list'
import { Button } from '@/components/ui/button'
import { Plus, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export const dynamic = 'force-dynamic'

export default function ChatPage() {
  const router = useRouter()
  const {
    conversations,
    isLoading,
    deleteConversation,
    archiveConversation,
  } = useConversations()

  const handleSelect = (id: number) => {
    router.push(`/chat/${id}`)
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteConversation(id)
      toast.success('Conversation deleted')
    } catch {
      toast.error('Failed to delete conversation')
    }
  }

  const handleArchive = async (id: number) => {
    try {
      await archiveConversation(id)
      toast.success('Conversation archived')
    } catch {
      toast.error('Failed to archive conversation')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Page header */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Chats</h1>
            </div>
            <Button asChild className="gap-2">
              <Link href="/chat/new">
                <Plus className="h-4 w-4" />
                New Chat
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <ConversationList
            conversations={conversations}
            onSelect={handleSelect}
            onDelete={handleDelete}
            onArchive={handleArchive}
            isLoading={isLoading}
            onNewChat={() => router.push('/chat/new')}
          />
        </div>
      </div>
    </div>
  )
}
