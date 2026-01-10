import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

interface KnowledgeCreateRequest {
  type: 'text' | 'document' | 'url' | 'image' | 'audio' | 'video' | 'legacy_memory'
  entry: string
  knowledge_collection: string | number
  tags?: { tag: string }[]
  applies_to_bots?: (string | number)[]
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated Clerk user
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return NextResponse.json(
        { message: 'Unauthorized - Please sign in to create knowledge entries' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = (await request.json()) as KnowledgeCreateRequest

    // Validate required fields
    if (!body.entry || !body.knowledge_collection || !body.type) {
      return NextResponse.json(
        { message: 'Missing required fields: entry, knowledge_collection, and type are required' },
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
      overrideAccess: true,
    })

    if (payloadUsers.docs.length === 0) {
      return NextResponse.json(
        { message: 'User not synced yet. Please try again.' },
        { status: 404 }
      )
    }

    const payloadUser = payloadUsers.docs[0]

    // Estimate token count (rough approximation: 1 token ≈ 4 characters)
    const estimatedTokens = Math.ceil(body.entry.length / 4)

    // Create the knowledge entry
    const newKnowledge = await payload.create({
      collection: 'knowledge',
      data: {
        user: payloadUser.id,
        type: body.type,
        entry: body.entry,
        knowledge_collection: typeof body.knowledge_collection === 'string'
          ? parseInt(body.knowledge_collection)
          : body.knowledge_collection,
        tags: body.tags || [],
        tokens: estimatedTokens,
        applies_to_bots: body.applies_to_bots?.map(id => typeof id === 'string' ? parseInt(id) : id) || [],
        is_vectorized: false,
        chunk_count: 0,
        privacy_settings: {
          privacy_level: 'private',
          allow_sharing: true,
          access_count: 0,
        },
        content_metadata: {
          processing_status: 'pending',
          word_count: body.entry.split(/\s+/).length,
        },
        usage_analytics: {
          view_count: 0,
          search_count: 0,
          引用_count: 0,
          popularity_score: 0,
        },
        // Hybrid activation system defaults
        activation_settings: {
          activation_mode: 'vector',
          vector_similarity_threshold: 0.7,
          max_vector_results: 5,
          probability: 100,
          use_probability: false,
          scan_depth: 2,
          match_in_user_messages: true,
          match_in_bot_messages: true,
          match_in_system_prompts: false,
        },
        positioning: {
          position: 'before_character',
          depth: 0,
          role: 'system',
          order: 100,
        },
      },
      overrideAccess: true,
    })

    return NextResponse.json({
      success: true,
      message: 'Knowledge entry created successfully',
      knowledge: newKnowledge,
    })
  } catch (error: any) {
    console.error('Error creating knowledge entry:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to create knowledge entry' },
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

    // Find Payload user by Clerk ID
    const payloadUsers = await payload.find({
      collection: 'users',
      where: {
        email: { equals: clerkUser.emailAddresses[0]?.emailAddress },
      },
      limit: 1,
    })

    if (payloadUsers.docs.length === 0) {
      // User not synced yet - return empty results
      return NextResponse.json({
        success: true,
        docs: [],
        totalDocs: 0,
        page: 1,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      })
    }

    const payloadUser = payloadUsers.docs[0]

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const collectionId = searchParams.get('collection')

    // Build where clause
    const whereClause: any = {
      user: {
        equals: payloadUser.id,
      },
    }

    if (collectionId) {
      whereClause.knowledge_collection = {
        equals: collectionId,
      }
    }

    // Fetch knowledge entries
    const knowledgeEntries = await payload.find({
      collection: 'knowledge',
      where: whereClause,
      page,
      limit,
      sort: '-createdAt',
      overrideAccess: true,
    })

    return NextResponse.json({
      success: true,
      docs: knowledgeEntries.docs,
      totalDocs: knowledgeEntries.totalDocs,
      page: knowledgeEntries.page,
      totalPages: knowledgeEntries.totalPages,
      hasNextPage: knowledgeEntries.hasNextPage,
      hasPrevPage: knowledgeEntries.hasPrevPage,
    })
  } catch (error: any) {
    console.error('Error fetching knowledge entries:', error)
    // Return empty results instead of error for better UX
    return NextResponse.json({
      success: true,
      docs: [],
      totalDocs: 0,
      page: 1,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    })
  }
}
