import { NextRequest, NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import config from '@payload-config'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string; botSlug: string }> }
) {
  try {
    const { username, botSlug } = await params

    if (!username || !botSlug) {
      return NextResponse.json(
        { message: 'Username and bot slug are required' },
        { status: 400 }
      )
    }

    const payload = await getPayloadHMR({ config })

    // First, find the creator profile by username
    const creatorProfiles = await payload.find({
      collection: 'creatorProfiles',
      where: {
        username: { equals: username.toLowerCase() },
      },
      limit: 1,
      overrideAccess: true,
    })

    if (creatorProfiles.docs.length === 0) {
      return NextResponse.json(
        { message: 'Creator not found' },
        { status: 404 }
      )
    }

    const creatorProfile = creatorProfiles.docs[0]

    // Find the bot by slug within this creator's bots
    const bots = await payload.find({
      collection: 'bot',
      where: {
        and: [
          {
            creator_profile: { equals: creatorProfile.id },
          },
          {
            slug: { equals: botSlug.toLowerCase() },
          },
        ],
      },
      limit: 1,
      depth: 1, // Include related data like picture
      overrideAccess: true,
    })

    if (bots.docs.length === 0) {
      return NextResponse.json(
        { message: 'Bot not found' },
        { status: 404 }
      )
    }

    const bot = bots.docs[0]

    // For legacy bots, ensure creator_display_name has a value
    const botData = {
      ...bot,
      // Fallback for legacy bots missing creator_display_name
      creator_display_name: (bot as any).creator_display_name || creatorProfile.display_name || username,
    }

    // Return bot data with creator info
    return NextResponse.json({
      ...botData,
      creator_username: creatorProfile.username,
      creator_profile_data: {
        id: creatorProfile.id,
        username: creatorProfile.username,
        display_name: creatorProfile.display_name,
        avatar: creatorProfile.profile_media?.avatar,
      },
    })
  } catch (error: any) {
    console.error('Error fetching bot by path:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to fetch bot' },
      { status: 500 }
    )
  }
}
