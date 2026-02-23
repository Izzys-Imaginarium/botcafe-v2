import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import config from '@payload-config'
import { checkResourceAccess } from '@/lib/permissions/check-access'
import { botToTavernCard, embedTavernCardInPng } from '@/lib/tavern-card'
import type { KnowledgeCollectionDoc, KnowledgeDoc } from './export-card-types'

export const dynamic = 'force-dynamic'

function isPng(buf: Buffer): boolean {
  return (
    buf.length >= 4 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  )
}

/**
 * Shared logic: authenticate, fetch bot + knowledge, build TavernCardV2.
 */
async function buildCardExport(request: NextRequest, id: string) {
  const clerkUser = await currentUser()
  if (!clerkUser) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
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
    return { error: NextResponse.json({ error: 'User not found' }, { status: 404 }) }
  }

  const payloadUser = payloadUsers.docs[0]

  const access = await checkResourceAccess(payload, payloadUser.id, 'bot', parseInt(id))
  if (!access || (access.permission !== 'owner' && access.permission !== 'editor')) {
    return {
      error: NextResponse.json(
        { error: 'You do not have permission to export this bot.' },
        { status: 403 },
      ),
    }
  }

  const bot = await payload.findByID({
    collection: 'bot',
    id: parseInt(id),
    depth: 1,
    overrideAccess: true,
  })

  if (!bot) {
    return { error: NextResponse.json({ error: 'Bot not found' }, { status: 404 }) }
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

  const cardData = botToTavernCard(
    bot as unknown as Parameters<typeof botToTavernCard>[0],
    knowledgeEntries.map((entry) => ({
      entry: entry.entry,
      activation_settings: entry.activation_settings,
      positioning: entry.positioning,
    })),
  )

  return { bot, cardData }
}

function buildPngResponse(resultPng: Buffer, botName: string): NextResponse {
  const safeName = botName
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 100)

  const pngBytes = new Uint8Array(resultPng)

  return new NextResponse(pngBytes, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="${safeName}.png"`,
      'Content-Length': pngBytes.byteLength.toString(),
    },
  })
}

/**
 * POST: Client sends a PNG image in the request body.
 * The card metadata is embedded into the provided PNG.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Bot ID is required' }, { status: 400 })
    }

    const result = await buildCardExport(request, id)
    if ('error' in result) return result.error

    const { bot, cardData } = result

    // Read the PNG image sent by the client
    let pngBuffer: Buffer | null = null
    const body = await request.arrayBuffer()
    if (body.byteLength > 0) {
      const buf = Buffer.from(body)
      if (isPng(buf)) {
        pngBuffer = buf
      }
    }

    const resultPng = embedTavernCardInPng(pngBuffer, cardData)
    return buildPngResponse(resultPng, bot.name)
  } catch (error: unknown) {
    console.error('[Export Card] Error:', error)
    const message = error instanceof Error ? error.message : 'Failed to export character card.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * GET: Server fetches the bot's profile picture from storage.
 * Falls back to minimal 1x1 PNG if image can't be retrieved.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Bot ID is required' }, { status: 400 })
    }

    const result = await buildCardExport(request, id)
    if ('error' in result) return result.error

    const { bot, cardData } = result

    // Try to fetch bot's profile picture
    let pngBuffer: Buffer | null = null
    const picture = bot.picture as { url?: string; mimeType?: string } | null
    if (picture && typeof picture === 'object' && picture.url) {
      try {
        // Resolve relative URLs against the request origin
        const imageUrl = picture.url.startsWith('http')
          ? picture.url
          : new URL(picture.url, request.url).toString()

        const imageResponse = await fetch(imageUrl)
        if (imageResponse.ok) {
          const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())
          if (isPng(imageBuffer)) {
            pngBuffer = imageBuffer
          }
        }
      } catch (fetchError) {
        console.error('[Export Card] Failed to fetch bot picture:', fetchError)
      }
    }

    const resultPng = embedTavernCardInPng(pngBuffer, cardData)
    return buildPngResponse(resultPng, bot.name)
  } catch (error: unknown) {
    console.error('[Export Card] Error:', error)
    const message = error instanceof Error ? error.message : 'Failed to export character card.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
