'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
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
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

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

export const PersonaPanel = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [personas, setPersonas] = useState<Persona[]>([])
  const [filteredPersonas, setFilteredPersonas] = useState<Persona[]>([])

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')

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
  }, [personas, searchQuery])

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

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      )
    }

    setFilteredPersonas(filtered)
  }

  const handleSetDefault = async (personaId: string) => {
    try {
      const response = await fetch(`/api/personas/${personaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_default: true }),
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
    <div className="space-y-6">
      {/* Header with stats and create button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-parchment">Persona Library</h2>
          <p className="text-parchment-dim font-lore">
            {personas.length} {personas.length === 1 ? 'persona' : 'personas'} • Create different conversation styles
          </p>
        </div>
        <Link href="/personas/create">
          <Button className="bg-forest hover:bg-forest/90 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Create Persona
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-rune">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-500/20">
                <User className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-display text-parchment">{personas.length}</p>
                <p className="text-xs text-parchment-dim">Total Personas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-rune">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-gold-ancient/20">
                <Star className="w-5 h-5 text-gold-rich" />
              </div>
              <div>
                <p className="text-lg font-display text-parchment truncate max-w-[150px]">
                  {personas.find(p => p.is_default)?.name || 'None set'}
                </p>
                <p className="text-xs text-parchment-dim">Default Persona</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-rune">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-magic-teal/20">
                <User className="w-5 h-5 text-magic-teal" />
              </div>
              <div>
                <p className="text-2xl font-display text-parchment">
                  {personas.reduce((sum, p) => sum + (p.usage_count || 0), 0)}
                </p>
                <p className="text-xs text-parchment-dim">Total Uses</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="glass-rune">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Label className="text-parchment text-sm">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-parchment/50" />
                <Input
                  placeholder="Search personas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 glass-rune border-gold-ancient/30 text-parchment placeholder:text-parchment/40"
                />
              </div>
            </div>

            {searchQuery && (
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  onClick={() => setSearchQuery('')}
                  className="text-parchment/60 hover:text-parchment"
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Persona List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gold-rich" />
        </div>
      ) : filteredPersonas.length === 0 ? (
        <Card className="glass-rune">
          <CardContent className="py-12">
            <div className="text-center">
              <User className="w-16 h-16 mx-auto mb-4 text-parchment-dim" />
              <h3 className="text-xl font-display text-parchment mb-2">No personas found</h3>
              <p className="text-parchment-dim font-lore mb-6">
                {searchQuery
                  ? 'Try adjusting your search'
                  : 'Create your first persona to get started'}
              </p>
              <Link href="/personas/create">
                <Button className="bg-forest hover:bg-forest/90 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Persona
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPersonas.map((persona) => (
            <Card key={persona.id} className="glass-rune relative overflow-hidden hover:border-gold-ancient/50 transition-colors">
              {persona.is_default && (
                <div className="absolute top-2 right-2">
                  <Badge variant="outline" className="bg-gold-ancient/10 text-gold-rich border-gold-ancient/30">
                    <Star className="mr-1 h-3 w-3 fill-current" />
                    Default
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 border-2 border-gold-ancient/30">
                    <AvatarImage src={persona.appearance?.avatar?.url} />
                    <AvatarFallback className="bg-[#0a140a] text-gold-rich font-display">
                      {persona.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg text-parchment truncate">{persona.name}</CardTitle>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {getGenderLabel(persona.gender) && (
                        <Badge variant="outline" className="text-xs border-gold-ancient/30 text-parchment/70">
                          {getGenderLabel(persona.gender)}
                        </Badge>
                      )}
                      {getPronounsLabel(persona.pronouns) && (
                        <Badge variant="outline" className="text-xs border-gold-ancient/30 text-parchment/70">
                          {getPronounsLabel(persona.pronouns)}
                        </Badge>
                      )}
                      {persona.age && (
                        <Badge variant="outline" className="text-xs border-gold-ancient/30 text-parchment/70">
                          {persona.age} years
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pb-3">
                <p className="text-sm text-parchment-dim font-lore line-clamp-3 mb-3">
                  {persona.description}
                </p>

                <div className="text-xs text-parchment-dim">
                  Used {persona.usage_count} times
                </div>
              </CardContent>

              <CardFooter className="flex gap-2 pt-3">
                {!persona.is_default && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetDefault(persona.id)}
                    className="ornate-border"
                  >
                    <Star className="mr-1 h-3 w-3" />
                    Set Default
                  </Button>
                )}
                <Link href={`/personas/edit/${persona.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full ornate-border">
                    <Edit className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openDeleteDialog(persona)}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="glass-rune border-gold-ancient/30 text-parchment">
          <DialogHeader>
            <DialogTitle className="text-red-400">Delete Persona</DialogTitle>
            <DialogDescription className="text-parchment/60">
              Are you sure you want to delete "{selectedPersona?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

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
