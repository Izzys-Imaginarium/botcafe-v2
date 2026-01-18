import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import config from '@payload-config'
import { checkResourceAccess } from '@/lib/permissions/check-access'

export const dynamic = 'force-dynamic'

interface CollectionUpdateRequest {
  name?: string
  description?: string
  sharing_settings?: {
    sharing_level?: 'private' | 'shared' | 'public'
    allow_collaboration?: boolean
    allow_fork?: boolean
    collaboration_requests?: boolean
    is_public?: boolean
    sharing_expiration?: string
    share_password?: string
  }
  collection_metadata?: {
    category?: string
    difficulty_level?: string
  }
}

// GET - Fetch a single collection by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const numericId = parseInt(id, 10)

    if (isNaN(numericId)) {
      return NextResponse.json(
        { message: 'Invalid collection ID' },
        { status: 400 }
      )
    }

    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json(
        { message: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    const payload = await getPayloadHMR({ config })

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

    const collection = await payload.findByID({
      collection: 'knowledgeCollections',
      id: numericId,
      overrideAccess: true,
    })

    if (!collection) {
      return NextResponse.json(
        { message: 'Collection not found' },
        { status: 404 }
      )
    }

    // Check if user has at least readonly access
    const accessResult = await checkResourceAccess(payload, payloadUser.id, 'knowledgeCollection', numericId)
    if (!accessResult.hasAccess) {
      return NextResponse.json(
        { message: 'Unauthorized - You do not have access to this collection' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      collection,
    })
  } catch (error: any) {
    console.error('Error fetching collection:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to fetch collection' },
      { status: 500 }
    )
  }
}

// PATCH - Update a collection
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const numericId = parseInt(id, 10)

    if (isNaN(numericId)) {
      return NextResponse.json(
        { message: 'Invalid collection ID' },
        { status: 400 }
      )
    }

    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json(
        { message: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    const body = (await request.json()) as CollectionUpdateRequest

    const payload = await getPayloadHMR({ config })

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

    // Fetch existing collection
    const existingCollection = await payload.findByID({
      collection: 'knowledgeCollections',
      id: numericId,
      overrideAccess: true,
    })

    if (!existingCollection) {
      return NextResponse.json(
        { message: 'Collection not found' },
        { status: 404 }
      )
    }

    // Check if user has at least editor permission
    const accessResult = await checkResourceAccess(payload, payloadUser.id, 'knowledgeCollection', numericId)
    if (!accessResult.hasAccess) {
      return NextResponse.json(
        { message: 'Unauthorized - You do not have access to this collection' },
        { status: 403 }
      )
    }

    if (accessResult.permission !== 'owner' && accessResult.permission !== 'editor') {
      return NextResponse.json(
        { message: 'Unauthorized - You do not have permission to edit this collection' },
        { status: 403 }
      )
    }

    // Only owners can change sharing settings
    if (body.sharing_settings && accessResult.permission !== 'owner') {
      return NextResponse.json(
        { message: 'Only owners can change sharing settings' },
        { status: 403 }
      )
    }

    // IMPORTANT: Lore books cannot be made public from the API - only via Payload admin
    if (body.sharing_settings?.sharing_level === 'public') {
      return NextResponse.json(
        { message: 'Lore books cannot be made public from this interface. Please contact an administrator.' },
        { status: 403 }
      )
    }

    // Build update data - only include fields that were provided
    const updateData: Record<string, any> = {}

    if (body.name !== undefined) {
      updateData.name = body.name
    }

    if (body.description !== undefined) {
      updateData.description = body.description
    }

    if (body.sharing_settings) {
      // Merge with existing sharing_settings
      updateData.sharing_settings = {
        // @ts-ignore
        ...existingCollection.sharing_settings,
        ...body.sharing_settings,
        last_updated: new Date().toISOString(),
      }
    }

    if (body.collection_metadata) {
      updateData.collection_metadata = {
        // @ts-ignore
        ...existingCollection.collection_metadata,
        ...body.collection_metadata,
      }
    }

    // Update the collection
    const updatedCollection = await payload.update({
      collection: 'knowledgeCollections',
      id: numericId,
      data: updateData,
      overrideAccess: true,
    })

    return NextResponse.json({
      success: true,
      message: 'Collection updated successfully',
      collection: updatedCollection,
    })
  } catch (error: any) {
    console.error('Error updating collection:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to update collection' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const numericId = parseInt(id, 10)

    if (isNaN(numericId)) {
      return NextResponse.json(
        { message: 'Invalid collection ID' },
        { status: 400 }
      )
    }

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
      return NextResponse.json(
        { message: 'User not synced yet. Please try again.' },
        { status: 404 }
      )
    }

    const payloadUser = payloadUsers.docs[0]

    // Fetch the collection
    const collection = await payload.findByID({
      collection: 'knowledgeCollections',
      id: numericId,
      overrideAccess: true,
    })

    if (!collection) {
      return NextResponse.json(
        { message: 'Collection not found' },
        { status: 404 }
      )
    }

    // Only owners can delete collections
    const accessResult = await checkResourceAccess(payload, payloadUser.id, 'knowledgeCollection', numericId)
    if (!accessResult.hasAccess || accessResult.permission !== 'owner') {
      return NextResponse.json(
        { message: 'Only owners can delete this collection' },
        { status: 403 }
      )
    }

    // Check if collection has entries
    const entriesInCollection = await payload.find({
      collection: 'knowledge',
      where: {
        knowledge_collection: {
          equals: numericId,
        },
      },
      limit: 1,
      overrideAccess: true,
    })

    if (entriesInCollection.totalDocs > 0) {
      return NextResponse.json(
        { message: 'Cannot delete collection with existing entries. Please delete all entries first.' },
        { status: 400 }
      )
    }

    // Delete the collection
    await payload.delete({
      collection: 'knowledgeCollections',
      id: numericId,
      overrideAccess: true,
    })

    return NextResponse.json({
      success: true,
      message: 'Collection deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting collection:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to delete collection' },
      { status: 500 }
    )
  }
}
