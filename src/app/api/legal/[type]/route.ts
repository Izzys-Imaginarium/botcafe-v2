import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

/**
 * GET /api/legal/[type]
 *
 * Fetch a specific legal document by type (e.g., terms-of-service, privacy-policy).
 * Returns the most recent active version.
 *
 * Query params:
 * - language: string - filter by language (default: en)
 * - version: string - fetch a specific version
 *
 * Response:
 * - success: boolean
 * - document: LegalDocument object
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params
    const { searchParams } = new URL(request.url)
    const language = searchParams.get('language') || 'en'
    const version = searchParams.get('version')

    // Get Payload instance
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Build where clause
    const whereConditions: any[] = [
      {
        documentType: {
          equals: type,
        },
      },
      {
        status: {
          equals: 'active',
        },
      },
      {
        language: {
          equals: language,
        },
      },
    ]

    if (version) {
      whereConditions.push({
        version: {
          equals: version,
        },
      })
    }

    // Fetch the legal document
    const documents = await payload.find({
      collection: 'legal-documents',
      where: {
        and: whereConditions,
      },
      sort: '-effectiveDate',
      limit: 1,
      depth: 1,
    })

    if (documents.docs.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Legal document not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      document: documents.docs[0],
    })
  } catch (error: any) {
    console.error('Fetch legal document error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch legal document' },
      { status: 500 }
    )
  }
}
