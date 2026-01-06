'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Key, Plus, Trash2, Loader2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

interface ApiKey {
  id: string
  nickname: string
  provider: string
  is_active: boolean
  last_used?: string
  createdAt: string
  key_preview?: string
}

const providerOptions = [
  { label: 'OpenAI', value: 'openai' },
  { label: 'OpenAI GPT-3.5', value: 'openai-gpt3.5' },
  { label: 'OpenAI GPT-4', value: 'openai-gpt4' },
  { label: 'OpenAI GPT-4-Turbo', value: 'openai-gpt4-turbo' },
  { label: 'Anthropic', value: 'anthropic' },
  { label: 'Anthropic Claude-3-Sonnet', value: 'anthropic-claude3-sonnet' },
  { label: 'Anthropic Claude-3-Opus', value: 'anthropic-claude3-opus' },
  { label: 'Google AI', value: 'google' },
  { label: 'Google Gemini-Pro', value: 'google-gemini-pro' },
  { label: 'Google Gemini-Ultra', value: 'google-gemini-ultra' },
  { label: 'Cohere', value: 'cohere' },
  { label: 'AI21', value: 'ai21' },
  { label: 'Together AI', value: 'together' },
  { label: 'Replicate', value: 'replicate' },
  { label: 'Hugging Face', value: 'huggingface' },
  { label: 'Custom', value: 'custom' },
]

export const ApiKeyManagement = () => {
  const { user } = useUser()
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showKey, setShowKey] = useState(false)

  // Form state for adding new key
  const [newKey, setNewKey] = useState({
    nickname: '',
    provider: '',
    key: '',
  })

  // Fetch API keys on mount
  useEffect(() => {
    const fetchApiKeys = async () => {
      if (!user) return

      try {
        const response = await fetch('/api/api-keys')
        if (response.ok) {
          const data = (await response.json()) as { keys: ApiKey[]; total: number }
          setApiKeys(data.keys || [])
        }
      } catch (error) {
        console.error('Error fetching API keys:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchApiKeys()
  }, [user])

  const handleAddKey = async () => {
    if (!newKey.nickname || !newKey.provider || !newKey.key) {
      toast.error('Please fill in all fields')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKey),
      })

      if (!response.ok) {
        const error = (await response.json()) as { message?: string }
        throw new Error(error.message || 'Failed to add API key')
      }

      const createdKey = (await response.json()) as ApiKey
      setApiKeys((prev) => [createdKey, ...prev])
      setNewKey({ nickname: '', provider: '', key: '' })
      setIsAddDialogOpen(false)
      toast.success('API key added successfully')
    } catch (error: any) {
      console.error('Error adding API key:', error)
      toast.error(error.message || 'Failed to add API key')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteKey = async () => {
    if (!deleteKeyId) return

    setDeletingId(deleteKeyId)

    try {
      const response = await fetch(`/api/api-keys/${deleteKeyId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = (await response.json()) as { message?: string }
        throw new Error(error.message || 'Failed to delete API key')
      }

      setApiKeys((prev) => prev.filter((key) => key.id !== deleteKeyId))
      toast.success('API key deleted successfully')
    } catch (error: any) {
      console.error('Error deleting API key:', error)
      toast.error(error.message || 'Failed to delete API key')
    } finally {
      setDeletingId(null)
      setDeleteKeyId(null)
    }
  }

  const getProviderLabel = (value: string) => {
    return providerOptions.find((opt) => opt.value === value)?.label || value
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <>
      <Card className="glass-rune">
        <CardHeader>
          <CardTitle className="text-parchment font-display flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              API Key Management
            </span>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="ornate-border bg-gold-ancient/20 hover:bg-gold-ancient/30 text-gold-rich"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Key
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-rune border-gold-ancient/30">
                <DialogHeader>
                  <DialogTitle className="text-parchment font-display">Add API Key</DialogTitle>
                  <DialogDescription className="text-parchment-dim">
                    Add a new API key to use with your bots. Your key will be securely stored.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nickname" className="text-parchment">
                      Nickname
                    </Label>
                    <Input
                      id="nickname"
                      placeholder="e.g., My OpenAI Key"
                      value={newKey.nickname}
                      onChange={(e) => setNewKey((prev) => ({ ...prev, nickname: e.target.value }))}
                      className="glass-rune border-gold-ancient/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="provider" className="text-parchment">
                      Provider
                    </Label>
                    <Select
                      value={newKey.provider}
                      onValueChange={(value) => setNewKey((prev) => ({ ...prev, provider: value }))}
                    >
                      <SelectTrigger className="glass-rune border-gold-ancient/30">
                        <SelectValue placeholder="Select a provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {providerOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="key" className="text-parchment">
                      API Key
                    </Label>
                    <div className="relative">
                      <Input
                        id="key"
                        type={showKey ? 'text' : 'password'}
                        placeholder="sk-..."
                        value={newKey.key}
                        onChange={(e) => setNewKey((prev) => ({ ...prev, key: e.target.value }))}
                        className="glass-rune border-gold-ancient/30 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 text-parchment-dim hover:text-parchment"
                        onClick={() => setShowKey(!showKey)}
                      >
                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    className="glass-rune"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddKey}
                    disabled={isSubmitting}
                    className="bg-forest hover:bg-forest/90 text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add Key'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gold-ancient" />
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-8 text-parchment-dim">
              <Key className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-lore">No API keys added yet.</p>
              <p className="text-sm mt-1">Add an API key to start using AI providers with your bots.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-4 border border-gold-ancient/30 rounded-lg bg-[#0a140a]/20"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gold-ancient/20 rounded-full flex items-center justify-center">
                      <Key className="w-4 h-4 text-gold-rich" />
                    </div>
                    <div>
                      <h4 className="text-parchment font-display">{key.nickname}</h4>
                      <p className="text-xs text-parchment-dim font-lore">
                        {getProviderLabel(key.provider)} • Created {formatDate(key.createdAt)}
                        {key.key_preview && ` • ${key.key_preview}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={`${
                        key.is_active
                          ? 'bg-magic-glow/20 text-magic-glow border-magic-glow/30'
                          : 'bg-parchment-dim/20 text-parchment-dim border-parchment-dim/30'
                      }`}
                    >
                      {key.is_active ? 'active' : 'inactive'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-parchment-dim hover:text-red-400"
                      onClick={() => setDeleteKeyId(key.id)}
                      disabled={deletingId === key.id}
                    >
                      {deletingId === key.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteKeyId} onOpenChange={() => setDeleteKeyId(null)}>
        <AlertDialogContent className="glass-rune border-gold-ancient/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-parchment font-display">Delete API Key</AlertDialogTitle>
            <AlertDialogDescription className="text-parchment-dim">
              Are you sure you want to delete this API key? This action cannot be undone and any bots
              using this key will no longer be able to access the provider.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="glass-rune">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteKey}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
