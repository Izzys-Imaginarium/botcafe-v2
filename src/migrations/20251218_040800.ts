import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  try {
    payload.logger.info(
      'Creating indexes for relationship columns in payload_locked_documents_rels table...',
    )

    // Create indexes for the relationship columns (assuming columns already exist)
    const indexes = [
      { name: 'payload_locked_documents_rels_bot_id_idx', column: 'bot_id' },
      { name: 'payload_locked_documents_rels_api_key_id_idx', column: 'api_key_id' },
      { name: 'payload_locked_documents_rels_mood_id_idx', column: 'mood_id' },
      { name: 'payload_locked_documents_rels_knowledge_id_idx', column: 'knowledge_id' },
      {
        name: 'payload_locked_documents_rels_knowledge_collections_id_idx',
        column: 'knowledge_collections_id',
      },
      { name: 'payload_locked_documents_rels_conversation_id_idx', column: 'conversation_id' },
      { name: 'payload_locked_documents_rels_message_id_idx', column: 'message_id' },
      { name: 'payload_locked_documents_rels_memory_id_idx', column: 'memory_id' },
      { name: 'payload_locked_documents_rels_token_gifts_id_idx', column: 'token_gifts_id' },
      {
        name: 'payload_locked_documents_rels_subscription_payments_id_idx',
        column: 'subscription_payments_id',
      },
      {
        name: 'payload_locked_documents_rels_subscription_tiers_id_idx',
        column: 'subscription_tiers_id',
      },
      { name: 'payload_locked_documents_rels_token_packages_id_idx', column: 'token_packages_id' },
    ]

    for (const index of indexes) {
      try {
        const query = `CREATE INDEX IF NOT EXISTS ${index.name} ON payload_locked_documents_rels (${index.column})`
        await db.run(sql.raw(query))
        payload.logger.info(`Created index: ${index.name}`)
      } catch (error: any) {
        // If column doesn't exist, we might need to add it first
        if (error.message?.includes('no such column')) {
          payload.logger.warn(`Column ${index.column} doesn't exist, trying to add it first...`)
          try {
            // Try to add the column first
            const addColumnQuery = `ALTER TABLE payload_locked_documents_rels ADD COLUMN ${index.column} integer`
            await db.run(sql.raw(addColumnQuery))
            payload.logger.info(`Added column: ${index.column}`)

            // Now create the index
            const createIndexQuery = `CREATE INDEX IF NOT EXISTS ${index.name} ON payload_locked_documents_rels (${index.column})`
            await db.run(sql.raw(createIndexQuery))
            payload.logger.info(`Created index: ${index.name}`)
          } catch (addColumnError: any) {
            if (addColumnError.message?.includes('duplicate column name')) {
              payload.logger.info(`Column ${index.column} already exists, creating index...`)
              // Column exists, just create the index
              const createIndexQuery = `CREATE INDEX IF NOT EXISTS ${index.name} ON payload_locked_documents_rels (${index.column})`
              await db.run(sql.raw(createIndexQuery))
              payload.logger.info(`Created index: ${index.name}`)
            } else {
              payload.logger.warn(
                `Failed to handle column ${index.column}: ${addColumnError.message}`,
              )
            }
          }
        } else {
          payload.logger.warn(`Failed to create index ${index.name}: ${error.message}`)
        }
      }
    }

    payload.logger.info(
      'Successfully processed indexes for relationship columns in payload_locked_documents_rels table',
    )
  } catch (error) {
    payload.logger.error(`Failed to process relationship columns indexes: ${error}`)
    throw error
  }
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  try {
    payload.logger.info(
      'Removing indexes for relationship columns from payload_locked_documents_rels table...',
    )

    // Drop indexes (columns cannot be easily dropped in SQLite)
    const indexes = [
      'payload_locked_documents_rels_bot_id_idx',
      'payload_locked_documents_rels_api_key_id_idx',
      'payload_locked_documents_rels_mood_id_idx',
      'payload_locked_documents_rels_knowledge_id_idx',
      'payload_locked_documents_rels_knowledge_collections_id_idx',
      'payload_locked_documents_rels_conversation_id_idx',
      'payload_locked_documents_rels_message_id_idx',
      'payload_locked_documents_rels_memory_id_idx',
      'payload_locked_documents_rels_token_gifts_id_idx',
      'payload_locked_documents_rels_subscription_payments_id_idx',
      'payload_locked_documents_rels_subscription_tiers_id_idx',
      'payload_locked_documents_rels_token_packages_id_idx',
    ]

    for (const indexName of indexes) {
      try {
        const query = `DROP INDEX IF EXISTS ${indexName}`
        await db.run(sql.raw(query))
        payload.logger.info(`Dropped index: ${indexName}`)
      } catch (error) {
        payload.logger.warn(`Failed to drop index ${indexName}: ${error}`)
      }
    }

    payload.logger.info(
      'Successfully reverted indexes for relationship columns from payload_locked_documents_rels table',
    )
  } catch (error) {
    payload.logger.error(`Failed to revert relationship columns indexes: ${error}`)
    throw error
  }
}
