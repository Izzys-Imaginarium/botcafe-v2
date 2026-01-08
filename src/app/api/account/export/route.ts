import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

/**
 * GET /api/account/export
 *
 * Export all user data as JSON for GDPR compliance and data portability.
 * Includes: bots, conversations, personas, memories, knowledge entries.
 *
 * Response:
 * - JSON file download with all user data
 */
export async function GET() {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Find the Payload user
    const users = await payload.find({
      collection: 'users',
      where: {
        clerkUserId: { equals: clerkUser.id },
      },
      overrideAccess: true,
    })

    if (users.docs.length === 0) {
      // No data to export
      const exportData = {
        exportedAt: new Date().toISOString(),
        user: {
          email: clerkUser.emailAddresses[0]?.emailAddress,
          username: clerkUser.username,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
        },
        bots: [] as unknown[],
        conversations: [] as unknown[],
        personas: [] as unknown[],
        memories: [] as unknown[],
        knowledge: [] as unknown[],
        creatorProfile: null as unknown,
      }

      return new NextResponse(JSON.stringify(exportData, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="botcafe-export-${new Date().toISOString().split('T')[0]}.json"`,
        },
      })
    }

    const payloadUser = users.docs[0]

    // Fetch all user data in parallel
    const [bots, conversations, personas, memories, knowledge, creatorProfiles] = await Promise.all(
      [
        payload.find({
          collection: 'bot',
          where: { createdBy: { equals: payloadUser.id } },
          limit: 1000,
          depth: 1,
          overrideAccess: true,
        }),
        payload.find({
          collection: 'conversation',
          where: { user: { equals: payloadUser.id } },
          limit: 1000,
          depth: 1,
          overrideAccess: true,
        }),
        payload.find({
          collection: 'personas',
          where: { user: { equals: payloadUser.id } },
          limit: 1000,
          depth: 1,
          overrideAccess: true,
        }),
        payload.find({
          collection: 'memory',
          where: { user: { equals: payloadUser.id } },
          limit: 1000,
          depth: 1,
          overrideAccess: true,
        }),
        payload.find({
          collection: 'knowledge',
          where: { createdBy: { equals: payloadUser.id } },
          limit: 1000,
          depth: 1,
          overrideAccess: true,
        }),
        payload.find({
          collection: 'creatorProfiles',
          where: { user: { equals: payloadUser.id } },
          limit: 1,
          depth: 1,
          overrideAccess: true,
        }),
      ]
    )

    // Sanitize data to remove internal fields
    const sanitizeDoc = (doc: any) => {
      const { _status, ...rest } = doc
      return rest
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        email: clerkUser.emailAddresses[0]?.emailAddress,
        username: clerkUser.username,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
      },
      bots: bots.docs.map(sanitizeDoc),
      conversations: conversations.docs.map(sanitizeDoc),
      personas: personas.docs.map(sanitizeDoc),
      memories: memories.docs.map(sanitizeDoc),
      knowledge: knowledge.docs.map(sanitizeDoc),
      creatorProfile: creatorProfiles.docs.length > 0 ? sanitizeDoc(creatorProfiles.docs[0]) : null,
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="botcafe-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    console.error('Error exporting user data:', error)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}
