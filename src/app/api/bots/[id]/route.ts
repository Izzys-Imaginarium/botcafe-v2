import { NextRequest, NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import { currentUser } from '@clerk/nextjs/server'
import config from '@payload-config'
import { checkResourceAccess, canUserAccess } from '@/lib/permissions/check-access'

type GenderOption = 'male' | 'female' | 'non-binary' | 'other'
type ToneOption = 'friendly' | 'professional' | 'playful' | 'mysterious' | 'wise' | 'humorous' | 'empathetic' | 'authoritative'
type FormalityOption = 'very-casual' | 'casual' | 'neutral' | 'formal' | 'very-formal'
type HumorOption = 'none' | 'light' | 'moderate' | 'dark' | 'sarcastic'
type CommunicationOption = 'direct' | 'elaborate' | 'concise' | 'storytelling' | 'questioning'
type ResponseLengthOption = 'very-short' | 'short' | 'medium' | 'long' | 'very-long'
type CreativityOption = 'conservative' | 'moderate' | 'creative' | 'highly-creative'
type KnowledgeSharingOption = 'very-limited' | 'limited' | 'balanced' | 'generous' | 'very-generous'

type VisibilityOption = 'private' | 'shared' | 'public'

interface BotUpdateRequest {
  name?: string
  slug?: string
  system_prompt?: string
  creator_display_name?: string
  description?: string
  greeting?: string
  gender?: GenderOption
  age?: number
  is_public?: boolean
  speech_examples?: string[]
  knowledge_collections?: (string | number)[]
  picture?: string | number
  personality_traits?: {
    tone?: ToneOption
    formality_level?: FormalityOption
    humor_style?: HumorOption
    communication_style?: CommunicationOption
  }
  behavior_settings?: {
    response_length?: ResponseLengthOption
    creativity_level?: CreativityOption
    knowledge_sharing?: KnowledgeSharingOption
  }
  signature_phrases?: string[]
  tags?: string[]
  classifications?: string[]
  sharing?: {
    visibility?: VisibilityOption
  }
}

// PATCH /api/bots/[id] - Update a bot
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ message: 'Bot ID is required' }, { status: 400 })
    }

    // Get the current Clerk user
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const payload = await getPayloadHMR({ config })

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
      return NextResponse.json({ message: 'User not synced yet. Please try again.' }, { status: 404 })
    }

    const payloadUser = payloadUsers.docs[0]

    // Fetch the bot
    const bot = await payload.findByID({
      collection: 'bot',
      id,
      overrideAccess: true,
    })

    if (!bot) {
      return NextResponse.json({ message: 'Bot not found' }, { status: 404 })
    }

    // Check if the current user has at least editor permission
    const accessResult = await checkResourceAccess(payload, payloadUser.id, 'bot', id)
    if (!accessResult.hasAccess) {
      return NextResponse.json(
        { message: 'You do not have permission to view this bot' },
        { status: 403 }
      )
    }

    // Editors and owners can edit content
    if (accessResult.permission !== 'owner' && accessResult.permission !== 'editor') {
      return NextResponse.json(
        { message: 'You do not have permission to edit this bot' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json() as BotUpdateRequest

    // Only owners can change visibility/sharing settings
    if (body.sharing?.visibility !== undefined && accessResult.permission !== 'owner') {
      return NextResponse.json(
        { message: 'Only owners can change visibility settings' },
        { status: 403 }
      )
    }

    // Build update data object - only include fields that were provided
    const updateData: Record<string, any> = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.slug !== undefined) updateData.slug = body.slug
    if (body.system_prompt !== undefined) updateData.system_prompt = body.system_prompt
    if (body.creator_display_name !== undefined) updateData.creator_display_name = body.creator_display_name
    if (body.description !== undefined) updateData.description = body.description
    if (body.greeting !== undefined) updateData.greeting = body.greeting
    if (body.gender !== undefined) updateData.gender = body.gender
    if (body.age !== undefined) updateData.age = body.age ? parseInt(body.age.toString()) : undefined
    if (body.is_public !== undefined) updateData.is_public = body.is_public
    if (body.picture !== undefined) updateData.picture = body.picture

    // Handle sharing/visibility updates (bots CAN be made public from UI)
    if (body.sharing?.visibility !== undefined) {
      updateData.sharing = {
        ...((bot as any).sharing || {}),
        visibility: body.sharing.visibility,
      }
      // Sync is_public for backwards compatibility
      updateData.is_public = body.sharing.visibility === 'public'
    }
    if (body.knowledge_collections !== undefined) {
      updateData.knowledge_collections = body.knowledge_collections as number[]
    }

    // Transform speech_examples array format if provided
    // Frontend sends: ['example1', 'example2']
    // Payload expects: [{ example: 'example1' }, { example: 'example2' }]
    if (body.speech_examples !== undefined) {
      updateData.speech_examples = body.speech_examples
        .filter((ex: string) => ex && ex.trim())
        .map((ex: string) => ({ example: ex }))
    }

    // Handle personality_traits group - filter out empty strings
    if (body.personality_traits !== undefined) {
      const cleanPersonalityTraits: Record<string, string | undefined> = {}
      if (body.personality_traits.tone) cleanPersonalityTraits.tone = body.personality_traits.tone
      if (body.personality_traits.formality_level) cleanPersonalityTraits.formality_level = body.personality_traits.formality_level
      if (body.personality_traits.humor_style) cleanPersonalityTraits.humor_style = body.personality_traits.humor_style
      if (body.personality_traits.communication_style) cleanPersonalityTraits.communication_style = body.personality_traits.communication_style
      updateData.personality_traits = Object.keys(cleanPersonalityTraits).length > 0 ? cleanPersonalityTraits : undefined
    }

    // Handle behavior_settings group - filter out empty strings
    if (body.behavior_settings !== undefined) {
      const cleanBehaviorSettings: Record<string, string | undefined> = {}
      if (body.behavior_settings.response_length) cleanBehaviorSettings.response_length = body.behavior_settings.response_length
      if (body.behavior_settings.creativity_level) cleanBehaviorSettings.creativity_level = body.behavior_settings.creativity_level
      if (body.behavior_settings.knowledge_sharing) cleanBehaviorSettings.knowledge_sharing = body.behavior_settings.knowledge_sharing
      updateData.behavior_settings = Object.keys(cleanBehaviorSettings).length > 0 ? cleanBehaviorSettings : undefined
    }

    // Transform signature_phrases array format if provided
    if (body.signature_phrases !== undefined) {
      updateData.signature_phrases = body.signature_phrases
        .filter((phrase: string) => phrase && phrase.trim())
        .map((phrase: string) => ({ phrase }))
    }

    // Transform tags array format if provided
    if (body.tags !== undefined) {
      updateData.tags = body.tags
        .filter((tag: string) => tag && tag.trim())
        .map((tag: string) => ({ tag }))
    }

    // Transform classifications array format if provided
    // Frontend sends: ['fantasy-rpg', 'creative-writing']
    // Payload expects: [{ classification: 'fantasy-rpg' }, { classification: 'creative-writing' }]
    type ClassificationValue = 'conversational-ai' | 'creative-writing' | 'fantasy-rpg' | 'gaming' | 'fanfic' | 'oc' | 'dead-dove' | 'comedy-parody' | 'long-form' | 'one-shot'
    if (body.classifications !== undefined) {
      updateData.classifications = body.classifications
        .filter((c: string) => c && c.trim())
        .map((c: string) => ({ classification: c as ClassificationValue }))
    }

    // Update the bot
    const updatedBot = await payload.update({
      collection: 'bot',
      id,
      data: updateData,
      overrideAccess: true,
    })

    // Get creator username for the response URL
    let creatorUsername = ''
    if (updatedBot.creator_profile) {
      const profileId = typeof updatedBot.creator_profile === 'object'
        ? updatedBot.creator_profile.id
        : updatedBot.creator_profile
      const profile = await payload.findByID({
        collection: 'creatorProfiles',
        id: profileId,
        overrideAccess: true,
      })
      if (profile) {
        creatorUsername = profile.username
      }
    }

    return NextResponse.json({
      message: 'Bot updated successfully',
      bot: updatedBot,
      url: creatorUsername ? `/${creatorUsername}/${updatedBot.slug}` : undefined,
    })
  } catch (error: any) {
    console.error('Error updating bot:', error)

    // Handle duplicate slug error
    if (error.message && error.message.includes('duplicate')) {
      return NextResponse.json(
        { message: 'A bot with this URL slug already exists. Please choose a different slug.' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { message: error.message || 'Failed to update bot' },
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

    if (!id) {
      return NextResponse.json({ message: 'Bot ID is required' }, { status: 400 })
    }

    // Get the current Clerk user
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const payload = await getPayloadHMR({ config })

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
      return NextResponse.json({ message: 'User not synced yet. Please try again.' }, { status: 404 })
    }

    const payloadUser = payloadUsers.docs[0]

    // Fetch the bot
    const bot = await payload.findByID({
      collection: 'bot',
      id,
      overrideAccess: true,
    })

    if (!bot) {
      return NextResponse.json({ message: 'Bot not found' }, { status: 404 })
    }

    // Only owners can delete bots
    const accessResult = await checkResourceAccess(payload, payloadUser.id, 'bot', id)
    if (!accessResult.hasAccess || accessResult.permission !== 'owner') {
      return NextResponse.json(
        { message: 'Only owners can delete this bot' },
        { status: 403 }
      )
    }

    // Clean up all bot references before deletion
    // Use very small batch sizes and depth:0 to avoid D1 "too many SQL variables" error
    const botIdNum = typeof id === 'string' ? parseInt(id, 10) : id
    const BATCH_SIZE = 10

    // Helper to process in batches with minimal depth
    async function processBatched<T>(
      collection: string,
      whereClause: Record<string, any> | undefined,
      processor: (doc: T) => Promise<void>
    ) {
      let page = 1
      let hasMore = true
      while (hasMore) {
        const result = await payload.find({
          collection: collection as any,
          where: whereClause,
          limit: BATCH_SIZE,
          page,
          depth: 0, // Don't expand relationships to reduce SQL variables
          overrideAccess: true,
        })
        for (const doc of result.docs) {
          await processor(doc as T)
        }
        hasMore = result.hasNextPage
        page++
      }
    }

    // Handle all FK constraints that would block deletion

    // DELETE bot interactions using raw SQL (bot field is required - FK constraint)
    const drizzle = payload.db.drizzle
    if (drizzle) {
      try {
        await drizzle.run({
          sql: 'DELETE FROM bot_interactions WHERE bot_id = ?',
          args: [botIdNum]
        } as any)
      } catch (e) {
        console.warn('Failed to delete bot_interactions:', e)
      }
    }

    // DELETE memories that reference this bot using raw SQL
    // The bot field is required and hasMany, stored in memory_rels table
    // We need to:
    // 1. Find memories that ONLY have this bot (delete them)
    // 2. Remove bot reference from memories that have other bots too
    if (drizzle) {
      try {
        // First, find and delete memories where this is the only bot
        // Memories with only one bot entry that matches our bot should be deleted
        await drizzle.run({
          sql: `DELETE FROM memory WHERE id IN (
            SELECT parent_id FROM memory_rels
            WHERE bot_id = ?
            AND parent_id NOT IN (
              SELECT parent_id FROM memory_rels WHERE bot_id != ?
            )
          )`,
          args: [botIdNum, botIdNum]
        } as any)
      } catch (e) {
        console.warn('Failed to delete single-bot memories:', e)
      }

      try {
        // Now remove this bot from the _rels table (for memories that had multiple bots)
        await drizzle.run({
          sql: 'DELETE FROM memory_rels WHERE bot_id = ?',
          args: [botIdNum]
        } as any)
      } catch (e) {
        console.warn('Failed to clean memory_rels:', e)
      }
    }

    // DELETE memory insights using raw SQL
    if (drizzle) {
      try {
        await drizzle.run({
          sql: 'UPDATE memory_insights SET bot_id = NULL WHERE bot_id = ?',
          args: [botIdNum]
        } as any)
      } catch (e) {
        console.warn('Failed to nullify memory-insights bot_id:', e)
      }
    }

    // Nullify bot reference on messages using raw SQL ONLY
    // The message table has many nested array fields that cause "too many SQL variables" errors
    // even with depth:0, so we MUST use raw SQL - no Payload fallback
    if (drizzle) {
      try {
        // Update bot_id to NULL
        await drizzle.run({
          sql: 'UPDATE message SET bot_id = NULL WHERE bot_id = ?',
          args: [botIdNum]
        } as any)
      } catch (e) {
        console.warn('Failed to nullify message.bot_id:', e)
      }

      try {
        // Also nullify source_bot_id in message_attribution
        // The column name in SQLite is message_attribution_source_bot_id_id (with _id suffix for relationships)
        await drizzle.run({
          sql: 'UPDATE message SET message_attribution_source_bot_id_id = NULL WHERE message_attribution_source_bot_id_id = ?',
          args: [botIdNum]
        } as any)
      } catch (e) {
        console.warn('Failed to nullify message_attribution_source_bot_id_id:', e)
      }
    }

    // DELETE PersonaAnalytics using raw SQL (bot FK constraint)
    if (drizzle) {
      try {
        await drizzle.run({
          sql: 'DELETE FROM persona_analytics WHERE bot_id = ?',
          args: [botIdNum]
        } as any)
      } catch (e) {
        console.warn('Failed to delete persona_analytics:', e)
      }
    }

    // Remove bot from conversation bot_participation using raw SQL
    // This avoids Payload's complex queries that can trigger message fetches
    if (drizzle) {
      try {
        // The bot_participation is stored in a separate table: conversation_bot_participation
        await drizzle.run({
          sql: 'DELETE FROM "conversation_bot_participation" WHERE bot_id_id = ?',
          args: [botIdNum]
        } as any)
      } catch (e) {
        console.warn('Failed to clean conversation_bot_participation:', e)
      }
    }

    // Remove bot from knowledge applies_to_bots using raw SQL
    // hasMany relationships are stored in _rels tables
    if (drizzle) {
      try {
        await drizzle.run({
          sql: 'DELETE FROM "knowledge_rels" WHERE bot_id = ?',
          args: [botIdNum]
        } as any)
      } catch (e) {
        console.warn('Failed to clean knowledge_rels:', e)
      }
    }

    // Remove bot from knowledgeCollections bot arrays using raw SQL
    if (drizzle) {
      try {
        await drizzle.run({
          sql: 'DELETE FROM "knowledge_collections_rels" WHERE bot_id = ?',
          args: [botIdNum]
        } as any)
      } catch (e) {
        console.warn('Failed to clean knowledge_collections_rels:', e)
      }
    }

    // Remove bot from creatorProfiles featured_bots using raw SQL
    if (drizzle) {
      try {
        await drizzle.run({
          sql: 'DELETE FROM "creator_profiles_rels" WHERE bot_id = ?',
          args: [botIdNum]
        } as any)
      } catch (e) {
        console.warn('Failed to clean creator_profiles_rels:', e)
      }
    }

    // Delete access control entries using raw SQL
    if (drizzle) {
      try {
        await drizzle.run({
          sql: 'DELETE FROM access_control WHERE resource_type = ? AND resource_id = ?',
          args: ['bot', String(botIdNum)]
        } as any)
      } catch (e) {
        console.warn('Failed to delete access_control:', e)
      }
    }

    // Clean up relationship tables using raw SQL
    // These _rels tables can have FK constraints that block bot deletion
    try {
      if (drizzle) {
        // Clean up any remaining references in relationship tables
        const relTables = [
          'memory_rels',
          'knowledge_rels',
          'knowledge_collections_rels',
          'conversation_bot_participation',
          'creator_profiles_rels',
          'bot_rels',
        ]

        for (const table of relTables) {
          try {
            // Try to delete rows that reference this bot
            await drizzle.run({
              sql: `DELETE FROM "${table}" WHERE bot_id = ?`,
              args: [botIdNum]
            } as any)
          } catch (e) {
            // Table might not exist or column might be named differently - that's ok
          }
        }

        // Also clean up bot_knowledge_collections relationship table
        try {
          await drizzle.run({
            sql: `DELETE FROM "bot_knowledge_collections" WHERE bot_id = ?`,
            args: [botIdNum]
          } as any)
        } catch (e) {
          // Might not exist
        }

        // Clean up bot_rels table (relationships FROM the bot)
        try {
          await drizzle.run({
            sql: `DELETE FROM "bot_rels" WHERE parent_id = ?`,
            args: [botIdNum]
          } as any)
        } catch (e) {
          // Might not exist
        }

        // Clean up payload_locked_documents_rels which might reference bot
        try {
          await drizzle.run({
            sql: `DELETE FROM "payload_locked_documents_rels" WHERE bot_id = ?`,
            args: [botIdNum]
          } as any)
        } catch (e) {
          // Might not exist
        }

        // Clean up payload_locked_documents for this bot
        try {
          await drizzle.run({
            sql: `DELETE FROM "payload_locked_documents" WHERE document_id = ? AND global_slug = 'bot'`,
            args: [String(botIdNum)]
          } as any)
        } catch (e) {
          // Might not exist
        }

        // Clean up any conversation_bot_participation entries
        try {
          await drizzle.run({
            sql: `DELETE FROM "conversation_bot_participation" WHERE bot_id_id = ?`,
            args: [botIdNum]
          } as any)
        } catch (e) {
          // Might not exist or column name different
        }

        // Final cleanup - delete from bot_tags, bot_signature_phrases, etc.
        const botArrayTables = [
          'bot_tags',
          'bot_signature_phrases',
          'bot_speech_examples',
          'bot_classifications',
        ]
        for (const table of botArrayTables) {
          try {
            await drizzle.run({
              sql: `DELETE FROM "${table}" WHERE _parent_id = ?`,
              args: [botIdNum]
            } as any)
          } catch (e) {
            // Table might not exist
          }
        }
      }
    } catch (relError) {
      console.warn('Relationship table cleanup warning:', relError)
      // Continue with deletion attempt
    }

    // Now delete the bot
    try {
      await payload.delete({
        collection: 'bot',
        id,
        overrideAccess: true,
      })
    } catch (deleteError: any) {
      console.error('Payload delete failed, trying raw SQL:', deleteError)

      // Try raw SQL as a last resort (drizzle already declared above)
      if (drizzle) {
        try {
          // First, let's see what might still be referencing this bot
          // by checking common relationship patterns
          const possibleFKTables = [
            { table: 'memory_bot', column: 'bot_id' },
            { table: 'memory_rels', column: 'bot_id' },
            { table: 'knowledge_applies_to_bots', column: 'bot_id' },
            { table: 'knowledge_rels', column: 'bot_id' },
            { table: 'conversation_bot_participation', column: 'bot_id_id' },
          ]

          for (const { table, column } of possibleFKTables) {
            try {
              await drizzle.run({
                sql: `DELETE FROM "${table}" WHERE "${column}" = ?`,
                args: [botIdNum]
              } as any)
              console.log(`Cleaned up ${table}`)
            } catch (e) {
              // Table/column might not exist
            }
          }

          // Now try raw delete
          await drizzle.run({
            sql: `DELETE FROM "bot" WHERE "id" = ?`,
            args: [botIdNum]
          } as any)
        } catch (rawError) {
          console.error('Raw SQL delete also failed:', rawError)
          throw deleteError // Throw the original error
        }
      } else {
        throw deleteError
      }
    }

    return NextResponse.json({
      message: 'Bot deleted successfully',
      id,
    })
  } catch (error: any) {
    console.error('Error deleting bot:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to delete bot' },
      { status: 500 }
    )
  }
}
