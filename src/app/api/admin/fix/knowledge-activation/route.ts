import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

// Batch size to avoid D1 parameter limits
const BATCH_SIZE = 20

/**
 * GET /api/admin/fix/knowledge-activation
 *
 * Preview which knowledge entries need activation settings fixes.
 * Checks for:
 * - Entries without activation_settings
 * - Entries without activation_mode
 * - Entries with mismatched settings for their type
 *
 * Query params:
 * - userId: Only check knowledge for a specific user ID
 * - type: Filter by entry type (legacy_memory, text, document, etc.)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get Payload instance
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Find user in Payload and verify admin
    const users = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: clerkUser.emailAddresses[0]?.emailAddress,
        },
      },
      overrideAccess: true,
    })

    if (users.docs.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found in database' },
        { status: 404 }
      )
    }

    const payloadUser = users.docs[0] as { id: number; role?: string }

    if (payloadUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const filterUserId = searchParams.get('userId')
    const filterType = searchParams.get('type')

    // Fetch knowledge entries
    const knowledgeQuery: Record<string, unknown> = {}
    if (filterUserId) {
      knowledgeQuery.user = { equals: parseInt(filterUserId, 10) }
    }
    if (filterType) {
      knowledgeQuery.type = { equals: filterType }
    }

    const allKnowledge = await payload.find({
      collection: 'knowledge',
      where: Object.keys(knowledgeQuery).length > 0 ? knowledgeQuery : undefined,
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    })

    // Categorize entries by their activation status
    const needsFix: Array<{
      id: number
      type: string
      entryPreview: string
      isLegacyMemory: boolean
      currentMode: string | null
      hasSettings: boolean
      issues: string[]
    }> = []

    const alreadyConfigured: Array<{
      id: number
      type: string
      mode: string
    }> = []

    // Track statistics
    const stats = {
      total: allKnowledge.totalDocs,
      noSettings: 0,
      noMode: 0,
      legacyMemories: 0,
      regularEntries: 0,
      byType: {} as Record<string, number>,
      byMode: {} as Record<string, number>,
    }

    for (const doc of allKnowledge.docs) {
      const k = doc as {
        id: number
        entry: string
        type: string
        is_legacy_memory?: boolean
        activation_settings?: {
          activation_mode?: string
          use_probability?: boolean
          vector_similarity_threshold?: number
          primary_keys?: Array<{ keyword: string }>
          secondary_keys?: Array<{ keyword: string }>
        }
        positioning?: {
          position?: string
        }
      }

      const entryPreview = k.entry.substring(0, 80) + (k.entry.length > 80 ? '...' : '')
      const isLegacy = k.is_legacy_memory === true
      const hasSettings = !!k.activation_settings
      const mode = k.activation_settings?.activation_mode || null

      // Track stats
      stats.byType[k.type] = (stats.byType[k.type] || 0) + 1
      if (isLegacy) stats.legacyMemories++
      else stats.regularEntries++

      if (!hasSettings) stats.noSettings++
      else if (!mode) stats.noMode++

      if (mode) {
        stats.byMode[mode] = (stats.byMode[mode] || 0) + 1
      }

      // Determine if this entry needs fixing
      const issues: string[] = []

      if (!hasSettings) {
        issues.push('Missing activation_settings')
      } else {
        if (!mode) {
          issues.push('Missing activation_mode')
        }
        if (k.activation_settings?.use_probability === undefined) {
          issues.push('Missing use_probability flag')
        }
        // Legacy memories should have keyword mode if not vectorized
        if (isLegacy && mode === 'vector') {
          issues.push('Legacy memory using vector mode but may not be vectorized')
        }
      }

      if (issues.length > 0) {
        needsFix.push({
          id: k.id,
          type: k.type,
          entryPreview,
          isLegacyMemory: isLegacy,
          currentMode: mode,
          hasSettings,
          issues,
        })
      } else {
        alreadyConfigured.push({
          id: k.id,
          type: k.type,
          mode: mode!,
        })
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        ...stats,
        needsFix: needsFix.length,
        alreadyConfigured: alreadyConfigured.length,
      },
      needsFix: needsFix.slice(0, 100),
      message: needsFix.length > 100
        ? `Showing first 100 of ${needsFix.length} entries needing fixes. Use filters to narrow down.`
        : `Found ${needsFix.length} entries needing activation settings fixes.`,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Preview failed'
    console.error('Knowledge activation fix preview error:', error)
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/fix/knowledge-activation
 *
 * Fix activation settings on knowledge entries.
 *
 * Body:
 * - strategy: 'keyword' | 'vector' | 'hybrid' | 'auto' (default: 'auto')
 *   - keyword: Set all entries to keyword mode
 *   - vector: Set all entries to vector mode
 *   - hybrid: Set all entries to hybrid mode
 *   - auto: Legacy memories get 'keyword', regular lore gets 'vector'
 * - knowledgeIds?: number[] - Only fix specific entries
 * - userId?: number - Only fix entries for a specific user
 * - type?: string - Only fix entries of a specific type
 * - dryRun?: boolean - Preview changes without applying (default: false)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get Payload instance
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Find user in Payload and verify admin
    const users = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: clerkUser.emailAddresses[0]?.emailAddress,
        },
      },
      overrideAccess: true,
    })

    if (users.docs.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found in database' },
        { status: 404 }
      )
    }

    const payloadUser = users.docs[0] as { id: number; role?: string }

    if (payloadUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse body
    const body = (await request.json().catch(() => ({}))) as {
      strategy?: 'keyword' | 'vector' | 'hybrid' | 'auto'
      knowledgeIds?: number[]
      userId?: number
      type?: string
      dryRun?: boolean
    }

    const strategy = body.strategy || 'auto'
    const specificIds = body.knowledgeIds
    const filterUserId = body.userId
    const filterType = body.type
    const dryRun = body.dryRun || false

    // Build query
    const knowledgeQuery: Record<string, unknown> = {}
    if (filterUserId) {
      knowledgeQuery.user = { equals: filterUserId }
    }
    if (filterType) {
      knowledgeQuery.type = { equals: filterType }
    }

    const allKnowledge = await payload.find({
      collection: 'knowledge',
      where: Object.keys(knowledgeQuery).length > 0 ? knowledgeQuery : undefined,
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    })

    // Filter to entries that need fixing
    let entriesToFix = allKnowledge.docs.filter((doc) => {
      const k = doc as {
        id: number
        activation_settings?: {
          activation_mode?: string
          use_probability?: boolean
        }
      }

      // Needs fix if missing settings, missing mode, or missing use_probability
      if (!k.activation_settings) return true
      if (!k.activation_settings.activation_mode) return true
      if (k.activation_settings.use_probability === undefined) return true
      return false
    })

    // Filter to specific IDs if provided
    if (specificIds && specificIds.length > 0) {
      const idSet = new Set(specificIds)
      entriesToFix = entriesToFix.filter((k: unknown) => idSet.has((k as { id: number }).id))
    }

    const results: Array<{
      id: number
      status: 'fixed' | 'skipped' | 'error'
      mode?: string
      reason?: string
    }> = []

    // Process in batches to avoid D1 issues
    for (let i = 0; i < entriesToFix.length; i += BATCH_SIZE) {
      const batch = entriesToFix.slice(i, i + BATCH_SIZE)

      for (const doc of batch) {
        const k = doc as {
          id: number
          type: string
          is_legacy_memory?: boolean
          activation_settings?: {
            activation_mode?: string
            use_probability?: boolean
            vector_similarity_threshold?: number
            probability?: number
            max_vector_results?: number
            scan_depth?: number
            match_in_user_messages?: boolean
            match_in_bot_messages?: boolean
            primary_keys?: Array<{ keyword: string }>
            secondary_keys?: Array<{ keyword: string }>
          }
          positioning?: {
            position?: string
            depth?: number
            role?: string
            order?: number
          }
        }

        // Determine target mode based on strategy
        let targetMode: string
        if (strategy === 'auto') {
          // Legacy memories use keyword, regular lore uses vector
          targetMode = k.is_legacy_memory ? 'keyword' : 'vector'
        } else {
          targetMode = strategy
        }

        // Build the complete activation_settings object
        const newActivationSettings = {
          activation_mode: targetMode as 'keyword' | 'vector' | 'hybrid' | 'constant' | 'disabled',
          // Keyword settings (for keyword/hybrid modes)
          primary_keys: k.activation_settings?.primary_keys || [],
          secondary_keys: k.activation_settings?.secondary_keys || [],
          keywords_logic: 'AND_ANY' as const,
          case_sensitive: false,
          match_whole_words: false,
          use_regex: false,
          scan_depth: k.activation_settings?.scan_depth ?? 2,
          match_in_user_messages: k.activation_settings?.match_in_user_messages ?? true,
          match_in_bot_messages: k.activation_settings?.match_in_bot_messages ?? true,
          match_in_system_prompts: false,
          // Vector settings (for vector/hybrid modes)
          vector_similarity_threshold: k.activation_settings?.vector_similarity_threshold ?? 0.7,
          max_vector_results: k.activation_settings?.max_vector_results ?? 5,
          // Probability settings
          probability: k.activation_settings?.probability ?? 100,
          use_probability: false,
        }

        // Build positioning defaults if missing
        const newPositioning = {
          position: (k.positioning?.position ?? 'before_character') as 'before_character' | 'after_character' | 'before_examples' | 'after_examples' | 'at_depth' | 'system_top' | 'system_bottom',
          depth: k.positioning?.depth ?? 0,
          role: (k.positioning?.role ?? 'system') as 'system' | 'user' | 'assistant',
          order: k.positioning?.order ?? 100,
        }

        if (dryRun) {
          results.push({
            id: k.id,
            status: 'fixed',
            mode: targetMode,
            reason: 'Dry run - would update',
          })
          continue
        }

        try {
          await payload.update({
            collection: 'knowledge',
            id: k.id,
            data: {
              activation_settings: newActivationSettings,
              positioning: newPositioning,
            },
            overrideAccess: true,
          })

          results.push({
            id: k.id,
            status: 'fixed',
            mode: targetMode,
          })
        } catch (updateError: unknown) {
          const errorMessage = updateError instanceof Error ? updateError.message : 'Update failed'
          results.push({
            id: k.id,
            status: 'error',
            reason: errorMessage,
          })
        }
      }
    }

    // Summary
    const summary = {
      processed: results.length,
      fixed: results.filter((r) => r.status === 'fixed').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
      errors: results.filter((r) => r.status === 'error').length,
      strategy,
      dryRun,
    }

    return NextResponse.json({
      success: true,
      summary,
      results: results.slice(0, 100),
      message: dryRun
        ? `Dry run complete. Would fix ${summary.fixed} entries.`
        : `Fix complete. Updated ${summary.fixed} knowledge entries with activation settings.`,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Fix failed'
    console.error('Knowledge activation fix error:', error)
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    )
  }
}
