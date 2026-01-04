import { NextRequest, NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import { currentUser } from '@clerk/nextjs/server'
import config from '@payload-config'

/**
 * DELETE /api/vectors/[sourceId]
 *
 * Delete all vectors associated with a source (knowledge or memory)
 * Also removes records from Vectorize database
 *
 * Query params:
 * - source_type: 'knowledge' | 'memory'
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  try {
    const { sourceId } = await params
    const searchParams = request.nextUrl.searchParams
    const source_type = searchParams.get('source_type')

    if (!sourceId) {
      return NextResponse.json({ message: 'Source ID is required' }, { status: 400 })
    }

    if (!source_type || (source_type !== 'knowledge' && source_type !== 'memory')) {
      return NextResponse.json(
        { message: 'Invalid or missing source_type. Must be "knowledge" or "memory"' },
        { status: 400 }
      )
    }

    // Get current Clerk user
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

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
      return NextResponse.json({ message: 'User not found in database' }, { status: 404 })
    }

    const payloadUser = payloadUsers.docs[0]

    // Find all vector records for this source
    const vectorRecords = await payload.find({
      collection: 'vectorRecords' as any,
      where: {
        and: [
          { source_type: { equals: source_type } },
          { source_id: { equals: sourceId } },
          { user_id: { equals: payloadUser.id } }, // Security: only delete user's own vectors
        ],
      },
    })

    if (vectorRecords.docs.length === 0) {
      return NextResponse.json({ message: 'No vectors found for this source' }, { status: 404 })
    }

    // TODO: In production, delete from Vectorize database first
    // const vectorIds = vectorRecords.docs.map((vr: any) => vr.vector_id)
    // await deleteFromVectorize(vectorIds)

    // Delete vector records from D1
    const deletedIds = []
    for (const record of vectorRecords.docs) {
      await payload.delete({
        collection: 'vectorRecords' as any,
        id: record.id,
      })
      deletedIds.push(record.id)
    }

    // Update source document to mark as not vectorized
    const sourceCollection = source_type === 'knowledge' ? 'knowledge' : 'memory'
    await payload.update({
      collection: sourceCollection as any,
      id: sourceId,
      data: {
        is_vectorized: false,
        vector_records: [],
        chunk_count: 0,
      },
    })

    return NextResponse.json({
      message: 'Vectors deleted successfully',
      deleted_count: deletedIds.length,
      deleted_record_ids: deletedIds,
    })
  } catch (error: any) {
    console.error('Error deleting vectors:', error)
    return NextResponse.json({ message: error.message || 'Failed to delete vectors' }, { status: 500 })
  }
}
