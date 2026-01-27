import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

// Maximum file size: 5MB for images
const MAX_FILE_SIZE = 5 * 1024 * 1024

// Supported image types
const SUPPORTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]

export async function POST(request: NextRequest) {
  try {
    // Get authenticated Clerk user
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const alt = formData.get('alt') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    // Check file type
    if (!SUPPORTED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Supported types: JPEG, PNG, GIF, WebP' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Get Payload instance
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

    if (users.docs.length === 0) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      )
    }

    const payloadUser = users.docs[0]

    // Log upload attempt for debugging
    console.log('[Image Upload] Attempting upload:', {
      filename: file.name,
      size: file.size,
      type: file.type,
      bufferLength: buffer.length,
    })

    // Create media entry (this will upload to R2 automatically)
    let mediaEntry
    try {
      mediaEntry = await payload.create({
        collection: 'media',
        data: {
          alt: alt || `Image uploaded by ${payloadUser.email}`,
        },
        file: {
          data: buffer,
          mimetype: file.type,
          name: file.name,
          size: file.size,
        },
        user: payloadUser,
      })
    } catch (payloadError: any) {
      console.error('[Image Upload] Payload create error:', payloadError)
      console.error('[Image Upload] Error details:', {
        name: payloadError.name,
        message: payloadError.message,
        data: payloadError.data,
        errors: payloadError.errors,
      })

      // Provide a more specific error message
      let errorMessage = 'Failed to process image'
      if (payloadError.message?.includes('sharp')) {
        errorMessage = 'Image processing failed. Try a different image or convert to JPG.'
      } else if (payloadError.message) {
        errorMessage = payloadError.message
      }

      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }

    console.log('[Image Upload] Success:', { id: mediaEntry.id, url: mediaEntry.url })

    // Return success with media data in Payload format
    return NextResponse.json({
      doc: mediaEntry,
      message: 'Image uploaded successfully',
    })
  } catch (error: any) {
    console.error('Image upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload image' },
      { status: 500 }
    )
  }
}
