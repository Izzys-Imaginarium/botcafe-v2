'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Users,
  Loader2,
  Globe,
  Star,
  Bot,
  MessageSquare,
  CheckCircle2,
  Crown,
  MapPin,
  ExternalLink,
  Twitter,
  Instagram,
  Youtube,
  Heart,
  Calendar,
  Settings,
  Coffee,
  CircleDollarSign,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

// Format numbers with K/M suffix only when appropriate
function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M'
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K'
  }
  return num.toString()
}

interface CreatorProfile {
  id: string
  username: string
  display_name: string
  bio: string
  profile_media?: {
    avatar?: { url: string }
    banner_image?: { url: string }
  }
  social_links?: {
    website?: string
    twitter?: string
    instagram?: string
    discord?: string
    youtube?: string
    kofi?: string
    patreon?: string
    other_links?: Array<{ platform: string; url: string }>
  }
  creator_info?: {
    creator_type?: string
    specialties?: Array<{ specialty: string }>
    experience_level?: string
    location?: string
    languages?: Array<{ language: string }>
  }
  portfolio?: {
    featured_bots?: any[]
    bot_count?: number
    total_conversations?: number
    average_rating?: number
  }
  community_stats?: {
    follower_count?: number
    following_count?: number
    total_likes?: number
  }
  profile_settings?: {
    profile_visibility?: string
    allow_collaborations?: boolean
    accept_commissions?: boolean
    commission_info?: string
  }
  verification_status?: string
  featured_creator?: boolean
  tags?: Array<{ tag: string }>
  created_timestamp?: string
  last_active?: string
}

const specialtyLabels: Record<string, string> = {
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
}

const experienceLevelLabels: Record<string, string> = {
  'beginner': 'Beginner',
  'intermediate': 'Intermediate',
  'advanced': 'Advanced',
  'expert': 'Expert',
  'professional': 'Professional',
}

const creatorTypeLabels: Record<string, string> = {
  'individual': 'Individual Creator',
  'studio': 'Studio/Team',
  'organization': 'Organization',
  'educational': 'Educational',
  'open-source': 'Open Source',
}

interface CreatorProfileViewProps {
  username: string
}

export const CreatorProfileView = ({ username }: CreatorProfileViewProps) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [creator, setCreator] = useState<CreatorProfile | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isFollowLoading, setIsFollowLoading] = useState(false)

  useEffect(() => {
    fetchCreatorProfile()
  }, [username])

  const fetchCreatorProfile = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/creators/${username}`)
      const data = (await response.json()) as {
        success?: boolean
        creator?: CreatorProfile
        isOwner?: boolean
        isFollowing?: boolean
        message?: string
      }

      if (data.success && data.creator) {
        setCreator(data.creator)
        setIsOwner(data.isOwner || false)
        setIsFollowing(data.isFollowing || false)
      } else {
        toast.error(data.message || 'Creator not found')
        router.push('/creators')
      }
    } catch (error) {
      console.error('Error fetching creator:', error)
      toast.error('Failed to load creator profile')
      router.push('/creators')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFollow = async () => {
    if (isFollowLoading || !creator) return

    setIsFollowLoading(true)
    try {
      const response = await fetch(`/api/creators/${username}/follow`, {
        method: 'POST',
      })
      const data = (await response.json()) as {
        success: boolean
        following: boolean
        followerCount: number
        message?: string
      }

      if (data.success) {
        setIsFollowing(data.following)
        // Update the follower count in the creator object
        setCreator((prev) => prev ? {
          ...prev,
          community_stats: {
            ...prev.community_stats,
            follower_count: data.followerCount,
          },
        } : null)
        toast.success(data.message || (data.following ? 'Now following!' : 'Unfollowed'))
      } else {
        toast.error(data.message || 'Failed to update follow status')
      }
    } catch (error) {
      console.error('Error following creator:', error)
      toast.error('Failed to update follow status')
    } finally {
      setIsFollowLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!creator) {
    return null
  }

  const verificationBadge = creator.verification_status === 'verified' ? (
    <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">
      <CheckCircle2 className="mr-1 h-3 w-3" />
      Verified
    </Badge>
  ) : creator.verification_status === 'premium' ? (
    <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500">
      <Crown className="mr-1 h-3 w-3" />
      Premium
    </Badge>
  ) : null

  const joinedDate = creator.created_timestamp
    ? new Date(creator.created_timestamp).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Unknown'

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Banner and Profile Header */}
      <Card className="overflow-hidden mb-6">
        {/* Banner */}
        {creator.profile_media?.banner_image?.url ? (
          <div
            className="h-48 md:h-64 bg-cover bg-center"
            style={{ backgroundImage: `url(${creator.profile_media.banner_image.url})` }}
          />
        ) : (
          <div className="h-48 md:h-64 bg-gradient-to-r from-purple-500/30 to-pink-500/30" />
        )}

        {/* Profile Info */}
        <CardContent className="relative pt-0 pb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start">
            {/* Avatar */}
            <Avatar className="h-32 w-32 border-4 border-background -mt-16 relative">
              <AvatarImage src={creator.profile_media?.avatar?.url} />
              <AvatarFallback className="text-3xl">
                {creator.display_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Name and Info */}
            <div className="flex-1 md:mt-4">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-2xl font-bold">{creator.display_name}</h1>
                {creator.featured_creator && (
                  <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500">
                    <Star className="mr-1 h-3 w-3 fill-current" />
                    Featured
                  </Badge>
                )}
                {verificationBadge}
              </div>

              <p className="text-muted-foreground mb-2">@{creator.username}</p>

              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                {creator.creator_info?.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {creator.creator_info.location}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined {joinedDate}
                </div>
                {creator.creator_info?.creator_type && (
                  <Badge variant="outline">
                    {creatorTypeLabels[creator.creator_info.creator_type] || creator.creator_info.creator_type}
                  </Badge>
                )}
              </div>

              <p className="text-sm">{creator.bio}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 md:mt-4">
              {isOwner ? (
                <Link href={`/creators/${creator.username}/edit`}>
                  <Button>
                    <Settings className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                </Link>
              ) : (
                <>
                  <Button
                    variant={isFollowing ? "default" : "outline"}
                    onClick={handleFollow}
                    disabled={isFollowLoading}
                  >
                    {isFollowLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isFollowing ? 'Unfollowing...' : 'Following...'}
                      </>
                    ) : isFollowing ? (
                      <>
                        <Users className="mr-2 h-4 w-4" />
                        Following
                      </>
                    ) : (
                      <>
                        <Users className="mr-2 h-4 w-4" />
                        Follow
                      </>
                    )}
                  </Button>
                  {creator.profile_settings?.accept_commissions && (
                    <Button>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Contact
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold">{creator.portfolio?.bot_count || 0}</p>
              <p className="text-sm text-muted-foreground">Bots Created</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {formatCompactNumber(creator.portfolio?.total_conversations || 0)}
              </p>
              <p className="text-sm text-muted-foreground">Conversations</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{creator.community_stats?.follower_count || 0}</p>
              <p className="text-sm text-muted-foreground">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{creator.community_stats?.following_count || 0}</p>
              <p className="text-sm text-muted-foreground">Following</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{creator.community_stats?.total_likes || 0}</p>
              <p className="text-sm text-muted-foreground">Total Likes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="bots" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 h-auto sm:h-9">
          <TabsTrigger value="bots" className="py-2 sm:py-1">Bots</TabsTrigger>
          <TabsTrigger value="about" className="py-2 sm:py-1">About</TabsTrigger>
          <TabsTrigger value="activity" className="py-2 sm:py-1">Activity</TabsTrigger>
          <TabsTrigger value="links" className="py-2 sm:py-1">Links</TabsTrigger>
        </TabsList>

        {/* Bots Tab */}
        <TabsContent value="bots">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Featured Bots
              </CardTitle>
            </CardHeader>
            <CardContent>
              {creator.portfolio?.featured_bots && creator.portfolio.featured_bots.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {creator.portfolio.featured_bots.map((bot: any) => (
                    <Card key={bot.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={bot.avatar?.url} />
                            <AvatarFallback>{bot.name?.charAt(0) || 'B'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-semibold">{bot.name || 'Unnamed Bot'}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {bot.description || 'No description'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No featured bots yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* About Tab */}
        <TabsContent value="about">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Specialties */}
            <Card>
              <CardHeader>
                <CardTitle>Specialties</CardTitle>
              </CardHeader>
              <CardContent>
                {creator.creator_info?.specialties && creator.creator_info.specialties.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {creator.creator_info.specialties.map((s, idx) => (
                      <Badge key={idx} variant="secondary">
                        {specialtyLabels[s.specialty] || s.specialty}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No specialties listed</p>
                )}
              </CardContent>
            </Card>

            {/* Experience & Languages */}
            <Card>
              <CardHeader>
                <CardTitle>Experience</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {creator.creator_info?.experience_level && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Experience Level</p>
                    <Badge variant="outline">
                      {experienceLevelLabels[creator.creator_info.experience_level] || creator.creator_info.experience_level}
                    </Badge>
                  </div>
                )}
                {creator.creator_info?.languages && creator.creator_info.languages.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Languages</p>
                    <div className="flex flex-wrap gap-1">
                      {creator.creator_info.languages.map((l, idx) => (
                        <Badge key={idx} variant="outline">
                          {l.language}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Commission Info */}
            {creator.profile_settings?.accept_commissions && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-pink-500" />
                    Accepting Commissions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    {creator.profile_settings.commission_info || 'Contact this creator for commission details.'}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {creator.tags && creator.tags.length > 0 && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {creator.tags.map((t, idx) => (
                      <Badge key={idx} variant="outline">
                        #{t.tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Activity feed coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Links Tab */}
        <TabsContent value="links">
          <Card>
            <CardHeader>
              <CardTitle>Social Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {creator.social_links?.website && (
                  <a
                    href={creator.social_links.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <Globe className="h-5 w-5" />
                    <span className="flex-1">Website</span>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                )}
                {creator.social_links?.twitter && (
                  <a
                    href={creator.social_links.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <Twitter className="h-5 w-5" />
                    <span className="flex-1">X (Twitter)</span>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                )}
                {creator.social_links?.instagram && (
                  <a
                    href={creator.social_links.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <Instagram className="h-5 w-5" />
                    <span className="flex-1">Instagram</span>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                )}
                {creator.social_links?.youtube && (
                  <a
                    href={creator.social_links.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <Youtube className="h-5 w-5" />
                    <span className="flex-1">YouTube</span>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                )}
                {creator.social_links?.discord && (
                  <a
                    href={creator.social_links.discord}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <MessageSquare className="h-5 w-5" />
                    <span className="flex-1">Discord</span>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                )}
                {creator.social_links?.kofi && (
                  <a
                    href={creator.social_links.kofi}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <Coffee className="h-5 w-5" />
                    <span className="flex-1">Ko-fi</span>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                )}
                {creator.social_links?.patreon && (
                  <a
                    href={creator.social_links.patreon}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <CircleDollarSign className="h-5 w-5" />
                    <span className="flex-1">Patreon</span>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                )}
                {creator.social_links?.other_links?.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <ExternalLink className="h-5 w-5" />
                    <span className="flex-1">{link.platform}</span>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                ))}
              </div>

              {!creator.social_links?.website &&
                !creator.social_links?.twitter &&
                !creator.social_links?.instagram &&
                !creator.social_links?.youtube &&
                !creator.social_links?.discord &&
                !creator.social_links?.kofi &&
                !creator.social_links?.patreon &&
                (!creator.social_links?.other_links || creator.social_links.other_links.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No social links added yet</p>
                  </div>
                )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
