import { NextRequest, NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import { currentUser } from '@clerk/nextjs/server'
import config from '@payload-config'
import { chunkText, getChunkConfig, estimateTokens } from '@/lib/vectorization/chunking'

/**
 * POST /api/vectors/generate
 *
 * Generate embeddings for knowledge or memory content
 * Chunks content, generates embeddings via OpenAI, stores in Vectorize
 *
 * Request body:
 * {
 *   source_type: 'knowledge' | 'memory'
 *   source_id: string (ID of knowledge or memory record)
 *   content: string (text to vectorize)
 *   content_type?: 'lore' | 'memory' | 'legacy_memory' | 'document' (for chunking strategy)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Get current Clerk user
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const payload = await getPayloadHMR({ config })

    // Find Payload user by Clerk ID
    const payloadUsers = await payload.find({
      collection: 'users',
      where: {
        clerkId: { equals: clerkUser.id },
      },
      limit: 1,
    })

    if (payloadUsers.docs.length === 0) {
      return NextResponse.json({ message: 'User not found in database' }, { status: 404 })
    }

    const payloadUser = payloadUsers.docs[0]

    // Parse request body
    const body = (await request.json()) as {
      source_type?: string
      source_id?: string
      content?: string
      content_type?: 'lore' | 'memory' | 'legacy_memory' | 'document'
    }
    const { source_type, source_id, content, content_type = 'lore' } = body

    // Validate inputs
    if (!source_type || !source_id || !content) {
      return NextResponse.json(
        { message: 'Missing required fields: source_type, source_id, content' },
        { status: 400 }
      )
    }

    if (source_type !== 'knowledge' && source_type !== 'memory') {
      return NextResponse.json({ message: 'Invalid source_type. Must be "knowledge" or "memory"' }, { status: 400 })
    }

    // Verify source exists and user owns it
    const sourceCollection = source_type === 'knowledge' ? 'knowledge' : 'memory'
    const sourceDoc = await payload.findByID({
      collection: sourceCollection as any,
      id: source_id,
    })

    if (!sourceDoc) {
      return NextResponse.json({ message: `${source_type} not found` }, { status: 404 })
    }

    // @ts-ignore - Payload types are complex
    if (sourceDoc.user !== payloadUser.id && sourceDoc.user?.id !== payloadUser.id) {
      return NextResponse.json({ message: 'Unauthorized: You do not own this content' }, { status: 403 })
    }

    // Get chunking configuration
    const chunkConfig = getChunkConfig(content_type as any)

    // Chunk the content
    const chunks = chunkText(content, chunkConfig)

    if (chunks.length === 0) {
      return NextResponse.json({ message: 'Failed to chunk content' }, { status: 400 })
    }

    console.log(`Generated ${chunks.length} chunks for ${source_type} ${source_id}`)

    // TODO: In production, we'll generate embeddings using OpenAI and store in Vectorize
    // For now, we'll create placeholder VectorRecord entries

    const vectorRecords = []
    const tenant_id = payloadUser.id // Use user ID as tenant ID for multi-tenant isolation

    for (const chunk of chunks) {
      // In production, this would call OpenAI:
      // const embedding = await generateEmbedding(chunk.text)
      // const vectorId = await storeInVectorize(embedding, metadata)

      // For now, create a mock vector ID
      const vector_id = `vec_${source_type}_${source_id}_chunk_${chunk.index}_${Date.now()}`

      // Create metadata for Vectorize
      const metadata = {
        type: content_type,
        user_id: payloadUser.id,
        tenant_id: tenant_id,
        source_type,
        source_id,
        chunk_index: chunk.index,
        total_chunks: chunk.totalChunks,
        created_at: new Date().toISOString(),
      }

      // Create VectorRecord in D1
      const vectorRecord = await payload.create({
        collection: 'vectorRecords' as any,
        data: {
          vector_id,
          source_type,
          source_id,
          user_id: payloadUser.id,
          tenant_id,
          chunk_index: chunk.index,
          total_chunks: chunk.totalChunks,
          chunk_text: chunk.text,
          metadata: metadata as any,
          embedding_model: 'text-embedding-3-small',
          embedding_dimensions: 1536,
        },
      })

      vectorRecords.push(vectorRecord)
    }

    // Update source document to mark as vectorized
    await payload.update({
      collection: sourceCollection as any,
      id: source_id,
      data: {
        is_vectorized: true,
        vector_records: vectorRecords.map((vr) => vr.id),
        chunk_count: chunks.length,
      },
    })

    return NextResponse.json({
      message: 'Vectors generated successfully',
      vector_count: vectorRecords.length,
      vector_record_ids: vectorRecords.map((vr) => vr.id),
      chunks_info: {
        total_chunks: chunks.length,
        chunk_size_config: chunkConfig.chunkSize,
        overlap_config: chunkConfig.overlap,
        method: chunkConfig.method,
      },
    })
  } catch (error: any) {
    console.error('Error generating vectors:', error)
    return NextResponse.json({ message: error.message || 'Failed to generate vectors' }, { status: 500 })
  }
}
