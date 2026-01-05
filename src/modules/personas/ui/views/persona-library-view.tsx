'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  User,
  Plus,
  Search,
  Loader2,
  Edit,
  Trash2,
  Star,
  StarOff,
  Globe,
  Lock,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Persona {
  id: string
  name: string
  description: string
  personality_traits?: {
    tone?: string
    formality_level?: string
    humor_style?: string
    communication_style?: string
  }
  appearance?: {
    avatar?: any
    visual_theme?: string
    color_scheme?: string
  }
  behavior_settings?: {
    response_length?: string
    creativity_level?: string
  }
  is_default: boolean
  is_public: boolean
  usage_count: number
  tags?: Array<{ tag: string }>
  created_timestamp: string
  user?: {
    id: string
  }
}

export const PersonaLibraryView = () => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [personas, setPersonas] = useState<Persona[]>([])
  const [filteredPersonas, setFilteredPersonas] = useState<Persona[]>([])

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all')

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch personas on mount
  useEffect(() => {
    fetchPersonas()
  }, [])

  // Apply filters when personas or filter state changes
  useEffect(() => {
    applyFilters()
  }, [personas, searchQuery, visibilityFilter])

  const fetchPersonas = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/personas?limit=100')
      const data = (await response.json()) as { success?: boolean; personas?: Persona[]; message?: string }

      if (data.success) {
        setPersonas(data.personas || [])
      } else {
        toast.error(data.message || 'Failed to fetch personas')
      }
    } catch (error) {
      console.error('Error fetching personas:', error)
      toast.error('Failed to fetch personas')
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...personas]

    // Visibility filter
    if (visibilityFilter === 'my-personas') {
      filtered = filtered.filter(p => p.user)
    } else if (visibilityFilter === 'public') {
      filtered = filtered.filter(p => p.is_public && !p.user)
    } else if (visibilityFilter === 'private') {
      filtered = filtered.filter(p => !p.is_public && p.user)
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.tags?.some(t => t.tag.toLowerCase().includes(query))
      )
    }

    setFilteredPersonas(filtered)
  }

  const handleSetDefault = async (personaId: string) => {
    try {
      const response = await fetch(`/api/personas/${personaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_default: true,
        }),
      })

      const data = (await response.json()) as { success?: boolean; message?: string }

      if (data.success) {
        toast.success('Default persona updated')
        fetchPersonas()
      } else {
        toast.error(data.message || 'Failed to set default persona')
      }
    } catch (error) {
      console.error('Set default error:', error)
      toast.error('An error occurred')
    }
  }

  const handleDelete = async () => {
    if (!selectedPersona) return

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/personas/${selectedPersona.id}`, {
        method: 'DELETE',
      })

      const data = (await response.json()) as { success?: boolean; message?: string }

      if (data.success) {
        toast.success('Persona deleted successfully')
        setIsDeleteDialogOpen(false)
        setSelectedPersona(null)
        fetchPersonas()
      } else {
        toast.error(data.message || 'Failed to delete persona')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('An error occurred while deleting')
    } finally {
      setIsDeleting(false)
    }
  }

  const openDeleteDialog = (persona: Persona) => {
    setSelectedPersona(persona)
    setIsDeleteDialogOpen(true)
  }

  const getToneLabel = (tone?: string) => {
    const labels: Record<string, string> = {
      friendly: 'Friendly',
      professional: 'Professional',
      playful: 'Playful',
      mysterious: 'Mysterious',
      wise: 'Wise',
      humorous: 'Humorous',
      empathetic: 'Empathetic',
      authoritative: 'Authoritative',
    }
    return tone ? labels[tone] || tone : 'Neutral'
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Persona Library
            </h1>
            <p className="text-muted-foreground">
              Create and manage personas for different conversation styles
            </p>
          </div>
          <Link href="/personas/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Persona
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Personas</p>
                  <p className="text-2xl font-bold">{personas.length}</p>
                </div>
                <User className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">My Personas</p>
                  <p className="text-2xl font-bold">
                    {personas.filter(p => p.user).length}
                  </p>
                </div>
                <Lock className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Public</p>
                  <p className="text-2xl font-bold">
                    {personas.filter(p => p.is_public).length}
                  </p>
                </div>
                <Globe className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Default Set</p>
                  <p className="text-2xl font-bold">
                    {personas.filter(p => p.is_default).length}
                  </p>
                </div>
                <Star className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search personas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Personas</SelectItem>
                    <SelectItem value="my-personas">My Personas</SelectItem>
                    <SelectItem value="public">Public Personas</SelectItem>
                    <SelectItem value="private">Private Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('')
                    setVisibilityFilter('all')
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

      {/* Persona List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredPersonas.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No personas found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || visibilityFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first persona to get started'}
              </p>
              <Link href="/personas/create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Persona
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPersonas.map((persona) => (
            <Card key={persona.id} className="relative overflow-hidden">
              {persona.is_default && (
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500">
                    <Star className="mr-1 h-3 w-3 fill-current" />
                    Default
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={persona.appearance?.avatar?.url} />
                    <AvatarFallback>
                      {persona.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{persona.name}</CardTitle>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {getToneLabel(persona.personality_traits?.tone)}
                      </Badge>
                      {persona.is_public && (
                        <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-500">
                          <Globe className="mr-1 h-2 w-2" />
                          Public
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pb-3">
                <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                  {persona.description}
                </p>

                {persona.tags && persona.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap mb-3">
                    {persona.tags.slice(0, 3).map((tagObj, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {tagObj.tag}
                      </Badge>
                    ))}
                    {persona.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{persona.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Used {persona.usage_count} times
                </div>
              </CardContent>

              <CardFooter className="flex gap-2 pt-3">
                {persona.user && (
                  <>
                    {!persona.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(persona.id)}
                      >
                        <Star className="mr-1 h-3 w-3" />
                        Set Default
                      </Button>
                    )}
                    <Link href={`/personas/edit/${persona.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit className="mr-1 h-3 w-3" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteDialog(persona)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </>
                )}
                {!persona.user && (
                  <Button variant="outline" size="sm" className="w-full">
                    <Sparkles className="mr-1 h-3 w-3" />
                    Use This Persona
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Persona</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedPersona?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

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
                  Delete Persona
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
