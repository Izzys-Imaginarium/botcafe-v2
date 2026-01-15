import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

/**
 * Migration: Add embedding column to vector_records table
 *
 * This migration adds an 'embedding' column to store the actual vector values
 * in D1 for future-proofing metadata-only updates without re-generating embeddings.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Add embedding column to vector_records table
  // Using TEXT type to store JSON-serialized array of floats
  await db.run(sql`ALTER TABLE \`vector_records\` ADD COLUMN \`embedding\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // SQLite doesn't support DROP COLUMN directly in older versions
  // For D1, we can use ALTER TABLE ... DROP COLUMN
  await db.run(sql`ALTER TABLE \`vector_records\` DROP COLUMN \`embedding\`;`)
}
