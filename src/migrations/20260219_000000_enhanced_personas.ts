import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Add new textarea columns to personas table
  await db.run(sql`ALTER TABLE \`personas\` ADD \`personality\` text;`)
  await db.run(sql`ALTER TABLE \`personas\` ADD \`appearance_description\` text;`)
  await db.run(sql`ALTER TABLE \`personas\` ADD \`backstory\` text;`)

  // Create child table for additional_details array field
  await db.run(sql`CREATE TABLE \`personas_additional_details\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`content\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`personas\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(sql`CREATE INDEX \`personas_additional_details_order_idx\` ON \`personas_additional_details\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`personas_additional_details_parent_id_idx\` ON \`personas_additional_details\` (\`_parent_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Drop the additional_details child table
  await db.run(sql`DROP TABLE IF EXISTS \`personas_additional_details\`;`)

  // SQLite doesn't support DROP COLUMN directly in older versions,
  // but D1 uses a recent SQLite that does support it
  await db.run(sql`ALTER TABLE \`personas\` DROP COLUMN \`personality\`;`)
  await db.run(sql`ALTER TABLE \`personas\` DROP COLUMN \`appearance_description\`;`)
  await db.run(sql`ALTER TABLE \`personas\` DROP COLUMN \`backstory\`;`)
}
