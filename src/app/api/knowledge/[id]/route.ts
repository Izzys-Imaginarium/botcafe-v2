import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

interface ActivationSettings {
  activation_mode?: 'keyword' | 'vector' | 'hybrid' | 'constant' | 'disabled'
  primary_keys?: string[]
  secondary_keys?: string[]
  keywords_logic?: 'AND_ANY' | 'AND_ALL' | 'NOT_ALL' | 'NOT_ANY'
  case_sensitive?: boolean
  match_whole_words?: boolean
  use_regex?: boolean
  vector_similarity_threshold?: number
  max_vector_results?: number
  probability?: number
  use_probability?: boolean
  scan_depth?: number
  match_in_user_messages?: boolean
  match_in_bot_messages?: boolean
  match_in_system_prompts?: boolean
}

interface Positioning {
  position?: 'before_character' | 'after_character' | 'before_examples' | 'after_examples' | 'at_depth' | 'system_top' | 'system_bottom'
  depth?: number
  role?: 'system' | 'user' | 'assistant'
  order?: number
}

interface AdvancedActivation {
  sticky?: number
  cooldown?: number
  delay?: number
}

interface Filtering {
  filter_by_bots?: boolean
  allowed_bot_ids?: number[]
  excluded_bot_ids?: number[]
  filter_by_personas?: boolean
  allowed_persona_ids?: number[]
  excluded_persona_ids?: number[]
}

interface BudgetControl {
  ignore_budget?: boolean
  max_tokens?: number
}

interface KnowledgeUpdateRequest {
  entry?: string
  type?: 'text' | 'document' | 'url' | 'image' | 'audio' | 'video' | 'legacy_memory'
  knowledge_collection?: string | number
  tags?: { tag: string }[]
  applies_to_bots?: (string | number)[]
  activation_settings?: ActivationSettings
  positioning?: Positioning
  advanced_activation?: AdvancedActivation
  filtering?: Filtering
  budget_control?: BudgetControl
  privacy_settings?: {
    privacy_level?: 'private' | 'shared' | 'public'
    allow_sharing?: boolean
  }
}

// GET - Fetch a single knowledge entry by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const numericId = parseInt(id, 10)

    if (isNaN(numericId)) {
      return NextResponse.json(
        { message: 'Invalid knowledge entry ID' },
        { status: 400 }
      )
    }

    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json(
        { message: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    const payload = await getPayloadHMR({ config })

    const payloadUsers = await payload.find({
      collection: 'users',
      where: {
        email: { equals: clerkUser.emailAddresses[0]?.emailAddress },
      },
      limit: 1,
      overrideAccess: true,
    })

    if (payloadUsers.docs.length === 0) {
      return NextResponse.json(
        { message: 'User not synced yet. Please try again.' },
        { status: 404 }
      )
    }

    const payloadUser = payloadUsers.docs[0]

    const knowledge = await payload.findByID({
      collection: 'knowledge',
      id: numericId,
      overrideAccess: true,
    })

    if (!knowledge) {
      return NextResponse.json(
        { message: 'Knowledge entry not found' },
        { status: 404 }
      )
    }

    // Check ownership
    // @ts-ignore
    const isOwner = knowledge.user === payloadUser.id || knowledge.user?.id === payloadUser.id

    if (!isOwner) {
      return NextResponse.json(
        { message: 'Unauthorized - You do not have access to this entry' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      knowledge,
    })
  } catch (error: any) {
    console.error('Error fetching knowledge entry:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to fetch knowledge entry' },
      { status: 500 }
    )
  }
}

// PATCH - Update a knowledge entry
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const numericId = parseInt(id, 10)

    if (isNaN(numericId)) {
      return NextResponse.json(
        { message: 'Invalid knowledge entry ID' },
        { status: 400 }
      )
    }

    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json(
        { message: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    const body = (await request.json()) as KnowledgeUpdateRequest

    const payload = await getPayloadHMR({ config })

    const payloadUsers = await payload.find({
      collection: 'users',
      where: {
        email: { equals: clerkUser.emailAddresses[0]?.emailAddress },
      },
      limit: 1,
      overrideAccess: true,
    })

    if (payloadUsers.docs.length === 0) {
      return NextResponse.json(
        { message: 'User not synced yet. Please try again.' },
        { status: 404 }
      )
    }

    const payloadUser = payloadUsers.docs[0]

    // Fetch existing entry to verify ownership
    const existingKnowledge = await payload.findByID({
      collection: 'knowledge',
      id: numericId,
      overrideAccess: true,
    })

    if (!existingKnowledge) {
      return NextResponse.json(
        { message: 'Knowledge entry not found' },
        { status: 404 }
      )
    }

    // @ts-ignore
    if (existingKnowledge.user !== payloadUser.id && existingKnowledge.user?.id !== payloadUser.id) {
      return NextResponse.json(
        { message: 'Unauthorized - You do not own this knowledge entry' },
        { status: 403 }
      )
    }

    // Check if content changed (requires re-vectorization)
    // @ts-ignore
    const contentChanged = body.entry !== undefined && body.entry !== existingKnowledge.entry
    // @ts-ignore
    const wasVectorized = existingKnowledge.is_vectorized

    // If content changed and was vectorized, delete old vectors
    if (contentChanged && wasVectorized) {
      try {
        const vectorRecords = await payload.find({
          collection: 'vectorRecords',
          where: {
            and: [
              { source_type: { equals: 'knowledge' } },
              { source_id: { equals: String(numericId) } },
            ],
          },
          limit: 100,
          overrideAccess: true,
        })

        for (const record of vectorRecords.docs) {
          await payload.delete({
            collection: 'vectorRecords',
            id: record.id,
            overrideAccess: true,
          })
        }

        console.log(`Deleted ${vectorRecords.docs.length} old vector records for knowledge ${numericId} due to content change`)
      } catch (vectorError) {
        console.error('Error deleting old vectors:', vectorError)
      }
    }

    // Helper functions for array conversions
    const convertToKeywordArray = (keys?: string[]): { keyword: string }[] => {
      if (!keys || keys.length === 0) return []
      return keys.map(k => ({ keyword: k }))
    }
    const convertToBotIdArray = (ids?: number[]): { bot_id: number }[] => {
      if (!ids || ids.length === 0) return []
      return ids.map(id => ({ bot_id: id }))
    }
    const convertToPersonaIdArray = (ids?: number[]): { persona_id: number }[] => {
      if (!ids || ids.length === 0) return []
      return ids.map(id => ({ persona_id: id }))
    }

    // Build update data - only include fields that were provided
    const updateData: Record<string, any> = {}

    if (body.entry !== undefined) {
      updateData.entry = body.entry
      updateData.tokens = Math.ceil(body.entry.length / 4)
      updateData.content_metadata = {
        // @ts-ignore
        ...existingKnowledge.content_metadata,
        word_count: body.entry.split(/\s+/).length,
        processing_status: contentChanged && wasVectorized ? 'pending' : 'processed',
      }
      // Mark as not vectorized if content changed
      if (contentChanged) {
        updateData.is_vectorized = false
        updateData.chunk_count = 0
        updateData.vector_records = []
      }
    }

    if (body.type !== undefined) {
      updateData.type = body.type
    }

    if (body.knowledge_collection !== undefined) {
      updateData.knowledge_collection = typeof body.knowledge_collection === 'string'
        ? parseInt(body.knowledge_collection)
        : body.knowledge_collection
    }

    if (body.tags !== undefined) {
      updateData.tags = body.tags
    }

    if (body.applies_to_bots !== undefined) {
      updateData.applies_to_bots = body.applies_to_bots.map(id =>
        typeof id === 'string' ? parseInt(id) : id
      )
    }

    if (body.activation_settings) {
      updateData.activation_settings = {
        // @ts-ignore
        ...existingKnowledge.activation_settings,
        ...body.activation_settings,
        // Handle array conversions
        ...(body.activation_settings.primary_keys && {
          primary_keys: convertToKeywordArray(body.activation_settings.primary_keys)
        }),
        ...(body.activation_settings.secondary_keys && {
          secondary_keys: convertToKeywordArray(body.activation_settings.secondary_keys)
        }),
      }
    }

    if (body.positioning) {
      updateData.positioning = {
        // @ts-ignore
        ...existingKnowledge.positioning,
        ...body.positioning,
      }
    }

    if (body.advanced_activation) {
      updateData.advanced_activation = {
        // @ts-ignore
        ...existingKnowledge.advanced_activation,
        ...body.advanced_activation,
      }
    }

    if (body.filtering) {
      updateData.filtering = {
        // @ts-ignore
        ...existingKnowledge.filtering,
        ...body.filtering,
        // Handle array conversions
        ...(body.filtering.allowed_bot_ids && {
          allowed_bot_ids: convertToBotIdArray(body.filtering.allowed_bot_ids)
        }),
        ...(body.filtering.excluded_bot_ids && {
          excluded_bot_ids: convertToBotIdArray(body.filtering.excluded_bot_ids)
        }),
        ...(body.filtering.allowed_persona_ids && {
          allowed_persona_ids: convertToPersonaIdArray(body.filtering.allowed_persona_ids)
        }),
        ...(body.filtering.excluded_persona_ids && {
          excluded_persona_ids: convertToPersonaIdArray(body.filtering.excluded_persona_ids)
        }),
      }
    }

    if (body.budget_control) {
      updateData.budget_control = {
        // @ts-ignore
        ...existingKnowledge.budget_control,
        ...body.budget_control,
      }
    }

    if (body.privacy_settings) {
      updateData.privacy_settings = {
        // @ts-ignore
        ...existingKnowledge.privacy_settings,
        ...body.privacy_settings,
      }
    }

    // Update the knowledge entry
    const updatedKnowledge = await payload.update({
      collection: 'knowledge',
      id: numericId,
      data: updateData,
      overrideAccess: true,
    })

    return NextResponse.json({
      success: true,
      message: contentChanged && wasVectorized
        ? 'Knowledge entry updated. Content changed - please re-vectorize.'
        : 'Knowledge entry updated successfully',
      knowledge: updatedKnowledge,
      requiresRevectorization: contentChanged && wasVectorized,
    })
  } catch (error: any) {
    console.error('Error updating knowledge entry:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to update knowledge entry' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const numericId = parseInt(id, 10)

    if (isNaN(numericId)) {
      return NextResponse.json(
        { message: 'Invalid knowledge entry ID' },
        { status: 400 }
      )
    }

    // Get authenticated Clerk user
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return NextResponse.json(
        { message: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    // Get Payload instance
    const payload = await getPayloadHMR({ config })

    // Find Payload user by email
    const payloadUsers = await payload.find({
      collection: 'users',
      where: {
        email: { equals: clerkUser.emailAddresses[0]?.emailAddress },
      },
      limit: 1,
      overrideAccess: true,
    })

    if (payloadUsers.docs.length === 0) {
      return NextResponse.json(
        { message: 'User not synced yet. Please try again.' },
        { status: 404 }
      )
    }

    const payloadUser = payloadUsers.docs[0]

    // Fetch the knowledge entry to verify ownership
    const knowledge = await payload.findByID({
      collection: 'knowledge',
      id: numericId,
      overrideAccess: true,
    })

    if (!knowledge) {
      return NextResponse.json(
        { message: 'Knowledge entry not found' },
        { status: 404 }
      )
    }

    // Check if user owns this knowledge entry
    // @ts-ignore - Payload types are complex
    if (knowledge.user !== payloadUser.id && knowledge.user?.id !== payloadUser.id) {
      return NextResponse.json(
        { message: 'Unauthorized - You do not own this knowledge entry' },
        { status: 403 }
      )
    }

    // Delete associated vectors if entry is vectorized
    // @ts-ignore
    if (knowledge.is_vectorized) {
      try {
        // Delete vector records
        const vectorRecords = await payload.find({
          collection: 'vectorRecords',
          where: {
            and: [
              { source_type: { equals: 'knowledge' } },
              { source_id: { equals: String(numericId) } },
              { user_id: { equals: payloadUser.id } },
            ],
          },
          overrideAccess: true,
        })

        for (const record of vectorRecords.docs) {
          await payload.delete({
            collection: 'vectorRecords',
            id: record.id,
            overrideAccess: true,
          })
        }

        console.log(`Deleted ${vectorRecords.docs.length} vector records for knowledge ${numericId}`)
      } catch (vectorError) {
        console.error('Error deleting vectors:', vectorError)
        // Continue with knowledge deletion even if vector deletion fails
      }
    }

    // Delete the knowledge entry
    await payload.delete({
      collection: 'knowledge',
      id: numericId,
      overrideAccess: true,
    })

    return NextResponse.json({
      success: true,
      message: 'Knowledge entry deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting knowledge entry:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to delete knowledge entry' },
      { status: 500 }
    )
  }
}
