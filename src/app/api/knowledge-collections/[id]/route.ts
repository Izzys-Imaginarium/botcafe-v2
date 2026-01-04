import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import config from '@payload-config'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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
        clerkId: { equals: clerkUser.id },
      },
      limit: 1,
    })

    if (payloadUsers.docs.length === 0) {
      return NextResponse.json(
        { message: 'User not found in database' },
        { status: 404 }
      )
    }

    const payloadUser = payloadUsers.docs[0]

    // Fetch the collection to verify ownership
    const collection = await payload.findByID({
      collection: 'knowledgeCollections',
      id,
    })

    if (!collection) {
      return NextResponse.json(
        { message: 'Collection not found' },
        { status: 404 }
      )
    }

    // Check if user owns this collection
    // @ts-ignore - Payload types are complex
    if (collection.user !== payloadUser.id && collection.user?.id !== payloadUser.id) {
      return NextResponse.json(
        { message: 'Unauthorized - You do not own this collection' },
        { status: 403 }
      )
    }

    // Check if collection has entries
    const entriesInCollection = await payload.find({
      collection: 'knowledge',
      where: {
        knowledge_collection: {
          equals: id,
        },
      },
      limit: 1,
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
      id,
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
