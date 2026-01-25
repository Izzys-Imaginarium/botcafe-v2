import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`crisis_support\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_memory\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`user_id\` integer NOT NULL,
  	\`created_timestamp\` text,
  	\`modified_timestamp\` text,
  	\`conversation_id\` integer,
  	\`tokens\` numeric DEFAULT 0,
  	\`entry\` text NOT NULL,
  	\`type\` text DEFAULT 'short_term',
  	\`participants\` text,
  	\`is_vectorized\` integer DEFAULT false,
  	\`converted_to_lore\` integer DEFAULT false,
  	\`lore_entry_id\` integer,
  	\`converted_at\` text,
  	\`importance\` numeric DEFAULT 5,
  	\`emotional_context\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`conversation_id\`) REFERENCES \`conversation\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`lore_entry_id\`) REFERENCES \`knowledge\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new_memory\`("id", "user_id", "created_timestamp", "modified_timestamp", "conversation_id", "tokens", "entry", "type", "participants", "is_vectorized", "converted_to_lore", "lore_entry_id", "converted_at", "importance", "emotional_context", "updated_at", "created_at") SELECT "id", "user_id", "created_timestamp", "modified_timestamp", "conversation_id", "tokens", "entry", "type", "participants", "is_vectorized", "converted_to_lore", "lore_entry_id", "converted_at", "importance", "emotional_context", "updated_at", "created_at" FROM \`memory\`;`)
  await db.run(sql`DROP TABLE \`memory\`;`)
  await db.run(sql`ALTER TABLE \`__new_memory\` RENAME TO \`memory\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`memory_user_idx\` ON \`memory\` (\`user_id\`);`)
  await db.run(sql`CREATE INDEX \`memory_conversation_idx\` ON \`memory\` (\`conversation_id\`);`)
  await db.run(sql`CREATE INDEX \`memory_lore_entry_idx\` ON \`memory\` (\`lore_entry_id\`);`)
  await db.run(sql`CREATE INDEX \`memory_updated_at_idx\` ON \`memory\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`memory_created_at_idx\` ON \`memory\` (\`created_at\`);`)
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
  	\`support_tickets_id\` integer,
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
  	FOREIGN KEY (\`tutorials_id\`) REFERENCES \`tutorials\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`support_tickets_id\`) REFERENCES \`support_tickets\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "media_id", "bot_id", "bot_interactions_id", "api_key_id", "mood_id", "knowledge_id", "knowledge_collections_id", "knowledge_activation_log_id", "conversation_id", "message_id", "memory_id", "vector_records_id", "token_gifts_id", "subscription_payments_id", "subscription_tiers_id", "token_packages_id", "personas_id", "creator_profiles_id", "access_control_id", "self_moderation_id", "usage_analytics_id", "memory_insights_id", "persona_analytics_id", "legal_documents_id", "user_agreements_id", "documentation_id", "tutorials_id", "support_tickets_id") SELECT "id", "order", "parent_id", "path", "users_id", "media_id", "bot_id", "bot_interactions_id", "api_key_id", "mood_id", "knowledge_id", "knowledge_collections_id", "knowledge_activation_log_id", "conversation_id", "message_id", "memory_id", "vector_records_id", "token_gifts_id", "subscription_payments_id", "subscription_tiers_id", "token_packages_id", "personas_id", "creator_profiles_id", "access_control_id", "self_moderation_id", "usage_analytics_id", "memory_insights_id", "persona_analytics_id", "legal_documents_id", "user_agreements_id", "documentation_id", "tutorials_id", "support_tickets_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
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
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_support_tickets_id_idx\` ON \`payload_locked_documents_rels\` (\`support_tickets_id\`);`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`role\` text DEFAULT 'user' NOT NULL;`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`nickname\` text;`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`pronouns\` text;`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`custom_pronouns\` text;`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`description\` text;`)
  await db.run(sql`ALTER TABLE \`conversation\` ADD \`memory_tome_id\` integer REFERENCES knowledge_collections(id);`)
  await db.run(sql`ALTER TABLE \`conversation\` ADD \`conversation_settings_api_key_id\` numeric;`)
  await db.run(sql`ALTER TABLE \`conversation\` ADD \`conversation_settings_model\` text;`)
  await db.run(sql`ALTER TABLE \`conversation\` ADD \`conversation_settings_provider\` text;`)
  await db.run(sql`CREATE INDEX \`conversation_memory_tome_idx\` ON \`conversation\` (\`memory_tome_id\`);`)
  await db.run(sql`ALTER TABLE \`message\` ADD \`message_attribution_persona_id_id\` integer REFERENCES personas(id);`)
  await db.run(sql`CREATE INDEX \`message_message_attribution_message_attribution_persona__idx\` ON \`message\` (\`message_attribution_persona_id_id\`);`)
  await db.run(sql`ALTER TABLE \`memory_rels\` ADD \`bot_id\` integer REFERENCES bot(id);`)
  await db.run(sql`ALTER TABLE \`memory_rels\` ADD \`personas_id\` integer REFERENCES personas(id);`)
  await db.run(sql`CREATE INDEX \`memory_rels_bot_id_idx\` ON \`memory_rels\` (\`bot_id\`);`)
  await db.run(sql`CREATE INDEX \`memory_rels_personas_id_idx\` ON \`memory_rels\` (\`personas_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`crisis_support\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`resource_type\` text NOT NULL,
  	\`resource_category\` text NOT NULL,
  	\`description\` text NOT NULL,
  	\`contact_info_phone_number\` text,
  	\`contact_info_text_number\` text,
  	\`contact_info_website\` text,
  	\`contact_info_email\` text,
  	\`contact_info_chat_url\` text,
  	\`contact_info_app_download_url\` text,
  	\`availability_is_24_7\` integer DEFAULT false,
  	\`availability_operating_hours_monday\` text,
  	\`availability_operating_hours_tuesday\` text,
  	\`availability_operating_hours_wednesday\` text,
  	\`availability_operating_hours_thursday\` text,
  	\`availability_operating_hours_friday\` text,
  	\`availability_operating_hours_saturday\` text,
  	\`availability_operating_hours_sunday\` text,
  	\`availability_timezone\` text DEFAULT 'UTC',
  	\`geographic_region\` text NOT NULL,
  	\`language_support\` integer DEFAULT true,
  	\`languages_available\` text,
  	\`cost_information\` text NOT NULL,
  	\`specialized_features_anonymous_support\` integer DEFAULT false,
  	\`specialized_features_peer_support\` integer DEFAULT false,
  	\`specialized_features_professional_counselors\` integer DEFAULT false,
  	\`specialized_features_volunteer_support\` integer DEFAULT false,
  	\`specialized_features_family_support\` integer DEFAULT false,
  	\`specialized_features_trauma_informed\` integer DEFAULT false,
  	\`verification_status\` text DEFAULT 'pending',
  	\`last_verified\` text,
  	\`verification_notes\` text,
  	\`tags\` text,
  	\`is_emergency\` integer DEFAULT false,
  	\`display_order\` numeric DEFAULT 0,
  	\`is_active\` integer DEFAULT true,
  	\`created_by_id\` integer,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`created_by_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`crisis_support_created_by_idx\` ON \`crisis_support\` (\`created_by_id\`);`)
  await db.run(sql`CREATE INDEX \`crisis_support_updated_at_idx\` ON \`crisis_support\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`crisis_support_created_at_idx\` ON \`crisis_support\` (\`created_at\`);`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_conversation\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`user_id\` integer NOT NULL,
  	\`created_timestamp\` text,
  	\`modified_timestamp\` text,
  	\`conversation_type\` text DEFAULT 'single-bot' NOT NULL,
  	\`participants\` text,
  	\`total_tokens\` numeric DEFAULT 0,
  	\`last_summarized_at\` text,
  	\`last_summarized_message_index\` numeric,
  	\`requires_summarization\` integer DEFAULT false,
  	\`conversation_metadata_total_messages\` numeric DEFAULT 0,
  	\`conversation_metadata_participant_count\` numeric DEFAULT 1,
  	\`conversation_metadata_last_activity\` text,
  	\`conversation_metadata_conversation_summary\` text,
  	\`status\` text DEFAULT 'active' NOT NULL,
  	\`conversation_settings_allow_file_sharing\` integer DEFAULT true,
  	\`conversation_settings_message_retention_days\` numeric DEFAULT 365,
  	\`conversation_settings_auto_save_conversations\` integer DEFAULT true,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new_conversation\`("id", "title", "user_id", "created_timestamp", "modified_timestamp", "conversation_type", "participants", "total_tokens", "last_summarized_at", "last_summarized_message_index", "requires_summarization", "conversation_metadata_total_messages", "conversation_metadata_participant_count", "conversation_metadata_last_activity", "conversation_metadata_conversation_summary", "status", "conversation_settings_allow_file_sharing", "conversation_settings_message_retention_days", "conversation_settings_auto_save_conversations", "updated_at", "created_at") SELECT "id", "title", "user_id", "created_timestamp", "modified_timestamp", "conversation_type", "participants", "total_tokens", "last_summarized_at", "last_summarized_message_index", "requires_summarization", "conversation_metadata_total_messages", "conversation_metadata_participant_count", "conversation_metadata_last_activity", "conversation_metadata_conversation_summary", "status", "conversation_settings_allow_file_sharing", "conversation_settings_message_retention_days", "conversation_settings_auto_save_conversations", "updated_at", "created_at" FROM \`conversation\`;`)
  await db.run(sql`DROP TABLE \`conversation\`;`)
  await db.run(sql`ALTER TABLE \`__new_conversation\` RENAME TO \`conversation\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`conversation_user_idx\` ON \`conversation\` (\`user_id\`);`)
  await db.run(sql`CREATE INDEX \`conversation_updated_at_idx\` ON \`conversation\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`conversation_created_at_idx\` ON \`conversation\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`__new_message\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`user_id\` integer NOT NULL,
  	\`created_timestamp\` text,
  	\`modified_timestamp\` text,
  	\`conversation_id\` integer NOT NULL,
  	\`message_type\` text DEFAULT 'text' NOT NULL,
  	\`bot_id\` integer,
  	\`message_attribution_source_bot_id_id\` integer,
  	\`message_attribution_is_ai_generated\` integer DEFAULT false,
  	\`message_attribution_model_used\` text,
  	\`message_attribution_confidence_score\` numeric,
  	\`message_content_text_content\` text,
  	\`message_content_reactions\` text,
  	\`message_thread_reply_to_id_id\` integer,
  	\`message_thread_thread_depth\` numeric DEFAULT 0,
  	\`message_thread_is_thread_parent\` integer DEFAULT false,
  	\`token_tracking_input_tokens\` numeric DEFAULT 0,
  	\`token_tracking_output_tokens\` numeric DEFAULT 0,
  	\`token_tracking_total_tokens\` numeric DEFAULT 0,
  	\`token_tracking_cost_estimate\` numeric DEFAULT 0,
  	\`byo_key\` integer DEFAULT false,
  	\`message_status_delivery_status\` text DEFAULT 'sent',
  	\`message_status_is_edited\` integer DEFAULT false,
  	\`message_status_edited_at\` text,
  	\`entry\` text NOT NULL,
  	\`metadata_processing_time_ms\` numeric,
  	\`metadata_priority_level\` text DEFAULT 'normal',
  	\`metadata_sensitivity_level\` text DEFAULT 'private',
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`conversation_id\`) REFERENCES \`conversation\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`bot_id\`) REFERENCES \`bot\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`message_attribution_source_bot_id_id\`) REFERENCES \`bot\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`message_thread_reply_to_id_id\`) REFERENCES \`message\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new_message\`("id", "user_id", "created_timestamp", "modified_timestamp", "conversation_id", "message_type", "bot_id", "message_attribution_source_bot_id_id", "message_attribution_is_ai_generated", "message_attribution_model_used", "message_attribution_confidence_score", "message_content_text_content", "message_content_reactions", "message_thread_reply_to_id_id", "message_thread_thread_depth", "message_thread_is_thread_parent", "token_tracking_input_tokens", "token_tracking_output_tokens", "token_tracking_total_tokens", "token_tracking_cost_estimate", "byo_key", "message_status_delivery_status", "message_status_is_edited", "message_status_edited_at", "entry", "metadata_processing_time_ms", "metadata_priority_level", "metadata_sensitivity_level", "updated_at", "created_at") SELECT "id", "user_id", "created_timestamp", "modified_timestamp", "conversation_id", "message_type", "bot_id", "message_attribution_source_bot_id_id", "message_attribution_is_ai_generated", "message_attribution_model_used", "message_attribution_confidence_score", "message_content_text_content", "message_content_reactions", "message_thread_reply_to_id_id", "message_thread_thread_depth", "message_thread_is_thread_parent", "token_tracking_input_tokens", "token_tracking_output_tokens", "token_tracking_total_tokens", "token_tracking_cost_estimate", "byo_key", "message_status_delivery_status", "message_status_is_edited", "message_status_edited_at", "entry", "metadata_processing_time_ms", "metadata_priority_level", "metadata_sensitivity_level", "updated_at", "created_at" FROM \`message\`;`)
  await db.run(sql`DROP TABLE \`message\`;`)
  await db.run(sql`ALTER TABLE \`__new_message\` RENAME TO \`message\`;`)
  await db.run(sql`CREATE INDEX \`message_user_idx\` ON \`message\` (\`user_id\`);`)
  await db.run(sql`CREATE INDEX \`message_conversation_idx\` ON \`message\` (\`conversation_id\`);`)
  await db.run(sql`CREATE INDEX \`message_bot_idx\` ON \`message\` (\`bot_id\`);`)
  await db.run(sql`CREATE INDEX \`message_message_attribution_message_attribution_source_b_idx\` ON \`message\` (\`message_attribution_source_bot_id_id\`);`)
  await db.run(sql`CREATE INDEX \`message_message_thread_message_thread_reply_to_id_idx\` ON \`message\` (\`message_thread_reply_to_id_id\`);`)
  await db.run(sql`CREATE INDEX \`message_updated_at_idx\` ON \`message\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`message_created_at_idx\` ON \`message\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`__new_memory_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`vector_records_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`memory\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`vector_records_id\`) REFERENCES \`vector_records\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_memory_rels\`("id", "order", "parent_id", "path", "vector_records_id") SELECT "id", "order", "parent_id", "path", "vector_records_id" FROM \`memory_rels\`;`)
  await db.run(sql`DROP TABLE \`memory_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_memory_rels\` RENAME TO \`memory_rels\`;`)
  await db.run(sql`CREATE INDEX \`memory_rels_order_idx\` ON \`memory_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`memory_rels_parent_idx\` ON \`memory_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`memory_rels_path_idx\` ON \`memory_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`memory_rels_vector_records_id_idx\` ON \`memory_rels\` (\`vector_records_id\`);`)
  await db.run(sql`ALTER TABLE \`memory\` ADD \`bot_id\` integer NOT NULL REFERENCES bot(id);`)
  await db.run(sql`CREATE INDEX \`memory_bot_idx\` ON \`memory\` (\`bot_id\`);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`crisis_support_id\` integer REFERENCES crisis_support(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_crisis_support_id_idx\` ON \`payload_locked_documents_rels\` (\`crisis_support_id\`);`)
  await db.run(sql`ALTER TABLE \`users\` DROP COLUMN \`role\`;`)
  await db.run(sql`ALTER TABLE \`users\` DROP COLUMN \`nickname\`;`)
  await db.run(sql`ALTER TABLE \`users\` DROP COLUMN \`pronouns\`;`)
  await db.run(sql`ALTER TABLE \`users\` DROP COLUMN \`custom_pronouns\`;`)
  await db.run(sql`ALTER TABLE \`users\` DROP COLUMN \`description\`;`)
}
