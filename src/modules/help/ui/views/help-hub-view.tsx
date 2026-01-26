'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Loader2,
  Search,
  BookOpen,
  Rocket,
  Bot,
  Database,
  User,
  BarChart3,
  Code,
  HelpCircle,
  ArrowRight,
  Clock,
  Eye,
  Star,
  GraduationCap,
} from 'lucide-react'
import Link from 'next/link'

interface Article {
  id: string
  title: string
  slug: string
  category: string
  difficultyLevel: string
  estimatedReadTime?: number
  viewCount?: number
  isFeatured?: boolean
  metaDescription?: string
}

interface CategoryInfo {
  name: string
  count: number
}

const categoryIcons: Record<string, React.ReactNode> = {
  'getting-started': <Rocket className="h-6 w-6" />,
  'bot-creation': <Bot className="h-6 w-6" />,
  'bot-management': <Bot className="h-6 w-6" />,
  'knowledge-base': <Database className="h-6 w-6" />,
  'personas-moods': <User className="h-6 w-6" />,
  'analytics-insights': <BarChart3 className="h-6 w-6" />,
  'api-reference': <Code className="h-6 w-6" />,
  'troubleshooting': <HelpCircle className="h-6 w-6" />,
  'best-practices': <Star className="h-6 w-6" />,
  'account-billing': <User className="h-6 w-6" />,
  'creator-programs': <GraduationCap className="h-6 w-6" />,
  'faq': <HelpCircle className="h-6 w-6" />,
}

const categoryLabels: Record<string, string> = {
  'getting-started': 'Getting Started',
  'bot-creation': 'Bot Creation',
  'bot-management': 'Bot Management',
  'knowledge-base': 'Knowledge Base',
  'personas-moods': 'Personas & Moods',
  'analytics-insights': 'Analytics',
  'api-reference': 'API Reference',
  'troubleshooting': 'Troubleshooting',
  'best-practices': 'Best Practices',
  'account-billing': 'Account & Billing',
  'creator-programs': 'Creator Programs',
  'faq': 'FAQ',
}

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-500/10 text-green-500',
  intermediate: 'bg-yellow-500/10 text-yellow-500',
  advanced: 'bg-orange-500/10 text-orange-500',
  expert: 'bg-red-500/10 text-red-500',
}

export const HelpHubView = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<CategoryInfo[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Article[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    fetchArticles()
  }, [])

  const fetchArticles = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/help?featured=true&limit=6')
      const data = (await response.json()) as {
        success?: boolean
        articles?: Article[]
        categories?: CategoryInfo[]
      }

      if (data.success) {
        setArticles(data.articles || [])
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Error fetching articles:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/help?search=${encodeURIComponent(searchQuery)}&limit=10`)
      const data = (await response.json()) as {
        success?: boolean
        articles?: Article[]
      }

      if (data.success) {
        setSearchResults(data.articles || [])
      }
    } catch (error) {
      console.error('Error searching:', error)
    } finally {
      setIsSearching(false)
    }
  }

  // Quick links for common help topics (using flat slugs that match the [slug] route)
  const quickLinks = [
    { title: 'Create Your First Bot', href: '/help/create-bot', icon: <Bot className="h-5 w-5" /> },
    { title: 'Add Knowledge to Bots', href: '/help/add-lore', icon: <Database className="h-5 w-5" /> },
    { title: 'Set Up Personas', href: '/help/setup-personas', icon: <User className="h-5 w-5" /> },
    { title: 'API Documentation', href: '/help/category/api-reference', icon: <Code className="h-5 w-5" /> },
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Help Center
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
          Find guides, tutorials, and answers to help you get the most out of BotCafe.
        </p>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 pr-24 h-12 text-lg"
            />
            <Button
              className="absolute right-1 top-1 h-10"
              onClick={handleSearch}
              disabled={isSearching}
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <Card className="mt-2 absolute left-0 right-0 z-20 max-w-xl mx-auto">
              <CardContent className="py-2">
                {searchResults.map((article) => (
                  <Link
                    key={article.id}
                    href={`/help/${article.slug}`}
                    className="block p-3 hover:bg-muted rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{article.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {categoryLabels[article.category] || article.category}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {quickLinks.map((link) => (
          <Link key={link.title} href={link.href}>
            <Card className="h-full hover:border-purple-500/50 transition-colors cursor-pointer group">
              <CardContent className="py-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                  {link.icon}
                </div>
                <span className="font-medium text-sm">{link.title}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Categories Grid */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Browse by Category</h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link key={cat.name} href={`/help/category/${cat.name}`}>
                <Card className="h-full hover:border-purple-500/50 transition-colors cursor-pointer group">
                  <CardContent className="py-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-muted group-hover:bg-purple-500/10 transition-colors">
                        {categoryIcons[cat.name] || <BookOpen className="h-6 w-6" />}
                      </div>
                      <Badge variant="secondary">{cat.count}</Badge>
                    </div>
                    <h3 className="font-semibold">
                      {categoryLabels[cat.name] || cat.name}
                    </h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Featured Articles */}
      {articles.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Featured Articles</h2>
            <Link href="/help/all">
              <Button variant="outline">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link key={article.id} href={`/help/${article.slug}`}>
                <Card className="h-full hover:border-purple-500/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">
                        {categoryLabels[article.category] || article.category}
                      </Badge>
                      <Badge className={difficultyColors[article.difficultyLevel] || ''}>
                        {article.difficultyLevel}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{article.title}</CardTitle>
                    {article.metaDescription && (
                      <CardDescription className="line-clamp-2">
                        {article.metaDescription}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {article.estimatedReadTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{article.estimatedReadTime} min</span>
                        </div>
                      )}
                      {article.viewCount !== undefined && (
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span>{article.viewCount} views</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Join Discord */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
        <CardContent className="py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <HelpCircle className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Can't find what you're looking for?</h3>
                <p className="text-muted-foreground">
                  Join our Discord community for help and support.
                </p>
              </div>
            </div>
            <Button asChild>
              <Link href="https://discord.gg/botcafe" target="_blank" rel="noopener noreferrer">
                Join Discord
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
