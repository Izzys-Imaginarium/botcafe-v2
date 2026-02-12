import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import config from '@payload-config'
import { checkResourceAccess } from '@/lib/permissions/check-access'
import { botToTavernCard, embedTavernCardInPng } from '@/lib/tavern-card'
import type { KnowledgeCollectionDoc, KnowledgeDoc } from './export-card-types'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Bot ID is required' }, { status: 400 })
    }

    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await getPayloadHMR({ config })

    // Find the Payload user
    const payloadUsers = await payload.find({
      collection: 'users',
      where: {
        email: { equals: clerkUser.emailAddresses[0]?.emailAddress },
      },
      limit: 1,
      overrideAccess: true,
    })

    if (payloadUsers.docs.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const payloadUser = payloadUsers.docs[0]

    // Check permission - only owners and editors can export
    const access = await checkResourceAccess(payload, payloadUser.id, 'bot', parseInt(id))
    if (!access || (access.permission !== 'owner' && access.permission !== 'editor')) {
      return NextResponse.json(
        { error: 'You do not have permission to export this bot.' },
        { status: 403 },
      )
    }

    // Fetch bot with relationships populated
    const bot = await payload.findByID({
      collection: 'bot',
      id: parseInt(id),
      depth: 1,
      overrideAccess: true,
    })

    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
    }

    // Fetch knowledge entries from linked collections
    let knowledgeEntries: KnowledgeDoc[] = []
    const collections = bot.knowledge_collections as KnowledgeCollectionDoc[] | undefined
    if (collections && collections.length > 0) {
      const collectionIds = collections
        .map((c) => (typeof c === 'object' ? c.id : c))
        .filter(Boolean)

      if (collectionIds.length > 0) {
        const knowledgeResult = await payload.find({
          collection: 'knowledge',
          where: {
            knowledge_collection: { in: collectionIds },
          },
          limit: 500,
          overrideAccess: true,
        })
        knowledgeEntries = knowledgeResult.docs as unknown as KnowledgeDoc[]
      }
    }

    // Build TavernCardV2
    const cardData = botToTavernCard(
      bot as unknown as Parameters<typeof botToTavernCard>[0],
      knowledgeEntries.map((entry) => ({
        entry: entry.entry,
        activation_settings: entry.activation_settings,
        positioning: entry.positioning,
      })),
    )

    // Get the bot's profile picture as PNG if possible
    let pngBuffer: Buffer | null = null
    const picture = bot.picture as { url?: string; mimeType?: string } | null
    if (picture && typeof picture === 'object' && picture.url) {
      try {
        const imageResponse = await fetch(picture.url)
        if (imageResponse.ok) {
          const imageArrayBuffer = await imageResponse.arrayBuffer()
          const imageBuffer = Buffer.from(imageArrayBuffer)

          // Check if it's a PNG
          if (
            imageBuffer.length >= 4 &&
            imageBuffer[0] === 0x89 &&
            imageBuffer[1] === 0x50 &&
            imageBuffer[2] === 0x4e &&
            imageBuffer[3] === 0x47
          ) {
            pngBuffer = imageBuffer
          }
        }
      } catch (fetchError) {
        console.error('[Export Card] Failed to fetch bot picture:', fetchError)
      }
    }

    // Embed card data in PNG
    const resultPng = embedTavernCardInPng(pngBuffer, cardData)

    // Sanitize filename
    const safeName = bot.name
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 100)

    return new NextResponse(resultPng, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${safeName}.png"`,
        'Content-Length': resultPng.length.toString(),
      },
    })
  } catch (error: unknown) {
    console.error('[Export Card] Error:', error)
    const message = error instanceof Error ? error.message : 'Failed to export character card.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
