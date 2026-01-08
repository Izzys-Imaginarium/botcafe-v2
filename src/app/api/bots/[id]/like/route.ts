import { NextRequest, NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import { currentUser } from '@clerk/nextjs/server'
import config from '@payload-config'

export async function POST(
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
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const payload = await getPayloadHMR({ config })

    // Find the Payload user by email
    const payloadUsers = await payload.find({
      collection: 'users',
      where: {
        email: { equals: clerkUser.emailAddresses[0]?.emailAddress },
      },
      limit: 1,
      overrideAccess: true,
    })

    if (payloadUsers.docs.length === 0) {
      return NextResponse.json({ message: 'User not synced yet. Please try again.' }, { status: 404 })
    }

    const payloadUser = payloadUsers.docs[0]

    // Check if interaction already exists
    const existingInteraction = await payload.find({
      collection: 'botInteractions' as any,
      where: {
        and: [{ user: { equals: payloadUser.id } }, { bot: { equals: botId } }],
      },
      limit: 1,
      overrideAccess: true,
    })

    let liked = false
    let interaction

    if (existingInteraction.docs.length > 0) {
      // Toggle like status
      interaction = existingInteraction.docs[0]
      liked = !interaction.liked

      await payload.update({
        collection: 'botInteractions' as any,
        id: interaction.id,
        data: {
          liked,
          updated_date: new Date().toISOString(),
        },
        overrideAccess: true,
      })
    } else {
      // Create new interaction with like
      liked = true
      interaction = await payload.create({
        collection: 'botInteractions' as any,
        data: {
          user: payloadUser.id,
          bot: parseInt(botId, 10),
          liked: true,
          favorited: false,
        },
        overrideAccess: true,
      })
    }

    // Update bot likes count
    const bot = await payload.findByID({
      collection: 'bot',
      id: botId,
      overrideAccess: true,
    })

    const newLikesCount = Math.max(0, (bot.likes_count || 0) + (liked ? 1 : -1))

    await payload.update({
      collection: 'bot',
      id: botId,
      data: {
        likes_count: newLikesCount,
      },
      overrideAccess: true,
    })

    return NextResponse.json({
      liked,
      likes_count: newLikesCount,
    })
  } catch (error: any) {
    console.error('Error toggling like:', error)
    return NextResponse.json({ message: error.message || 'Failed to toggle like' }, { status: 500 })
  }
}
