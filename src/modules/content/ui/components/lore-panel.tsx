'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  BookOpen,
  Plus,
  Upload,
  FileText,
  Link as LinkIcon,
  Sparkles,
  Loader2,
  Trash2,
  Settings2,
  Edit,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  BookMarked,
  X,
  Search,
  ArrowUpDown,
  SortAsc,
  SortDesc,
  Filter,
  Share2,
  Lock,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  ActivationSettings,
  type ActivationSettingsValue,
  type PositioningValue,
  type AdvancedActivationValue,
  type FilteringValue,
  type BudgetControlValue,
} from '@/modules/lore/ui/components/activation-settings'
import { ShareDialog } from '@/components/share-dialog'

interface Tome {
  id: string
  name: string
  description?: string
  entry_count?: number
  total_tokens?: number
  createdAt?: string
  sharing_settings?: {
    sharing_level?: 'private' | 'shared' | 'public'
  }
}

interface KnowledgeEntry {
  id: string
  entry: string
  type: string
  knowledge_collection: string | { id: string; name: string }
  tags?: { tag: string }[]
  tokens: number
  is_vectorized: boolean
  chunk_count?: number
  embedding_model?: string
  vector_dimensions?: number
  createdAt: string
}

export const LorePanel = () => {
  // Tome state
  const [tomes, setTomes] = useState<Tome[]>([])
  const [isLoadingTomes, setIsLoadingTomes] = useState(true)
  const [expandedTomeId, setExpandedTomeId] = useState<string | null>(null)
  const [tomeEntries, setTomeEntries] = useState<Record<string, KnowledgeEntry[]>>({})
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
  const [editingTome, setEditingTome] = useState<Tome | null>(null)
  const [editTomeName, setEditTomeName] = useState('')
  const [editTomeDescription, setEditTomeDescription] = useState('')
  const [editTomeSharingLevel, setEditTomeSharingLevel] = useState<'private' | 'shared'>('private')

  // Share dialog state
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [sharingTome, setSharingTome] = useState<Tome | null>(null)

  // Create entry state (inline form)
  const [showCreateEntry, setShowCreateEntry] = useState<string | null>(null)
  const [isCreatingEntry, setIsCreatingEntry] = useState(false)
  const [entryType, setEntryType] = useState('text')
  const [entryContent, setEntryContent] = useState('')
  const [entryTags, setEntryTags] = useState('')
  const [showActivationSettings, setShowActivationSettings] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [r2FileKey, setR2FileKey] = useState<string>('')

  // Edit entry state
  const [isEditEntryOpen, setIsEditEntryOpen] = useState(false)
  const [isUpdatingEntry, setIsUpdatingEntry] = useState(false)
  const [isFetchingEntry, setIsFetchingEntry] = useState(false)
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null)
  const [editEntryContent, setEditEntryContent] = useState('')
  const [editEntryTags, setEditEntryTags] = useState('')
  const [editEntryType, setEditEntryType] = useState('text')
  const [showEditActivationSettings, setShowEditActivationSettings] = useState(false)

  // Edit entry activation settings (separate from create)
  const [editActivationSettings, setEditActivationSettings] = useState<ActivationSettingsValue>({
    activation_mode: 'vector',
    vector_similarity_threshold: 0.7,
    max_vector_results: 5,
    probability: 100,
    use_probability: false,
    scan_depth: 2,
    match_in_user_messages: true,
    match_in_bot_messages: true,
    match_in_system_prompts: false,
  })
  const [editPositioning, setEditPositioning] = useState<PositioningValue>({
    position: 'before_character',
    depth: 0,
    role: 'system',
    order: 100,
  })
  const [editAdvancedActivation, setEditAdvancedActivation] = useState<AdvancedActivationValue>({
    sticky: 0,
    cooldown: 0,
    delay: 0,
  })
  const [editFiltering, setEditFiltering] = useState<FilteringValue>({
    filter_by_bots: false,
    allowed_bot_ids: [],
    excluded_bot_ids: [],
    filter_by_personas: false,
    allowed_persona_ids: [],
    excluded_persona_ids: [],
  })
  const [editBudgetControl, setEditBudgetControl] = useState<BudgetControlValue>({
    ignore_budget: false,
    max_tokens: 1000,
  })

  // Activation settings state
  const [activationSettings, setActivationSettings] = useState<ActivationSettingsValue>({
    activation_mode: 'vector',
    vector_similarity_threshold: 0.7,
    max_vector_results: 5,
    probability: 100,
    use_probability: false,
    scan_depth: 2,
    match_in_user_messages: true,
    match_in_bot_messages: true,
    match_in_system_prompts: false,
  })
  const [positioning, setPositioning] = useState<PositioningValue>({
    position: 'before_character',
    depth: 0,
    role: 'system',
    order: 100,
  })
  const [advancedActivation, setAdvancedActivation] = useState<AdvancedActivationValue>({
    sticky: 0,
    cooldown: 0,
    delay: 0,
  })
  const [filtering, setFiltering] = useState<FilteringValue>({
    filter_by_bots: false,
    allowed_bot_ids: [],
    excluded_bot_ids: [],
    filter_by_personas: false,
    allowed_persona_ids: [],
    excluded_persona_ids: [],
  })
  const [budgetControl, setBudgetControl] = useState<BudgetControlValue>({
    ignore_budget: false,
    max_tokens: 1000,
  })

  // Fetch tomes on mount
  useEffect(() => {
    fetchTomes()
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

  const fetchTomes = async () => {
    setIsLoadingTomes(true)
    try {
      const response = await fetch('/api/knowledge-collections')
      const data = (await response.json()) as { success?: boolean; collections?: Tome[]; message?: string }

      if (data.success) {
        setTomes(data.collections || [])
      } else {
        toast.error(data.message || 'Failed to fetch tomes')
      }
    } catch (error) {
      console.error('Error fetching tomes:', error)
      toast.error('Failed to fetch tomes')
    } finally {
      setIsLoadingTomes(false)
    }
  }

  const fetchEntriesForTome = async (tomeId: string) => {
    setLoadingEntriesForTome(tomeId)
    try {
      const response = await fetch(`/api/knowledge?collection=${tomeId}`)
      const data = (await response.json()) as {
        success?: boolean
        docs?: KnowledgeEntry[]
        message?: string
      }

      if (data.success) {
        setTomeEntries(prev => ({ ...prev, [tomeId]: data.docs || [] }))
      } else {
        toast.error(data.message || 'Failed to fetch entries')
      }
    } catch (error) {
      console.error('Error fetching entries:', error)
      toast.error('Failed to fetch entries')
    } finally {
      setLoadingEntriesForTome(null)
    }
  }

  const handleToggleTome = async (tomeId: string) => {
    if (expandedTomeId === tomeId) {
      setExpandedTomeId(null)
      setShowCreateEntry(null)
    } else {
      setExpandedTomeId(tomeId)
      setShowCreateEntry(null)
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
        }),
      })

      const data = (await response.json()) as { success?: boolean; collection?: Tome; message?: string }

      if (data.success) {
        toast.success('Tome created successfully!')
        setNewTomeName('')
        setNewTomeDescription('')
        setIsCreateTomeOpen(false)
        fetchTomes()
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
          sharing_settings: {
            sharing_level: editTomeSharingLevel,
          },
        }),
      })

      const data = (await response.json()) as { success?: boolean; collection?: Tome; message?: string }

      if (data.success) {
        toast.success('Tome updated successfully!')
        setIsEditTomeOpen(false)
        setEditingTome(null)
        fetchTomes()
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
    if (!confirm('Are you sure you want to delete this tome? All entries will be removed.')) {
      return
    }

    try {
      const response = await fetch(`/api/knowledge-collections/${id}`, {
        method: 'DELETE',
      })

      const data = (await response.json()) as { success?: boolean; message?: string }

      if (data.success) {
        toast.success('Tome deleted successfully!')
        if (expandedTomeId === id) {
          setExpandedTomeId(null)
        }
        fetchTomes()
      } else {
        toast.error(data.message || 'Failed to delete tome')
      }
    } catch (error) {
      console.error('Error deleting tome:', error)
      toast.error('Failed to delete tome')
    }
  }

  const openEditTome = (tome: Tome) => {
    setEditingTome(tome)
    setEditTomeName(tome.name)
    setEditTomeDescription(tome.description || '')
    const sharingLevel = tome.sharing_settings?.sharing_level
    setEditTomeSharingLevel(sharingLevel === 'shared' ? 'shared' : 'private')
    setIsEditTomeOpen(true)
  }

  const openShareDialog = (tome: Tome) => {
    setSharingTome(tome)
    setIsShareDialogOpen(true)
  }

  const handleCreateEntry = async (tomeId: string) => {
    if (!entryContent) {
      toast.error('Please enter content')
      return
    }

    setIsCreatingEntry(true)
    try {
      const tagArray = entryTags
        ? entryTags.split(',').map((tag) => ({ tag: tag.trim() })).filter((t) => t.tag)
        : []

      const response = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: entryType,
          entry: entryContent,
          knowledge_collection: tomeId,
          tags: tagArray,
          r2_file_key: r2FileKey || undefined,
          activation_settings: activationSettings,
          positioning: positioning,
          advanced_activation: advancedActivation,
          filtering: filtering,
          budget_control: budgetControl,
        }),
      })

      const data = (await response.json()) as {
        success?: boolean
        knowledge?: KnowledgeEntry
        message?: string
        autoVectorized?: boolean
        vectorCount?: number
      }

      if (data.success) {
        if (data.autoVectorized) {
          toast.success(`Entry created and vectorized with ${data.vectorCount} chunks!`)
        } else {
          toast.success('Entry created successfully!')
        }

        setEntryContent('')
        setEntryTags('')
        setEntryType('text')
        setUploadedFile(null)
        setR2FileKey('')
        setShowActivationSettings(false)
        setShowCreateEntry(null)

        setActivationSettings({
          activation_mode: 'vector',
          vector_similarity_threshold: 0.7,
          max_vector_results: 5,
          probability: 100,
          use_probability: false,
          scan_depth: 2,
          match_in_user_messages: true,
          match_in_bot_messages: true,
          match_in_system_prompts: false,
        })

        await fetchEntriesForTome(tomeId)
        fetchTomes()
      } else {
        toast.error(data.message || 'Failed to create entry')
      }
    } catch (error: any) {
      console.error('Error creating entry:', error)
      toast.error(error.message || 'Failed to create entry')
    } finally {
      setIsCreatingEntry(false)
    }
  }

  const handleDeleteEntry = async (entry: KnowledgeEntry) => {
    if (!confirm('Are you sure you want to delete this entry?')) {
      return
    }

    try {
      const response = await fetch(`/api/knowledge/${entry.id}`, {
        method: 'DELETE',
      })

      const data = (await response.json()) as { success?: boolean; message?: string }

      if (data.success) {
        toast.success('Entry deleted successfully!')

        const tomeId = typeof entry.knowledge_collection === 'string'
          ? entry.knowledge_collection
          : entry.knowledge_collection?.id
        if (tomeId) {
          await fetchEntriesForTome(tomeId)
        }
        fetchTomes()
      } else {
        toast.error(data.message || 'Failed to delete entry')
      }
    } catch (error) {
      console.error('Error deleting entry:', error)
      toast.error('Failed to delete entry')
    }
  }

  const openEditEntry = async (entry: KnowledgeEntry) => {
    setEditingEntry(entry)
    setEditEntryContent(entry.entry)
    setEditEntryType(entry.type)
    setEditEntryTags(entry.tags?.map(t => t.tag).join(', ') || '')
    setIsFetchingEntry(true)
    setIsEditEntryOpen(true)
    setShowEditActivationSettings(false)

    // Fetch full entry details to get activation settings
    try {
      const response = await fetch(`/api/knowledge/${entry.id}`)
      const data = (await response.json()) as {
        success?: boolean
        knowledge?: any
        message?: string
      }

      if (data.success && data.knowledge) {
        const k = data.knowledge

        // Set activation settings from fetched data
        if (k.activation_settings) {
          setEditActivationSettings({
            activation_mode: k.activation_settings.activation_mode || 'vector',
            primary_keys: k.activation_settings.primary_keys?.map((pk: any) => pk.keyword) || [],
            secondary_keys: k.activation_settings.secondary_keys?.map((sk: any) => sk.keyword) || [],
            keywords_logic: k.activation_settings.keywords_logic || 'AND_ANY',
            case_sensitive: k.activation_settings.case_sensitive || false,
            match_whole_words: k.activation_settings.match_whole_words || false,
            use_regex: k.activation_settings.use_regex || false,
            vector_similarity_threshold: k.activation_settings.vector_similarity_threshold ?? 0.7,
            max_vector_results: k.activation_settings.max_vector_results ?? 5,
            probability: k.activation_settings.probability ?? 100,
            use_probability: k.activation_settings.use_probability || false,
            scan_depth: k.activation_settings.scan_depth ?? 2,
            match_in_user_messages: k.activation_settings.match_in_user_messages ?? true,
            match_in_bot_messages: k.activation_settings.match_in_bot_messages ?? true,
            match_in_system_prompts: k.activation_settings.match_in_system_prompts ?? false,
          })
        }

        if (k.positioning) {
          setEditPositioning({
            position: k.positioning.position || 'before_character',
            depth: k.positioning.depth ?? 0,
            role: k.positioning.role || 'system',
            order: k.positioning.order ?? 100,
          })
        }

        if (k.advanced_activation) {
          setEditAdvancedActivation({
            sticky: k.advanced_activation.sticky ?? 0,
            cooldown: k.advanced_activation.cooldown ?? 0,
            delay: k.advanced_activation.delay ?? 0,
          })
        }

        if (k.filtering) {
          setEditFiltering({
            filter_by_bots: k.filtering.filter_by_bots || false,
            allowed_bot_ids: k.filtering.allowed_bot_ids?.map((b: any) => b.bot_id) || [],
            excluded_bot_ids: k.filtering.excluded_bot_ids?.map((b: any) => b.bot_id) || [],
            filter_by_personas: k.filtering.filter_by_personas || false,
            allowed_persona_ids: k.filtering.allowed_persona_ids?.map((p: any) => p.persona_id) || [],
            excluded_persona_ids: k.filtering.excluded_persona_ids?.map((p: any) => p.persona_id) || [],
          })
        }

        if (k.budget_control) {
          setEditBudgetControl({
            ignore_budget: k.budget_control.ignore_budget || false,
            max_tokens: k.budget_control.max_tokens ?? 1000,
          })
        }
      }
    } catch (error) {
      console.error('Error fetching entry details:', error)
      // Continue with basic edit even if fetch fails
    } finally {
      setIsFetchingEntry(false)
    }
  }

  const handleUpdateEntry = async () => {
    if (!editingEntry || !editEntryContent) {
      toast.error('Please enter content')
      return
    }

    setIsUpdatingEntry(true)
    try {
      const tagArray = editEntryTags
        ? editEntryTags.split(',').map((tag) => ({ tag: tag.trim() })).filter((t) => t.tag)
        : []

      const response = await fetch(`/api/knowledge/${editingEntry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry: editEntryContent,
          type: editEntryType,
          tags: tagArray,
          activation_settings: editActivationSettings,
          positioning: editPositioning,
          advanced_activation: editAdvancedActivation,
          filtering: editFiltering,
          budget_control: editBudgetControl,
        }),
      })

      const data = (await response.json()) as {
        success?: boolean
        knowledge?: KnowledgeEntry
        message?: string
        autoVectorized?: boolean
        vectorCount?: number
      }

      if (data.success) {
        if (data.autoVectorized) {
          toast.success(`Entry updated and vectorized with ${data.vectorCount} chunks!`)
        } else {
          toast.success(data.message || 'Entry updated successfully!')
        }
        setIsEditEntryOpen(false)
        setEditingEntry(null)

        // Refresh entries for the tome
        const tomeId = typeof editingEntry.knowledge_collection === 'string'
          ? editingEntry.knowledge_collection
          : editingEntry.knowledge_collection?.id
        if (tomeId) {
          await fetchEntriesForTome(tomeId)
        }
      } else {
        toast.error(data.message || 'Failed to update entry')
      }
    } catch (error: any) {
      console.error('Error updating entry:', error)
      toast.error(error.message || 'Failed to update entry')
    } finally {
      setIsUpdatingEntry(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadedFile(file)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = (await response.json()) as {
        success?: boolean
        data?: {
          text: string
          fileName: string
          fileSize: number
          tokenEstimate: number
          r2FileKey: string
          mediaId: string
          wordCount: number
        }
        message?: string
      }

      if (data.success && data.data) {
        toast.success(`File uploaded! Extracted ${data.data.wordCount} words.`)
        setEntryContent(data.data.text)
        setR2FileKey(data.data.mediaId)
      } else {
        toast.error(data.message || 'Failed to upload file')
        setUploadedFile(null)
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Failed to upload file')
      setUploadedFile(null)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with create button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-parchment">Lore Library</h2>
          <p className="text-parchment-dim font-lore">
            {tomes.length} {tomes.length === 1 ? 'tome' : 'tomes'} • Organize your knowledge
          </p>
        </div>
        <Button
          onClick={() => setIsCreateTomeOpen(true)}
          className="bg-gold-rich hover:bg-gold-rich/90 text-[#0a140a]"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Tome
        </Button>
      </div>

      {/* Search, Filter, and Sort Controls */}
      {tomes.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-parchment/50" />
              <Input
                placeholder="Search tomes..."
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
                  <SelectItem value="entry_count">Entry Count</SelectItem>
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
                  <Label className="text-parchment text-sm whitespace-nowrap">Entries:</Label>
                  <Select value={filterHasEntries} onValueChange={(v) => setFilterHasEntries(v as typeof filterHasEntries)}>
                    <SelectTrigger className="w-36 glass-rune border-gold-ancient/30 text-parchment h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-rune border-gold-ancient/30">
                      <SelectItem value="all">All Tomes</SelectItem>
                      <SelectItem value="with_entries">With Entries</SelectItem>
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

      {/* Tomes List */}
      {isLoadingTomes ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 text-gold-rich animate-spin mb-4" />
          <p className="text-parchment/60">Loading tomes...</p>
        </div>
      ) : tomes.length === 0 ? (
        <Card className="glass-rune border-gold-ancient/30">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <BookMarked className="w-16 h-16 text-gold-ancient/50 mb-4" />
              <h3 className="text-xl font-display text-parchment mb-2">No Tomes Yet</h3>
              <p className="text-parchment/60 font-lore italic mb-4 max-w-md">
                Tomes are collections of knowledge entries. Create your first tome to start organizing your lore.
              </p>
              <Button
                onClick={() => setIsCreateTomeOpen(true)}
                className="bg-gold-rich hover:bg-gold-rich/90 text-[#0a140a]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Tome
              </Button>
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
                  <BookMarked className="w-8 h-8 text-gold-rich" />
                  <div>
                    <h3 className="text-lg font-display text-parchment">{tome.name}</h3>
                    {tome.description && (
                      <p className="text-sm text-parchment/60">{tome.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="border-gold-ancient/30 text-parchment/70">
                    <BookOpen className="w-3 h-3 mr-1" />
                    {tome.entry_count || 0} entries
                  </Badge>
                  {tome.sharing_settings?.sharing_level === 'shared' && (
                    <Badge variant="outline" className="border-forest/30 text-forest-light">
                      <Users className="w-3 h-3 mr-1" />
                      Shared
                    </Badge>
                  )}
                  {tome.sharing_settings?.sharing_level === 'private' && (
                    <Badge variant="outline" className="border-parchment/20 text-parchment/50">
                      <Lock className="w-3 h-3 mr-1" />
                      Private
                    </Badge>
                  )}
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openShareDialog(tome)}
                      className="h-8 w-8 p-0 text-parchment/60 hover:text-forest"
                      title="Share"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
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
                    {showCreateEntry === tome.id ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-parchment font-semibold">Add New Entry</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowCreateEntry(null)}
                            className="h-8 w-8 p-0 text-parchment/60 hover:text-parchment"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-parchment">Entry Type</Label>
                          <Select value={entryType} onValueChange={setEntryType}>
                            <SelectTrigger className="glass-rune border-gold-ancient/30 text-parchment">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="glass-rune border-gold-ancient/30">
                              <SelectItem value="text">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4" />
                                  Text Entry
                                </div>
                              </SelectItem>
                              <SelectItem value="document">
                                <div className="flex items-center gap-2">
                                  <Upload className="w-4 h-4" />
                                  Document Upload
                                </div>
                              </SelectItem>
                              <SelectItem value="url">
                                <div className="flex items-center gap-2">
                                  <LinkIcon className="w-4 h-4" />
                                  URL/Link
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {entryType === 'document' && (
                          <div className="space-y-2">
                            <Label className="text-parchment">Upload Document</Label>
                            <label
                              className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gold-ancient/30 rounded-lg cursor-pointer hover:border-gold-rich/50 transition-colors glass-rune"
                            >
                              {isUploading ? (
                                <div className="flex items-center gap-2">
                                  <Loader2 className="w-5 h-5 text-gold-rich animate-spin" />
                                  <span className="text-sm text-parchment/60">Uploading...</span>
                                </div>
                              ) : uploadedFile ? (
                                <div className="flex items-center gap-2">
                                  <FileText className="w-5 h-5 text-gold-rich" />
                                  <span className="text-sm text-parchment">{uploadedFile.name}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Upload className="w-5 h-5 text-gold-ancient" />
                                  <span className="text-sm text-parchment">Click to upload (PDF, TXT, MD)</span>
                                </div>
                              )}
                              <input
                                type="file"
                                accept=".pdf,.txt,.md"
                                onChange={handleFileUpload}
                                disabled={isUploading}
                                className="hidden"
                              />
                            </label>
                          </div>
                        )}

                        {(entryType !== 'document' || entryContent) && (
                          <div className="space-y-2">
                            <Label className="text-parchment">
                              Content <span className="text-red-400">*</span>
                            </Label>
                            <Textarea
                              placeholder="Enter your knowledge content here..."
                              value={entryContent}
                              onChange={(e) => setEntryContent(e.target.value)}
                              rows={6}
                              className="glass-rune border-gold-ancient/30 text-parchment placeholder:text-parchment/40 font-lore"
                            />
                            <p className="text-xs text-parchment/50">
                              {entryContent.length} characters • ~{Math.ceil(entryContent.length / 4)} tokens
                            </p>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label className="text-parchment">Tags</Label>
                          <Input
                            placeholder="fantasy, lore, character (comma-separated)"
                            value={entryTags}
                            onChange={(e) => setEntryTags(e.target.value)}
                            className="glass-rune border-gold-ancient/30 text-parchment placeholder:text-parchment/40"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowActivationSettings(!showActivationSettings)}
                          className="flex items-center gap-2 text-sm text-gold-rich hover:text-gold-ancient transition-colors"
                        >
                          <Settings2 className="w-4 h-4" />
                          {showActivationSettings ? 'Hide' : 'Show'} Activation Settings
                          <Badge variant="outline" className="border-gold-ancient/30 text-parchment/70 text-xs">
                            {activationSettings.activation_mode}
                          </Badge>
                        </button>

                        {showActivationSettings && (
                          <div className="border border-gold-ancient/20 rounded-lg p-4 bg-[#0a140a]/30">
                            <ActivationSettings
                              activationSettings={activationSettings}
                              positioning={positioning}
                              advancedActivation={advancedActivation}
                              filtering={filtering}
                              budgetControl={budgetControl}
                              onActivationSettingsChange={setActivationSettings}
                              onPositioningChange={setPositioning}
                              onAdvancedActivationChange={setAdvancedActivation}
                              onFilteringChange={setFiltering}
                              onBudgetControlChange={setBudgetControl}
                            />
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleCreateEntry(tome.id)}
                            disabled={isCreatingEntry || !entryContent}
                            className="bg-gold-rich hover:bg-gold-rich/90 text-[#0a140a]"
                          >
                            {isCreatingEntry ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Entry
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => setShowCreateEntry(null)}
                            variant="outline"
                            className="border-gold-ancient/30 text-parchment"
                          >
                            Cancel
                          </Button>
                        </div>

                        {(activationSettings.activation_mode === 'vector' || activationSettings.activation_mode === 'hybrid') && (
                          <p className="text-xs text-parchment/50 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-gold-rich" />
                            Entry will be automatically vectorized on save
                          </p>
                        )}
                      </div>
                    ) : (
                      <Button
                        onClick={() => setShowCreateEntry(tome.id)}
                        variant="outline"
                        className="border-gold-ancient/30 text-parchment hover:bg-gold-ancient/10"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Entry to Tome
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
                        <BookOpen className="w-12 h-12 text-gold-ancient/30 mx-auto mb-3" />
                        <p className="text-parchment/50 font-lore italic">
                          No entries in this tome yet
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {tomeEntries[tome.id]?.map((entry) => (
                          <div
                            key={entry.id}
                            className="p-4 rounded-lg border border-gold-ancient/20 hover:border-gold-rich/30 transition-all bg-[#0a140a]/20"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="secondary" className="bg-gold-ancient/20 text-gold-rich">
                                    {entry.type}
                                  </Badge>
                                  {entry.is_vectorized ? (
                                    <Badge variant="secondary" className="bg-forest/20 text-forest-light">
                                      <Sparkles className="w-3 h-3 mr-1" />
                                      Vectorized
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="bg-amber-900/20 text-amber-400">
                                      Pending
                                    </Badge>
                                  )}
                                  {entry.chunk_count && entry.chunk_count > 0 && (
                                    <span className="text-xs text-parchment/50">
                                      {entry.chunk_count} chunks
                                    </span>
                                  )}
                                </div>
                                <p className="text-parchment font-lore line-clamp-3">{entry.entry}</p>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-parchment/50">
                                  <span>{entry.tokens} tokens</span>
                                  <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                                  {entry.tags && entry.tags.length > 0 && (
                                    <div className="flex gap-1">
                                      {entry.tags.map((tag, idx) => (
                                        <span key={idx} className="text-gold-rich">#{tag.tag}</span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditEntry(entry)}
                                  className="h-8 w-8 p-0 text-parchment/60 hover:text-gold-rich"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteEntry(entry)}
                                  className="h-8 w-8 p-0 text-parchment/60 hover:text-red-400"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
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
            <DialogTitle className="text-gold-rich">Create New Tome</DialogTitle>
            <DialogDescription className="text-parchment/60">
              Tomes help you organize your knowledge entries into themed groups.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-parchment">
                Tome Name <span className="text-red-400">*</span>
              </Label>
              <Input
                placeholder="e.g., Character Backstories"
                value={newTomeName}
                onChange={(e) => setNewTomeName(e.target.value)}
                className="glass-rune border-gold-ancient/30 text-parchment placeholder:text-parchment/40"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-parchment">Description</Label>
              <Textarea
                placeholder="Describe what this tome contains..."
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
                className="bg-gold-rich hover:bg-gold-rich/90 text-[#0a140a] flex-1"
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
            <DialogTitle className="text-gold-rich">Edit Tome</DialogTitle>
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
                placeholder="e.g., Character Backstories"
                value={editTomeName}
                onChange={(e) => setEditTomeName(e.target.value)}
                className="glass-rune border-gold-ancient/30 text-parchment placeholder:text-parchment/40"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-parchment">Description</Label>
              <Textarea
                placeholder="Describe what this tome contains..."
                value={editTomeDescription}
                onChange={(e) => setEditTomeDescription(e.target.value)}
                rows={4}
                className="glass-rune border-gold-ancient/30 text-parchment placeholder:text-parchment/40"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-parchment">Visibility</Label>
              <Select value={editTomeSharingLevel} onValueChange={(v) => setEditTomeSharingLevel(v as 'private' | 'shared')}>
                <SelectTrigger className="glass-rune border-gold-ancient/30 text-parchment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-rune border-gold-ancient/30">
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <Lock className="w-3 h-3" />
                      Private - Only you can access
                    </div>
                  </SelectItem>
                  <SelectItem value="shared">
                    <div className="flex items-center gap-2">
                      <Users className="w-3 h-3" />
                      Shared - Invite specific users
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
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

      {/* Edit Entry Dialog */}
      <Dialog open={isEditEntryOpen} onOpenChange={setIsEditEntryOpen}>
        <DialogContent className="glass-rune border-gold-ancient/30 text-parchment max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gold-rich">Edit Entry</DialogTitle>
            <DialogDescription className="text-parchment/60">
              Update the entry content, type, tags, and activation settings.
              {editingEntry?.is_vectorized && (
                <span className="block mt-2 text-amber-400">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  Changing the content will trigger re-vectorization.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {isFetchingEntry ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-gold-ancient animate-spin" />
              <span className="ml-3 text-parchment/60">Loading entry details...</span>
            </div>
          ) : (
            <div className="space-y-4 pt-4">
              {/* Entry Type */}
              <div className="space-y-2">
                <Label className="text-parchment">Entry Type</Label>
                <Select value={editEntryType} onValueChange={setEditEntryType}>
                  <SelectTrigger className="glass-rune border-gold-ancient/30 text-parchment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-rune border-gold-ancient/30">
                    <SelectItem value="text">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Text Entry
                      </div>
                    </SelectItem>
                    <SelectItem value="document">
                      <div className="flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Document
                      </div>
                    </SelectItem>
                    <SelectItem value="url">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="w-4 h-4" />
                        URL/Link
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label className="text-parchment">
                  Content <span className="text-red-400">*</span>
                </Label>
                <Textarea
                  placeholder="Enter your knowledge content here..."
                  value={editEntryContent}
                  onChange={(e) => setEditEntryContent(e.target.value)}
                  rows={8}
                  className="glass-rune border-gold-ancient/30 text-parchment placeholder:text-parchment/40 font-lore"
                />
                <p className="text-xs text-parchment/50">
                  {editEntryContent.length} characters • ~{Math.ceil(editEntryContent.length / 4)} tokens
                </p>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label className="text-parchment">Tags</Label>
                <Input
                  placeholder="fantasy, lore, character (comma-separated)"
                  value={editEntryTags}
                  onChange={(e) => setEditEntryTags(e.target.value)}
                  className="glass-rune border-gold-ancient/30 text-parchment placeholder:text-parchment/40"
                />
              </div>

              {/* Activation Settings Toggle */}
              <button
                type="button"
                onClick={() => setShowEditActivationSettings(!showEditActivationSettings)}
                className="flex items-center gap-2 text-sm text-gold-rich hover:text-gold-ancient transition-colors"
              >
                <Settings2 className="w-4 h-4" />
                {showEditActivationSettings ? 'Hide' : 'Show'} Activation Settings
                <Badge variant="outline" className="border-gold-ancient/30 text-parchment/70 text-xs">
                  {editActivationSettings.activation_mode}
                </Badge>
              </button>

              {/* Activation Settings */}
              {showEditActivationSettings && (
                <div className="border border-gold-ancient/20 rounded-lg p-4 bg-[#0a140a]/30">
                  <ActivationSettings
                    activationSettings={editActivationSettings}
                    positioning={editPositioning}
                    advancedActivation={editAdvancedActivation}
                    filtering={editFiltering}
                    budgetControl={editBudgetControl}
                    onActivationSettingsChange={setEditActivationSettings}
                    onPositioningChange={setEditPositioning}
                    onAdvancedActivationChange={setEditAdvancedActivation}
                    onFilteringChange={setEditFiltering}
                    onBudgetControlChange={setEditBudgetControl}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleUpdateEntry}
                  disabled={isUpdatingEntry || !editEntryContent}
                  className="bg-gold-rich hover:bg-gold-rich/90 text-[#0a140a] flex-1"
                >
                  {isUpdatingEntry ? (
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
                  onClick={() => setIsEditEntryOpen(false)}
                  variant="outline"
                  className="border-gold-ancient/30 text-parchment"
                  disabled={isUpdatingEntry}
                >
                  Cancel
                </Button>
              </div>

              {(editActivationSettings.activation_mode === 'vector' || editActivationSettings.activation_mode === 'hybrid') && (
                <p className="text-xs text-parchment/50 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-gold-rich" />
                  Changes to content will trigger automatic re-vectorization
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      {sharingTome && (
        <ShareDialog
          open={isShareDialogOpen}
          onOpenChange={(open) => {
            setIsShareDialogOpen(open)
            if (!open) setSharingTome(null)
          }}
          resourceType="knowledgeCollection"
          resourceId={sharingTome.id}
          resourceName={sharingTome.name}
          allowPublic={false}
        />
      )}
    </div>
  )
}
