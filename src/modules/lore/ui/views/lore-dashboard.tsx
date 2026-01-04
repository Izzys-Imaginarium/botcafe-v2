'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookOpen, Library, Upload, Search, Sparkles, Database } from 'lucide-react'
import Link from 'next/link'

export const LoreDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="px-4 lg:px-12 py-8 flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-y-4 lg:gap-y-0 justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-display font-bold text-gold-rich">Lore Library</h1>
          <p className="text-parchment/70 font-lore italic">
            Manage your knowledge base and vectorized content
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild className="bg-gold-rich/20 hover:bg-gold-rich/30 text-gold-rich border-gold-rich/30">
            <Link href="/lore/entries">
              <BookOpen className="w-4 h-4 mr-2" />
              Entries
            </Link>
          </Button>
          <Button asChild className="bg-forest/20 hover:bg-forest/30 text-forest-light border-forest/30">
            <Link href="/lore/collections">
              <Library className="w-4 h-4 mr-2" />
              Collections
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stats Cards */}
        <Card className="glass-rune border-gold-ancient/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-parchment">Total Entries</CardTitle>
            <BookOpen className="h-4 w-4 text-gold-ancient" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gold-rich">0</div>
            <p className="text-xs text-parchment/60">Across all collections</p>
          </CardContent>
        </Card>

        <Card className="glass-rune border-gold-ancient/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-parchment">Vectorized</CardTitle>
            <Sparkles className="h-4 w-4 text-gold-ancient" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gold-rich">0</div>
            <p className="text-xs text-parchment/60">Ready for semantic search</p>
          </CardContent>
        </Card>

        <Card className="glass-rune border-gold-ancient/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-parchment">Collections</CardTitle>
            <Library className="h-4 w-4 text-gold-ancient" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gold-rich">0</div>
            <p className="text-xs text-parchment/60">Organized knowledge sets</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 glass-rune border-gold-ancient/30">
            <TabsTrigger value="overview">
              <Database className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="recent">
              <BookOpen className="w-4 h-4 mr-2" />
              Recent
            </TabsTrigger>
            <TabsTrigger value="search">
              <Search className="w-4 h-4 mr-2" />
              Search
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="overview">
              <Card className="glass-rune border-gold-ancient/30">
                <CardHeader>
                  <CardTitle className="text-parchment">Getting Started with Lore</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-parchment/80 font-lore">
                    The Lore Library is your personal knowledge base powered by AI embeddings and
                    semantic search. Store documents, notes, and memories that your bots can
                    reference during conversations.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gold-rich/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-gold-rich font-bold">1</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-parchment">Create Collections</h4>
                        <p className="text-sm text-parchment/60">
                          Organize your knowledge into themed collections
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gold-rich/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-gold-rich font-bold">2</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-parchment">Add Entries</h4>
                        <p className="text-sm text-parchment/60">
                          Upload documents or create text entries
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gold-rich/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-gold-rich font-bold">3</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-parchment">Vectorize Content</h4>
                        <p className="text-sm text-parchment/60">
                          Generate embeddings for semantic search
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gold-rich/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-gold-rich font-bold">4</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-parchment">Link to Bots</h4>
                        <p className="text-sm text-parchment/60">
                          Connect knowledge to specific bots for enhanced conversations
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button asChild className="bg-gold-rich hover:bg-gold-rich/90 text-[#0a140a]">
                      <Link href="/lore/entries">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Create Entry
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="border-gold-ancient/30 text-parchment">
                      <Link href="/lore/collections">
                        <Library className="w-4 h-4 mr-2" />
                        Browse Collections
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recent">
              <Card className="glass-rune border-gold-ancient/30">
                <CardHeader>
                  <CardTitle className="text-parchment">Recent Entries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <BookOpen className="w-16 h-16 text-gold-ancient/50 mb-4" />
                    <p className="text-parchment/60 font-lore italic">
                      No entries yet. Start building your knowledge base!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="search">
              <Card className="glass-rune border-gold-ancient/30">
                <CardHeader>
                  <CardTitle className="text-parchment">Semantic Search</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Search className="w-16 h-16 text-gold-ancient/50 mb-4" />
                    <p className="text-parchment/60 font-lore italic">
                      Search functionality will be available once you have vectorized entries
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
