'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  Library,
  Plus,
  ArrowLeft,
  Loader2,
  BookOpen,
  Sparkles,
  Trash2,
  Edit,
  FolderOpen
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export const LoreCollectionsView = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Form state
  const [collectionName, setCollectionName] = useState('')
  const [collectionDescription, setCollectionDescription] = useState('')

  const handleCreateCollection = async () => {
    if (!collectionName) {
      toast.error('Please enter a collection name')
      return
    }

    setIsCreating(true)

    try {
      // TODO: Implement actual API call
      // For now, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      toast.success('Collection created successfully!')

      // Reset form
      setCollectionName('')
      setCollectionDescription('')
      setIsCreateDialogOpen(false)

    } catch (error: any) {
      toast.error(error.message || 'Failed to create collection')
    } finally {
      setIsCreating(false)
    }
  }

  // Mock collections data
  const collections = [
    {
      id: '1',
      name: 'General Knowledge',
      description: 'General purpose knowledge base',
      entry_count: 0,
      vectorized_count: 0,
      created_at: new Date().toISOString(),
    }
  ]

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
            <h1 className="text-4xl font-display font-bold text-gold-rich">Knowledge Collections</h1>
            <p className="text-parchment/70 font-lore italic">
              Organize your knowledge into themed collections
            </p>
          </div>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gold-rich hover:bg-gold-rich/90 text-[#0a140a]">
              <Plus className="w-4 h-4 mr-2" />
              New Collection
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-rune border-gold-ancient/30 text-parchment">
            <DialogHeader>
              <DialogTitle className="text-gold-rich">Create Collection</DialogTitle>
              <DialogDescription className="text-parchment/60">
                Collections help you organize your knowledge entries into themed groups.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-parchment">
                  Collection Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Character Backstories"
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  className="glass-rune border-gold-ancient/30 text-parchment placeholder:text-parchment/40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-parchment">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this collection contains..."
                  value={collectionDescription}
                  onChange={(e) => setCollectionDescription(e.target.value)}
                  rows={4}
                  className="glass-rune border-gold-ancient/30 text-parchment placeholder:text-parchment/40"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleCreateCollection}
                  disabled={isCreating || !collectionName}
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
                      Create Collection
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setIsCreateDialogOpen(false)}
                  variant="outline"
                  className="border-gold-ancient/30 text-parchment"
                  disabled={isCreating}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {collections.map((collection) => (
          <Card key={collection.id} className="glass-rune border-gold-ancient/30 hover:border-gold-rich/50 transition-all group cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <Library className="w-10 h-10 text-gold-ancient group-hover:text-gold-rich transition-colors" />
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-parchment/60 hover:text-gold-rich"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-parchment/60 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CardTitle className="text-parchment text-xl">{collection.name}</CardTitle>
              <CardDescription className="text-parchment/60">
                {collection.description || 'No description'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-parchment/70">
                    <BookOpen className="w-4 h-4" />
                    <span>{collection.entry_count} entries</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-parchment/70">
                    <Sparkles className="w-4 h-4" />
                    <span>{collection.vectorized_count} vectorized</span>
                  </div>
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-gold-ancient/30 text-parchment hover:bg-gold-ancient/10"
                >
                  <Link href={`/lore/collections/${collection.id}`}>
                    <FolderOpen className="w-4 h-4 mr-2" />
                    View Collection
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Empty State */}
        {collections.length === 0 && (
          <div className="col-span-full">
            <Card className="glass-rune border-gold-ancient/30">
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <Library className="w-16 h-16 text-gold-ancient/50 mb-4" />
                  <p className="text-parchment/60 font-lore italic mb-4">
                    No collections yet. Create your first knowledge collection!
                  </p>
                  <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-gold-rich hover:bg-gold-rich/90 text-[#0a140a]"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Collection
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <Card className="glass-rune border-gold-ancient/30">
          <CardHeader>
            <CardTitle className="text-parchment">Collection Best Practices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-parchment/70">
            <p>• Group related knowledge together</p>
            <p>• Use descriptive names</p>
            <p>• Keep collections focused on specific themes</p>
            <p>• Link collections to relevant bots</p>
          </CardContent>
        </Card>

        <Card className="glass-rune border-gold-ancient/30">
          <CardHeader>
            <CardTitle className="text-parchment">Collection Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-parchment/70">
            <p>• Organize entries by theme</p>
            <p>• Track vectorization status</p>
            <p>• Share with specific bots</p>
            <p>• Export and import collections</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
