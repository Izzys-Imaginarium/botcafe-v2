'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MagicalBackground } from '@/modules/home/ui/components/magical-background'
import {
  Loader2,
  ArrowLeft,
  Clock,
  Eye,
  BookOpen,
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
  metaDescription?: string
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
  'legal-compliance': 'Legal & Compliance',
  'platform-updates': 'Platform Updates',
  'faq': 'FAQ',
}

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-500/10 text-green-500',
  intermediate: 'bg-yellow-500/10 text-yellow-500',
  advanced: 'bg-orange-500/10 text-orange-500',
  expert: 'bg-red-500/10 text-red-500',
}

export default function HelpAllArticlesPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [articles, setArticles] = useState<Article[]>([])
  const [totalDocs, setTotalDocs] = useState(0)

  useEffect(() => {
    fetchArticles()
  }, [])

  const fetchArticles = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/help?limit=100')
      const data = (await response.json()) as {
        success?: boolean
        articles?: Article[]
        pagination?: { totalDocs: number }
      }

      if (data.success) {
        setArticles(data.articles || [])
        setTotalDocs(data.pagination?.totalDocs || 0)
      }
    } catch (error) {
      console.error('Error fetching articles:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <MagicalBackground />

      <div className="relative z-10 pt-24">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link href="/help" className="inline-flex items-center text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Help Center
            </Link>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              All Help Articles
            </h1>
            <p className="text-muted-foreground">
              {totalDocs} article{totalDocs !== 1 ? 's' : ''} available
            </p>
          </div>

          {/* Articles List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : articles.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Articles Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    We're working on adding help content.
                  </p>
                  <Link href="/help">
                    <Button variant="outline">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Help Center
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {articles.map((article) => (
                <Link key={article.id} href={`/help/${article.slug}`}>
                  <Card className="hover:border-purple-500/50 transition-colors cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">
                              {categoryLabels[article.category] || article.category}
                            </Badge>
                            <Badge className={difficultyColors[article.difficultyLevel] || ''}>
                              {article.difficultyLevel}
                            </Badge>
                          </div>
                          <CardTitle className="text-xl">{article.title}</CardTitle>
                          {article.metaDescription && (
                            <CardDescription className="mt-2">
                              {article.metaDescription}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {article.estimatedReadTime && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{article.estimatedReadTime} min read</span>
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
          )}
        </div>
      </div>
    </>
  )
}
