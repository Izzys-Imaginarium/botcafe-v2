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
        clerkUserId: {
          equals: clerkUser.id,
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

    // Check access (owner or public)
    if (
      typeof persona.user === 'object' &&
      persona.user.id !== payloadUser.id &&
      !persona.is_public
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
        clerkUserId: {
          equals: clerkUser.id,
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
      personality_traits?: any
      appearance?: any
      behavior_settings?: any
      interaction_preferences?: any
      is_default?: boolean
      is_public?: boolean
      tags?: Array<{ tag: string }>
      custom_instructions?: string
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

    // Update persona
    const updatedPersona = await payload.update({
      collection: 'personas',
      id,
      data: body,
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
        clerkUserId: {
          equals: clerkUser.id,
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

    // Delete persona
    await payload.delete({
      collection: 'personas',
      id,
      overrideAccess: true,
    })

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
