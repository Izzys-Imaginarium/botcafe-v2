import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

/**
 * GET /api/help/tutorials
 *
 * Fetch published tutorials.
 *
 * Query params:
 * - category: string - filter by category
 * - difficulty: string - filter by difficulty level
 * - language: string - filter by language (default: en)
 * - featured: boolean - filter to featured tutorials only
 * - limit: number - max tutorials to return (default: 20)
 * - page: number - page number (default: 1)
 *
 * Response:
 * - success: boolean
 * - tutorials: Array of Tutorial objects
 * - pagination: { page, limit, totalPages, totalDocs }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const difficulty = searchParams.get('difficulty')
    const language = searchParams.get('language') || 'en'
    const featured = searchParams.get('featured') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')

    // Get Payload instance
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

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

    if (difficulty) {
      whereConditions.push({
        difficulty: {
          equals: difficulty,
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

    // Fetch tutorials
    const tutorials = await payload.find({
      collection: 'tutorials',
      where: {
        and: whereConditions,
      },
      sort: 'sortOrder',
      page,
      limit,
      depth: 1,
    })

    return NextResponse.json({
      success: true,
      tutorials: tutorials.docs,
      pagination: {
        page: tutorials.page,
        limit: tutorials.limit,
        totalPages: tutorials.totalPages,
        totalDocs: tutorials.totalDocs,
      },
    })
  } catch (error: any) {
    console.error('Fetch tutorials error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch tutorials' },
      { status: 500 }
    )
  }
}
