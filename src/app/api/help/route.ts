import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

/**
 * GET /api/help
 *
 * Fetch published documentation articles.
 *
 * Query params:
 * - category: string - filter by category
 * - language: string - filter by language (default: en)
 * - featured: boolean - filter to featured articles only
 * - search: string - search in title and content
 * - limit: number - max articles to return (default: 20)
 * - page: number - page number (default: 1)
 *
 * Response:
 * - success: boolean
 * - articles: Array of Documentation objects
 * - categories: Array of unique categories with counts
 * - pagination: { page, limit, totalPages, totalDocs }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const language = searchParams.get('language') || 'en'
    const featured = searchParams.get('featured') === 'true'
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')

    // Get Payload instance
    let payload
    try {
      const payloadConfig = await config
      payload = await getPayload({ config: payloadConfig })
    } catch (dbError) {
      console.error('Database connection error:', dbError)
      // Return empty results if database is not available
      return NextResponse.json({
        success: true,
        articles: [],
        categories: [],
        pagination: {
          page: 1,
          limit,
          totalPages: 0,
          totalDocs: 0,
        },
      })
    }

    // Build where clause
    const whereConditions: any[] = [
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
    ]

    if (category) {
      whereConditions.push({
        category: {
          equals: category,
        },
      })
    }

    if (featured) {
      whereConditions.push({
        isFeatured: {
          equals: true,
        },
      })
    }

    if (search) {
      whereConditions.push({
        or: [
          {
            title: {
              contains: search,
            },
          },
          {
            metaDescription: {
              contains: search,
            },
          },
        ],
      })
    }

    // Fetch documentation articles
    const articles = await payload.find({
      collection: 'documentation',
      where: {
        and: whereConditions,
      },
      sort: 'sortOrder',
      page,
      limit,
      depth: 1,
    })

    // Get category counts
    const allArticles = await payload.find({
      collection: 'documentation',
      where: {
        and: [
          { isPublished: { equals: true } },
          { language: { equals: language } },
        ],
      },
      limit: 1000,
    })

    const categoryCounts: Record<string, number> = {}
    allArticles.docs.forEach((doc: any) => {
      if (doc.category) {
        categoryCounts[doc.category] = (categoryCounts[doc.category] || 0) + 1
      }
    })

    const categories = Object.entries(categoryCounts).map(([name, count]) => ({
      name,
      count,
    }))

    return NextResponse.json({
      success: true,
      articles: articles.docs,
      categories,
      pagination: {
        page: articles.page,
        limit: articles.limit,
        totalPages: articles.totalPages,
        totalDocs: articles.totalDocs,
      },
    })
  } catch (error: any) {
    console.error('Fetch documentation error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch documentation' },
      { status: 500 }
    )
  }
}
