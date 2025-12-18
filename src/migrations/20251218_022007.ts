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
      for (let i = 0; i < users.docs.length; i++) {
        const user = users.docs[i]
        const relId = i + 1 // Use integer ID for the relationship

        // Create locked document entries for each user
        await db.run(sql`
          INSERT OR IGNORE INTO payload_locked_documents (id, updated_at, created_at) 
          VALUES (${user.id}, datetime('now'), datetime('now'));
        `)

        // Create relationships for the user's documents
        await db.run(sql`
          INSERT OR IGNORE INTO payload_locked_documents_rels (id, parent_id, path, users_id, \`order\`)
          VALUES (${relId}, ${user.id}, 'users', ${user.id}, 1);
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

    // Clean up the relationships we created (by path = 'users')
    await db.run(sql`
      DELETE FROM payload_locked_documents_rels 
      WHERE path = 'users'
    `)

    // Keep the basic locked document entries but don't delete them all
    payload.logger.info('Successfully reverted locked documents migration')
  } catch (error) {
    payload.logger.error(`Failed to revert locked documents migration: ${error}`)
  }
}
