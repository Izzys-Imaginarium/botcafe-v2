import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import config from '@payload-config'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import {
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

interface KnowledgeCreateRequest {
  type: 'text' | 'document' | 'url' | 'image' | 'audio' | 'video' | 'legacy_memory'
  entry: string
  knowledge_collection: string | number
  tags?: { tag: string }[]
  applies_to_bots?: (string | number)[]
  activation_settings?: ActivationSettings
  positioning?: Positioning
  advanced_activation?: AdvancedActivation
  filtering?: Filtering
  budget_control?: BudgetControl
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated Clerk user
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return NextResponse.json(
        { message: 'Unauthorized - Please sign in to create knowledge entries' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = (await request.json()) as KnowledgeCreateRequest

    // Validate required fields
    if (!body.entry || !body.knowledge_collection || !body.type) {
      return NextResponse.json(
        { message: 'Missing required fields: entry, knowledge_collection, and type are required' },
        { status: 400 }
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

    // Estimate token count (rough approximation: 1 token ≈ 4 characters)
    const estimatedTokens = Math.ceil(body.entry.length / 4)

    // Convert string arrays to Payload's {keyword: string}[] format
    const convertToKeywordArray = (keys?: string[]): { keyword: string }[] => {
      if (!keys || keys.length === 0) return []
      return keys.map(k => ({ keyword: k }))
    }

    // Build activation settings with defaults
    const activationSettings = {
      activation_mode: body.activation_settings?.activation_mode ?? 'vector',
      primary_keys: convertToKeywordArray(body.activation_settings?.primary_keys),
      secondary_keys: convertToKeywordArray(body.activation_settings?.secondary_keys),
      keywords_logic: body.activation_settings?.keywords_logic ?? 'AND_ANY',
      case_sensitive: body.activation_settings?.case_sensitive ?? false,
      match_whole_words: body.activation_settings?.match_whole_words ?? false,
      use_regex: body.activation_settings?.use_regex ?? false,
      vector_similarity_threshold: body.activation_settings?.vector_similarity_threshold ?? 0.4,
      max_vector_results: body.activation_settings?.max_vector_results ?? 5,
      probability: body.activation_settings?.probability ?? 100,
      use_probability: body.activation_settings?.use_probability ?? false,
      scan_depth: body.activation_settings?.scan_depth ?? 2,
      match_in_user_messages: body.activation_settings?.match_in_user_messages ?? true,
      match_in_bot_messages: body.activation_settings?.match_in_bot_messages ?? true,
      match_in_system_prompts: body.activation_settings?.match_in_system_prompts ?? false,
    }

    // Build positioning with defaults
    const positioning = {
      position: body.positioning?.position ?? 'before_character',
      depth: body.positioning?.depth ?? 0,
      role: body.positioning?.role ?? 'system',
      order: body.positioning?.order ?? 100,
    }

    // Build advanced activation with defaults
    const advancedActivation = {
      sticky: body.advanced_activation?.sticky ?? 0,
      cooldown: body.advanced_activation?.cooldown ?? 0,
      delay: body.advanced_activation?.delay ?? 0,
    }

    // Convert number arrays to Payload's {bot_id/persona_id: number}[] format
    const convertToBotIdArray = (ids?: number[]): { bot_id: number }[] => {
      if (!ids || ids.length === 0) return []
      return ids.map(id => ({ bot_id: id }))
    }
    const convertToPersonaIdArray = (ids?: number[]): { persona_id: number }[] => {
      if (!ids || ids.length === 0) return []
      return ids.map(id => ({ persona_id: id }))
    }

    // Build filtering with defaults
    const filtering = {
      filter_by_bots: body.filtering?.filter_by_bots ?? false,
      allowed_bot_ids: convertToBotIdArray(body.filtering?.allowed_bot_ids),
      excluded_bot_ids: convertToBotIdArray(body.filtering?.excluded_bot_ids),
      filter_by_personas: body.filtering?.filter_by_personas ?? false,
      allowed_persona_ids: convertToPersonaIdArray(body.filtering?.allowed_persona_ids),
      excluded_persona_ids: convertToPersonaIdArray(body.filtering?.excluded_persona_ids),
    }

    // Build budget control with defaults
    const budgetControl = {
      ignore_budget: body.budget_control?.ignore_budget ?? false,
      max_tokens: body.budget_control?.max_tokens ?? 1000,
    }

    // Create the knowledge entry
    const newKnowledge = await payload.create({
      collection: 'knowledge',
      data: {
        user: payloadUser.id,
        type: body.type,
        entry: body.entry,
        knowledge_collection: typeof body.knowledge_collection === 'string'
          ? parseInt(body.knowledge_collection)
          : body.knowledge_collection,
        tags: body.tags || [],
        tokens: estimatedTokens,
        applies_to_bots: body.applies_to_bots?.map(id => typeof id === 'string' ? parseInt(id) : id) || [],
        is_vectorized: false,
        chunk_count: 0,
        privacy_settings: {
          privacy_level: 'private',
          allow_sharing: true,
          access_count: 0,
        },
        content_metadata: {
          processing_status: 'pending',
          word_count: body.entry.split(/\s+/).length,
        },
        usage_analytics: {
          view_count: 0,
          search_count: 0,
          citation_count: 0,
          popularity_score: 0,
        },
        // Hybrid activation system settings
        activation_settings: activationSettings,
        positioning: positioning,
        advanced_activation: advancedActivation,
        filtering: filtering,
        budget_control: budgetControl,
      },
      overrideAccess: true,
    })

    // Auto-vectorize if using vector/hybrid activation mode
    const isVectorCompatible = activationSettings.activation_mode === 'vector' || activationSettings.activation_mode === 'hybrid'
    let autoVectorized = false
    let vectorCount = 0

    if (isVectorCompatible && body.entry) {
      try {
        const { env } = await getCloudflareContext()
        const ai = env.AI
        const vectorize = env.VECTORIZE

        if (ai && vectorize) {
          // Get the content to vectorize
          const content = body.entry
          const contentType = body.type === 'legacy_memory' ? 'legacy_memory' : 'lore'

          // Chunk the content
          const chunkConfig = getChunkConfig(contentType as any)
          const chunks = chunkText(content, chunkConfig)

          if (chunks.length > 0) {
            const tenant_id = String(payloadUser.id)
            const vectorizeRecords: VectorRecord[] = []

            // Generate embeddings for all chunks
            const chunkTexts = chunks.map((c) => c.text)
            console.log(`Auto-vectorizing new knowledge ${newKnowledge.id}: generating embeddings for ${chunkTexts.length} chunks...`)
            const embeddings = await generateEmbeddings(ai, chunkTexts)

            for (let i = 0; i < chunks.length; i++) {
              const chunk = chunks[i]
              const embedding = embeddings[i]
              const vector_id = `vec_knowledge_${newKnowledge.id}_chunk_${chunk.index}_${Date.now()}_${i}`

              // Create metadata for Vectorize
              const metadata: VectorMetadata = {
                type: contentType as any,
                user_id: payloadUser.id,
                tenant_id,
                source_type: 'knowledge',
                source_id: String(newKnowledge.id),
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
                  source_id: String(newKnowledge.id),
                  user_id: payloadUser.id,
                  tenant_id,
                  chunk_index: chunk.index,
                  total_chunks: chunk.totalChunks,
                  chunk_text: chunk.text,
                  metadata: JSON.stringify(metadata),
                  embedding_model: BGE_M3_MODEL,
                  embedding_dimensions: BGE_M3_DIMENSIONS,
                  embedding: JSON.stringify(embedding),
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
                .bind(chunks.length, newKnowledge.id)
                .run()
            }

            autoVectorized = true
            vectorCount = chunks.length
            console.log(`Auto-vectorized new knowledge ${newKnowledge.id} with ${vectorCount} chunks`)
          }
        } else {
          console.warn('AI or Vectorize binding not available for auto-vectorization')
        }
      } catch (autoVectorError) {
        console.error('Auto-vectorization failed:', autoVectorError)
        // Don't fail the whole creation if auto-vectorization fails
      }
    }

    return NextResponse.json({
      success: true,
      message: autoVectorized
        ? `Knowledge entry created and auto-vectorized with ${vectorCount} chunks.`
        : 'Knowledge entry created successfully',
      knowledge: autoVectorized
        ? { ...newKnowledge, is_vectorized: true, chunk_count: vectorCount }
        : newKnowledge,
      autoVectorized,
      vectorCount: autoVectorized ? vectorCount : undefined,
    })
  } catch (error: any) {
    console.error('Error creating knowledge entry:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to create knowledge entry' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
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

    // Find Payload user by Clerk ID
    const payloadUsers = await payload.find({
      collection: 'users',
      where: {
        email: { equals: clerkUser.emailAddresses[0]?.emailAddress },
      },
      limit: 1,
    })

    if (payloadUsers.docs.length === 0) {
      // User not synced yet - return empty results
      return NextResponse.json({
        success: true,
        docs: [],
        totalDocs: 0,
        page: 1,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      })
    }

    const payloadUser = payloadUsers.docs[0]

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const collectionId = searchParams.get('collection')
    const includeMemories = searchParams.get('includeMemories') === 'true'
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || '-createdAt'

    // Determine if user has access to the requested collection (owned or shared)
    let hasCollectionAccess = false
    if (collectionId) {
      // Check if user owns the collection
      const ownedCheck = await payload.find({
        collection: 'knowledgeCollections',
        where: {
          and: [
            { id: { equals: collectionId } },
            { user: { equals: payloadUser.id } },
          ],
        },
        limit: 1,
        overrideAccess: true,
      })

      if (ownedCheck.docs.length > 0) {
        hasCollectionAccess = true
      } else {
        // Check if user has shared access via AccessControl
        const sharedCheck = await payload.find({
          collection: 'access-control',
          where: {
            and: [
              { user: { equals: payloadUser.id } },
              { resource_type: { equals: 'knowledgeCollection' } },
              { resource_id: { equals: String(collectionId) } },
              { is_revoked: { equals: false } },
            ],
          },
          limit: 1,
          overrideAccess: true,
        })

        if (sharedCheck.docs.length > 0) {
          hasCollectionAccess = true
        }
      }
    }

    // Build where clause
    // When accessing a shared collection, don't filter by user ownership
    const whereClause: Record<string, unknown> = {}

    if (collectionId && hasCollectionAccess) {
      // User has access to this collection (owned or shared) - fetch by collection, not user
      whereClause.knowledge_collection = {
        equals: collectionId,
      }
    } else {
      // No specific collection or no access - only show user's own entries
      whereClause.user = {
        equals: payloadUser.id,
      }
      if (collectionId) {
        whereClause.knowledge_collection = {
          equals: collectionId,
        }
      }
    }

    // By default, exclude legacy memory entries from knowledge views
    // They are displayed in the memories section instead
    // Pass includeMemories=true to include them (e.g., when viewing a memory tome)
    if (!includeMemories) {
      whereClause.is_legacy_memory = {
        not_equals: true,
      }
    }

    // Add search filter for entry content
    if (search) {
      whereClause.entry = { contains: search }
    }

    // Fetch knowledge entries
    const knowledgeEntries = await payload.find({
      collection: 'knowledge',
      where: whereClause,
      page,
      limit,
      sort,
      overrideAccess: true,
    })

    return NextResponse.json({
      success: true,
      docs: knowledgeEntries.docs,
      totalDocs: knowledgeEntries.totalDocs,
      page: knowledgeEntries.page,
      totalPages: knowledgeEntries.totalPages,
      hasNextPage: knowledgeEntries.hasNextPage,
      hasPrevPage: knowledgeEntries.hasPrevPage,
    })
  } catch (error: any) {
    console.error('Error fetching knowledge entries:', error)
    // Return empty results instead of error for better UX
    return NextResponse.json({
      success: true,
      docs: [],
      totalDocs: 0,
      page: 1,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    })
  }
}
