'use client'

import { useState, useEffect, useCallback } from 'react'
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
  Loader2,
  MessageSquare,
  Bot,
  Clock,
  Sparkles,
  CheckCircle,
  ArrowUpCircle,
  Trash2,
  Search,
  Pencil,
  Plus,
  AlertTriangle,
  Zap,
  BookOpen
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import Link from 'next/link'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useInfiniteList } from '@/hooks/use-infinite-list'
import { InfiniteScrollTrigger } from '@/components/ui/infinite-scroll-trigger'

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
  } | Array<{ id: string; name: string }> // Can be array for multi-bot memories
  lore_entry?: {
    id: string
  }
  participants?: {
    personas?: string[]
    bots?: string[]
  }
  // New fields for unified memory display
  _sourceType?: 'memory' | 'knowledge' // Source collection type
  _knowledgeId?: number // Original knowledge ID if from knowledge collection
  knowledge_collection?: {
    id: number
    name: string
  } | number // Linked tome for auto-generated memories
}

export const MemoryLibraryView = () => {
  const router = useRouter()

  // Filter state
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all') // 'all', 'manual', 'auto'
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Use infinite list hook for memories
  const {
    items: memories,
    isLoading,
    isLoadingMore,
    hasMore,
    total: totalMemories,
    loadMore,
    refresh,
    setParams,
  } = useInfiniteList<Memory>({
    endpoint: '/api/memories',
    limit: 500,
    initialParams: {},
    itemsKey: 'memories',
  })

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Update API params when filters change
  useEffect(() => {
    const params: Record<string, string> = {}

    if (typeFilter !== 'all') {
      params.type = typeFilter
    }

    if (sourceFilter === 'manual') {
      params.source = 'memory'
    } else if (sourceFilter === 'auto') {
      params.source = 'knowledge'
    }

    if (statusFilter === 'converted') {
      params.convertedToLore = 'true'
    } else if (statusFilter === 'not_converted') {
      params.convertedToLore = 'false'
    }

    if (debouncedSearch) {
      params.search = debouncedSearch
    }

    setParams(params)
  }, [typeFilter, sourceFilter, statusFilter, debouncedSearch, setParams])

  // Apply client-side filter for vectorized (not supported by API yet)
  const filteredMemories = statusFilter === 'vectorized'
    ? memories.filter(m => m.is_vectorized)
    : memories

  // Conversion dialog state
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false)
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  const [knowledgeCollections, setKnowledgeCollections] = useState<any[]>([])
  const [selectedCollectionId, setSelectedCollectionId] = useState('')

  // Edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null)
  const [editEntry, setEditEntry] = useState('')
  const [editType, setEditType] = useState<string>('short_term')
  const [editImportance, setEditImportance] = useState(5)
  const [editEmotionalContext, setEditEmotionalContext] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingMemory, setDeletingMemory] = useState<Memory | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Create dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [createEntry, setCreateEntry] = useState('')
  const [createType, setCreateType] = useState<string>('short_term')
  const [createImportance, setCreateImportance] = useState(5)
  const [createEmotionalContext, setCreateEmotionalContext] = useState('')
  const [createBotId, setCreateBotId] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [availableBots, setAvailableBots] = useState<{ id: string; name: string }[]>([])

  // Fetch supporting data on mount
  useEffect(() => {
    fetchKnowledgeCollections()
    fetchAvailableBots()
  }, [])

  const fetchAvailableBots = async () => {
    try {
      const response = await fetch('/api/bots/my-bots')
      const data = (await response.json()) as { success?: boolean; bots?: { id: string; name: string }[] }
      if (data.success && data.bots) {
        setAvailableBots(data.bots)
      }
    } catch (error) {
      console.error('Error fetching bots:', error)
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
        refresh()
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
        refresh()
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

  // Edit handlers
  const openEditDialog = (memory: Memory) => {
    setEditingMemory(memory)
    setEditEntry(memory.entry)
    setEditType(memory.type)
    setEditImportance(memory.importance || 5)
    setEditEmotionalContext(memory.emotional_context || '')
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingMemory || !editEntry.trim()) {
      toast.error('Memory content is required')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch(`/api/memories/${editingMemory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry: editEntry.trim(),
          type: editType,
          importance: editImportance,
          emotional_context: editEmotionalContext || null,
        }),
      })

      const data = (await response.json()) as { success?: boolean; message?: string }

      if (data.success) {
        toast.success('Memory updated successfully')
        setIsEditDialogOpen(false)
        setEditingMemory(null)
        refresh()
      } else {
        toast.error(data.message || 'Failed to update memory')
      }
    } catch (error) {
      console.error('Edit error:', error)
      toast.error('An error occurred while updating')
    } finally {
      setIsSaving(false)
    }
  }

  // Delete handlers
  const openDeleteDialog = (memory: Memory) => {
    setDeletingMemory(memory)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingMemory) return

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/memories/${deletingMemory.id}`, {
        method: 'DELETE',
      })

      const data = (await response.json()) as { success?: boolean; message?: string }

      if (data.success) {
        toast.success('Memory deleted successfully')
        setIsDeleteDialogOpen(false)
        setDeletingMemory(null)
        refresh()
      } else {
        toast.error(data.message || 'Failed to delete memory')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('An error occurred while deleting')
    } finally {
      setIsDeleting(false)
    }
  }

  // Create handlers
  const openCreateDialog = () => {
    setCreateEntry('')
    setCreateType('short_term')
    setCreateImportance(5)
    setCreateEmotionalContext('')
    setCreateBotId('')
    setIsCreateDialogOpen(true)
  }

  const handleCreate = async () => {
    if (!createEntry.trim()) {
      toast.error('Memory content is required')
      return
    }

    if (!createBotId) {
      toast.error('Please select a bot')
      return
    }

    setIsCreating(true)

    try {
      const response = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry: createEntry.trim(),
          botId: createBotId,
          type: createType,
          importance: createImportance,
          emotional_context: createEmotionalContext || null,
        }),
      })

      const data = (await response.json()) as { success?: boolean; message?: string }

      if (data.success) {
        toast.success('Memory created successfully')
        setIsCreateDialogOpen(false)
        refresh()
      } else {
        toast.error(data.message || 'Failed to create memory')
      }
    } catch (error) {
      console.error('Create error:', error)
      toast.error('An error occurred while creating')
    } finally {
      setIsCreating(false)
    }
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
          <div className="flex gap-2">
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Create Memory
            </Button>
            <Link href="/memories/import">
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Memories</p>
                  <p className="text-2xl font-bold">{totalMemories}</p>
                </div>
                <Brain className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Auto-generated</p>
                  <p className="text-2xl font-bold">
                    {memories.filter(m => m._sourceType === 'knowledge').length}
                  </p>
                </div>
                <Zap className="h-8 w-8 text-orange-400" />
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

              <div className="space-y-2">
                <Label>Source</Label>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="manual">Manual / Imported</SelectItem>
                    <SelectItem value="auto">Auto-generated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setTypeFilter('all')
                  setStatusFilter('all')
                  setSourceFilter('all')
                  setSearchQuery('')
                }}
              >
                Clear Filters
              </Button>
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
          {filteredMemories.map((memory) => {
            const isAutoGenerated = memory._sourceType === 'knowledge'
            // Get bot name(s) - handle both single bot and array
            const botNames = Array.isArray(memory.bot)
              ? memory.bot.map(b => b.name).filter(Boolean).join(', ')
              : memory.bot?.name
            // Get tome name for auto-generated memories
            const tomeName = typeof memory.knowledge_collection === 'object'
              ? memory.knowledge_collection?.name
              : undefined

            return (
              <Card key={memory.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={getMemoryTypeBadgeVariant(memory.type)}>
                          {getMemoryTypeLabel(memory.type)}
                        </Badge>
                        {isAutoGenerated && (
                          <Badge variant="secondary" className="bg-orange-500/10 text-orange-500">
                            <Zap className="mr-1 h-3 w-3" />
                            Auto-generated
                          </Badge>
                        )}
                        {memory.converted_to_lore && !isAutoGenerated && (
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
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        {botNames && (
                          <div className="flex items-center gap-1">
                            <Bot className="h-3 w-3" />
                            {botNames}
                          </div>
                        )}
                        {tomeName && (
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {tomeName}
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
                <CardFooter className="flex gap-2 flex-wrap">
                  {/* Auto-generated memories are managed via tomes, not edited here */}
                  {!isAutoGenerated && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(memory)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
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
                    </>
                  )}
                  {/* View in tome for auto-generated memories */}
                  {isAutoGenerated && memory._knowledgeId && (
                    <Link href={`/lore/entries?id=${memory._knowledgeId}`}>
                      <Button variant="outline" size="sm">
                        <BookOpen className="mr-2 h-4 w-4" />
                        View in Tome
                      </Button>
                    </Link>
                  )}
                  {/* View lore entry for manually converted memories */}
                  {memory.converted_to_lore && memory.lore_entry && !isAutoGenerated && (
                    <Link href={`/lore/entries?id=${memory.lore_entry.id}`}>
                      <Button variant="outline" size="sm">
                        View Lore Entry
                      </Button>
                    </Link>
                  )}
                  {/* Only show delete for non-auto-generated memories */}
                  {!isAutoGenerated && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
                      onClick={() => openDeleteDialog(memory)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })}

          {/* Only show infinite scroll trigger when not filtering by vectorized (client-side filter) */}
          {statusFilter !== 'vectorized' && (
            <InfiniteScrollTrigger
              onLoadMore={loadMore}
              hasMore={hasMore}
              isLoading={isLoadingMore}
              endMessage="You've seen all your memories!"
            />
          )}
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

      {/* Edit Memory Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Memory</DialogTitle>
            <DialogDescription>
              Update the content and settings of this memory
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Memory Content</Label>
              <Textarea
                value={editEntry}
                onChange={(e) => setEditEntry(e.target.value)}
                placeholder="Enter memory content..."
                className="min-h-[150px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={editType} onValueChange={setEditType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short_term">Short Term</SelectItem>
                    <SelectItem value="long_term">Long Term</SelectItem>
                    <SelectItem value="consolidated">Consolidated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Importance ({editImportance}/10)</Label>
                <Slider
                  value={[editImportance]}
                  onValueChange={(v) => setEditImportance(v[0])}
                  min={1}
                  max={10}
                  step={1}
                  className="py-4"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Emotional Context (optional)</Label>
              <Input
                value={editEmotionalContext}
                onChange={(e) => setEditEmotionalContext(e.target.value)}
                placeholder="e.g., happy, reflective, curious..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={!editEntry.trim() || isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Memory Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Memory
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this memory? This action cannot be undone.
              {deletingMemory?.is_vectorized && (
                <span className="block mt-2 text-yellow-500">
                  Note: Associated vector records will also be deleted.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {deletingMemory && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm whitespace-pre-wrap line-clamp-4">
                {deletingMemory.entry}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Memory
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Memory Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Memory</DialogTitle>
            <DialogDescription>
              Add a new memory entry to your library
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Bot *</Label>
              <Select value={createBotId} onValueChange={setCreateBotId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a bot..." />
                </SelectTrigger>
                <SelectContent>
                  {availableBots.map((bot) => (
                    <SelectItem key={bot.id} value={bot.id}>
                      {bot.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableBots.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  You need to create a bot first before adding memories.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Memory Content *</Label>
              <Textarea
                value={createEntry}
                onChange={(e) => setCreateEntry(e.target.value)}
                placeholder="Enter memory content..."
                className="min-h-[150px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={createType} onValueChange={setCreateType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short_term">Short Term</SelectItem>
                    <SelectItem value="long_term">Long Term</SelectItem>
                    <SelectItem value="consolidated">Consolidated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Importance ({createImportance}/10)</Label>
                <Slider
                  value={[createImportance]}
                  onValueChange={(v) => setCreateImportance(v[0])}
                  min={1}
                  max={10}
                  step={1}
                  className="py-4"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Emotional Context (optional)</Label>
              <Input
                value={createEmotionalContext}
                onChange={(e) => setCreateEmotionalContext(e.target.value)}
                placeholder="e.g., happy, reflective, curious..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!createEntry.trim() || !createBotId || isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Memory
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
