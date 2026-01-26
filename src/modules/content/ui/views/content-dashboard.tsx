'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MyBots } from '@/components/my-bots'
import { Bot, BookOpen, Brain, User } from 'lucide-react'

// Import embedded versions of content views
import { LorePanel } from '../components/lore-panel'
import { MemoryPanel } from '../components/memory-panel'
import { PersonaPanel } from '../components/persona-panel'

export const ContentDashboard = () => {
  const searchParams = useSearchParams()
  const tabFromUrl = searchParams.get('tab')
  const validTabs = ['my-bots', 'lore', 'memories', 'personas']
  const initialTab = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : 'my-bots'
  const [activeTab, setActiveTab] = useState(initialTab)

  // Update tab when URL changes
  useEffect(() => {
    if (tabFromUrl && validTabs.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl)
    }
  }, [tabFromUrl])

  return (
    <div className="px-5 sm:px-6 lg:px-12 py-8 flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-y-2 lg:gap-y-0 justify-between">
        <h1 className="text-4xl font-display font-bold text-gold-rich">Creator's Workshop</h1>
        <Badge
          variant="secondary"
          className="bg-gold-ancient/20 text-gold-rich border-gold-ancient/30 w-fit"
        >
          Your Content
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-1 h-auto lg:h-9 glass-rune border-gold-ancient/30">
          <TabsTrigger value="my-bots" className="text-xs lg:text-sm py-2 lg:py-1">
            <Bot className="w-4 h-4 mr-2" />
            My Bots
          </TabsTrigger>
          <TabsTrigger value="lore" className="text-xs lg:text-sm py-2 lg:py-1">
            <BookOpen className="w-4 h-4 mr-2" />
            Lore
          </TabsTrigger>
          <TabsTrigger value="memories" className="text-xs lg:text-sm py-2 lg:py-1">
            <Brain className="w-4 h-4 mr-2" />
            Memories
          </TabsTrigger>
          <TabsTrigger value="personas" className="text-xs lg:text-sm py-2 lg:py-1">
            <User className="w-4 h-4 mr-2" />
            Personas
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="my-bots">
            <MyBots />
          </TabsContent>

          <TabsContent value="lore">
            <LorePanel />
          </TabsContent>

          <TabsContent value="memories">
            <MemoryPanel />
          </TabsContent>

          <TabsContent value="personas">
            <PersonaPanel />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
