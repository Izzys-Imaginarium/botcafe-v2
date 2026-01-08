import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import * as pdfParse from 'pdf-parse'

export const dynamic = 'force-dynamic'

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    // Get authenticated Clerk user
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 })
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // Get file type
    const fileType = file.type
    const fileName = file.name
    const fileExtension = fileName.split('.').pop()?.toLowerCase()

    // Supported file types
    const supportedTypes = [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    ]

    const supportedExtensions = ['pdf', 'txt', 'md', 'docx']

    if (!supportedTypes.includes(fileType) && !supportedExtensions.includes(fileExtension || '')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unsupported file type. Supported types: PDF, TXT, MD, DOCX',
        },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Extract text based on file type
    let extractedText = ''
    let error: string | null = null

    try {
      if (fileType === 'application/pdf' || fileExtension === 'pdf') {
        // Extract text from PDF
        const pdfData = await (pdfParse as any).default(buffer)
        extractedText = pdfData.text
      } else if (fileType === 'text/plain' || fileExtension === 'txt' || fileExtension === 'md') {
        // Plain text or markdown
        extractedText = buffer.toString('utf-8')
      } else if (
        fileType ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileExtension === 'docx'
      ) {
        // For DOCX, we'd need mammoth library - for now, return error
        error = 'DOCX support coming soon. Please use PDF or TXT for now.'
        return NextResponse.json({ success: false, message: error }, { status: 400 })
      }
    } catch (extractionError: any) {
      console.error('Text extraction error:', extractionError)
      return NextResponse.json(
        {
          success: false,
          message: `Failed to extract text from file: ${extractionError.message}`,
        },
        { status: 500 }
      )
    }

    // Check if we extracted any text
    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'No text could be extracted from the file. The file may be empty or corrupted.',
        },
        { status: 400 }
      )
    }

    // Upload file to R2 via Payload Media collection
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Find or create user in Payload
    const users = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: clerkUser.emailAddresses[0]?.emailAddress,
        },
      },
      overrideAccess: true,
    })

    if (users.docs.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found in database' },
        { status: 404 }
      )
    }

    const payloadUser = users.docs[0]

    // Create media entry (this will upload to R2 automatically)
    const mediaEntry = await payload.create({
      collection: 'media',
      data: {
        alt: `Uploaded document: ${fileName}`,
      },
      file: {
        data: buffer,
        mimetype: fileType,
        name: fileName,
        size: file.size,
      },
      user: payloadUser,
    })

    // Calculate token estimate (rough: 1 token ≈ 4 characters)
    const tokenEstimate = Math.ceil(extractedText.length / 4)

    // Return success with extracted text and R2 file key
    return NextResponse.json({
      success: true,
      data: {
        text: extractedText,
        fileName,
        fileSize: file.size,
        fileType,
        tokenEstimate,
        r2FileKey: mediaEntry.id, // Media ID can be used as R2 reference
        mediaId: mediaEntry.id,
        wordCount: extractedText.split(/\s+/).length,
      },
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to upload file' },
      { status: 500 }
    )
  }
}
