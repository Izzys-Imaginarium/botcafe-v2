import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

// Helper to extract ID from relationship field
function getRelationId(field: number | { id: number } | null | undefined): number | null {
  if (field === null || field === undefined) return null
  if (typeof field === 'object') return field.id
  return field
}

/**
 * GET /api/admin/diagnostic/lookup
 *
 * Look up specific bots, users, or creator profiles to investigate data issues.
 *
 * Query params:
 * - botName: Search for bots by name (partial match)
 * - username: Search for creator profile by username
 * - botSlug: Search for bot by exact slug
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get Payload instance
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Find user in Payload and verify admin
    const users = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: clerkUser.emailAddresses[0]?.emailAddress,
        },
      },
      overrideAccess: true,
    })

    if (users.docs.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found in database' },
        { status: 404 }
      )
    }

    const payloadUser = users.docs[0] as { id: number; role?: string }

    // Only admins can access this endpoint
    if (payloadUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const botName = searchParams.get('botName')
    const username = searchParams.get('username')
    const botSlug = searchParams.get('botSlug')

    const results: {
      creatorProfiles: any[]
      bots: any[]
      users: any[]
      analysis: string[]
    } = {
      creatorProfiles: [],
      bots: [],
      users: [],
      analysis: [],
    }

    // Look up creator profile by username
    if (username) {
      const profiles = await payload.find({
        collection: 'creatorProfiles',
        where: {
          username: {
            contains: username.toLowerCase(),
          },
        },
        depth: 1,
        overrideAccess: true,
      })

      for (const profile of profiles.docs) {
        const p = profile as any
        const userId = getRelationId(p.user)

        // Get the user's email
        let userEmail = null
        if (userId) {
          const userResult = await payload.find({
            collection: 'users',
            where: { id: { equals: userId } },
            overrideAccess: true,
          })
          if (userResult.docs.length > 0) {
            userEmail = (userResult.docs[0] as any).email
          }
        }

        results.creatorProfiles.push({
          id: p.id,
          username: p.username,
          userId: userId,
          userEmail: userEmail,
          displayName: p.display_name,
          createdAt: p.createdAt,
        })
      }

      if (results.creatorProfiles.length === 0) {
        results.analysis.push(`No creator profile found with username containing "${username}"`)
      } else {
        results.analysis.push(`Found ${results.creatorProfiles.length} creator profile(s) matching "${username}"`)
      }
    }

    // Look up bots by name
    if (botName) {
      const bots = await payload.find({
        collection: 'bot',
        where: {
          name: {
            contains: botName,
          },
        },
        depth: 1,
        overrideAccess: true,
      })

      for (const bot of bots.docs) {
        const b = bot as any
        const userId = getRelationId(b.user)
        const creatorProfileId = getRelationId(b.creator_profile)

        // Get creator profile details
        let creatorUsername = null
        let creatorProfileExists = false
        if (creatorProfileId) {
          const cpResult = await payload.find({
            collection: 'creatorProfiles',
            where: { id: { equals: creatorProfileId } },
            overrideAccess: true,
          })
          if (cpResult.docs.length > 0) {
            creatorProfileExists = true
            creatorUsername = (cpResult.docs[0] as any).username
          }
        }

        // Get user email
        let userEmail = null
        if (userId) {
          const userResult = await payload.find({
            collection: 'users',
            where: { id: { equals: userId } },
            overrideAccess: true,
          })
          if (userResult.docs.length > 0) {
            userEmail = (userResult.docs[0] as any).email
          }
        }

        const expectedUrl = creatorUsername && b.slug
          ? `/${creatorUsername}/${b.slug}`
          : null

        results.bots.push({
          id: b.id,
          name: b.name,
          slug: b.slug,
          userId: userId,
          userEmail: userEmail,
          creatorProfileId: creatorProfileId,
          creatorProfileExists: creatorProfileExists,
          creatorUsername: creatorUsername,
          creatorDisplayName: b.creator_display_name,
          expectedUrl: expectedUrl,
          isPublic: b.is_public,
          createdAt: b.createdAt,
        })
      }

      if (results.bots.length === 0) {
        results.analysis.push(`No bot found with name containing "${botName}"`)
      } else {
        results.analysis.push(`Found ${results.bots.length} bot(s) matching "${botName}"`)
      }
    }

    // Look up bot by exact slug
    if (botSlug) {
      const bots = await payload.find({
        collection: 'bot',
        where: {
          slug: {
            equals: botSlug,
          },
        },
        depth: 1,
        overrideAccess: true,
      })

      for (const bot of bots.docs) {
        const b = bot as any
        const userId = getRelationId(b.user)
        const creatorProfileId = getRelationId(b.creator_profile)

        // Get creator profile details
        let creatorUsername = null
        let creatorProfileExists = false
        if (creatorProfileId) {
          const cpResult = await payload.find({
            collection: 'creatorProfiles',
            where: { id: { equals: creatorProfileId } },
            overrideAccess: true,
          })
          if (cpResult.docs.length > 0) {
            creatorProfileExists = true
            creatorUsername = (cpResult.docs[0] as any).username
          }
        }

        // Get user email
        let userEmail = null
        if (userId) {
          const userResult = await payload.find({
            collection: 'users',
            where: { id: { equals: userId } },
            overrideAccess: true,
          })
          if (userResult.docs.length > 0) {
            userEmail = (userResult.docs[0] as any).email
          }
        }

        const expectedUrl = creatorUsername && b.slug
          ? `/${creatorUsername}/${b.slug}`
          : null

        // Check if this bot already exists in results (from name search)
        if (!results.bots.find((existing) => existing.id === b.id)) {
          results.bots.push({
            id: b.id,
            name: b.name,
            slug: b.slug,
            userId: userId,
            userEmail: userEmail,
            creatorProfileId: creatorProfileId,
            creatorProfileExists: creatorProfileExists,
            creatorUsername: creatorUsername,
            creatorDisplayName: b.creator_display_name,
            expectedUrl: expectedUrl,
            isPublic: b.is_public,
            createdAt: b.createdAt,
          })
        }
      }

      if (bots.docs.length === 0) {
        results.analysis.push(`No bot found with exact slug "${botSlug}"`)
      } else {
        results.analysis.push(`Found ${bots.docs.length} bot(s) with slug "${botSlug}"`)
      }
    }

    // Cross-reference analysis
    if (username && botName) {
      // Check if the bot belongs to the creator profile
      for (const bot of results.bots) {
        const matchingProfile = results.creatorProfiles.find(
          (p) => p.id === bot.creatorProfileId
        )
        if (matchingProfile) {
          results.analysis.push(
            `✓ Bot "${bot.name}" is linked to creator profile "${matchingProfile.username}" (ID: ${matchingProfile.id})`
          )
          results.analysis.push(
            `  Expected URL: ${bot.expectedUrl}`
          )
        } else if (bot.creatorProfileId) {
          results.analysis.push(
            `⚠ Bot "${bot.name}" has creator_profile ID ${bot.creatorProfileId} but it doesn't match searched username "${username}"`
          )
        } else {
          results.analysis.push(
            `✗ Bot "${bot.name}" has NO creator_profile linked!`
          )
        }
      }

      // Check if there are bots owned by the creator that weren't found by name
      for (const profile of results.creatorProfiles) {
        const profileBots = await payload.find({
          collection: 'bot',
          where: {
            creator_profile: {
              equals: profile.id,
            },
          },
          depth: 0,
          overrideAccess: true,
        })

        results.analysis.push(
          `Creator "${profile.username}" has ${profileBots.totalDocs} total bots`
        )

        // List all bot names/slugs for this creator
        const botList = profileBots.docs.map((b: any) => `${b.name} (/${profile.username}/${b.slug})`).join(', ')
        if (botList) {
          results.analysis.push(`  Bots: ${botList}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
    })
  } catch (error: any) {
    console.error('Lookup diagnostic error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Lookup failed' },
      { status: 500 }
    )
  }
}
