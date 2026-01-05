import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

// GET /api/wellbeing/crisis-support - Get crisis support resources (public access)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const type = searchParams.get('type')
    const region = searchParams.get('region')
    const emergency = searchParams.get('emergency')
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')

    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Build query
    const whereConditions: any[] = [
      { is_active: { equals: true } },
      { verification_status: { equals: 'verified' } },
    ]

    if (category) {
      whereConditions.push({ resource_category: { equals: category } })
    }

    if (type) {
      whereConditions.push({ resource_type: { equals: type } })
    }

    if (region) {
      whereConditions.push({
        or: [
          { geographic_region: { equals: region } },
          { geographic_region: { equals: 'worldwide' } },
        ],
      })
    }

    if (emergency === 'true') {
      whereConditions.push({ is_emergency: { equals: true } })
    }

    // Fetch resources
    const resources = await payload.find({
      collection: 'crisis-support',
      where: {
        and: whereConditions,
      },
      sort: 'display_order',
      limit,
      page,
    })

    // Get all unique categories for filtering
    const allCategories = [
      { value: 'suicide-prevention', label: 'Suicide Prevention' },
      { value: 'mental-health', label: 'Mental Health Crisis' },
      { value: 'domestic-violence', label: 'Domestic Violence' },
      { value: 'substance-abuse', label: 'Substance Abuse' },
      { value: 'lgbtq', label: 'LGBTQ+ Support' },
      { value: 'youth', label: 'Youth Support' },
      { value: 'senior', label: 'Senior Support' },
      { value: 'general', label: 'General Crisis' },
      { value: 'financial', label: 'Financial Crisis' },
      { value: 'relationship', label: 'Relationship Issues' },
    ]

    // Get all unique types for filtering
    const allTypes = [
      { value: 'hotline', label: 'Hotline' },
      { value: 'chat', label: 'Crisis Chat' },
      { value: 'text', label: 'Text Support' },
      { value: 'online', label: 'Online Resources' },
      { value: 'emergency', label: 'Emergency Services' },
      { value: 'apps', label: 'Mental Health Apps' },
      { value: 'groups', label: 'Support Groups' },
      { value: 'professional', label: 'Professional Help' },
    ]

    // Get available regions
    const allRegions = [
      { value: 'us-national', label: 'United States' },
      { value: 'ca-national', label: 'Canada' },
      { value: 'uk', label: 'United Kingdom' },
      { value: 'au', label: 'Australia' },
      { value: 'eu', label: 'European Union' },
      { value: 'worldwide', label: 'Worldwide/Online' },
    ]

    return NextResponse.json({
      resources: resources.docs,
      total: resources.totalDocs,
      totalPages: resources.totalPages,
      page: resources.page,
      filters: {
        categories: allCategories,
        types: allTypes,
        regions: allRegions,
      },
    })
  } catch (error) {
    console.error('Error fetching crisis support resources:', error)
    return NextResponse.json(
      { error: 'Failed to fetch resources' },
      { status: 500 }
    )
  }
}
