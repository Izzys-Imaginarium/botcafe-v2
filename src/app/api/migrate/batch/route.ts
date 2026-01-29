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

interface MigrationUserData {
  old_id: string
  username: string
  first_name: string
  last_name: string
  email: string
  knowledge_collections: MigrationCollection[]
  knowledge_count?: number
  api_keys: MigrationApiKey[]
  persona_count?: number
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

async function loadMigrationData(): Promise<MigrationData | null> {
  try {
    try {
      const cloudflare = await getCloudflareContext()
      if (cloudflare?.env?.R2) {
        const r2Object = await cloudflare.env.R2.get('migration_data.json')
        if (r2Object) {
          const text = await r2Object.text()
          return JSON.parse(text) as MigrationData
        }
      }
    } catch (r2Error) {
      console.log('R2 not available, trying filesystem')
    }

    const migrationFilePath = path.join(process.cwd(), 'migration-data', 'migration_data.json')
    if (!fs.existsSync(migrationFilePath)) {
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
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user - must be admin
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

    // Load migration data
    const migrationData = await loadMigrationData()
    if (!migrationData) {
      return NextResponse.json(
        { success: false, message: 'Migration data not found' },
        { status: 404 }
      )
    }

    const results = {
      totalUsers: Object.keys(migrationData).length,
      usersProcessed: 0,
      usersCreated: 0,
      usersSkipped: 0,
      usersFailed: 0,
      collectionsCreated: 0,
      apiKeysCreated: 0,
      errors: [] as string[],
    }

    // Process each user in the migration data
    for (const [email, userData] of Object.entries(migrationData)) {
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
          // Create new user
          payloadUser = await payload.create({
            collection: 'users',
            data: {
              email: email,
              name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.username,
              role: 'user',
            },
            overrideAccess: true,
          })
          results.usersCreated++
        }

        // Migrate knowledge collections
        for (const collection of userData.knowledge_collections) {
          try {
            await payload.create({
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
                  tags: collection.type ? [{ tag: `migrated:${collection.type}` }] : [],
                  language: 'en',
                },
              },
              overrideAccess: true,
            })
            results.collectionsCreated++
          } catch (collError: any) {
            results.errors.push(`Collection "${collection.name}" for ${email}: ${collError.message}`)
          }
        }

        // Migrate API keys
        for (const apiKey of userData.api_keys) {
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
      message: 'Batch migration completed',
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

    let totalCollections = 0
    let totalApiKeys = 0
    let pendingUsers = 0

    for (const [email, userData] of Object.entries(migrationData)) {
      if (!migratedEmails.has(email.toLowerCase())) {
        pendingUsers++
        totalCollections += userData.knowledge_collections.length
        totalApiKeys += userData.api_keys.length
      }
    }

    return NextResponse.json({
      success: true,
      hasMigrationData: true,
      stats: {
        totalUsersInData: Object.keys(migrationData).length,
        alreadyMigrated: migratedEmails.size,
        pendingMigration: pendingUsers,
        pendingCollections: totalCollections,
        pendingApiKeys: totalApiKeys,
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
