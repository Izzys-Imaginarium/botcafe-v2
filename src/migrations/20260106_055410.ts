import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`bot_interactions\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`user_id\` integer NOT NULL,
  	\`bot_id\` integer NOT NULL,
  	\`liked\` integer DEFAULT false,
  	\`favorited\` integer DEFAULT false,
  	\`created_date\` text,
  	\`updated_date\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`bot_id\`) REFERENCES \`bot\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`bot_interactions_user_idx\` ON \`bot_interactions\` (\`user_id\`);`)
  await db.run(sql`CREATE INDEX \`bot_interactions_bot_idx\` ON \`bot_interactions\` (\`bot_id\`);`)
  await db.run(sql`CREATE INDEX \`bot_interactions_updated_at_idx\` ON \`bot_interactions\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`bot_interactions_created_at_idx\` ON \`bot_interactions\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`api_key_key_configuration_model_preferences\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`model\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`api_key\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`api_key_key_configuration_model_preferences_order_idx\` ON \`api_key_key_configuration_model_preferences\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`api_key_key_configuration_model_preferences_parent_id_idx\` ON \`api_key_key_configuration_model_preferences\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`api_key_key_configuration_fallback_providers\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`provider_id\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`api_key\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`api_key_key_configuration_fallback_providers_order_idx\` ON \`api_key_key_configuration_fallback_providers\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`api_key_key_configuration_fallback_providers_parent_id_idx\` ON \`api_key_key_configuration_fallback_providers\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`knowledge_shared_access_shared_with_user_ids\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`user_id\` numeric,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`knowledge\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`knowledge_shared_access_shared_with_user_ids_order_idx\` ON \`knowledge_shared_access_shared_with_user_ids\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`knowledge_shared_access_shared_with_user_ids_parent_id_idx\` ON \`knowledge_shared_access_shared_with_user_ids\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`knowledge_shared_access_permissions\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`permission\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`knowledge\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`knowledge_shared_access_permissions_order_idx\` ON \`knowledge_shared_access_permissions\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`knowledge_shared_access_permissions_parent_id_idx\` ON \`knowledge_shared_access_permissions\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`knowledge_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`bot_id\` integer,
  	\`personas_id\` integer,
  	\`vector_records_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`knowledge\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`bot_id\`) REFERENCES \`bot\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`personas_id\`) REFERENCES \`personas\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`vector_records_id\`) REFERENCES \`vector_records\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`knowledge_rels_order_idx\` ON \`knowledge_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`knowledge_rels_parent_idx\` ON \`knowledge_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`knowledge_rels_path_idx\` ON \`knowledge_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`knowledge_rels_bot_id_idx\` ON \`knowledge_rels\` (\`bot_id\`);`)
  await db.run(sql`CREATE INDEX \`knowledge_rels_personas_id_idx\` ON \`knowledge_rels\` (\`personas_id\`);`)
  await db.run(sql`CREATE INDEX \`knowledge_rels_vector_records_id_idx\` ON \`knowledge_rels\` (\`vector_records_id\`);`)
  await db.run(sql`CREATE TABLE \`knowledge_collections_collaborators_collab_user_ids\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`user_id\` numeric,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`knowledge_collections\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`knowledge_collections_collaborators_collab_user_ids_order_idx\` ON \`knowledge_collections_collaborators_collab_user_ids\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`knowledge_collections_collaborators_collab_user_ids_parent_id_idx\` ON \`knowledge_collections_collaborators_collab_user_ids\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`knowledge_collections_collaborators_collab_perms\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`perm\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`knowledge_collections\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`knowledge_collections_collaborators_collab_perms_order_idx\` ON \`knowledge_collections_collaborators_collab_perms\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`knowledge_collections_collaborators_collab_perms_parent_id_idx\` ON \`knowledge_collections_collaborators_collab_perms\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`knowledge_collections_collection_metadata_tags\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`tag\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`knowledge_collections\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`knowledge_collections_collection_metadata_tags_order_idx\` ON \`knowledge_collections_collection_metadata_tags\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`knowledge_collections_collection_metadata_tags_parent_id_idx\` ON \`knowledge_collections_collection_metadata_tags\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`conversation_bot_participation\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`bot_id_id\` integer NOT NULL,
  	\`joined_at\` text,
  	\`role\` text DEFAULT 'secondary' NOT NULL,
  	\`is_active\` integer DEFAULT true,
  	FOREIGN KEY (\`bot_id_id\`) REFERENCES \`bot\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`conversation\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`conversation_bot_participation_order_idx\` ON \`conversation_bot_participation\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`conversation_bot_participation_parent_id_idx\` ON \`conversation_bot_participation\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`conversation_bot_participation_bot_id_idx\` ON \`conversation_bot_participation\` (\`bot_id_id\`);`)
  await db.run(sql`CREATE TABLE \`conversation_conversation_metadata_tags\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`tag\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`conversation\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`conversation_conversation_metadata_tags_order_idx\` ON \`conversation_conversation_metadata_tags\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`conversation_conversation_metadata_tags_parent_id_idx\` ON \`conversation_conversation_metadata_tags\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`message_message_content_code_snippets\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`language\` text NOT NULL,
  	\`code\` text NOT NULL,
  	\`filename\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`message\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`message_message_content_code_snippets_order_idx\` ON \`message_message_content_code_snippets\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`message_message_content_code_snippets_parent_id_idx\` ON \`message_message_content_code_snippets\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`message_message_status_edit_history\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`previous_content\` text NOT NULL,
  	\`edited_at\` text NOT NULL,
  	\`edit_reason\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`message\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`message_message_status_edit_history_order_idx\` ON \`message_message_status_edit_history\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`message_message_status_edit_history_parent_id_idx\` ON \`message_message_status_edit_history\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`message_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`media_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`message\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`message_rels_order_idx\` ON \`message_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`message_rels_parent_idx\` ON \`message_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`message_rels_path_idx\` ON \`message_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`message_rels_media_id_idx\` ON \`message_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE TABLE \`memory_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`vector_records_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`memory\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`vector_records_id\`) REFERENCES \`vector_records\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`memory_rels_order_idx\` ON \`memory_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`memory_rels_parent_idx\` ON \`memory_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`memory_rels_path_idx\` ON \`memory_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`memory_rels_vector_records_id_idx\` ON \`memory_rels\` (\`vector_records_id\`);`)
  await db.run(sql`CREATE TABLE \`vector_records\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`vector_id\` text NOT NULL,
  	\`source_type\` text NOT NULL,
  	\`source_id\` text NOT NULL,
  	\`user_id_id\` integer NOT NULL,
  	\`tenant_id\` text NOT NULL,
  	\`chunk_index\` numeric NOT NULL,
  	\`total_chunks\` numeric NOT NULL,
  	\`chunk_text\` text NOT NULL,
  	\`metadata\` text NOT NULL,
  	\`embedding_model\` text DEFAULT 'text-embedding-3-small' NOT NULL,
  	\`embedding_dimensions\` numeric DEFAULT 1536 NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`user_id_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`vector_records_vector_id_idx\` ON \`vector_records\` (\`vector_id\`);`)
  await db.run(sql`CREATE INDEX \`vector_records_source_type_idx\` ON \`vector_records\` (\`source_type\`);`)
  await db.run(sql`CREATE INDEX \`vector_records_source_id_idx\` ON \`vector_records\` (\`source_id\`);`)
  await db.run(sql`CREATE INDEX \`vector_records_user_id_idx\` ON \`vector_records\` (\`user_id_id\`);`)
  await db.run(sql`CREATE INDEX \`vector_records_tenant_id_idx\` ON \`vector_records\` (\`tenant_id\`);`)
  await db.run(sql`CREATE INDEX \`vector_records_updated_at_idx\` ON \`vector_records\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`vector_records_created_at_idx\` ON \`vector_records\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`personas_interaction_preferences_preferred_topics\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`topic\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`personas\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`personas_interaction_preferences_preferred_topics_order_idx\` ON \`personas_interaction_preferences_preferred_topics\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`personas_interaction_preferences_preferred_topics_parent_id_idx\` ON \`personas_interaction_preferences_preferred_topics\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`personas_interaction_preferences_avoid_topics\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`topic\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`personas\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`personas_interaction_preferences_avoid_topics_order_idx\` ON \`personas_interaction_preferences_avoid_topics\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`personas_interaction_preferences_avoid_topics_parent_id_idx\` ON \`personas_interaction_preferences_avoid_topics\` (\`_parent_id\`);`)
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
  await db.run(sql`CREATE TABLE \`personas\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`user_id\` integer NOT NULL,
  	\`name\` text NOT NULL,
  	\`description\` text NOT NULL,
  	\`personality_traits_tone\` text,
  	\`personality_traits_formality_level\` text,
  	\`personality_traits_humor_style\` text,
  	\`personality_traits_communication_style\` text,
  	\`appearance_avatar_id\` integer,
  	\`appearance_visual_theme\` text,
  	\`appearance_color_scheme\` text,
  	\`behavior_settings_response_length\` text,
  	\`behavior_settings_creativity_level\` text,
  	\`behavior_settings_knowledge_sharing\` text,
  	\`interaction_preferences_conversation_starter\` text,
  	\`is_default\` integer DEFAULT false,
  	\`is_public\` integer DEFAULT false,
  	\`usage_count\` numeric DEFAULT 0,
  	\`created_timestamp\` text,
  	\`modified_timestamp\` text,
  	\`custom_instructions\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`appearance_avatar_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`personas_user_idx\` ON \`personas\` (\`user_id\`);`)
  await db.run(sql`CREATE INDEX \`personas_appearance_appearance_avatar_idx\` ON \`personas\` (\`appearance_avatar_id\`);`)
  await db.run(sql`CREATE INDEX \`personas_updated_at_idx\` ON \`personas\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`personas_created_at_idx\` ON \`personas\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`creator_profiles_social_links_other_links\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`platform\` text NOT NULL,
  	\`url\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`creator_profiles\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`creator_profiles_social_links_other_links_order_idx\` ON \`creator_profiles_social_links_other_links\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`creator_profiles_social_links_other_links_parent_id_idx\` ON \`creator_profiles_social_links_other_links\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`creator_profiles_creator_info_specialties\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`specialty\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`creator_profiles\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`creator_profiles_creator_info_specialties_order_idx\` ON \`creator_profiles_creator_info_specialties\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`creator_profiles_creator_info_specialties_parent_id_idx\` ON \`creator_profiles_creator_info_specialties\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`creator_profiles_creator_info_languages\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`language\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`creator_profiles\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`creator_profiles_creator_info_languages_order_idx\` ON \`creator_profiles_creator_info_languages\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`creator_profiles_creator_info_languages_parent_id_idx\` ON \`creator_profiles_creator_info_languages\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`creator_profiles_tags\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`tag\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`creator_profiles\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`creator_profiles_tags_order_idx\` ON \`creator_profiles_tags\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`creator_profiles_tags_parent_id_idx\` ON \`creator_profiles_tags\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`creator_profiles\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`user_id\` integer NOT NULL,
  	\`username\` text NOT NULL,
  	\`display_name\` text NOT NULL,
  	\`bio\` text NOT NULL,
  	\`profile_media_avatar_id\` integer,
  	\`profile_media_banner_image_id\` integer,
  	\`social_links_website\` text,
  	\`social_links_github\` text,
  	\`social_links_twitter\` text,
  	\`social_links_linkedin\` text,
  	\`social_links_discord\` text,
  	\`social_links_youtube\` text,
  	\`creator_info_creator_type\` text NOT NULL,
  	\`creator_info_experience_level\` text,
  	\`creator_info_location\` text,
  	\`portfolio_bot_count\` numeric DEFAULT 0,
  	\`portfolio_total_conversations\` numeric DEFAULT 0,
  	\`portfolio_average_rating\` numeric,
  	\`community_stats_follower_count\` numeric DEFAULT 0,
  	\`community_stats_following_count\` numeric DEFAULT 0,
  	\`community_stats_total_likes\` numeric DEFAULT 0,
  	\`verification_status\` text DEFAULT 'unverified',
  	\`featured_creator\` integer DEFAULT false,
  	\`profile_settings_profile_visibility\` text DEFAULT 'public',
  	\`profile_settings_allow_collaborations\` integer DEFAULT true,
  	\`profile_settings_accept_commissions\` integer DEFAULT false,
  	\`profile_settings_commission_info\` text,
  	\`created_timestamp\` text,
  	\`modified_timestamp\` text,
  	\`last_active\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`profile_media_avatar_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`profile_media_banner_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`creator_profiles_user_idx\` ON \`creator_profiles\` (\`user_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`creator_profiles_username_idx\` ON \`creator_profiles\` (\`username\`);`)
  await db.run(sql`CREATE INDEX \`creator_profiles_profile_media_profile_media_avatar_idx\` ON \`creator_profiles\` (\`profile_media_avatar_id\`);`)
  await db.run(sql`CREATE INDEX \`creator_profiles_profile_media_profile_media_banner_imag_idx\` ON \`creator_profiles\` (\`profile_media_banner_image_id\`);`)
  await db.run(sql`CREATE INDEX \`creator_profiles_updated_at_idx\` ON \`creator_profiles\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`creator_profiles_created_at_idx\` ON \`creator_profiles\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`creator_profiles_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`bot_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`creator_profiles\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`bot_id\`) REFERENCES \`bot\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`creator_profiles_rels_order_idx\` ON \`creator_profiles_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`creator_profiles_rels_parent_idx\` ON \`creator_profiles_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`creator_profiles_rels_path_idx\` ON \`creator_profiles_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`creator_profiles_rels_bot_id_idx\` ON \`creator_profiles_rels\` (\`bot_id\`);`)
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
  await db.run(sql`CREATE TABLE \`access_control_tags\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`tag\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`access_control\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`access_control_tags_order_idx\` ON \`access_control_tags\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`access_control_tags_parent_id_idx\` ON \`access_control_tags\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`access_control\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`resource_type\` text NOT NULL,
  	\`resource_id\` text NOT NULL,
  	\`resource_title\` text,
  	\`permission_type\` text NOT NULL,
  	\`permission_scope\` text DEFAULT 'full',
  	\`user_id\` integer NOT NULL,
  	\`granted_by_id\` integer NOT NULL,
  	\`granted_reason\` text,
  	\`grant_method\` text DEFAULT 'direct-share',
  	\`created_timestamp\` text,
  	\`last_used\` text,
  	\`expiration_date\` text,
  	\`access_count\` numeric DEFAULT 0,
  	\`is_revoked\` integer DEFAULT false,
  	\`revoked_by_id\` integer,
  	\`revoked_reason\` text,
  	\`revoked_timestamp\` text,
  	\`notify_on_access\` integer DEFAULT true,
  	\`conditions\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`granted_by_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`revoked_by_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`access_control_user_idx\` ON \`access_control\` (\`user_id\`);`)
  await db.run(sql`CREATE INDEX \`access_control_granted_by_idx\` ON \`access_control\` (\`granted_by_id\`);`)
  await db.run(sql`CREATE INDEX \`access_control_revoked_by_idx\` ON \`access_control\` (\`revoked_by_id\`);`)
  await db.run(sql`CREATE INDEX \`access_control_updated_at_idx\` ON \`access_control\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`access_control_created_at_idx\` ON \`access_control\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`self_moderation\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`user_id\` integer NOT NULL,
  	\`daily_usage_limit\` numeric DEFAULT 60,
  	\`weekly_usage_limit\` numeric DEFAULT 420,
  	\`break_reminder_interval\` numeric DEFAULT 25,
  	\`healthy_habits_enable_break_reminders\` integer DEFAULT true,
  	\`healthy_habits_enable_usage_tracking\` integer DEFAULT true,
  	\`healthy_habits_enable_mood_checkins\` integer DEFAULT true,
  	\`healthy_habits_night_mode_hours_enabled\` integer DEFAULT false,
  	\`healthy_habits_night_mode_hours_start_hour\` numeric DEFAULT 22,
  	\`healthy_habits_night_mode_hours_end_hour\` numeric DEFAULT 8,
  	\`healthy_habits_mindfulness_breaks\` integer DEFAULT false,
  	\`intervention_triggers_excessive_daily_usage\` integer DEFAULT true,
  	\`intervention_triggers_late_night_usage\` integer DEFAULT true,
  	\`intervention_triggers_consecutive_days_overuse\` numeric DEFAULT 2,
  	\`intervention_triggers_declining_mood_trend\` integer DEFAULT true,
  	\`progress_tracking_total_usage_minutes_today\` numeric DEFAULT 0,
  	\`progress_tracking_total_usage_minutes_week\` numeric DEFAULT 0,
  	\`progress_tracking_last_reset_date\` text,
  	\`progress_tracking_consecutive_healthy_days\` numeric DEFAULT 0,
  	\`progress_tracking_last_break_time\` text,
  	\`progress_tracking_mood_entries_count_week\` numeric DEFAULT 0,
  	\`last_checkin\` text,
  	\`is_active\` integer DEFAULT true,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`self_moderation_user_idx\` ON \`self_moderation\` (\`user_id\`);`)
  await db.run(sql`CREATE INDEX \`self_moderation_updated_at_idx\` ON \`self_moderation\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`self_moderation_created_at_idx\` ON \`self_moderation\` (\`created_at\`);`)
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
  await db.run(sql`CREATE TABLE \`usage_analytics\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`user_id\` integer NOT NULL,
  	\`timestamp\` text NOT NULL,
  	\`session_id\` text,
  	\`event_type\` text NOT NULL,
  	\`event_category\` text NOT NULL,
  	\`resource_details_bot_id_id\` integer,
  	\`resource_details_conversation_id_id\` integer,
  	\`resource_details_persona_id_id\` integer,
  	\`resource_details_page_url\` text,
  	\`resource_details_action_target\` text,
  	\`performance_metrics_response_time_ms\` numeric,
  	\`performance_metrics_load_time_ms\` numeric,
  	\`performance_metrics_duration_seconds\` numeric,
  	\`performance_metrics_error_occurred\` integer DEFAULT false,
  	\`performance_metrics_error_message\` text,
  	\`context_data_user_agent\` text,
  	\`context_data_device_type\` text,
  	\`context_data_browser\` text,
  	\`context_data_operating_system\` text,
  	\`context_data_screen_resolution\` text,
  	\`context_data_referrer\` text,
  	\`context_data_ip_address\` text,
  	\`custom_properties_metadata\` text,
  	\`custom_properties_tags\` text,
  	\`custom_properties_importance_level\` text DEFAULT 'normal',
  	\`aggregation_ready\` integer DEFAULT true,
  	\`processed_for_aggregation\` integer DEFAULT false,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`resource_details_bot_id_id\`) REFERENCES \`bot\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`resource_details_conversation_id_id\`) REFERENCES \`conversation\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`resource_details_persona_id_id\`) REFERENCES \`personas\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`usage_analytics_user_idx\` ON \`usage_analytics\` (\`user_id\`);`)
  await db.run(sql`CREATE INDEX \`usage_analytics_resource_details_resource_details_bot_id_idx\` ON \`usage_analytics\` (\`resource_details_bot_id_id\`);`)
  await db.run(sql`CREATE INDEX \`usage_analytics_resource_details_resource_details_conver_idx\` ON \`usage_analytics\` (\`resource_details_conversation_id_id\`);`)
  await db.run(sql`CREATE INDEX \`usage_analytics_resource_details_resource_details_person_idx\` ON \`usage_analytics\` (\`resource_details_persona_id_id\`);`)
  await db.run(sql`CREATE INDEX \`usage_analytics_updated_at_idx\` ON \`usage_analytics\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`usage_analytics_created_at_idx\` ON \`usage_analytics\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`memory_insights\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`user_id\` integer NOT NULL,
  	\`bot_id\` integer NOT NULL,
  	\`conversation_id\` integer,
  	\`period\` text NOT NULL,
  	\`start_date\` text NOT NULL,
  	\`end_date\` text NOT NULL,
  	\`total_memories_created\` numeric DEFAULT 0,
  	\`total_memories_accessed\` numeric DEFAULT 0,
  	\`memory_recall_accuracy\` numeric,
  	\`context_relevance_score\` numeric,
  	\`story_continuity_score\` numeric,
  	\`episodic_memories\` numeric DEFAULT 0,
  	\`semantic_memories\` numeric DEFAULT 0,
  	\`procedural_memories\` numeric DEFAULT 0,
  	\`emotional_memories\` numeric DEFAULT 0,
  	\`total_conversations\` numeric DEFAULT 0,
  	\`avg_conversation_length\` numeric,
  	\`topic_diversity_score\` numeric,
  	\`sentiment_trend\` text,
  	\`learning_velocity\` numeric,
  	\`retention_rate\` numeric,
  	\`pattern_accuracy\` numeric,
  	\`adaptation_score\` numeric,
  	\`access_speed_ms\` numeric,
  	\`search_accuracy\` numeric,
  	\`confidence_score\` numeric,
  	\`key_insights\` text,
  	\`suggestions\` text,
  	\`anomaly_flags\` text,
  	\`analysis_version\` text DEFAULT '1.0',
  	\`data_points\` numeric DEFAULT 0,
  	\`processing_time_ms\` numeric,
  	\`confidence_level\` numeric,
  	\`generated_at\` text,
  	\`is_automated\` integer DEFAULT true,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`bot_id\`) REFERENCES \`bot\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`conversation_id\`) REFERENCES \`conversation\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`memory_insights_user_idx\` ON \`memory_insights\` (\`user_id\`);`)
  await db.run(sql`CREATE INDEX \`memory_insights_bot_idx\` ON \`memory_insights\` (\`bot_id\`);`)
  await db.run(sql`CREATE INDEX \`memory_insights_conversation_idx\` ON \`memory_insights\` (\`conversation_id\`);`)
  await db.run(sql`CREATE INDEX \`memory_insights_updated_at_idx\` ON \`memory_insights\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`memory_insights_created_at_idx\` ON \`memory_insights\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`persona_analytics\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`user_id\` integer NOT NULL,
  	\`persona_id\` integer NOT NULL,
  	\`bot_id\` integer NOT NULL,
  	\`analysis_period\` text NOT NULL,
  	\`period_start_date\` text NOT NULL,
  	\`period_end_date\` text NOT NULL,
  	\`usage_metrics_total_interactions\` numeric DEFAULT 0,
  	\`usage_metrics_total_conversation_time_minutes\` numeric DEFAULT 0,
  	\`usage_metrics_average_session_duration_minutes\` numeric,
  	\`usage_metrics_interaction_frequency\` numeric,
  	\`usage_metrics_return_user_rate_percentage\` numeric,
  	\`usage_metrics_unique_users_count\` numeric DEFAULT 0,
  	\`engagement_metrics_message_response_rate\` numeric,
  	\`engagement_metrics_average_conversation_length\` numeric,
  	\`engagement_metrics_conversation_completion_rate\` numeric,
  	\`engagement_metrics_user_satisfaction_score\` numeric,
  	\`engagement_metrics_persona_switch_rate\` numeric,
  	\`engagement_metrics_repeat_interaction_rate\` numeric,
  	\`persona_effectiveness_persona_consistency_score\` numeric,
  	\`persona_effectiveness_persona_relevance_score\` numeric,
  	\`persona_effectiveness_persona_creativity_score\` numeric,
  	\`persona_effectiveness_persona_engagement_score\` numeric,
  	\`persona_effectiveness_persona_helpfulness_score\` numeric,
  	\`persona_effectiveness_persona_appropriateness_score\` numeric,
  	\`conversation_quality_response_relevance_percentage\` numeric,
  	\`conversation_quality_response_accuracy_percentage\` numeric,
  	\`conversation_quality_response_completeness_score\` numeric,
  	\`conversation_quality_conversation_flow_score\` numeric,
  	\`conversation_quality_context_understanding_score\` numeric,
  	\`conversation_quality_emotional_intelligence_score\` numeric,
  	\`user_feedback_positive_feedback_count\` numeric DEFAULT 0,
  	\`user_feedback_negative_feedback_count\` numeric DEFAULT 0,
  	\`user_feedback_neutral_feedback_count\` numeric DEFAULT 0,
  	\`user_feedback_user_suggestions_count\` numeric DEFAULT 0,
  	\`user_feedback_common_praise_topics\` text,
  	\`user_feedback_common_criticism_topics\` text,
  	\`user_feedback_improvement_requests\` text,
  	\`technical_performance_average_response_time_ms\` numeric,
  	\`technical_performance_error_rate_percentage\` numeric,
  	\`technical_performance_timeout_rate_percentage\` numeric,
  	\`technical_performance_system_resource_usage_score\` numeric,
  	\`technical_performance_availability_percentage\` numeric,
  	\`comparison_metrics_ranking_among_personas\` numeric,
  	\`comparison_metrics_usage_percentage_of_total\` numeric,
  	\`comparison_metrics_performance_vs_average\` numeric,
  	\`comparison_metrics_unique_strengths\` text,
  	\`comparison_metrics_areas_for_improvement\` text,
  	\`insights_and_recommendations_key_insights\` text,
  	\`insights_and_recommendations_optimization_suggestions\` text,
  	\`insights_and_recommendations_training_recommendations\` text,
  	\`insights_and_recommendations_feature_requests\` text,
  	\`insights_and_recommendations_anomaly_flags\` text,
  	\`analysis_metadata_analysis_version\` text DEFAULT '1.0',
  	\`analysis_metadata_data_points_analyzed\` numeric DEFAULT 0,
  	\`analysis_metadata_processing_time_ms\` numeric,
  	\`analysis_metadata_confidence_level\` numeric,
  	\`analysis_metadata_last_updated\` text,
  	\`generated_at\` text,
  	\`is_automated_analysis\` integer DEFAULT true,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`persona_id\`) REFERENCES \`personas\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`bot_id\`) REFERENCES \`bot\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`persona_analytics_user_idx\` ON \`persona_analytics\` (\`user_id\`);`)
  await db.run(sql`CREATE INDEX \`persona_analytics_persona_idx\` ON \`persona_analytics\` (\`persona_id\`);`)
  await db.run(sql`CREATE INDEX \`persona_analytics_bot_idx\` ON \`persona_analytics\` (\`bot_id\`);`)
  await db.run(sql`CREATE INDEX \`persona_analytics_updated_at_idx\` ON \`persona_analytics\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`persona_analytics_created_at_idx\` ON \`persona_analytics\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`legal_documents_tags\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`tag\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`legal_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`legal_documents_tags_order_idx\` ON \`legal_documents_tags\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`legal_documents_tags_parent_id_idx\` ON \`legal_documents_tags\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`legal_documents\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`document_type\` text NOT NULL,
  	\`version\` text DEFAULT '1.0' NOT NULL,
  	\`content\` text NOT NULL,
  	\`effective_date\` text NOT NULL,
  	\`expiry_date\` text,
  	\`language\` text DEFAULT 'en' NOT NULL,
  	\`status\` text DEFAULT 'draft' NOT NULL,
  	\`creator_id\` integer,
  	\`created_by_id\` integer NOT NULL,
  	\`last_modified\` text,
  	\`summary\` text,
  	\`is_global\` integer DEFAULT false,
  	\`consent_required\` integer DEFAULT false,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`creator_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`created_by_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`legal_documents_title_idx\` ON \`legal_documents\` (\`title\`);`)
  await db.run(sql`CREATE INDEX \`legal_documents_creator_idx\` ON \`legal_documents\` (\`creator_id\`);`)
  await db.run(sql`CREATE INDEX \`legal_documents_created_by_idx\` ON \`legal_documents\` (\`created_by_id\`);`)
  await db.run(sql`CREATE INDEX \`legal_documents_updated_at_idx\` ON \`legal_documents\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`legal_documents_created_at_idx\` ON \`legal_documents\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`legal_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`media_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`legal_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`legal_documents_rels_order_idx\` ON \`legal_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`legal_documents_rels_parent_idx\` ON \`legal_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`legal_documents_rels_path_idx\` ON \`legal_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`legal_documents_rels_media_id_idx\` ON \`legal_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE TABLE \`user_agreements\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`user_id\` integer NOT NULL,
  	\`accepted_at\` text NOT NULL,
  	\`revoked_at\` text,
  	\`status\` text DEFAULT 'accepted' NOT NULL,
  	\`ip_address\` text,
  	\`user_agent\` text,
  	\`creator_id\` integer,
  	\`session_id\` text,
  	\`consent_method\` text DEFAULT 'explicit' NOT NULL,
  	\`version\` text NOT NULL,
  	\`notes\` text,
  	\`is_active\` integer DEFAULT true,
  	\`agreement_type\` text DEFAULT 'general' NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`creator_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`user_agreements_user_idx\` ON \`user_agreements\` (\`user_id\`);`)
  await db.run(sql`CREATE INDEX \`user_agreements_creator_idx\` ON \`user_agreements\` (\`creator_id\`);`)
  await db.run(sql`CREATE INDEX \`user_agreements_updated_at_idx\` ON \`user_agreements\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`user_agreements_created_at_idx\` ON \`user_agreements\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`user_agreements_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	\`legal_documents_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`user_agreements\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`legal_documents_id\`) REFERENCES \`legal_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`user_agreements_rels_order_idx\` ON \`user_agreements_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`user_agreements_rels_parent_idx\` ON \`user_agreements_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`user_agreements_rels_path_idx\` ON \`user_agreements_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`user_agreements_rels_users_id_idx\` ON \`user_agreements_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`user_agreements_rels_legal_documents_id_idx\` ON \`user_agreements_rels\` (\`legal_documents_id\`);`)
  await db.run(sql`CREATE TABLE \`documentation_tags\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`tag\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`documentation\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`documentation_tags_order_idx\` ON \`documentation_tags\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`documentation_tags_parent_id_idx\` ON \`documentation_tags\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`documentation\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`content\` text NOT NULL,
  	\`category\` text NOT NULL,
  	\`subcategory\` text,
  	\`slug\` text NOT NULL,
  	\`language\` text DEFAULT 'en' NOT NULL,
  	\`is_published\` integer DEFAULT false,
  	\`creator_id\` integer,
  	\`last_updated\` text,
  	\`view_count\` numeric DEFAULT 0,
  	\`difficulty_level\` text DEFAULT 'beginner' NOT NULL,
  	\`estimated_read_time\` numeric,
  	\`is_featured\` integer DEFAULT false,
  	\`sort_order\` numeric DEFAULT 0,
  	\`meta_title\` text,
  	\`meta_description\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`creator_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`documentation_slug_idx\` ON \`documentation\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`documentation_creator_idx\` ON \`documentation\` (\`creator_id\`);`)
  await db.run(sql`CREATE INDEX \`documentation_updated_at_idx\` ON \`documentation\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`documentation_created_at_idx\` ON \`documentation\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`documentation_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`media_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`documentation\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`documentation_rels_order_idx\` ON \`documentation_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`documentation_rels_parent_idx\` ON \`documentation_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`documentation_rels_path_idx\` ON \`documentation_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`documentation_rels_media_id_idx\` ON \`documentation_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE TABLE \`tutorials_steps\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`step_number\` numeric NOT NULL,
  	\`title\` text NOT NULL,
  	\`content\` text NOT NULL,
  	\`code_example\` text,
  	\`time_estimate\` numeric,
  	\`is_optional\` integer DEFAULT false,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`tutorials\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`tutorials_steps_order_idx\` ON \`tutorials_steps\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`tutorials_steps_parent_id_idx\` ON \`tutorials_steps\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`tutorials_tags\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`tag\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`tutorials\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`tutorials_tags_order_idx\` ON \`tutorials_tags\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`tutorials_tags_parent_id_idx\` ON \`tutorials_tags\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`tutorials_prerequisites\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`prerequisite\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`tutorials\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`tutorials_prerequisites_order_idx\` ON \`tutorials_prerequisites\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`tutorials_prerequisites_parent_id_idx\` ON \`tutorials_prerequisites\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`tutorials_learning_objectives\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`objective\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`tutorials\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`tutorials_learning_objectives_order_idx\` ON \`tutorials_learning_objectives\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`tutorials_learning_objectives_parent_id_idx\` ON \`tutorials_learning_objectives\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`tutorials_resources\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`resource_name\` text NOT NULL,
  	\`resource_url\` text NOT NULL,
  	\`resource_type\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`tutorials\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`tutorials_resources_order_idx\` ON \`tutorials_resources\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`tutorials_resources_parent_id_idx\` ON \`tutorials_resources\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`tutorials\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`description\` text NOT NULL,
  	\`difficulty\` text DEFAULT 'beginner' NOT NULL,
  	\`estimated_time\` numeric NOT NULL,
  	\`creator_id\` integer,
  	\`is_published\` integer DEFAULT false,
  	\`completion_count\` numeric DEFAULT 0,
  	\`category\` text NOT NULL,
  	\`rating\` numeric DEFAULT 0,
  	\`review_count\` numeric DEFAULT 0,
  	\`last_updated\` text,
  	\`is_featured\` integer DEFAULT false,
  	\`sort_order\` numeric DEFAULT 0,
  	\`language\` text DEFAULT 'en' NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`creator_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`tutorials_creator_idx\` ON \`tutorials\` (\`creator_id\`);`)
  await db.run(sql`CREATE INDEX \`tutorials_updated_at_idx\` ON \`tutorials\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`tutorials_created_at_idx\` ON \`tutorials\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`tutorials_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`media_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`tutorials\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`tutorials_rels_order_idx\` ON \`tutorials_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`tutorials_rels_parent_idx\` ON \`tutorials_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`tutorials_rels_path_idx\` ON \`tutorials_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`tutorials_rels_media_id_idx\` ON \`tutorials_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE TABLE \`support_tickets_messages\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`message_id\` text NOT NULL,
  	\`sender_id\` integer NOT NULL,
  	\`content\` text NOT NULL,
  	\`timestamp\` text,
  	\`is_internal\` integer DEFAULT false,
  	FOREIGN KEY (\`sender_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`support_tickets\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`support_tickets_messages_order_idx\` ON \`support_tickets_messages\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`support_tickets_messages_parent_id_idx\` ON \`support_tickets_messages\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`support_tickets_messages_sender_idx\` ON \`support_tickets_messages\` (\`sender_id\`);`)
  await db.run(sql`CREATE TABLE \`support_tickets_tags\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`tag\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`support_tickets\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`support_tickets_tags_order_idx\` ON \`support_tickets_tags\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`support_tickets_tags_parent_id_idx\` ON \`support_tickets_tags\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`support_tickets\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`description\` text NOT NULL,
  	\`category\` text NOT NULL,
  	\`priority\` text DEFAULT 'medium' NOT NULL,
  	\`status\` text DEFAULT 'open' NOT NULL,
  	\`creator_id\` integer,
  	\`user_id\` integer NOT NULL,
  	\`assigned_to_id\` integer,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`resolved_at\` text,
  	\`user_agent\` text,
  	\`ip_address\` text,
  	\`satisfaction_rating\` numeric,
  	\`feedback\` text,
  	\`estimated_resolution_time\` numeric,
  	\`actual_resolution_time\` numeric,
  	\`escalation_level\` text DEFAULT '1' NOT NULL,
  	\`follow_up_required\` integer DEFAULT false,
  	\`follow_up_date\` text,
  	\`resolution\` text,
  	\`resolution_method\` text,
  	\`is_escalated\` integer DEFAULT false,
  	\`escalation_reason\` text,
  	\`internal_notes\` text,
  	FOREIGN KEY (\`creator_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`assigned_to_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`support_tickets_creator_idx\` ON \`support_tickets\` (\`creator_id\`);`)
  await db.run(sql`CREATE INDEX \`support_tickets_user_idx\` ON \`support_tickets\` (\`user_id\`);`)
  await db.run(sql`CREATE INDEX \`support_tickets_assigned_to_idx\` ON \`support_tickets\` (\`assigned_to_id\`);`)
  await db.run(sql`CREATE TABLE \`support_tickets_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`media_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`support_tickets\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`support_tickets_rels_order_idx\` ON \`support_tickets_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`support_tickets_rels_parent_idx\` ON \`support_tickets_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`support_tickets_rels_path_idx\` ON \`support_tickets_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`support_tickets_rels_media_id_idx\` ON \`support_tickets_rels\` (\`media_id\`);`)
  await db.run(sql`DROP TABLE \`conversation_rels\`;`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`avatar_id\` integer REFERENCES media(id);`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`name\` text;`)
  await db.run(sql`CREATE INDEX \`users_avatar_idx\` ON \`users\` (\`avatar_id\`);`)
  await db.run(sql`ALTER TABLE \`bot\` ADD \`likes_count\` numeric DEFAULT 0;`)
  await db.run(sql`ALTER TABLE \`bot\` ADD \`favorites_count\` numeric DEFAULT 0;`)
  await db.run(sql`ALTER TABLE \`bot\` ADD \`creator_display_name\` text NOT NULL;`)
  await db.run(sql`ALTER TABLE \`api_key\` ADD \`key_configuration_rate_limits_requests_per_hour\` numeric;`)
  await db.run(sql`ALTER TABLE \`api_key\` ADD \`key_configuration_rate_limits_tokens_per_minute\` numeric;`)
  await db.run(sql`ALTER TABLE \`api_key\` ADD \`key_configuration_usage_tracking_monthly_quota\` numeric;`)
  await db.run(sql`ALTER TABLE \`api_key\` ADD \`key_configuration_usage_tracking_daily_limit\` numeric;`)
  await db.run(sql`ALTER TABLE \`api_key\` ADD \`usage_analytics_total_requests\` numeric DEFAULT 0;`)
  await db.run(sql`ALTER TABLE \`api_key\` ADD \`usage_analytics_total_tokens_used\` numeric DEFAULT 0;`)
  await db.run(sql`ALTER TABLE \`api_key\` ADD \`usage_analytics_monthly_usage\` text;`)
  await db.run(sql`ALTER TABLE \`api_key\` ADD \`usage_analytics_average_response_time\` numeric DEFAULT 0;`)
  await db.run(sql`ALTER TABLE \`api_key\` ADD \`usage_analytics_error_rate\` numeric DEFAULT 0;`)
  await db.run(sql`ALTER TABLE \`api_key\` ADD \`security_features_key_encryption_level\` text DEFAULT 'basic';`)
  await db.run(sql`ALTER TABLE \`api_key\` ADD \`security_features_auto_rotation_enabled\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`api_key\` ADD \`security_features_rotation_schedule\` text;`)
  await db.run(sql`ALTER TABLE \`api_key\` ADD \`security_features_last_rotation_date\` text;`)
  await db.run(sql`ALTER TABLE \`api_key\` ADD \`security_features_key_expiry_date\` text;`)
  await db.run(sql`ALTER TABLE \`api_key\` ADD \`security_features_is_active\` integer DEFAULT true;`)
  await db.run(sql`ALTER TABLE \`api_key\` ADD \`security_features_last_used\` text;`)
  await db.run(sql`ALTER TABLE \`api_key\` ADD \`provider_specific_settings_openai_settings_organization_id\` text;`)
  await db.run(sql`ALTER TABLE \`api_key\` ADD \`provider_specific_settings_openai_settings_project_id\` text;`)
  await db.run(sql`ALTER TABLE \`api_key\` ADD \`provider_specific_settings_anthropic_settings_account_preferences\` text;`)
  await db.run(sql`ALTER TABLE \`api_key\` ADD \`provider_specific_settings_google_settings_project_configuration\` text;`)
  await db.run(sql`ALTER TABLE \`api_key\` ADD \`provider_specific_settings_custom_settings_configuration\` text;`)
  await db.run(sql`ALTER TABLE \`api_key\` ADD \`provider_specific_settings_custom_settings_api_endpoint\` text;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`is_legacy_memory\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`source_memory_id_id\` integer REFERENCES memory(id);`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`source_conversation_id_id\` integer REFERENCES conversation(id);`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`original_participants\` text;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`memory_date_range\` text;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`is_vectorized\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`chunk_count\` numeric DEFAULT 0;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`r2_file_key\` text;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`privacy_settings_privacy_level\` text DEFAULT 'private' NOT NULL;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`privacy_settings_allow_sharing\` integer DEFAULT true;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`privacy_settings_share_expiration\` text;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`privacy_settings_password_protected\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`privacy_settings_share_password\` text;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`privacy_settings_access_count\` numeric DEFAULT 0;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`privacy_settings_last_accessed\` text;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`shared_access_shared_by_user_id\` numeric;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`shared_access_shared_at\` text;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`shared_access_sharing_notes\` text;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`content_metadata_source_url\` text;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`content_metadata_author\` text;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`content_metadata_language\` text;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`content_metadata_word_count\` numeric;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`content_metadata_reading_time_minutes\` numeric;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`content_metadata_content_hash\` text;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`content_metadata_processing_status\` text DEFAULT 'pending';`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`usage_analytics_view_count\` numeric DEFAULT 0;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`usage_analytics_search_count\` numeric DEFAULT 0;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`usage_analytics_count\` numeric DEFAULT 0;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`usage_analytics_last_searched\` text;`)
  await db.run(sql`ALTER TABLE \`knowledge\` ADD \`usage_analytics_popularity_score\` numeric DEFAULT 0;`)
  await db.run(sql`CREATE INDEX \`knowledge_source_memory_id_idx\` ON \`knowledge\` (\`source_memory_id_id\`);`)
  await db.run(sql`CREATE INDEX \`knowledge_source_conversation_id_idx\` ON \`knowledge\` (\`source_conversation_id_id\`);`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` ADD \`sharing_settings_sharing_level\` text DEFAULT 'private' NOT NULL;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` ADD \`sharing_settings_allow_collaboration\` integer DEFAULT true;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` ADD \`sharing_settings_allow_fork\` integer DEFAULT true;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` ADD \`sharing_settings_sharing_expiration\` text;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` ADD \`sharing_settings_share_password\` text;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` ADD \`sharing_settings_collaboration_requests\` integer DEFAULT true;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` ADD \`sharing_settings_knowledge_count\` numeric DEFAULT 0;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` ADD \`sharing_settings_last_updated\` text;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` ADD \`sharing_settings_is_public\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` ADD \`collaborators_invited_by_user\` numeric;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` ADD \`collaborators_invited_at\` text;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` ADD \`collaborators_collab_notes\` text;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` ADD \`collection_metadata_total_size_bytes\` numeric DEFAULT 0;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` ADD \`collection_metadata_total_words\` numeric DEFAULT 0;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` ADD \`collection_metadata_average_quality_score\` numeric DEFAULT 0;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` ADD \`collection_metadata_collection_category\` text;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` ADD \`collection_metadata_difficulty_level\` text DEFAULT 'intermediate';`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` ADD \`collection_metadata_language\` text DEFAULT 'en';`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` ADD \`usage_analytics_view_count\` numeric DEFAULT 0;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` ADD \`usage_analytics_fork_count\` numeric DEFAULT 0;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` ADD \`usage_analytics_collaboration_count\` numeric DEFAULT 0;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` ADD \`usage_analytics_last_viewed\` text;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` ADD \`usage_analytics_popularity_score\` numeric DEFAULT 0;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` ADD \`usage_analytics_rating\` numeric DEFAULT 0;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` ADD \`usage_analytics_review_count\` numeric DEFAULT 0;`)
  await db.run(sql`ALTER TABLE \`conversation\` ADD \`conversation_type\` text DEFAULT 'single-bot' NOT NULL;`)
  await db.run(sql`ALTER TABLE \`conversation\` ADD \`participants\` text;`)
  await db.run(sql`ALTER TABLE \`conversation\` ADD \`total_tokens\` numeric DEFAULT 0;`)
  await db.run(sql`ALTER TABLE \`conversation\` ADD \`last_summarized_at\` text;`)
  await db.run(sql`ALTER TABLE \`conversation\` ADD \`last_summarized_message_index\` numeric;`)
  await db.run(sql`ALTER TABLE \`conversation\` ADD \`requires_summarization\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`conversation\` ADD \`conversation_metadata_total_messages\` numeric DEFAULT 0;`)
  await db.run(sql`ALTER TABLE \`conversation\` ADD \`conversation_metadata_participant_count\` numeric DEFAULT 1;`)
  await db.run(sql`ALTER TABLE \`conversation\` ADD \`conversation_metadata_last_activity\` text;`)
  await db.run(sql`ALTER TABLE \`conversation\` ADD \`conversation_metadata_conversation_summary\` text;`)
  await db.run(sql`ALTER TABLE \`conversation\` ADD \`status\` text DEFAULT 'active' NOT NULL;`)
  await db.run(sql`ALTER TABLE \`conversation\` ADD \`conversation_settings_allow_file_sharing\` integer DEFAULT true;`)
  await db.run(sql`ALTER TABLE \`conversation\` ADD \`conversation_settings_message_retention_days\` numeric DEFAULT 365;`)
  await db.run(sql`ALTER TABLE \`conversation\` ADD \`conversation_settings_auto_save_conversations\` integer DEFAULT true;`)
  await db.run(sql`ALTER TABLE \`message\` ADD \`message_type\` text DEFAULT 'text' NOT NULL;`)
  await db.run(sql`ALTER TABLE \`message\` ADD \`message_attribution_source_bot_id_id\` integer REFERENCES bot(id);`)
  await db.run(sql`ALTER TABLE \`message\` ADD \`message_attribution_is_ai_generated\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`message\` ADD \`message_attribution_model_used\` text;`)
  await db.run(sql`ALTER TABLE \`message\` ADD \`message_attribution_confidence_score\` numeric;`)
  await db.run(sql`ALTER TABLE \`message\` ADD \`message_content_text_content\` text;`)
  await db.run(sql`ALTER TABLE \`message\` ADD \`message_content_reactions\` text;`)
  await db.run(sql`ALTER TABLE \`message\` ADD \`message_thread_reply_to_id_id\` integer REFERENCES message(id);`)
  await db.run(sql`ALTER TABLE \`message\` ADD \`message_thread_thread_depth\` numeric DEFAULT 0;`)
  await db.run(sql`ALTER TABLE \`message\` ADD \`message_thread_is_thread_parent\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`message\` ADD \`token_tracking_input_tokens\` numeric DEFAULT 0;`)
  await db.run(sql`ALTER TABLE \`message\` ADD \`token_tracking_output_tokens\` numeric DEFAULT 0;`)
  await db.run(sql`ALTER TABLE \`message\` ADD \`token_tracking_total_tokens\` numeric DEFAULT 0;`)
  await db.run(sql`ALTER TABLE \`message\` ADD \`token_tracking_cost_estimate\` numeric DEFAULT 0;`)
  await db.run(sql`ALTER TABLE \`message\` ADD \`message_status_delivery_status\` text DEFAULT 'sent';`)
  await db.run(sql`ALTER TABLE \`message\` ADD \`message_status_is_edited\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`message\` ADD \`message_status_edited_at\` text;`)
  await db.run(sql`ALTER TABLE \`message\` ADD \`metadata_processing_time_ms\` numeric;`)
  await db.run(sql`ALTER TABLE \`message\` ADD \`metadata_priority_level\` text DEFAULT 'normal';`)
  await db.run(sql`ALTER TABLE \`message\` ADD \`metadata_sensitivity_level\` text DEFAULT 'private';`)
  await db.run(sql`CREATE INDEX \`message_message_attribution_message_attribution_source_b_idx\` ON \`message\` (\`message_attribution_source_bot_id_id\`);`)
  await db.run(sql`CREATE INDEX \`message_message_thread_message_thread_reply_to_id_idx\` ON \`message\` (\`message_thread_reply_to_id_id\`);`)
  await db.run(sql`ALTER TABLE \`message\` DROP COLUMN \`tokens\`;`)
  await db.run(sql`ALTER TABLE \`memory\` ADD \`type\` text DEFAULT 'short_term';`)
  await db.run(sql`ALTER TABLE \`memory\` ADD \`participants\` text;`)
  await db.run(sql`ALTER TABLE \`memory\` ADD \`is_vectorized\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`memory\` ADD \`converted_to_lore\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`memory\` ADD \`lore_entry_id\` integer REFERENCES knowledge(id);`)
  await db.run(sql`ALTER TABLE \`memory\` ADD \`converted_at\` text;`)
  await db.run(sql`ALTER TABLE \`memory\` ADD \`importance\` numeric DEFAULT 5;`)
  await db.run(sql`ALTER TABLE \`memory\` ADD \`emotional_context\` text;`)
  await db.run(sql`CREATE INDEX \`memory_lore_entry_idx\` ON \`memory\` (\`lore_entry_id\`);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`bot_interactions_id\` integer REFERENCES bot_interactions(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`vector_records_id\` integer REFERENCES vector_records(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`personas_id\` integer REFERENCES personas(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`creator_profiles_id\` integer REFERENCES creator_profiles(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`creator_programs_id\` integer REFERENCES creator_programs(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`access_control_id\` integer REFERENCES access_control(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`self_moderation_id\` integer REFERENCES self_moderation(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`crisis_support_id\` integer REFERENCES crisis_support(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`usage_analytics_id\` integer REFERENCES usage_analytics(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`memory_insights_id\` integer REFERENCES memory_insights(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`persona_analytics_id\` integer REFERENCES persona_analytics(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`legal_documents_id\` integer REFERENCES legal_documents(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`user_agreements_id\` integer REFERENCES user_agreements(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`documentation_id\` integer REFERENCES documentation(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`tutorials_id\` integer REFERENCES tutorials(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`support_tickets_id\` integer REFERENCES support_tickets(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_bot_interactions_id_idx\` ON \`payload_locked_documents_rels\` (\`bot_interactions_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_vector_records_id_idx\` ON \`payload_locked_documents_rels\` (\`vector_records_id\`);`)
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
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`conversation_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`bot_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`conversation\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`bot_id\`) REFERENCES \`bot\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`conversation_rels_order_idx\` ON \`conversation_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`conversation_rels_parent_idx\` ON \`conversation_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`conversation_rels_path_idx\` ON \`conversation_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`conversation_rels_bot_id_idx\` ON \`conversation_rels\` (\`bot_id\`);`)
  await db.run(sql`DROP TABLE \`bot_interactions\`;`)
  await db.run(sql`DROP TABLE \`api_key_key_configuration_model_preferences\`;`)
  await db.run(sql`DROP TABLE \`api_key_key_configuration_fallback_providers\`;`)
  await db.run(sql`DROP TABLE \`knowledge_shared_access_shared_with_user_ids\`;`)
  await db.run(sql`DROP TABLE \`knowledge_shared_access_permissions\`;`)
  await db.run(sql`DROP TABLE \`knowledge_rels\`;`)
  await db.run(sql`DROP TABLE \`knowledge_collections_collaborators_collab_user_ids\`;`)
  await db.run(sql`DROP TABLE \`knowledge_collections_collaborators_collab_perms\`;`)
  await db.run(sql`DROP TABLE \`knowledge_collections_collection_metadata_tags\`;`)
  await db.run(sql`DROP TABLE \`conversation_bot_participation\`;`)
  await db.run(sql`DROP TABLE \`conversation_conversation_metadata_tags\`;`)
  await db.run(sql`DROP TABLE \`message_message_content_code_snippets\`;`)
  await db.run(sql`DROP TABLE \`message_message_status_edit_history\`;`)
  await db.run(sql`DROP TABLE \`message_rels\`;`)
  await db.run(sql`DROP TABLE \`memory_rels\`;`)
  await db.run(sql`DROP TABLE \`vector_records\`;`)
  await db.run(sql`DROP TABLE \`personas_interaction_preferences_preferred_topics\`;`)
  await db.run(sql`DROP TABLE \`personas_interaction_preferences_avoid_topics\`;`)
  await db.run(sql`DROP TABLE \`personas_interaction_preferences_signature_phrases\`;`)
  await db.run(sql`DROP TABLE \`personas_tags\`;`)
  await db.run(sql`DROP TABLE \`personas\`;`)
  await db.run(sql`DROP TABLE \`creator_profiles_social_links_other_links\`;`)
  await db.run(sql`DROP TABLE \`creator_profiles_creator_info_specialties\`;`)
  await db.run(sql`DROP TABLE \`creator_profiles_creator_info_languages\`;`)
  await db.run(sql`DROP TABLE \`creator_profiles_tags\`;`)
  await db.run(sql`DROP TABLE \`creator_profiles\`;`)
  await db.run(sql`DROP TABLE \`creator_profiles_rels\`;`)
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
  await db.run(sql`DROP TABLE \`access_control_tags\`;`)
  await db.run(sql`DROP TABLE \`access_control\`;`)
  await db.run(sql`DROP TABLE \`self_moderation\`;`)
  await db.run(sql`DROP TABLE \`crisis_support\`;`)
  await db.run(sql`DROP TABLE \`usage_analytics\`;`)
  await db.run(sql`DROP TABLE \`memory_insights\`;`)
  await db.run(sql`DROP TABLE \`persona_analytics\`;`)
  await db.run(sql`DROP TABLE \`legal_documents_tags\`;`)
  await db.run(sql`DROP TABLE \`legal_documents\`;`)
  await db.run(sql`DROP TABLE \`legal_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`user_agreements\`;`)
  await db.run(sql`DROP TABLE \`user_agreements_rels\`;`)
  await db.run(sql`DROP TABLE \`documentation_tags\`;`)
  await db.run(sql`DROP TABLE \`documentation\`;`)
  await db.run(sql`DROP TABLE \`documentation_rels\`;`)
  await db.run(sql`DROP TABLE \`tutorials_steps\`;`)
  await db.run(sql`DROP TABLE \`tutorials_tags\`;`)
  await db.run(sql`DROP TABLE \`tutorials_prerequisites\`;`)
  await db.run(sql`DROP TABLE \`tutorials_learning_objectives\`;`)
  await db.run(sql`DROP TABLE \`tutorials_resources\`;`)
  await db.run(sql`DROP TABLE \`tutorials\`;`)
  await db.run(sql`DROP TABLE \`tutorials_rels\`;`)
  await db.run(sql`DROP TABLE \`support_tickets_messages\`;`)
  await db.run(sql`DROP TABLE \`support_tickets_tags\`;`)
  await db.run(sql`DROP TABLE \`support_tickets\`;`)
  await db.run(sql`DROP TABLE \`support_tickets_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_users\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`email\` text NOT NULL,
  	\`reset_password_token\` text,
  	\`reset_password_expiration\` text,
  	\`salt\` text,
  	\`hash\` text,
  	\`login_attempts\` numeric DEFAULT 0,
  	\`lock_until\` text
  );
  `)
  await db.run(sql`INSERT INTO \`__new_users\`("id", "updated_at", "created_at", "email", "reset_password_token", "reset_password_expiration", "salt", "hash", "login_attempts", "lock_until") SELECT "id", "updated_at", "created_at", "email", "reset_password_token", "reset_password_expiration", "salt", "hash", "login_attempts", "lock_until" FROM \`users\`;`)
  await db.run(sql`DROP TABLE \`users\`;`)
  await db.run(sql`ALTER TABLE \`__new_users\` RENAME TO \`users\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`users_updated_at_idx\` ON \`users\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`users_created_at_idx\` ON \`users\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`users_email_idx\` ON \`users\` (\`email\`);`)
  await db.run(sql`CREATE TABLE \`__new_knowledge\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`user_id\` integer NOT NULL,
  	\`created_timestamp\` text,
  	\`modified_timestamp\` text,
  	\`type\` text NOT NULL,
  	\`tokens\` numeric DEFAULT 0,
  	\`entry\` text NOT NULL,
  	\`knowledge_collection_id\` integer NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`knowledge_collection_id\`) REFERENCES \`knowledge_collections\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new_knowledge\`("id", "user_id", "created_timestamp", "modified_timestamp", "type", "tokens", "entry", "knowledge_collection_id", "updated_at", "created_at") SELECT "id", "user_id", "created_timestamp", "modified_timestamp", "type", "tokens", "entry", "knowledge_collection_id", "updated_at", "created_at" FROM \`knowledge\`;`)
  await db.run(sql`DROP TABLE \`knowledge\`;`)
  await db.run(sql`ALTER TABLE \`__new_knowledge\` RENAME TO \`knowledge\`;`)
  await db.run(sql`CREATE INDEX \`knowledge_user_idx\` ON \`knowledge\` (\`user_id\`);`)
  await db.run(sql`CREATE INDEX \`knowledge_knowledge_collection_idx\` ON \`knowledge\` (\`knowledge_collection_id\`);`)
  await db.run(sql`CREATE INDEX \`knowledge_updated_at_idx\` ON \`knowledge\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`knowledge_created_at_idx\` ON \`knowledge\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`__new_message\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`user_id\` integer NOT NULL,
  	\`created_timestamp\` text,
  	\`modified_timestamp\` text,
  	\`conversation_id\` integer NOT NULL,
  	\`bot_id\` integer,
  	\`byo_key\` integer DEFAULT false,
  	\`tokens\` numeric DEFAULT 0,
  	\`entry\` text NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`conversation_id\`) REFERENCES \`conversation\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`bot_id\`) REFERENCES \`bot\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new_message\`("id", "user_id", "created_timestamp", "modified_timestamp", "conversation_id", "bot_id", "byo_key", "tokens", "entry", "updated_at", "created_at") SELECT "id", "user_id", "created_timestamp", "modified_timestamp", "conversation_id", "bot_id", "byo_key", "tokens", "entry", "updated_at", "created_at" FROM \`message\`;`)
  await db.run(sql`DROP TABLE \`message\`;`)
  await db.run(sql`ALTER TABLE \`__new_message\` RENAME TO \`message\`;`)
  await db.run(sql`CREATE INDEX \`message_user_idx\` ON \`message\` (\`user_id\`);`)
  await db.run(sql`CREATE INDEX \`message_conversation_idx\` ON \`message\` (\`conversation_id\`);`)
  await db.run(sql`CREATE INDEX \`message_bot_idx\` ON \`message\` (\`bot_id\`);`)
  await db.run(sql`CREATE INDEX \`message_updated_at_idx\` ON \`message\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`message_created_at_idx\` ON \`message\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`__new_memory\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`user_id\` integer NOT NULL,
  	\`created_timestamp\` text,
  	\`modified_timestamp\` text,
  	\`bot_id\` integer NOT NULL,
  	\`conversation_id\` integer,
  	\`tokens\` numeric DEFAULT 0,
  	\`entry\` text NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`bot_id\`) REFERENCES \`bot\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`conversation_id\`) REFERENCES \`conversation\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new_memory\`("id", "user_id", "created_timestamp", "modified_timestamp", "bot_id", "conversation_id", "tokens", "entry", "updated_at", "created_at") SELECT "id", "user_id", "created_timestamp", "modified_timestamp", "bot_id", "conversation_id", "tokens", "entry", "updated_at", "created_at" FROM \`memory\`;`)
  await db.run(sql`DROP TABLE \`memory\`;`)
  await db.run(sql`ALTER TABLE \`__new_memory\` RENAME TO \`memory\`;`)
  await db.run(sql`CREATE INDEX \`memory_user_idx\` ON \`memory\` (\`user_id\`);`)
  await db.run(sql`CREATE INDEX \`memory_bot_idx\` ON \`memory\` (\`bot_id\`);`)
  await db.run(sql`CREATE INDEX \`memory_conversation_idx\` ON \`memory\` (\`conversation_id\`);`)
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
  	\`api_key_id\` integer,
  	\`mood_id\` integer,
  	\`knowledge_id\` integer,
  	\`knowledge_collections_id\` integer,
  	\`conversation_id\` integer,
  	\`message_id\` integer,
  	\`memory_id\` integer,
  	\`token_gifts_id\` integer,
  	\`subscription_payments_id\` integer,
  	\`subscription_tiers_id\` integer,
  	\`token_packages_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`bot_id\`) REFERENCES \`bot\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`api_key_id\`) REFERENCES \`api_key\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`mood_id\`) REFERENCES \`mood\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`knowledge_id\`) REFERENCES \`knowledge\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`knowledge_collections_id\`) REFERENCES \`knowledge_collections\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`conversation_id\`) REFERENCES \`conversation\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`message_id\`) REFERENCES \`message\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`memory_id\`) REFERENCES \`memory\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`token_gifts_id\`) REFERENCES \`token_gifts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`subscription_payments_id\`) REFERENCES \`subscription_payments\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`subscription_tiers_id\`) REFERENCES \`subscription_tiers\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`token_packages_id\`) REFERENCES \`token_packages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "media_id", "bot_id", "api_key_id", "mood_id", "knowledge_id", "knowledge_collections_id", "conversation_id", "message_id", "memory_id", "token_gifts_id", "subscription_payments_id", "subscription_tiers_id", "token_packages_id") SELECT "id", "order", "parent_id", "path", "users_id", "media_id", "bot_id", "api_key_id", "mood_id", "knowledge_id", "knowledge_collections_id", "conversation_id", "message_id", "memory_id", "token_gifts_id", "subscription_payments_id", "subscription_tiers_id", "token_packages_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_bot_id_idx\` ON \`payload_locked_documents_rels\` (\`bot_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_api_key_id_idx\` ON \`payload_locked_documents_rels\` (\`api_key_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_mood_id_idx\` ON \`payload_locked_documents_rels\` (\`mood_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_knowledge_id_idx\` ON \`payload_locked_documents_rels\` (\`knowledge_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_knowledge_collections_id_idx\` ON \`payload_locked_documents_rels\` (\`knowledge_collections_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_conversation_id_idx\` ON \`payload_locked_documents_rels\` (\`conversation_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_message_id_idx\` ON \`payload_locked_documents_rels\` (\`message_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_memory_id_idx\` ON \`payload_locked_documents_rels\` (\`memory_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_token_gifts_id_idx\` ON \`payload_locked_documents_rels\` (\`token_gifts_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_subscription_payments_id_idx\` ON \`payload_locked_documents_rels\` (\`subscription_payments_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_subscription_tiers_id_idx\` ON \`payload_locked_documents_rels\` (\`subscription_tiers_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_token_packages_id_idx\` ON \`payload_locked_documents_rels\` (\`token_packages_id\`);`)
  await db.run(sql`ALTER TABLE \`bot\` DROP COLUMN \`likes_count\`;`)
  await db.run(sql`ALTER TABLE \`bot\` DROP COLUMN \`favorites_count\`;`)
  await db.run(sql`ALTER TABLE \`bot\` DROP COLUMN \`creator_display_name\`;`)
  await db.run(sql`ALTER TABLE \`api_key\` DROP COLUMN \`key_configuration_rate_limits_requests_per_hour\`;`)
  await db.run(sql`ALTER TABLE \`api_key\` DROP COLUMN \`key_configuration_rate_limits_tokens_per_minute\`;`)
  await db.run(sql`ALTER TABLE \`api_key\` DROP COLUMN \`key_configuration_usage_tracking_monthly_quota\`;`)
  await db.run(sql`ALTER TABLE \`api_key\` DROP COLUMN \`key_configuration_usage_tracking_daily_limit\`;`)
  await db.run(sql`ALTER TABLE \`api_key\` DROP COLUMN \`usage_analytics_total_requests\`;`)
  await db.run(sql`ALTER TABLE \`api_key\` DROP COLUMN \`usage_analytics_total_tokens_used\`;`)
  await db.run(sql`ALTER TABLE \`api_key\` DROP COLUMN \`usage_analytics_monthly_usage\`;`)
  await db.run(sql`ALTER TABLE \`api_key\` DROP COLUMN \`usage_analytics_average_response_time\`;`)
  await db.run(sql`ALTER TABLE \`api_key\` DROP COLUMN \`usage_analytics_error_rate\`;`)
  await db.run(sql`ALTER TABLE \`api_key\` DROP COLUMN \`security_features_key_encryption_level\`;`)
  await db.run(sql`ALTER TABLE \`api_key\` DROP COLUMN \`security_features_auto_rotation_enabled\`;`)
  await db.run(sql`ALTER TABLE \`api_key\` DROP COLUMN \`security_features_rotation_schedule\`;`)
  await db.run(sql`ALTER TABLE \`api_key\` DROP COLUMN \`security_features_last_rotation_date\`;`)
  await db.run(sql`ALTER TABLE \`api_key\` DROP COLUMN \`security_features_key_expiry_date\`;`)
  await db.run(sql`ALTER TABLE \`api_key\` DROP COLUMN \`security_features_is_active\`;`)
  await db.run(sql`ALTER TABLE \`api_key\` DROP COLUMN \`security_features_last_used\`;`)
  await db.run(sql`ALTER TABLE \`api_key\` DROP COLUMN \`provider_specific_settings_openai_settings_organization_id\`;`)
  await db.run(sql`ALTER TABLE \`api_key\` DROP COLUMN \`provider_specific_settings_openai_settings_project_id\`;`)
  await db.run(sql`ALTER TABLE \`api_key\` DROP COLUMN \`provider_specific_settings_anthropic_settings_account_preferences\`;`)
  await db.run(sql`ALTER TABLE \`api_key\` DROP COLUMN \`provider_specific_settings_google_settings_project_configuration\`;`)
  await db.run(sql`ALTER TABLE \`api_key\` DROP COLUMN \`provider_specific_settings_custom_settings_configuration\`;`)
  await db.run(sql`ALTER TABLE \`api_key\` DROP COLUMN \`provider_specific_settings_custom_settings_api_endpoint\`;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` DROP COLUMN \`sharing_settings_sharing_level\`;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` DROP COLUMN \`sharing_settings_allow_collaboration\`;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` DROP COLUMN \`sharing_settings_allow_fork\`;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` DROP COLUMN \`sharing_settings_sharing_expiration\`;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` DROP COLUMN \`sharing_settings_share_password\`;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` DROP COLUMN \`sharing_settings_collaboration_requests\`;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` DROP COLUMN \`sharing_settings_knowledge_count\`;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` DROP COLUMN \`sharing_settings_last_updated\`;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` DROP COLUMN \`sharing_settings_is_public\`;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` DROP COLUMN \`collaborators_invited_by_user\`;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` DROP COLUMN \`collaborators_invited_at\`;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` DROP COLUMN \`collaborators_collab_notes\`;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` DROP COLUMN \`collection_metadata_total_size_bytes\`;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` DROP COLUMN \`collection_metadata_total_words\`;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` DROP COLUMN \`collection_metadata_average_quality_score\`;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` DROP COLUMN \`collection_metadata_collection_category\`;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` DROP COLUMN \`collection_metadata_difficulty_level\`;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` DROP COLUMN \`collection_metadata_language\`;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` DROP COLUMN \`usage_analytics_view_count\`;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` DROP COLUMN \`usage_analytics_fork_count\`;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` DROP COLUMN \`usage_analytics_collaboration_count\`;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` DROP COLUMN \`usage_analytics_last_viewed\`;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` DROP COLUMN \`usage_analytics_popularity_score\`;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` DROP COLUMN \`usage_analytics_rating\`;`)
  await db.run(sql`ALTER TABLE \`knowledge_collections\` DROP COLUMN \`usage_analytics_review_count\`;`)
  await db.run(sql`ALTER TABLE \`conversation\` DROP COLUMN \`conversation_type\`;`)
  await db.run(sql`ALTER TABLE \`conversation\` DROP COLUMN \`participants\`;`)
  await db.run(sql`ALTER TABLE \`conversation\` DROP COLUMN \`total_tokens\`;`)
  await db.run(sql`ALTER TABLE \`conversation\` DROP COLUMN \`last_summarized_at\`;`)
  await db.run(sql`ALTER TABLE \`conversation\` DROP COLUMN \`last_summarized_message_index\`;`)
  await db.run(sql`ALTER TABLE \`conversation\` DROP COLUMN \`requires_summarization\`;`)
  await db.run(sql`ALTER TABLE \`conversation\` DROP COLUMN \`conversation_metadata_total_messages\`;`)
  await db.run(sql`ALTER TABLE \`conversation\` DROP COLUMN \`conversation_metadata_participant_count\`;`)
  await db.run(sql`ALTER TABLE \`conversation\` DROP COLUMN \`conversation_metadata_last_activity\`;`)
  await db.run(sql`ALTER TABLE \`conversation\` DROP COLUMN \`conversation_metadata_conversation_summary\`;`)
  await db.run(sql`ALTER TABLE \`conversation\` DROP COLUMN \`status\`;`)
  await db.run(sql`ALTER TABLE \`conversation\` DROP COLUMN \`conversation_settings_allow_file_sharing\`;`)
  await db.run(sql`ALTER TABLE \`conversation\` DROP COLUMN \`conversation_settings_message_retention_days\`;`)
  await db.run(sql`ALTER TABLE \`conversation\` DROP COLUMN \`conversation_settings_auto_save_conversations\`;`)
}
