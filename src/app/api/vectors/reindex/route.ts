import { NextRequest, NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import { currentUser } from '@clerk/nextjs/server'
import config from '@payload-config'
import { getCloudflareContext } from '@opennextjs/cloudflare'

export const dynamic = 'force-dynamic'

/**
 * GET /api/vectors/reindex?offset=0&batch_size=5
 *
 * Diagnostic mode: returns the first few D1 records so you can inspect
 * what the reindex endpoint would send to Vectorize.
 */
export async function GET(request: NextRequest) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const payload = await getPayloadHMR({ config })
    const payloadUsers = await payload.find({
      collection: 'users',
      where: { email: { equals: clerkUser.emailAddresses[0]?.emailAddress } },
      limit: 1,
    })
    if (payloadUsers.docs.length === 0 || payloadUsers.docs[0].id !== 1) {
      return NextResponse.json({ message: 'Admin only' }, { status: 403 })
    }

    const { env } = await getCloudflareContext()
    const d1 = (env as any).D1
    if (!d1) {
      return NextResponse.json({ message: 'D1 binding not available' }, { status: 500 })
    }

    const url = new URL(request.url)
    const batchSize = Math.min(Number(url.searchParams.get('batch_size') || '5'), 20)
    const offset = Number(url.searchParams.get('offset') || '0')

    const result = await d1
      .prepare(
        `SELECT id, vector_id, source_type, source_id, user_id_id, tenant_id,
                chunk_index, total_chunks,
                CASE WHEN embedding IS NULL THEN 'NULL'
                     WHEN LENGTH(embedding) = 0 THEN 'EMPTY'
                     ELSE 'len=' || LENGTH(embedding)
                END as embedding_status,
                SUBSTR(embedding, 1, 80) as embedding_preview,
                metadata
         FROM vector_records
         ORDER BY id ASC
         LIMIT ? OFFSET ?`
      )
      .bind(batchSize, offset)
      .all()

    const totalResult = await d1
      .prepare('SELECT COUNT(*) as total FROM vector_records')
      .all()

    const nullEmbeddingResult = await d1
      .prepare('SELECT COUNT(*) as total FROM vector_records WHERE embedding IS NULL OR LENGTH(embedding) = 0')
      .all()

    return NextResponse.json({
      total_records: totalResult.results?.[0]?.total,
      null_embeddings: nullEmbeddingResult.results?.[0]?.total,
      offset,
      batch_size: batchSize,
      records: result.results,
    })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}

/**
 * POST /api/vectors/reindex
 *
 * Re-inserts existing vectors from D1 into Vectorize so they pick up
 * newly created metadata indexes (e.g. source_id).
 *
 * No AI calls needed — reads stored embeddings from D1.
 * Uses the same insertVectors() helper as the generate endpoint.
 *
 * Query params:
 *   batch_size: number (default 50, max 100)
 *   offset: number (default 0) — resume from this row offset
 */
export async function POST(request: NextRequest) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Verify the user is an admin (user ID 1) to prevent abuse
    const payload = await getPayloadHMR({ config })
    const payloadUsers = await payload.find({
      collection: 'users',
      where: { email: { equals: clerkUser.emailAddresses[0]?.emailAddress } },
      limit: 1,
    })
    if (payloadUsers.docs.length === 0 || payloadUsers.docs[0].id !== 1) {
      return NextResponse.json({ message: 'Admin only' }, { status: 403 })
    }

    const { env } = await getCloudflareContext()
    const vectorize = env.VECTORIZE
    const d1 = (env as any).D1

    if (!vectorize || !d1) {
      return NextResponse.json({ message: 'Vectorize or D1 binding not available' }, { status: 500 })
    }

    const url = new URL(request.url)
    const batchSize = Math.min(Number(url.searchParams.get('batch_size') || '50'), 100)
    const offset = Number(url.searchParams.get('offset') || '0')

    // Fetch a batch of vector records from D1 with their embeddings
    // Note: Payload CMS names relationship columns as `<field>_id` in SQLite,
    // so the `user_id` relationship field becomes `user_id_id` in D1.
    const result = await d1
      .prepare(
        `SELECT vector_id, source_type, source_id, user_id_id, tenant_id,
                chunk_index, total_chunks, embedding, metadata
         FROM vector_records
         ORDER BY id ASC
         LIMIT ? OFFSET ?`
      )
      .bind(batchSize, offset)
      .all()

    const rows = result.results || []

    if (rows.length === 0) {
      return NextResponse.json({
        message: 'No more records to process',
        offset,
        processed: 0,
        done: true,
      })
    }

    // Build Vectorize records from D1 data
    const vectorRecords: { id: string; values: number[]; metadata: Record<string, any> }[] = []
    const skipped: string[] = []

    for (const row of rows) {
      const r = row as any
      if (!r.embedding) {
        skipped.push(r.vector_id)
        continue
      }

      let values: number[]
      try {
        let parsed = JSON.parse(r.embedding)
        // Handle double-encoded embeddings: Payload's text field may add
        // an extra layer of JSON encoding, so the first parse returns a
        // string like "[-0.027, 0.012, ...]" instead of an actual array.
        if (typeof parsed === 'string') {
          parsed = JSON.parse(parsed)
        }
        values = parsed
        if (!Array.isArray(values) || values.length === 0) {
          console.warn(`[Reindex] Skipping ${r.vector_id}: embedding is not a valid array`)
          skipped.push(r.vector_id)
          continue
        }
      } catch {
        skipped.push(r.vector_id)
        continue
      }

      // Reconstruct metadata (same as what the generate endpoint creates)
      // Vectorize rejects null metadata values, so we must ensure every field has a value.
      let existingMetadata: Record<string, any> = {}
      try {
        if (r.metadata) existingMetadata = JSON.parse(r.metadata)
      } catch { /* ignore */ }

      // Skip records missing critical fields
      if (!r.source_id || !r.source_type) {
        skipped.push(r.vector_id)
        continue
      }

      const metadata: Record<string, any> = {
        type: existingMetadata.type || 'lore',
        source_type: r.source_type,
        source_id: String(r.source_id),
        chunk_index: r.chunk_index ?? 0,
        total_chunks: r.total_chunks ?? 1,
        created_at: existingMetadata.created_at || new Date().toISOString(),
      }

      // Only include user_id and tenant_id if they're not null
      if (r.user_id_id != null) {
        metadata.user_id = r.user_id_id
        metadata.tenant_id = r.tenant_id || String(r.user_id_id)
      } else if (r.tenant_id) {
        metadata.tenant_id = r.tenant_id
      }

      vectorRecords.push({ id: r.vector_id, values, metadata })
    }

    if (vectorRecords.length === 0) {
      return NextResponse.json({
        message: 'All records in this batch were skipped (no valid embeddings)',
        offset,
        processed: 0,
        skipped: skipped.length,
        nextOffset: offset + rows.length,
        batchSize,
        done: rows.length < batchSize,
      })
    }

    // Delete existing vectors first, then insert (matching the working pipeline).
    // vectorize.upsert() was giving "line None" errors; insert() is what the
    // generate endpoint uses and is known to work.
    const VECTORIZE_BATCH = 25
    let inserted = 0
    for (let i = 0; i < vectorRecords.length; i += VECTORIZE_BATCH) {
      const batch = vectorRecords.slice(i, i + VECTORIZE_BATCH)
      const batchIds = batch.map((v) => v.id)
      try {
        // Delete first to avoid "already exists" errors
        try {
          await vectorize.deleteByIds(batchIds)
        } catch {
          // Ignore delete errors (vectors may not exist yet)
        }
        await vectorize.insert(batch)
        inserted += batch.length
      } catch (err: any) {
        // Log the first record in the failing batch for diagnosis
        const sample = batch[0]
        console.error(`[Reindex] insert failed at batch ${i}:`, err.message)
        console.error(`[Reindex] Sample vector id=${sample.id}, values.length=${sample.values.length}, values[0..2]=[${sample.values.slice(0, 3)}], metadata=${JSON.stringify(sample.metadata)}`)
        return NextResponse.json({
          message: `Partial failure at batch offset ${i}`,
          error: err.message,
          offset,
          processed: inserted,
          skipped: skipped.length,
          failingSample: {
            id: sample.id,
            valuesLength: sample.values.length,
            valuesPreview: sample.values.slice(0, 5),
            metadata: sample.metadata,
          },
          nextOffset: offset + inserted + skipped.length,
          done: false,
        }, { status: 500 })
      }
    }

    const nextOffset = offset + rows.length
    console.log(`[Reindex] Processed batch: offset=${offset}, inserted=${inserted}, skipped=${skipped.length}`)

    return NextResponse.json({
      message: `Re-indexed ${inserted} vectors`,
      offset,
      processed: inserted,
      skipped: skipped.length,
      nextOffset,
      batchSize,
      done: rows.length < batchSize,
    })
  } catch (error: any) {
    console.error('[Reindex] Error:', error)
    return NextResponse.json({ message: error.message || 'Reindex failed' }, { status: 500 })
  }
}
