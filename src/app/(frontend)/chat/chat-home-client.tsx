'use client'

/**
 * Chat Home Client Component
 *
 * Shows conversation list and allows starting new chats.
 */

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useConversations } from '@/modules/chat/hooks/use-conversations'
import { ConversationList } from '@/modules/chat/ui/components/conversation-list'
import { MagicalBackground } from '@/modules/home/ui/components/magical-background'
import { Button } from '@/components/ui/button'
import { Plus, MessageSquare, Archive } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

type StatusTab = 'active' | 'archived'

export function ChatHomeClient() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<StatusTab>('active')

  const {
    conversations,
    isLoading,
    hasMore,
    loadMore,
    deleteConversation,
    archiveConversation,
    refresh,
  } = useConversations({ status: activeTab })

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

  const handleArchive = useCallback(async (id: number) => {
    const currentStatus = activeTab
    try {
      const newStatus = await archiveConversation(id, currentStatus)
      if (newStatus === 'archived') {
        toast.success('Conversation archived')
      } else {
        toast.success('Conversation unarchived')
      }
      refresh()
    } catch {
      toast.error('Failed to update conversation')
    }
  }, [archiveConversation, activeTab, refresh])

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
            {/* Tabs */}
            <div className="flex gap-1 mt-4">
              <button
                onClick={() => setActiveTab('active')}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                  activeTab === 'active'
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                Active
              </button>
              <button
                onClick={() => setActiveTab('archived')}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2',
                  activeTab === 'archived'
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Archive className="h-4 w-4" />
                Archived
              </button>
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
              hasMore={hasMore}
              isLoadingMore={isLoading && conversations.length > 0}
              onLoadMore={loadMore}
              showHeader={false}
            />
          </div>
        </div>
      </div>
    </>
  )
}
