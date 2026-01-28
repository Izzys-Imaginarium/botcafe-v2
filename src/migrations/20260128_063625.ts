import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`bot_classifications\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`classification\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`bot\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`bot_classifications_order_idx\` ON \`bot_classifications\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`bot_classifications_parent_id_idx\` ON \`bot_classifications\` (\`_parent_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`bot_classifications\`;`)
}
