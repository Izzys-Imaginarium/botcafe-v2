import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`personas_additional_details\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`content\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`personas\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`personas_additional_details_order_idx\` ON \`personas_additional_details\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`personas_additional_details_parent_id_idx\` ON \`personas_additional_details\` (\`_parent_id\`);`)
  await db.run(sql`ALTER TABLE \`personas\` ADD \`personality\` text;`)
  await db.run(sql`ALTER TABLE \`personas\` ADD \`appearance_description\` text;`)
  await db.run(sql`ALTER TABLE \`personas\` ADD \`backstory\` text;`)
  await db.run(sql`ALTER TABLE \`creator_profiles\` ADD \`social_links_instagram\` text;`)
  await db.run(sql`ALTER TABLE \`creator_profiles\` ADD \`social_links_kofi\` text;`)
  await db.run(sql`ALTER TABLE \`creator_profiles\` ADD \`social_links_patreon\` text;`)
  await db.run(sql`ALTER TABLE \`creator_profiles\` DROP COLUMN \`social_links_github\`;`)
  await db.run(sql`ALTER TABLE \`creator_profiles\` DROP COLUMN \`social_links_linkedin\`;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`personas_additional_details\`;`)
  await db.run(sql`ALTER TABLE \`creator_profiles\` ADD \`social_links_github\` text;`)
  await db.run(sql`ALTER TABLE \`creator_profiles\` ADD \`social_links_linkedin\` text;`)
  await db.run(sql`ALTER TABLE \`creator_profiles\` DROP COLUMN \`social_links_instagram\`;`)
  await db.run(sql`ALTER TABLE \`creator_profiles\` DROP COLUMN \`social_links_kofi\`;`)
  await db.run(sql`ALTER TABLE \`creator_profiles\` DROP COLUMN \`social_links_patreon\`;`)
  await db.run(sql`ALTER TABLE \`personas\` DROP COLUMN \`personality\`;`)
  await db.run(sql`ALTER TABLE \`personas\` DROP COLUMN \`appearance_description\`;`)
  await db.run(sql`ALTER TABLE \`personas\` DROP COLUMN \`backstory\`;`)
}
