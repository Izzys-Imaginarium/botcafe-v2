'use client'

/**
 * Chat Home Client Component
 *
 * Shows conversation list and allows starting new chats.
 */

import { useRouter } from 'next/navigation'
import { useConversations } from '@/modules/chat/hooks/use-conversations'
import { ConversationList } from '@/modules/chat/ui/components/conversation-list'
import { MagicalBackground } from '@/modules/home/ui/components/magical-background'
import { Button } from '@/components/ui/button'
import { Plus, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export function ChatHomeClient() {
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
    <>
      {/* Magical background effects */}
      <MagicalBackground />

      <div className="relative z-10 min-h-screen pt-24">
        {/* Page header */}
        <div className="border-b border-border/30 bg-background/60 backdrop-blur-md sticky top-20 z-10">
          <div className="container mx-auto px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Chats</h1>
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
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-2xl mx-auto">
            <ConversationList
              conversations={conversations}
              onSelect={handleSelect}
              onDelete={handleDelete}
              onArchive={handleArchive}
              isLoading={isLoading}
              showHeader={false}
            />
          </div>
        </div>
      </div>
    </>
  )
}
