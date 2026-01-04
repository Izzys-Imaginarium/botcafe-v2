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

    // Fetch the knowledge entry to verify ownership
    const knowledge = await payload.findByID({
      collection: 'knowledge',
      id,
    })

    if (!knowledge) {
      return NextResponse.json(
        { message: 'Knowledge entry not found' },
        { status: 404 }
      )
    }

    // Check if user owns this knowledge entry
    // @ts-ignore - Payload types are complex
    if (knowledge.user !== payloadUser.id && knowledge.user?.id !== payloadUser.id) {
      return NextResponse.json(
        { message: 'Unauthorized - You do not own this knowledge entry' },
        { status: 403 }
      )
    }

    // Delete associated vectors if entry is vectorized
    // @ts-ignore
    if (knowledge.is_vectorized) {
      try {
        // Delete vector records
        const vectorRecords = await payload.find({
          collection: 'vectorRecords',
          where: {
            and: [
              { source_type: { equals: 'knowledge' } },
              { source_id: { equals: id } },
              { user_id: { equals: payloadUser.id } },
            ],
          },
        })

        for (const record of vectorRecords.docs) {
          await payload.delete({
            collection: 'vectorRecords',
            id: record.id,
          })
        }

        console.log(`Deleted ${vectorRecords.docs.length} vector records for knowledge ${id}`)
      } catch (vectorError) {
        console.error('Error deleting vectors:', vectorError)
        // Continue with knowledge deletion even if vector deletion fails
      }
    }

    // Delete the knowledge entry
    await payload.delete({
      collection: 'knowledge',
      id,
    })

    return NextResponse.json({
      success: true,
      message: 'Knowledge entry deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting knowledge entry:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to delete knowledge entry' },
      { status: 500 }
    )
  }
}
