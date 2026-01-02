'use client'

import React, { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Bot, Wand2, User, Image, MessageSquare, Settings, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

// Multi-step form wizard components
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
    title: 'Review & Create',
    description: 'Review settings and create your bot',
    icon: Settings,
  },
]

export default function CreateBotPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Bot form data
  const [botData, setBotData] = useState({
    name: '',
    creator_display_name: '',
    description: '',
    system_prompt: '',
    greeting: '',
    gender: '',
    age: '',
    is_public: false,
    slug: '',
    speech_examples: [''],
    knowledge_collections: [],
    picture: null,
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in')
    }
  }, [user, isLoaded, router])

  // Auto-generate slug from name
  useEffect(() => {
    if (botData.name && !botData.slug) {
      const slug = botData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      setBotData(prev => ({ ...prev, slug }))
    }
  }, [botData.name])

  const handleInputChange = (field: string, value: any) => {
    setBotData(prev => ({ ...prev, [field]: value }))
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
      // Clean up empty speech examples
      const cleanedData = {
        ...botData,
        speech_examples: botData.speech_examples.filter(example => example.trim() !== ''),
        age: botData.age ? parseInt(botData.age.toString()) : undefined,
      }

      const response = await fetch('/api/bots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedData),
      })

      if (response.ok) {
        const newBot = await response.json() as { slug: string }
        toast.success('Bot created successfully!')
        router.push(`/bot/${newBot.slug}`)
      } else {
        const error = await response.json() as { message: string }
        toast.error(error.message || 'Failed to create bot')
      }
    } catch (error) {
      console.error('Error creating bot:', error)
      toast.error('Failed to create bot. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#020402] flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#4d7c0f]"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  const CurrentStepComponent = () => {
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
                onChange={(e) => handleInputChange('name', e.target.value)}
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
              />
              <p className="text-sm text-muted-foreground">
                This will be your bot's unique URL: /bot/{botData.slug || 'your-bot-name'}
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
                <div key={index} className="flex gap-2">
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
              <Sparkles className="h-12 w-12 mx-auto text-[#4d7c0f] mb-4" />
              <h3 className="text-lg font-semibold mb-2">Knowledge Base</h3>
              <p className="text-muted-foreground mb-4">
                Connect knowledge collections to give your bot specialized knowledge.
              </p>
              <p className="text-sm text-muted-foreground">
                This feature will be available after creating the bot. You can add knowledge collections later.
              </p>
            </div>
          </div>
        )
      
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center py-8">
              <Image className="h-12 w-12 mx-auto text-[#4d7c0f] mb-4" />
              <h3 className="text-lg font-semibold mb-2">Bot Appearance</h3>
              <p className="text-muted-foreground mb-4">
                Upload a profile picture for your bot.
              </p>
              <p className="text-sm text-muted-foreground">
                This feature will be available after creating the bot. You can upload images later.
              </p>
            </div>
          </div>
        )
      
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Wand2 className="h-12 w-12 mx-auto text-[#4d7c0f] mb-4" />
              <h3 className="text-lg font-semibold">Review Your Bot</h3>
              <p className="text-muted-foreground">Double-check everything before creating your bot.</p>
            </div>
            
            <div className="grid gap-4">
              <div className="p-4 border rounded-lg glass-rune">
                <h4 className="font-semibold mb-2">Basic Information</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Name:</span> {botData.name}</p>
                  <p><span className="font-medium">Display Name:</span> {botData.creator_display_name}</p>
                  <p><span className="font-medium">Slug:</span> {botData.slug}</p>
                  {botData.description && <p><span className="font-medium">Description:</span> {botData.description}</p>}
                </div>
              </div>
              
              <div className="p-4 border rounded-lg glass-rune">
                <h4 className="font-semibold mb-2">Personality</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Gender:</span> {botData.gender || 'Not specified'}</p>
                  <p><span className="font-medium">Age:</span> {botData.age || 'Not specified'}</p>
                  {botData.greeting && <p><span className="font-medium">Greeting:</span> {botData.greeting}</p>}
                  {botData.speech_examples.filter(e => e.trim()).length > 0 && (
                    <p><span className="font-medium">Speech Examples:</span> {botData.speech_examples.filter(e => e.trim()).length}</p>
                  )}
                </div>
              </div>
              
              <div className="p-4 border rounded-lg glass-rune">
                <h4 className="font-semibold mb-2">Settings</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Public:</span> {botData.is_public ? 'Yes' : 'No'}</p>
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
    <div className="min-h-screen bg-[#020402] py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#d4af37] mb-2">Create Your Bot</h1>
          <p className="text-muted-foreground">Build an AI companion with personality and purpose</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${
                  index < steps.length - 1 ? 'flex-1' : ''
                }`}
              >
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    index <= currentStep
                      ? 'bg-[#4d7c0f] border-[#4d7c0f] text-white'
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
                    index < currentStep ? 'bg-[#4d7c0f]' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Content */}
        <Card className="glass-rune mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <steps[currentStep].icon className="h-5 w-5 text-[#4d7c0f]" />
              {steps[currentStep].title}
            </CardTitle>
            <CardDescription>{steps[currentStep
