'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  FileText,
  Shield,
  Scale,
  Cookie,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Calendar,
} from 'lucide-react'
import Link from 'next/link'

interface LegalDocument {
  id: string
  title: string
  documentType: string
  version: string
  effectiveDate: string
  summary?: string
}

const documentIcons: Record<string, React.ReactNode> = {
  'terms-of-service': <Scale className="h-8 w-8" />,
  'privacy-policy': <Shield className="h-8 w-8" />,
  'cookie-policy': <Cookie className="h-8 w-8" />,
  'acceptable-use-policy': <AlertTriangle className="h-8 w-8" />,
  'disclaimer': <FileText className="h-8 w-8" />,
  'data-processing-agreement': <FileText className="h-8 w-8" />,
}

const documentDescriptions: Record<string, string> = {
  'terms-of-service': 'The rules and guidelines for using BotCafe platform.',
  'privacy-policy': 'How we collect, use, and protect your personal data.',
  'cookie-policy': 'Information about cookies and tracking technologies.',
  'acceptable-use-policy': 'Guidelines for responsible and ethical use of our AI services.',
  'disclaimer': 'Important legal disclaimers and limitations of liability.',
  'data-processing-agreement': 'Data processing terms for business users.',
}

export const LegalHubView = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [documents, setDocuments] = useState<LegalDocument[]>([])

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/legal')
      const data = (await response.json()) as {
        success?: boolean
        documents?: LegalDocument[]
      }

      if (data.success) {
        setDocuments(data.documents || [])
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getDocumentUrl = (type: string) => {
    const urlMap: Record<string, string> = {
      'terms-of-service': '/legal/terms',
      'privacy-policy': '/legal/privacy',
      'cookie-policy': '/legal/cookies',
      'acceptable-use-policy': '/legal/acceptable-use',
      'disclaimer': '/legal/disclaimer',
      'data-processing-agreement': '/legal/dpa',
    }
    return urlMap[type] || `/legal/${type}`
  }

  // Static documents to show even if no database entries exist
  const staticDocuments = [
    {
      type: 'terms-of-service',
      title: 'Terms of Service',
      description: 'The rules and guidelines for using BotCafe platform.',
      url: '/legal/terms',
    },
    {
      type: 'privacy-policy',
      title: 'Privacy Policy',
      description: 'How we collect, use, and protect your personal data.',
      url: '/legal/privacy',
    },
    {
      type: 'acceptable-use-policy',
      title: 'Responsible AI Use',
      description: 'Guidelines for ethical and responsible use of our AI services.',
      url: '/legal/responsible-ai',
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Legal & Policies
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Transparency is important to us. Here you'll find all our legal documents,
          policies, and guidelines for using BotCafe.
        </p>
      </div>

      {/* Main Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {staticDocuments.map((doc) => {
          const dbDoc = documents.find((d) => d.documentType === doc.type)
          return (
            <Link key={doc.type} href={doc.url}>
              <Card className="h-full hover:border-purple-500/50 transition-colors cursor-pointer group">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                      {documentIcons[doc.type] || <FileText className="h-8 w-8" />}
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-purple-400 transition-colors" />
                  </div>
                  <CardTitle className="mt-4">{doc.title}</CardTitle>
                  <CardDescription>{doc.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {dbDoc ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Effective: {formatDate(dbDoc.effectiveDate)}</span>
                      <Badge variant="outline" className="text-xs">v{dbDoc.version}</Badge>
                    </div>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                  )}
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Additional Documents */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : documents.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">All Legal Documents</h2>
          <div className="space-y-4">
            {documents.map((doc) => (
              <Link key={doc.id} href={getDocumentUrl(doc.documentType)}>
                <Card className="hover:border-purple-500/50 transition-colors cursor-pointer">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-muted">
                          {documentIcons[doc.documentType] || <FileText className="h-5 w-5" />}
                        </div>
                        <div>
                          <h3 className="font-semibold">{doc.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {documentDescriptions[doc.documentType] || doc.summary}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm text-muted-foreground">
                          <div>v{doc.version}</div>
                          <div>{formatDate(doc.effectiveDate)}</div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Contact Section */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
        <CardContent className="py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Sparkles className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Have Questions?</h3>
                <p className="text-muted-foreground">
                  Our team is here to help with any legal or policy questions.
                </p>
              </div>
            </div>
            <Link href="/help">
              <Button>
                Contact Support
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
