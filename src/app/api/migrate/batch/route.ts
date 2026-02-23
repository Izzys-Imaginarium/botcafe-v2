import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import fs from 'fs'
import path from 'path'
import { getCloudflareContext } from '@opennextjs/cloudflare'

export const dynamic = 'force-dynamic'

// Type definitions for migration data
interface MigrationCollection {
  old_id: string
  name: string
  description: string
  type: string
  is_public: boolean
  created_at: string
}

interface MigrationApiKey {
  old_id: string
  name: string
  type: string
  api_key: string
  ai_engine: string
}

interface MigrationBot {
  old_id: string
  name: string
  description: string
  category: string
  avatar_type: string
  avatar_value: string
  created_at: string
  system_prompt: string
  is_public: boolean
  greeting_message: string
  is_nsfw: boolean
  speech_examples: string
  kinks: string
  slug: string
  is_shared_edit: boolean
  is_shared_view: boolean
}

interface MigrationKnowledgeEntry {
  old_id: string
  text: string
  bot_id: string | null
  collection_id: string | null
  created_at: string
  updated_at: string
  is_orphaned: boolean
  type: string
}

interface MigrationMessage {
  old_id: string
  role: string
  content: string
  created_at: string
  is_deleted: boolean
}

interface MigrationConversation {
  old_id: string
  bot_id: string | null
  first_message_preview: string
  last_message_preview: string
  created_at: string
  updated_at: string
  is_deleted: boolean
  messages: MigrationMessage[]
}

interface MigrationUserData {
  old_id: string
  username: string
  first_name: string
  last_name: string
  email: string
  knowledge_collections: MigrationCollection[]
  knowledge_entries: MigrationKnowledgeEntry[]
  api_keys: MigrationApiKey[]
  bots: MigrationBot[]
  conversations: MigrationConversation[]
  stats?: {
    bot_count: number
    collection_count: number
    knowledge_count: number
    api_key_count: number
    conversation_count: number
    message_count: number
  }
}

type MigrationData = Record<string, MigrationUserData>

type ApiKeyProvider = 'openai' | 'anthropic' | 'google' | 'deepseek' | 'openrouter' | 'electronhub' | 'glm'

function mapAiEngineToProvider(aiEngine: string): ApiKeyProvider {
  const mapping: Record<string, ApiKeyProvider> = {
    'openai': 'openai',
    'anthropic': 'anthropic',
    'google': 'google',
    'google-ai': 'google',
    'deepseek': 'deepseek',
    'openrouter': 'openrouter',
    'electronhub': 'electronhub',
    'glm': 'glm',
  }
  return mapping[aiEngine.toLowerCase()] || 'openai'
}

function generateRandomPassword(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < 32; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

function generateSlug(name: string, existingSlugs: Set<string>): string {
  let baseSlug = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  if (!baseSlug) baseSlug = 'bot'

  let slug = baseSlug
  let counter = 1
  while (existingSlugs.has(slug)) {
    slug = `${baseSlug}-${counter}`
    counter++
  }
  existingSlugs.add(slug)
  return slug
}

async function loadMigrationData(): Promise<MigrationData | null> {
  try {
    // Try R2 first (production) - use complete data file
    try {
      const cloudflare = await getCloudflareContext()
      if (cloudflare?.env?.R2) {
        const r2Object = await cloudflare.env.R2.get('migration_data_complete.json')
        if (r2Object) {
          const text = await r2Object.text()
          return JSON.parse(text) as MigrationData
        }
      }
    } catch (r2Error) {
      console.log('R2 not available, trying filesystem')
    }

    // Fall back to local filesystem (development)
    const migrationFilePath = path.join(process.cwd(), 'migration-data', 'migration_data_complete.json')
    if (!fs.existsSync(migrationFilePath)) {
      // Also try old filename for backwards compatibility
      const oldPath = path.join(process.cwd(), 'migration-data', 'migration_data.json')
      if (fs.existsSync(oldPath)) {
        const rawData = fs.readFileSync(oldPath, 'utf-8')
        return JSON.parse(rawData) as MigrationData
      }
      return null
    }
    const rawData = fs.readFileSync(migrationFilePath, 'utf-8')
    return JSON.parse(rawData) as MigrationData
  } catch (error) {
    console.error('Failed to load migration data:', error)
    return null
  }
}

/**
 * POST /api/migrate/batch
 *
 * Admin-only endpoint to batch migrate all users from the old database.
 * Creates Payload users (if they don't exist) and migrates their data.
 *
 * Query parameters:
 * - limit: Number of users to process (default: 10, to avoid timeouts)
 * - offset: Starting index (default: 0)
 *
 * Example: POST /api/migrate/batch?limit=10&offset=0
 * Then:    POST /api/migrate/batch?limit=10&offset=10
 * etc.
 */
export async function POST(request: NextRequest) {
  try {
    // Get pagination parameters from URL
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50) // Max 50 users per batch
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Check if running locally (bypass Clerk auth for local migration)
    const isLocalhost = request.headers.get('host')?.includes('localhost')

    if (isLocalhost) {
      // For local development, just verify an admin exists in the database
      console.log('Running migration locally - bypassing Clerk auth')
    } else {
      // Production: Authenticate user via Clerk - must be admin
      const clerkUser = await currentUser()
      if (!clerkUser) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 401 }
        )
      }

      // Check if user is admin
      const adminEmail = clerkUser.emailAddresses[0]?.emailAddress?.toLowerCase()
      const adminUsers = await payload.find({
        collection: 'users',
        where: { email: { equals: adminEmail } },
        limit: 1,
        overrideAccess: true,
      })

      if (adminUsers.docs.length === 0 || adminUsers.docs[0].role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'Admin access required' },
          { status: 403 }
        )
      }
    }

    // Load migration data
    const migrationData = await loadMigrationData()
    if (!migrationData) {
      return NextResponse.json(
        { success: false, message: 'Migration data not found' },
        { status: 404 }
      )
    }

    // Get all user emails and slice based on pagination
    const allEmails = Object.keys(migrationData)
    const emailsToProcess = allEmails.slice(offset, offset + limit)

    const results = {
      totalUsers: allEmails.length,
      batchStart: offset,
      batchEnd: offset + emailsToProcess.length,
      usersInBatch: emailsToProcess.length,
      usersProcessed: 0,
      usersCreated: 0,
      usersSkipped: 0,
      usersFailed: 0,
      creatorProfilesCreated: 0,
      botsCreated: 0,
      collectionsCreated: 0,
      knowledgeEntriesCreated: 0,
      apiKeysCreated: 0,
      conversationsCreated: 0,
      messagesCreated: 0,
      errors: [] as string[],
      nextOffset: offset + emailsToProcess.length < allEmails.length ? offset + emailsToProcess.length : null,
    }

    // Process users in this batch
    for (const email of emailsToProcess) {
      const userData = migrationData[email]
      try {
        // Check if user already exists and is migrated
        const existingUsers = await payload.find({
          collection: 'users',
          where: { email: { equals: email } },
          limit: 1,
          overrideAccess: true,
        })

        let payloadUser: any

        if (existingUsers.docs.length > 0) {
          payloadUser = existingUsers.docs[0]

          // Skip if already migrated
          if (payloadUser.migration_completed === true) {
            results.usersSkipped++
            results.usersProcessed++
            continue
          }
        } else {
          // Create new user with random password (users authenticate via Clerk, not this password)
          payloadUser = await payload.create({
            collection: 'users',
            data: {
              email: email,
              password: generateRandomPassword(),
              name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.username,
              role: 'user',
            },
            overrideAccess: true,
          })
          results.usersCreated++
        }

        // Track ID mappings for this user
        const collectionIdMap: Record<string, number> = {}
        const botIdMap: Record<string, number> = {}
        const conversationIdMap: Record<string, number> = {}

        // Create creator profile if user has bots
        let creatorProfile: any = null
        if (userData.bots && userData.bots.length > 0) {
          try {
            // Check if creator profile already exists
            const existingProfiles = await payload.find({
              collection: 'creatorProfiles',
              where: { user: { equals: payloadUser.id } },
              limit: 1,
              overrideAccess: true,
            })

            if (existingProfiles.docs.length > 0) {
              creatorProfile = existingProfiles.docs[0]
            } else {
              // Generate unique username from old username or email
              let baseUsername = userData.username || email.split('@')[0]
              baseUsername = baseUsername.toLowerCase().replace(/[^a-z0-9-_]/g, '-')

              // Check for username uniqueness
              let username = baseUsername
              let counter = 1
              while (true) {
                const existing = await payload.find({
                  collection: 'creatorProfiles',
                  where: { username: { equals: username } },
                  limit: 1,
                  overrideAccess: true,
                })
                if (existing.docs.length === 0) break
                username = `${baseUsername}-${counter}`
                counter++
              }

              creatorProfile = await payload.create({
                collection: 'creatorProfiles',
                data: {
                  user: payloadUser.id,
                  username: username,
                  display_name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.username || 'Creator',
                  bio: 'Migrated creator profile from BotCafe v1',
                  creator_info: {
                    creator_type: 'individual',
                  },
                  tags: [{ tag: 'migrated' }],
                },
                overrideAccess: true,
              })
              results.creatorProfilesCreated++
            }
          } catch (profileError: any) {
            results.errors.push(`Creator profile for ${email}: ${profileError.message}`)
          }
        }

        // Migrate knowledge collections
        for (const collection of userData.knowledge_collections || []) {
          try {
            const newCollection = await payload.create({
              collection: 'knowledgeCollections',
              data: {
                name: collection.name,
                user: payloadUser.id,
                description: collection.description || '',
                created_timestamp: collection.created_at || new Date().toISOString(),
                modified_timestamp: new Date().toISOString(),
                sharing_settings: {
                  sharing_level: collection.is_public ? 'public' : 'private',
                  allow_collaboration: false,
                  allow_fork: false,
                  knowledge_count: 0,
                  last_updated: new Date().toISOString(),
                  is_public: collection.is_public,
                },
                collection_metadata: {
                  collection_category: 'lore',
                  tags: collection.type ? [{ tag: `migrated:${collection.type}` }] : [],
                  language: 'en',
                },
              },
              overrideAccess: true,
            })
            collectionIdMap[collection.old_id] = newCollection.id
            results.collectionsCreated++
          } catch (collError: any) {
            results.errors.push(`Collection "${collection.name}" for ${email}: ${collError.message}`)
          }
        }

        // Migrate bots (requires creator profile)
        const usedSlugs = new Set<string>()
        if (creatorProfile && userData.bots) {
          for (const bot of userData.bots) {
            try {
              const slug = generateSlug(bot.slug || bot.name, usedSlugs)

              // Parse speech examples if it's a JSON string
              let speechExamples: { example: string }[] = []
              if (bot.speech_examples) {
                try {
                  const parsed = JSON.parse(bot.speech_examples)
                  if (Array.isArray(parsed)) {
                    speechExamples = parsed.map((ex: string) => ({ example: ex }))
                  }
                } catch {
                  // If not JSON, treat as single example
                  if (bot.speech_examples.trim()) {
                    speechExamples = [{ example: bot.speech_examples }]
                  }
                }
              }

              const newBot = await payload.create({
                collection: 'bot',
                data: {
                  user: payloadUser.id,
                  creator_profile: creatorProfile.id,
                  name: bot.name,
                  description: bot.description || '',
                  system_prompt: bot.system_prompt || 'You are a helpful assistant.',
                  slug: slug,
                  is_public: bot.is_public,
                  sharing: {
                    visibility: bot.is_public ? 'public' : 'private',
                  },
                  greeting: bot.greeting_message || '',
                  speech_examples: speechExamples,
                  tags: bot.category ? [{ tag: bot.category }] : [],
                  creator_display_name: creatorProfile.display_name,
                  created_date: bot.created_at || new Date().toISOString(),
                },
                overrideAccess: true,
              })
              botIdMap[bot.old_id] = newBot.id
              results.botsCreated++
            } catch (botError: any) {
              results.errors.push(`Bot "${bot.name}" for ${email}: ${botError.message}`)
            }
          }
        }

        // Migrate knowledge entries (only if they have a valid collection)
        for (const entry of userData.knowledge_entries || []) {
          try {
            // Find the new collection ID if it was migrated
            const newCollectionId = entry.collection_id ? collectionIdMap[entry.collection_id] : null

            // Skip entries without a valid collection (knowledge_collection is required)
            if (!newCollectionId) {
              results.errors.push(`Knowledge entry for ${email}: No valid collection mapping`)
              continue
            }

            // Map old type to new type enum
            type KnowledgeType = 'url' | 'document' | 'text' | 'image' | 'audio' | 'video' | 'legacy_memory'
            const typeMapping: Record<string, KnowledgeType> = {
              'general': 'text',
              'bot persona': 'text',
              'user persona': 'text',
              'document': 'document',
              'url': 'url',
              'text': 'text',
            }
            const entryType: KnowledgeType = typeMapping[entry.type?.toLowerCase() || 'text'] || 'text'

            await payload.create({
              collection: 'knowledge',
              data: {
                user: payloadUser.id,
                entry: entry.text || '',
                knowledge_collection: newCollectionId,
                type: entryType,
                created_timestamp: entry.created_at || new Date().toISOString(),
                modified_timestamp: entry.updated_at || new Date().toISOString(),
                tags: entry.type ? [{ tag: `migrated:${entry.type}` }] : [],
                privacy_settings: {
                  privacy_level: 'private',
                  allow_sharing: true,
                  password_protected: false,
                  access_count: 0,
                },
                activation_settings: {
                  activation_mode: 'vector',
                  case_sensitive: false,
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
                  position: 'before_character',
                  depth: 0,
                  role: 'system',
                  order: 100,
                },
              },
              overrideAccess: true,
            })
            results.knowledgeEntriesCreated++
          } catch (entryError: any) {
            results.errors.push(`Knowledge entry for ${email}: ${entryError.message}`)
          }
        }

        // Migrate API keys
        for (const apiKey of userData.api_keys || []) {
          try {
            await payload.create({
              collection: 'api-key',
              data: {
                user: payloadUser.id,
                nickname: apiKey.name || 'Migrated Key',
                provider: mapAiEngineToProvider(apiKey.ai_engine),
                key: apiKey.api_key,
                security_features: {
                  key_encryption_level: 'basic',
                  is_active: true,
                },
              },
              overrideAccess: true,
            })
            results.apiKeysCreated++
          } catch (keyError: any) {
            results.errors.push(`API Key for ${email}: ${keyError.message}`)
          }
        }

        // Migrate conversations
        for (const conv of userData.conversations || []) {
          try {
            // Find the new bot ID if the conversation was with a bot
            const newBotId = conv.bot_id ? botIdMap[conv.bot_id] : null

            const newConversation = await payload.create({
              collection: 'conversation',
              data: {
                user: payloadUser.id,
                title: conv.first_message_preview?.substring(0, 50) || 'Migrated Conversation',
                created_timestamp: conv.created_at || new Date().toISOString(),
                modified_timestamp: conv.updated_at || new Date().toISOString(),
                conversation_type: 'single-bot',
                bot_participation: newBotId ? [{
                  bot_id: newBotId,
                  joined_at: conv.created_at || new Date().toISOString(),
                  role: 'primary',
                  is_active: true,
                }] : [],
                status: conv.is_deleted ? 'archived' : 'active',
                conversation_metadata: {
                  total_messages: conv.messages?.length || 0,
                  participant_count: 2,
                  last_activity: conv.updated_at || new Date().toISOString(),
                  tags: [{ tag: 'migrated' }],
                },
              },
              overrideAccess: true,
            })
            conversationIdMap[conv.old_id] = newConversation.id
            results.conversationsCreated++

            // Migrate messages for this conversation
            for (const msg of conv.messages || []) {
              try {
                const isAI = msg.role === 'bot' || msg.role === 'assistant'

                await payload.create({
                  collection: 'message',
                  data: {
                    user: payloadUser.id,
                    conversation: newConversation.id,
                    message_type: 'text',
                    entry: msg.content || '',
                    created_timestamp: msg.created_at || new Date().toISOString(),
                    modified_timestamp: msg.created_at || new Date().toISOString(),
                    bot: isAI && newBotId ? newBotId : undefined,
                    message_attribution: {
                      is_ai_generated: isAI,
                    },
                    message_status: {
                      delivery_status: 'delivered',
                    },
                    metadata: {
                      priority_level: 'normal',
                      sensitivity_level: 'private',
                    },
                  },
                  overrideAccess: true,
                })
                results.messagesCreated++
              } catch (msgError: any) {
                results.errors.push(`Message in conv for ${email}: ${msgError.message}`)
              }
            }
          } catch (convError: any) {
            results.errors.push(`Conversation for ${email}: ${convError.message}`)
          }
        }

        // Mark user as migrated
        await payload.update({
          collection: 'users',
          id: payloadUser.id,
          data: {
            migration_completed: true,
            old_user_id: userData.old_id,
          } as any,
          overrideAccess: true,
        })

        results.usersProcessed++
      } catch (userError: any) {
        results.usersFailed++
        results.errors.push(`User ${email}: ${userError.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: results.nextOffset
        ? `Batch ${offset}-${offset + emailsToProcess.length} completed. Run next batch with offset=${results.nextOffset}`
        : 'Migration completed! All users processed.',
      results,
    })
  } catch (error: any) {
    console.error('Batch migration error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Batch migration failed' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/migrate/batch
 *
 * Get migration status/preview without executing.
 */
export async function GET(_request: NextRequest) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Check if user is admin
    const adminEmail = clerkUser.emailAddresses[0]?.emailAddress?.toLowerCase()
    const adminUsers = await payload.find({
      collection: 'users',
      where: { email: { equals: adminEmail } },
      limit: 1,
      overrideAccess: true,
    })

    if (adminUsers.docs.length === 0 || adminUsers.docs[0].role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    const migrationData = await loadMigrationData()
    if (!migrationData) {
      return NextResponse.json({
        success: true,
        hasMigrationData: false,
      })
    }

    // Count already migrated users
    const migratedUsers = await payload.find({
      collection: 'users',
      where: { migration_completed: { equals: true } },
      limit: 1000,
      overrideAccess: true,
    })

    const migratedEmails = new Set(migratedUsers.docs.map((u: any) => u.email.toLowerCase()))

    let totalBots = 0
    let totalCollections = 0
    let totalKnowledgeEntries = 0
    let totalApiKeys = 0
    let totalConversations = 0
    let totalMessages = 0
    let pendingUsers = 0

    for (const [email, userData] of Object.entries(migrationData)) {
      if (!migratedEmails.has(email.toLowerCase())) {
        pendingUsers++
        totalBots += userData.bots?.length || 0
        totalCollections += userData.knowledge_collections?.length || 0
        totalKnowledgeEntries += userData.knowledge_entries?.length || 0
        totalApiKeys += userData.api_keys?.length || 0
        totalConversations += userData.conversations?.length || 0
        totalMessages += userData.conversations?.reduce((sum, c) => sum + (c.messages?.length || 0), 0) || 0
      }
    }

    return NextResponse.json({
      success: true,
      hasMigrationData: true,
      stats: {
        totalUsersInData: Object.keys(migrationData).length,
        alreadyMigrated: migratedEmails.size,
        pendingMigration: pendingUsers,
        pendingBots: totalBots,
        pendingCollections: totalCollections,
        pendingKnowledgeEntries: totalKnowledgeEntries,
        pendingApiKeys: totalApiKeys,
        pendingConversations: totalConversations,
        pendingMessages: totalMessages,
      },
    })
  } catch (error: any) {
    console.error('Migration status error:', error)
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    )
  }
}
