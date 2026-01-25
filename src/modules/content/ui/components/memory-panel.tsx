'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
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
  BookOpen
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import Link from 'next/link'
import { toast } from 'sonner'

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
  const [isLoading, setIsLoading] = useState(true)
  const [memories, setMemories] = useState<Memory[]>([])
  const [filteredMemories, setFilteredMemories] = useState<Memory[]>([])

  // Filter state
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

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

  useEffect(() => {
    fetchMemories()
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

  useEffect(() => {
    applyFilters()
  }, [memories, typeFilter, statusFilter, sourceFilter, searchQuery])

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

    if (typeFilter !== 'all') {
      filtered = filtered.filter(m => m.type === typeFilter)
    }

    if (statusFilter === 'converted') {
      filtered = filtered.filter(m => m.converted_to_lore)
    } else if (statusFilter === 'not_converted') {
      filtered = filtered.filter(m => !m.converted_to_lore)
    } else if (statusFilter === 'vectorized') {
      filtered = filtered.filter(m => m.is_vectorized)
    }

    if (sourceFilter === 'manual') {
      filtered = filtered.filter(m => m._sourceType !== 'knowledge')
    } else if (sourceFilter === 'auto') {
      filtered = filtered.filter(m => m._sourceType === 'knowledge')
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(m => {
        if (m.entry.toLowerCase().includes(query)) return true
        if (Array.isArray(m.bot)) {
          return m.bot.some(b => b.name?.toLowerCase().includes(query))
        }
        return m.bot?.name?.toLowerCase().includes(query)
      })
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
        headers: { 'Content-Type': 'application/json' },
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
        fetchMemories()
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
        fetchMemories()
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
        fetchMemories()
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
      {/* Header with stats and create button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-parchment">Memory Library</h2>
          <p className="text-parchment-dim font-lore">
            {memories.length} {memories.length === 1 ? 'memory' : 'memories'} • Manage your conversation memories
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openCreateDialog} className="bg-forest hover:bg-forest/90 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Create Memory
          </Button>
          <Link href="/memories/import">
            <Button variant="outline" className="ornate-border">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-rune">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-500/20">
                <Brain className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-display text-parchment">{memories.length}</p>
                <p className="text-xs text-parchment-dim">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-rune">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-magic-teal/20">
                <CheckCircle className="w-5 h-5 text-magic-teal" />
              </div>
              <div>
                <p className="text-2xl font-display text-parchment">
                  {memories.filter(m => m.type === 'long_term').length}
                </p>
                <p className="text-xs text-parchment-dim">Long Term</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-rune">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-gold-ancient/20">
                <Sparkles className="w-5 h-5 text-gold-rich" />
              </div>
              <div>
                <p className="text-2xl font-display text-parchment">
                  {memories.filter(m => m.converted_to_lore).length}
                </p>
                <p className="text-xs text-parchment-dim">Converted</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-rune">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-forest/20">
                <Zap className="w-5 h-5 text-forest-light" />
              </div>
              <div>
                <p className="text-2xl font-display text-parchment">
                  {memories.filter(m => m.is_vectorized).length}
                </p>
                <p className="text-xs text-parchment-dim">Vectorized</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-rune">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-parchment text-sm">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-parchment/50" />
                <Input
                  placeholder="Search memories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 glass-rune border-gold-ancient/30 text-parchment placeholder:text-parchment/40"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-parchment text-sm">Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="glass-rune border-gold-ancient/30 text-parchment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-rune border-gold-ancient/30">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="short_term">Short Term</SelectItem>
                  <SelectItem value="long_term">Long Term</SelectItem>
                  <SelectItem value="consolidated">Consolidated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-parchment text-sm">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="glass-rune border-gold-ancient/30 text-parchment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-rune border-gold-ancient/30">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="converted">Converted to Lore</SelectItem>
                  <SelectItem value="not_converted">Not Converted</SelectItem>
                  <SelectItem value="vectorized">Vectorized</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-parchment text-sm">Source</Label>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="glass-rune border-gold-ancient/30 text-parchment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-rune border-gold-ancient/30">
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="manual">Manual / Imported</SelectItem>
                  <SelectItem value="auto">Auto-generated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {(typeFilter !== 'all' || statusFilter !== 'all' || sourceFilter !== 'all' || searchQuery) && (
            <div className="mt-4 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTypeFilter('all')
                  setStatusFilter('all')
                  setSourceFilter('all')
                  setSearchQuery('')
                }}
                className="text-parchment/60 hover:text-parchment"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Memory List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gold-rich" />
        </div>
      ) : filteredMemories.length === 0 ? (
        <Card className="glass-rune">
          <CardContent className="py-12">
            <div className="text-center">
              <Brain className="w-16 h-16 mx-auto mb-4 text-parchment-dim" />
              <h3 className="text-xl font-display text-parchment mb-2">No memories found</h3>
              <p className="text-parchment-dim font-lore mb-6">
                {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create or import your first memory to get started'}
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={openCreateDialog} className="bg-forest hover:bg-forest/90 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Memory
                </Button>
                <Link href="/memories/import">
                  <Button variant="outline" className="ornate-border">
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredMemories.map((memory) => {
            const isAutoGenerated = memory._sourceType === 'knowledge'
            const botNames = Array.isArray(memory.bot)
              ? memory.bot.map(b => b.name).filter(Boolean).join(', ')
              : memory.bot?.name
            const tomeName = typeof memory.knowledge_collection === 'object'
              ? memory.knowledge_collection?.name
              : undefined

            return (
              <Card key={memory.id} className="glass-rune">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
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
                      <div className="flex items-center gap-4 text-xs text-parchment-dim flex-wrap">
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
                        <span>{memory.tokens} tokens</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-sm text-parchment font-lore whitespace-pre-wrap line-clamp-4">
                    {memory.entry}
                  </p>
                </CardContent>
                <CardFooter className="flex gap-2 flex-wrap pt-2">
                  {!isAutoGenerated && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(memory)}
                        className="ornate-border"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      {!memory.converted_to_lore && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openConvertDialog(memory)}
                          className="ornate-border"
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
                          className="ornate-border"
                        >
                          <Sparkles className="mr-2 h-4 w-4" />
                          Vectorize
                        </Button>
                      )}
                    </>
                  )}
                  {isAutoGenerated && memory._knowledgeId && (
                    <Link href={`/lore/entries?id=${memory._knowledgeId}`}>
                      <Button variant="outline" size="sm" className="ornate-border">
                        <BookOpen className="mr-2 h-4 w-4" />
                        View in Tome
                      </Button>
                    </Link>
                  )}
                  {memory.converted_to_lore && memory.lore_entry && !isAutoGenerated && (
                    <Link href={`/lore/entries?id=${memory.lore_entry.id}`}>
                      <Button variant="outline" size="sm" className="ornate-border">
                        View Lore Entry
                      </Button>
                    </Link>
                  )}
                  {!isAutoGenerated && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 ml-auto"
                      onClick={() => openDeleteDialog(memory)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      {/* Convert to Lore Dialog */}
      <Dialog open={isConvertDialogOpen} onOpenChange={setIsConvertDialogOpen}>
        <DialogContent className="glass-rune border-gold-ancient/30 text-parchment">
          <DialogHeader>
            <DialogTitle className="text-gold-rich">Convert Memory to Lore</DialogTitle>
            <DialogDescription className="text-parchment/60">
              Select a tome to save this memory as permanent lore
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-parchment">Tome</Label>
              <Select value={selectedCollectionId} onValueChange={setSelectedCollectionId}>
                <SelectTrigger className="glass-rune border-gold-ancient/30 text-parchment">
                  <SelectValue placeholder="Select a tome" />
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

      {/* Create Memory Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="glass-rune border-gold-ancient/30 text-parchment max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-gold-rich">Create New Memory</DialogTitle>
            <DialogDescription className="text-parchment/60">
              Add a new memory entry to your library
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-parchment">Bot *</Label>
              <Select value={createBotId} onValueChange={setCreateBotId}>
                <SelectTrigger className="glass-rune border-gold-ancient/30 text-parchment">
                  <SelectValue placeholder="Select a bot..." />
                </SelectTrigger>
                <SelectContent className="glass-rune border-gold-ancient/30">
                  {availableBots.map((bot) => (
                    <SelectItem key={bot.id} value={bot.id}>
                      {bot.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableBots.length === 0 && (
                <p className="text-sm text-parchment/50">
                  You need to create a bot first before adding memories.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-parchment">Memory Content *</Label>
              <Textarea
                value={createEntry}
                onChange={(e) => setCreateEntry(e.target.value)}
                placeholder="Enter memory content..."
                className="min-h-[150px] glass-rune border-gold-ancient/30 text-parchment placeholder:text-parchment/40"
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="ornate-border">
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!createEntry.trim() || !createBotId || isCreating}
              className="bg-forest hover:bg-forest/90 text-white"
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
