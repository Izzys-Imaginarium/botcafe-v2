'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Loader2,
  FileText,
  Calendar,
  Clock,
  ArrowLeft,
  Printer,
  Download,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface LegalDocument {
  id: string
  title: string
  documentType: string
  version: string
  content: any // Rich text content
  effectiveDate: string
  lastModified: string
  summary?: string
  language: string
  tags?: Array<{ tag: string }>
}

interface LegalDocumentViewProps {
  documentType: string
  title: string
}

// Simple rich text renderer for Payload's lexical content
const RichTextRenderer = ({ content }: { content: any }) => {
  if (!content) return null

  // Handle Payload's lexical/slate rich text format
  if (content.root && content.root.children) {
    return (
      <div className="prose prose-invert max-w-none">
        {content.root.children.map((node: any, index: number) => (
          <RenderNode key={index} node={node} />
        ))}
      </div>
    )
  }

  // Fallback for plain text or simple HTML
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

export const LegalDocumentView = ({ documentType, title }: LegalDocumentViewProps) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [document, setDocument] = useState<LegalDocument | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDocument()
  }, [documentType])

  const fetchDocument = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/legal/${documentType}`)
      const data = (await response.json()) as {
        success?: boolean
        document?: LegalDocument
        message?: string
      }

      if (data.success && data.document) {
        setDocument(data.document)
      } else {
        setError(data.message || 'Document not found')
      }
    } catch (err) {
      console.error('Error fetching document:', err)
      setError('Failed to load document')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
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

  if (error || !document) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Document Not Available</h3>
              <p className="text-muted-foreground mb-4">
                {error || 'This legal document is not currently available.'}
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Please check back later or contact support if you need immediate assistance.
              </p>
              <Link href="/legal">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Legal
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl print:max-w-none">
      {/* Header */}
      <div className="mb-6 print:hidden">
        <Link href="/legal" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Legal
        </Link>
      </div>

      {/* Document Card */}
      <Card className="print:shadow-none print:border-none">
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent print:text-black">
                {document.title}
              </CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">Version {document.version}</Badge>
                <Badge variant="secondary">{document.language.toUpperCase()}</Badge>
              </div>
            </div>
            <div className="flex gap-2 print:hidden">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Effective: {formatDate(document.effectiveDate)}</span>
            </div>
            {document.lastModified && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Last Updated: {formatDate(document.lastModified)}</span>
              </div>
            )}
          </div>

          {/* Summary */}
          {document.summary && (
            <div className="bg-muted/50 rounded-lg p-4 print:bg-gray-100">
              <p className="text-sm italic">{document.summary}</p>
            </div>
          )}
        </CardHeader>

        <Separator />

        <CardContent className="pt-6">
          <RichTextRenderer content={document.content} />
        </CardContent>

        {/* Tags */}
        {document.tags && document.tags.length > 0 && (
          <>
            <Separator />
            <CardContent className="pt-4 print:hidden">
              <div className="flex flex-wrap gap-2">
                {document.tags.map((t, idx) => (
                  <Badge key={idx} variant="outline">
                    {t.tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </>
        )}
      </Card>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-muted-foreground print:hidden">
        <p>
          If you have questions about this document, please{' '}
          <Link href="/help" className="text-purple-400 hover:underline">
            contact our support team
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
