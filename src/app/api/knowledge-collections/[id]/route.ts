import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import config from '@payload-config'
import { checkResourceAccess } from '@/lib/permissions/check-access'

export const dynamic = 'force-dynamic'

interface CollectionUpdateRequest {
  name?: string
  description?: string
  sharing_settings?: {
    sharing_level?: 'private' | 'shared' | 'public'
    allow_collaboration?: boolean
    allow_fork?: boolean
    collaboration_requests?: boolean
    is_public?: boolean
    sharing_expiration?: string
    share_password?: string
  }
  collection_metadata?: {
    category?: string
    difficulty_level?: string
  }
}

// GET - Fetch a single collection by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const numericId = parseInt(id, 10)

    if (isNaN(numericId)) {
      return NextResponse.json(
        { message: 'Invalid collection ID' },
        { status: 400 }
      )
    }

    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json(
        { message: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
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
      return NextResponse.json(
        { message: 'User not synced yet. Please try again.' },
        { status: 404 }
      )
    }

    const payloadUser = payloadUsers.docs[0]

    const collection = await payload.findByID({
      collection: 'knowledgeCollections',
      id: numericId,
      overrideAccess: true,
    })

    if (!collection) {
      return NextResponse.json(
        { message: 'Collection not found' },
        { status: 404 }
      )
    }

    // Check if user has at least readonly access
    const accessResult = await checkResourceAccess(payload, payloadUser.id, 'knowledgeCollection', numericId)
    if (!accessResult.hasAccess) {
      return NextResponse.json(
        { message: 'Unauthorized - You do not have access to this collection' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      collection,
    })
  } catch (error: any) {
    console.error('Error fetching collection:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to fetch collection' },
      { status: 500 }
    )
  }
}

// PATCH - Update a collection
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const numericId = parseInt(id, 10)

    if (isNaN(numericId)) {
      return NextResponse.json(
        { message: 'Invalid collection ID' },
        { status: 400 }
      )
    }

    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json(
        { message: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    const body = (await request.json()) as CollectionUpdateRequest

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
      return NextResponse.json(
        { message: 'User not synced yet. Please try again.' },
        { status: 404 }
      )
    }

    const payloadUser = payloadUsers.docs[0]

    // Fetch existing collection
    const existingCollection = await payload.findByID({
      collection: 'knowledgeCollections',
      id: numericId,
      overrideAccess: true,
    })

    if (!existingCollection) {
      return NextResponse.json(
        { message: 'Collection not found' },
        { status: 404 }
      )
    }

    // Check if user has at least editor permission
    const accessResult = await checkResourceAccess(payload, payloadUser.id, 'knowledgeCollection', numericId)
    if (!accessResult.hasAccess) {
      return NextResponse.json(
        { message: 'Unauthorized - You do not have access to this collection' },
        { status: 403 }
      )
    }

    if (accessResult.permission !== 'owner' && accessResult.permission !== 'editor') {
      return NextResponse.json(
        { message: 'Unauthorized - You do not have permission to edit this collection' },
        { status: 403 }
      )
    }

    // Only owners can change sharing settings
    if (body.sharing_settings && accessResult.permission !== 'owner') {
      return NextResponse.json(
        { message: 'Only owners can change sharing settings' },
        { status: 403 }
      )
    }

    // IMPORTANT: Lore books cannot be made public from the API - only via Payload admin
    if (body.sharing_settings?.sharing_level === 'public') {
      return NextResponse.json(
        { message: 'Lore books cannot be made public from this interface. Please contact an administrator.' },
        { status: 403 }
      )
    }

    // Build update data - only include fields that were provided
    const updateData: Record<string, any> = {}

    if (body.name !== undefined) {
      updateData.name = body.name
    }

    if (body.description !== undefined) {
      updateData.description = body.description
    }

    if (body.sharing_settings) {
      // Merge with existing sharing_settings
      updateData.sharing_settings = {
        // @ts-ignore
        ...existingCollection.sharing_settings,
        ...body.sharing_settings,
        last_updated: new Date().toISOString(),
      }
    }

    if (body.collection_metadata) {
      updateData.collection_metadata = {
        // @ts-ignore
        ...existingCollection.collection_metadata,
        ...body.collection_metadata,
      }
    }

    // Update the collection
    const updatedCollection = await payload.update({
      collection: 'knowledgeCollections',
      id: numericId,
      data: updateData,
      overrideAccess: true,
    })

    return NextResponse.json({
      success: true,
      message: 'Collection updated successfully',
      collection: updatedCollection,
    })
  } catch (error: any) {
    console.error('Error updating collection:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to update collection' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const numericId = parseInt(id, 10)

    if (isNaN(numericId)) {
      return NextResponse.json(
        { message: 'Invalid collection ID' },
        { status: 400 }
      )
    }

    // Get authenticated Clerk user
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return NextResponse.json(
        { message: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    // Get Payload instance
    const payload = await getPayloadHMR({ config })

    // Find Payload user by email
    const payloadUsers = await payload.find({
      collection: 'users',
      where: {
        email: { equals: clerkUser.emailAddresses[0]?.emailAddress },
      },
      limit: 1,
      overrideAccess: true,
    })

    if (payloadUsers.docs.length === 0) {
      return NextResponse.json(
        { message: 'User not synced yet. Please try again.' },
        { status: 404 }
      )
    }

    const payloadUser = payloadUsers.docs[0]

    // Fetch the collection
    const collection = await payload.findByID({
      collection: 'knowledgeCollections',
      id: numericId,
      overrideAccess: true,
    })

    if (!collection) {
      return NextResponse.json(
        { message: 'Collection not found' },
        { status: 404 }
      )
    }

    // Only owners can delete collections
    const accessResult = await checkResourceAccess(payload, payloadUser.id, 'knowledgeCollection', numericId)
    if (!accessResult.hasAccess || accessResult.permission !== 'owner') {
      return NextResponse.json(
        { message: 'Only owners can delete this collection' },
        { status: 403 }
      )
    }

    // Clean up FK constraints before deletion using D1 SQL directly
    // SQLite CASCADE doesn't work reliably in D1, so we delete explicitly
    const d1 = (payload.db as any).client as D1Database

    console.log(`[KnowledgeCollection Delete ${numericId}] Starting FK cleanup`)

    if (d1) {
      // First: clean up FKs pointing to knowledge entries in this collection
      const knowledgeCleanup = [
        // Required FK: knowledge_activation_log.knowledge_entry_id -> delete logs
        { name: 'knowledge_activation_log', sql: 'DELETE FROM knowledge_activation_log WHERE knowledge_entry_id_id IN (SELECT id FROM knowledge WHERE knowledge_collection_id = ?)' },
        // Optional FK: memory.lore_entry -> nullify
        { name: 'memory (nullify lore_entry)', sql: 'UPDATE memory SET lore_entry_id = NULL WHERE lore_entry_id IN (SELECT id FROM knowledge WHERE knowledge_collection_id = ?)' },
        // Knowledge entry child tables
        { name: 'knowledge_tags', sql: 'DELETE FROM knowledge_tags WHERE _parent_id IN (SELECT id FROM knowledge WHERE knowledge_collection_id = ?)' },
        { name: 'knowledge_activation_settings_primary_keys', sql: 'DELETE FROM knowledge_activation_settings_primary_keys WHERE _parent_id IN (SELECT id FROM knowledge WHERE knowledge_collection_id = ?)' },
        { name: 'knowledge_activation_settings_secondary_keys', sql: 'DELETE FROM knowledge_activation_settings_secondary_keys WHERE _parent_id IN (SELECT id FROM knowledge WHERE knowledge_collection_id = ?)' },
        { name: 'knowledge_filtering_allowed_bot_ids', sql: 'DELETE FROM knowledge_filtering_allowed_bot_ids WHERE _parent_id IN (SELECT id FROM knowledge WHERE knowledge_collection_id = ?)' },
        { name: 'knowledge_filtering_excluded_bot_ids', sql: 'DELETE FROM knowledge_filtering_excluded_bot_ids WHERE _parent_id IN (SELECT id FROM knowledge WHERE knowledge_collection_id = ?)' },
        { name: 'knowledge_filtering_allowed_persona_ids', sql: 'DELETE FROM knowledge_filtering_allowed_persona_ids WHERE _parent_id IN (SELECT id FROM knowledge WHERE knowledge_collection_id = ?)' },
        { name: 'knowledge_filtering_excluded_persona_ids', sql: 'DELETE FROM knowledge_filtering_excluded_persona_ids WHERE _parent_id IN (SELECT id FROM knowledge WHERE knowledge_collection_id = ?)' },
        // Knowledge _rels and locked docs
        { name: 'knowledge_rels', sql: 'DELETE FROM knowledge_rels WHERE parent_id IN (SELECT id FROM knowledge WHERE knowledge_collection_id = ?)' },
        { name: 'payload_locked_documents_rels (knowledge)', sql: 'DELETE FROM payload_locked_documents_rels WHERE knowledge_id IN (SELECT id FROM knowledge WHERE knowledge_collection_id = ?)' },
        // Delete knowledge entries themselves
        { name: 'knowledge', sql: 'DELETE FROM knowledge WHERE knowledge_collection_id = ?' },
      ]

      for (const table of knowledgeCleanup) {
        try {
          const result = await d1.prepare(table.sql).bind(numericId).run()
          console.log(`[KnowledgeCollection Delete ${numericId}] ${table.name}: OK, rows affected:`, result.meta?.changes ?? 'unknown')
        } catch (e: any) {
          console.error(`[KnowledgeCollection Delete ${numericId}] ${table.name}: FAILED -`, e.message || e)
        }
      }

      // Second: clean up FKs pointing to this collection
      const collectionCleanup = [
        // hasMany _rels: bot.knowledge_collections
        { name: 'bot_rels (knowledge_collections)', sql: 'DELETE FROM bot_rels WHERE knowledge_collections_id = ?' },
        // Optional FK: conversation.memory_tome -> nullify
        { name: 'conversation (nullify memory_tome)', sql: 'UPDATE conversation SET memory_tome_id = NULL WHERE memory_tome_id = ?' },
        // Access control entries for this collection
        { name: 'access_control', sql: `DELETE FROM access_control WHERE resource_type = 'knowledgeCollection' AND resource_id = ?` },
        // Clean up locked documents
        { name: 'payload_locked_documents_rels', sql: 'DELETE FROM payload_locked_documents_rels WHERE knowledge_collections_id = ?' },
        // Own _rels table
        { name: 'knowledge_collections_rels', sql: 'DELETE FROM knowledge_collections_rels WHERE parent_id = ?' },
        // Child array tables (Payload creates these for array fields with _parent_id FK)
        { name: 'knowledge_collections_collaborators_collab_user_ids', sql: 'DELETE FROM knowledge_collections_collaborators_collab_user_ids WHERE _parent_id = ?' },
        { name: 'knowledge_collections_collaborators_collab_perms', sql: 'DELETE FROM knowledge_collections_collaborators_collab_perms WHERE _parent_id = ?' },
        { name: 'knowledge_collections_collection_metadata_tags', sql: 'DELETE FROM knowledge_collections_collection_metadata_tags WHERE _parent_id = ?' },
      ]

      for (const table of collectionCleanup) {
        try {
          // access_control.resource_id is stored as text
          const bindValue = table.name === 'access_control' ? String(numericId) : numericId
          const result = await d1.prepare(table.sql).bind(bindValue).run()
          console.log(`[KnowledgeCollection Delete ${numericId}] ${table.name}: OK, rows affected:`, result.meta?.changes ?? 'unknown')
        } catch (e: any) {
          console.error(`[KnowledgeCollection Delete ${numericId}] ${table.name}: FAILED -`, e.message || e)
        }
      }
    } else {
      console.error(`[KnowledgeCollection Delete ${numericId}] D1 client not available!`)
    }

    // Delete the collection
    try {
      await payload.delete({
        collection: 'knowledgeCollections',
        id: numericId,
        overrideAccess: true,
      })
      console.log(`[KnowledgeCollection Delete ${numericId}] Collection deleted successfully via Payload`)
    } catch (payloadDeleteError: any) {
      // Payload delete failed — likely an uncovered FK constraint
      // Fall back to direct D1 delete
      console.warn(`[KnowledgeCollection Delete ${numericId}] Payload delete failed: ${payloadDeleteError.message}. Attempting D1 direct delete...`)
      if (d1) {
        try {
          await d1.prepare('DELETE FROM knowledge_collections WHERE id = ?').bind(numericId).run()
          console.log(`[KnowledgeCollection Delete ${numericId}] Collection deleted successfully via D1 fallback`)
        } catch (d1Error: any) {
          console.error(`[KnowledgeCollection Delete ${numericId}] D1 fallback also failed:`, d1Error.message)
          throw payloadDeleteError
        }
      } else {
        throw payloadDeleteError
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Collection deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting collection:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to delete collection' },
      { status: 500 }
    )
  }
}
