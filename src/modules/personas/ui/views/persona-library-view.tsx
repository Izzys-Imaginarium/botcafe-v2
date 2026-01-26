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
  User,
  Plus,
  Search,
  Loader2,
  Edit,
  Trash2,
  Star,
  Lock
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useInfiniteList } from '@/hooks/use-infinite-list'
import { InfiniteScrollTrigger } from '@/components/ui/infinite-scroll-trigger'

interface Persona {
  id: string
  name: string
  description: string
  gender?: string | null
  age?: number | null
  pronouns?: string | null
  custom_pronouns?: string | null
  appearance?: {
    avatar?: any
  }
  is_default: boolean
  usage_count: number
  custom_instructions?: string | null
  created_timestamp: string
}

export const PersonaLibraryView = () => {
  const router = useRouter()

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Use infinite list hook
  const {
    items: personas,
    isLoading,
    isLoadingMore,
    hasMore,
    total: totalPersonas,
    loadMore,
    refresh,
    setParams,
  } = useInfiniteList<Persona>({
    endpoint: '/api/personas',
    limit: 20,
    initialParams: {},
    itemsKey: 'personas',
  })

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Update API params when search changes
  useEffect(() => {
    const params: Record<string, string> = {}
    if (debouncedSearch) {
      params.search = debouncedSearch
    }
    setParams(params)
  }, [debouncedSearch, setParams])

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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
        refresh()
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
        refresh()
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

  const getGenderLabel = (gender?: string | null) => {
    const labels: Record<string, string> = {
      male: 'Male',
      female: 'Female',
      'non-binary': 'Non-binary',
      unspecified: 'Unspecified',
      other: 'Other',
    }
    return gender ? labels[gender] || gender : null
  }

  const getPronounsLabel = (pronouns?: string | null) => {
    const labels: Record<string, string> = {
      'he-him': 'He/Him',
      'she-her': 'She/Her',
      'they-them': 'They/Them',
      'he-they': 'He/They',
      'she-they': 'She/They',
      'any': 'Any',
      'other': 'Other',
    }
    return pronouns ? labels[pronouns] || pronouns : null
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Personas</p>
                  <p className="text-2xl font-bold">{totalPersonas}</p>
                </div>
                <User className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Default Persona</p>
                  <p className="text-2xl font-bold">
                    {personas.find(p => p.is_default)?.name || 'None set'}
                  </p>
                </div>
                <Star className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Uses</p>
                  <p className="text-2xl font-bold">
                    {personas.reduce((sum, p) => sum + (p.usage_count || 0), 0)}
                  </p>
                </div>
                <Lock className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
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

              {searchQuery && (
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => setSearchQuery('')}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Persona List */}
      {isLoading && personas.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : personas.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No personas found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? 'Try adjusting your search'
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
          {personas.map((persona) => (
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
                      {getGenderLabel(persona.gender) && (
                        <Badge variant="outline" className="text-xs">
                          {getGenderLabel(persona.gender)}
                        </Badge>
                      )}
                      {getPronounsLabel(persona.pronouns) && (
                        <Badge variant="outline" className="text-xs">
                          {getPronounsLabel(persona.pronouns)}
                        </Badge>
                      )}
                      {persona.age && (
                        <Badge variant="outline" className="text-xs">
                          {persona.age} years
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

                <div className="text-xs text-muted-foreground">
                  Used {persona.usage_count} times
                </div>
              </CardContent>

              <CardFooter className="flex gap-2 pt-3">
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
              </CardFooter>
            </Card>
          ))}

          <InfiniteScrollTrigger
            onLoadMore={loadMore}
            hasMore={hasMore}
            isLoading={isLoadingMore}
            endMessage="You've seen all your personas!"
          />
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
