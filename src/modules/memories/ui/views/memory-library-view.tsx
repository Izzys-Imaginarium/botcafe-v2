'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import {
  Brain,
  Upload,
  Filter,
  Loader2,
  MessageSquare,
  Bot,
  Clock,
  Sparkles,
  CheckCircle,
  ArrowUpCircle,
  Trash2,
  Search
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Memory {
  id: string
  entry: string
  type: 'short_term' | 'long_term' | 'consolidated'
  tokens: number
  created_timestamp: string
  is_vectorized: boolean
  converted_to_lore: boolean
  importance?: number
  emotional_context?: string
  bot?: {
    id: string
    name: string
  }
  lore_entry?: {
    id: string
  }
  participants?: {
    personas?: string[]
    bots?: string[]
  }
}

export const MemoryLibraryView = () => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [memories, setMemories] = useState<Memory[]>([])
  const [filteredMemories, setFilteredMemories] = useState<Memory[]>([])

  // Filter state
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Conversion dialog state
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false)
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  const [knowledgeCollections, setKnowledgeCollections] = useState<any[]>([])
  const [selectedCollectionId, setSelectedCollectionId] = useState('')

  // Fetch memories on mount
  useEffect(() => {
    fetchMemories()
    fetchKnowledgeCollections()
  }, [])

  // Apply filters when memories or filter state changes
  useEffect(() => {
    applyFilters()
  }, [memories, typeFilter, statusFilter, searchQuery])

  const fetchMemories = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/memories?limit=100')
      const data = (await response.json()) as { success?: boolean; memories?: Memory[]; message?: string }

      if (data.success) {
        setMemories(data.memories || [])
      } else {
        toast.error(data.message || 'Failed to fetch memories')
      }
    } catch (error) {
      console.error('Error fetching memories:', error)
      toast.error('Failed to fetch memories')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchKnowledgeCollections = async () => {
    try {
      const response = await fetch('/api/knowledge-collections')
      const data = (await response.json()) as { success?: boolean; collections?: any[]; message?: string }

      if (data.success) {
        setKnowledgeCollections(data.collections || [])
      }
    } catch (error) {
      console.error('Error fetching knowledge collections:', error)
    }
  }

  const applyFilters = () => {
    let filtered = [...memories]

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(m => m.type === typeFilter)
    }

    // Status filter
    if (statusFilter === 'converted') {
      filtered = filtered.filter(m => m.converted_to_lore)
    } else if (statusFilter === 'not_converted') {
      filtered = filtered.filter(m => !m.converted_to_lore)
    } else if (statusFilter === 'vectorized') {
      filtered = filtered.filter(m => m.is_vectorized)
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(m =>
        m.entry.toLowerCase().includes(query) ||
        m.bot?.name.toLowerCase().includes(query)
      )
    }

    setFilteredMemories(filtered)
  }

  const handleConvertToLore = async () => {
    if (!selectedMemory || !selectedCollectionId) {
      toast.error('Please select a knowledge collection')
      return
    }

    setIsConverting(true)

    try {
      const response = await fetch('/api/memories/convert-to-lore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memoryId: selectedMemory.id,
          collectionId: selectedCollectionId,
        }),
      })

      const data = (await response.json()) as { success?: boolean; message?: string }

      if (data.success) {
        toast.success('Memory converted to lore successfully!')
        setIsConvertDialogOpen(false)
        setSelectedMemory(null)
        setSelectedCollectionId('')

        // Refresh memories
        fetchMemories()
      } else {
        toast.error(data.message || 'Failed to convert memory to lore')
      }
    } catch (error) {
      console.error('Convert error:', error)
      toast.error('An error occurred while converting')
    } finally {
      setIsConverting(false)
    }
  }

  const handleVectorize = async (memoryId: string) => {
    try {
      const response = await fetch('/api/memories/vectorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memoryId }),
      })

      const data = (await response.json()) as { success?: boolean; chunkCount?: number; message?: string }

      if (data.success) {
        toast.success(`Memory vectorized with ${data.chunkCount} chunks`)
        fetchMemories()
      } else {
        toast.error(data.message || 'Failed to vectorize memory')
      }
    } catch (error) {
      console.error('Vectorize error:', error)
      toast.error('An error occurred while vectorizing')
    }
  }

  const openConvertDialog = (memory: Memory) => {
    setSelectedMemory(memory)
    setIsConvertDialogOpen(true)
  }

  const getMemoryTypeLabel = (type: string) => {
    switch (type) {
      case 'short_term':
        return 'Short Term'
      case 'long_term':
        return 'Long Term'
      case 'consolidated':
        return 'Consolidated'
      default:
        return type
    }
  }

  const getMemoryTypeBadgeVariant = (type: string): "default" | "secondary" | "outline" => {
    switch (type) {
      case 'long_term':
        return 'default'
      case 'consolidated':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Memory Library
            </h1>
            <p className="text-muted-foreground">
              Browse and manage your conversation memories
            </p>
          </div>
          <Link href="/memories/import">
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Import Memories
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Memories</p>
                  <p className="text-2xl font-bold">{memories.length}</p>
                </div>
                <Brain className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Long Term</p>
                  <p className="text-2xl font-bold">
                    {memories.filter(m => m.type === 'long_term').length}
                  </p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Converted to Lore</p>
                  <p className="text-2xl font-bold">
                    {memories.filter(m => m.converted_to_lore).length}
                  </p>
                </div>
                <Sparkles className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Vectorized</p>
                  <p className="text-2xl font-bold">
                    {memories.filter(m => m.is_vectorized).length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search memories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="short_term">Short Term</SelectItem>
                    <SelectItem value="long_term">Long Term</SelectItem>
                    <SelectItem value="consolidated">Consolidated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="converted">Converted to Lore</SelectItem>
                    <SelectItem value="not_converted">Not Converted</SelectItem>
                    <SelectItem value="vectorized">Vectorized</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setTypeFilter('all')
                    setStatusFilter('all')
                    setSearchQuery('')
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Memory List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredMemories.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No memories found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Import your first conversation to get started'}
              </p>
              <Link href="/memories/import">
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Import Memories
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredMemories.map((memory) => (
            <Card key={memory.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={getMemoryTypeBadgeVariant(memory.type)}>
                        {getMemoryTypeLabel(memory.type)}
                      </Badge>
                      {memory.converted_to_lore && (
                        <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500">
                          <Sparkles className="mr-1 h-3 w-3" />
                          Converted to Lore
                        </Badge>
                      )}
                      {memory.is_vectorized && (
                        <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Vectorized
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {memory.bot && (
                        <div className="flex items-center gap-1">
                          <Bot className="h-3 w-3" />
                          {memory.bot.name}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(memory.created_timestamp).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        {memory.tokens} tokens
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap line-clamp-4">
                  {memory.entry}
                </p>
              </CardContent>
              <CardFooter className="flex gap-2">
                {!memory.converted_to_lore && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openConvertDialog(memory)}
                  >
                    <ArrowUpCircle className="mr-2 h-4 w-4" />
                    Convert to Lore
                  </Button>
                )}
                {!memory.is_vectorized && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVectorize(memory.id)}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Vectorize
                  </Button>
                )}
                {memory.converted_to_lore && memory.lore_entry && (
                  <Link href={`/lore/entries?id=${memory.lore_entry.id}`}>
                    <Button variant="outline" size="sm">
                      View Lore Entry
                    </Button>
                  </Link>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Convert to Lore Dialog */}
      <Dialog open={isConvertDialogOpen} onOpenChange={setIsConvertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert Memory to Lore</DialogTitle>
            <DialogDescription>
              Select a knowledge collection to save this memory as permanent lore
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Knowledge Collection</Label>
              <Select value={selectedCollectionId} onValueChange={setSelectedCollectionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a collection" />
                </SelectTrigger>
                <SelectContent>
                  {knowledgeCollections.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id}>
                      {collection.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedMemory && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-semibold mb-2">Memory Preview:</p>
                <p className="text-sm whitespace-pre-wrap line-clamp-4">
                  {selectedMemory.entry}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConvertDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConvertToLore}
              disabled={!selectedCollectionId || isConverting}
            >
              {isConverting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <ArrowUpCircle className="mr-2 h-4 w-4" />
                  Convert to Lore
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
