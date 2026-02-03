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

    // Handle legacy bots that may be missing required fields
    // If creator_profile is missing, find or create one for the user
    if (!(bot as any).creator_profile) {
      // Find user's creator profile
      const userProfiles = await payload.find({
        collection: 'creatorProfiles',
        where: { user: { equals: payloadUser.id } },
        limit: 1,
        overrideAccess: true,
      })

      if (userProfiles.docs.length > 0) {
        updateData.creator_profile = userProfiles.docs[0].id
        // Also set creator_display_name if missing
        if (!(bot as any).creator_display_name) {
          updateData.creator_display_name = userProfiles.docs[0].display_name || payloadUser.email
        }
      } else {
        // User doesn't have a creator profile - they need to create one first
        return NextResponse.json(
          { message: 'Please set up your creator profile before editing bots. Visit /creators/setup' },
          { status: 400 }
        )
      }
    }

    // If creator_display_name is missing, set a default
    if (!(bot as any).creator_display_name && !updateData.creator_display_name) {
      // Try to get from creator profile
      const profileId = (bot as any).creator_profile?.id || (bot as any).creator_profile
      if (profileId) {
        const profile = await payload.findByID({
          collection: 'creatorProfiles',
          id: profileId,
          overrideAccess: true,
        })
        if (profile) {
          updateData.creator_display_name = profile.display_name || payloadUser.email
        }
      } else {
        updateData.creator_display_name = payloadUser.email
      }
    }

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

    // Clean up critical FK constraints before deletion using Payload APIs
    // Note: We only delete/update what's strictly necessary to avoid FK constraint errors
    // Optional references (like message.bot) are left as orphaned references to avoid
    // hitting Cloudflare Worker subrequest limits (1000 max per invocation)
    const botIdNum = typeof id === 'string' ? parseInt(id, 10) : id

    // 1. Delete bot interactions (bot field is required - FK constraint)
    try {
      await payload.delete({
        collection: 'botInteractions',
        where: { bot: { equals: botIdNum } },
        overrideAccess: true,
      })
    } catch (e) {
      console.warn('Failed to delete bot_interactions:', e)
    }

    // 2. Delete memories that reference this bot (required FK)
    try {
      await payload.delete({
        collection: 'memory',
        where: { bot: { equals: botIdNum } },
        overrideAccess: true,
      })
    } catch (e) {
      console.warn('Failed to delete memories:', e)
    }

    // 3. Delete memory insights for this bot (required FK)
    try {
      await payload.delete({
        collection: 'memory-insights',
        where: { bot: { equals: botIdNum } },
        overrideAccess: true,
      })
    } catch (e) {
      console.warn('Failed to delete memory-insights:', e)
    }

    // 4. Delete PersonaAnalytics (bot FK constraint)
    try {
      await payload.delete({
        collection: 'persona-analytics',
        where: { bot: { equals: botIdNum } },
        overrideAccess: true,
      })
    } catch (e) {
      console.warn('Failed to delete persona_analytics:', e)
    }

    // 5. Delete access control entries
    try {
      await payload.delete({
        collection: 'access-control',
        where: {
          and: [
            { resource_type: { equals: 'bot' } },
            { resource_id: { equals: String(botIdNum) } },
          ],
        },
        overrideAccess: true,
      })
    } catch (e) {
      console.warn('Failed to delete access_control:', e)
    }

    // Note: The following are NOT deleted to avoid hitting API limits:
    // - message.bot (optional field - orphaned references are harmless)
    // - message.message_attribution.source_bot_id (optional)
    // - knowledge.applies_to_bots (hasMany - would require per-record updates)
    // - knowledgeCollections.bot (hasMany - would require per-record updates)
    // - creatorProfiles.featured_bots (hasMany - would require per-record updates)
    // These orphaned references don't cause errors and can be cleaned up later if needed

    // 6-11. Delete FK-constrained records before deleting the bot
    // SQLite CASCADE doesn't work reliably in D1, so we delete explicitly
    // Access D1 client directly via payload.db.client
    const d1 = (payload.db as any).client as D1Database

    console.log(`[Bot Delete ${botIdNum}] Starting FK cleanup, D1 client available:`, !!d1)

    if (d1) {
      // First, diagnose: find all tables that reference bot
      try {
        const allTables = await d1.prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`).all()
        console.log(`[Bot Delete ${botIdNum}] All tables:`, allTables.results?.map((r: any) => r.name).join(', '))

        // Check what FKs reference the bot table
        for (const tableRow of (allTables.results || []) as any[]) {
          const tableName = tableRow.name
          if (tableName.startsWith('_') || tableName.startsWith('sqlite')) continue
          try {
            const fks = await d1.prepare(`PRAGMA foreign_key_list(${tableName})`).all()
            const botFks = (fks.results || []).filter((fk: any) => fk.table === 'bot')
            if (botFks.length > 0) {
              console.log(`[Bot Delete ${botIdNum}] FK to bot in ${tableName}:`, JSON.stringify(botFks))
            }
          } catch (e) {
            // Ignore pragma errors
          }
        }
      } catch (e: any) {
        console.error(`[Bot Delete ${botIdNum}] Diagnostic failed:`, e.message)
      }

      // Run deletes for ALL tables with FK to bot (discovered via PRAGMA)
      const tables = [
        // CRITICAL: memory_rels has on_delete: NO ACTION - must delete first!
        { name: 'memory_rels', sql: 'DELETE FROM memory_rels WHERE bot_id = ?' },
        // Other _rels tables
        { name: 'knowledge_rels', sql: 'DELETE FROM knowledge_rels WHERE bot_id = ?' },
        { name: 'knowledge_collections_rels', sql: 'DELETE FROM knowledge_collections_rels WHERE bot_id = ?' },
        { name: 'creator_profiles_rels', sql: 'DELETE FROM creator_profiles_rels WHERE bot_id = ?' },
        { name: 'payload_locked_documents_rels', sql: 'DELETE FROM payload_locked_documents_rels WHERE bot_id = ?' },
        // Bot child tables (CASCADE but let's be explicit)
        { name: 'bot_classifications', sql: 'DELETE FROM bot_classifications WHERE _parent_id = ?' },
        { name: 'bot_signature_phrases', sql: 'DELETE FROM bot_signature_phrases WHERE _parent_id = ?' },
        { name: 'bot_tags', sql: 'DELETE FROM bot_tags WHERE _parent_id = ?' },
        { name: 'bot_speech_examples', sql: 'DELETE FROM bot_speech_examples WHERE _parent_id = ?' },
        { name: 'bot_rels', sql: 'DELETE FROM bot_rels WHERE parent_id = ?' },
        // Conversation participation
        { name: 'conversation_bot_participation', sql: 'DELETE FROM conversation_bot_participation WHERE bot_id_id = ?' },
        // Analytics/insights tables
        { name: 'bot_interactions', sql: 'DELETE FROM bot_interactions WHERE bot_id = ?' },
        { name: 'memory_insights', sql: 'DELETE FROM memory_insights WHERE bot_id = ?' },
        { name: 'persona_analytics', sql: 'DELETE FROM persona_analytics WHERE bot_id = ?' },
        { name: 'usage_analytics', sql: 'UPDATE usage_analytics SET resource_details_bot_id_id = NULL WHERE resource_details_bot_id_id = ?' },
        // Message table - has TWO FKs to bot!
        { name: 'message (nullify bot_id)', sql: 'UPDATE message SET bot_id = NULL WHERE bot_id = ?' },
        // CRITICAL: message_attribution_source_bot_id_id has on_delete: NO ACTION!
        { name: 'message (nullify attribution)', sql: 'UPDATE message SET message_attribution_source_bot_id_id = NULL WHERE message_attribution_source_bot_id_id = ?' },
      ]

      for (const table of tables) {
        try {
          const result = await d1.prepare(table.sql).bind(botIdNum).run()
          console.log(`[Bot Delete ${botIdNum}] ${table.name}: OK, rows affected:`, result.meta?.changes ?? 'unknown')
        } catch (e: any) {
          console.error(`[Bot Delete ${botIdNum}] ${table.name}: FAILED -`, e.message || e)
        }
      }
    } else {
      console.error(`[Bot Delete ${botIdNum}] D1 client not available!`)
    }

    // Now delete the bot
    console.log(`[Bot Delete ${botIdNum}] Attempting to delete bot via Payload...`)
    await payload.delete({
      collection: 'bot',
      id,
      overrideAccess: true,
    })
    console.log(`[Bot Delete ${botIdNum}] Bot deleted successfully`)

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
