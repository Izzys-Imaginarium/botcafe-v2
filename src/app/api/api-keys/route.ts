import { NextRequest, NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import { currentUser } from '@clerk/nextjs/server'
import config from '@payload-config'
import type { ApiKey } from '@/payload-types'

// GET - List all API keys for the current user
export async function GET(request: NextRequest) {
  try {
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    let payload
    try {
      payload = await getPayloadHMR({ config })
    } catch (dbError) {
      console.error('Database connection error:', dbError)
      return NextResponse.json({
        keys: [],
        total: 0,
      })
    }

    // Find the Payload user by email
    const payloadUsers = await payload.find({
      collection: 'users',
      where: {
        email: { equals: clerkUser.emailAddresses[0]?.emailAddress },
      },
      limit: 1,
    })

    if (payloadUsers.docs.length === 0) {
      return NextResponse.json({
        keys: [],
        total: 0,
      })
    }

    const payloadUser = payloadUsers.docs[0]

    // Fetch all API keys for this user
    const result = await payload.find({
      collection: 'api-key',
      where: {
        user: { equals: payloadUser.id },
      },
      sort: '-createdAt',
      limit: 100,
    })

    // Don't return the actual key values, just metadata
    const safeKeys = result.docs.map((key) => ({
      id: key.id,
      nickname: key.nickname,
      provider: key.provider,
      is_active: key.security_features?.is_active ?? true,
      last_used: key.security_features?.last_used,
      createdAt: key.createdAt,
      // Show only last 4 characters of the key
      key_preview: key.key ? `...${key.key.slice(-4)}` : null,
    }))

    return NextResponse.json({
      keys: safeKeys,
      total: result.totalDocs,
    })
  } catch (error: any) {
    console.error('Error fetching API keys:', error)
    return NextResponse.json({
      keys: [],
      total: 0,
    })
  }
}

// POST - Create a new API key
export async function POST(request: NextRequest) {
  try {
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as { nickname?: string; provider?: ApiKey['provider']; key?: string }
    const { nickname, provider, key } = body

    if (!nickname || !provider || !key) {
      return NextResponse.json(
        { message: 'Missing required fields: nickname, provider, key' },
        { status: 400 }
      )
    }

    let payload
    try {
      payload = await getPayloadHMR({ config })
    } catch (dbError) {
      console.error('Database connection error:', dbError)
      return NextResponse.json({ message: 'Database connection error' }, { status: 500 })
    }

    // Find the Payload user by email
    const payloadUsers = await payload.find({
      collection: 'users',
      where: {
        email: { equals: clerkUser.emailAddresses[0]?.emailAddress },
      },
      limit: 1,
    })

    if (payloadUsers.docs.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    const payloadUser = payloadUsers.docs[0]

    // Create the API key
    const newKey = await payload.create({
      collection: 'api-key',
      data: {
        user: payloadUser.id,
        nickname,
        provider,
        key,
        security_features: {
          is_active: true,
          key_encryption_level: 'basic',
        },
      },
    })

    return NextResponse.json({
      id: newKey.id,
      nickname: newKey.nickname,
      provider: newKey.provider,
      is_active: true,
      createdAt: newKey.createdAt,
      key_preview: `...${key.slice(-4)}`,
    })
  } catch (error: any) {
    console.error('Error creating API key:', error)
    return NextResponse.json({ message: error.message || 'Failed to create API key' }, { status: 500 })
  }
}
