import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Create table only if it doesn't exist (may already exist from enhanced_personas migration)
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`personas_additional_details\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`content\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`personas\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`personas_additional_details_order_idx\` ON \`personas_additional_details\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`personas_additional_details_parent_id_idx\` ON \`personas_additional_details\` (\`_parent_id\`);`)

  // Add persona columns (may already exist) - SQLite will error on duplicate columns, so we catch
  const safeAddColumn = async (statement: ReturnType<typeof sql>) => {
    try {
      await db.run(statement)
    } catch (e: any) {
      if (!e.message?.includes('duplicate column name')) throw e
    }
  }

  await safeAddColumn(sql`ALTER TABLE \`personas\` ADD \`personality\` text;`)
  await safeAddColumn(sql`ALTER TABLE \`personas\` ADD \`appearance_description\` text;`)
  await safeAddColumn(sql`ALTER TABLE \`personas\` ADD \`backstory\` text;`)

  // Add new creator social link columns
  await safeAddColumn(sql`ALTER TABLE \`creator_profiles\` ADD \`social_links_instagram\` text;`)
  await safeAddColumn(sql`ALTER TABLE \`creator_profiles\` ADD \`social_links_kofi\` text;`)
  await safeAddColumn(sql`ALTER TABLE \`creator_profiles\` ADD \`social_links_patreon\` text;`)

  // Drop removed columns - safe to ignore if already dropped
  try {
    await db.run(sql`ALTER TABLE \`creator_profiles\` DROP COLUMN \`social_links_github\`;`)
  } catch (e) {
    // Column may not exist
  }
  try {
    await db.run(sql`ALTER TABLE \`creator_profiles\` DROP COLUMN \`social_links_linkedin\`;`)
  } catch (e) {
    // Column may not exist
  }
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS \`personas_additional_details\`;`)

  const safeAddColumn = async (statement: ReturnType<typeof sql>) => {
    try {
      await db.run(statement)
    } catch (e: any) {
      if (!e.message?.includes('duplicate column name')) throw e
    }
  }

  await safeAddColumn(sql`ALTER TABLE \`creator_profiles\` ADD \`social_links_github\` text;`)
  await safeAddColumn(sql`ALTER TABLE \`creator_profiles\` ADD \`social_links_linkedin\` text;`)

  try {
    await db.run(sql`ALTER TABLE \`creator_profiles\` DROP COLUMN \`social_links_instagram\`;`)
  } catch (e) {}
  try {
    await db.run(sql`ALTER TABLE \`creator_profiles\` DROP COLUMN \`social_links_kofi\`;`)
  } catch (e) {}
  try {
    await db.run(sql`ALTER TABLE \`creator_profiles\` DROP COLUMN \`social_links_patreon\`;`)
  } catch (e) {}
  try {
    await db.run(sql`ALTER TABLE \`personas\` DROP COLUMN \`personality\`;`)
  } catch (e) {}
  try {
    await db.run(sql`ALTER TABLE \`personas\` DROP COLUMN \`appearance_description\`;`)
  } catch (e) {}
  try {
    await db.run(sql`ALTER TABLE \`personas\` DROP COLUMN \`backstory\`;`)
  } catch (e) {}
}
