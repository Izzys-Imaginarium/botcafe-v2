import { NextRequest, NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import { currentUser } from '@clerk/nextjs/server'
import config from '@payload-config'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
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
    })

    if (payloadUsers.docs.length === 0) {
      return NextResponse.json({ message: 'User not synced yet. Please try again.' }, { status: 404 })
    }

    const payloadUser = payloadUsers.docs[0]

    // Fetch the bot to verify ownership
    const bot = await payload.findByID({
      collection: 'bot',
      id,
    })

    if (!bot) {
      return NextResponse.json({ message: 'Bot not found' }, { status: 404 })
    }

    // Check if the current user is the owner of the bot
    const botUserId = typeof bot.user === 'object' ? bot.user.id : bot.user
    if (botUserId !== payloadUser.id) {
      return NextResponse.json(
        { message: 'You do not have permission to delete this bot' },
        { status: 403 }
      )
    }

    // Delete the bot
    // Note: This only deletes the bot. Related collections (knowledge, conversations, etc.)
    // are not affected as per the requirement
    await payload.delete({
      collection: 'bot',
      id,
    })

    return NextResponse.json({
      message: 'Bot deleted successfully',
      id,
    })
  } catch (error: any) {
    console.error('Error deleting bot:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to delete bot' },
      { status: 500 }
    )
  }
}
