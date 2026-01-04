'use client'

import { useState } from 'react'
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
  Code,
  Sparkles,
  ArrowLeft,
  Loader2,
  Check
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export const LoreEntriesView = () => {
  const [activeTab, setActiveTab] = useState('create')
  const [isCreating, setIsCreating] = useState(false)
  const [isVectorizing, setIsVectorizing] = useState(false)

  // Form state
  const [entryType, setEntryType] = useState('text')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [collection, setCollection] = useState('')
  const [applyToBots, setApplyToBots] = useState<string[]>([])

  const handleCreateEntry = async () => {
    if (!title || !content || !collection) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsCreating(true)

    try {
      // TODO: Implement actual API call
      // For now, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      toast.success('Entry created successfully!')

      // Reset form
      setTitle('')
      setContent('')
      setTags('')
      setApplyToBots([])

    } catch (error: any) {
      toast.error(error.message || 'Failed to create entry')
    } finally {
      setIsCreating(false)
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
                          <SelectItem value="code">
                            <div className="flex items-center gap-2">
                              <Code className="w-4 h-4" />
                              Code Snippet
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
                      <Select value={collection} onValueChange={setCollection}>
                        <SelectTrigger id="collection" className="glass-rune border-gold-ancient/30 text-parchment">
                          <SelectValue placeholder="Select a collection" />
                        </SelectTrigger>
                        <SelectContent className="glass-rune border-gold-ancient/30">
                          <SelectItem value="create-new">
                            <div className="flex items-center gap-2 text-gold-rich">
                              <Plus className="w-4 h-4" />
                              Create New Collection
                            </div>
                          </SelectItem>
                          <SelectItem value="general">General Knowledge</SelectItem>
                          <SelectItem value="character-lore">Character Lore</SelectItem>
                          <SelectItem value="world-building">World Building</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-parchment">
                        Title <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        id="title"
                        placeholder="Enter entry title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="glass-rune border-gold-ancient/30 text-parchment placeholder:text-parchment/40"
                      />
                    </div>

                    {/* Content */}
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
                      />
                      <p className="text-xs text-parchment/50">
                        {content.length} characters • Estimated {Math.ceil(content.length / 4)} tokens
                      </p>
                    </div>

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
                        disabled={isCreating || !title || !content || !collection}
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
                    <CardTitle className="text-sm text-parchment">Chunking Strategy</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-parchment/70">
                    <div className="flex justify-between">
                      <span>Method:</span>
                      <Badge variant="secondary" className="bg-gold-ancient/20 text-gold-rich">
                        Paragraph
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Chunk Size:</span>
                      <span className="text-parchment">750 tokens</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Overlap:</span>
                      <span className="text-parchment">50 tokens</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Model:</span>
                      <span className="text-parchment">text-embedding-3-small</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-rune border-gold-ancient/30">
                  <CardHeader>
                    <CardTitle className="text-sm text-parchment">Tips</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-parchment/70">
                    <p>• Write clear, descriptive content</p>
                    <p>• Use proper paragraphs</p>
                    <p>• Add relevant tags</p>
                    <p>• Link to specific bots</p>
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
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <BookOpen className="w-16 h-16 text-gold-ancient/50 mb-4" />
                  <p className="text-parchment/60 font-lore italic">
                    No entries yet. Create your first knowledge entry!
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
