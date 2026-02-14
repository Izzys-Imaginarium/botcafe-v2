import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import {
  generateEmbeddings,
  insertVectors,
  BGE_M3_MODEL,
  BGE_M3_DIMENSIONS,
} from '@/lib/vectorization/embeddings'
import type { VectorRecord, VectorMetadata } from '@/lib/vectorization/embeddings'
import { chunkText, getChunkConfig } from '@/lib/vectorization/chunking'
import {
  parseWorldBook,
  mapWorldBookPosition,
  mapWorldBookRole,
  mapWorldBookSelectiveLogic,
  getWorldBookActivationMode,
} from '@/lib/tavern-card/world-book'

export const dynamic = 'force-dynamic'

interface ImportWorldBookRequest {
  file: string // base64-encoded JSON content
  filename: string
}

export async function POST(request: NextRequest) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await getPayload({ config })

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

    const body = (await request.json()) as ImportWorldBookRequest
    const { file, filename } = body

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Decode base64 JSON
    let jsonContent: unknown
    try {
      const decoded = atob(file)
      jsonContent = JSON.parse(decoded)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON file. Please upload a valid SillyTavern World Book.' }, { status: 400 })
    }

    // Parse and validate World Book structure
    let worldBook
    try {
      worldBook = parseWorldBook(jsonContent)
    } catch (parseError) {
      const message = parseError instanceof Error ? parseError.message : 'Failed to parse World Book'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    // Derive collection name from filename
    const collectionName = filename
      ? filename.replace(/\.json$/i, '').replace(/[-_]/g, ' ')
      : 'Imported World Book'

    // Create KnowledgeCollection (standalone — no bot linkage)
    const knowledgeCollection = await payload.create({
      collection: 'knowledgeCollections',
      data: {
        name: collectionName,
        user: payloadUser.id,
        description: `World Book imported from SillyTavern: ${filename || 'unknown'}`,
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
    try {
      const { env } = await getCloudflareContext()
      ai = env.AI
      vectorize = env.VECTORIZE
    } catch {
      console.warn('[Import World Book] Cloudflare context not available, skipping vectorization')
    }

    // Process entries
    const allEntries = Object.values(worldBook.entries)
    let importedCount = 0
    let skippedCount = 0
    let vectorizedCount = 0

    for (const entry of allEntries) {
      if (!entry.content?.trim()) {
        skippedCount++
        continue
      }

      const activationMode = getWorldBookActivationMode(entry)

      // Skip disabled entries
      if (activationMode === 'disabled') {
        skippedCount++
        continue
      }

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
            is_vectorized: false,
            chunk_count: 0,
            activation_settings: {
              activation_mode: activationMode,
              primary_keys: entry.key.map(k => ({ keyword: k })),
              secondary_keys: entry.selective
                ? entry.keysecondary.map(k => ({ keyword: k }))
                : [],
              keywords_logic: mapWorldBookSelectiveLogic(entry.selectiveLogic),
              case_sensitive: entry.caseSensitive ?? false,
              match_whole_words: entry.matchWholeWords ?? false,
              use_regex: false,
              vector_similarity_threshold: 0.4,
              max_vector_results: 5,
              probability: entry.probability,
              use_probability: entry.useProbability,
              scan_depth: entry.scanDepth ?? 2,
              match_in_user_messages: true,
              match_in_bot_messages: true,
              match_in_system_prompts: false,
            },
            positioning: {
              position: mapWorldBookPosition(entry.position),
              order: entry.order,
              depth: entry.depth,
              role: mapWorldBookRole(entry.role),
            },
            advanced_activation: {
              sticky: entry.sticky,
              cooldown: entry.cooldown,
              delay: entry.delay,
            },
            budget_control: {
              ignore_budget: entry.ignoreBudget,
              max_tokens: 1000,
            },
            privacy_settings: {
              privacy_level: 'private',
              allow_sharing: true,
              access_count: 0,
            },
            content_metadata: {
              processing_status: (activationMode === 'vector' || activationMode === 'hybrid') ? 'pending' : 'completed',
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
        importedCount++

        // Auto-vectorize if using vector or hybrid mode
        if ((activationMode === 'vector' || activationMode === 'hybrid') && ai && vectorize) {
          try {
            const chunkConfig = getChunkConfig('lore')
            const chunks = chunkText(entry.content, chunkConfig)

            if (chunks.length > 0) {
              const tenant_id = String(payloadUser.id)
              const vectorizeRecords: VectorRecord[] = []
              const chunkTexts = chunks.map(c => c.text)
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

              await insertVectors(vectorize, vectorizeRecords)

              // Update knowledge entry as vectorized
              const d1 = (payload.db as any).client as D1Database | undefined
              if (d1) {
                await d1
                  .prepare('UPDATE knowledge SET is_vectorized = 1, chunk_count = ?, content_metadata_processing_status = ? WHERE id = ?')
                  .bind(chunks.length, 'completed', newKnowledge.id)
                  .run()
              }

              vectorizedCount++
              console.log(`[Import World Book] Vectorized entry ${newKnowledge.id} with ${chunks.length} chunks`)
            }
          } catch (vectorError) {
            console.error(`[Import World Book] Vectorization failed for entry ${newKnowledge.id}:`, vectorError)
          }
        }
      } catch (entryError) {
        console.error('[Import World Book] Failed to create entry:', entryError)
        skippedCount++
      }
    }

    console.log(`[Import World Book] Import complete: ${importedCount} imported, ${skippedCount} skipped, ${vectorizedCount} vectorized`)

    return NextResponse.json({
      success: true,
      collectionId: knowledgeCollection.id,
      collectionName,
      totalEntries: allEntries.length,
      importedEntries: importedCount,
      skippedEntries: skippedCount,
      vectorizedEntries: vectorizedCount,
    })
  } catch (error: unknown) {
    console.error('[Import World Book] Error:', error)
    const message = error instanceof Error ? error.message : 'Failed to import World Book.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
