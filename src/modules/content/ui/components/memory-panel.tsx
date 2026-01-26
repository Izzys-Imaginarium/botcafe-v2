'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  Brain,
  Upload,
  Loader2,
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
  BookOpen,
  ChevronDown,
  ChevronRight,
  BookMarked,
  X,
  ArrowUpDown,
  SortAsc,
  SortDesc,
  Filter,
  Edit,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface MemoryTome {
  id: string
  name: string
  description?: string
  entry_count?: number
  total_tokens?: number
  createdAt?: string
}

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
  } | Array<{ id: string; name: string }>
  lore_entry?: {
    id: string
  }
  participants?: {
    personas?: string[]
    bots?: string[]
  }
  _sourceType?: 'memory' | 'knowledge'
  _knowledgeId?: number
  knowledge_collection?: {
    id: number
    name: string
  } | number
}

export const MemoryPanel = () => {
  // Tome state
  const [tomes, setTomes] = useState<MemoryTome[]>([])
  const [isLoadingTomes, setIsLoadingTomes] = useState(true)
  const [expandedTomeId, setExpandedTomeId] = useState<string | null>(null)
  const [tomeEntries, setTomeEntries] = useState<Record<string, Memory[]>>({})
  const [loadingEntriesForTome, setLoadingEntriesForTome] = useState<string | null>(null)

  // Search and sort state
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'entry_count'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Filter state
  const [filterHasEntries, setFilterHasEntries] = useState<'all' | 'with_entries' | 'empty'>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Create tome state
  const [isCreateTomeOpen, setIsCreateTomeOpen] = useState(false)
  const [isCreatingTome, setIsCreatingTome] = useState(false)
  const [newTomeName, setNewTomeName] = useState('')
  const [newTomeDescription, setNewTomeDescription] = useState('')

  // Edit tome state
  const [isEditTomeOpen, setIsEditTomeOpen] = useState(false)
  const [isUpdatingTome, setIsUpdatingTome] = useState(false)
  const [editingTome, setEditingTome] = useState<MemoryTome | null>(null)
  const [editTomeName, setEditTomeName] = useState('')
  const [editTomeDescription, setEditTomeDescription] = useState('')

  // Knowledge collections (for convert to lore)
  const [knowledgeCollections, setKnowledgeCollections] = useState<any[]>([])

  // Conversion dialog state
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false)
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)
  const [isConverting, setIsConverting] = useState(false)
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

  // Create memory state (inline form)
  const [showCreateMemory, setShowCreateMemory] = useState<string | null>(null)
  const [isCreatingMemory, setIsCreatingMemory] = useState(false)
  const [createEntry, setCreateEntry] = useState('')
  const [createType, setCreateType] = useState<string>('short_term')
  const [createImportance, setCreateImportance] = useState(5)
  const [createEmotionalContext, setCreateEmotionalContext] = useState('')
  const [createBotId, setCreateBotId] = useState('none')
  const [availableBots, setAvailableBots] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    fetchMemoryTomes()
    fetchKnowledgeCollections()
    fetchAvailableBots()
  }, [])

  // Filter and sort tomes
  const filteredAndSortedTomes = useMemo(() => {
    let result = [...tomes]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (tome) =>
          tome.name.toLowerCase().includes(query) ||
          (tome.description && tome.description.toLowerCase().includes(query))
      )
    }

    if (filterHasEntries === 'with_entries') {
      result = result.filter((tome) => (tome.entry_count || 0) > 0)
    } else if (filterHasEntries === 'empty') {
      result = result.filter((tome) => (tome.entry_count || 0) === 0)
    }

    result.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'createdAt':
          comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
          break
        case 'entry_count':
          comparison = (a.entry_count || 0) - (b.entry_count || 0)
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return result
  }, [tomes, searchQuery, sortBy, sortOrder, filterHasEntries])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filterHasEntries !== 'all') count++
    return count
  }, [filterHasEntries])

  const fetchMemoryTomes = async () => {
    setIsLoadingTomes(true)
    try {
      const response = await fetch('/api/knowledge-collections?onlyMemoryTomes=true')
      const data = (await response.json()) as { success?: boolean; collections?: MemoryTome[]; message?: string }

      if (data.success) {
        setTomes(data.collections || [])
      } else {
        toast.error(data.message || 'Failed to fetch memory tomes')
      }
    } catch (error) {
      console.error('Error fetching memory tomes:', error)
      toast.error('Failed to fetch memory tomes')
    } finally {
      setIsLoadingTomes(false)
    }
  }

  const fetchEntriesForTome = async (tomeId: string) => {
    setLoadingEntriesForTome(tomeId)
    try {
      const response = await fetch(`/api/memories?collectionId=${tomeId}&limit=100`)
      const data = (await response.json()) as {
        success?: boolean
        memories?: Memory[]
        message?: string
      }

      if (data.success) {
        setTomeEntries(prev => ({ ...prev, [tomeId]: data.memories || [] }))
      } else {
        toast.error(data.message || 'Failed to fetch memories')
      }
    } catch (error) {
      console.error('Error fetching memories:', error)
      toast.error('Failed to fetch memories')
    } finally {
      setLoadingEntriesForTome(null)
    }
  }

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

  const handleToggleTome = async (tomeId: string) => {
    if (expandedTomeId === tomeId) {
      setExpandedTomeId(null)
      setShowCreateMemory(null)
    } else {
      setExpandedTomeId(tomeId)
      setShowCreateMemory(null)
      if (!tomeEntries[tomeId]) {
        await fetchEntriesForTome(tomeId)
      }
    }
  }

  const handleCreateTome = async () => {
    if (!newTomeName) {
      toast.error('Please enter a tome name')
      return
    }

    setIsCreatingTome(true)
    try {
      const response = await fetch('/api/knowledge-collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTomeName,
          description: newTomeDescription,
          collection_metadata: {
            collection_category: 'memories',
          },
        }),
      })

      const data = (await response.json()) as { success?: boolean; collection?: MemoryTome; message?: string }

      if (data.success) {
        toast.success('Memory tome created successfully!')
        setNewTomeName('')
        setNewTomeDescription('')
        setIsCreateTomeOpen(false)
        fetchMemoryTomes()
      } else {
        toast.error(data.message || 'Failed to create tome')
      }
    } catch (error: any) {
      console.error('Error creating tome:', error)
      toast.error(error.message || 'Failed to create tome')
    } finally {
      setIsCreatingTome(false)
    }
  }

  const handleUpdateTome = async () => {
    if (!editingTome || !editTomeName) {
      toast.error('Please enter a tome name')
      return
    }

    setIsUpdatingTome(true)
    try {
      const response = await fetch(`/api/knowledge-collections/${editingTome.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editTomeName,
          description: editTomeDescription,
        }),
      })

      const data = (await response.json()) as { success?: boolean; collection?: MemoryTome; message?: string }

      if (data.success) {
        toast.success('Tome updated successfully!')
        setIsEditTomeOpen(false)
        setEditingTome(null)
        fetchMemoryTomes()
      } else {
        toast.error(data.message || 'Failed to update tome')
      }
    } catch (error: any) {
      console.error('Error updating tome:', error)
      toast.error(error.message || 'Failed to update tome')
    } finally {
      setIsUpdatingTome(false)
    }
  }

  const handleDeleteTome = async (id: string) => {
    if (!confirm('Are you sure you want to delete this memory tome? All memories will be removed.')) {
      return
    }

    try {
      const response = await fetch(`/api/knowledge-collections/${id}`, {
        method: 'DELETE',
      })

      const data = (await response.json()) as { success?: boolean; message?: string }

      if (data.success) {
        toast.success('Memory tome deleted successfully!')
        if (expandedTomeId === id) {
          setExpandedTomeId(null)
        }
        fetchMemoryTomes()
      } else {
        toast.error(data.message || 'Failed to delete tome')
      }
    } catch (error) {
      console.error('Error deleting tome:', error)
      toast.error('Failed to delete tome')
    }
  }

  const openEditTome = (tome: MemoryTome) => {
    setEditingTome(tome)
    setEditTomeName(tome.name)
    setEditTomeDescription(tome.description || '')
    setIsEditTomeOpen(true)
  }

  const handleCreateMemory = async (tomeId: string) => {
    if (!createEntry.trim()) {
      toast.error('Memory content is required')
      return
    }

    setIsCreatingMemory(true)

    try {
      const response = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry: createEntry.trim(),
          botId: createBotId === 'none' ? undefined : createBotId,
          type: createType,
          importance: createImportance,
          emotional_context: createEmotionalContext || null,
          collectionId: tomeId,
        }),
      })

      const data = (await response.json()) as { success?: boolean; message?: string }

      if (data.success) {
        toast.success('Memory created successfully')
        setCreateEntry('')
        setCreateType('short_term')
        setCreateImportance(5)
        setCreateEmotionalContext('')
        setCreateBotId('')
        setShowCreateMemory(null)
        await fetchEntriesForTome(tomeId)
        fetchMemoryTomes()
      } else {
        toast.error(data.message || 'Failed to create memory')
      }
    } catch (error) {
      console.error('Create error:', error)
      toast.error('An error occurred while creating')
    } finally {
      setIsCreatingMemory(false)
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
        headers: { 'Content-Type': 'application/json' },
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
        if (expandedTomeId) {
          await fetchEntriesForTome(expandedTomeId)
        }
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memoryId }),
      })

      const data = (await response.json()) as { success?: boolean; chunkCount?: number; message?: string }

      if (data.success) {
        toast.success(`Memory vectorized with ${data.chunkCount} chunks`)
        if (expandedTomeId) {
          await fetchEntriesForTome(expandedTomeId)
        }
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
        if (expandedTomeId) {
          await fetchEntriesForTome(expandedTomeId)
        }
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
        if (expandedTomeId) {
          await fetchEntriesForTome(expandedTomeId)
        }
        fetchMemoryTomes()
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

  const getMemoryTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'long_term':
        return 'bg-magic-teal/20 text-magic-teal border-magic-teal/30'
      case 'consolidated':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      default:
        return 'bg-gold-ancient/20 text-gold-rich border-gold-ancient/30'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with create and import buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-parchment">Memory Library</h2>
          <p className="text-parchment-dim font-lore">
            {tomes.length} {tomes.length === 1 ? 'tome' : 'tomes'} • Organize your conversation memories
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsCreateTomeOpen(true)}
            className="bg-forest hover:bg-forest/90 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Tome
          </Button>
          <Link href="/memories/import">
            <Button variant="outline" className="ornate-border">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
          </Link>
        </div>
      </div>

      {/* Search, Filter, and Sort Controls */}
      {tomes.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-parchment/50" />
              <Input
                placeholder="Search memory tomes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 glass-rune border-gold-ancient/30 text-parchment placeholder:text-parchment/40"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={`border-gold-ancient/30 text-parchment hover:bg-gold-ancient/10 ${
                  activeFilterCount > 0 ? 'border-gold-rich text-gold-rich' : ''
                }`}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge className="ml-2 bg-gold-rich text-[#0a140a] text-xs px-1.5 py-0">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>

              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="w-40 glass-rune border-gold-ancient/30 text-parchment">
                  <ArrowUpDown className="w-4 h-4 mr-2 text-parchment/50" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="glass-rune border-gold-ancient/30">
                  <SelectItem value="createdAt">Date Created</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="entry_count">Memory Count</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="border-gold-ancient/30 text-parchment hover:bg-gold-ancient/10"
                title={sortOrder === 'asc' ? 'Sort ascending' : 'Sort descending'}
              >
                {sortOrder === 'asc' ? (
                  <SortAsc className="w-4 h-4" />
                ) : (
                  <SortDesc className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {showFilters && (
            <Card className="glass-rune border-gold-ancient/30 p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label className="text-parchment text-sm whitespace-nowrap">Memories:</Label>
                  <Select value={filterHasEntries} onValueChange={(v) => setFilterHasEntries(v as typeof filterHasEntries)}>
                    <SelectTrigger className="w-36 glass-rune border-gold-ancient/30 text-parchment h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-rune border-gold-ancient/30">
                      <SelectItem value="all">All Tomes</SelectItem>
                      <SelectItem value="with_entries">With Memories</SelectItem>
                      <SelectItem value="empty">Empty Tomes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFilterHasEntries('all')
                    }}
                    className="text-parchment/60 hover:text-parchment h-9"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear filters
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Memory Tomes List */}
      {isLoadingTomes ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 text-gold-rich animate-spin mb-4" />
          <p className="text-parchment/60">Loading memory tomes...</p>
        </div>
      ) : tomes.length === 0 ? (
        <Card className="glass-rune border-gold-ancient/30">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <Brain className="w-16 h-16 text-gold-ancient/50 mb-4" />
              <h3 className="text-xl font-display text-parchment mb-2">No Memory Tomes Yet</h3>
              <p className="text-parchment/60 font-lore italic mb-4 max-w-md">
                Memory tomes help you organize your conversation memories. Create your first tome or import memories to get started.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsCreateTomeOpen(true)}
                  className="bg-forest hover:bg-forest/90 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Tome
                </Button>
                <Link href="/memories/import">
                  <Button variant="outline" className="ornate-border">
                    <Upload className="w-4 h-4 mr-2" />
                    Import Memories
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : filteredAndSortedTomes.length === 0 ? (
        <Card className="glass-rune border-gold-ancient/30">
          <CardContent className="py-8">
            <div className="flex flex-col items-center justify-center text-center">
              <Search className="w-12 h-12 text-gold-ancient/30 mb-3" />
              <h3 className="text-lg font-display text-parchment mb-1">No Matching Tomes</h3>
              <p className="text-parchment/60 font-lore italic text-sm">
                No tomes match your search for "{searchQuery}"
              </p>
              <Button
                variant="link"
                onClick={() => setSearchQuery('')}
                className="text-gold-rich hover:text-gold-ancient mt-2"
              >
                Clear search
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedTomes.map((tome) => (
            <Card key={tome.id} className="glass-rune border-gold-ancient/30 overflow-hidden">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gold-ancient/5 transition-colors"
                onClick={() => handleToggleTome(tome.id)}
              >
                <div className="flex items-center gap-4">
                  {expandedTomeId === tome.id ? (
                    <ChevronDown className="w-5 h-5 text-gold-ancient" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gold-ancient" />
                  )}
                  <Brain className="w-8 h-8 text-magic-teal" />
                  <div>
                    <h3 className="text-lg font-display text-parchment">{tome.name}</h3>
                    {tome.description && (
                      <p className="text-sm text-parchment/60">{tome.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="border-gold-ancient/30 text-parchment/70">
                    <Brain className="w-3 h-3 mr-1" />
                    {tome.entry_count || 0} memories
                  </Badge>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditTome(tome)}
                      className="h-8 w-8 p-0 text-parchment/60 hover:text-gold-rich"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTome(tome.id)}
                      className="h-8 w-8 p-0 text-parchment/60 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {expandedTomeId === tome.id && (
                <div className="border-t border-gold-ancient/20">
                  <div className="p-4 border-b border-gold-ancient/10 bg-[#0a140a]/20">
                    {showCreateMemory === tome.id ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-parchment font-semibold">Add New Memory</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowCreateMemory(null)}
                            className="h-8 w-8 p-0 text-parchment/60 hover:text-parchment"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-parchment">Bot (optional)</Label>
                          <Select value={createBotId} onValueChange={setCreateBotId}>
                            <SelectTrigger className="glass-rune border-gold-ancient/30 text-parchment">
                              <SelectValue placeholder="Select a bot..." />
                            </SelectTrigger>
                            <SelectContent className="glass-rune border-gold-ancient/30">
                              <SelectItem value="none">No specific bot</SelectItem>
                              {availableBots.map((bot) => (
                                <SelectItem key={bot.id} value={bot.id}>
                                  {bot.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-parchment">
                            Memory Content <span className="text-red-400">*</span>
                          </Label>
                          <Textarea
                            placeholder="Enter memory content..."
                            value={createEntry}
                            onChange={(e) => setCreateEntry(e.target.value)}
                            rows={4}
                            className="glass-rune border-gold-ancient/30 text-parchment placeholder:text-parchment/40"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-parchment">Type</Label>
                            <Select value={createType} onValueChange={setCreateType}>
                              <SelectTrigger className="glass-rune border-gold-ancient/30 text-parchment">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="glass-rune border-gold-ancient/30">
                                <SelectItem value="short_term">Short Term</SelectItem>
                                <SelectItem value="long_term">Long Term</SelectItem>
                                <SelectItem value="consolidated">Consolidated</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-parchment">Importance ({createImportance}/10)</Label>
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
                          <Label className="text-parchment">Emotional Context (optional)</Label>
                          <Input
                            value={createEmotionalContext}
                            onChange={(e) => setCreateEmotionalContext(e.target.value)}
                            placeholder="e.g., happy, reflective, curious..."
                            className="glass-rune border-gold-ancient/30 text-parchment placeholder:text-parchment/40"
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleCreateMemory(tome.id)}
                            disabled={isCreatingMemory || !createEntry.trim()}
                            className="bg-forest hover:bg-forest/90 text-white"
                          >
                            {isCreatingMemory ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Memory
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => setShowCreateMemory(null)}
                            variant="outline"
                            className="border-gold-ancient/30 text-parchment"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setShowCreateMemory(tome.id)}
                        variant="outline"
                        className="border-gold-ancient/30 text-parchment hover:bg-gold-ancient/10"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Memory to Tome
                      </Button>
                    )}
                  </div>

                  <div className="p-4">
                    {loadingEntriesForTome === tome.id ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 text-gold-ancient animate-spin" />
                      </div>
                    ) : (tomeEntries[tome.id]?.length || 0) === 0 ? (
                      <div className="text-center py-8">
                        <Brain className="w-12 h-12 text-gold-ancient/30 mx-auto mb-3" />
                        <p className="text-parchment/50 font-lore italic">
                          No memories in this tome yet
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {tomeEntries[tome.id]?.map((memory) => {
                          const isAutoGenerated = memory._sourceType === 'knowledge'
                          const botNames = Array.isArray(memory.bot)
                            ? memory.bot.map(b => b.name).filter(Boolean).join(', ')
                            : memory.bot?.name

                          return (
                            <div
                              key={memory.id}
                              className="p-4 rounded-lg border border-gold-ancient/20 hover:border-gold-rich/30 transition-all bg-[#0a140a]/20"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="outline" className={getMemoryTypeBadgeClass(memory.type)}>
                                      {getMemoryTypeLabel(memory.type)}
                                    </Badge>
                                    {isAutoGenerated && (
                                      <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30">
                                        <Zap className="mr-1 h-3 w-3" />
                                        Auto
                                      </Badge>
                                    )}
                                    {memory.converted_to_lore && !isAutoGenerated && (
                                      <Badge variant="outline" className="bg-gold-ancient/10 text-gold-rich border-gold-ancient/30">
                                        <Sparkles className="mr-1 h-3 w-3" />
                                        Lore
                                      </Badge>
                                    )}
                                    {memory.is_vectorized && (
                                      <Badge variant="outline" className="bg-forest/10 text-forest-light border-forest/30">
                                        <CheckCircle className="mr-1 h-3 w-3" />
                                        Vectorized
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-parchment font-lore line-clamp-3">{memory.entry}</p>
                                  <div className="flex flex-wrap items-center gap-3 text-xs text-parchment/50">
                                    {botNames && (
                                      <div className="flex items-center gap-1">
                                        <Bot className="h-3 w-3" />
                                        {botNames}
                                      </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {new Date(memory.created_timestamp).toLocaleDateString()}
                                    </div>
                                    <span>{memory.tokens} tokens</span>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditDialog(memory)}
                                    className="h-8 w-8 p-0 text-parchment/60 hover:text-gold-rich"
                                    title="Edit"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  {!memory.converted_to_lore && !isAutoGenerated && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openConvertDialog(memory)}
                                      className="h-8 w-8 p-0 text-parchment/60 hover:text-gold-rich"
                                      title="Convert to Lore"
                                    >
                                      <ArrowUpCircle className="w-4 h-4" />
                                    </Button>
                                  )}
                                  {!memory.is_vectorized && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleVectorize(memory.id)}
                                      className="h-8 w-8 p-0 text-parchment/60 hover:text-forest"
                                      title="Vectorize"
                                    >
                                      <Sparkles className="w-4 h-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openDeleteDialog(memory)}
                                    className="h-8 w-8 p-0 text-parchment/60 hover:text-red-400"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                  {isAutoGenerated && memory._knowledgeId && (
                                    <Link href={`/lore/entries?id=${memory._knowledgeId}`}>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-parchment/60 hover:text-gold-rich"
                                        title="View in Lore"
                                      >
                                        <BookOpen className="w-4 h-4" />
                                      </Button>
                                    </Link>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create Tome Dialog */}
      <Dialog open={isCreateTomeOpen} onOpenChange={setIsCreateTomeOpen}>
        <DialogContent className="glass-rune border-gold-ancient/30 text-parchment">
          <DialogHeader>
            <DialogTitle className="text-gold-rich">Create Memory Tome</DialogTitle>
            <DialogDescription className="text-parchment/60">
              Memory tomes help you organize your conversation memories into themed groups.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-parchment">
                Tome Name <span className="text-red-400">*</span>
              </Label>
              <Input
                placeholder="e.g., Adventure Memories"
                value={newTomeName}
                onChange={(e) => setNewTomeName(e.target.value)}
                className="glass-rune border-gold-ancient/30 text-parchment placeholder:text-parchment/40"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-parchment">Description</Label>
              <Textarea
                placeholder="Describe what memories this tome contains..."
                value={newTomeDescription}
                onChange={(e) => setNewTomeDescription(e.target.value)}
                rows={4}
                className="glass-rune border-gold-ancient/30 text-parchment placeholder:text-parchment/40"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleCreateTome}
                disabled={isCreatingTome || !newTomeName}
                className="bg-forest hover:bg-forest/90 text-white flex-1"
              >
                {isCreatingTome ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Tome
                  </>
                )}
              </Button>
              <Button
                onClick={() => setIsCreateTomeOpen(false)}
                variant="outline"
                className="border-gold-ancient/30 text-parchment"
                disabled={isCreatingTome}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Tome Dialog */}
      <Dialog open={isEditTomeOpen} onOpenChange={setIsEditTomeOpen}>
        <DialogContent className="glass-rune border-gold-ancient/30 text-parchment">
          <DialogHeader>
            <DialogTitle className="text-gold-rich">Edit Memory Tome</DialogTitle>
            <DialogDescription className="text-parchment/60">
              Update the tome name and description.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-parchment">
                Tome Name <span className="text-red-400">*</span>
              </Label>
              <Input
                placeholder="e.g., Adventure Memories"
                value={editTomeName}
                onChange={(e) => setEditTomeName(e.target.value)}
                className="glass-rune border-gold-ancient/30 text-parchment placeholder:text-parchment/40"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-parchment">Description</Label>
              <Textarea
                placeholder="Describe what memories this tome contains..."
                value={editTomeDescription}
                onChange={(e) => setEditTomeDescription(e.target.value)}
                rows={4}
                className="glass-rune border-gold-ancient/30 text-parchment placeholder:text-parchment/40"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleUpdateTome}
                disabled={isUpdatingTome || !editTomeName}
                className="bg-gold-rich hover:bg-gold-rich/90 text-[#0a140a] flex-1"
              >
                {isUpdatingTome ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button
                onClick={() => setIsEditTomeOpen(false)}
                variant="outline"
                className="border-gold-ancient/30 text-parchment"
                disabled={isUpdatingTome}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Convert to Lore Dialog */}
      <Dialog open={isConvertDialogOpen} onOpenChange={setIsConvertDialogOpen}>
        <DialogContent className="glass-rune border-gold-ancient/30 text-parchment">
          <DialogHeader>
            <DialogTitle className="text-gold-rich">Convert Memory to Lore</DialogTitle>
            <DialogDescription className="text-parchment/60">
              Select a lore tome to save this memory as permanent knowledge
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-parchment">Lore Tome</Label>
              <Select value={selectedCollectionId} onValueChange={setSelectedCollectionId}>
                <SelectTrigger className="glass-rune border-gold-ancient/30 text-parchment">
                  <SelectValue placeholder="Select a lore tome" />
                </SelectTrigger>
                <SelectContent className="glass-rune border-gold-ancient/30">
                  {knowledgeCollections.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id}>
                      {collection.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedMemory && (
              <div className="p-4 bg-[#0a140a]/30 rounded-lg border border-gold-ancient/20">
                <p className="text-sm font-semibold text-parchment mb-2">Memory Preview:</p>
                <p className="text-sm text-parchment/70 whitespace-pre-wrap line-clamp-4">
                  {selectedMemory.entry}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConvertDialogOpen(false)} className="ornate-border">
              Cancel
            </Button>
            <Button
              onClick={handleConvertToLore}
              disabled={!selectedCollectionId || isConverting}
              className="bg-gold-rich hover:bg-gold-rich/90 text-[#0a140a]"
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
        <DialogContent className="glass-rune border-gold-ancient/30 text-parchment max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-gold-rich">Edit Memory</DialogTitle>
            <DialogDescription className="text-parchment/60">
              Update the content and settings of this memory
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-parchment">Memory Content</Label>
              <Textarea
                value={editEntry}
                onChange={(e) => setEditEntry(e.target.value)}
                placeholder="Enter memory content..."
                className="min-h-[150px] glass-rune border-gold-ancient/30 text-parchment placeholder:text-parchment/40"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-parchment">Type</Label>
                <Select value={editType} onValueChange={setEditType}>
                  <SelectTrigger className="glass-rune border-gold-ancient/30 text-parchment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-rune border-gold-ancient/30">
                    <SelectItem value="short_term">Short Term</SelectItem>
                    <SelectItem value="long_term">Long Term</SelectItem>
                    <SelectItem value="consolidated">Consolidated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-parchment">Importance ({editImportance}/10)</Label>
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
              <Label className="text-parchment">Emotional Context (optional)</Label>
              <Input
                value={editEmotionalContext}
                onChange={(e) => setEditEmotionalContext(e.target.value)}
                placeholder="e.g., happy, reflective, curious..."
                className="glass-rune border-gold-ancient/30 text-parchment placeholder:text-parchment/40"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="ornate-border">
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={!editEntry.trim() || isSaving}
              className="bg-gold-rich hover:bg-gold-rich/90 text-[#0a140a]"
            >
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
        <DialogContent className="glass-rune border-gold-ancient/30 text-parchment">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Delete Memory
            </DialogTitle>
            <DialogDescription className="text-parchment/60">
              Are you sure you want to delete this memory? This action cannot be undone.
              {deletingMemory?.is_vectorized && (
                <span className="block mt-2 text-amber-400">
                  Note: Associated vector records will also be deleted.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {deletingMemory && (
            <div className="p-4 bg-[#0a140a]/30 rounded-lg border border-gold-ancient/20">
              <p className="text-sm text-parchment/70 whitespace-pre-wrap line-clamp-4">
                {deletingMemory.entry}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="ornate-border">
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
    </div>
  )
}
