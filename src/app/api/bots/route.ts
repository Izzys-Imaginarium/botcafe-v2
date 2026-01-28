import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import config from '@payload-config'

type GenderOption = 'male' | 'female' | 'non-binary' | 'other'
type ToneOption = 'friendly' | 'professional' | 'playful' | 'mysterious' | 'wise' | 'humorous' | 'empathetic' | 'authoritative'
type FormalityOption = 'very-casual' | 'casual' | 'neutral' | 'formal' | 'very-formal'
type HumorOption = 'none' | 'light' | 'moderate' | 'dark' | 'sarcastic'
type CommunicationOption = 'direct' | 'elaborate' | 'concise' | 'storytelling' | 'questioning'
type ResponseLengthOption = 'very-short' | 'short' | 'medium' | 'long' | 'very-long'
type CreativityOption = 'conservative' | 'moderate' | 'creative' | 'highly-creative'
type KnowledgeSharingOption = 'very-limited' | 'limited' | 'balanced' | 'generous' | 'very-generous'

interface BotCreateRequest {
  name: string
  slug: string
  system_prompt: string
  creator_display_name: string
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
}

// Helper function to generate a URL-safe username from display name or email
function generateUsername(displayName: string, email: string): string {
  // Try to use the display name first, fall back to email prefix
  const base = displayName || email.split('@')[0] || 'user'
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) || 'user'
}

// Helper function to ensure username is unique by appending numbers if needed
async function ensureUniqueUsername(
  payload: any,
  baseUsername: string
): Promise<string> {
  let username = baseUsername
  let counter = 1

  while (true) {
    const existing = await payload.find({
      collection: 'creatorProfiles',
      where: {
        username: { equals: username },
      },
      limit: 1,
      overrideAccess: true,
    })

    if (existing.docs.length === 0) {
      return username
    }

    username = `${baseUsername}-${counter}`
    counter++

    // Safety limit
    if (counter > 1000) {
      username = `${baseUsername}-${Date.now()}`
      break
    }
  }

  return username
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated Clerk user
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return NextResponse.json(
        { message: 'Unauthorized - Please sign in to create a bot' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json() as BotCreateRequest

    // Validate required fields
    if (!body.name || !body.slug || !body.system_prompt || !body.creator_display_name) {
      return NextResponse.json(
        { message: 'Missing required fields: name, slug, system_prompt, and creator_display_name are required' },
        { status: 400 }
      )
    }

    // Get Payload instance
    const payload = await getPayloadHMR({ config })

    // Find or create Payload user associated with Clerk user
    // First, try to find existing user by email
    const existingUsers = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: clerkUser.emailAddresses[0]?.emailAddress,
        },
      },
      limit: 1,
      overrideAccess: true,
    })

    let payloadUserId: string | number

    if (existingUsers.docs.length > 0) {
      // User exists
      payloadUserId = existingUsers.docs[0].id
    } else {
      // Create new Payload user (password required by Payload auth but unused since Clerk handles auth)
      const randomPassword = crypto.randomUUID() + crypto.randomUUID()
      const newUser = await payload.create({
        collection: 'users',
        data: {
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          password: randomPassword,
          name: clerkUser.firstName && clerkUser.lastName
            ? `${clerkUser.firstName} ${clerkUser.lastName}`
            : clerkUser.username || clerkUser.emailAddresses[0]?.emailAddress || 'User',
          role: 'user',
        },
        overrideAccess: true,
      })
      payloadUserId = newUser.id
    }

    // Find or create creator profile for this user
    const existingProfiles = await payload.find({
      collection: 'creatorProfiles',
      where: {
        user: { equals: payloadUserId },
      },
      limit: 1,
      overrideAccess: true,
    })

    let creatorProfileId: string | number
    let creatorUsername: string

    if (existingProfiles.docs.length > 0) {
      // Use existing creator profile
      creatorProfileId = existingProfiles.docs[0].id
      creatorUsername = existingProfiles.docs[0].username
    } else {
      // Auto-create a creator profile for first-time bot creators
      const email = clerkUser.emailAddresses[0]?.emailAddress || ''
      const baseUsername = generateUsername(body.creator_display_name, email)
      const uniqueUsername = await ensureUniqueUsername(payload, baseUsername)

      const newProfile = await payload.create({
        collection: 'creatorProfiles',
        data: {
          user: payloadUserId,
          username: uniqueUsername,
          display_name: body.creator_display_name,
          bio: `Creator of AI companions on BotCafe`,
          creator_info: {
            creator_type: 'individual',
          },
          profile_settings: {
            profile_visibility: 'public',
            allow_collaborations: true,
            accept_commissions: false,
          },
        },
        overrideAccess: true,
      })

      creatorProfileId = newProfile.id
      creatorUsername = newProfile.username
    }

    // Transform speech_examples array format
    // Frontend sends: ['example1', 'example2']
    // Payload expects: [{ example: 'example1' }, { example: 'example2' }]
    const transformedSpeechExamples = body.speech_examples
      ? body.speech_examples
          .filter((ex: string) => ex && ex.trim())
          .map((ex: string) => ({ example: ex }))
      : []

    // Transform signature_phrases array format
    const transformedSignaturePhrases = body.signature_phrases
      ? body.signature_phrases
          .filter((phrase: string) => phrase && phrase.trim())
          .map((phrase: string) => ({ phrase }))
      : []

    // Transform tags array format
    const transformedTags = body.tags
      ? body.tags
          .filter((tag: string) => tag && tag.trim())
          .map((tag: string) => ({ tag }))
      : []

    // Transform classifications array format
    // Frontend sends: ['fantasy-rpg', 'creative-writing']
    // Payload expects: [{ classification: 'fantasy-rpg' }, { classification: 'creative-writing' }]
    const transformedClassifications = body.classifications
      ? body.classifications
          .filter((c: string) => c && c.trim())
          .map((c: string) => ({ classification: c }))
      : []

    // Clean personality_traits - remove empty strings (Payload select fields don't accept empty strings)
    const cleanPersonalityTraits: Record<string, string | undefined> = {}
    if (body.personality_traits) {
      if (body.personality_traits.tone) cleanPersonalityTraits.tone = body.personality_traits.tone
      if (body.personality_traits.formality_level) cleanPersonalityTraits.formality_level = body.personality_traits.formality_level
      if (body.personality_traits.humor_style) cleanPersonalityTraits.humor_style = body.personality_traits.humor_style
      if (body.personality_traits.communication_style) cleanPersonalityTraits.communication_style = body.personality_traits.communication_style
    }

    // Clean behavior_settings - remove empty strings
    const cleanBehaviorSettings: Record<string, string | undefined> = {}
    if (body.behavior_settings) {
      if (body.behavior_settings.response_length) cleanBehaviorSettings.response_length = body.behavior_settings.response_length
      if (body.behavior_settings.creativity_level) cleanBehaviorSettings.creativity_level = body.behavior_settings.creativity_level
      if (body.behavior_settings.knowledge_sharing) cleanBehaviorSettings.knowledge_sharing = body.behavior_settings.knowledge_sharing
    }

    // Create the bot
    const newBot = await payload.create({
      collection: 'bot',
      data: {
        user: payloadUserId,
        creator_profile: creatorProfileId,
        name: body.name,
        slug: body.slug,
        system_prompt: body.system_prompt,
        creator_display_name: body.creator_display_name,
        description: body.description || '',
        greeting: body.greeting || '',
        gender: body.gender || undefined,
        age: body.age ? parseInt(body.age.toString()) : undefined,
        is_public: body.is_public || false,
        speech_examples: transformedSpeechExamples,
        personality_traits: Object.keys(cleanPersonalityTraits).length > 0 ? cleanPersonalityTraits : undefined,
        behavior_settings: Object.keys(cleanBehaviorSettings).length > 0 ? cleanBehaviorSettings : undefined,
        signature_phrases: transformedSignaturePhrases,
        tags: transformedTags,
        classifications: transformedClassifications,
        knowledge_collections: (body.knowledge_collections || []) as number[],
        picture: body.picture ? Number(body.picture) : undefined,
        created_date: new Date().toISOString(),
        likes_count: 0,
        favorites_count: 0,
      },
      overrideAccess: true,
    })

    return NextResponse.json(
      {
        message: 'Bot created successfully',
        slug: newBot.slug,
        id: newBot.id,
        username: creatorUsername,
        // New URL format: /<username>/<slug>
        url: `/${creatorUsername}/${newBot.slug}`,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating bot:', error)

    // Handle duplicate slug error
    if (error.message && error.message.includes('duplicate')) {
      return NextResponse.json(
        { message: 'A bot with this URL slug already exists. Please choose a different slug.' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { message: error.message || 'Failed to create bot. Please try again.' },
      { status: 500 }
    )
  }
}
