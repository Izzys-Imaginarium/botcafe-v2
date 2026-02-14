import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_knowledge\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`user_id\` integer NOT NULL,
  	\`created_timestamp\` text,
  	\`modified_timestamp\` text,
  	\`type\` text NOT NULL,
  	\`tokens\` numeric DEFAULT 0,
  	\`entry\` text NOT NULL,
  	\`knowledge_collection_id\` integer NOT NULL,
  	\`is_legacy_memory\` integer DEFAULT false,
  	\`source_memory_id_id\` integer,
  	\`source_conversation_id_id\` integer,
  	\`original_participants\` text,
  	\`memory_date_range\` text,
  	\`is_vectorized\` integer DEFAULT false,
  	\`chunk_count\` numeric DEFAULT 0,
  	\`r2_file_key\` text,
  	\`privacy_settings_privacy_level\` text DEFAULT 'private' NOT NULL,
  	\`privacy_settings_allow_sharing\` integer DEFAULT true,
  	\`privacy_settings_share_expiration\` text,
  	\`privacy_settings_password_protected\` integer DEFAULT false,
  	\`privacy_settings_share_password\` text,
  	\`privacy_settings_access_count\` numeric DEFAULT 0,
  	\`privacy_settings_last_accessed\` text,
  	\`shared_access_shared_by_user_id\` numeric,
  	\`shared_access_shared_at\` text,
  	\`shared_access_sharing_notes\` text,
  	\`content_metadata_source_url\` text,
  	\`content_metadata_author\` text,
  	\`content_metadata_language\` text,
  	\`content_metadata_word_count\` numeric,
  	\`content_metadata_reading_time_minutes\` numeric,
  	\`content_metadata_content_hash\` text,
  	\`content_metadata_processing_status\` text DEFAULT 'pending',
  	\`usage_analytics_view_count\` numeric DEFAULT 0,
  	\`usage_analytics_search_count\` numeric DEFAULT 0,
  	\`usage_analytics_citation_count\` numeric DEFAULT 0,
  	\`usage_analytics_last_searched\` text,
  	\`usage_analytics_popularity_score\` numeric DEFAULT 0,
  	\`activation_settings_activation_mode\` text DEFAULT 'vector' NOT NULL,
  	\`activation_settings_keywords_logic\` text DEFAULT 'AND_ANY',
  	\`activation_settings_case_sensitive\` integer DEFAULT false,
  	\`activation_settings_match_whole_words\` integer DEFAULT false,
  	\`activation_settings_use_regex\` integer DEFAULT false,
  	\`activation_settings_vector_similarity_threshold\` numeric DEFAULT 0.4,
  	\`activation_settings_max_vector_results\` numeric DEFAULT 5,
  	\`activation_settings_probability\` numeric DEFAULT 100,
  	\`activation_settings_use_probability\` integer DEFAULT false,
  	\`activation_settings_scan_depth\` numeric DEFAULT 2,
  	\`activation_settings_match_in_user_messages\` integer DEFAULT true,
  	\`activation_settings_match_in_bot_messages\` integer DEFAULT true,
  	\`activation_settings_match_in_system_prompts\` integer DEFAULT false,
  	\`positioning_position\` text DEFAULT 'before_character' NOT NULL,
  	\`positioning_depth\` numeric DEFAULT 0,
  	\`positioning_role\` text DEFAULT 'system',
  	\`positioning_order\` numeric DEFAULT 100,
  	\`advanced_activation_sticky\` numeric DEFAULT 0,
  	\`advanced_activation_cooldown\` numeric DEFAULT 0,
  	\`advanced_activation_delay\` numeric DEFAULT 0,
  	\`filtering_filter_by_bots\` integer DEFAULT false,
  	\`filtering_filter_by_personas\` integer DEFAULT false,
  	\`filtering_match_bot_description\` integer DEFAULT false,
  	\`filtering_match_bot_personality\` integer DEFAULT false,
  	\`filtering_match_persona_description\` integer DEFAULT false,
  	\`budget_control_ignore_budget\` integer DEFAULT false,
  	\`budget_control_token_cost\` numeric DEFAULT 0,
  	\`budget_control_max_tokens\` numeric DEFAULT 1000,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`knowledge_collection_id\`) REFERENCES \`knowledge_collections\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`source_memory_id_id\`) REFERENCES \`memory\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`source_conversation_id_id\`) REFERENCES \`conversation\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new_knowledge\`("id", "user_id", "created_timestamp", "modified_timestamp", "type", "tokens", "entry", "knowledge_collection_id", "is_legacy_memory", "source_memory_id_id", "source_conversation_id_id", "original_participants", "memory_date_range", "is_vectorized", "chunk_count", "r2_file_key", "privacy_settings_privacy_level", "privacy_settings_allow_sharing", "privacy_settings_share_expiration", "privacy_settings_password_protected", "privacy_settings_share_password", "privacy_settings_access_count", "privacy_settings_last_accessed", "shared_access_shared_by_user_id", "shared_access_shared_at", "shared_access_sharing_notes", "content_metadata_source_url", "content_metadata_author", "content_metadata_language", "content_metadata_word_count", "content_metadata_reading_time_minutes", "content_metadata_content_hash", "content_metadata_processing_status", "usage_analytics_view_count", "usage_analytics_search_count", "usage_analytics_citation_count", "usage_analytics_last_searched", "usage_analytics_popularity_score", "activation_settings_activation_mode", "activation_settings_keywords_logic", "activation_settings_case_sensitive", "activation_settings_match_whole_words", "activation_settings_use_regex", "activation_settings_vector_similarity_threshold", "activation_settings_max_vector_results", "activation_settings_probability", "activation_settings_use_probability", "activation_settings_scan_depth", "activation_settings_match_in_user_messages", "activation_settings_match_in_bot_messages", "activation_settings_match_in_system_prompts", "positioning_position", "positioning_depth", "positioning_role", "positioning_order", "advanced_activation_sticky", "advanced_activation_cooldown", "advanced_activation_delay", "filtering_filter_by_bots", "filtering_filter_by_personas", "filtering_match_bot_description", "filtering_match_bot_personality", "filtering_match_persona_description", "budget_control_ignore_budget", "budget_control_token_cost", "budget_control_max_tokens", "updated_at", "created_at") SELECT "id", "user_id", "created_timestamp", "modified_timestamp", "type", "tokens", "entry", "knowledge_collection_id", "is_legacy_memory", "source_memory_id_id", "source_conversation_id_id", "original_participants", "memory_date_range", "is_vectorized", "chunk_count", "r2_file_key", "privacy_settings_privacy_level", "privacy_settings_allow_sharing", "privacy_settings_share_expiration", "privacy_settings_password_protected", "privacy_settings_share_password", "privacy_settings_access_count", "privacy_settings_last_accessed", "shared_access_shared_by_user_id", "shared_access_shared_at", "shared_access_sharing_notes", "content_metadata_source_url", "content_metadata_author", "content_metadata_language", "content_metadata_word_count", "content_metadata_reading_time_minutes", "content_metadata_content_hash", "content_metadata_processing_status", "usage_analytics_view_count", "usage_analytics_search_count", "usage_analytics_citation_count", "usage_analytics_last_searched", "usage_analytics_popularity_score", "activation_settings_activation_mode", "activation_settings_keywords_logic", "activation_settings_case_sensitive", "activation_settings_match_whole_words", "activation_settings_use_regex", "activation_settings_vector_similarity_threshold", "activation_settings_max_vector_results", "activation_settings_probability", "activation_settings_use_probability", "activation_settings_scan_depth", "activation_settings_match_in_user_messages", "activation_settings_match_in_bot_messages", "activation_settings_match_in_system_prompts", "positioning_position", "positioning_depth", "positioning_role", "positioning_order", "advanced_activation_sticky", "advanced_activation_cooldown", "advanced_activation_delay", "filtering_filter_by_bots", "filtering_filter_by_personas", "filtering_match_bot_description", "filtering_match_bot_personality", "filtering_match_persona_description", "budget_control_ignore_budget", "budget_control_token_cost", "budget_control_max_tokens", "updated_at", "created_at" FROM \`knowledge\`;`)
  await db.run(sql`DROP TABLE \`knowledge\`;`)
  await db.run(sql`ALTER TABLE \`__new_knowledge\` RENAME TO \`knowledge\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`knowledge_user_idx\` ON \`knowledge\` (\`user_id\`);`)
  await db.run(sql`CREATE INDEX \`knowledge_knowledge_collection_idx\` ON \`knowledge\` (\`knowledge_collection_id\`);`)
  await db.run(sql`CREATE INDEX \`knowledge_source_memory_id_idx\` ON \`knowledge\` (\`source_memory_id_id\`);`)
  await db.run(sql`CREATE INDEX \`knowledge_source_conversation_id_idx\` ON \`knowledge\` (\`source_conversation_id_id\`);`)
  await db.run(sql`CREATE INDEX \`knowledge_updated_at_idx\` ON \`knowledge\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`knowledge_created_at_idx\` ON \`knowledge\` (\`created_at\`);`)
  await db.run(sql`ALTER TABLE \`message\` ADD \`reasoning_content\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_knowledge\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`user_id\` integer NOT NULL,
  	\`created_timestamp\` text,
  	\`modified_timestamp\` text,
  	\`type\` text NOT NULL,
  	\`tokens\` numeric DEFAULT 0,
  	\`entry\` text NOT NULL,
  	\`knowledge_collection_id\` integer NOT NULL,
  	\`is_legacy_memory\` integer DEFAULT false,
  	\`source_memory_id_id\` integer,
  	\`source_conversation_id_id\` integer,
  	\`original_participants\` text,
  	\`memory_date_range\` text,
  	\`is_vectorized\` integer DEFAULT false,
  	\`chunk_count\` numeric DEFAULT 0,
  	\`r2_file_key\` text,
  	\`privacy_settings_privacy_level\` text DEFAULT 'private' NOT NULL,
  	\`privacy_settings_allow_sharing\` integer DEFAULT true,
  	\`privacy_settings_share_expiration\` text,
  	\`privacy_settings_password_protected\` integer DEFAULT false,
  	\`privacy_settings_share_password\` text,
  	\`privacy_settings_access_count\` numeric DEFAULT 0,
  	\`privacy_settings_last_accessed\` text,
  	\`shared_access_shared_by_user_id\` numeric,
  	\`shared_access_shared_at\` text,
  	\`shared_access_sharing_notes\` text,
  	\`content_metadata_source_url\` text,
  	\`content_metadata_author\` text,
  	\`content_metadata_language\` text,
  	\`content_metadata_word_count\` numeric,
  	\`content_metadata_reading_time_minutes\` numeric,
  	\`content_metadata_content_hash\` text,
  	\`content_metadata_processing_status\` text DEFAULT 'pending',
  	\`usage_analytics_view_count\` numeric DEFAULT 0,
  	\`usage_analytics_search_count\` numeric DEFAULT 0,
  	\`usage_analytics_citation_count\` numeric DEFAULT 0,
  	\`usage_analytics_last_searched\` text,
  	\`usage_analytics_popularity_score\` numeric DEFAULT 0,
  	\`activation_settings_activation_mode\` text DEFAULT 'vector' NOT NULL,
  	\`activation_settings_keywords_logic\` text DEFAULT 'AND_ANY',
  	\`activation_settings_case_sensitive\` integer DEFAULT false,
  	\`activation_settings_match_whole_words\` integer DEFAULT false,
  	\`activation_settings_use_regex\` integer DEFAULT false,
  	\`activation_settings_vector_similarity_threshold\` numeric DEFAULT 0.7,
  	\`activation_settings_max_vector_results\` numeric DEFAULT 5,
  	\`activation_settings_probability\` numeric DEFAULT 100,
  	\`activation_settings_use_probability\` integer DEFAULT false,
  	\`activation_settings_scan_depth\` numeric DEFAULT 2,
  	\`activation_settings_match_in_user_messages\` integer DEFAULT true,
  	\`activation_settings_match_in_bot_messages\` integer DEFAULT true,
  	\`activation_settings_match_in_system_prompts\` integer DEFAULT false,
  	\`positioning_position\` text DEFAULT 'before_character' NOT NULL,
  	\`positioning_depth\` numeric DEFAULT 0,
  	\`positioning_role\` text DEFAULT 'system',
  	\`positioning_order\` numeric DEFAULT 100,
  	\`advanced_activation_sticky\` numeric DEFAULT 0,
  	\`advanced_activation_cooldown\` numeric DEFAULT 0,
  	\`advanced_activation_delay\` numeric DEFAULT 0,
  	\`filtering_filter_by_bots\` integer DEFAULT false,
  	\`filtering_filter_by_personas\` integer DEFAULT false,
  	\`filtering_match_bot_description\` integer DEFAULT false,
  	\`filtering_match_bot_personality\` integer DEFAULT false,
  	\`filtering_match_persona_description\` integer DEFAULT false,
  	\`budget_control_ignore_budget\` integer DEFAULT false,
  	\`budget_control_token_cost\` numeric DEFAULT 0,
  	\`budget_control_max_tokens\` numeric DEFAULT 1000,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`knowledge_collection_id\`) REFERENCES \`knowledge_collections\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`source_memory_id_id\`) REFERENCES \`memory\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`source_conversation_id_id\`) REFERENCES \`conversation\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new_knowledge\`("id", "user_id", "created_timestamp", "modified_timestamp", "type", "tokens", "entry", "knowledge_collection_id", "is_legacy_memory", "source_memory_id_id", "source_conversation_id_id", "original_participants", "memory_date_range", "is_vectorized", "chunk_count", "r2_file_key", "privacy_settings_privacy_level", "privacy_settings_allow_sharing", "privacy_settings_share_expiration", "privacy_settings_password_protected", "privacy_settings_share_password", "privacy_settings_access_count", "privacy_settings_last_accessed", "shared_access_shared_by_user_id", "shared_access_shared_at", "shared_access_sharing_notes", "content_metadata_source_url", "content_metadata_author", "content_metadata_language", "content_metadata_word_count", "content_metadata_reading_time_minutes", "content_metadata_content_hash", "content_metadata_processing_status", "usage_analytics_view_count", "usage_analytics_search_count", "usage_analytics_citation_count", "usage_analytics_last_searched", "usage_analytics_popularity_score", "activation_settings_activation_mode", "activation_settings_keywords_logic", "activation_settings_case_sensitive", "activation_settings_match_whole_words", "activation_settings_use_regex", "activation_settings_vector_similarity_threshold", "activation_settings_max_vector_results", "activation_settings_probability", "activation_settings_use_probability", "activation_settings_scan_depth", "activation_settings_match_in_user_messages", "activation_settings_match_in_bot_messages", "activation_settings_match_in_system_prompts", "positioning_position", "positioning_depth", "positioning_role", "positioning_order", "advanced_activation_sticky", "advanced_activation_cooldown", "advanced_activation_delay", "filtering_filter_by_bots", "filtering_filter_by_personas", "filtering_match_bot_description", "filtering_match_bot_personality", "filtering_match_persona_description", "budget_control_ignore_budget", "budget_control_token_cost", "budget_control_max_tokens", "updated_at", "created_at") SELECT "id", "user_id", "created_timestamp", "modified_timestamp", "type", "tokens", "entry", "knowledge_collection_id", "is_legacy_memory", "source_memory_id_id", "source_conversation_id_id", "original_participants", "memory_date_range", "is_vectorized", "chunk_count", "r2_file_key", "privacy_settings_privacy_level", "privacy_settings_allow_sharing", "privacy_settings_share_expiration", "privacy_settings_password_protected", "privacy_settings_share_password", "privacy_settings_access_count", "privacy_settings_last_accessed", "shared_access_shared_by_user_id", "shared_access_shared_at", "shared_access_sharing_notes", "content_metadata_source_url", "content_metadata_author", "content_metadata_language", "content_metadata_word_count", "content_metadata_reading_time_minutes", "content_metadata_content_hash", "content_metadata_processing_status", "usage_analytics_view_count", "usage_analytics_search_count", "usage_analytics_citation_count", "usage_analytics_last_searched", "usage_analytics_popularity_score", "activation_settings_activation_mode", "activation_settings_keywords_logic", "activation_settings_case_sensitive", "activation_settings_match_whole_words", "activation_settings_use_regex", "activation_settings_vector_similarity_threshold", "activation_settings_max_vector_results", "activation_settings_probability", "activation_settings_use_probability", "activation_settings_scan_depth", "activation_settings_match_in_user_messages", "activation_settings_match_in_bot_messages", "activation_settings_match_in_system_prompts", "positioning_position", "positioning_depth", "positioning_role", "positioning_order", "advanced_activation_sticky", "advanced_activation_cooldown", "advanced_activation_delay", "filtering_filter_by_bots", "filtering_filter_by_personas", "filtering_match_bot_description", "filtering_match_bot_personality", "filtering_match_persona_description", "budget_control_ignore_budget", "budget_control_token_cost", "budget_control_max_tokens", "updated_at", "created_at" FROM \`knowledge\`;`)
  await db.run(sql`DROP TABLE \`knowledge\`;`)
  await db.run(sql`ALTER TABLE \`__new_knowledge\` RENAME TO \`knowledge\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`knowledge_user_idx\` ON \`knowledge\` (\`user_id\`);`)
  await db.run(sql`CREATE INDEX \`knowledge_knowledge_collection_idx\` ON \`knowledge\` (\`knowledge_collection_id\`);`)
  await db.run(sql`CREATE INDEX \`knowledge_source_memory_id_idx\` ON \`knowledge\` (\`source_memory_id_id\`);`)
  await db.run(sql`CREATE INDEX \`knowledge_source_conversation_id_idx\` ON \`knowledge\` (\`source_conversation_id_id\`);`)
  await db.run(sql`CREATE INDEX \`knowledge_updated_at_idx\` ON \`knowledge\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`knowledge_created_at_idx\` ON \`knowledge\` (\`created_at\`);`)
  await db.run(sql`ALTER TABLE \`message\` DROP COLUMN \`reasoning_content\`;`)
}
