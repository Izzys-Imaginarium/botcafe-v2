'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Phone,
  MessageSquare,
  Globe,
  ArrowLeft,
  RefreshCw,
  Heart,
  Shield,
  Clock,
  ExternalLink,
  AlertTriangle,
  Search,
  Filter,
  Users,
  Mail,
} from 'lucide-react'

interface CrisisResource {
  id: string
  title: string
  resource_type: string
  resource_category: string
  description: string
  contact_info: {
    phone_number?: string
    text_number?: string
    website?: string
    email?: string
    chat_url?: string
    app_download_url?: string
  }
  availability: {
    is_24_7: boolean
    operating_hours?: any
    timezone?: string
  }
  geographic_region: string
  language_support: boolean
  languages_available?: string
  cost_information: string
  specialized_features: {
    anonymous_support?: boolean
    peer_support?: boolean
    professional_counselors?: boolean
    volunteer_support?: boolean
    family_support?: boolean
    trauma_informed?: boolean
  }
  is_emergency: boolean
  tags?: string
}

interface Filters {
  categories: { value: string; label: string }[]
  types: { value: string; label: string }[]
  regions: { value: string; label: string }[]
}

const resourceTypeIcons: Record<string, React.ReactNode> = {
  hotline: <Phone className="h-5 w-5" />,
  chat: <MessageSquare className="h-5 w-5" />,
  text: <MessageSquare className="h-5 w-5" />,
  online: <Globe className="h-5 w-5" />,
  emergency: <AlertTriangle className="h-5 w-5" />,
  apps: <Globe className="h-5 w-5" />,
  groups: <Users className="h-5 w-5" />,
  professional: <Shield className="h-5 w-5" />,
}

const costLabels: Record<string, { label: string; color: string }> = {
  free: { label: 'Free', color: 'bg-green-500/20 text-green-400' },
  insurance: { label: 'Insurance Accepted', color: 'bg-blue-500/20 text-blue-400' },
  'sliding-scale': { label: 'Sliding Scale', color: 'bg-yellow-500/20 text-yellow-400' },
  'low-cost': { label: 'Low Cost', color: 'bg-orange-500/20 text-orange-400' },
  paid: { label: 'Paid', color: 'bg-gray-500/20 text-gray-400' },
}

export const CrisisSupportView = () => {
  const [resources, setResources] = useState<CrisisResource[]>([])
  const [filters, setFilters] = useState<Filters | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [selectedRegion, setSelectedRegion] = useState<string>('')
  const [showEmergencyOnly, setShowEmergencyOnly] = useState(false)

  const fetchResources = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedType) params.append('type', selectedType)
      if (selectedRegion) params.append('region', selectedRegion)
      if (showEmergencyOnly) params.append('emergency', 'true')

      const response = await fetch(`/api/wellbeing/crisis-support?${params}`)
      if (!response.ok) throw new Error('Failed to fetch resources')
      const data = await response.json() as { resources: CrisisResource[]; filters: Filters }
      setResources(data.resources)
      if (!filters) {
        setFilters(data.filters)
      }
    } catch (err) {
      console.error('Error fetching crisis resources:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResources()
  }, [selectedCategory, selectedType, selectedRegion, showEmergencyOnly])

  const clearFilters = () => {
    setSelectedCategory('')
    setSelectedType('')
    setSelectedRegion('')
    setShowEmergencyOnly(false)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/wellbeing">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
            Crisis Support Resources
          </h1>
          <p className="text-muted-foreground">Help is available 24/7. You are not alone.</p>
        </div>
      </div>

      {/* Emergency Banner */}
      <Card className="mb-8 border-red-500/50 bg-red-500/10">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-400" />
              <div>
                <h2 className="font-bold text-lg text-red-400">In Immediate Danger?</h2>
                <p className="text-sm text-muted-foreground">
                  Call emergency services or go to your nearest emergency room
                </p>
              </div>
            </div>
            <div className="flex gap-2 md:ml-auto">
              <Button variant="destructive" size="lg" asChild>
                <a href="tel:911">
                  <Phone className="mr-2 h-4 w-4" />
                  Call 911
                </a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="tel:988">
                  <Heart className="mr-2 h-4 w-4" />
                  988 Lifeline
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {filters?.categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  {filters?.types.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="All Regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Regions</SelectItem>
                  {filters?.regions.map((region) => (
                    <SelectItem key={region.value} value={region.value}>
                      {region.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant={showEmergencyOnly ? 'destructive' : 'outline'}
              onClick={() => setShowEmergencyOnly(!showEmergencyOnly)}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Emergency Only
            </Button>

            {(selectedCategory || selectedType || selectedRegion || showEmergencyOnly) && (
              <Button variant="ghost" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resources List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      ) : resources.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((resource) => (
            <Card
              key={resource.id}
              className={`hover:border-purple-500/50 transition-colors ${
                resource.is_emergency ? 'border-red-500/50 bg-red-500/5' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-muted">
                      {resourceTypeIcons[resource.resource_type] || <Globe className="h-5 w-5" />}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{resource.title}</CardTitle>
                      <CardDescription className="capitalize">
                        {resource.resource_type.replace('-', ' ')}
                      </CardDescription>
                    </div>
                  </div>
                  {resource.is_emergency && (
                    <Badge variant="destructive" className="ml-2">
                      Emergency
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {resource.description}
                </p>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  {resource.availability.is_24_7 && (
                    <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                      <Clock className="mr-1 h-3 w-3" />
                      24/7
                    </Badge>
                  )}
                  <Badge
                    variant="secondary"
                    className={costLabels[resource.cost_information]?.color || ''}
                  >
                    {costLabels[resource.cost_information]?.label || resource.cost_information}
                  </Badge>
                  {resource.specialized_features.anonymous_support && (
                    <Badge variant="outline">Anonymous</Badge>
                  )}
                  {resource.specialized_features.professional_counselors && (
                    <Badge variant="outline">Professional</Badge>
                  )}
                </div>

                {/* Contact Buttons */}
                <div className="flex flex-wrap gap-2">
                  {resource.contact_info.phone_number && (
                    <Button size="sm" variant="default" asChild>
                      <a href={`tel:${resource.contact_info.phone_number}`}>
                        <Phone className="mr-1 h-3 w-3" />
                        Call
                      </a>
                    </Button>
                  )}
                  {resource.contact_info.text_number && (
                    <Button size="sm" variant="secondary" asChild>
                      <a href={`sms:${resource.contact_info.text_number.replace(/\D/g, '')}`}>
                        <MessageSquare className="mr-1 h-3 w-3" />
                        Text
                      </a>
                    </Button>
                  )}
                  {resource.contact_info.chat_url && (
                    <Button size="sm" variant="secondary" asChild>
                      <a
                        href={resource.contact_info.chat_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageSquare className="mr-1 h-3 w-3" />
                        Chat
                      </a>
                    </Button>
                  )}
                  {resource.contact_info.website && (
                    <Button size="sm" variant="outline" asChild>
                      <a
                        href={resource.contact_info.website}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-1 h-3 w-3" />
                        Website
                      </a>
                    </Button>
                  )}
                </div>

                {/* Languages */}
                {resource.languages_available && (
                  <p className="text-xs text-muted-foreground">
                    Languages: {resource.languages_available}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Heart className="h-12 w-12 mx-auto mb-4 opacity-50 text-pink-400" />
              <h3 className="font-semibold mb-2">No Resources Found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or check back later
              </p>
              <Button onClick={clearFilters} variant="outline">
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bottom Help Message */}
      <Card className="mt-8 bg-muted/50">
        <CardContent className="pt-6">
          <div className="text-center">
            <Heart className="h-8 w-8 mx-auto mb-3 text-pink-400" />
            <h3 className="font-semibold mb-2">Remember</h3>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              It takes courage to seek help. Whatever you're going through, you don't have to face
              it alone. These resources are here to support you, and reaching out is a sign of
              strength.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
