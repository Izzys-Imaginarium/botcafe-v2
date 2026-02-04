import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/fix/memory-flags
 *
 * Diagnose knowledge entries in memory tomes that are missing is_legacy_memory flag.
 */
export async function GET(_request: NextRequest) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Check if user is admin
    const users = await payload.find({
      collection: 'users',
      where: { email: { equals: clerkUser.emailAddresses[0]?.emailAddress } },
      overrideAccess: true,
    })

    if (users.docs.length === 0 || (users.docs[0] as { role?: string }).role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 })
    }

    // Get all memory tomes (collections with category = 'memories')
    const memoryTomes = await payload.find({
      collection: 'knowledgeCollections',
      where: {
        'collection_metadata.collection_category': { equals: 'memories' },
      },
      limit: 100,
      overrideAccess: true,
    })

    const tomeIds = memoryTomes.docs.map((t) => (t as { id: number }).id)

    if (tomeIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No memory tomes found',
        tomes: [],
        entriesMissingFlag: 0,
      })
    }

    // Find all knowledge entries in memory tomes that are missing is_legacy_memory flag
    // D1/SQLite has a limit on IN clause parameters, so batch in chunks of 20
    const BATCH_SIZE = 20
    let allEntriesInTomes: Array<Record<string, unknown>> = []

    for (let i = 0; i < tomeIds.length; i += BATCH_SIZE) {
      const batchIds = tomeIds.slice(i, i + BATCH_SIZE)
      const batchResult = await payload.find({
        collection: 'knowledge',
        where: {
          knowledge_collection: { in: batchIds },
        },
        limit: 1000,
        overrideAccess: true,
      })
      allEntriesInTomes = allEntriesInTomes.concat(batchResult.docs as unknown as Array<Record<string, unknown>>)
    }

    const entriesInTomes = { docs: allEntriesInTomes }

    const missingFlag: Array<{
      id: number
      title: string
      collectionId: number
      collectionName: string
      is_legacy_memory: boolean | null | undefined
    }> = []

    const tomeNameMap = new Map<number, string>()
    for (const tome of memoryTomes.docs) {
      const t = tome as { id: number; name: string }
      tomeNameMap.set(t.id, t.name)
    }

    for (const entry of entriesInTomes.docs) {
      const e = entry as {
        id: number
        title?: string
        entry?: string
        knowledge_collection: number | { id: number }
        is_legacy_memory?: boolean | null
      }

      if (e.is_legacy_memory !== true) {
        const collectionId = typeof e.knowledge_collection === 'object'
          ? e.knowledge_collection.id
          : e.knowledge_collection

        missingFlag.push({
          id: e.id,
          title: e.title || (e.entry?.substring(0, 50) + '...') || 'Untitled',
          collectionId,
          collectionName: tomeNameMap.get(collectionId) || 'Unknown',
          is_legacy_memory: e.is_legacy_memory,
        })
      }
    }

    return NextResponse.json({
      success: true,
      tomes: memoryTomes.docs.map((t) => {
        const tome = t as { id: number; name: string }
        return { id: tome.id, name: tome.name }
      }),
      totalEntriesInMemoryTomes: entriesInTomes.docs.length,
      entriesMissingFlag: missingFlag.length,
      entriesWithFlag: entriesInTomes.docs.length - missingFlag.length,
      missingFlagDetails: missingFlag.slice(0, 50),
      message: missingFlag.length > 0
        ? `Found ${missingFlag.length} entries missing is_legacy_memory flag. POST to fix.`
        : 'All entries have correct flags.',
    })
  } catch (error: unknown) {
    console.error('Memory flags diagnostic error:', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Diagnostic failed' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/fix/memory-flags
 *
 * Fix knowledge entries in memory tomes by setting is_legacy_memory = true.
 *
 * Body:
 * - dryRun?: boolean (default: true) - Preview without making changes
 * - tomeId?: number - Only fix entries in a specific tome
 */
export async function POST(request: NextRequest) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Check if user is admin
    const users = await payload.find({
      collection: 'users',
      where: { email: { equals: clerkUser.emailAddresses[0]?.emailAddress } },
      overrideAccess: true,
    })

    if (users.docs.length === 0 || (users.docs[0] as { role?: string }).role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({})) as { dryRun?: boolean; tomeId?: number }
    const dryRun = body.dryRun !== false // Default to dry run
    const specificTomeId = body.tomeId

    // Get memory tomes
    const memoryTomesWhere: Record<string, unknown> = {
      'collection_metadata.collection_category': { equals: 'memories' },
    }
    if (specificTomeId) {
      memoryTomesWhere.id = { equals: specificTomeId }
    }

    const memoryTomes = await payload.find({
      collection: 'knowledgeCollections',
      where: memoryTomesWhere,
      limit: 100,
      overrideAccess: true,
    })

    const tomeIds = memoryTomes.docs.map((t) => (t as { id: number }).id)

    if (tomeIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: specificTomeId ? 'Specified tome not found or not a memory tome' : 'No memory tomes found',
        fixed: 0,
      })
    }

    // Find entries missing the flag
    // D1/SQLite has a limit on IN clause parameters, so batch in chunks of 20
    const BATCH_SIZE = 20
    let allEntriesToFix: Array<{ id: number; title?: string; entry?: string }> = []

    for (let i = 0; i < tomeIds.length; i += BATCH_SIZE) {
      const batchIds = tomeIds.slice(i, i + BATCH_SIZE)
      const batchResult = await payload.find({
        collection: 'knowledge',
        where: {
          and: [
            { knowledge_collection: { in: batchIds } },
            {
              or: [
                { is_legacy_memory: { equals: false } },
                { is_legacy_memory: { exists: false } },
              ],
            },
          ],
        },
        limit: 1000,
        overrideAccess: true,
      })
      allEntriesToFix = allEntriesToFix.concat(
        batchResult.docs as unknown as Array<{ id: number; title?: string; entry?: string }>
      )
    }

    const entriesToFix = allEntriesToFix

    if (entriesToFix.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No entries need fixing - all have is_legacy_memory flag set',
        dryRun,
        fixed: 0,
      })
    }

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        wouldFix: entriesToFix.length,
        entries: entriesToFix.slice(0, 20).map((e) => ({
          id: e.id,
          title: e.title || e.entry?.substring(0, 50) || 'Untitled',
        })),
        message: `Would fix ${entriesToFix.length} entries. Set dryRun: false to apply changes.`,
      })
    }

    // Actually fix the entries
    let fixed = 0
    const errors: string[] = []

    for (const entry of entriesToFix) {
      try {
        await payload.update({
          collection: 'knowledge',
          id: entry.id,
          data: {
            is_legacy_memory: true,
          },
          overrideAccess: true,
        })
        fixed++
      } catch (err) {
        errors.push(`Failed to update entry ${entry.id}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      dryRun: false,
      fixed,
      failed: errors.length,
      errors: errors.slice(0, 10),
      message: `Fixed ${fixed} entries${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
    })
  } catch (error: unknown) {
    console.error('Memory flags fix error:', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Fix failed' },
      { status: 500 }
    )
  }
}
