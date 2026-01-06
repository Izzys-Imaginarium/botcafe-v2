'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bot, Wand2, Image, MessageSquare, Settings, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { MagicalBackground } from '@/modules/home/ui/components/magical-background'

export interface BotFormData {
  name: string
  creator_display_name: string
  description: string
  system_prompt: string
  greeting: string
  gender: string
  age: string
  is_public: boolean
  slug: string
  speech_examples: string[]
  knowledge_collections: (string | number)[]
  picture: File | string | number | null
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
    slug: initialData?.slug || '',
    speech_examples: initialData?.speech_examples || [''],
    knowledge_collections: initialData?.knowledge_collections || [],
    picture: initialData?.picture || null,
  })
  const [picturePreview, setPicturePreview] = useState<string | null>(null)

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
        return botData.name && botData.creator_display_name && botData.slug
      case 1: // Personality & Voice
        return botData.system_prompt
      case 2: // Knowledge Base
        return true // Optional step
      case 3: // Appearance
        return true // Optional step
      case 4: // Review
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

        const uploadResponse = await fetch('/api/media', {
          method: 'POST',
          body: formData,
        })

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json() as { doc: { id: string | number } }
          pictureId = uploadResult.doc.id
        } else {
          toast.error(`Failed to upload image. ${mode === 'create' ? 'Creating' : 'Updating'} bot without picture change.`)
        }
      } else if (typeof botData.picture === 'number' || typeof botData.picture === 'string') {
        // Existing picture ID
        pictureId = botData.picture
      }

      const cleanedData = {
        name: botData.name,
        creator_display_name: botData.creator_display_name,
        description: botData.description,
        system_prompt: botData.system_prompt,
        greeting: botData.greeting,
        gender: botData.gender,
        age: botData.age ? parseInt(botData.age.toString()) : undefined,
        is_public: botData.is_public,
        slug: botData.slug,
        speech_examples: botData.speech_examples.filter(example => example.trim() !== ''),
        knowledge_collections: botData.knowledge_collections,
        picture: pictureId,
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
        const result = await response.json() as { slug: string; message: string; bot?: any }
        toast.success(result.message || `Bot ${mode === 'create' ? 'created' : 'updated'} successfully!`)

        if (onSuccess) {
          onSuccess(result.bot || result)
        } else {
          router.push('/explore')
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
              <Label htmlFor="creator_display_name">Display Name *</Label>
              <Input
                id="creator_display_name"
                placeholder="How users will see you as the creator"
                value={botData.creator_display_name}
                onChange={(e) => handleInputChange('creator_display_name', e.target.value)}
                className="glass-rune"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Bot URL Slug *</Label>
              <Input
                id="slug"
                placeholder="bot-name-for-url"
                value={botData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                className="glass-rune"
                disabled={mode === 'edit'} // Can't change slug in edit mode
              />
              <p className="text-sm text-muted-foreground">
                This will be your bot's unique URL: /bot/{botData.slug || 'your-bot-name'}
                {mode === 'edit' && ' (cannot be changed)'}
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
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min="1"
                  max="200"
                  placeholder="Age"
                  value={botData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  className="glass-rune"
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 mx-auto text-forest mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gold-rich">Knowledge Base</h3>
              <p className="text-muted-foreground mb-4">
                Connect knowledge collections to give your bot specialized knowledge.
              </p>
              <p className="text-sm text-muted-foreground">
                This feature will be available after {mode === 'create' ? 'creating' : 'updating'} the bot. You can add knowledge collections later.
              </p>
            </div>
          </div>
        )

      case 3:
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
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              )}
            </div>
          </div>
        )

      case 4:
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
                  <p><span className="font-medium text-parchment-dim">Display Name:</span> {botData.creator_display_name}</p>
                  <p><span className="font-medium text-parchment-dim">Slug:</span> {botData.slug}</p>
                  {botData.description && <p><span className="font-medium text-parchment-dim">Description:</span> {botData.description}</p>}
                </div>
              </div>

              <div className="p-4 border border-gold-ancient/30 rounded-lg glass-rune">
                <h4 className="font-semibold mb-2 text-gold-rich">Personality</h4>
                <div className="space-y-1 text-sm text-parchment">
                  <p><span className="font-medium text-parchment-dim">Gender:</span> {botData.gender || 'Not specified'}</p>
                  <p><span className="font-medium text-parchment-dim">Age:</span> {botData.age || 'Not specified'}</p>
                  {botData.greeting && <p><span className="font-medium text-parchment-dim">Greeting:</span> {botData.greeting}</p>}
                  {botData.speech_examples.filter(e => e.trim()).length > 0 && (
                    <p><span className="font-medium text-parchment-dim">Speech Examples:</span> {botData.speech_examples.filter(e => e.trim()).length}</p>
                  )}
                </div>
              </div>

              <div className="p-4 border border-gold-ancient/30 rounded-lg glass-rune">
                <h4 className="font-semibold mb-2 text-gold-rich">Settings</h4>
                <div className="space-y-1 text-sm text-parchment">
                  <p><span className="font-medium text-parchment-dim">Public:</span> {botData.is_public ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_public"
                checked={botData.is_public}
                onCheckedChange={(checked) => handleInputChange('is_public', checked)}
              />
              <Label htmlFor="is_public">Make this bot public (other users can discover and chat with it)</Label>
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
          <div className="flex items-center justify-between mb-4">
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
                  <span className="text-sm font-medium ml-2">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 ${
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
    </>
  )
}
