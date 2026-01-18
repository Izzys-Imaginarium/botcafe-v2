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
      // User not synced to Payload yet - return empty bots instead of error
      return NextResponse.json({
        bots: [],
        total: 0,
      })
    }

    const payloadUser = payloadUsers.docs[0]

    // Fetch all bots created by this user, including creator profile
    const ownedBotsResult = await payload.find({
      collection: 'bot',
      where: {
        user: { equals: payloadUser.id },
      },
      sort: '-created_date',
      limit: 100,
      depth: 1,
      overrideAccess: true,
    })

    // Fetch bots shared with this user via AccessControl
    const sharedAccessResult = await payload.find({
      collection: 'access-control',
      where: {
        and: [
          { user: { equals: payloadUser.id } },
          { resource_type: { equals: 'bot' } },
          { is_revoked: { equals: false } },
        ],
      },
      limit: 100,
      overrideAccess: true,
    })

    // Get the bot IDs that are shared with this user
    const sharedBotIds = sharedAccessResult.docs
      .map((ac: any) => ac.resource_id)
      .filter((id: string) => id)

    // Fetch the shared bots
    let sharedBots: any[] = []
    if (sharedBotIds.length > 0) {
      // Parse IDs to numbers for the query
      const numericIds = sharedBotIds
        .map((id: string) => parseInt(id, 10))
        .filter((id: number) => !isNaN(id))

      if (numericIds.length > 0) {
        const sharedBotsResult = await payload.find({
          collection: 'bot',
          where: {
            id: { in: numericIds },
          },
          depth: 1,
          overrideAccess: true,
        })
        sharedBots = sharedBotsResult.docs
      }
    }

    // Create a map to track permission level for shared bots
    const sharedBotPermissions = new Map<string, string>()
    sharedAccessResult.docs.forEach((ac: any) => {
      const existing = sharedBotPermissions.get(ac.resource_id)
      // Keep the highest permission level
      if (!existing ||
          (ac.permission_type === 'admin') ||
          (ac.permission_type === 'write' && existing === 'read')) {
        sharedBotPermissions.set(ac.resource_id, ac.permission_type)
      }
    })

    // Transform owned bots
    const ownedBotsWithMeta = ownedBotsResult.docs.map((bot: any) => {
      const creatorProfile = bot.creator_profile
      return {
        ...bot,
        creator_username: typeof creatorProfile === 'object' ? creatorProfile.username : null,
        access_level: 'owner',
        is_shared_with_me: false,
      }
    })

    // Transform shared bots
    const sharedBotsWithMeta = sharedBots.map((bot: any) => {
      const creatorProfile = bot.creator_profile
      const permissionType = sharedBotPermissions.get(String(bot.id))
      let accessLevel = 'readonly'
      if (permissionType === 'admin') accessLevel = 'owner'
      else if (permissionType === 'write') accessLevel = 'editor'

      return {
        ...bot,
        creator_username: typeof creatorProfile === 'object' ? creatorProfile.username : null,
        access_level: accessLevel,
        is_shared_with_me: true,
      }
    })

    // Combine and deduplicate (in case a user owns a bot that was also shared with them)
    const allBots = [...ownedBotsWithMeta]
    const ownedBotIds = new Set(ownedBotsResult.docs.map((bot: any) => String(bot.id)))
    sharedBotsWithMeta.forEach(bot => {
      if (!ownedBotIds.has(String(bot.id))) {
        allBots.push(bot)
      }
    })

    return NextResponse.json({
      bots: allBots,
      total: allBots.length,
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
