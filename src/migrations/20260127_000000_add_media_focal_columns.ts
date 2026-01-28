import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Add focal_x and focal_y columns to media table
  // These are required by Payload CMS even when focalPoint is disabled
  await db.run(sql`ALTER TABLE \`media\` ADD COLUMN \`focal_x\` numeric`)
  await db.run(sql`ALTER TABLE \`media\` ADD COLUMN \`focal_y\` numeric`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // SQLite doesn't support DROP COLUMN directly, so we'd need to recreate the table
  // For simplicity, we'll leave the columns in place on rollback
}
