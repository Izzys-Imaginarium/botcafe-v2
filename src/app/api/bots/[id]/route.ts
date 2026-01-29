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
    const botIdNum = typeof id === 'string' ? parseInt(id, 10) : id

    // DELETE bot interactions (bot field is required, can't nullify)
    await payload.delete({
      collection: 'botInteractions',
      where: { bot: { equals: botIdNum } },
      overrideAccess: true,
    })

    // Remove bot from memories array (hasMany, not required)
    const memories = await payload.find({
      collection: 'memory',
      limit: 1000,
      overrideAccess: true,
    })
    for (const memory of memories.docs) {
      const memoryBots = (memory as any).bot || []
      const botArray = Array.isArray(memoryBots) ? memoryBots : [memoryBots]
      const hasBotRef = botArray.some((b: any) => {
        const bId = typeof b === 'object' ? b?.id : b
        return bId === botIdNum
      })
      if (hasBotRef) {
        const updatedBots = botArray.filter((b: any) => {
          const bId = typeof b === 'object' ? b?.id : b
          return bId !== botIdNum
        })
        await payload.update({
          collection: 'memory',
          id: memory.id,
          data: { bot: updatedBots },
          overrideAccess: true,
        })
      }
    }

    // DELETE memory insights (bot field is required, can't nullify)
    await payload.delete({
      collection: 'memory-insights',
      where: { bot: { equals: botIdNum } },
      overrideAccess: true,
    })

    // Nullify bot reference on messages (not required)
    const messages = await payload.find({
      collection: 'message',
      where: { bot: { equals: botIdNum } },
      limit: 1000,
      overrideAccess: true,
    })
    for (const message of messages.docs) {
      await payload.update({
        collection: 'message',
        id: message.id,
        data: { bot: null },
        overrideAccess: true,
      })
    }

    // Also nullify source_bot_id in message_attribution
    const messagesWithSourceBot = await payload.find({
      collection: 'message',
      where: { 'message_attribution.source_bot_id': { equals: botIdNum } },
      limit: 1000,
      overrideAccess: true,
    })
    for (const message of messagesWithSourceBot.docs) {
      const attribution = (message as any).message_attribution || {}
      await payload.update({
        collection: 'message',
        id: message.id,
        data: {
          message_attribution: {
            ...attribution,
            source_bot_id: null,
          },
        },
        overrideAccess: true,
      })
    }

    // Remove bot from bot_participation arrays in conversations
    const allConversations = await payload.find({
      collection: 'conversation',
      limit: 5000,
      overrideAccess: true,
    })
    for (const conv of allConversations.docs) {
      const participation = (conv as any).bot_participation || []
      const hasBot = participation.some((bp: any) => {
        const bpBotId = typeof bp.bot_id === 'object' ? bp.bot_id?.id : bp.bot_id
        return bpBotId === botIdNum
      })
      if (hasBot) {
        const updatedParticipation = participation.filter((bp: any) => {
          const bpBotId = typeof bp.bot_id === 'object' ? bp.bot_id?.id : bp.bot_id
          return bpBotId !== botIdNum
        })
        await payload.update({
          collection: 'conversation',
          id: conv.id,
          data: { bot_participation: updatedParticipation },
          overrideAccess: true,
        })
      }
    }

    // Remove bot from featured_bots in creator profiles
    const allProfiles = await payload.find({
      collection: 'creatorProfiles',
      limit: 1000,
      overrideAccess: true,
    })
    for (const profile of allProfiles.docs) {
      const currentFeatured = (profile as any).portfolio?.featured_bots || []
      const hasBot = currentFeatured.some((b: any) => {
        const bId = typeof b === 'object' ? b?.id : b
        return bId === botIdNum
      })
      if (hasBot) {
        const updatedFeatured = currentFeatured.filter((b: any) => {
          const bId = typeof b === 'object' ? b?.id : b
          return bId !== botIdNum
        })
        await payload.update({
          collection: 'creatorProfiles',
          id: profile.id,
          data: {
            portfolio: {
              ...((profile as any).portfolio || {}),
              featured_bots: updatedFeatured,
            },
          },
          overrideAccess: true,
        })
      }
    }

    // Remove bot from Knowledge applies_to_bots (hasMany)
    const allKnowledge = await payload.find({
      collection: 'knowledge',
      limit: 5000,
      overrideAccess: true,
    })
    for (const entry of allKnowledge.docs) {
      const appliesToBots = (entry as any).applies_to_bots || []
      const hasBot = appliesToBots.some((b: any) => {
        const bId = typeof b === 'object' ? b?.id : b
        return bId === botIdNum
      })
      if (hasBot) {
        const updatedBots = appliesToBots.filter((b: any) => {
          const bId = typeof b === 'object' ? b?.id : b
          return bId !== botIdNum
        })
        await payload.update({
          collection: 'knowledge',
          id: entry.id,
          data: { applies_to_bots: updatedBots },
          overrideAccess: true,
        })
      }
    }

    // Remove bot from KnowledgeCollections bot array (hasMany)
    const allCollections = await payload.find({
      collection: 'knowledgeCollections',
      limit: 1000,
      overrideAccess: true,
    })
    for (const coll of allCollections.docs) {
      const collBots = (coll as any).bot || []
      const hasBot = collBots.some((b: any) => {
        const bId = typeof b === 'object' ? b?.id : b
        return bId === botIdNum
      })
      if (hasBot) {
        const updatedBots = collBots.filter((b: any) => {
          const bId = typeof b === 'object' ? b?.id : b
          return bId !== botIdNum
        })
        await payload.update({
          collection: 'knowledgeCollections',
          id: coll.id,
          data: { bot: updatedBots },
          overrideAccess: true,
        })
      }
    }

    // DELETE PersonaAnalytics (bot field is required, can't nullify)
    await payload.delete({
      collection: 'persona-analytics',
      where: { bot: { equals: botIdNum } },
      overrideAccess: true,
    })

    // Nullify bot_id in UsageAnalytics resource_details
    const allUsageAnalytics = await payload.find({
      collection: 'usage-analytics',
      limit: 5000,
      overrideAccess: true,
    })
    for (const ua of allUsageAnalytics.docs) {
      const resourceDetails = (ua as any).resource_details || {}
      const resourceBotId = typeof resourceDetails.bot_id === 'object' ? resourceDetails.bot_id?.id : resourceDetails.bot_id
      if (resourceBotId === botIdNum) {
        await payload.update({
          collection: 'usage-analytics',
          id: ua.id,
          data: {
            resource_details: {
              ...resourceDetails,
              bot_id: null,
            },
          },
          overrideAccess: true,
        })
      }
    }

    // Delete access control entries for this bot
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
