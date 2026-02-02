import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getCloudflareContext } from '@opennextjs/cloudflare'

export const dynamic = 'force-dynamic'

// Type for D1 query results
interface D1Result<T> {
  results: T[]
  success: boolean
}

// Old DB types
interface OldUser {
  id: string
  email: string
}

// Helper function for processing a single user's import
async function processUserImport(
  payload: Awaited<ReturnType<typeof getPayload>>,
  oldDb: any,
  oldUserId: string,
  newUserId: number,
  includeCollectionLinked: boolean,
  includeBotLinked: boolean,
  skipDuplicates: boolean,
  createMissingCollections: boolean
): Promise<{ imported: number; skipped: number; errors: number; collectionsCreated: number }> {
  // Get new collections for this user
  const newCollections = await payload.find({
    collection: 'knowledgeCollections',
    where: { user: { equals: newUserId } },
    limit: 500,
    overrideAccess: true,
  })

  const collectionNameToId = new Map<string, number>()
  for (const col of newCollections.docs) {
    const c = col as { id: number; name: string }
    collectionNameToId.set(c.name.trim().toLowerCase(), c.id)
  }

  // Get new bots for this user
  const newBots = await payload.find({
    collection: 'bot',
    where: { user: { equals: newUserId } },
    limit: 500,
    overrideAccess: true,
  })

  const botNameToLoreCollectionId = new Map<string, number>()
  for (const bot of newBots.docs) {
    const b = bot as { id: number; name: string }
    const loreCollectionName = `${b.name} Lore`.toLowerCase()
    const existingLoreCollection = collectionNameToId.get(loreCollectionName)
    if (existingLoreCollection) {
      botNameToLoreCollectionId.set(b.name.trim().toLowerCase(), existingLoreCollection)
    }
  }

  // Get existing knowledge entries for deduplication
  const existingKnowledge = await payload.find({
    collection: 'knowledge',
    where: { user: { equals: newUserId } },
    limit: 2000,
    overrideAccess: true,
  })

  const existingTexts = new Set<string>()
  for (const k of existingKnowledge.docs) {
    const entry = k as { entry: string }
    existingTexts.add(entry.entry.substring(0, 100).toLowerCase())
  }

  let imported = 0
  let skipped = 0
  let errors = 0
  let collectionsCreated = 0

  // Process collection-linked entries
  if (includeCollectionLinked) {
    const collectionLinksResult = (await oldDb
      .prepare(
        `
        SELECT kcl.knowledge_id, kcl.collection_id, kc.name as collection_name, k.text
        FROM knowledge_collection_links kcl
        JOIN knowledge_collections kc ON kcl.collection_id = kc.id
        JOIN knowledge k ON kcl.knowledge_id = k.id
        WHERE kc.owner_id = ?
      `
      )
      .bind(oldUserId)
      .all()) as D1Result<{
      knowledge_id: string
      collection_id: string
      collection_name: string
      text: string
    }>

    for (const link of collectionLinksResult.results) {
      const isDuplicate = existingTexts.has(link.text.substring(0, 100).toLowerCase())
      if (isDuplicate && skipDuplicates) {
        skipped++
        continue
      }

      let collectionId = collectionNameToId.get(link.collection_name.trim().toLowerCase())

      if (!collectionId && createMissingCollections) {
        try {
          const newCollection = await payload.create({
            collection: 'knowledgeCollections',
            data: {
              name: link.collection_name.trim(),
              user: newUserId,
              description: `Recovered from migration`,
              sharing_settings: { sharing_level: 'private' },
            },
            overrideAccess: true,
          })
          collectionId = newCollection.id
          collectionNameToId.set(link.collection_name.trim().toLowerCase(), collectionId)
          collectionsCreated++
        } catch {
          errors++
          continue
        }
      }

      if (!collectionId) {
        skipped++
        continue
      }

      try {
        await payload.create({
          collection: 'knowledge',
          data: {
            user: newUserId,
            knowledge_collection: collectionId,
            entry: link.text,
            type: 'text',
            privacy_settings: { privacy_level: 'private' },
            activation_settings: { activation_mode: 'vector' },
            positioning: { position: 'before_character' },
          },
          overrideAccess: true,
        })
        existingTexts.add(link.text.substring(0, 100).toLowerCase())
        imported++
      } catch {
        errors++
      }
    }
  }

  // Process bot-linked entries
  if (includeBotLinked) {
    const botLinksResult = (await oldDb
      .prepare(
        `
        SELECT kbl.knowledge_id, kbl.bot_id, b.name as bot_name, k.text
        FROM knowledge_bot_links kbl
        JOIN bots b ON kbl.bot_id = b.id
        JOIN knowledge k ON kbl.knowledge_id = k.id
        WHERE b.user_id = ?
      `
      )
      .bind(oldUserId)
      .all()) as D1Result<{
      knowledge_id: string
      bot_id: string
      bot_name: string
      text: string
    }>

    for (const link of botLinksResult.results) {
      const isDuplicate = existingTexts.has(link.text.substring(0, 100).toLowerCase())
      if (isDuplicate && skipDuplicates) {
        skipped++
        continue
      }

      let loreCollectionId = botNameToLoreCollectionId.get(link.bot_name.trim().toLowerCase())

      if (!loreCollectionId) {
        const loreCollectionName = `${link.bot_name} Lore`.toLowerCase()
        loreCollectionId = collectionNameToId.get(loreCollectionName)

        if (!loreCollectionId && createMissingCollections) {
          try {
            const newCollection = await payload.create({
              collection: 'knowledgeCollections',
              data: {
                name: `${link.bot_name} Lore`,
                user: newUserId,
                description: `Lore entries for ${link.bot_name}`,
                sharing_settings: { sharing_level: 'private' },
              },
              overrideAccess: true,
            })
            loreCollectionId = newCollection.id
            botNameToLoreCollectionId.set(link.bot_name.trim().toLowerCase(), loreCollectionId)
            collectionNameToId.set(`${link.bot_name} Lore`.toLowerCase(), loreCollectionId)
            collectionsCreated++
          } catch {
            errors++
            continue
          }
        }
      }

      if (!loreCollectionId) {
        skipped++
        continue
      }

      try {
        await payload.create({
          collection: 'knowledge',
          data: {
            user: newUserId,
            knowledge_collection: loreCollectionId,
            entry: link.text,
            type: 'text',
            privacy_settings: { privacy_level: 'private' },
            activation_settings: { activation_mode: 'vector' },
            positioning: { position: 'before_character' },
          },
          overrideAccess: true,
        })
        existingTexts.add(link.text.substring(0, 100).toLowerCase())
        imported++
      } catch {
        errors++
      }
    }
  }

  return { imported, skipped, errors, collectionsCreated }
}

/**
 * GET /api/admin/fix/recover-linked-knowledge
 *
 * Preview knowledge entries from the old database that are linked via
 * junction tables (knowledge_collection_links, knowledge_bot_links)
 * but may not have been migrated.
 *
 * Query params:
 * - email: Filter by user email (required)
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

    // Only admins can access this endpoint
    if (payloadUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const filterEmail = searchParams.get('email')
    const verifyMode = searchParams.get('verify') === 'true'

    // Get Cloudflare context for OLD_DB binding
    const cf = await getCloudflareContext({ async: true })
    const oldDb = (cf.env as any).OLD_DB

    if (!oldDb) {
      return NextResponse.json(
        {
          success: false,
          message:
            'OLD_DB binding not available. Ensure wrangler.jsonc has the OLD_DB binding and redeploy.',
        },
        { status: 500 }
      )
    }

    // VERIFY MODE: Comprehensive data verification
    if (verifyMode) {
      // Get counts from old database
      const oldKnowledgeCount = (await oldDb
        .prepare('SELECT COUNT(*) as count FROM knowledge')
        .all()) as D1Result<{ count: number }>

      const oldCollectionLinkedCount = (await oldDb
        .prepare('SELECT COUNT(DISTINCT knowledge_id) as count FROM knowledge_collection_links')
        .all()) as D1Result<{ count: number }>

      const oldBotLinkedCount = (await oldDb
        .prepare('SELECT COUNT(DISTINCT knowledge_id) as count FROM knowledge_bot_links')
        .all()) as D1Result<{ count: number }>

      const oldDirectLinkedCount = (await oldDb
        .prepare('SELECT COUNT(*) as count FROM knowledge WHERE collection_id IS NOT NULL')
        .all()) as D1Result<{ count: number }>

      const oldOrphanedCount = (await oldDb
        .prepare(`
          SELECT COUNT(*) as count FROM knowledge k
          WHERE k.collection_id IS NULL
          AND NOT EXISTS (SELECT 1 FROM knowledge_collection_links kcl WHERE kcl.knowledge_id = k.id)
          AND NOT EXISTS (SELECT 1 FROM knowledge_bot_links kbl WHERE kbl.knowledge_id = k.id)
        `)
        .all()) as D1Result<{ count: number }>

      // Get counts from new database
      const newKnowledgeResult = await payload.find({
        collection: 'knowledge',
        limit: 0,
        overrideAccess: true,
      })

      // Check for remaining unimported junction-linked entries
      // Get all users who have linked knowledge
      const usersWithLinks = (await oldDb
        .prepare(`
          SELECT DISTINCT u.email, u.id as user_id
          FROM users u
          WHERE EXISTS (
            SELECT 1 FROM knowledge_collections kc
            JOIN knowledge_collection_links kcl ON kcl.collection_id = kc.id
            WHERE kc.owner_id = u.id
          )
          OR EXISTS (
            SELECT 1 FROM bots b
            JOIN knowledge_bot_links kbl ON kbl.bot_id = b.id
            WHERE b.user_id = u.id
          )
        `)
        .all()) as D1Result<{ email: string; user_id: string }>

      // Get all new users
      const allNewUsers = await payload.find({
        collection: 'users',
        limit: 5000,
        overrideAccess: true,
      })

      const newUserEmailToId = new Map<string, number>()
      for (const u of allNewUsers.docs) {
        const user = u as { id: number; email: string }
        newUserEmailToId.set(user.email, user.id)
      }

      // For users who exist in both databases, check if there are still "ready" entries
      let totalRemainingReady = 0
      let totalRemainingNoMatch = 0
      const usersWithRemainingData: Array<{
        email: string
        ready: number
        noMatch: number
        duplicate: number
      }> = []

      // Sample a few users to check (to avoid hitting subrequest limits)
      const sampleUsers = usersWithLinks.results.slice(0, 20)

      for (const oldUser of sampleUsers) {
        const newUserId = newUserEmailToId.get(oldUser.email)
        if (!newUserId) continue

        // Get existing knowledge for this user
        const existingKnowledge = await payload.find({
          collection: 'knowledge',
          where: { user: { equals: newUserId } },
          limit: 2000,
          overrideAccess: true,
        })

        const existingTexts = new Set<string>()
        for (const k of existingKnowledge.docs) {
          const entry = k as { entry: string }
          existingTexts.add(entry.entry.substring(0, 100).toLowerCase())
        }

        // Check collection links
        const collectionLinks = (await oldDb
          .prepare(`
            SELECT k.text
            FROM knowledge_collection_links kcl
            JOIN knowledge_collections kc ON kcl.collection_id = kc.id
            JOIN knowledge k ON kcl.knowledge_id = k.id
            WHERE kc.owner_id = ?
          `)
          .bind(oldUser.user_id)
          .all()) as D1Result<{ text: string }>

        // Check bot links
        const botLinks = (await oldDb
          .prepare(`
            SELECT k.text
            FROM knowledge_bot_links kbl
            JOIN bots b ON kbl.bot_id = b.id
            JOIN knowledge k ON kbl.knowledge_id = k.id
            WHERE b.user_id = ?
          `)
          .bind(oldUser.user_id)
          .all()) as D1Result<{ text: string }>

        let ready = 0
        let noMatch = 0
        let duplicate = 0

        for (const link of [...collectionLinks.results, ...botLinks.results]) {
          const isDuplicate = existingTexts.has(link.text.substring(0, 100).toLowerCase())
          if (isDuplicate) {
            duplicate++
          } else {
            // For simplicity, count as ready (could be noMatch but that requires more queries)
            ready++
          }
        }

        if (ready > 0 || noMatch > 0) {
          usersWithRemainingData.push({ email: oldUser.email, ready, noMatch, duplicate })
          totalRemainingReady += ready
          totalRemainingNoMatch += noMatch
        }
      }

      return NextResponse.json({
        success: true,
        mode: 'verify',
        oldDatabase: {
          totalKnowledge: oldKnowledgeCount.results[0]?.count || 0,
          collectionLinked: oldCollectionLinkedCount.results[0]?.count || 0,
          botLinked: oldBotLinkedCount.results[0]?.count || 0,
          directLinked: oldDirectLinkedCount.results[0]?.count || 0,
          orphaned: oldOrphanedCount.results[0]?.count || 0,
        },
        newDatabase: {
          totalKnowledge: newKnowledgeResult.totalDocs,
        },
        verification: {
          usersWithLinkedKnowledge: usersWithLinks.results.length,
          usersSampled: sampleUsers.length,
          remainingReadyEntries: totalRemainingReady,
          remainingNoMatchEntries: totalRemainingNoMatch,
          usersWithRemainingData,
          allImported: totalRemainingReady === 0 && totalRemainingNoMatch === 0,
        },
        message:
          totalRemainingReady === 0
            ? 'All sampled users have their junction-linked knowledge imported. Run without verify to check specific users.'
            : `Found ${totalRemainingReady} remaining entries across ${usersWithRemainingData.length} sampled users that may not be imported.`,
      })
    }

    // If no email provided, list all users with linked knowledge
    if (!filterEmail) {
      // Get all users with collection-linked entries
      const collectionLinkUsers = (await oldDb
        .prepare(
          `
          SELECT u.email, u.id as user_id, COUNT(DISTINCT kcl.knowledge_id) as collection_linked_count
          FROM users u
          JOIN knowledge_collections kc ON kc.owner_id = u.id
          JOIN knowledge_collection_links kcl ON kcl.collection_id = kc.id
          GROUP BY u.id, u.email
          ORDER BY collection_linked_count DESC
        `
        )
        .all()) as D1Result<{ email: string; user_id: string; collection_linked_count: number }>

      // Get all users with bot-linked entries
      const botLinkUsers = (await oldDb
        .prepare(
          `
          SELECT u.email, u.id as user_id, COUNT(DISTINCT kbl.knowledge_id) as bot_linked_count
          FROM users u
          JOIN bots b ON b.user_id = u.id
          JOIN knowledge_bot_links kbl ON kbl.bot_id = b.id
          GROUP BY u.id, u.email
          ORDER BY bot_linked_count DESC
        `
        )
        .all()) as D1Result<{ email: string; user_id: string; bot_linked_count: number }>

      // Merge the results
      const userMap = new Map<
        string,
        { email: string; collectionLinked: number; botLinked: number; total: number }
      >()

      for (const u of collectionLinkUsers.results) {
        userMap.set(u.email, {
          email: u.email,
          collectionLinked: u.collection_linked_count,
          botLinked: 0,
          total: u.collection_linked_count,
        })
      }

      for (const u of botLinkUsers.results) {
        const existing = userMap.get(u.email)
        if (existing) {
          existing.botLinked = u.bot_linked_count
          existing.total += u.bot_linked_count
        } else {
          userMap.set(u.email, {
            email: u.email,
            collectionLinked: 0,
            botLinked: u.bot_linked_count,
            total: u.bot_linked_count,
          })
        }
      }

      const users = Array.from(userMap.values()).sort((a, b) => b.total - a.total)

      return NextResponse.json({
        success: true,
        message: `Found ${users.length} users with linked knowledge entries in old database`,
        users,
        totalCollectionLinked: users.reduce((sum, u) => sum + u.collectionLinked, 0),
        totalBotLinked: users.reduce((sum, u) => sum + u.botLinked, 0),
      })
    }

    // Find the user in the old database
    const oldUserResult = (await oldDb
      .prepare('SELECT id, email FROM users WHERE email = ?')
      .bind(filterEmail)
      .all()) as D1Result<OldUser>

    if (!oldUserResult.results.length) {
      return NextResponse.json(
        { success: false, message: `User with email ${filterEmail} not found in old database` },
        { status: 404 }
      )
    }

    const oldUserId = oldUserResult.results[0].id

    // Get linked knowledge entries from knowledge_collection_links
    const collectionLinksResult = (await oldDb
      .prepare(
        `
      SELECT kcl.knowledge_id, kcl.collection_id, kc.name as collection_name, k.text
      FROM knowledge_collection_links kcl
      JOIN knowledge_collections kc ON kcl.collection_id = kc.id
      JOIN knowledge k ON kcl.knowledge_id = k.id
      WHERE kc.owner_id = ?
    `
      )
      .bind(oldUserId)
      .all()) as D1Result<{
      knowledge_id: string
      collection_id: string
      collection_name: string
      text: string
    }>

    // Get linked knowledge entries from knowledge_bot_links
    const botLinksResult = (await oldDb
      .prepare(
        `
      SELECT kbl.knowledge_id, kbl.bot_id, b.name as bot_name, k.text
      FROM knowledge_bot_links kbl
      JOIN bots b ON kbl.bot_id = b.id
      JOIN knowledge k ON kbl.knowledge_id = k.id
      WHERE b.user_id = ?
    `
      )
      .bind(oldUserId)
      .all()) as D1Result<{
      knowledge_id: string
      bot_id: string
      bot_name: string
      text: string
    }>

    // Get user's collections in the new database
    const newUserResult = await payload.find({
      collection: 'users',
      where: { email: { equals: filterEmail } },
      overrideAccess: true,
    })

    if (!newUserResult.docs.length) {
      return NextResponse.json(
        { success: false, message: `User with email ${filterEmail} not found in new database` },
        { status: 404 }
      )
    }

    const newUserId = newUserResult.docs[0].id

    // Get new collections for this user
    const newCollections = await payload.find({
      collection: 'knowledgeCollections',
      where: { user: { equals: newUserId } },
      limit: 500,
      overrideAccess: true,
    })

    // Build map of collection name -> new collection ID
    const collectionNameToId = new Map<string, number>()
    for (const col of newCollections.docs) {
      const c = col as { id: number; name: string }
      collectionNameToId.set(c.name.trim().toLowerCase(), c.id)
    }

    // Get new bots for this user
    const newBots = await payload.find({
      collection: 'bot',
      where: { user: { equals: newUserId } },
      limit: 500,
      overrideAccess: true,
    })

    // Build map of bot name -> new bot ID
    const botNameToId = new Map<string, number>()
    for (const bot of newBots.docs) {
      const b = bot as { id: number; name: string }
      botNameToId.set(b.name.trim().toLowerCase(), b.id)
    }

    // Get existing knowledge entries in new DB to check for duplicates
    const existingKnowledge = await payload.find({
      collection: 'knowledge',
      where: { user: { equals: newUserId } },
      limit: 2000,
      overrideAccess: true,
    })

    // Build set of existing entry texts (first 100 chars) for deduplication
    const existingTexts = new Set<string>()
    for (const k of existingKnowledge.docs) {
      const entry = k as { entry: string }
      existingTexts.add(entry.entry.substring(0, 100).toLowerCase())
    }

    // Process collection-linked entries
    const collectionEntries: Array<{
      oldKnowledgeId: string
      oldCollectionId: string
      collectionName: string
      newCollectionId: number | null
      text: string
      textPreview: string
      status: 'ready' | 'no_match' | 'duplicate'
      reason?: string
    }> = []

    for (const link of collectionLinksResult.results) {
      const newCollectionId = collectionNameToId.get(link.collection_name.trim().toLowerCase())
      const isDuplicate = existingTexts.has(link.text.substring(0, 100).toLowerCase())

      collectionEntries.push({
        oldKnowledgeId: link.knowledge_id,
        oldCollectionId: link.collection_id,
        collectionName: link.collection_name,
        newCollectionId: newCollectionId || null,
        text: link.text,
        textPreview: link.text.substring(0, 100) + (link.text.length > 100 ? '...' : ''),
        status: isDuplicate ? 'duplicate' : newCollectionId ? 'ready' : 'no_match',
        reason: isDuplicate
          ? 'Entry already exists in new DB'
          : !newCollectionId
            ? `Collection "${link.collection_name}" not found in new DB`
            : undefined,
      })
    }

    // Process bot-linked entries
    const botEntries: Array<{
      oldKnowledgeId: string
      oldBotId: string
      botName: string
      newBotId: number | null
      text: string
      textPreview: string
      status: 'ready' | 'no_match' | 'duplicate'
      reason?: string
    }> = []

    for (const link of botLinksResult.results) {
      const newBotId = botNameToId.get(link.bot_name.trim().toLowerCase())
      const isDuplicate = existingTexts.has(link.text.substring(0, 100).toLowerCase())

      botEntries.push({
        oldKnowledgeId: link.knowledge_id,
        oldBotId: link.bot_id,
        botName: link.bot_name,
        newBotId: newBotId || null,
        text: link.text,
        textPreview: link.text.substring(0, 100) + (link.text.length > 100 ? '...' : ''),
        status: isDuplicate ? 'duplicate' : newBotId ? 'ready' : 'no_match',
        reason: isDuplicate
          ? 'Entry already exists in new DB'
          : !newBotId
            ? `Bot "${link.bot_name}" not found in new DB`
            : undefined,
      })
    }

    // Summary by collection
    const collectionSummary: Record<
      string,
      { total: number; ready: number; duplicate: number; noMatch: number }
    > = {}
    for (const entry of collectionEntries) {
      if (!collectionSummary[entry.collectionName]) {
        collectionSummary[entry.collectionName] = { total: 0, ready: 0, duplicate: 0, noMatch: 0 }
      }
      collectionSummary[entry.collectionName].total++
      if (entry.status === 'ready') collectionSummary[entry.collectionName].ready++
      if (entry.status === 'duplicate') collectionSummary[entry.collectionName].duplicate++
      if (entry.status === 'no_match') collectionSummary[entry.collectionName].noMatch++
    }

    // Summary by bot
    const botSummary: Record<
      string,
      { total: number; ready: number; duplicate: number; noMatch: number }
    > = {}
    for (const entry of botEntries) {
      if (!botSummary[entry.botName]) {
        botSummary[entry.botName] = { total: 0, ready: 0, duplicate: 0, noMatch: 0 }
      }
      botSummary[entry.botName].total++
      if (entry.status === 'ready') botSummary[entry.botName].ready++
      if (entry.status === 'duplicate') botSummary[entry.botName].duplicate++
      if (entry.status === 'no_match') botSummary[entry.botName].noMatch++
    }

    const summary = {
      collectionLinked: {
        total: collectionEntries.length,
        ready: collectionEntries.filter((e) => e.status === 'ready').length,
        duplicate: collectionEntries.filter((e) => e.status === 'duplicate').length,
        noMatch: collectionEntries.filter((e) => e.status === 'no_match').length,
        byCollection: collectionSummary,
      },
      botLinked: {
        total: botEntries.length,
        ready: botEntries.filter((e) => e.status === 'ready').length,
        duplicate: botEntries.filter((e) => e.status === 'duplicate').length,
        noMatch: botEntries.filter((e) => e.status === 'no_match').length,
        byBot: botSummary,
      },
    }

    return NextResponse.json({
      success: true,
      email: filterEmail,
      oldUserId,
      newUserId,
      summary,
      collectionEntries: collectionEntries.slice(0, 50), // Preview first 50
      botEntries: botEntries.slice(0, 50), // Preview first 50
      message: `Found ${collectionEntries.length} collection-linked and ${botEntries.length} bot-linked entries. Use POST to import.`,
    })
  } catch (error: any) {
    console.error('Recover linked knowledge preview error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Preview failed' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/fix/recover-linked-knowledge
 *
 * Import knowledge entries from the old database that are linked via
 * junction tables into the new database.
 *
 * Body:
 * - email: string - User's email (required unless `all` is true)
 * - all?: boolean - Process all users with linked knowledge (default: false)
 * - includeCollectionLinked?: boolean - Import collection-linked entries (default: true)
 * - includeBotLinked?: boolean - Import bot-linked entries (default: true)
 * - skipDuplicates?: boolean - Skip entries that already exist (default: true)
 * - createMissingCollections?: boolean - Create collections that don't exist (default: false)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
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

    // Only admins can access this endpoint
    if (payloadUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse body
    const body = (await request.json().catch(() => ({}))) as {
      email?: string
      all?: boolean
      limit?: number
      offset?: number
      includeCollectionLinked?: boolean
      includeBotLinked?: boolean
      skipDuplicates?: boolean
      createMissingCollections?: boolean
    }

    const filterEmail = body.email
    const processAll = body.all === true
    const batchLimit = body.limit || 10 // Default to 10 users per batch to stay under subrequest limits
    const batchOffset = body.offset || 0
    const includeCollectionLinked = body.includeCollectionLinked !== false
    const includeBotLinked = body.includeBotLinked !== false
    const skipDuplicates = body.skipDuplicates !== false
    const createMissingCollections = body.createMissingCollections === true

    // Get Cloudflare context for OLD_DB binding
    const cf = await getCloudflareContext({ async: true })
    const oldDb = (cf.env as any).OLD_DB

    if (!oldDb) {
      return NextResponse.json(
        { success: false, message: 'OLD_DB binding not available' },
        { status: 500 }
      )
    }

    // BATCH MODE: Process all users
    if (processAll) {
      // Get all users from old database with linked knowledge (with their old IDs)
      const oldUsersWithLinks = (await oldDb
        .prepare(
          `
          SELECT DISTINCT u.email, u.id as user_id
          FROM users u
          WHERE EXISTS (
            SELECT 1 FROM knowledge_collections kc
            JOIN knowledge_collection_links kcl ON kcl.collection_id = kc.id
            WHERE kc.owner_id = u.id
          )
          OR EXISTS (
            SELECT 1 FROM bots b
            JOIN knowledge_bot_links kbl ON kbl.bot_id = b.id
            WHERE b.user_id = u.id
          )
        `
        )
        .all()) as D1Result<{ email: string; user_id: string }>

      // Build map of email -> old user ID
      const oldUserEmailToId = new Map<string, string>()
      for (const u of oldUsersWithLinks.results) {
        oldUserEmailToId.set(u.email, u.user_id)
      }

      // Get ALL users from new database in a single query
      const allNewUsers = await payload.find({
        collection: 'users',
        limit: 5000,
        overrideAccess: true,
      })

      // Build map of email -> new user ID
      const newUserEmailToId = new Map<string, number>()
      for (const u of allNewUsers.docs) {
        const user = u as { id: number; email: string }
        newUserEmailToId.set(user.email, user.id)
      }

      const batchResults: Array<{
        email: string
        status: 'success' | 'skipped' | 'error'
        imported?: number
        skipped?: number
        errors?: number
        collectionsCreated?: number
        reason?: string
      }> = []

      let totalImported = 0
      let totalSkipped = 0
      let totalErrors = 0
      let totalCollectionsCreated = 0

      // Convert to array and apply limit/offset for pagination
      const allUserEntries = Array.from(oldUserEmailToId.entries())
      const totalUsers = allUserEntries.length
      const usersToProcess = allUserEntries.slice(batchOffset, batchOffset + batchLimit)

      for (const [email, oldUserId] of usersToProcess) {
        // Check if user exists in new database (using pre-fetched map)
        const newUserId = newUserEmailToId.get(email)

        if (!newUserId) {
          batchResults.push({
            email,
            status: 'skipped',
            reason: 'User not found in new database',
          })
          continue
        }

        try {
          // Process this user
          const userResult = await processUserImport(
            payload,
            oldDb,
            oldUserId,
            newUserId,
            includeCollectionLinked,
            includeBotLinked,
            skipDuplicates,
            createMissingCollections
          )

          batchResults.push({
            email,
            status: 'success',
            imported: userResult.imported,
            skipped: userResult.skipped,
            errors: userResult.errors,
            collectionsCreated: userResult.collectionsCreated,
          })

          totalImported += userResult.imported
          totalSkipped += userResult.skipped
          totalErrors += userResult.errors
          totalCollectionsCreated += userResult.collectionsCreated
        } catch (err: any) {
          batchResults.push({
            email,
            status: 'error',
            reason: err.message,
          })
        }
      }

      const hasMore = batchOffset + batchLimit < totalUsers
      const nextOffset = batchOffset + batchLimit

      return NextResponse.json({
        success: true,
        mode: 'batch',
        pagination: {
          totalUsers,
          offset: batchOffset,
          limit: batchLimit,
          processed: usersToProcess.length,
          hasMore,
          nextOffset: hasMore ? nextOffset : null,
        },
        summary: {
          usersProcessed: batchResults.filter((r) => r.status === 'success').length,
          usersSkipped: batchResults.filter((r) => r.status === 'skipped').length,
          usersErrored: batchResults.filter((r) => r.status === 'error').length,
          totalImported,
          totalSkipped,
          totalErrors,
          totalCollectionsCreated,
        },
        results: batchResults,
        message: `Processed ${usersToProcess.length} of ${totalUsers} users (offset ${batchOffset}). Imported ${totalImported} entries.${hasMore ? ` Run again with offset: ${nextOffset} to continue.` : ' All users processed.'}`,
      })
    }

    // SINGLE USER MODE
    if (!filterEmail) {
      return NextResponse.json(
        { success: false, message: 'email is required in body (or set all: true for batch mode)' },
        { status: 400 }
      )
    }

    // Find the user in the old database
    const oldUserResult = (await oldDb
      .prepare('SELECT id, email FROM users WHERE email = ?')
      .bind(filterEmail)
      .all()) as D1Result<OldUser>

    if (!oldUserResult.results.length) {
      return NextResponse.json(
        { success: false, message: `User with email ${filterEmail} not found in old database` },
        { status: 404 }
      )
    }

    const oldUserId = oldUserResult.results[0].id

    // Get new user
    const newUserResult = await payload.find({
      collection: 'users',
      where: { email: { equals: filterEmail } },
      overrideAccess: true,
    })

    if (!newUserResult.docs.length) {
      return NextResponse.json(
        { success: false, message: `User with email ${filterEmail} not found in new database` },
        { status: 404 }
      )
    }

    const newUserId = newUserResult.docs[0].id

    // Get new collections for this user
    const newCollections = await payload.find({
      collection: 'knowledgeCollections',
      where: { user: { equals: newUserId } },
      limit: 500,
      overrideAccess: true,
    })

    // Build map of collection name -> new collection
    const collectionNameToId = new Map<string, number>()
    for (const col of newCollections.docs) {
      const c = col as { id: number; name: string }
      collectionNameToId.set(c.name.trim().toLowerCase(), c.id)
    }

    // Get new bots for this user
    const newBots = await payload.find({
      collection: 'bot',
      where: { user: { equals: newUserId } },
      limit: 500,
      overrideAccess: true,
    })

    // Build map of bot name -> new bot lore collection
    // We'll need to find or create "<BotName> Lore" collections
    const botNameToLoreCollectionId = new Map<string, number>()
    for (const bot of newBots.docs) {
      const b = bot as { id: number; name: string }
      const loreCollectionName = `${b.name} Lore`.toLowerCase()
      const existingLoreCollection = collectionNameToId.get(loreCollectionName)
      if (existingLoreCollection) {
        botNameToLoreCollectionId.set(b.name.trim().toLowerCase(), existingLoreCollection)
      }
    }

    // Get existing knowledge entries for deduplication
    const existingKnowledge = await payload.find({
      collection: 'knowledge',
      where: { user: { equals: newUserId } },
      limit: 2000,
      overrideAccess: true,
    })

    const existingTexts = new Set<string>()
    for (const k of existingKnowledge.docs) {
      const entry = k as { entry: string }
      existingTexts.add(entry.entry.substring(0, 100).toLowerCase())
    }

    const results: Array<{
      type: 'collection' | 'bot'
      sourceName: string
      status: 'imported' | 'skipped' | 'error' | 'collection_created'
      reason?: string
      newKnowledgeId?: number
      newCollectionId?: number
    }> = []

    // Process collection-linked entries
    if (includeCollectionLinked) {
      const collectionLinksResult = (await oldDb
        .prepare(
          `
        SELECT kcl.knowledge_id, kcl.collection_id, kc.name as collection_name, k.text
        FROM knowledge_collection_links kcl
        JOIN knowledge_collections kc ON kcl.collection_id = kc.id
        JOIN knowledge k ON kcl.knowledge_id = k.id
        WHERE kc.owner_id = ?
      `
        )
        .bind(oldUserId)
        .all()) as D1Result<{
        knowledge_id: string
        collection_id: string
        collection_name: string
        text: string
      }>

      for (const link of collectionLinksResult.results) {
        const isDuplicate = existingTexts.has(link.text.substring(0, 100).toLowerCase())
        if (isDuplicate && skipDuplicates) {
          results.push({
            type: 'collection',
            sourceName: link.collection_name,
            status: 'skipped',
            reason: 'Duplicate entry',
          })
          continue
        }

        let collectionId = collectionNameToId.get(link.collection_name.trim().toLowerCase())

        // Create collection if it doesn't exist and createMissingCollections is true
        if (!collectionId && createMissingCollections) {
          try {
            const newCollection = await payload.create({
              collection: 'knowledgeCollections',
              data: {
                name: link.collection_name.trim(),
                user: newUserId,
                description: `Recovered from migration`,
                sharing_settings: {
                  sharing_level: 'private',
                },
              },
              overrideAccess: true,
            })
            collectionId = newCollection.id
            collectionNameToId.set(link.collection_name.trim().toLowerCase(), collectionId)
            results.push({
              type: 'collection',
              sourceName: link.collection_name,
              status: 'collection_created',
              newCollectionId: collectionId,
            })
          } catch (err: any) {
            results.push({
              type: 'collection',
              sourceName: link.collection_name,
              status: 'error',
              reason: `Failed to create collection: ${err.message}`,
            })
            continue
          }
        }

        if (!collectionId) {
          results.push({
            type: 'collection',
            sourceName: link.collection_name,
            status: 'skipped',
            reason: `Collection "${link.collection_name}" not found`,
          })
          continue
        }

        // Create the knowledge entry
        try {
          const newKnowledge = await payload.create({
            collection: 'knowledge',
            data: {
              user: newUserId,
              knowledge_collection: collectionId,
              entry: link.text,
              type: 'text',
              privacy_settings: {
                privacy_level: 'private',
              },
              activation_settings: {
                activation_mode: 'vector',
              },
              positioning: {
                position: 'before_character',
              },
            },
            overrideAccess: true,
          })

          existingTexts.add(link.text.substring(0, 100).toLowerCase())

          results.push({
            type: 'collection',
            sourceName: link.collection_name,
            status: 'imported',
            newKnowledgeId: newKnowledge.id,
            newCollectionId: collectionId,
          })
        } catch (err: any) {
          results.push({
            type: 'collection',
            sourceName: link.collection_name,
            status: 'error',
            reason: err.message,
          })
        }
      }
    }

    // Process bot-linked entries
    if (includeBotLinked) {
      const botLinksResult = (await oldDb
        .prepare(
          `
        SELECT kbl.knowledge_id, kbl.bot_id, b.name as bot_name, k.text
        FROM knowledge_bot_links kbl
        JOIN bots b ON kbl.bot_id = b.id
        JOIN knowledge k ON kbl.knowledge_id = k.id
        WHERE b.user_id = ?
      `
        )
        .bind(oldUserId)
        .all()) as D1Result<{
        knowledge_id: string
        bot_id: string
        bot_name: string
        text: string
      }>

      for (const link of botLinksResult.results) {
        const isDuplicate = existingTexts.has(link.text.substring(0, 100).toLowerCase())
        if (isDuplicate && skipDuplicates) {
          results.push({
            type: 'bot',
            sourceName: link.bot_name,
            status: 'skipped',
            reason: 'Duplicate entry',
          })
          continue
        }

        // Find or create the bot's lore collection
        let loreCollectionId = botNameToLoreCollectionId.get(link.bot_name.trim().toLowerCase())

        if (!loreCollectionId) {
          // Try to find it
          const loreCollectionName = `${link.bot_name} Lore`.toLowerCase()
          loreCollectionId = collectionNameToId.get(loreCollectionName)

          if (!loreCollectionId && createMissingCollections) {
            // Create the lore collection
            try {
              const newCollection = await payload.create({
                collection: 'knowledgeCollections',
                data: {
                  name: `${link.bot_name} Lore`,
                  user: newUserId,
                  description: `Lore entries for ${link.bot_name}`,
                  sharing_settings: {
                    sharing_level: 'private',
                  },
                },
                overrideAccess: true,
              })
              loreCollectionId = newCollection.id
              botNameToLoreCollectionId.set(link.bot_name.trim().toLowerCase(), loreCollectionId)
              collectionNameToId.set(`${link.bot_name} Lore`.toLowerCase(), loreCollectionId)
              results.push({
                type: 'bot',
                sourceName: link.bot_name,
                status: 'collection_created',
                newCollectionId: loreCollectionId,
              })
            } catch (err: any) {
              results.push({
                type: 'bot',
                sourceName: link.bot_name,
                status: 'error',
                reason: `Failed to create lore collection: ${err.message}`,
              })
              continue
            }
          }
        }

        if (!loreCollectionId) {
          results.push({
            type: 'bot',
            sourceName: link.bot_name,
            status: 'skipped',
            reason: `No lore collection for bot "${link.bot_name}"`,
          })
          continue
        }

        // Create the knowledge entry
        try {
          const newKnowledge = await payload.create({
            collection: 'knowledge',
            data: {
              user: newUserId,
              knowledge_collection: loreCollectionId,
              entry: link.text,
              type: 'text',
              privacy_settings: {
                privacy_level: 'private',
              },
              activation_settings: {
                activation_mode: 'vector',
              },
              positioning: {
                position: 'before_character',
              },
            },
            overrideAccess: true,
          })

          existingTexts.add(link.text.substring(0, 100).toLowerCase())

          results.push({
            type: 'bot',
            sourceName: link.bot_name,
            status: 'imported',
            newKnowledgeId: newKnowledge.id,
            newCollectionId: loreCollectionId,
          })
        } catch (err: any) {
          results.push({
            type: 'bot',
            sourceName: link.bot_name,
            status: 'error',
            reason: err.message,
          })
        }
      }
    }

    const summary = {
      total: results.length,
      imported: results.filter((r) => r.status === 'imported').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
      errors: results.filter((r) => r.status === 'error').length,
      collectionsCreated: results.filter((r) => r.status === 'collection_created').length,
    }

    return NextResponse.json({
      success: true,
      email: filterEmail,
      summary,
      results,
      message: `Imported ${summary.imported} entries, skipped ${summary.skipped}, ${summary.errors} errors.`,
    })
  } catch (error: any) {
    console.error('Recover linked knowledge import error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Import failed' },
      { status: 500 }
    )
  }
}
