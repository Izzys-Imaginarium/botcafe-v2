'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Users,
  UserPlus,
  Crown,
  Pencil,
  Eye,
  Trash2,
  Loader2,
  AlertCircle,
  Check,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

type Permission = 'owner' | 'editor' | 'readonly'
type ResourceType = 'bot' | 'knowledgeCollection'

interface Collaborator {
  userId: number
  username: string
  displayName: string
  permission: Permission
  avatar?: string | null
  grantedAt?: string
  isOriginalCreator?: boolean
}

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  resourceType: ResourceType
  resourceId: string | number
  resourceName: string
  allowPublic?: boolean // Only true for bots
}

export function ShareDialog({
  open,
  onOpenChange,
  resourceType,
  resourceId,
  resourceName,
  allowPublic = false,
}: ShareDialogProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [originalCreator, setOriginalCreator] = useState<Collaborator | null>(null)
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])

  // Add new collaborator state
  const [username, setUsername] = useState('')
  const [permission, setPermission] = useState<Permission>('editor')
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [lookupResult, setLookupResult] = useState<{
    userId: number
    username: string
    displayName: string
    avatar?: string | null
  } | null>(null)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [isGranting, setIsGranting] = useState(false)

  // Fetch collaborators when dialog opens
  useEffect(() => {
    if (open) {
      fetchCollaborators()
    }
  }, [open, resourceType, resourceId])

  // Clear username lookup when username changes
  useEffect(() => {
    setLookupResult(null)
    setLookupError(null)
  }, [username])

  const fetchCollaborators = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/sharing/${resourceType}/${resourceId}`)
      const data = (await response.json()) as {
        success?: boolean
        originalCreator?: Collaborator | null
        collaborators?: Collaborator[]
        message?: string
      }

      if (data.success) {
        setOriginalCreator(data.originalCreator || null)
        setCollaborators(data.collaborators || [])
      } else {
        toast.error(data.message || 'Failed to load collaborators')
      }
    } catch (error) {
      console.error('Error fetching collaborators:', error)
      toast.error('Failed to load collaborators')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLookupUser = async () => {
    if (!username.trim()) {
      setLookupError('Please enter a username')
      return
    }

    setIsLookingUp(true)
    setLookupError(null)
    setLookupResult(null)

    try {
      const response = await fetch(`/api/users/lookup?username=${encodeURIComponent(username.trim())}`)
      const data = (await response.json()) as {
        success?: boolean
        user?: {
          userId: number
          username: string
          displayName: string
          avatar?: string | null
        }
        message?: string
      }

      if (data.success && data.user) {
        // Check if already a collaborator
        const isAlreadyCollaborator = collaborators.some(c => c.userId === data.user!.userId)
        const isCreator = originalCreator?.userId === data.user.userId

        if (isAlreadyCollaborator || isCreator) {
          setLookupError('This user already has access')
        } else {
          setLookupResult(data.user)
        }
      } else {
        setLookupError(data.message || 'User not found')
      }
    } catch (error) {
      console.error('Error looking up user:', error)
      setLookupError('Failed to look up user')
    } finally {
      setIsLookingUp(false)
    }
  }

  const handleGrantAccess = async () => {
    if (!lookupResult) return

    setIsGranting(true)
    try {
      const response = await fetch('/api/sharing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceType,
          resourceId,
          username: lookupResult.username,
          permission,
        }),
      })

      const data = (await response.json()) as { success?: boolean; message?: string }

      if (data.success) {
        toast.success(`Access granted to @${lookupResult.username}`)
        setUsername('')
        setLookupResult(null)
        setPermission('editor')
        fetchCollaborators()
      } else {
        toast.error(data.message || 'Failed to grant access')
      }
    } catch (error) {
      console.error('Error granting access:', error)
      toast.error('Failed to grant access')
    } finally {
      setIsGranting(false)
    }
  }

  const handleRevokeAccess = async (userId: number, displayName: string) => {
    if (!confirm(`Remove ${displayName}'s access?`)) return

    try {
      const response = await fetch(`/api/sharing/${resourceType}/${resourceId}?userId=${userId}`, {
        method: 'DELETE',
      })

      const data = (await response.json()) as { success?: boolean; message?: string }

      if (data.success) {
        toast.success(`Removed ${displayName}'s access`)
        fetchCollaborators()
      } else {
        toast.error(data.message || 'Failed to remove access')
      }
    } catch (error) {
      console.error('Error revoking access:', error)
      toast.error('Failed to remove access')
    }
  }

  const getPermissionIcon = (perm: Permission) => {
    switch (perm) {
      case 'owner':
        return <Crown className="w-3 h-3" />
      case 'editor':
        return <Pencil className="w-3 h-3" />
      case 'readonly':
        return <Eye className="w-3 h-3" />
    }
  }

  const getPermissionLabel = (perm: Permission) => {
    switch (perm) {
      case 'owner':
        return 'Owner'
      case 'editor':
        return 'Editor'
      case 'readonly':
        return 'Read only'
    }
  }

  const getPermissionColor = (perm: Permission) => {
    switch (perm) {
      case 'owner':
        return 'bg-gold-ancient/20 text-gold-rich border-gold-ancient/30'
      case 'editor':
        return 'bg-forest/20 text-forest-light border-forest/30'
      case 'readonly':
        return 'bg-parchment/10 text-parchment/70 border-parchment/20'
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-rune border-gold-ancient/30 text-parchment max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-gold-rich flex items-center gap-2">
            <Users className="w-5 h-5" />
            Share "{resourceName}"
          </DialogTitle>
          <DialogDescription className="text-parchment/60">
            Invite others to collaborate on this {resourceType === 'bot' ? 'bot' : 'lore book'}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Add collaborator section */}
          <div className="space-y-3">
            <Label className="text-parchment font-medium">Add people</Label>

            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  placeholder="Enter username..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLookupUser()}
                  className="glass-rune border-gold-ancient/30 text-parchment placeholder:text-parchment/40"
                />
              </div>
              <Button
                onClick={handleLookupUser}
                disabled={isLookingUp || !username.trim()}
                variant="outline"
                className="border-gold-ancient/30 text-parchment hover:bg-gold-ancient/10"
              >
                {isLookingUp ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Find'
                )}
              </Button>
            </div>

            {/* Lookup error */}
            {lookupError && (
              <div className="flex items-center gap-2 text-sm text-red-400">
                <AlertCircle className="w-4 h-4" />
                {lookupError}
              </div>
            )}

            {/* Lookup result - ready to add */}
            {lookupResult && (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-gold-ancient/30 bg-[#0a140a]/30">
                <Avatar className="h-10 w-10">
                  {lookupResult.avatar ? (
                    <AvatarImage src={lookupResult.avatar} alt={lookupResult.displayName} />
                  ) : null}
                  <AvatarFallback className="bg-gold-ancient/20 text-gold-rich text-sm">
                    {getInitials(lookupResult.displayName)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="text-parchment font-medium truncate">{lookupResult.displayName}</p>
                  <p className="text-parchment/50 text-sm">@{lookupResult.username}</p>
                </div>

                <Select value={permission} onValueChange={(v) => setPermission(v as Permission)}>
                  <SelectTrigger className="w-28 glass-rune border-gold-ancient/30 text-parchment h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-rune border-gold-ancient/30">
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="readonly">Read only</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-1">
                  <Button
                    size="sm"
                    onClick={handleGrantAccess}
                    disabled={isGranting}
                    className="bg-gold-rich hover:bg-gold-rich/90 text-[#0a140a] h-9"
                  >
                    {isGranting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setLookupResult(null)
                      setUsername('')
                    }}
                    className="h-9 text-parchment/60 hover:text-parchment"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Current collaborators */}
          <div className="space-y-3">
            <Label className="text-parchment font-medium">People with access</Label>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-gold-ancient animate-spin" />
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {/* Original creator */}
                {originalCreator && (
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-gold-rich/30 bg-gold-ancient/5">
                    <Avatar className="h-10 w-10">
                      {originalCreator.avatar ? (
                        <AvatarImage src={originalCreator.avatar} alt={originalCreator.displayName} />
                      ) : null}
                      <AvatarFallback className="bg-gold-ancient/20 text-gold-rich text-sm">
                        {getInitials(originalCreator.displayName)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="text-parchment font-medium truncate">{originalCreator.displayName}</p>
                      <p className="text-parchment/50 text-sm">@{originalCreator.username}</p>
                    </div>

                    <Badge className="bg-gold-ancient/20 text-gold-rich border-gold-ancient/30">
                      <Crown className="w-3 h-3 mr-1" />
                      Creator
                    </Badge>
                  </div>
                )}

                {/* Collaborators */}
                {collaborators.map((collab) => (
                  <div
                    key={collab.userId}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gold-ancient/20 bg-[#0a140a]/20"
                  >
                    <Avatar className="h-10 w-10">
                      {collab.avatar ? (
                        <AvatarImage src={collab.avatar} alt={collab.displayName} />
                      ) : null}
                      <AvatarFallback className="bg-parchment/10 text-parchment text-sm">
                        {getInitials(collab.displayName)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="text-parchment font-medium truncate">{collab.displayName}</p>
                      <p className="text-parchment/50 text-sm">@{collab.username}</p>
                    </div>

                    <Badge className={getPermissionColor(collab.permission)}>
                      {getPermissionIcon(collab.permission)}
                      <span className="ml-1">{getPermissionLabel(collab.permission)}</span>
                    </Badge>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRevokeAccess(collab.userId, collab.displayName)}
                      className="h-8 w-8 p-0 text-parchment/40 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                {collaborators.length === 0 && originalCreator && (
                  <p className="text-center text-parchment/50 py-4 text-sm italic">
                    No other collaborators yet
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Permission guide */}
          <div className="text-xs text-parchment/50 space-y-1 border-t border-gold-ancient/20 pt-4">
            <p><strong className="text-parchment/70">Owner:</strong> Full access including managing collaborators</p>
            <p><strong className="text-parchment/70">Editor:</strong> Can view and edit content</p>
            <p><strong className="text-parchment/70">Read only:</strong> Can view but not edit</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
