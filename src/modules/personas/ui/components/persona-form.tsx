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
  gender?: string | null
  age?: number | null
  pronouns?: string | null
  custom_pronouns?: string | null
  interaction_preferences: {
    preferred_topics?: Array<{ topic?: string; id?: string }>
    avoid_topics?: Array<{ topic?: string; id?: string }>
  }
  is_default: boolean
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
  gender: null,
  age: null,
  pronouns: null,
  custom_pronouns: null,
  interaction_preferences: {
    preferred_topics: [],
    avoid_topics: [],
  },
  is_default: false,
  custom_instructions: '',
}

const genderOptions = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Non-binary', value: 'non-binary' },
  { label: 'Prefer not to say', value: 'unspecified' },
  { label: 'Other', value: 'other' },
]

const pronounOptions = [
  { label: 'He/Him', value: 'he-him' },
  { label: 'She/Her', value: 'she-her' },
  { label: 'They/Them', value: 'they-them' },
  { label: 'He/They', value: 'he-they' },
  { label: 'She/They', value: 'she-they' },
  { label: 'Any pronouns', value: 'any' },
  { label: 'Other', value: 'other' },
]

export const PersonaForm = ({ initialData, personaId, mode }: PersonaFormProps) => {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<PersonaFormData>({
    ...defaultFormData,
    ...initialData,
    interaction_preferences: {
      ...defaultFormData.interaction_preferences,
      ...initialData?.interaction_preferences,
    },
  })

  // Topic input state
  const [newPreferredTopic, setNewPreferredTopic] = useState('')
  const [newAvoidTopic, setNewAvoidTopic] = useState('')

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
            ? 'Create a persona that bots will use to address you'
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
              Tell bots how you want to be addressed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="The name you want bots to call you"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="A brief description of this persona for your reference"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {formData.description.length}/500 characters
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select
                  value={formData.gender || ''}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {genderOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min={1}
                  max={150}
                  value={formData.age || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    age: e.target.value ? parseInt(e.target.value) : null
                  }))}
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-2">
                <Label>Pronouns</Label>
                <Select
                  value={formData.pronouns || ''}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, pronouns: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select pronouns" />
                  </SelectTrigger>
                  <SelectContent>
                    {pronounOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.pronouns === 'other' && (
              <div className="space-y-2">
                <Label htmlFor="custom_pronouns">Custom Pronouns</Label>
                <Input
                  id="custom_pronouns"
                  value={formData.custom_pronouns || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, custom_pronouns: e.target.value }))}
                  placeholder="Enter your pronouns"
                  maxLength={50}
                />
              </div>
            )}
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
              Help bots understand your interests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Preferred Topics</Label>
              <p className="text-sm text-muted-foreground">Topics you enjoy discussing</p>
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
              <p className="text-sm text-muted-foreground">Topics you prefer not to discuss</p>
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
          </CardContent>
        </Card>

        {/* Additional Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Additional Settings
            </CardTitle>
            <CardDescription>
              Extra customization options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Custom Instructions</Label>
              <Textarea
                value={formData.custom_instructions}
                onChange={(e) => setFormData(prev => ({ ...prev, custom_instructions: e.target.value }))}
                placeholder="Additional context or instructions for bots when using this persona..."
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
