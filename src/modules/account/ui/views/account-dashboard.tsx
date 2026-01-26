'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProfileSidebar } from '@/components/profile-sidebar'
import { AccountOverview } from '@/components/account-overview'
import { AccountProfile } from '@/components/account-profile'
import { AccountSecurity } from '@/components/account-security'
import { ApiKeyManagement } from '@/components/api-key-management'
import { MoodJournalView } from '@/modules/wellbeing/ui/views/mood-journal-view'
import { User, Shield, Key, Activity, Heart } from 'lucide-react'

const validTabs = ['overview', 'mood', 'profile', 'security', 'api-keys']

export const AccountDashboard = () => {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const initialTab = tabParam && validTabs.includes(tabParam) ? tabParam : 'overview'
  const [activeTab, setActiveTab] = useState(initialTab)

  // Update active tab when URL parameter changes
  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  return (
    <div className="px-4 lg:px-12 py-8 flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-y-2 lg:gap-y-0 justify-between">
        <h1 className="text-4xl font-display font-bold text-gold-rich">Account</h1>
        <Badge
          variant="secondary"
          className="bg-gold-ancient/20 text-gold-rich border-gold-ancient/30 w-fit"
        >
          Pro Wizard
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <ProfileSidebar />
        </div>

        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 glass-rune border-gold-ancient/30">
              <TabsTrigger value="overview" className="text-xs lg:text-sm">
                <Activity className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="mood" className="text-xs lg:text-sm">
                <Heart className="w-4 h-4 mr-2" />
                Mood
              </TabsTrigger>
              <TabsTrigger value="profile" className="text-xs lg:text-sm">
                <User className="w-4 h-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="security" className="text-xs lg:text-sm">
                <Shield className="w-4 h-4 mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger value="api-keys" className="text-xs lg:text-sm">
                <Key className="w-4 h-4 mr-2" />
                API Keys
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="overview">
                <AccountOverview />
              </TabsContent>

              <TabsContent value="mood">
                <MoodJournalView embedded />
              </TabsContent>

              <TabsContent value="profile">
                <AccountProfile />
              </TabsContent>

              <TabsContent value="security">
                <AccountSecurity />
              </TabsContent>

              <TabsContent value="api-keys">
                <ApiKeyManagement />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
