import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

interface CollectionCreateRequest {
  name: string
  description?: string
  collection_metadata?: {
    collection_category?: 'lore' | 'memories' | 'general'
  }
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
      overrideAccess: true,
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
        collection_metadata: {
          collection_category: body.collection_metadata?.collection_category || 'general',
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
      overrideAccess: true,
    })

    if (payloadUsers.docs.length === 0) {
      // User not synced yet - return empty collections
      return NextResponse.json({
        success: true,
        collections: [],
      })
    }

    const payloadUser = payloadUsers.docs[0]

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const includeMemoryTomes = searchParams.get('includeMemoryTomes') === 'true'
    const onlyMemoryTomes = searchParams.get('onlyMemoryTomes') === 'true'
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || '-createdAt'

    // Build where clause for owned collections using 'and' to safely combine filters
    // Note: In SQLite/D1, `not_equals` excludes NULL values, so we must use
    // an OR condition to include tomes with NULL collection_category
    const ownedConditions: Record<string, unknown>[] = [
      { user: { equals: payloadUser.id } },
    ]

    // Add search filter
    if (search) {
      ownedConditions.push({
        or: [
          { name: { contains: search } },
          { description: { contains: search } },
        ],
      })
    }

    // By default, exclude memory tomes from the main tome list
    // Memory tomes are managed in the Memories section
    // Use includeMemoryTomes=true to include them, or onlyMemoryTomes=true to only show memory tomes
    if (onlyMemoryTomes) {
      ownedConditions.push({
        'collection_metadata.collection_category': { equals: 'memories' },
      })
    } else if (!includeMemoryTomes) {
      // Include tomes where category is NOT 'memories' OR category is NULL/unset
      ownedConditions.push({
        or: [
          { 'collection_metadata.collection_category': { not_equals: 'memories' } },
          { 'collection_metadata.collection_category': { exists: false } },
        ],
      })
    }

    const ownedWhere = ownedConditions.length === 1
      ? ownedConditions[0]
      : { and: ownedConditions }

    // Fetch owned knowledge collections with pagination
    const ownedCollections = await payload.find({
      collection: 'knowledgeCollections',
      where: ownedWhere,
      sort,
      page,
      limit,
      overrideAccess: true,
    })

    // Fetch collections shared with this user via AccessControl
    const sharedAccessResult = await payload.find({
      collection: 'access-control',
      where: {
        and: [
          { user: { equals: payloadUser.id } },
          { resource_type: { equals: 'knowledgeCollection' } },
          { is_revoked: { equals: false } },
        ],
      },
      limit: 100,
      overrideAccess: true,
    })

    // Get the collection IDs that are shared with this user
    const sharedCollectionIds = sharedAccessResult.docs
      .map((ac: any) => ac.resource_id)
      .filter((id: string) => id)

    // Fetch the shared collections
    let sharedCollections: any[] = []
    if (sharedCollectionIds.length > 0) {
      const numericIds = sharedCollectionIds
        .map((id: string) => parseInt(id, 10))
        .filter((id: number) => !isNaN(id))

      if (numericIds.length > 0) {
        // D1/SQLite has a limit on IN clause parameters, so batch in chunks of 50
        const BATCH_SIZE = 50
        for (let i = 0; i < numericIds.length; i += BATCH_SIZE) {
          const batchIds = numericIds.slice(i, i + BATCH_SIZE)

          // Build where clause for shared collections with same NULL-safe memory tome filter
          const sharedConditions: Record<string, unknown>[] = [
            { id: { in: batchIds } },
          ]

          if (onlyMemoryTomes) {
            sharedConditions.push({
              'collection_metadata.collection_category': { equals: 'memories' },
            })
          } else if (!includeMemoryTomes) {
            sharedConditions.push({
              or: [
                { 'collection_metadata.collection_category': { not_equals: 'memories' } },
                { 'collection_metadata.collection_category': { exists: false } },
              ],
            })
          }

          if (search) {
            sharedConditions.push({
              or: [
                { name: { contains: search } },
                { description: { contains: search } },
              ],
            })
          }

          const sharedWhere = sharedConditions.length === 1
            ? sharedConditions[0]
            : { and: sharedConditions }

          const sharedCollectionsResult = await payload.find({
            collection: 'knowledgeCollections',
            where: sharedWhere,
            sort,
            overrideAccess: true,
          })
          sharedCollections = sharedCollections.concat(sharedCollectionsResult.docs)
        }
      }
    }

    // Create a map to track permission level for shared collections
    const sharedPermissions = new Map<string, string>()
    sharedAccessResult.docs.forEach((ac: any) => {
      const existing = sharedPermissions.get(ac.resource_id)
      if (!existing ||
          (ac.permission_type === 'admin') ||
          (ac.permission_type === 'write' && existing === 'read')) {
        sharedPermissions.set(ac.resource_id, ac.permission_type)
      }
    })

    // Combine and count entries for all collections
    const ownedCollectionIds = new Set(ownedCollections.docs.map((c: any) => String(c.id)))
    const allCollections = [
      ...ownedCollections.docs.map((c: any) => ({
        ...c,
        access_level: 'owner',
        is_shared_with_me: false,
      })),
      ...sharedCollections
        .filter((c: any) => !ownedCollectionIds.has(String(c.id)))
        .map((c: any) => {
          const permissionType = sharedPermissions.get(String(c.id))
          let accessLevel = 'readonly'
          if (permissionType === 'admin') accessLevel = 'owner'
          else if (permissionType === 'write') accessLevel = 'editor'
          return {
            ...c,
            access_level: accessLevel,
            is_shared_with_me: true,
          }
        }),
    ]

    // Count entries for each collection
    const collectionsWithCounts = await Promise.all(
      allCollections.map(async (collection) => {
        const entriesCount = await payload.count({
          collection: 'knowledge',
          where: {
            knowledge_collection: {
              equals: collection.id,
            },
          },
          overrideAccess: true,
        })

        return {
          ...collection,
          entry_count: entriesCount.totalDocs,
        }
      })
    )

    return NextResponse.json({
      success: true,
      collections: collectionsWithCounts,
      pagination: {
        page: ownedCollections.page || page,
        limit,
        totalPages: ownedCollections.totalPages || 1,
        totalDocs: ownedCollections.totalDocs + sharedCollections.length,
        hasNextPage: ownedCollections.hasNextPage || false,
        hasPrevPage: ownedCollections.hasPrevPage || false,
      },
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
