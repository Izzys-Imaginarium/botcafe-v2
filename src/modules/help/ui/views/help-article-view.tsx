'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Loader2,
  ArrowLeft,
  Clock,
  Eye,
  Calendar,
  BookOpen,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react'
import Link from 'next/link'

interface Article {
  id: string
  title: string
  slug: string
  category: string
  subcategory?: string
  content: any
  difficultyLevel: string
  estimatedReadTime?: number
  viewCount?: number
  lastUpdated: string
  tags?: Array<{ tag: string }>
  metaDescription?: string
}

interface HelpArticleViewProps {
  slug: string
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

// Simple rich text renderer
const RichTextRenderer = ({ content }: { content: any }) => {
  if (!content) return null

  if (content.root && content.root.children) {
    return (
      <div className="prose prose-invert max-w-none">
        {content.root.children.map((node: any, index: number) => (
          <RenderNode key={index} node={node} />
        ))}
      </div>
    )
  }

  if (typeof content === 'string') {
    return <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
  }

  return null
}

const RenderNode = ({ node }: { node: any }) => {
  if (!node) return null

  switch (node.type) {
    case 'paragraph':
      return (
        <p className="mb-4">
          {node.children?.map((child: any, i: number) => (
            <RenderNode key={i} node={child} />
          ))}
        </p>
      )
    case 'heading': {
      const level = node.tag || 2
      const headingContent = node.children?.map((child: any, i: number) => (
        <RenderNode key={i} node={child} />
      ))
      if (level === 1) return <h1 className="font-bold mt-6 mb-3 text-3xl">{headingContent}</h1>
      if (level === 2) return <h2 className="font-bold mt-6 mb-3 text-2xl">{headingContent}</h2>
      if (level === 3) return <h3 className="font-bold mt-6 mb-3 text-xl">{headingContent}</h3>
      if (level === 4) return <h4 className="font-bold mt-6 mb-3 text-lg">{headingContent}</h4>
      if (level === 5) return <h5 className="font-bold mt-6 mb-3 text-base">{headingContent}</h5>
      return <h6 className="font-bold mt-6 mb-3 text-sm">{headingContent}</h6>
    }
    case 'list':
      const ListTag = node.listType === 'number' ? 'ol' : 'ul'
      return (
        <ListTag className={`mb-4 pl-6 ${node.listType === 'number' ? 'list-decimal' : 'list-disc'}`}>
          {node.children?.map((child: any, i: number) => (
            <RenderNode key={i} node={child} />
          ))}
        </ListTag>
      )
    case 'listitem':
      return (
        <li className="mb-1">
          {node.children?.map((child: any, i: number) => (
            <RenderNode key={i} node={child} />
          ))}
        </li>
      )
    case 'link':
      return (
        <a href={node.url} className="text-purple-400 hover:underline" target="_blank" rel="noopener noreferrer">
          {node.children?.map((child: any, i: number) => (
            <RenderNode key={i} node={child} />
          ))}
        </a>
      )
    case 'code':
      return (
        <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">
          <code>{node.children?.map((child: any) => child.text).join('')}</code>
        </pre>
      )
    case 'text':
      let text = node.text || ''
      if (node.format) {
        if (node.format & 1) text = <strong key="bold">{text}</strong>
        if (node.format & 2) text = <em key="italic">{text}</em>
        if (node.format & 8) text = <u key="underline">{text}</u>
        if (node.format & 16) text = <code key="code" className="bg-muted px-1 rounded">{text}</code>
      }
      return <>{text}</>
    default:
      if (node.children) {
        return (
          <>
            {node.children.map((child: any, i: number) => (
              <RenderNode key={i} node={child} />
            ))}
          </>
        )
      }
      return node.text ? <>{node.text}</> : null
  }
}

export const HelpArticleView = ({ slug }: HelpArticleViewProps) => {
  const [isLoading, setIsLoading] = useState(true)
  const [article, setArticle] = useState<Article | null>(null)
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([])
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<'helpful' | 'not-helpful' | null>(null)

  useEffect(() => {
    fetchArticle()
  }, [slug])

  const fetchArticle = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/help/${slug}`)
      const data = (await response.json()) as {
        success?: boolean
        article?: Article
        relatedArticles?: Article[]
        message?: string
      }

      if (data.success && data.article) {
        setArticle(data.article)
        setRelatedArticles(data.relatedArticles || [])
      } else {
        setError(data.message || 'Article not found')
      }
    } catch (err) {
      console.error('Error fetching article:', err)
      setError('Failed to load article')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFeedback = (type: 'helpful' | 'not-helpful') => {
    setFeedback(type)
    // TODO: Send feedback to API
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Article Not Found</h3>
              <p className="text-muted-foreground mb-4">
                {error || 'This help article is not available.'}
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
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Breadcrumb */}
      <div className="mb-6">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/help" className="hover:text-foreground">Help Center</Link>
          <span>/</span>
          <Link href={`/help/category/${article.category}`} className="hover:text-foreground">
            {categoryLabels[article.category] || article.category}
          </Link>
          <span>/</span>
          <span className="text-foreground">{article.title}</span>
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {categoryLabels[article.category] || article.category}
                </Badge>
                <Badge className={difficultyColors[article.difficultyLevel] || ''}>
                  {article.difficultyLevel}
                </Badge>
              </div>

              <CardTitle className="text-3xl">{article.title}</CardTitle>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
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
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Updated {formatDate(article.lastUpdated)}</span>
                </div>
              </div>
            </CardHeader>

            <Separator />

            <CardContent className="pt-6">
              <RichTextRenderer content={article.content} />
            </CardContent>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <>
                <Separator />
                <CardContent className="pt-4">
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((t, idx) => (
                      <Badge key={idx} variant="outline">
                        {t.tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </>
            )}

            {/* Feedback */}
            <Separator />
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">Was this article helpful?</p>
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant={feedback === 'helpful' ? 'default' : 'outline'}
                    onClick={() => handleFeedback('helpful')}
                    disabled={feedback !== null}
                  >
                    <ThumbsUp className="mr-2 h-4 w-4" />
                    Yes
                  </Button>
                  <Button
                    variant={feedback === 'not-helpful' ? 'default' : 'outline'}
                    onClick={() => handleFeedback('not-helpful')}
                    disabled={feedback !== null}
                  >
                    <ThumbsDown className="mr-2 h-4 w-4" />
                    No
                  </Button>
                </div>
                {feedback && (
                  <p className="text-sm text-muted-foreground mt-4">
                    Thank you for your feedback!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Related Articles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {relatedArticles.map((related) => (
                  <Link
                    key={related.id}
                    href={`/help/${related.slug}`}
                    className="block p-2 -mx-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <h4 className="font-medium text-sm">{related.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {related.estimatedReadTime} min read
                    </p>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Back to Help */}
          <Card>
            <CardContent className="py-4">
              <Link href="/help">
                <Button variant="outline" className="w-full h-auto py-2 whitespace-normal">
                  <ArrowLeft className="mr-2 h-4 w-4 shrink-0" />
                  Back to Help Center
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
