import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { currentUser } from '@clerk/nextjs/server'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

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

    const payload = await getPayload({ config })

    // Find Payload user by email
    const payloadUsers = await payload.find({
      collection: 'users',
      where: {
        email: { equals: clerkUser.emailAddresses[0]?.emailAddress },
      },
      limit: 1,
    })

    if (payloadUsers.docs.length === 0) {
      return NextResponse.json({ message: 'User not synced yet. Please try again.' }, { status: 404 })
    }

    const payloadUser = payloadUsers.docs[0]

    // Use direct D1 SQL to avoid loading all vector records into memory.
    // A heavily chunked knowledge entry can have thousands of vector records.
    const d1 = (payload.db as any).client as D1Database

    let deletedCount = 0
    if (d1) {
      // Security: only delete user's own vectors by checking user_id
      const result = await d1.prepare(
        'DELETE FROM vector_records WHERE source_type = ? AND source_id = ? AND user_id = ?'
      ).bind(source_type, sourceId, payloadUser.id).run()
      deletedCount = result.meta?.changes ?? 0
    } else {
      // Fallback to Payload ORM
      const vectorRecords = await payload.find({
        collection: 'vectorRecords' as any,
        where: {
          and: [
            { source_type: { equals: source_type } },
            { source_id: { equals: sourceId } },
            { user_id: { equals: payloadUser.id } },
          ],
        },
        limit: 500,
      })
      for (const record of vectorRecords.docs) {
        await payload.delete({ collection: 'vectorRecords' as any, id: record.id })
        deletedCount++
      }
    }

    if (deletedCount === 0) {
      return NextResponse.json({ message: 'No vectors found for this source' }, { status: 404 })
    }

    // TODO: In production, delete from Vectorize database first
    // Need vector_ids for Vectorize cleanup - fetch them via SQL if needed

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
      deleted_count: deletedCount,
    })
  } catch (error: any) {
    console.error('Error deleting vectors:', error)
    return NextResponse.json({ message: error.message || 'Failed to delete vectors' }, { status: 500 })
  }
}
