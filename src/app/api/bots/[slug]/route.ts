import { NextRequest, NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import config from '@payload-config'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    if (!slug) {
      return NextResponse.json(
        { message: 'Slug parameter is required' },
        { status: 400 }
      )
    }

    const payload = await getPayloadHMR({ config })

    const result = await payload.find({
      collection: 'bot',
      where: {
        slug: { equals: slug },
      },
      limit: 1,
    })

    if (result.docs.length === 0) {
      return NextResponse.json(
        { message: 'Bot not found' },
        { status: 404 }
      )
    }

    const bot = result.docs[0]

    return NextResponse.json(bot)
  } catch (error: any) {
    console.error('Error fetching bot:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to fetch bot' },
      { status: 500 }
    )
  }
}
