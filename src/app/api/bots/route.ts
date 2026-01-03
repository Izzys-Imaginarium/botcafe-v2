import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import config from '@payload-config'

type GenderOption = 'male' | 'female' | 'non-binary' | 'other' | 'prefer-not-to-say'

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
    })

    let payloadUserId: string | number

    if (existingUsers.docs.length > 0) {
      // User exists
      payloadUserId = existingUsers.docs[0].id
    } else {
      // Create new Payload user
      const newUser = await payload.create({
        collection: 'users',
        data: {
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          name: clerkUser.firstName && clerkUser.lastName
            ? `${clerkUser.firstName} ${clerkUser.lastName}`
            : clerkUser.username || clerkUser.emailAddresses[0]?.emailAddress || 'User',
          // Add any other user fields as needed
        },
      })
      payloadUserId = newUser.id
    }

    // Transform speech_examples array format
    // Frontend sends: ['example1', 'example2']
    // Payload expects: [{ example: 'example1' }, { example: 'example2' }]
    const transformedSpeechExamples = body.speech_examples
      ? body.speech_examples
          .filter((ex: string) => ex && ex.trim())
          .map((ex: string) => ({ example: ex }))
      : []

    // Create the bot
    const newBot = await payload.create({
      collection: 'bot',
      data: {
        user: payloadUserId,
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
        knowledge_collections: (body.knowledge_collections || []) as number[],
        created_date: new Date().toISOString(),
        likes_count: 0,
        favorites_count: 0,
      },
    })

    return NextResponse.json(
      {
        message: 'Bot created successfully',
        slug: newBot.slug,
        id: newBot.id,
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
