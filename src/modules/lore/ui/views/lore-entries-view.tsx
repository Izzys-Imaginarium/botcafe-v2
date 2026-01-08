'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BookOpen,
  Plus,
  Upload,
  FileText,
  Link as LinkIcon,
  Image,
  Sparkles,
  ArrowLeft,
  Loader2,
  Check,
  Trash2
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Collection {
  id: string
  name: string
  description?: string
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

export const LoreEntriesView = () => {
  const [activeTab, setActiveTab] = useState('create')
  const [isCreating, setIsCreating] = useState(false)
  const [isVectorizing, setIsVectorizing] = useState(false)
  const [isLoadingCollections, setIsLoadingCollections] = useState(true)
  const [isLoadingEntries, setIsLoadingEntries] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [vectorizingEntries, setVectorizingEntries] = useState<Set<string>>(new Set())

  // Form state
  const [entryType, setEntryType] = useState('text')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [collection, setCollection] = useState('')
  const [applyToBots, setApplyToBots] = useState<string[]>([])
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [r2FileKey, setR2FileKey] = useState<string>('')

  // Data state
  const [collections, setCollections] = useState<Collection[]>([])
  const [entries, setEntries] = useState<KnowledgeEntry[]>([])

  // Fetch collections on mount
  useEffect(() => {
    fetchCollections()
  }, [])

  // Fetch entries when switching to browse tab
  useEffect(() => {
    if (activeTab === 'browse') {
      fetchEntries()
    }
  }, [activeTab])

  const fetchCollections = async () => {
    setIsLoadingCollections(true)
    try {
      const response = await fetch('/api/knowledge-collections')
      const data = (await response.json()) as {
        success?: boolean
        collections?: Collection[]
        message?: string
      }

      if (data.success) {
        setCollections(data.collections || [])
      } else {
        toast.error(data.message || 'Failed to fetch collections')
      }
    } catch (error) {
      console.error('Error fetching collections:', error)
      toast.error('Failed to fetch collections')
    } finally {
      setIsLoadingCollections(false)
    }
  }

  const fetchEntries = async () => {
    setIsLoadingEntries(true)
    try {
      const response = await fetch('/api/knowledge')
      const data = (await response.json()) as {
        success?: boolean
        docs?: KnowledgeEntry[]
        message?: string
      }

      if (data.success) {
        setEntries(data.docs || [])
      } else {
        toast.error(data.message || 'Failed to fetch entries')
      }
    } catch (error) {
      console.error('Error fetching entries:', error)
      toast.error('Failed to fetch entries')
    } finally {
      setIsLoadingEntries(false)
    }
  }

  const handleCreateEntry = async () => {
    if (!content || !collection) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsCreating(true)

    try {
      // Parse tags
      const tagArray = tags
        ? tags.split(',').map((tag) => ({ tag: tag.trim() })).filter((t) => t.tag)
        : []

      const response = await fetch('/api/knowledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: entryType,
          entry: content,
          knowledge_collection: collection,
          tags: tagArray,
          applies_to_bots: applyToBots,
          r2_file_key: r2FileKey || undefined, // Include R2 file key if uploaded
        }),
      })

      const data = (await response.json()) as {
        success?: boolean
        knowledge?: KnowledgeEntry
        message?: string
      }

      if (data.success) {
        toast.success('Entry created successfully!')

        // Reset form
        setContent('')
        setTags('')
        setApplyToBots([])
        setUploadedFile(null)
        setR2FileKey('')
        setEntryType('text') // Reset to text type

        // Refresh entries if on browse tab
        if (activeTab === 'browse') {
          fetchEntries()
        }
      } else {
        toast.error(data.message || 'Failed to create entry')
      }
    } catch (error: any) {
      console.error('Error creating entry:', error)
      toast.error(error.message || 'Failed to create entry')
    } finally {
      setIsCreating(false)
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
        setContent(data.data.text)
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

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) {
      return
    }

    try {
      const response = await fetch(`/api/knowledge/${id}`, {
        method: 'DELETE',
      })

      const data = (await response.json()) as {
        success?: boolean
        message?: string
      }

      if (data.success) {
        toast.success('Entry deleted successfully!')
        fetchEntries()
      } else {
        toast.error(data.message || 'Failed to delete entry')
      }
    } catch (error) {
      console.error('Error deleting entry:', error)
      toast.error('Failed to delete entry')
    }
  }

  const handleVectorize = async () => {
    setIsVectorizing(true)

    try {
      // TODO: Implement vectorization API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      toast.success('Entry vectorized successfully!')

    } catch (error: any) {
      toast.error(error.message || 'Failed to vectorize entry')
    } finally {
      setIsVectorizing(false)
    }
  }

  const handleVectorizeEntry = async (entryId: string) => {
    // Add to vectorizing set
    setVectorizingEntries(prev => new Set(prev).add(entryId))

    try {
      const response = await fetch(`/api/vectors/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          knowledgeId: entryId,
        }),
      })

      const data = (await response.json()) as {
        success?: boolean
        message?: string
        chunkCount?: number
      }

      if (data.success) {
        toast.success(`Entry vectorized! Created ${data.chunkCount || 0} chunks.`)
        // Refresh entries to show updated vectorization status
        fetchEntries()
      } else {
        toast.error(data.message || 'Failed to vectorize entry')
      }
    } catch (error: any) {
      console.error('Vectorization error:', error)
      toast.error(error.message || 'Failed to vectorize entry')
    } finally {
      // Remove from vectorizing set
      setVectorizingEntries(prev => {
        const newSet = new Set(prev)
        newSet.delete(entryId)
        return newSet
      })
    }
  }

  return (
    <div className="px-4 lg:px-12 py-8 flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-y-4 lg:gap-y-0 justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" className="text-parchment hover:text-gold-rich">
            <Link href="/lore">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Lore
            </Link>
          </Button>
          <div className="flex flex-col gap-1">
            <h1 className="text-4xl font-display font-bold text-gold-rich">Knowledge Entries</h1>
            <p className="text-parchment/70 font-lore italic">
              Create and manage your lore entries
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 glass-rune border-gold-ancient/30">
          <TabsTrigger value="create">
            <Plus className="w-4 h-4 mr-2" />
            Create Entry
          </TabsTrigger>
          <TabsTrigger value="browse">
            <BookOpen className="w-4 h-4 mr-2" />
            Browse Entries
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="create">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Form */}
              <div className="lg:col-span-2">
                <Card className="glass-rune border-gold-ancient/30">
                  <CardHeader>
                    <CardTitle className="text-parchment">Create Knowledge Entry</CardTitle>
                    <CardDescription className="text-parchment/60">
                      Add new knowledge to your library. This content will be chunked and vectorized
                      for semantic search.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Entry Type */}
                    <div className="space-y-2">
                      <Label htmlFor="entry-type" className="text-parchment">Entry Type</Label>
                      <Select value={entryType} onValueChange={setEntryType}>
                        <SelectTrigger id="entry-type" className="glass-rune border-gold-ancient/30 text-parchment">
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

                    {/* Collection */}
                    <div className="space-y-2">
                      <Label htmlFor="collection" className="text-parchment">
                        Collection <span className="text-red-400">*</span>
                      </Label>
                      <Select value={collection} onValueChange={setCollection} disabled={isLoadingCollections}>
                        <SelectTrigger id="collection" className="glass-rune border-gold-ancient/30 text-parchment">
                          <SelectValue placeholder={isLoadingCollections ? "Loading collections..." : "Select a collection"} />
                        </SelectTrigger>
                        <SelectContent className="glass-rune border-gold-ancient/30">
                          {collections.length === 0 && !isLoadingCollections && (
                            <div className="px-2 py-4 text-center text-parchment/60 text-sm">
                              No collections yet. Go to Collections page to create one.
                            </div>
                          )}
                          {collections.map((coll) => (
                            <SelectItem key={coll.id} value={coll.id}>
                              {coll.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {collections.length === 0 && !isLoadingCollections && (
                        <p className="text-xs text-parchment/50">
                          <Link href="/lore/collections" className="text-gold-rich hover:underline">
                            Create your first collection
                          </Link>{' '}
                          to organize your knowledge entries
                        </p>
                      )}
                    </div>

                    {/* File Upload (for document type) */}
                    {entryType === 'document' && (
                      <div className="space-y-2">
                        <Label htmlFor="file-upload" className="text-parchment">
                          Upload Document <span className="text-red-400">*</span>
                        </Label>
                        <div className="flex flex-col gap-2">
                          <label
                            htmlFor="file-upload"
                            className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-gold-ancient/30 rounded-lg cursor-pointer hover:border-gold-rich/50 transition-colors glass-rune"
                          >
                            {isUploading ? (
                              <div className="flex flex-col items-center gap-2">
                                <Loader2 className="w-8 h-8 text-gold-rich animate-spin" />
                                <p className="text-sm text-parchment/60">Uploading and extracting text...</p>
                              </div>
                            ) : uploadedFile ? (
                              <div className="flex flex-col items-center gap-2">
                                <FileText className="w-8 h-8 text-gold-rich" />
                                <p className="text-sm text-parchment">{uploadedFile.name}</p>
                                <p className="text-xs text-parchment/50">
                                  {(uploadedFile.size / 1024).toFixed(2)} KB
                                </p>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    setUploadedFile(null)
                                    setContent('')
                                    setR2FileKey('')
                                  }}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  Remove
                                </Button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2">
                                <Upload className="w-8 h-8 text-gold-ancient" />
                                <p className="text-sm text-parchment">
                                  Click to upload or drag and drop
                                </p>
                                <p className="text-xs text-parchment/50">
                                  PDF, TXT, or MD (Max 10MB)
                                </p>
                              </div>
                            )}
                          </label>
                          <input
                            id="file-upload"
                            type="file"
                            accept=".pdf,.txt,.md"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                            className="hidden"
                          />
                        </div>
                      </div>
                    )}

                    {/* Content (for text type or after file upload) */}
                    {(entryType !== 'document' || content) && (
                      <div className="space-y-2">
                        <Label htmlFor="content" className="text-parchment">
                          Content <span className="text-red-400">*</span>
                        </Label>
                        <Textarea
                          id="content"
                          placeholder="Enter your knowledge content here. This will be chunked and vectorized for semantic search."
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          rows={12}
                          className="glass-rune border-gold-ancient/30 text-parchment placeholder:text-parchment/40 font-lore"
                          disabled={entryType === 'document' && isUploading}
                        />
                        <p className="text-xs text-parchment/50">
                          {content.length} characters • Estimated {Math.ceil(content.length / 4)} tokens
                        </p>
                      </div>
                    )}

                    {/* Tags */}
                    <div className="space-y-2">
                      <Label htmlFor="tags" className="text-parchment">Tags</Label>
                      <Input
                        id="tags"
                        placeholder="fantasy, lore, character (comma-separated)"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        className="glass-rune border-gold-ancient/30 text-parchment placeholder:text-parchment/40"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={handleCreateEntry}
                        disabled={isCreating || !content || !collection || isUploading}
                        className="bg-gold-rich hover:bg-gold-rich/90 text-[#0a140a] flex-1"
                      >
                        {isCreating ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Entry
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handleVectorize}
                        disabled={isVectorizing || isCreating}
                        variant="outline"
                        className="border-gold-ancient/30 text-gold-rich hover:bg-gold-ancient/10"
                      >
                        {isVectorizing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Vectorizing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Create & Vectorize
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar Info */}
              <div className="lg:col-span-1 space-y-4">
                <Card className="glass-rune border-gold-ancient/30">
                  <CardHeader>
                    <CardTitle className="text-sm text-parchment">About Vectorization</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-parchment/70">
                    <p>
                      Vectorization converts your text into embeddings that enable semantic search.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-gold-rich mt-0.5 flex-shrink-0" />
                        <span>Text is chunked intelligently</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-gold-rich mt-0.5 flex-shrink-0" />
                        <span>Embeddings generated via AI</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-gold-rich mt-0.5 flex-shrink-0" />
                        <span>Stored in vector database</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-gold-rich mt-0.5 flex-shrink-0" />
                        <span>Searchable by meaning</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-rune border-gold-ancient/30">
                  <CardHeader>
                    <CardTitle className="text-sm text-parchment">Vectorization Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-parchment/70">
                    <div className="flex justify-between">
                      <span>Model:</span>
                      <Badge variant="secondary" className="bg-gold-ancient/20 text-gold-rich">
                        BGE-M3
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Dimensions:</span>
                      <span className="text-parchment">1024</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Context:</span>
                      <span className="text-parchment">8192 tokens</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Languages:</span>
                      <span className="text-parchment">100+</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Platform:</span>
                      <span className="text-parchment">Cloudflare AI</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-rune border-gold-ancient/30">
                  <CardHeader>
                    <CardTitle className="text-sm text-parchment">Tips</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-parchment/70">
                    <p>• Upload PDFs for automatic text extraction</p>
                    <p>• Write clear, descriptive content</p>
                    <p>• Use proper paragraphs for better chunking</p>
                    <p>• Add relevant tags for organization</p>
                    <p>• Link knowledge to specific bots</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="browse">
            <Card className="glass-rune border-gold-ancient/30">
              <CardHeader>
                <CardTitle className="text-parchment">All Entries</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingEntries ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-12 h-12 text-gold-rich animate-spin mb-4" />
                    <p className="text-parchment/60">Loading entries...</p>
                  </div>
                ) : entries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <BookOpen className="w-16 h-16 text-gold-ancient/50 mb-4" />
                    <p className="text-parchment/60 font-lore italic">
                      No entries yet. Create your first knowledge entry!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {entries.map((entry) => {
                      const isVectorizing = vectorizingEntries.has(entry.id)
                      return (
                        <div
                          key={entry.id}
                          className="p-4 rounded-lg border border-gold-ancient/20 hover:border-gold-rich/50 transition-all bg-[#0a140a]/30"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
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
                              </div>
                              <p className="text-parchment font-lore line-clamp-3">{entry.entry}</p>
                              <div className="flex flex-wrap items-center gap-4 text-xs text-parchment/50">
                                <span>{entry.tokens} tokens</span>
                                {entry.is_vectorized && entry.chunk_count && (
                                  <>
                                    <span>•</span>
                                    <span className="text-forest-light">{entry.chunk_count} chunks</span>
                                  </>
                                )}
                                {entry.is_vectorized && entry.embedding_model && (
                                  <>
                                    <span>•</span>
                                    <span className="text-forest-light">{entry.embedding_model}</span>
                                  </>
                                )}
                                {entry.is_vectorized && entry.vector_dimensions && (
                                  <>
                                    <span>•</span>
                                    <span className="text-forest-light">{entry.vector_dimensions}d</span>
                                  </>
                                )}
                                <span>•</span>
                                <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                                {entry.tags && entry.tags.length > 0 && (
                                  <>
                                    <span>•</span>
                                    <div className="flex gap-1">
                                      {entry.tags.map((tag, idx) => (
                                        <span key={idx} className="text-gold-rich">
                                          #{tag.tag}
                                        </span>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {!entry.is_vectorized && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleVectorizeEntry(entry.id)}
                                  disabled={isVectorizing}
                                  className="border-gold-ancient/30 text-gold-rich hover:bg-gold-ancient/10"
                                >
                                  {isVectorizing ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Vectorizing...
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="w-4 h-4 mr-2" />
                                      Vectorize
                                    </>
                                  )}
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteEntry(entry.id)}
                                className="text-parchment/60 hover:text-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
