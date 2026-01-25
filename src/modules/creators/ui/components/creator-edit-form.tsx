'use client'

import { useState, useEffect } from 'react'
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  User,
  Loader2,
  Save,
  X,
  Globe,
  Plus,
  ChevronDown,
  Settings,
  Sparkles,
  ArrowLeft,
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface CreatorFormData {
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
    twitter: string
    instagram: string
    discord: string
    youtube: string
    kofi: string
    patreon: string
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

interface CreatorEditFormProps {
  username: string
}

export const CreatorEditForm = ({ username }: CreatorEditFormProps) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const [formData, setFormData] = useState<CreatorFormData>({
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
      twitter: '',
      instagram: '',
      discord: '',
      youtube: '',
      kofi: '',
      patreon: '',
    },
    profile_settings: {
      profile_visibility: 'public',
      allow_collaborations: true,
      accept_commissions: false,
      commission_info: '',
    },
    tags: [],
  })

  const [originalData, setOriginalData] = useState<CreatorFormData | null>(null)
  const [newTag, setNewTag] = useState('')
  const [newLanguage, setNewLanguage] = useState('')

  // Section collapse state
  const [openSections, setOpenSections] = useState({
    basic: true,
    details: true,
    social: true,
    settings: true,
  })

  // Fetch existing profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/creators/${username}`)
        const data = (await response.json()) as {
          success?: boolean
          creator?: {
            display_name?: string
            bio?: string
            creator_info?: {
              creator_type?: string
              specialties?: Array<{ specialty: string }>
              experience_level?: string
              location?: string
              languages?: Array<{ language: string }>
            }
            social_links?: {
              website?: string
              twitter?: string
              instagram?: string
              discord?: string
              youtube?: string
              kofi?: string
              patreon?: string
            }
            profile_settings?: {
              profile_visibility?: string
              allow_collaborations?: boolean
              accept_commissions?: boolean
              commission_info?: string
            }
            tags?: Array<{ tag: string }>
          }
          isOwner?: boolean
          message?: string
        }

        if (data.success && data.creator) {
          const creator = data.creator

          // Check ownership
          if (!data.isOwner) {
            toast.error('You do not have permission to edit this profile')
            router.push(`/creators/${username}`)
            return
          }

          const loadedData: CreatorFormData = {
            display_name: creator.display_name || '',
            bio: creator.bio || '',
            creator_info: {
              creator_type: creator.creator_info?.creator_type || 'individual',
              specialties: creator.creator_info?.specialties || [],
              experience_level: creator.creator_info?.experience_level || 'intermediate',
              location: creator.creator_info?.location || '',
              languages: creator.creator_info?.languages || [{ language: 'English' }],
            },
            social_links: {
              website: creator.social_links?.website || '',
              twitter: creator.social_links?.twitter || '',
              instagram: creator.social_links?.instagram || '',
              discord: creator.social_links?.discord || '',
              youtube: creator.social_links?.youtube || '',
              kofi: creator.social_links?.kofi || '',
              patreon: creator.social_links?.patreon || '',
            },
            profile_settings: {
              profile_visibility: creator.profile_settings?.profile_visibility || 'public',
              allow_collaborations: creator.profile_settings?.allow_collaborations ?? true,
              accept_commissions: creator.profile_settings?.accept_commissions ?? false,
              commission_info: creator.profile_settings?.commission_info || '',
            },
            tags: creator.tags || [],
          }

          setFormData(loadedData)
          setOriginalData(loadedData)
        } else {
          toast.error(data.message || 'Failed to load profile')
          router.push('/creators')
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
        toast.error('Failed to load profile')
        router.push('/creators')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [username, router])

  // Track changes
  useEffect(() => {
    if (originalData) {
      const changed = JSON.stringify(formData) !== JSON.stringify(originalData)
      setHasChanges(changed)
    }
  }, [formData, originalData])

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

  const handleSave = async () => {
    if (!hasChanges) return

    // Validation
    if (formData.display_name.length < 2) {
      toast.error('Display name must be at least 2 characters')
      return
    }
    if (formData.bio.length < 20) {
      toast.error('Bio must be at least 20 characters')
      return
    }
    if (formData.creator_info.specialties.length === 0) {
      toast.error('Please select at least one specialty')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/creators/${username}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = (await response.json()) as {
        success?: boolean
        message?: string
      }

      if (data.success) {
        toast.success('Profile updated successfully!')
        setOriginalData(formData)
        setHasChanges(false)
      } else {
        toast.error(data.message || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('An error occurred while saving')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href={`/creators/${username}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Edit Creator Profile</h1>
            <p className="text-muted-foreground">@{username}</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {hasChanges && (
        <div className="mb-6 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm text-yellow-600 dark:text-yellow-400">
          You have unsaved changes
        </div>
      )}

      <div className="space-y-4">
        {/* Basic Information */}
        <Collapsible open={openSections.basic} onOpenChange={() => toggleSection('basic')}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${openSections.basic ? 'rotate-180' : ''}`}
                  />
                </div>
                <CardDescription>Your public profile details</CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-6">
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
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Creator Details */}
        <Collapsible open={openSections.details} onOpenChange={() => toggleSection('details')}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Creator Details
                  </CardTitle>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${openSections.details ? 'rotate-180' : ''}`}
                  />
                </div>
                <CardDescription>Your experience and specialties</CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
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
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Social Links */}
        <Collapsible open={openSections.social} onOpenChange={() => toggleSection('social')}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Social Links
                  </CardTitle>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${openSections.social ? 'rotate-180' : ''}`}
                  />
                </div>
                <CardDescription>Connect your social profiles (all optional)</CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
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
                  <Label htmlFor="twitter">X (Twitter)</Label>
                  <Input
                    id="twitter"
                    value={formData.social_links.twitter}
                    onChange={(e) =>
                      updateNestedFormData('social_links', 'twitter', e.target.value)
                    }
                    placeholder="https://x.com/username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={formData.social_links.instagram}
                    onChange={(e) =>
                      updateNestedFormData('social_links', 'instagram', e.target.value)
                    }
                    placeholder="https://instagram.com/username"
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
                    placeholder="https://discord.gg/invite or username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kofi">Ko-fi</Label>
                  <Input
                    id="kofi"
                    value={formData.social_links.kofi}
                    onChange={(e) =>
                      updateNestedFormData('social_links', 'kofi', e.target.value)
                    }
                    placeholder="https://ko-fi.com/username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="patreon">Patreon</Label>
                  <Input
                    id="patreon"
                    value={formData.social_links.patreon}
                    onChange={(e) =>
                      updateNestedFormData('social_links', 'patreon', e.target.value)
                    }
                    placeholder="https://patreon.com/username"
                  />
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Profile Settings */}
        <Collapsible open={openSections.settings} onOpenChange={() => toggleSection('settings')}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Profile Settings
                  </CardTitle>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${openSections.settings ? 'rotate-180' : ''}`}
                  />
                </div>
                <CardDescription>Visibility and preferences</CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
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
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>

      {/* Bottom Save Button */}
      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={!hasChanges || isSaving} size="lg">
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
