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

/**
 * Parse image dimensions from raw buffer by reading file headers.
 * Supports JPEG, PNG, GIF, and WebP without needing sharp or other native modules.
 */
function getImageDimensionsFromBuffer(
  buffer: Buffer,
  mimeType: string
): { width: number; height: number } | null {
  try {
    if (mimeType === 'image/png') {
      // PNG: width at bytes 16-19, height at bytes 20-23 (big-endian)
      if (buffer.length >= 24 && buffer[0] === 0x89 && buffer[1] === 0x50) {
        return {
          width: buffer.readUInt32BE(16),
          height: buffer.readUInt32BE(20),
        }
      }
    }

    if (mimeType === 'image/gif') {
      // GIF: width at bytes 6-7, height at bytes 8-9 (little-endian)
      if (buffer.length >= 10 && buffer[0] === 0x47 && buffer[1] === 0x49) {
        return {
          width: buffer.readUInt16LE(6),
          height: buffer.readUInt16LE(8),
        }
      }
    }

    if (mimeType === 'image/webp') {
      // WebP: RIFF header, then check VP8 chunk
      if (buffer.length >= 30 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
        const chunk = buffer.toString('ascii', 12, 16)
        if (chunk === 'VP8 ' && buffer.length >= 30) {
          // Lossy VP8
          return {
            width: buffer.readUInt16LE(26) & 0x3fff,
            height: buffer.readUInt16LE(28) & 0x3fff,
          }
        }
        if (chunk === 'VP8L' && buffer.length >= 25) {
          // Lossless VP8L
          const bits = buffer.readUInt32LE(21)
          return {
            width: (bits & 0x3fff) + 1,
            height: ((bits >> 14) & 0x3fff) + 1,
          }
        }
        if (chunk === 'VP8X' && buffer.length >= 30) {
          // Extended VP8X
          return {
            width: ((buffer[24] | (buffer[25] << 8) | (buffer[26] << 16)) + 1),
            height: ((buffer[27] | (buffer[28] << 8) | (buffer[29] << 16)) + 1),
          }
        }
      }
    }

    if (mimeType === 'image/jpeg') {
      // JPEG: scan for SOF markers (0xFF 0xC0-0xCF, except 0xC4 and 0xC8)
      let offset = 2 // skip SOI marker
      while (offset < buffer.length - 1) {
        if (buffer[offset] !== 0xff) break
        const marker = buffer[offset + 1]
        // SOF markers (0xC0-0xCF except 0xC4 DHT and 0xC8 JPG extension)
        if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8) {
          if (offset + 9 < buffer.length) {
            return {
              height: buffer.readUInt16BE(offset + 5),
              width: buffer.readUInt16BE(offset + 7),
            }
          }
        }
        // Skip to next marker
        if (offset + 3 < buffer.length) {
          const segmentLength = buffer.readUInt16BE(offset + 2)
          offset += 2 + segmentLength
        } else {
          break
        }
      }
    }
  } catch {
    // If parsing fails, return null and skip dimension validation
  }

  return null
}

// Dimension constraints
const MAX_DIMENSION = 6000
const MIN_DIMENSION = 50

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
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(1)
      return NextResponse.json(
        { error: `Image is too large (${fileSizeMB}MB). Maximum file size is 5MB. Try compressing the image or using a smaller resolution.` },
        { status: 400 }
      )
    }

    // Check file type
    if (!SUPPORTED_TYPES.includes(file.type)) {
      const ext = file.name.split('.').pop()?.toUpperCase() || 'unknown'
      return NextResponse.json(
        { error: `Unsupported image format "${ext}". Please use PNG, JPG, GIF, or WebP.` },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Validate image dimensions server-side (header parsing, no native deps)
    const dimensions = getImageDimensionsFromBuffer(buffer, file.type)
    if (dimensions) {
      const { width, height } = dimensions

      if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
        return NextResponse.json(
          { error: `Image is too small (${width}x${height}px). Minimum size is ${MIN_DIMENSION}x${MIN_DIMENSION}px.` },
          { status: 400 }
        )
      }

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        return NextResponse.json(
          { error: `Image is too large (${width}x${height}px). Maximum size is ${MAX_DIMENSION}x${MAX_DIMENSION}px. Please resize the image.` },
          { status: 400 }
        )
      }
    }

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
      dimensions,
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
