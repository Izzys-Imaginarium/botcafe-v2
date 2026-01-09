import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`bot_signature_phrases\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`phrase\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`bot\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`bot_signature_phrases_order_idx\` ON \`bot_signature_phrases\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`bot_signature_phrases_parent_id_idx\` ON \`bot_signature_phrases\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`bot_tags\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`tag\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`bot\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`bot_tags_order_idx\` ON \`bot_tags\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`bot_tags_parent_id_idx\` ON \`bot_tags\` (\`_parent_id\`);`)
  await db.run(sql`DROP TABLE \`personas_interaction_preferences_signature_phrases\`;`)
  await db.run(sql`DROP TABLE \`personas_tags\`;`)
  await db.run(sql`ALTER TABLE \`bot\` ADD \`personality_traits_tone\` text;`)
  await db.run(sql`ALTER TABLE \`bot\` ADD \`personality_traits_formality_level\` text;`)
  await db.run(sql`ALTER TABLE \`bot\` ADD \`personality_traits_humor_style\` text;`)
  await db.run(sql`ALTER TABLE \`bot\` ADD \`personality_traits_communication_style\` text;`)
  await db.run(sql`ALTER TABLE \`bot\` ADD \`behavior_settings_response_length\` text;`)
  await db.run(sql`ALTER TABLE \`bot\` ADD \`behavior_settings_creativity_level\` text;`)
  await db.run(sql`ALTER TABLE \`bot\` ADD \`behavior_settings_knowledge_sharing\` text;`)
  await db.run(sql`ALTER TABLE \`personas\` ADD \`gender\` text;`)
  await db.run(sql`ALTER TABLE \`personas\` ADD \`age\` numeric;`)
  await db.run(sql`ALTER TABLE \`personas\` ADD \`pronouns\` text;`)
  await db.run(sql`ALTER TABLE \`personas\` ADD \`custom_pronouns\` text;`)
  await db.run(sql`ALTER TABLE \`personas\` DROP COLUMN \`personality_traits_tone\`;`)
  await db.run(sql`ALTER TABLE \`personas\` DROP COLUMN \`personality_traits_formality_level\`;`)
  await db.run(sql`ALTER TABLE \`personas\` DROP COLUMN \`personality_traits_humor_style\`;`)
  await db.run(sql`ALTER TABLE \`personas\` DROP COLUMN \`personality_traits_communication_style\`;`)
  await db.run(sql`ALTER TABLE \`personas\` DROP COLUMN \`appearance_visual_theme\`;`)
  await db.run(sql`ALTER TABLE \`personas\` DROP COLUMN \`appearance_color_scheme\`;`)
  await db.run(sql`ALTER TABLE \`personas\` DROP COLUMN \`behavior_settings_response_length\`;`)
  await db.run(sql`ALTER TABLE \`personas\` DROP COLUMN \`behavior_settings_creativity_level\`;`)
  await db.run(sql`ALTER TABLE \`personas\` DROP COLUMN \`behavior_settings_knowledge_sharing\`;`)
  await db.run(sql`ALTER TABLE \`personas\` DROP COLUMN \`interaction_preferences_conversation_starter\`;`)
  await db.run(sql`ALTER TABLE \`personas\` DROP COLUMN \`is_public\`;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`personas_interaction_preferences_signature_phrases\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`phrase\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`personas\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`personas_interaction_preferences_signature_phrases_order_idx\` ON \`personas_interaction_preferences_signature_phrases\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`personas_interaction_preferences_signature_phrases_parent_id_idx\` ON \`personas_interaction_preferences_signature_phrases\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`personas_tags\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`tag\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`personas\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`personas_tags_order_idx\` ON \`personas_tags\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`personas_tags_parent_id_idx\` ON \`personas_tags\` (\`_parent_id\`);`)
  await db.run(sql`DROP TABLE \`bot_signature_phrases\`;`)
  await db.run(sql`DROP TABLE \`bot_tags\`;`)
  await db.run(sql`ALTER TABLE \`personas\` ADD \`personality_traits_tone\` text;`)
  await db.run(sql`ALTER TABLE \`personas\` ADD \`personality_traits_formality_level\` text;`)
  await db.run(sql`ALTER TABLE \`personas\` ADD \`personality_traits_humor_style\` text;`)
  await db.run(sql`ALTER TABLE \`personas\` ADD \`personality_traits_communication_style\` text;`)
  await db.run(sql`ALTER TABLE \`personas\` ADD \`appearance_visual_theme\` text;`)
  await db.run(sql`ALTER TABLE \`personas\` ADD \`appearance_color_scheme\` text;`)
  await db.run(sql`ALTER TABLE \`personas\` ADD \`behavior_settings_response_length\` text;`)
  await db.run(sql`ALTER TABLE \`personas\` ADD \`behavior_settings_creativity_level\` text;`)
  await db.run(sql`ALTER TABLE \`personas\` ADD \`behavior_settings_knowledge_sharing\` text;`)
  await db.run(sql`ALTER TABLE \`personas\` ADD \`interaction_preferences_conversation_starter\` text;`)
  await db.run(sql`ALTER TABLE \`personas\` ADD \`is_public\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`personas\` DROP COLUMN \`gender\`;`)
  await db.run(sql`ALTER TABLE \`personas\` DROP COLUMN \`age\`;`)
  await db.run(sql`ALTER TABLE \`personas\` DROP COLUMN \`pronouns\`;`)
  await db.run(sql`ALTER TABLE \`personas\` DROP COLUMN \`custom_pronouns\`;`)
  await db.run(sql`ALTER TABLE \`bot\` DROP COLUMN \`personality_traits_tone\`;`)
  await db.run(sql`ALTER TABLE \`bot\` DROP COLUMN \`personality_traits_formality_level\`;`)
  await db.run(sql`ALTER TABLE \`bot\` DROP COLUMN \`personality_traits_humor_style\`;`)
  await db.run(sql`ALTER TABLE \`bot\` DROP COLUMN \`personality_traits_communication_style\`;`)
  await db.run(sql`ALTER TABLE \`bot\` DROP COLUMN \`behavior_settings_response_length\`;`)
  await db.run(sql`ALTER TABLE \`bot\` DROP COLUMN \`behavior_settings_creativity_level\`;`)
  await db.run(sql`ALTER TABLE \`bot\` DROP COLUMN \`behavior_settings_knowledge_sharing\`;`)
}
