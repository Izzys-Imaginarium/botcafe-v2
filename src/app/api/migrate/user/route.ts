import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import fs from 'fs'
import path from 'path'

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

// Map old ai_engine values to new provider values
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

// Load migration data from JSON file
function loadMigrationData(): MigrationData | null {
  try {
    const migrationFilePath = path.join(process.cwd(), 'migration-data', 'migration_data.json')
    if (!fs.existsSync(migrationFilePath)) {
      console.log('Migration data file not found')
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
 * GET /api/migrate/user
 *
 * Check if the current user has migration data available.
 * Returns migration status and preview of what will be migrated.
 */
export async function GET(_request: NextRequest) {
  try {
    // Authenticate user
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userEmail = clerkUser.emailAddresses[0]?.emailAddress?.toLowerCase()
    if (!userEmail) {
      return NextResponse.json(
        { success: false, message: 'No email address found' },
        { status: 400 }
      )
    }

    // Load migration data
    const migrationData = loadMigrationData()
    if (!migrationData) {
      return NextResponse.json({
        success: true,
        hasMigrationData: false,
        message: 'No migration data available',
      })
    }

    // Check if user has migration data
    const userData = migrationData[userEmail]
    if (!userData) {
      return NextResponse.json({
        success: true,
        hasMigrationData: false,
        message: 'No migration data found for this email',
      })
    }

    // Get Payload instance to check if already migrated
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Find user in Payload
    const users = await payload.find({
      collection: 'users',
      where: {
        email: { equals: userEmail },
      },
      limit: 1,
      overrideAccess: true,
    })

    const payloadUser = users.docs[0]
    const isMigrated = payloadUser && (payloadUser as any).migration_completed === true

    return NextResponse.json({
      success: true,
      hasMigrationData: true,
      isMigrated,
      preview: {
        oldUsername: userData.username,
        collections: userData.knowledge_collections.length,
        knowledgeEntries: userData.knowledge_count || 0,
        apiKeys: userData.api_keys.length,
        personas: userData.persona_count || 0,
      },
    })
  } catch (error: any) {
    console.error('Migration check error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to check migration status' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/migrate/user
 *
 * Execute migration for the current user.
 * Creates knowledge collections and API keys from the old database.
 */
export async function POST(_request: NextRequest) {
  try {
    // Authenticate user
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userEmail = clerkUser.emailAddresses[0]?.emailAddress?.toLowerCase()
    if (!userEmail) {
      return NextResponse.json(
        { success: false, message: 'No email address found' },
        { status: 400 }
      )
    }

    // Load migration data
    const migrationData = loadMigrationData()
    if (!migrationData) {
      return NextResponse.json(
        { success: false, message: 'Migration data file not found' },
        { status: 404 }
      )
    }

    // Check if user has migration data
    const userData = migrationData[userEmail]
    if (!userData) {
      return NextResponse.json(
        { success: false, message: 'No migration data found for this email' },
        { status: 404 }
      )
    }

    // Get Payload instance
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Find or create user in Payload
    let payloadUser: any
    const users = await payload.find({
      collection: 'users',
      where: {
        email: { equals: userEmail },
      },
      limit: 1,
      overrideAccess: true,
    })

    if (users.docs.length > 0) {
      payloadUser = users.docs[0]

      // Check if already migrated
      if (payloadUser.migration_completed === true) {
        return NextResponse.json({
          success: false,
          message: 'Migration already completed for this user',
          alreadyMigrated: true,
        })
      }
    } else {
      // Create the user if they don't exist
      payloadUser = await payload.create({
        collection: 'users',
        data: {
          email: userEmail,
          name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.username,
          role: 'user',
        },
        overrideAccess: true,
      })
    }

    const migrationResults = {
      collectionsCreated: 0,
      collectionsFailed: 0,
      apiKeysCreated: 0,
      apiKeysFailed: 0,
      errors: [] as string[],
      collectionIdMapping: {} as Record<string, number>, // old_id -> new_id
    }

    // Migrate knowledge collections
    for (const collection of userData.knowledge_collections) {
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
              // Store the old type as a tag for reference
              tags: collection.type ? [{ tag: `migrated:${collection.type}` }] : [],
              language: 'en',
            },
          },
          overrideAccess: true,
        })
        migrationResults.collectionsCreated++
        migrationResults.collectionIdMapping[collection.old_id] = newCollection.id
      } catch (error: any) {
        migrationResults.collectionsFailed++
        migrationResults.errors.push(`Collection "${collection.name}": ${error.message}`)
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
        migrationResults.apiKeysCreated++
      } catch (error: any) {
        migrationResults.apiKeysFailed++
        migrationResults.errors.push(`API Key "${apiKey.name}": ${error.message}`)
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

    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      results: migrationResults,
      user: {
        id: payloadUser.id,
        email: payloadUser.email,
      },
    })
  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to execute migration' },
      { status: 500 }
    )
  }
}
