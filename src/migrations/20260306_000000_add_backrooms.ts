import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Add venue column to bot table
  await db.run(sql`ALTER TABLE \`bot\` ADD \`venue\` text DEFAULT 'main';`)

  // Create backrooms_classifications array table (mirrors bot_classifications structure)
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`bot_backrooms_classifications\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`classification\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`bot\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`bot_backrooms_classifications_order_idx\` ON \`bot_backrooms_classifications\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`bot_backrooms_classifications_parent_id_idx\` ON \`bot_backrooms_classifications\` (\`_parent_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS \`bot_backrooms_classifications\`;`)
  try {
    await db.run(sql`ALTER TABLE \`bot\` DROP COLUMN \`venue\`;`)
  } catch (_e) {
    // Column may not exist
  }
}
