import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

// Helper to extract ID from relationship field
function getRelationId(field: number | { id: number } | null | undefined): number | null {
  if (field === null || field === undefined) return null
  if (typeof field === 'object') return field.id
  return field
}

interface OldUserData {
  old_id: string
  username: string
  first_name: string
  last_name: string
  email: string
  knowledge_collections: Array<{
    old_id: string
    name: string
    description: string
    type: string
    is_public: boolean
    created_at: string
  }>
  bots: Array<{
    old_id: string
    name: string
    slug: string
    is_public: boolean
  }>
  personas?: Array<{
    name: string
    description: string
  }>
}

/**
 * GET /api/admin/migration/compare
 *
 * Compare migration data from old database with current database state.
 * Identifies missing data, broken relationships, and synchronization issues.
 *
 * Query params:
 * - email: Only compare data for a specific user email
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
    const filterEmail = searchParams.get('email')

    // Load migration data
    const migrationDataPath = path.join(process.cwd(), 'migration-data', 'migration_data_complete.json')
    const userIdMappingPath = path.join(process.cwd(), 'migration-data', 'user_id_mapping.json')
    const collectionIdMappingPath = path.join(process.cwd(), 'migration-data', 'collection_id_mapping.json')
    const botIdMappingPath = path.join(process.cwd(), 'migration-data', 'bot_id_mapping.json')

    let migrationData: Record<string, OldUserData> = {}
    let userIdMapping: Record<string, number> = {}
    let collectionIdMapping: Record<string, number> = {}
    let botIdMapping: Record<string, number> = {}

    try {
      migrationData = JSON.parse(fs.readFileSync(migrationDataPath, 'utf-8'))
      userIdMapping = JSON.parse(fs.readFileSync(userIdMappingPath, 'utf-8'))
      collectionIdMapping = JSON.parse(fs.readFileSync(collectionIdMappingPath, 'utf-8'))
      botIdMapping = JSON.parse(fs.readFileSync(botIdMappingPath, 'utf-8'))
    } catch (readError: any) {
      return NextResponse.json(
        { success: false, message: `Failed to read migration data: ${readError.message}` },
        { status: 500 }
      )
    }

    // Filter to specific email if provided
    const emailsToCheck = filterEmail
      ? [filterEmail]
      : Object.keys(migrationData)

    // Fetch current database state
    const allUsers = await payload.find({
      collection: 'users',
      limit: 1000,
      overrideAccess: true,
    })

    const allCollections = await payload.find({
      collection: 'knowledgeCollections',
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    })

    const allBots = await payload.find({
      collection: 'bot',
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    })

    const allCreatorProfiles = await payload.find({
      collection: 'creatorProfiles',
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    })

    // Build lookup maps for current state
    const currentUsersByEmail = new Map<string, { id: number; email: string }>()
    for (const user of allUsers.docs) {
      const u = user as { id: number; email: string }
      currentUsersByEmail.set(u.email.toLowerCase(), u)
    }

    const currentCollectionsById = new Map<number, { id: number; name: string; user: number | null }>()
    for (const col of allCollections.docs) {
      const c = col as { id: number; name: string; user: number | { id: number } | null }
      currentCollectionsById.set(c.id, {
        id: c.id,
        name: c.name,
        user: getRelationId(c.user),
      })
    }

    const currentBotsById = new Map<number, { id: number; name: string; user: number | null; creator_profile: number | null }>()
    for (const bot of allBots.docs) {
      const b = bot as { id: number; name: string; user: number | { id: number } | null; creator_profile: number | { id: number } | null }
      currentBotsById.set(b.id, {
        id: b.id,
        name: b.name,
        user: getRelationId(b.user),
        creator_profile: getRelationId(b.creator_profile),
      })
    }

    const userIdToCreatorProfile = new Map<number, { id: number; username: string }>()
    for (const cp of allCreatorProfiles.docs) {
      const profile = cp as { id: number; username: string; user: number | { id: number } }
      const userId = getRelationId(profile.user)
      if (userId) {
        userIdToCreatorProfile.set(userId, { id: profile.id, username: profile.username })
      }
    }

    // Compare data
    const comparison: Array<{
      email: string
      oldUserId: string
      newUserId: number | null
      username: string
      issues: string[]
      collections: {
        expected: number
        found: number
        missing: string[]
        orphaned: string[]
      }
      bots: {
        expected: number
        found: number
        missing: string[]
        missingCreatorProfile: string[]
      }
      hasCreatorProfile: boolean
    }> = []

    for (const email of emailsToCheck) {
      const oldData = migrationData[email]
      if (!oldData) continue

      const newUserId = userIdMapping[oldData.old_id]
      const currentUser = currentUsersByEmail.get(email.toLowerCase())

      const issues: string[] = []
      const missingCollections: string[] = []
      const orphanedCollections: string[] = []
      const missingBots: string[] = []
      const botsWithoutCreatorProfile: string[] = []

      // Check user exists
      if (!currentUser) {
        issues.push('User not found in new database')
      } else if (currentUser.id !== newUserId) {
        issues.push(`User ID mismatch: expected ${newUserId}, got ${currentUser.id}`)
      }

      // Check collections
      const expectedCollections = oldData.knowledge_collections || []
      let foundCollectionsCount = 0

      for (const oldCol of expectedCollections) {
        const newColId = collectionIdMapping[oldCol.old_id]
        if (!newColId) {
          missingCollections.push(`${oldCol.name} (${oldCol.type}) - no mapping`)
          continue
        }

        const currentCol = currentCollectionsById.get(newColId)
        if (!currentCol) {
          missingCollections.push(`${oldCol.name} (${oldCol.type}) - ID ${newColId} not found`)
        } else {
          foundCollectionsCount++
          if (currentCol.user !== newUserId) {
            orphanedCollections.push(`${oldCol.name} - wrong user (${currentCol.user} != ${newUserId})`)
          }
        }
      }

      // Check bots
      const expectedBots = oldData.bots || []
      let foundBotsCount = 0

      for (const oldBot of expectedBots) {
        const newBotId = botIdMapping[oldBot.old_id]
        if (!newBotId) {
          missingBots.push(`${oldBot.name} - no mapping`)
          continue
        }

        const currentBot = currentBotsById.get(newBotId)
        if (!currentBot) {
          missingBots.push(`${oldBot.name} - ID ${newBotId} not found`)
        } else {
          foundBotsCount++
          if (!currentBot.creator_profile) {
            botsWithoutCreatorProfile.push(`${oldBot.name} (ID: ${newBotId})`)
          }
        }
      }

      // Check creator profile
      const hasCreatorProfile = currentUser ? userIdToCreatorProfile.has(currentUser.id) : false
      if (currentUser && !hasCreatorProfile && expectedBots.length > 0) {
        issues.push('User has bots but no creator profile')
      }

      if (issues.length > 0 || missingCollections.length > 0 || missingBots.length > 0 || botsWithoutCreatorProfile.length > 0) {
        comparison.push({
          email,
          oldUserId: oldData.old_id,
          newUserId: newUserId || null,
          username: oldData.username,
          issues,
          collections: {
            expected: expectedCollections.length,
            found: foundCollectionsCount,
            missing: missingCollections,
            orphaned: orphanedCollections,
          },
          bots: {
            expected: expectedBots.length,
            found: foundBotsCount,
            missing: missingBots,
            missingCreatorProfile: botsWithoutCreatorProfile,
          },
          hasCreatorProfile,
        })
      }
    }

    // Summary
    const summary = {
      totalUsersChecked: emailsToCheck.length,
      usersWithIssues: comparison.length,
      totalMissingCollections: comparison.reduce((sum, c) => sum + c.collections.missing.length, 0),
      totalMissingBots: comparison.reduce((sum, c) => sum + c.bots.missing.length, 0),
      totalBotsWithoutCreatorProfile: comparison.reduce((sum, c) => sum + c.bots.missingCreatorProfile.length, 0),
    }

    return NextResponse.json({
      success: true,
      summary,
      comparison: comparison.slice(0, 50), // Limit output
      message: comparison.length > 50
        ? `Showing first 50 of ${comparison.length} users with issues`
        : 'Comparison complete',
    })
  } catch (error: any) {
    console.error('Migration comparison error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Comparison failed' },
      { status: 500 }
    )
  }
}
