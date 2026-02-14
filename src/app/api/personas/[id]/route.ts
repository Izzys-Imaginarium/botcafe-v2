import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

/**
 * GET /api/personas/[id]
 *
 * Fetch a single persona by ID.
 *
 * Response:
 * - success: boolean
 * - persona: Persona object
 * - message?: string
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    // Find user in Payload
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

    const payloadUser = users.docs[0]

    // Fetch persona
    const persona = await payload.findByID({
      collection: 'personas',
      id,
      depth: 2,
      overrideAccess: true,
    })

    // Check access (personas are always private - owner only)
    if (
      typeof persona.user === 'object' &&
      persona.user.id !== payloadUser.id
    ) {
      return NextResponse.json(
        { success: false, message: 'Access denied: This persona is private' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      persona: persona,
    })
  } catch (error: any) {
    console.error('Fetch persona error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch persona' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/personas/[id]
 *
 * Update an existing persona.
 *
 * Request body: Same as POST, all fields optional except what's being updated
 *
 * Response:
 * - success: boolean
 * - persona: Updated Persona object
 * - message?: string
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    // Find user in Payload
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

    const payloadUser = users.docs[0]

    // Fetch existing persona to verify ownership
    const existingPersona = await payload.findByID({
      collection: 'personas',
      id,
      overrideAccess: true,
    })

    // Verify ownership
    if (typeof existingPersona.user === 'object' && existingPersona.user.id !== payloadUser.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: You do not own this persona' },
        { status: 403 }
      )
    }

    // Get request body
    const body = (await request.json()) as {
      name?: string
      description?: string
      gender?: ('male' | 'female' | 'non-binary' | 'unspecified' | 'other') | null
      age?: number | null
      pronouns?: ('he-him' | 'she-her' | 'they-them' | 'he-they' | 'she-they' | 'any' | 'other') | null
      custom_pronouns?: string | null
      appearance?: {
        avatar?: number | null
      }
      interaction_preferences?: {
        preferred_topics?: Array<{ topic?: string }>
        avoid_topics?: Array<{ topic?: string }>
      }
      is_default?: boolean
      custom_instructions?: string | null
    }

    // If setting as default, unset other default personas
    if (body.is_default && !existingPersona.is_default) {
      const existingDefaults = await payload.find({
        collection: 'personas',
        where: {
          and: [
            {
              user: {
                equals: payloadUser.id,
              },
            },
            {
              is_default: {
                equals: true,
              },
            },
          ],
        },
        overrideAccess: true,
      })

      // Update existing defaults to not be default
      for (const defaultPersona of existingDefaults.docs) {
        await payload.update({
          collection: 'personas',
          id: defaultPersona.id,
          data: {
            is_default: false,
          },
          overrideAccess: true,
        })
      }
    }

    // Clean up body - filter empty strings for select fields (Payload doesn't accept empty strings)
    const cleanedBody = {
      ...body,
      gender: body.gender || undefined,
      pronouns: body.pronouns || undefined,
    }

    // Update persona
    const updatedPersona = await payload.update({
      collection: 'personas',
      id,
      data: cleanedBody,
      overrideAccess: true,
    })

    return NextResponse.json({
      success: true,
      persona: updatedPersona,
      message: 'Persona updated successfully',
    })
  } catch (error: any) {
    console.error('Update persona error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update persona' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/personas/[id]
 *
 * Delete a persona.
 *
 * Response:
 * - success: boolean
 * - message: string
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    // Find user in Payload
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

    const payloadUser = users.docs[0]

    // Fetch persona to verify ownership
    const persona = await payload.findByID({
      collection: 'personas',
      id,
      overrideAccess: true,
    })

    // Verify ownership
    if (typeof persona.user === 'object' && persona.user.id !== payloadUser.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: You do not own this persona' },
        { status: 403 }
      )
    }

    // Clean up FK constraints before deletion using D1 SQL directly
    // SQLite CASCADE doesn't work reliably in D1, so we delete explicitly
    const personaIdNum = parseInt(id, 10)
    const d1 = (payload.db as any).client as D1Database

    console.log(`[Persona Delete ${personaIdNum}] Starting FK cleanup`)

    if (d1) {
      const tables = [
        // Required FK: persona_analytics.persona -> must delete
        { name: 'persona_analytics', sql: 'DELETE FROM persona_analytics WHERE persona_id = ?' },
        // hasMany _rels: knowledge.applies_to_personas
        { name: 'knowledge_rels (personas)', sql: 'DELETE FROM knowledge_rels WHERE personas_id = ?' },
        // hasMany _rels: memory.persona
        { name: 'memory_rels (personas)', sql: 'DELETE FROM memory_rels WHERE personas_id = ?' },
        // Optional FK: message.message_attribution.persona_id -> nullify
        { name: 'message (nullify persona)', sql: 'UPDATE message SET message_attribution_persona_id_id = NULL WHERE message_attribution_persona_id_id = ?' },
        // Optional FK: usage_analytics.resource_details.persona_id -> nullify
        { name: 'usage_analytics (nullify persona)', sql: 'UPDATE usage_analytics SET resource_details_persona_id_id = NULL WHERE resource_details_persona_id_id = ?' },
        // Clean up locked documents
        { name: 'payload_locked_documents_rels', sql: 'DELETE FROM payload_locked_documents_rels WHERE personas_id = ?' },
        // Child tables (CASCADE may not work in D1)
        { name: 'personas_interaction_preferences_preferred_topics', sql: 'DELETE FROM personas_interaction_preferences_preferred_topics WHERE _parent_id = ?' },
        { name: 'personas_interaction_preferences_avoid_topics', sql: 'DELETE FROM personas_interaction_preferences_avoid_topics WHERE _parent_id = ?' },
        // Own _rels table
        { name: 'personas_rels', sql: 'DELETE FROM personas_rels WHERE parent_id = ?' },
      ]

      for (const table of tables) {
        try {
          const result = await d1.prepare(table.sql).bind(personaIdNum).run()
          console.log(`[Persona Delete ${personaIdNum}] ${table.name}: OK, rows affected:`, result.meta?.changes ?? 'unknown')
        } catch (e: any) {
          console.error(`[Persona Delete ${personaIdNum}] ${table.name}: FAILED -`, e.message || e)
        }
      }
    } else {
      console.error(`[Persona Delete ${personaIdNum}] D1 client not available!`)
    }

    // Delete persona
    await payload.delete({
      collection: 'personas',
      id,
      overrideAccess: true,
    })
    console.log(`[Persona Delete ${personaIdNum}] Persona deleted successfully`)

    return NextResponse.json({
      success: true,
      message: 'Persona deleted successfully',
    })
  } catch (error: any) {
    console.error('Delete persona error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete persona' },
      { status: 500 }
    )
  }
}
