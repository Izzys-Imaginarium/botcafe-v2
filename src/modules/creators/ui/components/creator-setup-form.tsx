'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  User,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Globe,
  Plus,
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface CreatorFormData {
  username: string
  display_name: string
  bio: string
  creator_info: {
    creator_type: string
    specialties: Array<{ specialty: string }>
    experience_level: string
    location: string
    languages: Array<{ language: string }>
  }
  social_links: {
    website: string
    github: string
    twitter: string
    linkedin: string
    discord: string
    youtube: string
  }
  profile_settings: {
    profile_visibility: string
    allow_collaborations: boolean
    accept_commissions: boolean
    commission_info: string
  }
  tags: Array<{ tag: string }>
}

const specialtyOptions = [
  { value: 'conversational-ai', label: 'Conversational AI' },
  { value: 'fantasy-rpg', label: 'Fantasy/RPG Bots' },
  { value: 'educational', label: 'Educational Bots' },
  { value: 'creative-writing', label: 'Creative Writing' },
  { value: 'technical-support', label: 'Technical Support' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'mental-health', label: 'Mental Health' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'business', label: 'Business/Customer Service' },
]

const creatorTypeOptions = [
  { value: 'individual', label: 'Individual Creator' },
  { value: 'studio', label: 'Studio/Team' },
  { value: 'organization', label: 'Organization' },
  { value: 'educational', label: 'Educational Institution' },
  { value: 'open-source', label: 'Open Source Project' },
]

const experienceLevelOptions = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
  { value: 'professional', label: 'Professional' },
]

export const CreatorSetupForm = () => {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)

  const [formData, setFormData] = useState<CreatorFormData>({
    username: '',
    display_name: '',
    bio: '',
    creator_info: {
      creator_type: 'individual',
      specialties: [],
      experience_level: 'intermediate',
      location: '',
      languages: [{ language: 'English' }],
    },
    social_links: {
      website: '',
      github: '',
      twitter: '',
      linkedin: '',
      discord: '',
      youtube: '',
    },
    profile_settings: {
      profile_visibility: 'public',
      allow_collaborations: true,
      accept_commissions: false,
      commission_info: '',
    },
    tags: [],
  })

  const [newTag, setNewTag] = useState('')
  const [newLanguage, setNewLanguage] = useState('')

  const updateFormData = <K extends keyof CreatorFormData>(
    key: K,
    value: CreatorFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const updateNestedFormData = <K extends keyof CreatorFormData>(
    parentKey: K,
    childKey: keyof CreatorFormData[K],
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [parentKey]: {
        ...(prev[parentKey] as object),
        [childKey]: value,
      },
    }))
  }

  const checkUsernameAvailability = async (username: string) => {
    if (username.length < 3) {
      setUsernameAvailable(null)
      return
    }

    setIsCheckingUsername(true)
    try {
      const response = await fetch(`/api/creators/${username}`)
      const data = (await response.json()) as { success?: boolean }
      setUsernameAvailable(!data.success)
    } catch (error) {
      setUsernameAvailable(true)
    } finally {
      setIsCheckingUsername(false)
    }
  }

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '')
    updateFormData('username', value)
    setUsernameAvailable(null)
  }

  const handleUsernameBlur = () => {
    if (formData.username.length >= 3) {
      checkUsernameAvailability(formData.username)
    }
  }

  const toggleSpecialty = (specialty: string) => {
    const currentSpecialties = formData.creator_info.specialties
    const exists = currentSpecialties.some((s) => s.specialty === specialty)

    if (exists) {
      updateNestedFormData(
        'creator_info',
        'specialties',
        currentSpecialties.filter((s) => s.specialty !== specialty)
      )
    } else if (currentSpecialties.length < 5) {
      updateNestedFormData('creator_info', 'specialties', [
        ...currentSpecialties,
        { specialty },
      ])
    } else {
      toast.error('Maximum 5 specialties allowed')
    }
  }

  const addTag = () => {
    if (newTag.trim() && formData.tags.length < 10) {
      updateFormData('tags', [...formData.tags, { tag: newTag.trim() }])
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    updateFormData(
      'tags',
      formData.tags.filter((t) => t.tag !== tag)
    )
  }

  const addLanguage = () => {
    if (newLanguage.trim() && formData.creator_info.languages.length < 10) {
      updateNestedFormData('creator_info', 'languages', [
        ...formData.creator_info.languages,
        { language: newLanguage.trim() },
      ])
      setNewLanguage('')
    }
  }

  const removeLanguage = (language: string) => {
    updateNestedFormData(
      'creator_info',
      'languages',
      formData.creator_info.languages.filter((l) => l.language !== language)
    )
  }

  const canProceed = () => {
    if (step === 1) {
      return (
        formData.username.length >= 3 &&
        formData.display_name.length >= 2 &&
        formData.bio.length >= 20 &&
        usernameAvailable === true
      )
    }
    if (step === 2) {
      return formData.creator_info.specialties.length > 0
    }
    return true
  }

  const handleSubmit = async () => {
    if (!canProceed()) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/creators', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = (await response.json()) as { success?: boolean; creator?: { username: string }; message?: string }

      if (data.success) {
        toast.success('Creator profile created successfully!')
        router.push(`/creators/${data.creator?.username || formData.username}`)
      } else {
        toast.error(data.message || 'Failed to create profile')
      }
    } catch (error) {
      console.error('Error creating profile:', error)
      toast.error('An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Step {step} of 4</span>
          <span className="text-sm text-muted-foreground">{Math.round((step / 4) * 100)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Let's start with the basics of your creator profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">@</span>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={handleUsernameChange}
                  onBlur={handleUsernameBlur}
                  placeholder="your-username"
                  className="pl-8"
                  maxLength={50}
                />
                {isCheckingUsername && (
                  <Loader2 className="absolute right-3 top-2.5 h-5 w-5 animate-spin text-muted-foreground" />
                )}
                {!isCheckingUsername && usernameAvailable === true && (
                  <Check className="absolute right-3 top-2.5 h-5 w-5 text-green-500" />
                )}
                {!isCheckingUsername && usernameAvailable === false && (
                  <X className="absolute right-3 top-2.5 h-5 w-5 text-red-500" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Only lowercase letters, numbers, hyphens, and underscores allowed
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name *</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => updateFormData('display_name', e.target.value)}
                placeholder="Your Display Name"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio *</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => updateFormData('bio', e.target.value)}
                placeholder="Tell us about yourself and what kind of bots you create..."
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground">
                {formData.bio.length}/1000 characters (minimum 20)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location (Optional)</Label>
              <Input
                id="location"
                value={formData.creator_info.location}
                onChange={(e) =>
                  updateNestedFormData('creator_info', 'location', e.target.value)
                }
                placeholder="City, Country"
                maxLength={100}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Creator Details */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Creator Details</CardTitle>
            <CardDescription>
              Tell us more about your experience and specialties
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Creator Type</Label>
              <Select
                value={formData.creator_info.creator_type}
                onValueChange={(value) =>
                  updateNestedFormData('creator_info', 'creator_type', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {creatorTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Experience Level</Label>
              <Select
                value={formData.creator_info.experience_level}
                onValueChange={(value) =>
                  updateNestedFormData('creator_info', 'experience_level', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {experienceLevelOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Specialties * (Select up to 5)</Label>
              <div className="flex flex-wrap gap-2">
                {specialtyOptions.map((option) => {
                  const isSelected = formData.creator_info.specialties.some(
                    (s) => s.specialty === option.value
                  )
                  return (
                    <Badge
                      key={option.value}
                      variant={isSelected ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleSpecialty(option.value)}
                    >
                      {option.label}
                    </Badge>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Languages Supported</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  placeholder="Add a language"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
                />
                <Button type="button" variant="outline" onClick={addLanguage}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.creator_info.languages.map((l, idx) => (
                  <Badge key={idx} variant="secondary">
                    {l.language}
                    <button
                      className="ml-1 hover:text-destructive"
                      onClick={() => removeLanguage(l.language)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Social Links */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Social Links
            </CardTitle>
            <CardDescription>
              Connect your social profiles (all optional)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.social_links.website}
                onChange={(e) =>
                  updateNestedFormData('social_links', 'website', e.target.value)
                }
                placeholder="https://yourwebsite.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="github">GitHub</Label>
              <Input
                id="github"
                value={formData.social_links.github}
                onChange={(e) =>
                  updateNestedFormData('social_links', 'github', e.target.value)
                }
                placeholder="https://github.com/username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter/X</Label>
              <Input
                id="twitter"
                value={formData.social_links.twitter}
                onChange={(e) =>
                  updateNestedFormData('social_links', 'twitter', e.target.value)
                }
                placeholder="https://twitter.com/username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                value={formData.social_links.linkedin}
                onChange={(e) =>
                  updateNestedFormData('social_links', 'linkedin', e.target.value)
                }
                placeholder="https://linkedin.com/in/username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="youtube">YouTube</Label>
              <Input
                id="youtube"
                value={formData.social_links.youtube}
                onChange={(e) =>
                  updateNestedFormData('social_links', 'youtube', e.target.value)
                }
                placeholder="https://youtube.com/@channel"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discord">Discord</Label>
              <Input
                id="discord"
                value={formData.social_links.discord}
                onChange={(e) =>
                  updateNestedFormData('social_links', 'discord', e.target.value)
                }
                placeholder="username#1234 or server invite"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Profile Settings */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>
              Configure your profile visibility and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Profile Visibility</Label>
              <Select
                value={formData.profile_settings.profile_visibility}
                onValueChange={(value) =>
                  updateNestedFormData('profile_settings', 'profile_visibility', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public - Visible to everyone</SelectItem>
                  <SelectItem value="unlisted">Unlisted - Only accessible via direct link</SelectItem>
                  <SelectItem value="private">Private - Only visible to you</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="allow_collaborations"
                checked={formData.profile_settings.allow_collaborations}
                onCheckedChange={(checked) =>
                  updateNestedFormData(
                    'profile_settings',
                    'allow_collaborations',
                    checked === true
                  )
                }
              />
              <Label htmlFor="allow_collaborations" className="cursor-pointer">
                Allow other creators to collaborate on my bots
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="accept_commissions"
                checked={formData.profile_settings.accept_commissions}
                onCheckedChange={(checked) =>
                  updateNestedFormData(
                    'profile_settings',
                    'accept_commissions',
                    checked === true
                  )
                }
              />
              <Label htmlFor="accept_commissions" className="cursor-pointer">
                I'm available for custom bot commissions
              </Label>
            </div>

            {formData.profile_settings.accept_commissions && (
              <div className="space-y-2">
                <Label htmlFor="commission_info">Commission Information</Label>
                <Textarea
                  id="commission_info"
                  value={formData.profile_settings.commission_info}
                  onChange={(e) =>
                    updateNestedFormData(
                      'profile_settings',
                      'commission_info',
                      e.target.value
                    )
                  }
                  placeholder="Describe your rates, availability, and what you offer..."
                  rows={3}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Tags (Optional)</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((t, idx) => (
                  <Badge key={idx} variant="secondary">
                    #{t.tag}
                    <button
                      className="ml-1 hover:text-destructive"
                      onClick={() => removeTag(t.tag)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        {step > 1 ? (
          <Button variant="outline" onClick={() => setStep(step - 1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        ) : (
          <div />
        )}

        {step < 4 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting || !canProceed()}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Profile...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Create Profile
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
