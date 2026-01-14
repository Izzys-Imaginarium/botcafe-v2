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
  await db.run(sql`CREATE TABLE \`knowledge_activation_settings_primary_keys\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`keyword\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`knowledge\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`knowledge_activation_settings_primary_keys_order_idx\` ON \`knowledge_activation_settings_primary_keys\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`knowledge_activation_settings_primary_keys_parent_id_idx\` ON \`knowledge_activation_settings_primary_keys\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`knowledge_activation_settings_secondary_keys\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`keyword\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`knowledge\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`knowledge_activation_settings_secondary_keys_order_idx\` ON \`knowledge_activation_settings_secondary_keys\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`knowledge_activation_settings_secondary_keys_parent_id_idx\` ON \`knowledge_activation_settings_secondary_keys\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`knowledge_filtering_allowed_bot_ids\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`bot_id\` numeric,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`knowledge\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`knowledge_filtering_allowed_bot_ids_order_idx\` ON \`knowledge_filtering_allowed_bot_ids\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`knowledge_filtering_allowed_bot_ids_parent_id_idx\` ON \`knowledge_filtering_allowed_bot_ids\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`knowledge_filtering_excluded_bot_ids\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`bot_id\` numeric,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`knowledge\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`knowledge_filtering_excluded_bot_ids_order_idx\` ON \`knowledge_filtering_excluded_bot_ids\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`knowledge_filtering_excluded_bot_ids_parent_id_idx\` ON \`knowledge_filtering_excluded_bot_ids\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`knowledge_filtering_allowed_persona_ids\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`persona_id\` numeric,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`knowledge\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`knowledge_filtering_allowed_persona_ids_order_idx\` ON \`knowledge_filtering_allowed_persona_ids\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`knowledge_filtering_allowed_persona_ids_parent_id_idx\` ON \`knowledge_filtering_allowed_persona_ids\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`knowledge_filtering_excluded_persona_ids\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`persona_id\` numeric,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`knowledge\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`knowledge_filtering_excluded_persona_ids_order_idx\` ON \`knowledge_filtering_excluded_persona_ids\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`knowledge_filtering_excluded_persona_ids_parent_id_idx\` ON \`knowledge_filtering_excluded_persona_ids\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`knowledge_activation_log_matched_keywords\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`keyword\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`knowledge_activation_log\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`knowledge_activation_log_matched_keywords_order_idx\` ON \`knowledge_activation_log_matched_keywords\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`knowledge_activation_log_matched_keywords_parent_id_idx\` ON \`knowledge_activation_log_matched_keywords\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`knowledge_activation_log\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`conversation_id_id\` integer NOT NULL,
  	\`message_index\` numeric NOT NULL,
  	\`knowledge_entry_id_id\` integer NOT NULL,
  	\`activation_method\` text NOT NULL,
  	\`activation_score\` numeric NOT NULL,
  	\`vector_similarity\` numeric,
  	\`position_inserted\` text NOT NULL,
  	\`tokens_used\` numeric NOT NULL,
  	\`was_included\` integer DEFAULT true NOT NULL,
  	\`exclusion_reason\` text,
  	\`activation_timestamp\` text NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`conversation_id_id\`) REFERENCES \`conversation\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`knowledge_entry_id_id\`) REFERENCES \`knowledge\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`knowledge_activation_log_conversation_id_idx\` ON \`knowledge_activation_log\` (\`conversation_id_id\`);`)
  await db.run(sql`CREATE INDEX \`knowledge_activation_log_knowledge_entry_id_idx\` ON \`knowledge_activation_log\` (\`knowledge_entry_id_id\`);`)
  await db.run(sql`CREATE INDEX \`knowledge_activation_log_updated_at_idx\` ON \`knowledge_activation_log\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`knowledge_activation_log_created_at_idx\` ON \`knowledge_activation_log\` (\`created_at\`);`)
  await db.run(sql`DROP TABLE \`personas_interaction_preferences_signature_phrases\`;`)
  await db.run(sql`DROP TABLE \`personas_tags\`;`)
  await db.run(sql`DROP TABLE \`creator_programs_app_requirements_specialties\`;`)
  await db.run(sql`DROP TABLE \`creator_programs_app_process_questions_options\`;`)
  await db.run(sql`DROP TABLE \`creator_programs_app_process_questions\`;`)
  await db.run(sql`DROP TABLE \`creator_programs_program_benefits_primary_benefits\`;`)
  await db.run(sql`DROP TABLE \`creator_programs_program_benefits_promotional_benefits\`;`)
  await db.run(sql`DROP TABLE \`creator_programs_program_benefits_technical_benefits\`;`)
  await db.run(sql`DROP TABLE \`creator_programs_program_benefits_community_benefits\`;`)
  await db.run(sql`DROP TABLE \`creator_programs_program_benefits_financial_benefits\`;`)
  await db.run(sql`DROP TABLE \`creator_programs_program_tiers_tier_benefits\`;`)
  await db.run(sql`DROP TABLE \`creator_programs_program_tiers\`;`)
  await db.run(sql`DROP TABLE \`creator_programs_tags\`;`)
  await db.run(sql`DROP TABLE \`creator_programs\`;`)
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
  	\`crisis_support_id\` integer,
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
  	FOREIGN KEY (\`crisis_support_id\`) REFERENCES \`crisis_support\`(\`id\`) ON UPDATE no action ON DELETE cascade,
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
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "media_id", "bot_id", "bot_interactions_id", "api_key_id", "mood_id", "knowledge_id", "knowledge_collections_id", "knowledge_activation_log_id", "conversation_id", "message_id", "memory_id", "vector_records_id", "token_gifts_id", "subscription_payments_id", "subscription_tiers_id", "token_packages_id", "personas_id", "creator_profiles_id", "access_control_id", "self_moderation_id", "crisis_support_id", "usage_analytics_id", "memory_insights_id", "persona_analytics_id", "legal_documents_id", "user_agreements_id", "documentation_id", "tutorials_id", "support_tickets_id") SELECT "id", "order", "parent_id", "path", "users_id", "media_id", "bot_id", "bot_interactions_id", "api_key_id", "mood_id", "knowledge_id", "knowledge_collections_id", "knowledge_activation_log_id", "conversation_id", "message_id", "memory_id", "vector_records_id", "token_gifts_id", "subscription_payments_id", "subscription_tiers_id", "token_packages_id", "personas_id", "creator_profiles_id", "access_control_id", "self_moderation_id", "crisis_support_id", "usage_analytics_id", "memory_insights_id", "persona_analytics_id", "legal_documents_id", "user_agreements_id", "documentation_id", "tutorials_id", "support_tickets_id" FROM \`payload_locked_documents_rels\`;`)
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
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_crisis_support_id_idx\` ON \`payload_locked_documents_rels\` (\`crisis_support_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_usage_analytics_id_idx\` ON \`payload_locked_documents_rels\` (\`usage_analytics_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_memory_insights_id_idx\` ON \`payload_locked_documents_rels\` (\`memory_insights_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_persona_analytics_id_idx\` ON \`payload_locked_documents_rels\` (\`persona_analytics_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_legal_documents_id_idx\` ON \`payload_locked_documents_rels\` (\`legal_documents_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_user_agreements_id_idx\` ON \`payload_locked_documents_rels\` (\`user_agreements_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_documentation_id_idx\` ON \`payload_locked_documents_rels\` (\`documentation_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_tutorials_id_idx\` ON \`payload_locked_documents_rels\` (\`tutorials_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_support_tickets_id_idx\` ON \`payload_locked_documents_rels\` (\`support_tickets_id\`);`)
  await db.run(sql`ALTER TABLE \`bot\` ADD \`personality_traits_tone\` text;`)
  await db.run(sql`ALTER TABLE \`bot\` ADD \`personality_traits_formality_level\` text;`)
  await db.run(sql`ALTER TABLE \`bot\` ADD \`personality_traits_humor_style\` text;`)
  await db.run(sql`ALTER TABLE \`bot\` ADD \`personality_traits_communication_style\` text;`)
  await db.run(sql`ALTER TABLE \`bot\` ADD \`behavior_settings_response_length\` text;`)
  await db.run(sql`ALTER TABLE \`bot\` ADD \`behavior_settings_creativity_level\` text;`)
  await db.run(sql`ALTER TABLE \`bot\` ADD \`behavior_settings_knowledge_sharing\` text;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`activation_settings_activation_mode\` text DEFAULT 'vector' NOT NULL;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`activation_settings_keywords_logic\` text DEFAULT 'AND_ANY';`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`activation_settings_case_sensitive\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`activation_settings_match_whole_words\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`activation_settings_use_regex\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`activation_settings_vector_similarity_threshold\` numeric DEFAULT 0.7;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`activation_settings_max_vector_results\` numeric DEFAULT 5;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`activation_settings_probability\` numeric DEFAULT 100;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`activation_settings_use_probability\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`activation_settings_scan_depth\` numeric DEFAULT 2;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`activation_settings_match_in_user_messages\` integer DEFAULT true;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`activation_settings_match_in_bot_messages\` integer DEFAULT true;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`activation_settings_match_in_system_prompts\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`positioning_position\` text DEFAULT 'before_character' NOT NULL;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`positioning_depth\` numeric DEFAULT 0;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`positioning_role\` text DEFAULT 'system';`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`positioning_order\` numeric DEFAULT 100;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`advanced_activation_sticky\` numeric DEFAULT 0;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`advanced_activation_cooldown\` numeric DEFAULT 0;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`advanced_activation_delay\` numeric DEFAULT 0;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`filtering_filter_by_bots\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`filtering_filter_by_personas\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`filtering_match_bot_description\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`filtering_match_bot_personality\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`filtering_match_persona_description\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`budget_control_ignore_budget\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`budget_control_token_cost\` numeric DEFAULT 0;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`budget_control_max_tokens\` numeric DEFAULT 1000;`)
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
  await db.run(sql`CREATE TABLE \`creator_programs_app_requirements_specialties\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`specialty\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`creator_programs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`creator_programs_app_requirements_specialties_order_idx\` ON \`creator_programs_app_requirements_specialties\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`creator_programs_app_requirements_specialties_parent_id_idx\` ON \`creator_programs_app_requirements_specialties\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`creator_programs_app_process_questions_options\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`option\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`creator_programs_app_process_questions\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`creator_programs_app_process_questions_options_order_idx\` ON \`creator_programs_app_process_questions_options\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`creator_programs_app_process_questions_options_parent_id_idx\` ON \`creator_programs_app_process_questions_options\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`creator_programs_app_process_questions\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`question\` text NOT NULL,
  	\`question_type\` text DEFAULT 'short-text',
  	\`required\` integer DEFAULT false,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`creator_programs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`creator_programs_app_process_questions_order_idx\` ON \`creator_programs_app_process_questions\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`creator_programs_app_process_questions_parent_id_idx\` ON \`creator_programs_app_process_questions\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`creator_programs_program_benefits_primary_benefits\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`benefit\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`creator_programs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`creator_programs_program_benefits_primary_benefits_order_idx\` ON \`creator_programs_program_benefits_primary_benefits\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`creator_programs_program_benefits_primary_benefits_parent_id_idx\` ON \`creator_programs_program_benefits_primary_benefits\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`creator_programs_program_benefits_promotional_benefits\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`benefit\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`creator_programs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`creator_programs_program_benefits_promotional_benefits_order_idx\` ON \`creator_programs_program_benefits_promotional_benefits\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`creator_programs_program_benefits_promotional_benefits_parent_id_idx\` ON \`creator_programs_program_benefits_promotional_benefits\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`creator_programs_program_benefits_technical_benefits\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`benefit\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`creator_programs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`creator_programs_program_benefits_technical_benefits_order_idx\` ON \`creator_programs_program_benefits_technical_benefits\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`creator_programs_program_benefits_technical_benefits_parent_id_idx\` ON \`creator_programs_program_benefits_technical_benefits\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`creator_programs_program_benefits_community_benefits\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`benefit\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`creator_programs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`creator_programs_program_benefits_community_benefits_order_idx\` ON \`creator_programs_program_benefits_community_benefits\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`creator_programs_program_benefits_community_benefits_parent_id_idx\` ON \`creator_programs_program_benefits_community_benefits\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`creator_programs_program_benefits_financial_benefits\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`benefit\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`creator_programs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`creator_programs_program_benefits_financial_benefits_order_idx\` ON \`creator_programs_program_benefits_financial_benefits\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`creator_programs_program_benefits_financial_benefits_parent_id_idx\` ON \`creator_programs_program_benefits_financial_benefits\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`creator_programs_program_tiers_tier_benefits\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`benefit\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`creator_programs_program_tiers\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`creator_programs_program_tiers_tier_benefits_order_idx\` ON \`creator_programs_program_tiers_tier_benefits\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`creator_programs_program_tiers_tier_benefits_parent_id_idx\` ON \`creator_programs_program_tiers_tier_benefits\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`creator_programs_program_tiers\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`tier_name\` text NOT NULL,
  	\`tier_level\` numeric NOT NULL,
  	\`tier_description\` text NOT NULL,
  	\`requirements\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`creator_programs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`creator_programs_program_tiers_order_idx\` ON \`creator_programs_program_tiers\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`creator_programs_program_tiers_parent_id_idx\` ON \`creator_programs_program_tiers\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`creator_programs_tags\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`tag\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`creator_programs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`creator_programs_tags_order_idx\` ON \`creator_programs_tags\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`creator_programs_tags_parent_id_idx\` ON \`creator_programs_tags\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`creator_programs\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`program_name\` text NOT NULL,
  	\`program_slug\` text NOT NULL,
  	\`description\` text NOT NULL,
  	\`short_description\` text NOT NULL,
  	\`program_type\` text NOT NULL,
  	\`program_status\` text DEFAULT 'active' NOT NULL,
  	\`program_media_banner_image_id\` integer,
  	\`program_media_icon_id\` integer,
  	\`app_requirements_min_bot_count\` numeric DEFAULT 1,
  	\`app_requirements_min_conversations\` numeric DEFAULT 0,
  	\`app_requirements_min_rating\` numeric,
  	\`app_requirements_verification_required\` integer DEFAULT false,
  	\`app_requirements_portfolio_review\` integer DEFAULT true,
  	\`app_requirements_community_standing\` text DEFAULT 'good',
  	\`app_process_deadline\` text,
  	\`app_process_method\` text DEFAULT 'form',
  	\`app_process_review_process\` text,
  	\`app_process_review_timeline\` text,
  	\`program_stats_total_applicants\` numeric DEFAULT 0,
  	\`program_stats_accepted_creators\` numeric DEFAULT 0,
  	\`program_stats_active_creators\` numeric DEFAULT 0,
  	\`program_settings_max_participants\` numeric,
  	\`program_settings_renewal_required\` integer DEFAULT false,
  	\`program_settings_renewal_period_months\` numeric,
  	\`program_settings_auto_accept_criteria\` text,
  	\`created_timestamp\` text,
  	\`modified_timestamp\` text,
  	\`launch_date\` text,
  	\`program_notes\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`program_media_banner_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`program_media_icon_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`creator_programs_program_slug_idx\` ON \`creator_programs\` (\`program_slug\`);`)
  await db.run(sql`CREATE INDEX \`creator_programs_program_media_program_media_banner_imag_idx\` ON \`creator_programs\` (\`program_media_banner_image_id\`);`)
  await db.run(sql`CREATE INDEX \`creator_programs_program_media_program_media_icon_idx\` ON \`creator_programs\` (\`program_media_icon_id\`);`)
  await db.run(sql`CREATE INDEX \`creator_programs_updated_at_idx\` ON \`creator_programs\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`creator_programs_created_at_idx\` ON \`creator_programs\` (\`created_at\`);`)
  await db.run(sql`DROP TABLE \`bot_signature_phrases\`;`)
  await db.run(sql`DROP TABLE \`bot_tags\`;`)
  await db.run(sql`DROP TABLE \`knowledge_activation_settings_primary_keys\`;`)
  await db.run(sql`DROP TABLE \`knowledge_activation_settings_secondary_keys\`;`)
  await db.run(sql`DROP TABLE \`knowledge_filtering_allowed_bot_ids\`;`)
  await db.run(sql`DROP TABLE \`knowledge_filtering_excluded_bot_ids\`;`)
  await db.run(sql`DROP TABLE \`knowledge_filtering_allowed_persona_ids\`;`)
  await db.run(sql`DROP TABLE \`knowledge_filtering_excluded_persona_ids\`;`)
  await db.run(sql`DROP TABLE \`knowledge_activation_log_matched_keywords\`;`)
  await db.run(sql`DROP TABLE \`knowledge_activation_log\`;`)
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
  	\`creator_programs_id\` integer,
  	\`access_control_id\` integer,
  	\`self_moderation_id\` integer,
  	\`crisis_support_id\` integer,
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
  	FOREIGN KEY (\`creator_programs_id\`) REFERENCES \`creator_programs\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`access_control_id\`) REFERENCES \`access_control\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`self_moderation_id\`) REFERENCES \`self_moderation\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`crisis_support_id\`) REFERENCES \`crisis_support\`(\`id\`) ON UPDATE no action ON DELETE cascade,
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
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "media_id", "bot_id", "bot_interactions_id", "api_key_id", "mood_id", "knowledge_id", "knowledge_collections_id", "conversation_id", "message_id", "memory_id", "vector_records_id", "token_gifts_id", "subscription_payments_id", "subscription_tiers_id", "token_packages_id", "personas_id", "creator_profiles_id", "creator_programs_id", "access_control_id", "self_moderation_id", "crisis_support_id", "usage_analytics_id", "memory_insights_id", "persona_analytics_id", "legal_documents_id", "user_agreements_id", "documentation_id", "tutorials_id", "support_tickets_id") SELECT "id", "order", "parent_id", "path", "users_id", "media_id", "bot_id", "bot_interactions_id", "api_key_id", "mood_id", "knowledge_id", "knowledge_collections_id", "conversation_id", "message_id", "memory_id", "vector_records_id", "token_gifts_id", "subscription_payments_id", "subscription_tiers_id", "token_packages_id", "personas_id", "creator_profiles_id", "creator_programs_id", "access_control_id", "self_moderation_id", "crisis_support_id", "usage_analytics_id", "memory_insights_id", "persona_analytics_id", "legal_documents_id", "user_agreements_id", "documentation_id", "tutorials_id", "support_tickets_id" FROM \`payload_locked_documents_rels\`;`)
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
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_creator_programs_id_idx\` ON \`payload_locked_documents_rels\` (\`creator_programs_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_access_control_id_idx\` ON \`payload_locked_documents_rels\` (\`access_control_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_self_moderation_id_idx\` ON \`payload_locked_documents_rels\` (\`self_moderation_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_crisis_support_id_idx\` ON \`payload_locked_documents_rels\` (\`crisis_support_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_usage_analytics_id_idx\` ON \`payload_locked_documents_rels\` (\`usage_analytics_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_memory_insights_id_idx\` ON \`payload_locked_documents_rels\` (\`memory_insights_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_persona_analytics_id_idx\` ON \`payload_locked_documents_rels\` (\`persona_analytics_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_legal_documents_id_idx\` ON \`payload_locked_documents_rels\` (\`legal_documents_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_user_agreements_id_idx\` ON \`payload_locked_documents_rels\` (\`user_agreements_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_documentation_id_idx\` ON \`payload_locked_documents_rels\` (\`documentation_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_tutorials_id_idx\` ON \`payload_locked_documents_rels\` (\`tutorials_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_support_tickets_id_idx\` ON \`payload_locked_documents_rels\` (\`support_tickets_id\`);`)
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
  await db.run(sql`ALTER TABLE \`knowledge\` DROP COLUMN \`activation_settings_activation_mode\`;`)
  await db.run(sql`ALTER TABLE \`knowledge\` DROP COLUMN \`activation_settings_keywords_logic\`;`)
  await db.run(sql`ALTER TABLE \`knowledge\` DROP COLUMN \`activation_settings_case_sensitive\`;`)
  await db.run(sql`ALTER TABLE \`knowledge\` DROP COLUMN \`activation_settings_match_whole_words\`;`)
  await db.run(sql`ALTER TABLE \`knowledge\` DROP COLUMN \`activation_settings_use_regex\`;`)
  await db.run(sql`ALTER TABLE \`knowledge\` DROP COLUMN \`activation_settings_vector_similarity_threshold\`;`)
  await db.run(sql`ALTER TABLE \`knowledge\` DROP COLUMN \`activation_settings_max_vector_results\`;`)
  await db.run(sql`ALTER TABLE \`knowledge\` DROP COLUMN \`activation_settings_probability\`;`)
  await db.run(sql`ALTER TABLE \`knowledge\` DROP COLUMN \`activation_settings_use_probability\`;`)
  await db.run(sql`ALTER TABLE \`knowledge\` DROP COLUMN \`activation_settings_scan_depth\`;`)
  await db.run(sql`ALTER TABLE \`knowledge\` DROP COLUMN \`activation_settings_match_in_user_messages\`;`)
  await db.run(sql`ALTER TABLE \`knowledge\` DROP COLUMN \`activation_settings_match_in_bot_messages\`;`)
  await db.run(sql`ALTER TABLE \`knowledge\` DROP COLUMN \`activation_settings_match_in_system_prompts\`;`)
  await db.run(sql`ALTER TABLE \`knowledge\` DROP COLUMN \`positioning_position\`;`)
  await db.run(sql`ALTER TABLE \`knowledge\` DROP COLUMN \`positioning_depth\`;`)
  await db.run(sql`ALTER TABLE \`knowledge\` DROP COLUMN \`positioning_role\`;`)
  await db.run(sql`ALTER TABLE \`knowledge\` DROP COLUMN \`positioning_order\`;`)
  await db.run(sql`ALTER TABLE \`knowledge\` DROP COLUMN \`advanced_activation_sticky\`;`)
  await db.run(sql`ALTER TABLE \`knowledge\` DROP COLUMN \`advanced_activation_cooldown\`;`)
  await db.run(sql`ALTER TABLE \`knowledge\` DROP COLUMN \`advanced_activation_delay\`;`)
  await db.run(sql`ALTER TABLE \`knowledge\` DROP COLUMN \`filtering_filter_by_bots\`;`)
  await db.run(sql`ALTER TABLE \`knowledge\` DROP COLUMN \`filtering_filter_by_personas\`;`)
  await db.run(sql`ALTER TABLE \`knowledge\` DROP COLUMN \`filtering_match_bot_description\`;`)
  await db.run(sql`ALTER TABLE \`knowledge\` DROP COLUMN \`filtering_match_bot_personality\`;`)
  await db.run(sql`ALTER TABLE \`knowledge\` DROP COLUMN \`filtering_match_persona_description\`;`)
  await db.run(sql`ALTER TABLE \`knowledge\` DROP COLUMN \`budget_control_ignore_budget\`;`)
  await db.run(sql`ALTER TABLE \`knowledge\` DROP COLUMN \`budget_control_token_cost\`;`)
  await db.run(sql`ALTER TABLE \`knowledge\` DROP COLUMN \`budget_control_max_tokens\`;`)
}
