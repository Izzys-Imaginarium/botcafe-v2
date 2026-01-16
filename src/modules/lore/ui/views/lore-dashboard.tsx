'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { BookOpen, Library, Upload, Search, Sparkles, Database, Loader2, FileText, Clock, FolderPlus, Plus } from 'lucide-react'
import Link from 'next/link'

interface KnowledgeEntry {
  id: number
  type: string
  entry: string
  is_vectorized: boolean
  createdAt: string
  knowledge_collection?: {
    id: number
    name: string
  } | number
}

interface KnowledgeCollection {
  id: number
  name: string
  description?: string
}

interface KnowledgeApiResponse {
  success: boolean
  docs: KnowledgeEntry[]
  totalDocs: number
  page: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

interface CollectionsApiResponse {
  success: boolean
  collections: KnowledgeCollection[]
}

interface DashboardStats {
  totalEntries: number
  vectorizedEntries: number
  totalCollections: number
}

export const LoreDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalEntries: 0,
    vectorizedEntries: 0,
    totalCollections: 0,
  })
  const [recentEntries, setRecentEntries] = useState<KnowledgeEntry[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<KnowledgeEntry[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch knowledge entries and collections in parallel
        const [entriesRes, collectionsRes] = await Promise.all([
          fetch('/api/knowledge?limit=100'),
          fetch('/api/knowledge-collections'),
        ])

        const entriesData = await entriesRes.json() as KnowledgeApiResponse
        const collectionsData = await collectionsRes.json() as CollectionsApiResponse

        const entries = entriesData.docs || []
        const collections = collectionsData.collections || []

        // Calculate stats
        const vectorized = entries.filter((e: KnowledgeEntry) => e.is_vectorized).length

        setStats({
          totalEntries: entriesData.totalDocs || entries.length,
          vectorizedEntries: vectorized,
          totalCollections: collections.length,
        })

        // Get recent entries (sorted by createdAt, take first 5)
        const sorted = [...entries].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        setRecentEntries(sorted.slice(0, 5))
      } catch (error) {
        console.error('Error fetching lore data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      // For now, do a simple client-side filter on the search query
      // In the future, this could use a semantic search API
      const res = await fetch('/api/knowledge?limit=100')
      const data = await res.json() as KnowledgeApiResponse
      const entries = data.docs || []

      const filtered = entries.filter((entry: KnowledgeEntry) =>
        entry.entry.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setSearchResults(filtered)
    } catch (error) {
      console.error('Error searching:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getEntryPreview = (entry: string, maxLength = 100) => {
    if (entry.length <= maxLength) return entry
    return entry.substring(0, maxLength) + '...'
  }

  const getCollectionName = (collection: KnowledgeEntry['knowledge_collection']) => {
    if (!collection) return 'No collection'
    if (typeof collection === 'object') return collection.name
    return `Collection #${collection}`
  }

  return (
    <div className="px-4 lg:px-12 py-8 flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-y-4 lg:gap-y-0 justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-display font-bold text-gold-rich">Lore Library</h1>
          <p className="text-parchment/70 font-lore italic">
            Manage your knowledge base and vectorized content
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button asChild className="bg-forest/20 hover:bg-forest/30 text-forest-light border border-forest/30">
            <Link href="/lore/collections?action=create">
              <FolderPlus className="w-4 h-4 mr-2" />
              Create Collection
            </Link>
          </Button>
          <Button asChild className="bg-gold-rich/20 hover:bg-gold-rich/30 text-gold-rich border border-gold-rich/30">
            <Link href="/lore/entries">
              <Plus className="w-4 h-4 mr-2" />
              Create Entry
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-gold-ancient/30 text-parchment hover:bg-gold-ancient/10">
            <Link href="/lore/collections">
              <Library className="w-4 h-4 mr-2" />
              Browse Collections
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
            <div className="text-2xl font-bold text-gold-rich">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalEntries}
            </div>
            <p className="text-xs text-parchment/60">Across all collections</p>
          </CardContent>
        </Card>

        <Card className="glass-rune border-gold-ancient/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-parchment">Vectorized</CardTitle>
            <Sparkles className="h-4 w-4 text-gold-ancient" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gold-rich">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.vectorizedEntries}
            </div>
            <p className="text-xs text-parchment/60">Ready for semantic search</p>
          </CardContent>
        </Card>

        <Card className="glass-rune border-gold-ancient/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-parchment">Collections</CardTitle>
            <Library className="h-4 w-4 text-gold-ancient" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gold-rich">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalCollections}
            </div>
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
                      <div className="w-8 h-8 rounded-full bg-forest/30 flex items-center justify-center shrink-0">
                        <span className="text-forest-light font-bold">1</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-parchment">Create a Collection First</h4>
                        <p className="text-sm text-parchment/60">
                          Collections are required to organize your knowledge entries. Start by creating at least one collection.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gold-rich/20 flex items-center justify-center shrink-0">
                        <span className="text-gold-rich font-bold">2</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-parchment">Add Entries to Collections</h4>
                        <p className="text-sm text-parchment/60">
                          Upload documents or create text entries within your collections
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gold-rich/20 flex items-center justify-center shrink-0">
                        <span className="text-gold-rich font-bold">3</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-parchment">Auto-Vectorization</h4>
                        <p className="text-sm text-parchment/60">
                          Entries using vector or hybrid mode are automatically vectorized on save
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gold-rich/20 flex items-center justify-center shrink-0">
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
                  <div className="flex gap-3 pt-4 flex-wrap">
                    <Button asChild className="bg-forest hover:bg-forest/90 text-parchment">
                      <Link href="/lore/collections?action=create">
                        <FolderPlus className="w-4 h-4 mr-2" />
                        Create Collection
                      </Link>
                    </Button>
                    <Button asChild className="bg-gold-rich hover:bg-gold-rich/90 text-[#0a140a]">
                      <Link href="/lore/entries">
                        <Plus className="w-4 h-4 mr-2" />
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
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-gold-ancient" />
                    </div>
                  ) : recentEntries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <BookOpen className="w-16 h-16 text-gold-ancient/50 mb-4" />
                      <p className="text-parchment/60 font-lore italic">
                        No entries yet. Start building your knowledge base!
                      </p>
                      <Button asChild className="mt-4 bg-gold-rich hover:bg-gold-rich/90 text-[#0a140a]">
                        <Link href="/lore/entries">
                          <BookOpen className="w-4 h-4 mr-2" />
                          Create Your First Entry
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-start gap-4 p-4 rounded-lg bg-obsidian/30 border border-gold-ancient/20 hover:border-gold-ancient/40 transition-colors"
                        >
                          <div className="shrink-0">
                            <FileText className="w-5 h-5 text-gold-ancient" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs border-gold-ancient/30 text-parchment/70">
                                {entry.type}
                              </Badge>
                              {entry.is_vectorized && (
                                <Badge className="text-xs bg-forest/20 text-forest-light border-forest/30">
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  Vectorized
                                </Badge>
                              )}
                              <span className="text-xs text-parchment/50 ml-auto flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDate(entry.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-parchment/80 line-clamp-2">
                              {getEntryPreview(entry.entry, 150)}
                            </p>
                            <p className="text-xs text-parchment/50 mt-1">
                              {getCollectionName(entry.knowledge_collection)}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div className="pt-2">
                        <Button asChild variant="outline" className="w-full border-gold-ancient/30 text-parchment">
                          <Link href="/lore/entries">
                            View All Entries
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="search">
              <Card className="glass-rune border-gold-ancient/30">
                <CardHeader>
                  <CardTitle className="text-parchment">Search Entries</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search your knowledge entries..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="bg-obsidian/30 border-gold-ancient/30 text-parchment placeholder:text-parchment/50"
                    />
                    <Button
                      onClick={handleSearch}
                      disabled={isSearching || !searchQuery.trim()}
                      className="bg-gold-rich hover:bg-gold-rich/90 text-[#0a140a]"
                    >
                      {isSearching ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {searchResults.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-sm text-parchment/60">
                        Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                      </p>
                      {searchResults.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-start gap-4 p-4 rounded-lg bg-obsidian/30 border border-gold-ancient/20 hover:border-gold-ancient/40 transition-colors"
                        >
                          <div className="shrink-0">
                            <FileText className="w-5 h-5 text-gold-ancient" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs border-gold-ancient/30 text-parchment/70">
                                {entry.type}
                              </Badge>
                              {entry.is_vectorized && (
                                <Badge className="text-xs bg-forest/20 text-forest-light border-forest/30">
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  Vectorized
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-parchment/80 line-clamp-3">
                              {getEntryPreview(entry.entry, 200)}
                            </p>
                            <p className="text-xs text-parchment/50 mt-1">
                              {getCollectionName(entry.knowledge_collection)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : searchQuery && !isSearching ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Search className="w-12 h-12 text-gold-ancient/50 mb-3" />
                      <p className="text-parchment/60 font-lore italic">
                        No entries found matching your search
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Search className="w-12 h-12 text-gold-ancient/50 mb-3" />
                      <p className="text-parchment/60 font-lore italic">
                        Enter a search term to find entries in your knowledge base
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
