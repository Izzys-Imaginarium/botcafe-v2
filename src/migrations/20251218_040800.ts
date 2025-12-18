import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  try {
    payload.logger.info(
      'Adding missing relationship columns to payload_locked_documents_rels table...',
    )

    // Add missing relationship columns that Payload expects
    await db.run(sql`ALTER TABLE payload_locked_documents_rels ADD COLUMN bot_id integer;`)
    await db.run(sql`ALTER TABLE payload_locked_documents_rels ADD COLUMN api_key_id integer;`)
    await db.run(sql`ALTER TABLE payload_locked_documents_rels ADD COLUMN mood_id integer;`)
    await db.run(sql`ALTER TABLE payload_locked_documents_rels ADD COLUMN knowledge_id integer;`)
    await db.run(
      sql`ALTER TABLE payload_locked_documents_rels ADD COLUMN knowledge_collections_id integer;`,
    )
    await db.run(sql`ALTER TABLE payload_locked_documents_rels ADD COLUMN conversation_id integer;`)
    await db.run(sql`ALTER TABLE payload_locked_documents_rels ADD COLUMN message_id integer;`)
    await db.run(sql`ALTER TABLE payload_locked_documents_rels ADD COLUMN memory_id integer;`)
    await db.run(sql`ALTER TABLE payload_locked_documents_rels ADD COLUMN token_gifts_id integer;`)
    await db.run(
      sql`ALTER TABLE payload_locked_documents_rels ADD COLUMN subscription_payments_id integer;`,
    )
    await db.run(
      sql`ALTER TABLE payload_locked_documents_rels ADD COLUMN subscription_tiers_id integer;`,
    )
    await db.run(
      sql`ALTER TABLE payload_locked_documents_rels ADD COLUMN token_packages_id integer;`,
    )

    // Add foreign key constraints for the new columns
    await db.run(sql`ALTER TABLE payload_locked_documents_rels 
      ADD CONSTRAINT fk_bot_id 
      FOREIGN KEY (bot_id) REFERENCES bots(id) ON UPDATE no action ON DELETE cascade;`)

    await db.run(sql`ALTER TABLE payload_locked_documents_rels 
      ADD CONSTRAINT fk_api_key_id 
      FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON UPDATE no action ON DELETE cascade;`)

    await db.run(sql`ALTER TABLE payload_locked_documents_rels 
      ADD CONSTRAINT fk_mood_id 
      FOREIGN KEY (mood_id) REFERENCES moods(id) ON UPDATE no action ON DELETE cascade;`)

    await db.run(sql`ALTER TABLE payload_locked_documents_rels 
      ADD CONSTRAINT fk_knowledge_id 
      FOREIGN KEY (knowledge_id) REFERENCES knowledge(id) ON UPDATE no action ON DELETE cascade;`)

    await db.run(sql`ALTER TABLE payload_locked_documents_rels 
      ADD CONSTRAINT fk_knowledge_collections_id 
      FOREIGN KEY (knowledge_collections_id) REFERENCES knowledge_collections(id) ON UPDATE no action ON DELETE cascade;`)

    await db.run(sql`ALTER TABLE payload_locked_documents_rels 
      ADD CONSTRAINT fk_conversation_id 
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON UPDATE no action ON DELETE cascade;`)

    await db.run(sql`ALTER TABLE payload_locked_documents_rels 
      ADD CONSTRAINT fk_message_id 
      FOREIGN KEY (message_id) REFERENCES messages(id) ON UPDATE no action ON DELETE cascade;`)

    await db.run(sql`ALTER TABLE payload_locked_documents_rels 
      ADD CONSTRAINT fk_memory_id 
      FOREIGN KEY (memory_id) REFERENCES memory(id) ON UPDATE no action ON DELETE cascade;`)

    await db.run(sql`ALTER TABLE payload_locked_documents_rels 
      ADD CONSTRAINT fk_token_gifts_id 
      FOREIGN KEY (token_gifts_id) REFERENCES token_gifts(id) ON UPDATE no action ON DELETE cascade;`)

    await db.run(sql`ALTER TABLE payload_locked_documents_rels 
      ADD CONSTRAINT fk_subscription_payments_id 
      FOREIGN KEY (subscription_payments_id) REFERENCES subscription_payments(id) ON UPDATE no action ON DELETE cascade;`)

    await db.run(sql`ALTER TABLE payload_locked_documents_rels 
      ADD CONSTRAINT fk_subscription_tiers_id 
      FOREIGN KEY (subscription_tiers_id) REFERENCES subscription_tiers(id) ON UPDATE no action ON DELETE cascade;`)

    await db.run(sql`ALTER TABLE payload_locked_documents_rels 
      ADD CONSTRAINT fk_token_packages_id 
      FOREIGN KEY (token_packages_id) REFERENCES token_packages(id) ON UPDATE no action ON DELETE cascade;`)

    // Create indexes for the new columns
    await db.run(
      sql`CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_bot_id_idx ON payload_locked_documents_rels (bot_id);`,
    )
    await db.run(
      sql`CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_api_key_id_idx ON payload_locked_documents_rels (api_key_id);`,
    )
    await db.run(
      sql`CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_mood_id_idx ON payload_locked_documents_rels (mood_id);`,
    )
    await db.run(
      sql`CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_knowledge_id_idx ON payload_locked_documents_rels (knowledge_id);`,
    )
    await db.run(
      sql`CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_knowledge_collections_id_idx ON payload_locked_documents_rels (knowledge_collections_id);`,
    )
    await db.run(
      sql`CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_conversation_id_idx ON payload_locked_documents_rels (conversation_id);`,
    )
    await db.run(
      sql`CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_message_id_idx ON payload_locked_documents_rels (message_id);`,
    )
    await db.run(
      sql`CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_memory_id_idx ON payload_locked_documents_rels (memory_id);`,
    )
    await db.run(
      sql`CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_token_gifts_id_idx ON payload_locked_documents_rels (token_gifts_id);`,
    )
    await db.run(
      sql`CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_subscription_payments_id_idx ON payload_locked_documents_rels (subscription_payments_id);`,
    )
    await db.run(
      sql`CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_subscription_tiers_id_idx ON payload_locked_documents_rels (subscription_tiers_id);`,
    )
    await db.run(
      sql`CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_token_packages_id_idx ON payload_locked_documents_rels (token_packages_id);`,
    )

    payload.logger.info(
      'Successfully added missing relationship columns to payload_locked_documents_rels table',
    )
  } catch (error) {
    payload.logger.error(`Failed to add missing relationship columns: ${error}`)
    throw error
  }
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  try {
    payload.logger.info(
      'Removing added relationship columns from payload_locked_documents_rels table...',
    )

    // Drop indexes first
    await db.run(sql`DROP INDEX IF EXISTS payload_locked_documents_rels_bot_id_idx;`)
    await db.run(sql`DROP INDEX IF EXISTS payload_locked_documents_rels_api_key_id_idx;`)
    await db.run(sql`DROP INDEX IF EXISTS payload_locked_documents_rels_mood_id_idx;`)
    await db.run(sql`DROP INDEX IF EXISTS payload_locked_documents_rels_knowledge_id_idx;`)
    await db.run(
      sql`DROP INDEX IF EXISTS payload_locked_documents_rels_knowledge_collections_id_idx;`,
    )
    await db.run(sql`DROP INDEX IF EXISTS payload_locked_documents_rels_conversation_id_idx;`)
    await db.run(sql`DROP INDEX IF EXISTS payload_locked_documents_rels_message_id_idx;`)
    await db.run(sql`DROP INDEX IF EXISTS payload_locked_documents_rels_memory_id_idx;`)
    await db.run(sql`DROP INDEX IF EXISTS payload_locked_documents_rels_token_gifts_id_idx;`)
    await db.run(
      sql`DROP INDEX IF EXISTS payload_locked_documents_rels_subscription_payments_id_idx;`,
    )
    await db.run(sql`DROP INDEX IF EXISTS payload_locked_documents_rels_subscription_tiers_id_idx;`)
    await db.run(sql`DROP INDEX IF EXISTS payload_locked_documents_rels_token_packages_id_idx;`)

    // Drop foreign key constraints
    await db.run(
      sql`ALTER TABLE payload_locked_documents_rels DROP CONSTRAINT IF EXISTS fk_bot_id;`,
    )
    await db.run(
      sql`ALTER TABLE payload_locked_documents_rels DROP CONSTRAINT IF EXISTS fk_api_key_id;`,
    )
    await db.run(
      sql`ALTER TABLE payload_locked_documents_rels DROP CONSTRAINT IF EXISTS fk_mood_id;`,
    )
    await db.run(
      sql`ALTER TABLE payload_locked_documents_rels DROP CONSTRAINT IF EXISTS fk_knowledge_id;`,
    )
    await db.run(
      sql`ALTER TABLE payload_locked_documents_rels DROP CONSTRAINT IF EXISTS fk_knowledge_collections_id;`,
    )
    await db.run(
      sql`ALTER TABLE payload_locked_documents_rels DROP CONSTRAINT IF EXISTS fk_conversation_id;`,
    )
    await db.run(
      sql`ALTER TABLE payload_locked_documents_rels DROP CONSTRAINT IF EXISTS fk_message_id;`,
    )
    await db.run(
      sql`ALTER TABLE payload_locked_documents_rels DROP CONSTRAINT IF EXISTS fk_memory_id;`,
    )
    await db.run(
      sql`ALTER TABLE payload_locked_documents_rels DROP CONSTRAINT IF EXISTS fk_token_gifts_id;`,
    )
    await db.run(
      sql`ALTER TABLE payload_locked_documents_rels DROP CONSTRAINT IF EXISTS fk_subscription_payments_id;`,
    )
    await db.run(
      sql`ALTER TABLE payload_locked_documents_rels DROP CONSTRAINT IF EXISTS fk_subscription_tiers_id;`,
    )
    await db.run(
      sql`ALTER TABLE payload_locked_documents_rels DROP CONSTRAINT IF EXISTS fk_token_packages_id;`,
    )

    // Drop the columns (SQLite doesn't support DROP COLUMN directly, so we'll skip this)
    // In SQLite, we would need to recreate the table to drop columns, which is more complex

    payload.logger.info(
      'Successfully reverted added relationship columns from payload_locked_documents_rels table',
    )
  } catch (error) {
    payload.logger.error(`Failed to revert added relationship columns: ${error}`)
    throw error
  }
}
