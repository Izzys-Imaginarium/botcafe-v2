'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Bot, Wand2, Image, MessageSquare, Settings, Sparkles, Sliders, Tag, Plus, X, BookMarked, Check, Loader2, Users, Globe, Lock, Share2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { MagicalBackground } from '@/modules/home/ui/components/magical-background'
import { ShareDialog } from '@/components/share-dialog'
import { useUser } from '@clerk/nextjs'

type Visibility = 'private' | 'shared' | 'public'

export interface BotFormData {
  name: string
  creator_display_name: string
  description: string
  system_prompt: string
  greeting: string
  gender: string
  age: string
  is_public: boolean
  visibility: Visibility
  slug: string
  speech_examples: string[]
  knowledge_collections: (string | number)[]
  picture: File | string | number | null
  personality_traits: {
    tone: string
    formality_level: string
    humor_style: string
    communication_style: string
  }
  behavior_settings: {
    response_length: string
    creativity_level: string
    knowledge_sharing: string
  }
  signature_phrases: string[]
  tags: string[]
  classifications: string[]
}

interface BotWizardFormProps {
  mode: 'create' | 'edit'
  initialData?: Partial<BotFormData>
  botId?: string | number
  onSuccess?: (bot: any) => void
}

const steps = [
  {
    id: 'basic',
    title: 'Basic Information',
    description: 'Give your bot a name and identity',
    icon: Bot,
  },
  {
    id: 'personality',
    title: 'Personality & Voice',
    description: 'Define how your bot talks and behaves',
    icon: MessageSquare,
  },
  {
    id: 'behavior',
    title: 'Behavior Settings',
    description: 'Fine-tune response style and creativity',
    icon: Sliders,
  },
  {
    id: 'tags',
    title: 'Tags & Phrases',
    description: 'Add tags and signature expressions',
    icon: Tag,
  },
  {
    id: 'knowledge',
    title: 'Knowledge Base',
    description: 'Connect knowledge collections to your bot',
    icon: Sparkles,
  },
  {
    id: 'appearance',
    title: 'Appearance',
    description: 'Customize your bot\'s visual identity',
    icon: Image,
  },
  {
    id: 'review',
    title: 'Review & Save',
    description: 'Review settings and save your bot',
    icon: Settings,
  },
]

export function BotWizardForm({ mode, initialData, botId, onSuccess }: BotWizardFormProps) {
  const router = useRouter()
  const { user: clerkUser } = useUser()
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Bot form data with defaults
  const [botData, setBotData] = useState<BotFormData>({
    name: initialData?.name || '',
    creator_display_name: initialData?.creator_display_name || '',
    description: initialData?.description || '',
    system_prompt: initialData?.system_prompt || '',
    greeting: initialData?.greeting || '',
    gender: initialData?.gender || '',
    age: initialData?.age || '',
    is_public: initialData?.is_public || false,
    visibility: initialData?.visibility || (initialData?.is_public ? 'public' : 'private'),
    slug: initialData?.slug || '',
    speech_examples: initialData?.speech_examples || [''],
    knowledge_collections: initialData?.knowledge_collections || [],
    picture: initialData?.picture || null,
    personality_traits: {
      tone: initialData?.personality_traits?.tone || '',
      formality_level: initialData?.personality_traits?.formality_level || '',
      humor_style: initialData?.personality_traits?.humor_style || '',
      communication_style: initialData?.personality_traits?.communication_style || '',
    },
    behavior_settings: {
      response_length: initialData?.behavior_settings?.response_length || 'medium',
      creativity_level: initialData?.behavior_settings?.creativity_level || 'moderate',
      knowledge_sharing: initialData?.behavior_settings?.knowledge_sharing || 'balanced',
    },
    signature_phrases: initialData?.signature_phrases || [''],
    tags: initialData?.tags || [],
    classifications: initialData?.classifications || [],
  })

  // Share dialog state
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [picturePreview, setPicturePreview] = useState<string | null>(null)

  // Set creator_display_name from Clerk username
  useEffect(() => {
    if (clerkUser?.username && !botData.creator_display_name) {
      setBotData(prev => ({ ...prev, creator_display_name: clerkUser.username || '' }))
    }
  }, [clerkUser?.username])

  // Creator username for URL display
  const [creatorUsername, setCreatorUsername] = useState<string | null>(null)

  // Knowledge collections state
  interface KnowledgeCollection {
    id: string | number
    name: string
    description?: string
    entry_count?: number
  }
  const [availableCollections, setAvailableCollections] = useState<KnowledgeCollection[]>([])
  const [isLoadingCollections, setIsLoadingCollections] = useState(false)
  const [collectionSearchQuery, setCollectionSearchQuery] = useState('')

  // Filter collections based on search query
  const filteredCollections = useMemo(() => {
    if (!collectionSearchQuery.trim()) {
      return availableCollections
    }
    const query = collectionSearchQuery.toLowerCase()
    return availableCollections.filter(
      (collection) =>
        collection.name.toLowerCase().includes(query) ||
        (collection.description && collection.description.toLowerCase().includes(query))
    )
  }, [availableCollections, collectionSearchQuery])

  // Fetch available knowledge collections
  const fetchCollections = useCallback(async () => {
    setIsLoadingCollections(true)
    try {
      const response = await fetch('/api/knowledge-collections')
      const data = (await response.json()) as { success?: boolean; collections?: KnowledgeCollection[] }
      if (data.success && data.collections) {
        setAvailableCollections(data.collections)
      }
    } catch (error) {
      console.error('Error fetching collections:', error)
    } finally {
      setIsLoadingCollections(false)
    }
  }, [])

  // Fetch collections when reaching the knowledge step
  useEffect(() => {
    if (currentStep === 4) {
      fetchCollections()
    }
  }, [currentStep, fetchCollections])

  // Fetch creator profile to get username for URL display
  useEffect(() => {
    const fetchCreatorProfile = async () => {
      try {
        const response = await fetch('/api/creators/me')
        const data = await response.json() as { success?: boolean; creator?: { username?: string } }
        if (data.success && data.creator?.username) {
          setCreatorUsername(data.creator.username)
        }
      } catch (error) {
        console.error('Error fetching creator profile:', error)
      }
    }
    fetchCreatorProfile()
  }, [])

  // Toggle collection selection
  const toggleCollectionSelection = (collectionId: string | number) => {
    setBotData(prev => {
      const currentSelections = prev.knowledge_collections
      const stringId = String(collectionId)
      const isSelected = currentSelections.some(id => String(id) === stringId)

      if (isSelected) {
        return {
          ...prev,
          knowledge_collections: currentSelections.filter(id => String(id) !== stringId)
        }
      } else {
        return {
          ...prev,
          knowledge_collections: [...currentSelections, collectionId]
        }
      }
    })
  }

  const isCollectionSelected = (collectionId: string | number) => {
    return botData.knowledge_collections.some(id => String(id) === String(collectionId))
  }

  // Load existing picture preview if in edit mode
  useEffect(() => {
    if (mode === 'edit' && initialData?.picture && typeof initialData.picture === 'string') {
      setPicturePreview(initialData.picture)
    }
  }, [mode, initialData?.picture])

  // Auto-generate slug from name only in create mode
  const handleNameChange = (value: string) => {
    if (mode === 'create') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      setBotData(prev => ({ ...prev, name: value, slug }))
    } else {
      setBotData(prev => ({ ...prev, name: value }))
    }
  }

  const handleInputChange = (field: keyof BotFormData, value: any) => {
    setBotData(prev => ({ ...prev, [field]: value }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (5MB limit)
      const MAX_SIZE = 5 * 1024 * 1024
      if (file.size > MAX_SIZE) {
        toast.error(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 5MB.`)
        e.target.value = '' // Reset the input
        return
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      if (!validTypes.includes(file.type)) {
        toast.error('Invalid file type. Please use PNG, JPG, GIF, or WebP.')
        e.target.value = ''
        return
      }

      setBotData(prev => ({ ...prev, picture: file }))

      const reader = new FileReader()
      reader.onloadend = () => {
        setPicturePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setBotData(prev => ({ ...prev, picture: null }))
    setPicturePreview(null)
  }

  const handleSpeechExampleChange = (index: number, value: string) => {
    const newExamples = [...botData.speech_examples]
    newExamples[index] = value
    setBotData(prev => ({ ...prev, speech_examples: newExamples }))
  }

  const addSpeechExample = () => {
    setBotData(prev => ({
      ...prev,
      speech_examples: [...prev.speech_examples, '']
    }))
  }

  const removeSpeechExample = (index: number) => {
    setBotData(prev => ({
      ...prev,
      speech_examples: prev.speech_examples.filter((_, i) => i !== index)
    }))
  }

  // Signature phrase handlers
  const handleSignaturePhraseChange = (index: number, value: string) => {
    const newPhrases = [...botData.signature_phrases]
    newPhrases[index] = value
    setBotData(prev => ({ ...prev, signature_phrases: newPhrases }))
  }

  const addSignaturePhrase = () => {
    setBotData(prev => ({
      ...prev,
      signature_phrases: [...prev.signature_phrases, '']
    }))
  }

  const removeSignaturePhrase = (index: number) => {
    setBotData(prev => ({
      ...prev,
      signature_phrases: prev.signature_phrases.filter((_, i) => i !== index)
    }))
  }

  // Tag handlers
  const [newTag, setNewTag] = useState('')

  const addTag = () => {
    if (newTag.trim() && !botData.tags.includes(newTag.trim())) {
      setBotData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setBotData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove)
    }))
  }

  // Personality traits handler
  const handlePersonalityChange = (field: keyof BotFormData['personality_traits'], value: string) => {
    setBotData(prev => ({
      ...prev,
      personality_traits: { ...prev.personality_traits, [field]: value }
    }))
  }

  // Behavior settings handler
  const handleBehaviorChange = (field: keyof BotFormData['behavior_settings'], value: string) => {
    setBotData(prev => ({
      ...prev,
      behavior_settings: { ...prev.behavior_settings, [field]: value }
    }))
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 0: // Basic Information
        return botData.name && botData.slug && clerkUser?.username
      case 1: // Personality & Voice
        return botData.system_prompt
      case 2: // Behavior Settings
        return true // Optional step
      case 3: // Tags & Phrases
        return true // Optional step
      case 4: // Knowledge Base
        return true // Optional step
      case 5: // Appearance
        return true // Optional step
      case 6: // Review
        return true
      default:
        return false
    }
  }

  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)

    try {
      let pictureId: string | number | undefined = undefined

      // Upload image if it's a new file
      if (botData.picture instanceof File) {
        const formData = new FormData()
        formData.append('file', botData.picture)
        formData.append('alt', `${botData.name} profile picture`)

        const uploadResponse = await fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
        })

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json() as { doc: { id: string | number } }
          pictureId = uploadResult.doc.id
        } else {
          const errorData = await uploadResponse.json() as { error?: string }
          toast.error(errorData.error || `Failed to upload image. ${mode === 'create' ? 'Creating' : 'Updating'} bot without picture change.`)
        }
      } else if (typeof botData.picture === 'number' || typeof botData.picture === 'string') {
        // Existing picture ID
        pictureId = botData.picture
      }

      const cleanedData = {
        name: botData.name,
        creator_display_name: clerkUser?.username || botData.creator_display_name,
        description: botData.description,
        system_prompt: botData.system_prompt,
        greeting: botData.greeting,
        gender: botData.gender,
        age: botData.age ? parseInt(botData.age.toString()) : undefined,
        is_public: botData.visibility === 'public',
        slug: botData.slug,
        speech_examples: botData.speech_examples.filter(example => example.trim() !== ''),
        knowledge_collections: botData.knowledge_collections,
        picture: pictureId,
        personality_traits: botData.personality_traits,
        behavior_settings: botData.behavior_settings,
        signature_phrases: botData.signature_phrases.filter(phrase => phrase.trim() !== ''),
        tags: botData.tags,
        classifications: botData.classifications,
        sharing: {
          visibility: botData.visibility,
        },
      }

      const url = mode === 'create' ? '/api/bots' : `/api/bots/${botId}`
      const method = mode === 'create' ? 'POST' : 'PATCH'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedData),
      })

      if (response.ok) {
        const result = await response.json() as { slug: string; message: string; bot?: any; url?: string; username?: string }
        toast.success(result.message || `Bot ${mode === 'create' ? 'created' : 'updated'} successfully!`)

        if (onSuccess) {
          onSuccess(result.bot || result)
        } else {
          // Use new URL format if available, otherwise fall back to explore
          if (result.url) {
            router.push(result.url)
          } else if (result.username && result.slug) {
            router.push(`/${result.username}/${result.slug}`)
          } else {
            router.push('/explore')
          }
        }
      } else {
        const error = await response.json() as { message: string }
        toast.error(error.message || `Failed to ${mode} bot`)
      }
    } catch (error) {
      console.error(`Error ${mode === 'create' ? 'creating' : 'updating'} bot:`, error)
      toast.error(`Failed to ${mode} bot. Please try again.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render step content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Bot Name *</Label>
              <Input
                id="name"
                placeholder="Enter your bot's name"
                value={botData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="glass-rune"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="creator_display_name">Creator Name</Label>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md border border-gold-ancient/30">
                <span className="text-parchment font-medium">@{clerkUser?.username || 'Loading...'}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your username from your account. This cannot be changed here.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Bot URL Slug *</Label>
              <Input
                id="slug"
                placeholder="bot-name-for-url"
                value={botData.slug}
                onChange={(e) => {
                  // Sanitize slug: lowercase, replace spaces/special chars with hyphens
                  const sanitized = e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, '-')
                    .replace(/-+/g, '-')
                  handleInputChange('slug', sanitized)
                }}
                className="glass-rune"
              />
              <p className="text-sm text-muted-foreground">
                This will be your bot's unique URL: {creatorUsername || 'username'}/{botData.slug || 'your-bot-name'}
                {mode === 'edit' && ' (changing this will update your bot\'s URL)'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what your bot does and its personality..."
                value={botData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="glass-rune min-h-[100px]"
              />
            </div>
          </div>
        )

      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="system_prompt">System Prompt *</Label>
              <Textarea
                id="system_prompt"
                placeholder="Define your bot's core personality, behavior, and how it should respond to users..."
                value={botData.system_prompt}
                onChange={(e) => handleInputChange('system_prompt', e.target.value)}
                className="glass-rune min-h-[150px]"
              />
              <p className="text-sm text-muted-foreground">
                This is the core instruction that defines your bot's personality and behavior.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="greeting">Greeting Message</Label>
              <Textarea
                id="greeting"
                placeholder="How your bot should greet users when they start a conversation..."
                value={botData.greeting}
                onChange={(e) => handleInputChange('greeting', e.target.value)}
                className="glass-rune"
              />
            </div>

            <div className="space-y-4">
              <Label>Speech Examples</Label>
              <p className="text-sm text-muted-foreground">
                Add example phrases your bot might say to help define its voice.
              </p>
              {botData.speech_examples.map((example, index) => (
                <div key={`speech-${index}`} className="flex gap-2">
                  <Input
                    placeholder={`Example ${index + 1}`}
                    value={example}
                    onChange={(e) => handleSpeechExampleChange(index, e.target.value)}
                    className="glass-rune"
                  />
                  {botData.speech_examples.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeSpeechExample(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addSpeechExample}
                className="w-full"
              >
                Add Another Example
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={botData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                  <SelectTrigger className="glass-rune">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="non-binary">Non-binary</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min="1"
                  max="9999"
                  placeholder="Age"
                  value={botData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  className="glass-rune"
                />
              </div>
            </div>

            {/* Personality Traits */}
            <div className="border-t border-gold-ancient/20 pt-6">
              <h4 className="text-sm font-semibold text-gold-rich mb-4">Personality Traits</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tone</Label>
                  <Select value={botData.personality_traits.tone} onValueChange={(value) => handlePersonalityChange('tone', value)}>
                    <SelectTrigger className="glass-rune">
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="playful">Playful</SelectItem>
                      <SelectItem value="mysterious">Mysterious</SelectItem>
                      <SelectItem value="wise">Wise</SelectItem>
                      <SelectItem value="humorous">Humorous</SelectItem>
                      <SelectItem value="empathetic">Empathetic</SelectItem>
                      <SelectItem value="authoritative">Authoritative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Formality Level</Label>
                  <Select value={botData.personality_traits.formality_level} onValueChange={(value) => handlePersonalityChange('formality_level', value)}>
                    <SelectTrigger className="glass-rune">
                      <SelectValue placeholder="Select formality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="very-casual">Very Casual</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="very-formal">Very Formal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Humor Style</Label>
                  <Select value={botData.personality_traits.humor_style} onValueChange={(value) => handlePersonalityChange('humor_style', value)}>
                    <SelectTrigger className="glass-rune">
                      <SelectValue placeholder="Select humor style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="sarcastic">Sarcastic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Communication Style</Label>
                  <Select value={botData.personality_traits.communication_style} onValueChange={(value) => handlePersonalityChange('communication_style', value)}>
                    <SelectTrigger className="glass-rune">
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direct">Direct</SelectItem>
                      <SelectItem value="elaborate">Elaborate</SelectItem>
                      <SelectItem value="concise">Concise</SelectItem>
                      <SelectItem value="storytelling">Storytelling</SelectItem>
                      <SelectItem value="questioning">Questioning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        )

      case 2: // Behavior Settings
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Response Length</Label>
                <Select value={botData.behavior_settings.response_length} onValueChange={(value) => handleBehaviorChange('response_length', value)}>
                  <SelectTrigger className="glass-rune">
                    <SelectValue placeholder="Select length" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="very-short">Very Short</SelectItem>
                    <SelectItem value="short">Short</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="long">Long</SelectItem>
                    <SelectItem value="very-long">Very Long</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">How long responses should be</p>
              </div>

              <div className="space-y-2">
                <Label>Creativity Level</Label>
                <Select value={botData.behavior_settings.creativity_level} onValueChange={(value) => handleBehaviorChange('creativity_level', value)}>
                  <SelectTrigger className="glass-rune">
                    <SelectValue placeholder="Select creativity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">Conservative</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                    <SelectItem value="highly-creative">Highly Creative</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">How creative or unpredictable</p>
              </div>

              <div className="space-y-2">
                <Label>Knowledge Sharing</Label>
                <Select value={botData.behavior_settings.knowledge_sharing} onValueChange={(value) => handleBehaviorChange('knowledge_sharing', value)}>
                  <SelectTrigger className="glass-rune">
                    <SelectValue placeholder="Select sharing" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="very-limited">Very Limited</SelectItem>
                    <SelectItem value="limited">Limited</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="generous">Generous</SelectItem>
                    <SelectItem value="very-generous">Very Generous</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">How freely it shares information</p>
              </div>
            </div>
          </div>
        )

      case 3: // Tags & Phrases
        return (
          <div className="space-y-6">
            {/* Classifications */}
            <div className="space-y-4">
              <div>
                <Label>Classifications</Label>
                <p className="text-sm text-muted-foreground">Select categories that describe your bot (up to 5)</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'conversational-ai', label: 'Conversational AI' },
                  { value: 'creative-writing', label: 'Creative Writing' },
                  { value: 'fantasy-rpg', label: 'Fantasy/RPG' },
                  { value: 'gaming', label: 'Gaming' },
                  { value: 'fanfic', label: 'Fanfic' },
                  { value: 'oc', label: 'OC (Original Characters)' },
                  { value: 'dead-dove', label: 'Dead Dove' },
                  { value: 'comedy-parody', label: 'Comedy/Parody' },
                  { value: 'long-form', label: 'Long-form' },
                  { value: 'one-shot', label: 'One-shot' },
                ].map((option) => {
                  const isSelected = botData.classifications.includes(option.value)
                  return (
                    <Badge
                      key={option.value}
                      variant={isSelected ? 'default' : 'outline'}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-forest hover:bg-forest/80'
                          : 'hover:bg-forest/20'
                      }`}
                      onClick={() => {
                        if (isSelected) {
                          setBotData(prev => ({
                            ...prev,
                            classifications: prev.classifications.filter(c => c !== option.value)
                          }))
                        } else if (botData.classifications.length < 5) {
                          setBotData(prev => ({
                            ...prev,
                            classifications: [...prev.classifications, option.value]
                          }))
                        } else {
                          toast.error('Maximum 5 classifications allowed')
                        }
                      }}
                    >
                      {option.label}
                    </Badge>
                  )
                })}
              </div>
              {botData.classifications.length > 0 && (
                <p className="text-sm text-forest">
                  {botData.classifications.length} classification{botData.classifications.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            {/* Tags */}
            <div className="space-y-4 border-t border-gold-ancient/20 pt-6">
              <div>
                <Label>Tags</Label>
                <p className="text-sm text-muted-foreground">Add custom tags to help users discover your bot</p>
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag (e.g., fantasy, helper, roleplay)"
                  className="glass-rune"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addTag} className="glass-rune">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {botData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {botData.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="pr-1">
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 ml-1"
                        onClick={() => removeTag(tag)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Signature Phrases */}
            <div className="space-y-4 border-t border-gold-ancient/20 pt-6">
              <div>
                <Label>Signature Phrases</Label>
                <p className="text-sm text-muted-foreground">Catchphrases or expressions your bot commonly uses</p>
              </div>
              {botData.signature_phrases.map((phrase, index) => (
                <div key={`phrase-${index}`} className="flex gap-2">
                  <Input
                    placeholder={`Phrase ${index + 1} (e.g., "By the stars!", "Let me think...")`}
                    value={phrase}
                    onChange={(e) => handleSignaturePhraseChange(index, e.target.value)}
                    className="glass-rune"
                  />
                  {botData.signature_phrases.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeSignaturePhrase(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addSignaturePhrase}
                className="w-full glass-rune"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Phrase
              </Button>
            </div>
          </div>
        )

      case 4: // Knowledge Base
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-gold-rich">Knowledge Tomes</Label>
              <p className="text-sm text-muted-foreground">
                Select knowledge tomes to give your bot specialized knowledge. Tomes contain entries that will be used during conversations.
              </p>
            </div>

            {isLoadingCollections ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 text-forest animate-spin" />
                <span className="ml-3 text-muted-foreground">Loading tomes...</span>
              </div>
            ) : availableCollections.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gold-ancient/30 rounded-lg glass-rune">
                <BookMarked className="h-12 w-12 mx-auto text-gold-ancient/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-parchment">No Tomes Available</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  You haven't created any knowledge tomes yet.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.open('/lore', '_blank')}
                  className="glass-rune border-gold-ancient/30 hover:border-gold-rich"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create a Tome
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Search input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tomes by name or description..."
                    value={collectionSearchQuery}
                    onChange={(e) => setCollectionSearchQuery(e.target.value)}
                    className="pl-10 glass-rune"
                  />
                </div>

                {/* Collection list */}
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {filteredCollections.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No tomes match "{collectionSearchQuery}"</p>
                  </div>
                ) : (
                  filteredCollections.map((collection) => (
                  <div
                    key={collection.id}
                    onClick={() => toggleCollectionSelection(collection.id)}
                    className={`
                      p-4 rounded-lg border-2 cursor-pointer transition-all
                      ${isCollectionSelected(collection.id)
                        ? 'border-forest bg-forest/10 glass-rune'
                        : 'border-gold-ancient/30 hover:border-gold-rich/50 glass-rune'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <BookMarked className={`h-5 w-5 mt-0.5 ${isCollectionSelected(collection.id) ? 'text-forest' : 'text-gold-ancient'}`} />
                        <div>
                          <h4 className="font-medium text-parchment">{collection.name}</h4>
                          {collection.description && (
                            <p className="text-sm text-muted-foreground mt-1">{collection.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {collection.entry_count || 0} entries
                          </p>
                        </div>
                      </div>
                      <div className={`
                        w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                        ${isCollectionSelected(collection.id)
                          ? 'border-forest bg-forest text-white'
                          : 'border-gold-ancient/30'
                        }
                      `}>
                        {isCollectionSelected(collection.id) && <Check className="h-4 w-4" />}
                      </div>
                    </div>
                  </div>
                  ))
                )}
                </div>

                {botData.knowledge_collections.length > 0 && (
                  <p className="text-sm text-forest mt-4">
                    {botData.knowledge_collections.length} tome{botData.knowledge_collections.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
            )}
          </div>
        )

      case 5: // Appearance
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label htmlFor="picture">Bot Profile Picture</Label>
              <p className="text-sm text-muted-foreground">
                Upload an image that represents your bot (optional)
              </p>

              {picturePreview ? (
                <div className="space-y-4">
                  <div className="relative w-48 h-48 mx-auto">
                    <img
                      src={picturePreview}
                      alt="Bot preview"
                      className="w-full h-full object-cover rounded-lg border-2 border-forest glass-rune"
                    />
                  </div>
                  <div className="text-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleRemoveImage}
                      className="glass-rune border-gold-ancient/30 hover:border-gold-rich hover:text-gold-rich"
                    >
                      Remove Image
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gold-ancient/30 rounded-lg p-8 text-center glass-rune">
                  <Image className="h-12 w-12 mx-auto text-gold-ancient mb-4" />
                  <input
                    type="file"
                    id="picture"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    asChild
                    variant="outline"
                    className="glass-rune border-gold-ancient/30 hover:border-gold-rich hover:text-gold-rich"
                  >
                    <label htmlFor="picture" className="cursor-pointer">
                      Choose Image
                    </label>
                  </Button>
                  <p className="text-sm text-parchment-dim mt-2">
                    PNG, JPG, GIF, WebP up to 5MB
                  </p>
                </div>
              )}
            </div>
          </div>
        )

      case 6: // Review
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Wand2 className="h-12 w-12 mx-auto text-forest mb-4" />
              <h3 className="text-lg font-semibold text-gold-rich">Review Your Bot</h3>
              <p className="text-muted-foreground">Double-check everything before {mode === 'create' ? 'creating' : 'saving changes to'} your bot.</p>
            </div>

            <div className="grid gap-4">
              {picturePreview && (
                <div className="p-4 border border-gold-ancient/30 rounded-lg glass-rune">
                  <h4 className="font-semibold mb-2 text-gold-rich">Profile Picture</h4>
                  <div className="flex justify-center">
                    <img
                      src={picturePreview}
                      alt="Bot preview"
                      className="w-32 h-32 object-cover rounded-lg border-2 border-forest"
                    />
                  </div>
                </div>
              )}

              <div className="p-4 border border-gold-ancient/30 rounded-lg glass-rune">
                <h4 className="font-semibold mb-2 text-gold-rich">Basic Information</h4>
                <div className="space-y-1 text-sm text-parchment">
                  <p><span className="font-medium text-parchment-dim">Name:</span> {botData.name}</p>
                  <p><span className="font-medium text-parchment-dim">Creator:</span> @{clerkUser?.username}</p>
                  <p><span className="font-medium text-parchment-dim">Slug:</span> {botData.slug}</p>
                  {botData.description && <p><span className="font-medium text-parchment-dim">Description:</span> {botData.description}</p>}
                </div>
              </div>

              <div className="p-4 border border-gold-ancient/30 rounded-lg glass-rune">
                <h4 className="font-semibold mb-2 text-gold-rich">Personality</h4>
                <div className="space-y-1 text-sm text-parchment">
                  <p><span className="font-medium text-parchment-dim">Gender:</span> {botData.gender || 'Not specified'}</p>
                  <p><span className="font-medium text-parchment-dim">Age:</span> {botData.age || 'Not specified'}</p>
                  <p><span className="font-medium text-parchment-dim">Tone:</span> {botData.personality_traits.tone || 'Not specified'}</p>
                  <p><span className="font-medium text-parchment-dim">Formality:</span> {botData.personality_traits.formality_level || 'Not specified'}</p>
                  {botData.greeting && <p><span className="font-medium text-parchment-dim">Greeting:</span> {botData.greeting}</p>}
                  {botData.speech_examples.filter(e => e.trim()).length > 0 && (
                    <p><span className="font-medium text-parchment-dim">Speech Examples:</span> {botData.speech_examples.filter(e => e.trim()).length}</p>
                  )}
                </div>
              </div>

              <div className="p-4 border border-gold-ancient/30 rounded-lg glass-rune">
                <h4 className="font-semibold mb-2 text-gold-rich">Behavior</h4>
                <div className="space-y-1 text-sm text-parchment">
                  <p><span className="font-medium text-parchment-dim">Response Length:</span> {botData.behavior_settings.response_length}</p>
                  <p><span className="font-medium text-parchment-dim">Creativity:</span> {botData.behavior_settings.creativity_level}</p>
                  <p><span className="font-medium text-parchment-dim">Knowledge Sharing:</span> {botData.behavior_settings.knowledge_sharing}</p>
                </div>
              </div>

              {botData.classifications.length > 0 && (
                <div className="p-4 border border-gold-ancient/30 rounded-lg glass-rune">
                  <h4 className="font-semibold mb-2 text-gold-rich">Classifications</h4>
                  <div className="flex flex-wrap gap-2">
                    {botData.classifications.map((classification, idx) => {
                      const label = {
                        'conversational-ai': 'Conversational AI',
                        'creative-writing': 'Creative Writing',
                        'fantasy-rpg': 'Fantasy/RPG',
                        'gaming': 'Gaming',
                        'fanfic': 'Fanfic',
                        'oc': 'OC (Original Characters)',
                        'dead-dove': 'Dead Dove',
                        'comedy-parody': 'Comedy/Parody',
                        'long-form': 'Long-form',
                        'one-shot': 'One-shot',
                      }[classification] || classification
                      return <Badge key={idx} variant="secondary">{label}</Badge>
                    })}
                  </div>
                </div>
              )}

              {botData.tags.length > 0 && (
                <div className="p-4 border border-gold-ancient/30 rounded-lg glass-rune">
                  <h4 className="font-semibold mb-2 text-gold-rich">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {botData.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 border border-gold-ancient/30 rounded-lg glass-rune">
                <h4 className="font-semibold mb-2 text-gold-rich">Visibility & Sharing</h4>
                <div className="space-y-1 text-sm text-parchment">
                  <p><span className="font-medium text-parchment-dim">Visibility:</span> {
                    botData.visibility === 'public' ? 'Public' :
                    botData.visibility === 'shared' ? 'Shared' : 'Private'
                  }</p>
                </div>
              </div>
            </div>

            {/* Visibility Options */}
            <div className="space-y-4 border-t border-gold-ancient/20 pt-6">
              <Label className="text-gold-rich text-base font-semibold">Who can access this bot?</Label>

              <div className="grid gap-3">
                {/* Private option */}
                <div
                  onClick={() => handleInputChange('visibility', 'private')}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all flex items-start gap-3 ${
                    botData.visibility === 'private'
                      ? 'border-forest bg-forest/10'
                      : 'border-gold-ancient/30 hover:border-gold-rich/50'
                  }`}
                >
                  <Lock className={`w-5 h-5 mt-0.5 ${botData.visibility === 'private' ? 'text-forest' : 'text-gold-ancient'}`} />
                  <div className="flex-1">
                    <div className="font-medium text-parchment">Private</div>
                    <p className="text-sm text-muted-foreground">Only you can access this bot</p>
                  </div>
                  {botData.visibility === 'private' && (
                    <Check className="w-5 h-5 text-forest" />
                  )}
                </div>

                {/* Shared option */}
                <div
                  onClick={() => handleInputChange('visibility', 'shared')}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all flex items-start gap-3 ${
                    botData.visibility === 'shared'
                      ? 'border-forest bg-forest/10'
                      : 'border-gold-ancient/30 hover:border-gold-rich/50'
                  }`}
                >
                  <Users className={`w-5 h-5 mt-0.5 ${botData.visibility === 'shared' ? 'text-forest' : 'text-gold-ancient'}`} />
                  <div className="flex-1">
                    <div className="font-medium text-parchment">Shared</div>
                    <p className="text-sm text-muted-foreground">Only people you invite can access</p>
                  </div>
                  {botData.visibility === 'shared' && (
                    <Check className="w-5 h-5 text-forest" />
                  )}
                </div>

                {/* Public option */}
                <div
                  onClick={() => handleInputChange('visibility', 'public')}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all flex items-start gap-3 ${
                    botData.visibility === 'public'
                      ? 'border-forest bg-forest/10'
                      : 'border-gold-ancient/30 hover:border-gold-rich/50'
                  }`}
                >
                  <Globe className={`w-5 h-5 mt-0.5 ${botData.visibility === 'public' ? 'text-forest' : 'text-gold-ancient'}`} />
                  <div className="flex-1">
                    <div className="font-medium text-parchment">Public</div>
                    <p className="text-sm text-muted-foreground">Anyone can discover and chat with this bot</p>
                  </div>
                  {botData.visibility === 'public' && (
                    <Check className="w-5 h-5 text-forest" />
                  )}
                </div>
              </div>

              {/* Manage collaborators button (only in edit mode with shared/private visibility) */}
              {mode === 'edit' && botId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsShareDialogOpen(true)}
                  className="w-full glass-rune border-gold-ancient/30 hover:border-gold-rich"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Manage Collaborators
                </Button>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <>
      <MagicalBackground />
      <div className="relative z-10 min-h-screen bg-background/50 py-8 pt-32">
        <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gold-rich mb-2 font-display">
            {mode === 'create' ? 'Create Your Bot' : 'Edit Bot'}
          </h1>
          <p className="text-muted-foreground">
            {mode === 'create'
              ? 'Build an AI companion with personality and purpose'
              : 'Update your bot\'s settings and personality'}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          {/* Mobile: Simplified progress bar with current step info */}
          <div className="md:hidden mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Step {currentStep + 1} of {steps.length}</span>
              <span className="text-sm font-medium">{steps[currentStep].title}</span>
            </div>
            <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-forest transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Desktop: Full step indicator */}
          <div className="hidden md:flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className={`flex items-center ${
                  index < steps.length - 1 ? 'flex-1' : ''
                }`}>
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      index <= currentStep
                        ? 'bg-forest border-forest text-white'
                        : 'border-muted text-muted-foreground'
                    }`}
                  >
                    {index < currentStep ? (
                      <Bot className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className="text-sm font-medium ml-2 lg:inline hidden">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 lg:mx-4 ${
                      index < currentStep ? 'bg-forest' : 'bg-muted'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <Card className="glass-rune mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {React.createElement(steps[currentStep].icon, { className: "h-5 w-5 text-forest" })}
              {steps[currentStep].title}
            </CardTitle>
            <CardDescription>{steps[currentStep].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="glass-rune"
          >
            Previous
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button
              type="button"
              onClick={nextStep}
              disabled={!validateCurrentStep()}
              className="bg-forest hover:bg-forest/90 text-white"
            >
              Next Step
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !validateCurrentStep()}
              className="bg-forest hover:bg-forest/90 text-white"
            >
              {isSubmitting
                ? `${mode === 'create' ? 'Creating' : 'Saving'} Bot...`
                : `${mode === 'create' ? 'Create' : 'Save Changes'}`}
            </Button>
          )}
        </div>
      </div>
    </div>

      {/* Share Dialog */}
      {mode === 'edit' && botId && (
        <ShareDialog
          open={isShareDialogOpen}
          onOpenChange={setIsShareDialogOpen}
          resourceType="bot"
          resourceId={String(botId)}
          resourceName={botData.name}
          allowPublic={true}
        />
      )}
    </>
  )
}
