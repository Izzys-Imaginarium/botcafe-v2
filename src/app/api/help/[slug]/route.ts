import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

/**
 * GET /api/help/[slug]
 *
 * Fetch a specific documentation article by slug.
 * Also increments the view count.
 *
 * Query params:
 * - language: string - filter by language (default: en)
 *
 * Response:
 * - success: boolean
 * - article: Documentation object
 * - relatedArticles: Array of related articles in the same category
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const language = searchParams.get('language') || 'en'

    // Get Payload instance
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Fetch the article
    const articles = await payload.find({
      collection: 'documentation',
      where: {
        and: [
          {
            slug: {
              equals: slug,
            },
          },
          {
            language: {
              equals: language,
            },
          },
          {
            isPublished: {
              equals: true,
            },
          },
        ],
      },
      limit: 1,
      depth: 2,
      overrideAccess: true,
    })

    if (articles.docs.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Article not found' },
        { status: 404 }
      )
    }

    const article = articles.docs[0]

    // Increment view count
    await payload.update({
      collection: 'documentation',
      id: article.id,
      data: {
        viewCount: (article.viewCount || 0) + 1,
      },
      overrideAccess: true,
    })

    // Fetch related articles in the same category
    const relatedArticles = await payload.find({
      collection: 'documentation',
      where: {
        and: [
          {
            category: {
              equals: article.category,
            },
          },
          {
            id: {
              not_equals: article.id,
            },
          },
          {
            isPublished: {
              equals: true,
            },
          },
          {
            language: {
              equals: language,
            },
          },
        ],
      },
      sort: 'sortOrder',
      limit: 5,
      depth: 1,
      overrideAccess: true,
    })

    return NextResponse.json({
      success: true,
      article: {
        ...article,
        viewCount: (article.viewCount || 0) + 1,
      },
      relatedArticles: relatedArticles.docs,
    })
  } catch (error: any) {
    console.error('Fetch article error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch article' },
      { status: 500 }
    )
  }
}
