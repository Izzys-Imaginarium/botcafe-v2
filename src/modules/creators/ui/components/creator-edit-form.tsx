'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  Bot,
  Camera,
  Star,
  ImageIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'

interface BotData {
  id: number
  name: string
  slug: string
  description?: string
  picture?: { url?: string } | number | null
  is_public?: boolean
}

interface CreatorFormData {
  display_name: string
  bio: string
  profile_media: {
    avatar: number | null
    banner_image: number | null
  }
  portfolio: {
    featured_bots: number[]
  }
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
  { value: 'creative-writing', label: 'Creative Writing' },
  { value: 'fantasy-rpg', label: 'Fantasy/RPG' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'fanfic', label: 'Fanfic' },
  { value: 'oc', label: 'OC (Original Characters)' },
  { value: 'dead-dove', label: 'Dead Dove' },
  { value: 'comedy-parody', label: 'Comedy/Parody' },
  { value: 'long-form', label: 'Long-form' },
  { value: 'one-shot', label: 'One-shot' },
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
  const { user: clerkUser } = useUser()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const [formData, setFormData] = useState<CreatorFormData>({
    display_name: '',
    bio: '',
    profile_media: {
      avatar: null,
      banner_image: null,
    },
    portfolio: {
      featured_bots: [],
    },
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

  // Additional state for media URLs and bot selection
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)
  const [userBots, setUserBots] = useState<BotData[]>([])
  const [isLoadingBots, setIsLoadingBots] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const [originalData, setOriginalData] = useState<CreatorFormData | null>(null)
  const [newTag, setNewTag] = useState('')
  const [newLanguage, setNewLanguage] = useState('')

  // Section collapse state
  const [openSections, setOpenSections] = useState({
    media: true,
    basic: true,
    portfolio: true,
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
            profile_media?: {
              avatar?: { id: number; url?: string } | number | null
              banner_image?: { id: number; url?: string } | number | null
            }
            portfolio?: {
              featured_bots?: Array<{ id: number } | number>
            }
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

          // Extract avatar and banner URLs for display
          const avatarMedia = creator.profile_media?.avatar
          const bannerMedia = creator.profile_media?.banner_image
          if (avatarMedia && typeof avatarMedia === 'object' && avatarMedia.url) {
            setAvatarUrl(avatarMedia.url)
          }
          if (bannerMedia && typeof bannerMedia === 'object' && bannerMedia.url) {
            setBannerUrl(bannerMedia.url)
          }

          // Extract featured bot IDs
          const featuredBotIds = (creator.portfolio?.featured_bots || []).map((b) =>
            typeof b === 'object' ? b.id : b
          )

          const loadedData: CreatorFormData = {
            display_name: creator.display_name || '',
            bio: creator.bio || '',
            profile_media: {
              avatar: avatarMedia ? (typeof avatarMedia === 'object' ? avatarMedia.id : avatarMedia) : null,
              banner_image: bannerMedia ? (typeof bannerMedia === 'object' ? bannerMedia.id : bannerMedia) : null,
            },
            portfolio: {
              featured_bots: featuredBotIds,
            },
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

  // Fetch user's bots for featured bot selection
  useEffect(() => {
    const fetchUserBots = async () => {
      setIsLoadingBots(true)
      try {
        // Fetch bots owned by the current user
        const response = await fetch('/api/bots/explore?excludeOwn=false&limit=100')
        const data = (await response.json()) as {
          bots?: Array<{
            id: number
            name: string
            slug: string
            description?: string
            picture?: { url?: string } | number | null
            is_public?: boolean
            accessType?: string
          }>
        }

        // Filter to only bots the user owns
        const ownedBots = (data.bots || []).filter((bot) => bot.accessType === 'owned')
        setUserBots(ownedBots)
      } catch (error) {
        console.error('Error fetching user bots:', error)
      } finally {
        setIsLoadingBots(false)
      }
    }

    fetchUserBots()
  }, [])

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

  // Handle image upload for avatar or banner
  const handleImageUpload = async (file: File, type: 'avatar' | 'banner') => {
    if (type === 'avatar') {
      setIsUploadingAvatar(true)
    } else {
      setIsUploadingBanner(true)
    }

    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formDataUpload,
      })

      const data = (await response.json()) as {
        success?: boolean
        media?: { id: number; url: string }
        message?: string
      }

      if (data.success && data.media) {
        if (type === 'avatar') {
          setAvatarUrl(data.media.url)
          updateNestedFormData('profile_media', 'avatar', data.media.id)
        } else {
          setBannerUrl(data.media.url)
          updateNestedFormData('profile_media', 'banner_image', data.media.id)
        }
        toast.success(`${type === 'avatar' ? 'Profile picture' : 'Banner'} uploaded successfully`)
      } else {
        toast.error(data.message || 'Failed to upload image')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
    } finally {
      if (type === 'avatar') {
        setIsUploadingAvatar(false)
      } else {
        setIsUploadingBanner(false)
      }
    }
  }

  // Toggle featured bot selection
  const toggleFeaturedBot = (botId: number) => {
    const currentFeatured = formData.portfolio.featured_bots
    const isSelected = currentFeatured.includes(botId)

    if (isSelected) {
      updateNestedFormData(
        'portfolio',
        'featured_bots',
        currentFeatured.filter((id) => id !== botId)
      )
    } else if (currentFeatured.length < 6) {
      updateNestedFormData('portfolio', 'featured_bots', [...currentFeatured, botId])
    } else {
      toast.error('Maximum 6 featured bots allowed')
    }
  }

  // Get bot picture URL helper
  const getBotPictureUrl = (picture: BotData['picture']): string | undefined => {
    if (!picture) return undefined
    if (typeof picture === 'object' && picture.url) return picture.url
    return undefined
  }

  const handleSave = async () => {
    if (!hasChanges) return

    // Validation
    if (!formData.display_name || formData.display_name.trim().length === 0) {
      toast.error('Display name is required')
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
        {/* Profile Media */}
        <Collapsible open={openSections.media} onOpenChange={() => toggleSection('media')}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Profile Media
                  </CardTitle>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${openSections.media ? 'rotate-180' : ''}`}
                  />
                </div>
                <CardDescription>Your profile picture and banner image</CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-6">
                {/* Avatar Upload */}
                <div className="space-y-3">
                  <Label>Profile Picture</Label>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-24 w-24 border-2 border-border">
                      <AvatarImage src={avatarUrl || undefined} />
                      <AvatarFallback className="text-2xl">
                        {formData.display_name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-2">
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleImageUpload(file, 'avatar')
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                      >
                        {isUploadingAvatar ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Camera className="mr-2 h-4 w-4" />
                            {avatarUrl ? 'Change Picture' : 'Upload Picture'}
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Recommended: Square image, at least 200x200px
                      </p>
                    </div>
                  </div>
                </div>

                {/* Banner Upload */}
                <div className="space-y-3">
                  <Label>Banner Image</Label>
                  <div className="space-y-3">
                    {bannerUrl ? (
                      <div
                        className="h-32 rounded-lg bg-cover bg-center border"
                        style={{ backgroundImage: `url(${bannerUrl})` }}
                      />
                    ) : (
                      <div className="h-32 rounded-lg bg-gradient-to-r from-purple-500/30 to-pink-500/30 border flex items-center justify-center">
                        <span className="text-muted-foreground text-sm">No banner image</span>
                      </div>
                    )}
                    <input
                      ref={bannerInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(file, 'banner')
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => bannerInputRef.current?.click()}
                      disabled={isUploadingBanner}
                    >
                      {isUploadingBanner ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="mr-2 h-4 w-4" />
                          {bannerUrl ? 'Change Banner' : 'Upload Banner'}
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Recommended: 1200x300px or similar wide aspect ratio
                    </p>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

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
                    placeholder="Your display name"
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground">
                    This is your public display name. Your username is @{clerkUser?.username}.
                  </p>
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

        {/* Featured Bots (Portfolio) */}
        <Collapsible open={openSections.portfolio} onOpenChange={() => toggleSection('portfolio')}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    Featured Bots
                  </CardTitle>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${openSections.portfolio ? 'rotate-180' : ''}`}
                  />
                </div>
                <CardDescription>Select up to 6 bots to feature on your profile</CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                {isLoadingBots ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : userBots.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>You haven't created any bots yet.</p>
                    <Link href="/create">
                      <Button variant="outline" className="mt-4">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Your First Bot
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      Selected: {formData.portfolio.featured_bots.length}/6 bots
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {userBots.map((bot) => {
                        const isSelected = formData.portfolio.featured_bots.includes(bot.id)
                        return (
                          <div
                            key={bot.id}
                            onClick={() => toggleFeaturedBot(bot.id)}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-primary/10 border-primary'
                                : 'hover:bg-accent'
                            }`}
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={getBotPictureUrl(bot.picture)} />
                              <AvatarFallback>{bot.name?.charAt(0) || 'B'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{bot.name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {bot.description || 'No description'}
                              </p>
                            </div>
                            {isSelected && (
                              <Star className="h-5 w-5 text-primary fill-current flex-shrink-0" />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
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
