import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

/**
 * GET /api/legal
 *
 * Fetch all active legal documents.
 *
 * Query params:
 * - type: string - filter by document type (terms-of-service, privacy-policy, etc.)
 * - language: string - filter by language (default: en)
 *
 * Response:
 * - success: boolean
 * - documents: Array of LegalDocument objects
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const language = searchParams.get('language') || 'en'

    // Get Payload instance
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Build where clause
    const whereConditions: any[] = [
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

    if (type) {
      whereConditions.push({
        documentType: {
          equals: type,
        },
      })
    }

    // Fetch legal documents
    const documents = await payload.find({
      collection: 'legal-documents',
      where: {
        and: whereConditions,
      },
      sort: '-effectiveDate',
      depth: 1,
    })

    return NextResponse.json({
      success: true,
      documents: documents.docs,
    })
  } catch (error: any) {
    console.error('Fetch legal documents error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch legal documents' },
      { status: 500 }
    )
  }
}
