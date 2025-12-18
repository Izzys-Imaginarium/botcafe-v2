import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  try {
    payload.logger.info('Starting locked documents fix migration...')

    // Create a default locked documents entry to prevent empty table issues
    await db.run(sql`
      INSERT OR IGNORE INTO payload_locked_documents (id, updated_at, created_at) 
      VALUES (1, datetime('now'), datetime('now'));
    `)

    // Get all users to create locked document entries for them
    const users = await payload.find({
      collection: 'users',
      limit: 1000,
    })

    if (users.docs && users.docs.length > 0) {
      for (const user of users.docs) {
        // Create locked document entries for each user
        await db.run(sql`
          INSERT OR IGNORE INTO payload_locked_documents (id, updated_at, created_at) 
          VALUES (${user.id}, datetime('now'), datetime('now'));
        `)

        // Create relationships for the user's documents
        await db.run(sql`
          INSERT OR IGNORE INTO payload_locked_documents_rels (id, parent_id, path, users_id, order)
          VALUES (${`users_${user.id}`}, ${user.id}, 'users', ${user.id}, 1);
        `)
      }
    }

    payload.logger.info('Successfully initialized locked documents system')
  } catch (error) {
    payload.logger.error(`Failed to fix locked documents system: ${error}`)
    throw error
  }
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  try {
    payload.logger.info('Reverting locked documents migration...')

    // Clean up the relationships we created
    await db.run(sql`
      DELETE FROM payload_locked_documents_rels 
      WHERE id LIKE 'users_%' OR id LIKE 'bot_%' OR id LIKE 'api_key_%' 
      OR id LIKE 'mood_%' OR id LIKE 'knowledge_%' OR id LIKE 'knowledge_collections_%'
      OR id LIKE 'conversation_%' OR id LIKE 'message_%' OR id LIKE 'memory_%'
      OR id LIKE 'token_gifts_%' OR id LIKE 'subscription_payments_%'
    `)

    // Keep the basic locked document entries but don't delete them all
    payload.logger.info('Successfully reverted locked documents migration')
  } catch (error) {
    payload.logger.error(`Failed to revert locked documents migration: ${error}`)
  }
}
