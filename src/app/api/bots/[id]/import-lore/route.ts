import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import config from '@payload-config'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkResourceAccess } from '@/lib/permissions/check-access'
import {
  generateEmbeddings,
  insertVectors,
  BGE_M3_MODEL,
  BGE_M3_DIMENSIONS,
} from '@/lib/vectorization/embeddings'
import type { VectorRecord, VectorMetadata } from '@/lib/vectorization/embeddings'
import { chunkText, getChunkConfig } from '@/lib/vectorization/chunking'
import type { CharacterBook } from '@/lib/tavern-card'

export const dynamic = 'force-dynamic'

interface ImportLoreRequest {
  characterBook: CharacterBook
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Bot ID is required' }, { status: 400 })
    }

    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await getPayloadHMR({ config })

    // Find the Payload user
    const payloadUsers = await payload.find({
      collection: 'users',
      where: {
        email: { equals: clerkUser.emailAddresses[0]?.emailAddress },
      },
      limit: 1,
      overrideAccess: true,
    })

    if (payloadUsers.docs.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const payloadUser = payloadUsers.docs[0]

    // Check permission - owners and editors can import lore
    const access = await checkResourceAccess(payload, payloadUser.id, 'bot', parseInt(id))
    if (!access.hasAccess || (access.permission !== 'owner' && access.permission !== 'editor')) {
      return NextResponse.json(
        { error: 'You do not have permission to import lore for this bot.' },
        { status: 403 },
      )
    }

    // Fetch the bot to get its name
    const bot = await payload.findByID({
      collection: 'bot',
      id: parseInt(id),
      depth: 0,
      overrideAccess: true,
    })

    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
    }

    const body = (await request.json()) as ImportLoreRequest
    const { characterBook } = body

    if (!characterBook || !characterBook.entries || characterBook.entries.length === 0) {
      return NextResponse.json({ error: 'No lore entries to import.' }, { status: 400 })
    }

    // Create a KnowledgeCollection for this lore book
    const collectionName = characterBook.name || `${bot.name}'s Imported Lore`
    const knowledgeCollection = await payload.create({
      collection: 'knowledgeCollections',
      data: {
        name: collectionName,
        user: payloadUser.id,
        bot: [parseInt(id)],
        description: characterBook.description || `Lore imported from SillyTavern character card for ${bot.name}`,
        sharing_settings: {
          sharing_level: 'private',
        },
        collection_metadata: {
          collection_category: 'lore',
        },
      },
      overrideAccess: true,
    })

    // Get Cloudflare context for vectorization
    let ai: any = null
    let vectorize: any = null
    let d1: any = null
    try {
      const { env } = await getCloudflareContext()
      ai = env.AI
      vectorize = env.VECTORIZE
      d1 = (env as any).D1
    } catch {
      console.warn('[Import Lore] Cloudflare context not available, skipping vectorization')
    }

    // Create knowledge entries from character book entries
    let entryCount = 0
    let vectorizedCount = 0
    for (const entry of characterBook.entries) {
      if (!entry.content?.trim()) continue

      // Determine activation mode from character book entry properties
      const activationMode =
        entry.constant ? 'constant' as const :
        entry.keys && entry.keys.length > 0 ? 'keyword' as const :
        'vector' as const

      const estimatedTokens = Math.ceil(entry.content.length / 4)

      try {
        const newKnowledge = await payload.create({
          collection: 'knowledge',
          data: {
            user: payloadUser.id,
            knowledge_collection: knowledgeCollection.id,
            type: 'text',
            entry: entry.content,
            tokens: estimatedTokens,
            applies_to_bots: [parseInt(id)],
            is_vectorized: false,
            chunk_count: 0,
            activation_settings: {
              activation_mode: activationMode,
              primary_keys: entry.keys
                ? entry.keys.map((k) => ({ keyword: k }))
                : [],
              secondary_keys: entry.secondary_keys
                ? entry.secondary_keys.map((k) => ({ keyword: k }))
                : [],
              case_sensitive: entry.case_sensitive || false,
              match_whole_words: false,
              use_regex: false,
              vector_similarity_threshold: 0.4,
              max_vector_results: 5,
              probability: 100,
              use_probability: false,
              scan_depth: 2,
              match_in_user_messages: true,
              match_in_bot_messages: true,
              match_in_system_prompts: false,
            },
            positioning: {
              position: entry.position === 'before_char' ? 'before_character' : 'after_character',
              order: entry.insertion_order ?? 100,
              depth: 0,
              role: 'system',
            },
            advanced_activation: {
              sticky: 0,
              cooldown: 0,
              delay: 0,
            },
            budget_control: {
              ignore_budget: false,
              max_tokens: 1000,
            },
            privacy_settings: {
              privacy_level: 'private',
              allow_sharing: true,
              access_count: 0,
            },
            content_metadata: {
              processing_status: activationMode === 'vector' ? 'pending' : 'completed',
              word_count: entry.content.split(/\s+/).length,
            },
            usage_analytics: {
              view_count: 0,
              search_count: 0,
              citation_count: 0,
              popularity_score: 0,
            },
          },
          overrideAccess: true,
        })
        entryCount++

        // Auto-vectorize if using vector mode (entries without keywords default to vector)
        if (activationMode === 'vector' && ai && vectorize) {
          try {
            const chunkConfig = getChunkConfig('lore')
            const chunks = chunkText(entry.content, chunkConfig)

            if (chunks.length > 0) {
              const tenant_id = String(payloadUser.id)
              const vectorizeRecords: VectorRecord[] = []

              const chunkTexts = chunks.map((c) => c.text)
              const embeddings = await generateEmbeddings(ai, chunkTexts)

              for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i]
                const embedding = embeddings[i]
                const vector_id = `vec_knowledge_${newKnowledge.id}_chunk_${chunk.index}_${Date.now()}_${i}`

                const metadata: VectorMetadata = {
                  type: 'lore' as any,
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

                // Create VectorRecord in D1
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

              // Insert vectors into Vectorize index
              await insertVectors(vectorize, vectorizeRecords)

              // Update knowledge entry as vectorized
              if (d1) {
                await d1
                  .prepare('UPDATE knowledge SET is_vectorized = 1, chunk_count = ?, content_metadata_processing_status = ? WHERE id = ?')
                  .bind(chunks.length, 'completed', newKnowledge.id)
                  .run()
              }

              vectorizedCount++
              console.log(`[Import Lore] Vectorized entry ${newKnowledge.id} with ${chunks.length} chunks`)
            }
          } catch (vectorError) {
            // Non-fatal: entry created but not vectorized
            console.error(`[Import Lore] Vectorization failed for entry ${newKnowledge.id}:`, vectorError)
          }
        }
      } catch (entryError) {
        console.error('[Import Lore] Failed to create entry:', entryError)
      }
    }

    // Link the collection to the bot's knowledge_collections
    const existingCollections = (bot.knowledge_collections || []) as number[]
    await payload.update({
      collection: 'bot',
      id: parseInt(id),
      data: {
        knowledge_collections: [...existingCollections, knowledgeCollection.id] as number[],
      },
      overrideAccess: true,
    })

    return NextResponse.json({
      success: true,
      collectionId: knowledgeCollection.id,
      collectionName,
      entryCount,
      vectorizedCount,
    })
  } catch (error: unknown) {
    console.error('[Import Lore] Error:', error)
    const message = error instanceof Error ? error.message : 'Failed to import lore.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
