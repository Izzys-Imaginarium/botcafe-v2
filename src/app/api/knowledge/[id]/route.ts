import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import config from '@payload-config'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import {
  deleteVectorsBySource,
  generateEmbeddings,
  insertVectors,
  VectorRecord,
  VectorMetadata,
  BGE_M3_MODEL,
  BGE_M3_DIMENSIONS,
} from '@/lib/vectorization/embeddings'
import { chunkText, getChunkConfig } from '@/lib/vectorization/chunking'

export const dynamic = 'force-dynamic'

interface ActivationSettings {
  activation_mode?: 'keyword' | 'vector' | 'hybrid' | 'constant' | 'disabled'
  primary_keys?: string[]
  secondary_keys?: string[]
  keywords_logic?: 'AND_ANY' | 'AND_ALL' | 'NOT_ALL' | 'NOT_ANY'
  case_sensitive?: boolean
  match_whole_words?: boolean
  use_regex?: boolean
  vector_similarity_threshold?: number
  max_vector_results?: number
  probability?: number
  use_probability?: boolean
  scan_depth?: number
  match_in_user_messages?: boolean
  match_in_bot_messages?: boolean
  match_in_system_prompts?: boolean
}

interface Positioning {
  position?: 'before_character' | 'after_character' | 'before_examples' | 'after_examples' | 'at_depth' | 'system_top' | 'system_bottom'
  depth?: number
  role?: 'system' | 'user' | 'assistant'
  order?: number
}

interface AdvancedActivation {
  sticky?: number
  cooldown?: number
  delay?: number
}

interface Filtering {
  filter_by_bots?: boolean
  allowed_bot_ids?: number[]
  excluded_bot_ids?: number[]
  filter_by_personas?: boolean
  allowed_persona_ids?: number[]
  excluded_persona_ids?: number[]
}

interface BudgetControl {
  ignore_budget?: boolean
  max_tokens?: number
}

interface KnowledgeUpdateRequest {
  entry?: string
  type?: 'text' | 'document' | 'url' | 'image' | 'audio' | 'video' | 'legacy_memory'
  knowledge_collection?: string | number
  tags?: { tag: string }[]
  applies_to_bots?: (string | number)[]
  activation_settings?: ActivationSettings
  positioning?: Positioning
  advanced_activation?: AdvancedActivation
  filtering?: Filtering
  budget_control?: BudgetControl
  privacy_settings?: {
    privacy_level?: 'private' | 'shared' | 'public'
    allow_sharing?: boolean
  }
}

// GET - Fetch a single knowledge entry by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const numericId = parseInt(id, 10)

    if (isNaN(numericId)) {
      return NextResponse.json(
        { message: 'Invalid knowledge entry ID' },
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

    const knowledge = await payload.findByID({
      collection: 'knowledge',
      id: numericId,
      overrideAccess: true,
    })

    if (!knowledge) {
      return NextResponse.json(
        { message: 'Knowledge entry not found' },
        { status: 404 }
      )
    }

    // Check ownership
    // @ts-ignore
    const isOwner = knowledge.user === payloadUser.id || knowledge.user?.id === payloadUser.id

    if (!isOwner) {
      return NextResponse.json(
        { message: 'Unauthorized - You do not have access to this entry' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      knowledge,
    })
  } catch (error: any) {
    console.error('Error fetching knowledge entry:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to fetch knowledge entry' },
      { status: 500 }
    )
  }
}

// PATCH - Update a knowledge entry
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const numericId = parseInt(id, 10)

    if (isNaN(numericId)) {
      return NextResponse.json(
        { message: 'Invalid knowledge entry ID' },
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

    const body = (await request.json()) as KnowledgeUpdateRequest

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

    // Fetch existing entry to verify ownership
    const existingKnowledge = await payload.findByID({
      collection: 'knowledge',
      id: numericId,
      overrideAccess: true,
    })

    if (!existingKnowledge) {
      return NextResponse.json(
        { message: 'Knowledge entry not found' },
        { status: 404 }
      )
    }

    // @ts-ignore
    if (existingKnowledge.user !== payloadUser.id && existingKnowledge.user?.id !== payloadUser.id) {
      return NextResponse.json(
        { message: 'Unauthorized - You do not own this knowledge entry' },
        { status: 403 }
      )
    }

    // Check if content changed (requires re-vectorization)
    // @ts-ignore
    const contentChanged = body.entry !== undefined && body.entry !== existingKnowledge.entry
    // @ts-ignore
    const wasVectorized = existingKnowledge.is_vectorized

    // Check if activation mode is changing to/from vector-compatible modes
    // @ts-ignore
    const oldActivationMode = existingKnowledge.activation_settings?.activation_mode
    const newActivationMode = body.activation_settings?.activation_mode
    const modeChanged = newActivationMode !== undefined && newActivationMode !== oldActivationMode
    const isVectorCompatible = (mode: string | undefined) => mode === 'vector' || mode === 'hybrid'
    const wasVectorCompatible = isVectorCompatible(oldActivationMode)
    const willBeVectorCompatible = newActivationMode !== undefined
      ? isVectorCompatible(newActivationMode)
      : wasVectorCompatible

    // Determine if we need to delete vectors from Vectorize
    const shouldDeleteVectors = wasVectorized && (
      contentChanged || // Content changed, need to re-vectorize
      (modeChanged && !willBeVectorCompatible) // Switching away from vector modes
    )

    // If we need to delete vectors, delete from both D1 and Vectorize
    if (shouldDeleteVectors) {
      try {
        // Delete from D1 (VectorRecords)
        const vectorRecords = await payload.find({
          collection: 'vectorRecords',
          where: {
            and: [
              { source_type: { equals: 'knowledge' } },
              { source_id: { equals: String(numericId) } },
            ],
          },
          limit: 100,
          overrideAccess: true,
        })

        for (const record of vectorRecords.docs) {
          await payload.delete({
            collection: 'vectorRecords',
            id: record.id,
            overrideAccess: true,
          })
        }

        console.log(`Deleted ${vectorRecords.docs.length} old vector records from D1 for knowledge ${numericId}`)

        // Delete from Cloudflare Vectorize
        try {
          const { env } = await getCloudflareContext()
          const vectorize = env.VECTORIZE
          if (vectorize) {
            await deleteVectorsBySource(vectorize, 'knowledge', String(numericId))
            console.log(`Deleted vectors from Vectorize for knowledge ${numericId}`)
          }
        } catch (vectorizeError) {
          console.error('Error deleting from Vectorize:', vectorizeError)
        }
      } catch (vectorError) {
        console.error('Error deleting old vectors:', vectorError)
      }
    }

    // Helper functions for array conversions
    const convertToKeywordArray = (keys?: string[]): { keyword: string }[] => {
      if (!keys || keys.length === 0) return []
      return keys.map(k => ({ keyword: k }))
    }
    const convertToBotIdArray = (ids?: number[]): { bot_id: number }[] => {
      if (!ids || ids.length === 0) return []
      return ids.map(id => ({ bot_id: id }))
    }
    const convertToPersonaIdArray = (ids?: number[]): { persona_id: number }[] => {
      if (!ids || ids.length === 0) return []
      return ids.map(id => ({ persona_id: id }))
    }

    // Build update data - only include fields that were provided
    const updateData: Record<string, any> = {}

    if (body.entry !== undefined) {
      updateData.entry = body.entry
      updateData.tokens = Math.ceil(body.entry.length / 4)
      // Only set specific content_metadata fields to avoid SQL variable overflow
      updateData.content_metadata = {
        word_count: body.entry.split(/\s+/).length,
        processing_status: contentChanged && wasVectorized ? 'pending' : 'completed',
      }
      // Mark as not vectorized if content changed
      if (contentChanged) {
        updateData.is_vectorized = false
        updateData.chunk_count = 0
        // Note: Don't update vector_records relationship here to avoid "too many SQL variables" error
        // VectorRecords are deleted separately and can be queried by source_id
      }
    }

    // Also mark as not vectorized if switching away from vector modes
    if (shouldDeleteVectors) {
      updateData.is_vectorized = false
      updateData.chunk_count = 0
      // Note: Don't update vector_records relationship here to avoid SQL variable overflow
    }

    if (body.type !== undefined) {
      updateData.type = body.type
    }

    if (body.knowledge_collection !== undefined) {
      updateData.knowledge_collection = typeof body.knowledge_collection === 'string'
        ? parseInt(body.knowledge_collection)
        : body.knowledge_collection
    }

    // Only include tags if there are actual tags to avoid SQL variable overflow
    if (body.tags !== undefined && body.tags.length > 0) {
      updateData.tags = body.tags
    }

    // Only include applies_to_bots if there are values
    if (body.applies_to_bots !== undefined && body.applies_to_bots.length > 0) {
      updateData.applies_to_bots = body.applies_to_bots.map(id =>
        typeof id === 'string' ? parseInt(id) : id
      )
    }

    if (body.activation_settings) {
      // Build activation settings without arrays to avoid SQLite variable limits
      // Arrays are only included if they have values
      const activationData: Record<string, any> = {
        activation_mode: body.activation_settings.activation_mode,
        keywords_logic: body.activation_settings.keywords_logic,
        case_sensitive: body.activation_settings.case_sensitive,
        match_whole_words: body.activation_settings.match_whole_words,
        use_regex: body.activation_settings.use_regex,
        vector_similarity_threshold: body.activation_settings.vector_similarity_threshold,
        max_vector_results: body.activation_settings.max_vector_results,
        probability: body.activation_settings.probability,
        use_probability: body.activation_settings.use_probability,
        scan_depth: body.activation_settings.scan_depth,
        match_in_user_messages: body.activation_settings.match_in_user_messages,
        match_in_bot_messages: body.activation_settings.match_in_bot_messages,
        match_in_system_prompts: body.activation_settings.match_in_system_prompts,
      }
      // Only include keyword arrays if they have values
      const primaryKeys = body.activation_settings.primary_keys || []
      const secondaryKeys = body.activation_settings.secondary_keys || []
      if (primaryKeys.length > 0) {
        activationData.primary_keys = convertToKeywordArray(primaryKeys)
      }
      if (secondaryKeys.length > 0) {
        activationData.secondary_keys = convertToKeywordArray(secondaryKeys)
      }
      updateData.activation_settings = activationData
    }

    if (body.positioning) {
      updateData.positioning = {
        position: body.positioning.position,
        depth: body.positioning.depth,
        role: body.positioning.role,
        order: body.positioning.order,
      }
    }

    if (body.advanced_activation) {
      updateData.advanced_activation = {
        sticky: body.advanced_activation.sticky,
        cooldown: body.advanced_activation.cooldown,
        delay: body.advanced_activation.delay,
      }
    }

    if (body.filtering) {
      // Build filtering without arrays to avoid SQLite variable limits
      const filteringData: Record<string, any> = {
        filter_by_bots: body.filtering.filter_by_bots,
        filter_by_personas: body.filtering.filter_by_personas,
      }
      // Only include ID arrays if they have values
      const allowedBots = body.filtering.allowed_bot_ids || []
      const excludedBots = body.filtering.excluded_bot_ids || []
      const allowedPersonas = body.filtering.allowed_persona_ids || []
      const excludedPersonas = body.filtering.excluded_persona_ids || []
      if (allowedBots.length > 0) {
        filteringData.allowed_bot_ids = convertToBotIdArray(allowedBots)
      }
      if (excludedBots.length > 0) {
        filteringData.excluded_bot_ids = convertToBotIdArray(excludedBots)
      }
      if (allowedPersonas.length > 0) {
        filteringData.allowed_persona_ids = convertToPersonaIdArray(allowedPersonas)
      }
      if (excludedPersonas.length > 0) {
        filteringData.excluded_persona_ids = convertToPersonaIdArray(excludedPersonas)
      }
      updateData.filtering = filteringData
    }

    if (body.budget_control) {
      updateData.budget_control = {
        ignore_budget: body.budget_control.ignore_budget,
        max_tokens: body.budget_control.max_tokens,
      }
    }

    if (body.privacy_settings) {
      updateData.privacy_settings = {
        privacy_level: body.privacy_settings.privacy_level,
        allow_sharing: body.privacy_settings.allow_sharing,
      }
    }

    // Update the knowledge entry using D1 directly to avoid "too many SQL variables" error
    // Payload's update() expands nested groups into too many bind parameters for SQLite
    // Payload uses flat column names with underscores (e.g., activation_settings_activation_mode)
    let updatedKnowledge: any
    try {
      const { env } = await getCloudflareContext()
      const d1 = (env as any).D1

      if (d1) {
        // Build SET clauses and values for D1 update using Payload's column naming convention
        const setClauses: string[] = []
        const values: any[] = []

        if (body.entry !== undefined) {
          setClauses.push('entry = ?')
          values.push(body.entry)
          setClauses.push('tokens = ?')
          values.push(Math.ceil(body.entry.length / 4))
        }

        if (body.type !== undefined) {
          setClauses.push('type = ?')
          values.push(body.type)
        }

        if (body.knowledge_collection !== undefined) {
          setClauses.push('knowledge_collection_id = ?')
          values.push(typeof body.knowledge_collection === 'string'
            ? parseInt(body.knowledge_collection)
            : body.knowledge_collection)
        }

        if (contentChanged || shouldDeleteVectors) {
          setClauses.push('is_vectorized = ?')
          values.push(0)
          setClauses.push('chunk_count = ?')
          values.push(0)
        }

        // Handle activation_settings - Payload stores each field as a separate column
        if (body.activation_settings) {
          if (body.activation_settings.activation_mode !== undefined) {
            setClauses.push('activation_settings_activation_mode = ?')
            values.push(body.activation_settings.activation_mode)
          }
          if (body.activation_settings.keywords_logic !== undefined) {
            setClauses.push('activation_settings_keywords_logic = ?')
            values.push(body.activation_settings.keywords_logic)
          }
          if (body.activation_settings.case_sensitive !== undefined) {
            setClauses.push('activation_settings_case_sensitive = ?')
            values.push(body.activation_settings.case_sensitive ? 1 : 0)
          }
          if (body.activation_settings.match_whole_words !== undefined) {
            setClauses.push('activation_settings_match_whole_words = ?')
            values.push(body.activation_settings.match_whole_words ? 1 : 0)
          }
          if (body.activation_settings.use_regex !== undefined) {
            setClauses.push('activation_settings_use_regex = ?')
            values.push(body.activation_settings.use_regex ? 1 : 0)
          }
          if (body.activation_settings.vector_similarity_threshold !== undefined) {
            setClauses.push('activation_settings_vector_similarity_threshold = ?')
            values.push(body.activation_settings.vector_similarity_threshold)
          }
          if (body.activation_settings.max_vector_results !== undefined) {
            setClauses.push('activation_settings_max_vector_results = ?')
            values.push(body.activation_settings.max_vector_results)
          }
          if (body.activation_settings.probability !== undefined) {
            setClauses.push('activation_settings_probability = ?')
            values.push(body.activation_settings.probability)
          }
          if (body.activation_settings.use_probability !== undefined) {
            setClauses.push('activation_settings_use_probability = ?')
            values.push(body.activation_settings.use_probability ? 1 : 0)
          }
          if (body.activation_settings.scan_depth !== undefined) {
            setClauses.push('activation_settings_scan_depth = ?')
            values.push(body.activation_settings.scan_depth)
          }
          if (body.activation_settings.match_in_user_messages !== undefined) {
            setClauses.push('activation_settings_match_in_user_messages = ?')
            values.push(body.activation_settings.match_in_user_messages ? 1 : 0)
          }
          if (body.activation_settings.match_in_bot_messages !== undefined) {
            setClauses.push('activation_settings_match_in_bot_messages = ?')
            values.push(body.activation_settings.match_in_bot_messages ? 1 : 0)
          }
          if (body.activation_settings.match_in_system_prompts !== undefined) {
            setClauses.push('activation_settings_match_in_system_prompts = ?')
            values.push(body.activation_settings.match_in_system_prompts ? 1 : 0)
          }
          // Note: primary_keys and secondary_keys are stored in separate tables
          // They require separate INSERT/DELETE operations which we skip for now
        }

        // Handle positioning
        if (body.positioning) {
          if (body.positioning.position !== undefined) {
            setClauses.push('positioning_position = ?')
            values.push(body.positioning.position)
          }
          if (body.positioning.depth !== undefined) {
            setClauses.push('positioning_depth = ?')
            values.push(body.positioning.depth)
          }
          if (body.positioning.role !== undefined) {
            setClauses.push('positioning_role = ?')
            values.push(body.positioning.role)
          }
          if (body.positioning.order !== undefined) {
            setClauses.push('positioning_order = ?')
            values.push(body.positioning.order)
          }
        }

        // Handle advanced_activation
        if (body.advanced_activation) {
          if (body.advanced_activation.sticky !== undefined) {
            setClauses.push('advanced_activation_sticky = ?')
            values.push(body.advanced_activation.sticky)
          }
          if (body.advanced_activation.cooldown !== undefined) {
            setClauses.push('advanced_activation_cooldown = ?')
            values.push(body.advanced_activation.cooldown)
          }
          if (body.advanced_activation.delay !== undefined) {
            setClauses.push('advanced_activation_delay = ?')
            values.push(body.advanced_activation.delay)
          }
        }

        // Handle filtering (scalar fields only - arrays are in separate tables)
        if (body.filtering) {
          if (body.filtering.filter_by_bots !== undefined) {
            setClauses.push('filtering_filter_by_bots = ?')
            values.push(body.filtering.filter_by_bots ? 1 : 0)
          }
          if (body.filtering.filter_by_personas !== undefined) {
            setClauses.push('filtering_filter_by_personas = ?')
            values.push(body.filtering.filter_by_personas ? 1 : 0)
          }
          // Note: allowed_bot_ids, excluded_bot_ids, etc. are stored in separate tables
        }

        // Handle budget_control
        if (body.budget_control) {
          if (body.budget_control.ignore_budget !== undefined) {
            setClauses.push('budget_control_ignore_budget = ?')
            values.push(body.budget_control.ignore_budget ? 1 : 0)
          }
          if (body.budget_control.max_tokens !== undefined) {
            setClauses.push('budget_control_max_tokens = ?')
            values.push(body.budget_control.max_tokens)
          }
        }

        // Add the ID for WHERE clause
        values.push(numericId)

        // Execute the update
        if (setClauses.length > 0) {
          const sql = `UPDATE knowledge SET ${setClauses.join(', ')} WHERE id = ?`
          console.log('D1 update SQL:', sql, 'with', values.length, 'values')
          await d1.prepare(sql).bind(...values).run()
        }

        // Fetch the updated record
        updatedKnowledge = await payload.findByID({
          collection: 'knowledge',
          id: numericId,
          overrideAccess: true,
        })
      } else {
        // Fallback to Payload if D1 not available (shouldn't happen in production)
        console.warn('D1 not available, falling back to Payload update')
        updatedKnowledge = await payload.update({
          collection: 'knowledge',
          id: numericId,
          data: updateData,
          overrideAccess: true,
        })
      }
    } catch (d1Error) {
      console.error('D1 update error:', d1Error)
      throw d1Error // Don't fallback to Payload as it will also fail with the same error
    }

    // Determine appropriate message and flags for response
    const vectorsDeleted = shouldDeleteVectors
    const needsVectorization = willBeVectorCompatible && !updatedKnowledge.is_vectorized
    const switchedToVectorMode = modeChanged && willBeVectorCompatible && !wasVectorCompatible

    // Auto-vectorize if using vector/hybrid mode and content needs vectorization
    let autoVectorized = false
    let vectorCount = 0
    if (needsVectorization && updatedKnowledge.entry) {
      try {
        const { env } = await getCloudflareContext()
        const ai = env.AI
        const vectorize = env.VECTORIZE

        if (ai && vectorize) {
          // Get the content to vectorize
          // @ts-ignore
          const content = updatedKnowledge.entry as string
          const contentType = (updatedKnowledge.type as string) === 'legacy_memory' ? 'legacy_memory' : 'lore'

          // Chunk the content
          const chunkConfig = getChunkConfig(contentType as any)
          const chunks = chunkText(content, chunkConfig)

          if (chunks.length > 0) {
            const tenant_id = String(payloadUser.id)
            const vectorizeRecords: VectorRecord[] = []

            // Generate embeddings for all chunks
            const chunkTexts = chunks.map((c) => c.text)
            console.log(`Auto-vectorizing knowledge ${numericId}: generating embeddings for ${chunkTexts.length} chunks...`)
            const embeddings = await generateEmbeddings(ai, chunkTexts)

            for (let i = 0; i < chunks.length; i++) {
              const chunk = chunks[i]
              const embedding = embeddings[i]
              const vector_id = `vec_knowledge_${numericId}_chunk_${chunk.index}_${Date.now()}_${i}`

              // Create metadata for Vectorize
              const metadata: VectorMetadata = {
                type: contentType as any,
                user_id: payloadUser.id,
                tenant_id,
                source_type: 'knowledge',
                source_id: String(numericId),
                chunk_index: chunk.index,
                total_chunks: chunk.totalChunks,
                created_at: new Date().toISOString(),
              }

              vectorizeRecords.push({
                id: vector_id,
                values: embedding,
                metadata,
              })

              // Create VectorRecord in D1 (including embedding for future-proofing)
              await payload.create({
                collection: 'vectorRecords' as any,
                data: {
                  vector_id,
                  source_type: 'knowledge',
                  source_id: String(numericId),
                  user_id: payloadUser.id,
                  tenant_id,
                  chunk_index: chunk.index,
                  total_chunks: chunk.totalChunks,
                  chunk_text: chunk.text,
                  metadata: JSON.stringify(metadata),
                  embedding_model: BGE_M3_MODEL,
                  embedding_dimensions: BGE_M3_DIMENSIONS,
                  embedding: JSON.stringify(embedding), // Store embedding for future metadata-only updates
                },
              })
            }

            // Insert vectors into Vectorize
            console.log(`Inserting ${vectorizeRecords.length} vectors into Vectorize...`)
            await insertVectors(vectorize, vectorizeRecords)

            // Update knowledge entry as vectorized using D1 directly
            const d1 = (env as any).D1
            if (d1) {
              await d1
                .prepare(`UPDATE knowledge SET is_vectorized = 1, chunk_count = ? WHERE id = ?`)
                .bind(chunks.length, numericId)
                .run()
            }

            autoVectorized = true
            vectorCount = chunks.length
            console.log(`Auto-vectorized knowledge ${numericId} with ${vectorCount} chunks`)
          }
        } else {
          console.warn('AI or Vectorize binding not available for auto-vectorization')
        }
      } catch (autoVectorError) {
        console.error('Auto-vectorization failed:', autoVectorError)
        // Don't fail the whole update if auto-vectorization fails
      }
    }

    let message = 'Knowledge entry updated successfully'
    if (autoVectorized) {
      message = `Knowledge entry updated and auto-vectorized with ${vectorCount} chunks.`
    } else if (vectorsDeleted && contentChanged) {
      message = 'Knowledge entry updated. Content changed - vectors cleared for re-vectorization.'
    } else if (vectorsDeleted && !willBeVectorCompatible) {
      message = 'Knowledge entry updated. Vectors removed (no longer using vector-based activation).'
    } else if (switchedToVectorMode && !autoVectorized) {
      message = 'Knowledge entry updated. Vector-based activation enabled - vectorization required.'
    }

    return NextResponse.json({
      success: true,
      message,
      knowledge: autoVectorized
        ? { ...updatedKnowledge, is_vectorized: true, chunk_count: vectorCount }
        : updatedKnowledge,
      vectorsDeleted,
      needsVectorization: needsVectorization && !autoVectorized,
      autoVectorized,
      vectorCount: autoVectorized ? vectorCount : undefined,
      requiresRevectorization: contentChanged && wasVectorized && willBeVectorCompatible && !autoVectorized,
    })
  } catch (error: any) {
    console.error('Error updating knowledge entry:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to update knowledge entry' },
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
        { message: 'Invalid knowledge entry ID' },
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

    // Fetch the knowledge entry to verify ownership
    const knowledge = await payload.findByID({
      collection: 'knowledge',
      id: numericId,
      overrideAccess: true,
    })

    if (!knowledge) {
      return NextResponse.json(
        { message: 'Knowledge entry not found' },
        { status: 404 }
      )
    }

    // Check if user owns this knowledge entry
    // @ts-ignore - Payload types are complex
    if (knowledge.user !== payloadUser.id && knowledge.user?.id !== payloadUser.id) {
      return NextResponse.json(
        { message: 'Unauthorized - You do not own this knowledge entry' },
        { status: 403 }
      )
    }

    // Delete associated vectors if entry is vectorized
    // @ts-ignore
    if (knowledge.is_vectorized) {
      try {
        // Delete vector records from D1
        const vectorRecords = await payload.find({
          collection: 'vectorRecords',
          where: {
            and: [
              { source_type: { equals: 'knowledge' } },
              { source_id: { equals: String(numericId) } },
              { user_id: { equals: payloadUser.id } },
            ],
          },
          overrideAccess: true,
        })

        for (const record of vectorRecords.docs) {
          await payload.delete({
            collection: 'vectorRecords',
            id: record.id,
            overrideAccess: true,
          })
        }

        console.log(`Deleted ${vectorRecords.docs.length} vector records from D1 for knowledge ${numericId}`)

        // Delete vectors from Cloudflare Vectorize
        try {
          const { env } = await getCloudflareContext()
          const vectorize = env.VECTORIZE
          if (vectorize) {
            await deleteVectorsBySource(vectorize, 'knowledge', String(numericId))
            console.log(`Deleted vectors from Vectorize for knowledge ${numericId}`)
          }
        } catch (vectorizeError) {
          console.error('Error deleting from Vectorize:', vectorizeError)
        }
      } catch (vectorError) {
        console.error('Error deleting vectors:', vectorError)
        // Continue with knowledge deletion even if vector deletion fails
      }
    }

    // Delete the knowledge entry
    await payload.delete({
      collection: 'knowledge',
      id: numericId,
      overrideAccess: true,
    })

    return NextResponse.json({
      success: true,
      message: 'Knowledge entry deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting knowledge entry:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to delete knowledge entry' },
      { status: 500 }
    )
  }
}
