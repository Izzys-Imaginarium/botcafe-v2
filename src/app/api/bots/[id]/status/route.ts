import { NextRequest, NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import { currentUser } from '@clerk/nextjs/server'
import config from '@payload-config'
import { checkResourceAccess } from '@/lib/permissions/check-access'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: botId } = await params

    if (!botId) {
      return NextResponse.json({ message: 'Bot ID is required' }, { status: 400 })
    }

    // Get the current Clerk user
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return NextResponse.json({
        liked: false,
        favorited: false,
        permission: null,
      })
    }

    const payload = await getPayloadHMR({ config })

    // Find the Payload user by email
    const payloadUsers = await payload.find({
      collection: 'users',
      where: {
        email: { equals: clerkUser.emailAddresses[0]?.emailAddress },
      },
      limit: 1,
    })

    if (payloadUsers.docs.length === 0) {
      return NextResponse.json({
        liked: false,
        favorited: false,
        permission: null,
      })
    }

    const payloadUser = payloadUsers.docs[0]

    // Check user's permission level for this bot
    const accessResult = await checkResourceAccess(payload, payloadUser.id, 'bot', botId)

    // Check if interaction exists
    const interaction = await payload.find({
      collection: 'botInteractions' as any,
      where: {
        and: [{ user: { equals: payloadUser.id } }, { bot: { equals: botId } }],
      },
      limit: 1,
    })

    if (interaction.docs.length === 0) {
      return NextResponse.json({
        liked: false,
        favorited: false,
        permission: accessResult.permission,
      })
    }

    const interactionData = interaction.docs[0]

    return NextResponse.json({
      liked: interactionData.liked || false,
      favorited: interactionData.favorited || false,
      permission: accessResult.permission,
    })
  } catch (error: any) {
    console.error('Error fetching interaction status:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to fetch interaction status' },
      { status: 500 }
    )
  }
}
