import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

interface CollectionCreateRequest {
  name: string
  description?: string
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated Clerk user
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return NextResponse.json(
        { message: 'Unauthorized - Please sign in to create collections' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = (await request.json()) as CollectionCreateRequest

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { message: 'Missing required field: name is required' },
        { status: 400 }
      )
    }

    // Get Payload instance
    const payload = await getPayloadHMR({ config })

    // Find Payload user by email
    const payloadUsers = await payload.find({
      collection: 'users',
      where: {
        email: { equals: clerkUser.emailAddresses[0]?.emailAddress },
      },
      limit: 1,
    })

    if (payloadUsers.docs.length === 0) {
      return NextResponse.json(
        { message: 'User not synced yet. Please try again.' },
        { status: 404 }
      )
    }

    const payloadUser = payloadUsers.docs[0]

    // Create the knowledge collection
    const newCollection = await payload.create({
      collection: 'knowledgeCollections',
      data: {
        user: payloadUser.id,
        name: body.name,
        description: body.description || '',
        sharing_settings: {
          sharing_level: 'private',
          allow_collaboration: true,
          allow_fork: true,
          collaboration_requests: true,
          knowledge_count: 0,
          last_updated: new Date().toISOString(),
          is_public: false,
        },
      },
      overrideAccess: true,
    })

    return NextResponse.json({
      success: true,
      message: 'Collection created successfully',
      collection: newCollection,
    })
  } catch (error: any) {
    console.error('Error creating collection:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to create collection' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get authenticated Clerk user
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return NextResponse.json(
        { message: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    // Get Payload instance
    const payload = await getPayloadHMR({ config })

    // Find Payload user by email
    const payloadUsers = await payload.find({
      collection: 'users',
      where: {
        email: { equals: clerkUser.emailAddresses[0]?.emailAddress },
      },
      limit: 1,
    })

    if (payloadUsers.docs.length === 0) {
      // User not synced yet - return empty collections
      return NextResponse.json({
        success: true,
        collections: [],
      })
    }

    const payloadUser = payloadUsers.docs[0]

    // Fetch knowledge collections
    const collections = await payload.find({
      collection: 'knowledgeCollections',
      where: {
        user: {
          equals: payloadUser.id,
        },
      },
      sort: '-createdAt',
      limit: 100,
    })

    return NextResponse.json({
      success: true,
      collections: collections.docs,
    })
  } catch (error: any) {
    console.error('Error fetching collections:', error)
    // Return empty collections instead of error for better UX
    return NextResponse.json({
      success: true,
      collections: [],
    })
  }
}
