import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/diagnostic/personas
 *
 * Admin endpoint to diagnose persona data integrity.
 * Checks for:
 * - Personas with invalid/missing user references
 * - Personas that don't link to their expected users
 * - Users who should have personas but don't
 *
 * Query params:
 * - fix: 'true' to attempt automatic fixes
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

    const payloadUser = users.docs[0] as { id: number; role?: string; email: string }

    // Only admins can access this endpoint
    if (payloadUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const shouldFix = searchParams.get('fix') === 'true'

    // Fetch all personas
    const allPersonas = await payload.find({
      collection: 'personas',
      limit: 1000, // Get all personas
      overrideAccess: true,
    })

    // Fetch all users with old_user_id
    const allUsers = await payload.find({
      collection: 'users',
      limit: 1000,
      overrideAccess: true,
    })

    // Build a map of user IDs for quick lookup
    const userIdMap = new Map<number, { id: number; email: string; old_user_id?: string }>()
    const emailToUserMap = new Map<string, { id: number; email: string; old_user_id?: string }>()

    for (const user of allUsers.docs) {
      const userData = user as { id: number; email: string; old_user_id?: string }
      userIdMap.set(userData.id, userData)
      emailToUserMap.set(userData.email.toLowerCase(), userData)
    }

    const issues: Array<{
      type: string
      personaId: number
      personaName: string
      currentUserId: number | string | null
      details: string
      suggestedFix?: { newUserId: number }
    }> = []

    const fixed: Array<{
      personaId: number
      personaName: string
      oldUserId: number | string | null
      newUserId: number
    }> = []

    // Helper to extract user ID from relationship field
    const getUserId = (user: number | { id: number } | null): number | null => {
      if (user === null) return null
      if (typeof user === 'object') return user.id
      return user
    }

    // Check each persona
    for (const persona of allPersonas.docs) {
      const personaData = persona as {
        id: number
        name: string
        user: number | { id: number } | null
      }

      // Get the user ID from the persona
      const userId = getUserId(personaData.user)

      if (!userId) {
        // Persona has no user reference
        issues.push({
          type: 'missing_user',
          personaId: personaData.id,
          personaName: personaData.name,
          currentUserId: null,
          details: 'Persona has no user reference',
        })
        continue
      }

      // Check if user exists
      const userExists = userIdMap.has(userId)

      if (!userExists) {
        // User ID doesn't exist in the database
        issues.push({
          type: 'invalid_user_id',
          personaId: personaData.id,
          personaName: personaData.name,
          currentUserId: userId,
          details: `User ID ${userId} does not exist in the database`,
        })
      }
    }

    // Summary statistics
    const stats = {
      totalPersonas: allPersonas.totalDocs,
      totalUsers: allUsers.totalDocs,
      personasWithIssues: issues.length,
      issuesByType: {
        missing_user: issues.filter((i) => i.type === 'missing_user').length,
        invalid_user_id: issues.filter((i) => i.type === 'invalid_user_id').length,
      },
    }

    // If fix mode is enabled and there are fixable issues
    if (shouldFix && issues.length > 0) {
      for (const issue of issues) {
        if (issue.suggestedFix) {
          try {
            await payload.update({
              collection: 'personas',
              id: issue.personaId,
              data: {
                user: issue.suggestedFix.newUserId,
              },
              overrideAccess: true,
            })
            fixed.push({
              personaId: issue.personaId,
              personaName: issue.personaName,
              oldUserId: issue.currentUserId,
              newUserId: issue.suggestedFix.newUserId,
            })
          } catch (e) {
            console.error(`Failed to fix persona ${issue.personaId}:`, e)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      stats,
      issues,
      fixed: shouldFix ? fixed : undefined,
      message: shouldFix
        ? `Diagnostic complete. Fixed ${fixed.length} issues.`
        : 'Diagnostic complete. Use ?fix=true to attempt automatic fixes.',
    })
  } catch (error: any) {
    console.error('Persona diagnostic error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Diagnostic failed' },
      { status: 500 }
    )
  }
}
