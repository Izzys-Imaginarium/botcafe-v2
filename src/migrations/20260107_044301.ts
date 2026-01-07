import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Drop the unique constraint on slug (it's now unique per creator, not globally)
  await db.run(sql`DROP INDEX IF EXISTS \`bot_slug_idx\`;`)

  // Add creator_profile_id column (nullable initially to allow migration of existing data)
  await db.run(sql`ALTER TABLE \`bot\` ADD \`creator_profile_id\` integer REFERENCES creator_profiles(id);`)
  await db.run(sql`CREATE INDEX \`bot_creator_profile_idx\` ON \`bot\` (\`creator_profile_id\`);`)

  // Note: Existing bots will need their creator_profile_id populated manually or via a script
  // The application code handles this by auto-creating creator profiles when needed
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_bot\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`user_id\` integer NOT NULL,
  	\`created_date\` text,
  	\`name\` text NOT NULL,
  	\`picture_id\` integer,
  	\`gender\` text,
  	\`age\` numeric,
  	\`description\` text,
  	\`system_prompt\` text NOT NULL,
  	\`is_public\` integer DEFAULT false,
  	\`greeting\` text,
  	\`slug\` text NOT NULL,
  	\`likes_count\` numeric DEFAULT 0,
  	\`favorites_count\` numeric DEFAULT 0,
  	\`creator_display_name\` text NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`picture_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new_bot\`("id", "user_id", "created_date", "name", "picture_id", "gender", "age", "description", "system_prompt", "is_public", "greeting", "slug", "likes_count", "favorites_count", "creator_display_name", "updated_at", "created_at") SELECT "id", "user_id", "created_date", "name", "picture_id", "gender", "age", "description", "system_prompt", "is_public", "greeting", "slug", "likes_count", "favorites_count", "creator_display_name", "updated_at", "created_at" FROM \`bot\`;`)
  await db.run(sql`DROP TABLE \`bot\`;`)
  await db.run(sql`ALTER TABLE \`__new_bot\` RENAME TO \`bot\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`bot_user_idx\` ON \`bot\` (\`user_id\`);`)
  await db.run(sql`CREATE INDEX \`bot_picture_idx\` ON \`bot\` (\`picture_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`bot_slug_idx\` ON \`bot\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`bot_updated_at_idx\` ON \`bot\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`bot_created_at_idx\` ON \`bot\` (\`created_at\`);`)
}
