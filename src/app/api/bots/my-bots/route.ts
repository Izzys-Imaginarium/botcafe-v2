import { NextRequest, NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import { currentUser } from '@clerk/nextjs/server'
import config from '@payload-config'

export async function GET(request: NextRequest) {
  try {
    // Get the current Clerk user
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Get Payload instance with error handling
    let payload
    try {
      payload = await getPayloadHMR({ config })
    } catch (dbError) {
      console.error('Database connection error:', dbError)
      // Return empty results if database is not available
      return NextResponse.json({
        bots: [],
        total: 0,
      })
    }

    // Find the Payload user by Clerk ID
    const payloadUsers = await payload.find({
      collection: 'users',
      where: {
        clerkId: { equals: clerkUser.id },
      },
      limit: 1,
    })

    if (payloadUsers.docs.length === 0) {
      // User not synced to Payload yet - return empty bots instead of error
      return NextResponse.json({
        bots: [],
        total: 0,
      })
    }

    const payloadUser = payloadUsers.docs[0]

    // Fetch all bots created by this user
    const result = await payload.find({
      collection: 'bot',
      where: {
        user: { equals: payloadUser.id },
      },
      sort: '-created_date',
      limit: 100, // Limit to 100 bots for now
    })

    return NextResponse.json({
      bots: result.docs,
      total: result.totalDocs,
    })
  } catch (error: any) {
    console.error('Error fetching user bots:', error)
    // Return empty results instead of 500 error for better UX
    return NextResponse.json({
      bots: [],
      total: 0,
    })
  }
}
