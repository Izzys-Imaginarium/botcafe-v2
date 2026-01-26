import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`creator_follows\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`follower_id\` integer NOT NULL,
  	\`following_id\` integer NOT NULL,
  	\`created_timestamp\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`follower_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`following_id\`) REFERENCES \`creator_profiles\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`creator_follows_follower_idx\` ON \`creator_follows\` (\`follower_id\`);`)
  await db.run(sql`CREATE INDEX \`creator_follows_following_idx\` ON \`creator_follows\` (\`following_id\`);`)
  await db.run(sql`CREATE INDEX \`creator_follows_updated_at_idx\` ON \`creator_follows\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`creator_follows_created_at_idx\` ON \`creator_follows\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`follower_following_idx\` ON \`creator_follows\` (\`follower_id\`,\`following_id\`);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`creator_follows_id\` integer REFERENCES creator_follows(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_creator_follows_id_idx\` ON \`payload_locked_documents_rels\` (\`creator_follows_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`creator_follows\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	\`media_id\` integer,
  	\`bot_id\` integer,
  	\`bot_interactions_id\` integer,
  	\`api_key_id\` integer,
  	\`mood_id\` integer,
  	\`knowledge_id\` integer,
  	\`knowledge_collections_id\` integer,
  	\`knowledge_activation_log_id\` integer,
  	\`conversation_id\` integer,
  	\`message_id\` integer,
  	\`memory_id\` integer,
  	\`vector_records_id\` integer,
  	\`token_gifts_id\` integer,
  	\`subscription_payments_id\` integer,
  	\`subscription_tiers_id\` integer,
  	\`token_packages_id\` integer,
  	\`personas_id\` integer,
  	\`creator_profiles_id\` integer,
  	\`access_control_id\` integer,
  	\`self_moderation_id\` integer,
  	\`usage_analytics_id\` integer,
  	\`memory_insights_id\` integer,
  	\`persona_analytics_id\` integer,
  	\`legal_documents_id\` integer,
  	\`user_agreements_id\` integer,
  	\`documentation_id\` integer,
  	\`tutorials_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`bot_id\`) REFERENCES \`bot\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`bot_interactions_id\`) REFERENCES \`bot_interactions\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`api_key_id\`) REFERENCES \`api_key\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`mood_id\`) REFERENCES \`mood\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`knowledge_id\`) REFERENCES \`knowledge\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`knowledge_collections_id\`) REFERENCES \`knowledge_collections\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`knowledge_activation_log_id\`) REFERENCES \`knowledge_activation_log\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`conversation_id\`) REFERENCES \`conversation\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`message_id\`) REFERENCES \`message\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`memory_id\`) REFERENCES \`memory\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`vector_records_id\`) REFERENCES \`vector_records\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`token_gifts_id\`) REFERENCES \`token_gifts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`subscription_payments_id\`) REFERENCES \`subscription_payments\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`subscription_tiers_id\`) REFERENCES \`subscription_tiers\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`token_packages_id\`) REFERENCES \`token_packages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`personas_id\`) REFERENCES \`personas\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`creator_profiles_id\`) REFERENCES \`creator_profiles\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`access_control_id\`) REFERENCES \`access_control\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`self_moderation_id\`) REFERENCES \`self_moderation\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`usage_analytics_id\`) REFERENCES \`usage_analytics\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`memory_insights_id\`) REFERENCES \`memory_insights\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`persona_analytics_id\`) REFERENCES \`persona_analytics\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`legal_documents_id\`) REFERENCES \`legal_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`user_agreements_id\`) REFERENCES \`user_agreements\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`documentation_id\`) REFERENCES \`documentation\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`tutorials_id\`) REFERENCES \`tutorials\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "media_id", "bot_id", "bot_interactions_id", "api_key_id", "mood_id", "knowledge_id", "knowledge_collections_id", "knowledge_activation_log_id", "conversation_id", "message_id", "memory_id", "vector_records_id", "token_gifts_id", "subscription_payments_id", "subscription_tiers_id", "token_packages_id", "personas_id", "creator_profiles_id", "access_control_id", "self_moderation_id", "usage_analytics_id", "memory_insights_id", "persona_analytics_id", "legal_documents_id", "user_agreements_id", "documentation_id", "tutorials_id") SELECT "id", "order", "parent_id", "path", "users_id", "media_id", "bot_id", "bot_interactions_id", "api_key_id", "mood_id", "knowledge_id", "knowledge_collections_id", "knowledge_activation_log_id", "conversation_id", "message_id", "memory_id", "vector_records_id", "token_gifts_id", "subscription_payments_id", "subscription_tiers_id", "token_packages_id", "personas_id", "creator_profiles_id", "access_control_id", "self_moderation_id", "usage_analytics_id", "memory_insights_id", "persona_analytics_id", "legal_documents_id", "user_agreements_id", "documentation_id", "tutorials_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_bot_id_idx\` ON \`payload_locked_documents_rels\` (\`bot_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_bot_interactions_id_idx\` ON \`payload_locked_documents_rels\` (\`bot_interactions_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_api_key_id_idx\` ON \`payload_locked_documents_rels\` (\`api_key_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_mood_id_idx\` ON \`payload_locked_documents_rels\` (\`mood_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_knowledge_id_idx\` ON \`payload_locked_documents_rels\` (\`knowledge_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_knowledge_collections_id_idx\` ON \`payload_locked_documents_rels\` (\`knowledge_collections_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_knowledge_activation_log_i_idx\` ON \`payload_locked_documents_rels\` (\`knowledge_activation_log_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_conversation_id_idx\` ON \`payload_locked_documents_rels\` (\`conversation_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_message_id_idx\` ON \`payload_locked_documents_rels\` (\`message_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_memory_id_idx\` ON \`payload_locked_documents_rels\` (\`memory_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_vector_records_id_idx\` ON \`payload_locked_documents_rels\` (\`vector_records_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_token_gifts_id_idx\` ON \`payload_locked_documents_rels\` (\`token_gifts_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_subscription_payments_id_idx\` ON \`payload_locked_documents_rels\` (\`subscription_payments_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_subscription_tiers_id_idx\` ON \`payload_locked_documents_rels\` (\`subscription_tiers_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_token_packages_id_idx\` ON \`payload_locked_documents_rels\` (\`token_packages_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_personas_id_idx\` ON \`payload_locked_documents_rels\` (\`personas_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_creator_profiles_id_idx\` ON \`payload_locked_documents_rels\` (\`creator_profiles_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_access_control_id_idx\` ON \`payload_locked_documents_rels\` (\`access_control_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_self_moderation_id_idx\` ON \`payload_locked_documents_rels\` (\`self_moderation_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_usage_analytics_id_idx\` ON \`payload_locked_documents_rels\` (\`usage_analytics_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_memory_insights_id_idx\` ON \`payload_locked_documents_rels\` (\`memory_insights_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_persona_analytics_id_idx\` ON \`payload_locked_documents_rels\` (\`persona_analytics_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_legal_documents_id_idx\` ON \`payload_locked_documents_rels\` (\`legal_documents_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_user_agreements_id_idx\` ON \`payload_locked_documents_rels\` (\`user_agreements_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_documentation_id_idx\` ON \`payload_locked_documents_rels\` (\`documentation_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_tutorials_id_idx\` ON \`payload_locked_documents_rels\` (\`tutorials_id\`);`)
}
