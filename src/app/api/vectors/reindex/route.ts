import { NextRequest, NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import { currentUser } from '@clerk/nextjs/server'
import config from '@payload-config'
import { getCloudflareContext } from '@opennextjs/cloudflare'

export const dynamic = 'force-dynamic'

/**
 * POST /api/vectors/reindex
 *
 * Re-inserts existing vectors from D1 into Vectorize so they pick up
 * newly created metadata indexes (e.g. source_id).
 *
 * No AI calls needed — reads stored embeddings from D1.
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
        values = JSON.parse(r.embedding)
      } catch {
        skipped.push(r.vector_id)
        continue
      }

      // Reconstruct metadata (same as what the generate endpoint creates)
      let existingMetadata: Record<string, any> = {}
      try {
        if (r.metadata) existingMetadata = JSON.parse(r.metadata)
      } catch { /* ignore */ }

      const metadata = {
        type: existingMetadata.type || 'lore',
        user_id: r.user_id_id,
        tenant_id: r.tenant_id || String(r.user_id_id),
        source_type: r.source_type,
        source_id: String(r.source_id),
        chunk_index: r.chunk_index ?? 0,
        total_chunks: r.total_chunks ?? 1,
        created_at: existingMetadata.created_at || new Date().toISOString(),
      }

      vectorRecords.push({ id: r.vector_id, values, metadata })
    }

    // Upsert into Vectorize in sub-batches (Vectorize has a limit per call)
    const VECTORIZE_BATCH = 25
    let inserted = 0
    for (let i = 0; i < vectorRecords.length; i += VECTORIZE_BATCH) {
      const batch = vectorRecords.slice(i, i + VECTORIZE_BATCH)
      try {
        await vectorize.upsert(batch)
        inserted += batch.length
      } catch (err: any) {
        console.error(`[Reindex] Vectorize upsert failed at batch ${i}:`, err.message)
        return NextResponse.json({
          message: `Partial failure at batch offset ${i}`,
          error: err.message,
          offset,
          processed: inserted,
          skipped: skipped.length,
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
