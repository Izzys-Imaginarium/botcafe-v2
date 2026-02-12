import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { extractTavernCardFromPng, parseCardJson, tavernCardToBotFormData } from '@/lib/tavern-card'
import type { TavernCardV2Data } from '@/lib/tavern-card'

export const dynamic = 'force-dynamic'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: NextRequest) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ error: 'Please sign in to import character cards.' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(1)
      return NextResponse.json(
        { error: `File is too large (${sizeMB}MB). Maximum size is 10MB.` },
        { status: 400 },
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Detect file type and parse accordingly
    const isPng =
      buffer.length >= 4 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47

    const isJson =
      file.name.toLowerCase().endsWith('.json') || file.type === 'application/json'

    let parsed
    if (isPng) {
      parsed = extractTavernCardFromPng(buffer)
    } else if (isJson) {
      const jsonString = buffer.toString('utf-8')
      parsed = parseCardJson(jsonString)
    } else {
      return NextResponse.json(
        { error: 'Unsupported file format. Please upload a PNG character card or a JSON character card file.' },
        { status: 400 },
      )
    }

    // Convert to BotFormData shape
    const botFormData = tavernCardToBotFormData(parsed.data, parsed.version)

    // Upload the PNG as a media item if we have an image
    let pictureId: string | number | undefined
    let pictureUrl: string | undefined

    if (isPng && parsed.imageBuffer) {
      try {
        const payloadConfig = await config
        const payload = await getPayload({ config: payloadConfig })

        // Find user in Payload
        const users = await payload.find({
          collection: 'users',
          where: {
            email: { equals: clerkUser.emailAddresses[0]?.emailAddress },
          },
          limit: 1,
        })

        if (users.docs.length > 0) {
          const payloadUser = users.docs[0]

          const mediaEntry = await payload.create({
            collection: 'media',
            data: {
              alt: `${botFormData.name || 'Imported character'} profile picture`,
            },
            file: {
              data: parsed.imageBuffer,
              mimetype: 'image/png',
              name: file.name || 'character-card.png',
              size: parsed.imageBuffer.length,
            },
            user: payloadUser,
          })

          pictureId = mediaEntry.id
          pictureUrl = mediaEntry.url || undefined
        }
      } catch (uploadError) {
        // Non-fatal: picture upload failed but we can still import the card data
        console.error('[Import Card] Failed to upload picture:', uploadError)
      }
    }

    // Extract character book info if present (V2 only)
    let characterBook = undefined
    if (parsed.version === 'v2') {
      const v2data = parsed.data as TavernCardV2Data
      if (v2data.character_book && v2data.character_book.entries.length > 0) {
        characterBook = v2data.character_book
      }
    }

    return NextResponse.json({
      success: true,
      formData: botFormData,
      pictureId,
      pictureUrl,
      characterBook: characterBook || null,
      characterBookSummary: characterBook
        ? {
            name: characterBook.name || 'Imported Lore',
            entryCount: characterBook.entries.length,
          }
        : null,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to import character card.'
    console.error('[Import Card] Error:', error)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
