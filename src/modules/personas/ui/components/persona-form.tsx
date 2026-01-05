'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  User,
  ArrowLeft,
  Loader2,
  Save,
  Sparkles,
  Palette,
  MessageSquare,
  Settings,
  Plus,
  X
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface PersonaFormData {
  name: string
  description: string
  personality_traits: {
    tone?: string | null
    formality_level?: string | null
    humor_style?: string | null
    communication_style?: string | null
  }
  appearance: {
    visual_theme?: string | null
    color_scheme?: string | null
  }
  behavior_settings: {
    response_length?: string | null
    creativity_level?: string | null
    knowledge_sharing?: string | null
  }
  interaction_preferences: {
    preferred_topics?: Array<{ topic?: string; id?: string }>
    avoid_topics?: Array<{ topic?: string; id?: string }>
    conversation_starter?: string | null
    signature_phrases?: Array<{ phrase?: string; id?: string }>
  }
  is_default: boolean
  is_public: boolean
  tags: Array<{ tag?: string; id?: string }>
  custom_instructions: string
}

interface PersonaFormProps {
  initialData?: Partial<PersonaFormData>
  personaId?: string
  mode: 'create' | 'edit'
}

const defaultFormData: PersonaFormData = {
  name: '',
  description: '',
  personality_traits: {
    tone: 'friendly',
    formality_level: 'neutral',
    humor_style: 'moderate',
    communication_style: 'direct',
  },
  appearance: {
    visual_theme: 'modern',
    color_scheme: '',
  },
  behavior_settings: {
    response_length: 'medium',
    creativity_level: 'moderate',
    knowledge_sharing: 'balanced',
  },
  interaction_preferences: {
    preferred_topics: [],
    avoid_topics: [],
    conversation_starter: '',
    signature_phrases: [],
  },
  is_default: false,
  is_public: false,
  tags: [],
  custom_instructions: '',
}

export const PersonaForm = ({ initialData, personaId, mode }: PersonaFormProps) => {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<PersonaFormData>({
    ...defaultFormData,
    ...initialData,
    personality_traits: {
      ...defaultFormData.personality_traits,
      ...initialData?.personality_traits,
    },
    appearance: {
      ...defaultFormData.appearance,
      ...initialData?.appearance,
    },
    behavior_settings: {
      ...defaultFormData.behavior_settings,
      ...initialData?.behavior_settings,
    },
    interaction_preferences: {
      ...defaultFormData.interaction_preferences,
      ...initialData?.interaction_preferences,
    },
  })

  // Tag input state
  const [newTag, setNewTag] = useState('')
  const [newPreferredTopic, setNewPreferredTopic] = useState('')
  const [newAvoidTopic, setNewAvoidTopic] = useState('')
  const [newSignaturePhrase, setNewSignaturePhrase] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Please enter a persona name')
      return
    }

    if (!formData.description.trim()) {
      toast.error('Please enter a description')
      return
    }

    setIsSubmitting(true)

    try {
      const url = mode === 'create' ? '/api/personas' : `/api/personas/${personaId}`
      const method = mode === 'create' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = (await response.json()) as { success?: boolean; persona?: any; message?: string }

      if (data.success) {
        toast.success(mode === 'create' ? 'Persona created!' : 'Persona updated!')
        router.push('/personas')
      } else {
        toast.error(data.message || `Failed to ${mode} persona`)
      }
    } catch (error) {
      console.error('Form submission error:', error)
      toast.error(`An error occurred while ${mode === 'create' ? 'creating' : 'updating'} persona`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.some(t => t.tag === newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, { tag: newTag.trim() }],
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t.tag !== tagToRemove),
    }))
  }

  const addPreferredTopic = () => {
    if (newPreferredTopic.trim()) {
      setFormData(prev => ({
        ...prev,
        interaction_preferences: {
          ...prev.interaction_preferences,
          preferred_topics: [...(prev.interaction_preferences.preferred_topics || []), { topic: newPreferredTopic.trim() }],
        },
      }))
      setNewPreferredTopic('')
    }
  }

  const removePreferredTopic = (topicToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      interaction_preferences: {
        ...prev.interaction_preferences,
        preferred_topics: (prev.interaction_preferences.preferred_topics || []).filter(t => t.topic !== topicToRemove),
      },
    }))
  }

  const addAvoidTopic = () => {
    if (newAvoidTopic.trim()) {
      setFormData(prev => ({
        ...prev,
        interaction_preferences: {
          ...prev.interaction_preferences,
          avoid_topics: [...(prev.interaction_preferences.avoid_topics || []), { topic: newAvoidTopic.trim() }],
        },
      }))
      setNewAvoidTopic('')
    }
  }

  const removeAvoidTopic = (topicToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      interaction_preferences: {
        ...prev.interaction_preferences,
        avoid_topics: (prev.interaction_preferences.avoid_topics || []).filter(t => t.topic !== topicToRemove),
      },
    }))
  }

  const addSignaturePhrase = () => {
    if (newSignaturePhrase.trim()) {
      setFormData(prev => ({
        ...prev,
        interaction_preferences: {
          ...prev.interaction_preferences,
          signature_phrases: [...(prev.interaction_preferences.signature_phrases || []), { phrase: newSignaturePhrase.trim() }],
        },
      }))
      setNewSignaturePhrase('')
    }
  }

  const removeSignaturePhrase = (phraseToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      interaction_preferences: {
        ...prev.interaction_preferences,
        signature_phrases: (prev.interaction_preferences.signature_phrases || []).filter(p => p.phrase !== phraseToRemove),
      },
    }))
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/personas">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Personas
          </Button>
        </Link>
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          {mode === 'create' ? 'Create New Persona' : 'Edit Persona'}
        </h1>
        <p className="text-muted-foreground">
          {mode === 'create'
            ? 'Design a unique persona for your conversations'
            : 'Update your persona settings'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Give your persona a name and description
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter persona name"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your persona's character and purpose"
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {formData.description.length}/500 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="pr-1">
                      {tag.tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 ml-1"
                        onClick={() => removeTag(tag.tag)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Personality Traits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Personality Traits
            </CardTitle>
            <CardDescription>
              Define your persona's communication style
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select
                value={formData.personality_traits.tone}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  personality_traits: { ...prev.personality_traits, tone: value },
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
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
              <Select
                value={formData.personality_traits.formality_level}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  personality_traits: { ...prev.personality_traits, formality_level: value },
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
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
              <Select
                value={formData.personality_traits.humor_style}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  personality_traits: { ...prev.personality_traits, humor_style: value },
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
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
              <Select
                value={formData.personality_traits.communication_style}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  personality_traits: { ...prev.personality_traits, communication_style: value },
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
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
          </CardContent>
        </Card>

        {/* Behavior Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Behavior Settings
            </CardTitle>
            <CardDescription>
              Control how your persona responds
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Response Length</Label>
              <Select
                value={formData.behavior_settings.response_length}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  behavior_settings: { ...prev.behavior_settings, response_length: value },
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="very-short">Very Short</SelectItem>
                  <SelectItem value="short">Short</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="long">Long</SelectItem>
                  <SelectItem value="very-long">Very Long</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Creativity Level</Label>
              <Select
                value={formData.behavior_settings.creativity_level}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  behavior_settings: { ...prev.behavior_settings, creativity_level: value },
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conservative">Conservative</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                  <SelectItem value="highly-creative">Highly Creative</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Knowledge Sharing</Label>
              <Select
                value={formData.behavior_settings.knowledge_sharing}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  behavior_settings: { ...prev.behavior_settings, knowledge_sharing: value },
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="very-limited">Very Limited</SelectItem>
                  <SelectItem value="limited">Limited</SelectItem>
                  <SelectItem value="balanced">Balanced</SelectItem>
                  <SelectItem value="generous">Generous</SelectItem>
                  <SelectItem value="very-generous">Very Generous</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Interaction Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Interaction Preferences
            </CardTitle>
            <CardDescription>
              Define topics and conversation starters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Conversation Starter</Label>
              <Textarea
                value={formData.interaction_preferences.conversation_starter}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  interaction_preferences: {
                    ...prev.interaction_preferences,
                    conversation_starter: e.target.value,
                  },
                }))}
                placeholder="Default greeting message (e.g., 'Hello! I'm excited to chat with you today.')"
                rows={2}
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label>Preferred Topics</Label>
              <div className="flex gap-2">
                <Input
                  value={newPreferredTopic}
                  onChange={(e) => setNewPreferredTopic(e.target.value)}
                  placeholder="Add a topic"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addPreferredTopic()
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addPreferredTopic}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {(formData.interaction_preferences.preferred_topics?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.interaction_preferences.preferred_topics?.map((t, idx) => (
                    <Badge key={idx} variant="secondary" className="pr-1 bg-green-500/10 text-green-500">
                      {t.topic}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 ml-1"
                        onClick={() => t.topic && removePreferredTopic(t.topic)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Topics to Avoid</Label>
              <div className="flex gap-2">
                <Input
                  value={newAvoidTopic}
                  onChange={(e) => setNewAvoidTopic(e.target.value)}
                  placeholder="Add a topic to avoid"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addAvoidTopic()
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addAvoidTopic}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {(formData.interaction_preferences.avoid_topics?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.interaction_preferences.avoid_topics?.map((t, idx) => (
                    <Badge key={idx} variant="secondary" className="pr-1 bg-red-500/10 text-red-500">
                      {t.topic}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 ml-1"
                        onClick={() => t.topic && removeAvoidTopic(t.topic)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Signature Phrases</Label>
              <div className="flex gap-2">
                <Input
                  value={newSignaturePhrase}
                  onChange={(e) => setNewSignaturePhrase(e.target.value)}
                  placeholder="Add a catchphrase"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addSignaturePhrase()
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addSignaturePhrase}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {(formData.interaction_preferences.signature_phrases?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.interaction_preferences.signature_phrases?.map((p, idx) => (
                    <Badge key={idx} variant="secondary" className="pr-1">
                      "{p.phrase}"
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 ml-1"
                        onClick={() => p.phrase && removeSignaturePhrase(p.phrase)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Advanced Settings
            </CardTitle>
            <CardDescription>
              Additional customization options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Custom Instructions</Label>
              <Textarea
                value={formData.custom_instructions}
                onChange={(e) => setFormData(prev => ({ ...prev, custom_instructions: e.target.value }))}
                placeholder="Add any additional instructions for this persona..."
                rows={4}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Set as Default</Label>
                <p className="text-sm text-muted-foreground">
                  Use this persona automatically for new conversations
                </p>
              </div>
              <Switch
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Make Public</Label>
                <p className="text-sm text-muted-foreground">
                  Allow other users to use this persona
                </p>
              </div>
              <Switch
                checked={formData.is_public}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_public: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Link href="/personas">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === 'create' ? 'Creating...' : 'Saving...'}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {mode === 'create' ? 'Create Persona' : 'Save Changes'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
