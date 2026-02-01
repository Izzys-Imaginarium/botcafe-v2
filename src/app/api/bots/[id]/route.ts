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

    // Clean up all bot references before deletion using Payload APIs
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

    // 2. Delete memories that reference this bot
    // Memory.bot is a required hasMany relationship
    try {
      await payload.delete({
        collection: 'memory',
        where: { bot: { equals: botIdNum } },
        overrideAccess: true,
      })
    } catch (e) {
      console.warn('Failed to delete memories:', e)
    }

    // 3. Nullify memory insights bot reference
    try {
      const memoryInsights = await payload.find({
        collection: 'memory-insights',
        where: { bot: { equals: botIdNum } },
        limit: 0,
        overrideAccess: true,
      })
      for (const insight of memoryInsights.docs) {
        await payload.update({
          collection: 'memory-insights',
          id: insight.id,
          data: { bot: null } as any,
          overrideAccess: true,
        })
      }
    } catch (e) {
      console.warn('Failed to nullify memory-insights bot_id:', e)
    }

    // 4. Nullify bot reference on messages (bot field is optional)
    try {
      const messages = await payload.find({
        collection: 'message',
        where: { bot: { equals: botIdNum } },
        limit: 0,
        depth: 0,
        overrideAccess: true,
      })
      for (const msg of messages.docs) {
        await payload.update({
          collection: 'message',
          id: msg.id,
          data: { bot: null } as any,
          depth: 0,
          overrideAccess: true,
        })
      }
    } catch (e) {
      console.warn('Failed to nullify message.bot_id:', e)
    }

    // 5. Nullify message_attribution.source_bot_id references
    try {
      const messagesWithAttribution = await payload.find({
        collection: 'message',
        where: { 'message_attribution.source_bot_id': { equals: botIdNum } },
        limit: 0,
        depth: 0,
        overrideAccess: true,
      })
      for (const msg of messagesWithAttribution.docs) {
        await payload.update({
          collection: 'message',
          id: msg.id,
          data: {
            message_attribution: {
              ...(msg as any).message_attribution,
              source_bot_id: null,
            },
          } as any,
          depth: 0,
          overrideAccess: true,
        })
      }
    } catch (e) {
      console.warn('Failed to nullify message_attribution_source_bot_id:', e)
    }

    // 6. Delete PersonaAnalytics (bot FK constraint)
    try {
      await payload.delete({
        collection: 'persona-analytics',
        where: { bot: { equals: botIdNum } },
        overrideAccess: true,
      })
    } catch (e) {
      console.warn('Failed to delete persona_analytics:', e)
    }

    // 7. Remove bot from conversation bot_participation
    // This is an array field, so we need to update each conversation
    try {
      const conversations = await payload.find({
        collection: 'conversation',
        where: { 'bot_participation.bot_id': { equals: botIdNum } },
        limit: 0,
        depth: 0,
        overrideAccess: true,
      })
      for (const conv of conversations.docs) {
        const participation = (conv as any).bot_participation || []
        const filteredParticipation = participation.filter(
          (p: any) => {
            const pBotId = typeof p.bot_id === 'object' ? p.bot_id?.id : p.bot_id
            return pBotId !== botIdNum
          }
        )
        await payload.update({
          collection: 'conversation',
          id: conv.id,
          data: { bot_participation: filteredParticipation } as any,
          depth: 0,
          overrideAccess: true,
        })
      }
    } catch (e) {
      console.warn('Failed to clean conversation_bot_participation:', e)
    }

    // 8. Remove bot from knowledge applies_to_bots (hasMany relationship)
    try {
      const knowledgeEntries = await payload.find({
        collection: 'knowledge',
        where: { applies_to_bots: { equals: botIdNum } },
        limit: 0,
        depth: 0,
        overrideAccess: true,
      })
      for (const entry of knowledgeEntries.docs) {
        const currentBots = (entry as any).applies_to_bots || []
        const filteredBots = currentBots.filter((b: any) => {
          const bId = typeof b === 'object' ? b.id : b
          return bId !== botIdNum
        })
        await payload.update({
          collection: 'knowledge',
          id: entry.id,
          data: { applies_to_bots: filteredBots } as any,
          depth: 0,
          overrideAccess: true,
        })
      }
    } catch (e) {
      console.warn('Failed to clean knowledge applies_to_bots:', e)
    }

    // 9. Remove bot from knowledgeCollections bot arrays
    try {
      const collections = await payload.find({
        collection: 'knowledgeCollections',
        where: { bot: { equals: botIdNum } },
        limit: 0,
        depth: 0,
        overrideAccess: true,
      })
      for (const coll of collections.docs) {
        const currentBots = (coll as any).bot || []
        const filteredBots = currentBots.filter((b: any) => {
          const bId = typeof b === 'object' ? b.id : b
          return bId !== botIdNum
        })
        await payload.update({
          collection: 'knowledgeCollections',
          id: coll.id,
          data: { bot: filteredBots } as any,
          depth: 0,
          overrideAccess: true,
        })
      }
    } catch (e) {
      console.warn('Failed to clean knowledge_collections bot:', e)
    }

    // 10. Remove bot from creatorProfiles featured_bots
    try {
      const profiles = await payload.find({
        collection: 'creatorProfiles',
        where: { 'portfolio.featured_bots': { equals: botIdNum } },
        limit: 0,
        depth: 0,
        overrideAccess: true,
      })
      for (const profile of profiles.docs) {
        const currentBots = (profile as any).portfolio?.featured_bots || []
        const filteredBots = currentBots.filter((b: any) => {
          const bId = typeof b === 'object' ? b.id : b
          return bId !== botIdNum
        })
        await payload.update({
          collection: 'creatorProfiles',
          id: profile.id,
          data: {
            portfolio: {
              ...(profile as any).portfolio,
              featured_bots: filteredBots,
            },
          } as any,
          depth: 0,
          overrideAccess: true,
        })
      }
    } catch (e) {
      console.warn('Failed to clean creator_profiles featured_bots:', e)
    }

    // 11. Delete access control entries
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

    // Now delete the bot
    await payload.delete({
      collection: 'bot',
      id,
      overrideAccess: true,
    })

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
