import { NextRequest, NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import { currentUser } from '@clerk/nextjs/server'
import config from '@payload-config'

// DELETE - Delete an API key
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

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
      overrideAccess: true,
    })

    if (payloadUsers.docs.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    const payloadUser = payloadUsers.docs[0]

    // Find the API key and verify ownership
    const existingKey = await payload.findByID({
      collection: 'api-key',
      id,
      overrideAccess: true,
    })

    if (!existingKey) {
      return NextResponse.json({ message: 'API key not found' }, { status: 404 })
    }

    // Check ownership
    const keyUserId = typeof existingKey.user === 'object' ? existingKey.user.id : existingKey.user
    if (keyUserId !== payloadUser.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 })
    }

    // Delete the API key
    await payload.delete({
      collection: 'api-key',
      id,
      overrideAccess: true,
    })

    return NextResponse.json({ message: 'API key deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting API key:', error)
    return NextResponse.json({ message: error.message || 'Failed to delete API key' }, { status: 500 })
  }
}

// PATCH - Update an API key (toggle active status, update nickname)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = (await request.json()) as { nickname?: string; is_active?: boolean }

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
      overrideAccess: true,
    })

    if (payloadUsers.docs.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    const payloadUser = payloadUsers.docs[0]

    // Find the API key and verify ownership
    const existingKey = await payload.findByID({
      collection: 'api-key',
      id,
      overrideAccess: true,
    })

    if (!existingKey) {
      return NextResponse.json({ message: 'API key not found' }, { status: 404 })
    }

    // Check ownership
    const keyUserId = typeof existingKey.user === 'object' ? existingKey.user.id : existingKey.user
    if (keyUserId !== payloadUser.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 })
    }

    // Build update data
    const updateData: Record<string, any> = {}

    if (body.nickname !== undefined) {
      updateData.nickname = body.nickname
    }

    if (body.is_active !== undefined) {
      updateData.security_features = {
        ...existingKey.security_features,
        is_active: body.is_active,
      }
    }

    // Update the API key
    const updatedKey = await payload.update({
      collection: 'api-key',
      id,
      data: updateData,
      overrideAccess: true,
    })

    return NextResponse.json({
      id: updatedKey.id,
      nickname: updatedKey.nickname,
      provider: updatedKey.provider,
      is_active: updatedKey.security_features?.is_active ?? true,
      last_used: updatedKey.security_features?.last_used,
      createdAt: updatedKey.createdAt,
    })
  } catch (error: any) {
    console.error('Error updating API key:', error)
    return NextResponse.json({ message: error.message || 'Failed to update API key' }, { status: 500 })
  }
}
