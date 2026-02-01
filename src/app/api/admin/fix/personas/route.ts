import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/fix/personas
 *
 * Admin endpoint to analyze persona-user relationships and find orphaned personas.
 *
 * This endpoint:
 * 1. Finds all personas with invalid user references
 * 2. Reports orphaned personas that need manual fixing
 *
 * Query params:
 * - userId: Only check personas for a specific user ID
 *
 * Use POST to manually fix individual personas.
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

    // Find current user in Payload and verify admin
    const currentUsers = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: clerkUser.emailAddresses[0]?.emailAddress,
        },
      },
      overrideAccess: true,
    })

    if (currentUsers.docs.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found in database' },
        { status: 404 }
      )
    }

    const currentPayloadUser = currentUsers.docs[0] as { id: number; role?: string }

    // Only admins can access this endpoint
    if (currentPayloadUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const filterUserId = searchParams.get('userId')

    // Fetch all users to build lookup maps
    const allUsers = await payload.find({
      collection: 'users',
      limit: 1000,
      overrideAccess: true,
    })

    // Build map of valid user IDs for quick lookup
    const userIdSet = new Set<number>()
    for (const user of allUsers.docs) {
      userIdSet.add((user as { id: number }).id)
    }

    // Note: The migration was designed so that Payload user IDs match what personas expect.
    // If a persona references a user_id that doesn't exist, it's truly orphaned.

    // Fetch personas
    let personaQuery: any = {}
    if (filterUserId) {
      personaQuery.user = { equals: parseInt(filterUserId, 10) }
    }

    const allPersonas = await payload.find({
      collection: 'personas',
      where: Object.keys(personaQuery).length > 0 ? personaQuery : undefined,
      limit: 1000,
      overrideAccess: true,
    })

    const analysis: Array<{
      personaId: number
      personaName: string
      currentUserId: number | null
      status: 'valid' | 'orphaned' | 'fixable'
      suggestedUserId?: number
      suggestedUserEmail?: string
      reason?: string
    }> = []

    // Analyze each persona
    for (const persona of allPersonas.docs) {
      const personaData = persona as {
        id: number
        name: string
        user: number | { id: number } | null
      }

      const userId =
        typeof personaData.user === 'object' && personaData.user !== null
          ? personaData.user.id
          : personaData.user

      // Check if user exists
      if (!userId) {
        analysis.push({
          personaId: personaData.id,
          personaName: personaData.name,
          currentUserId: null,
          status: 'orphaned',
          reason: 'No user reference',
        })
        continue
      }

      const userExists = userIdSet.has(userId as number)

      if (userExists) {
        // User exists, persona is valid
        analysis.push({
          personaId: personaData.id,
          personaName: personaData.name,
          currentUserId: userId as number,
          status: 'valid',
        })
        continue
      }

      // User doesn't exist - this persona is orphaned
      // The migration was supposed to create users with matching IDs,
      // so if the user doesn't exist, it's a data integrity issue
      analysis.push({
        personaId: personaData.id,
        personaName: personaData.name,
        currentUserId: userId as number,
        status: 'orphaned',
        reason: `User ID ${userId} does not exist in the database`,
      })
    }

    // Summary
    const summary = {
      totalPersonas: allPersonas.totalDocs,
      valid: analysis.filter((a) => a.status === 'valid').length,
      orphaned: analysis.filter((a) => a.status === 'orphaned').length,
    }

    return NextResponse.json({
      success: true,
      summary,
      orphanedPersonas: analysis.filter((a) => a.status !== 'valid'), // Only show issues
      message: 'Analysis complete. Use POST /api/admin/fix/personas to manually fix orphaned personas.',
    })
  } catch (error: any) {
    console.error('Persona fix error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Fix operation failed' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/fix/personas
 *
 * Manually fix a specific persona's user reference.
 *
 * Body:
 * - personaId: number
 * - newUserId: number
 */
export async function POST(request: NextRequest) {
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

    // Find current user in Payload and verify admin
    const currentUsers = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: clerkUser.emailAddresses[0]?.emailAddress,
        },
      },
      overrideAccess: true,
    })

    if (currentUsers.docs.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found in database' },
        { status: 404 }
      )
    }

    const currentPayloadUser = currentUsers.docs[0] as { id: number; role?: string }

    // Only admins can access this endpoint
    if (currentPayloadUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get body
    const body = (await request.json()) as {
      personaId: number
      newUserId: number
    }

    if (!body.personaId || !body.newUserId) {
      return NextResponse.json(
        { success: false, message: 'personaId and newUserId are required' },
        { status: 400 }
      )
    }

    // Verify the target user exists
    const targetUser = await payload.findByID({
      collection: 'users',
      id: body.newUserId,
      overrideAccess: true,
    })

    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: `User ID ${body.newUserId} does not exist` },
        { status: 404 }
      )
    }

    // Update the persona
    const updatedPersona = await payload.update({
      collection: 'personas',
      id: body.personaId,
      data: {
        user: body.newUserId,
      },
      overrideAccess: true,
    })

    return NextResponse.json({
      success: true,
      message: `Persona ${body.personaId} updated to user ${body.newUserId}`,
      persona: {
        id: updatedPersona.id,
        name: (updatedPersona as any).name,
        user: body.newUserId,
      },
    })
  } catch (error: any) {
    console.error('Manual persona fix error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Fix operation failed' },
      { status: 500 }
    )
  }
}
