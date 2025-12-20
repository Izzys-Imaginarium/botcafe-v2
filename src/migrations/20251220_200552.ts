import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`users_sessions\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`created_at\` text,
  	\`expires_at\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`users_sessions_order_idx\` ON \`users_sessions\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`users_sessions_parent_id_idx\` ON \`users_sessions\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`users\` (
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
  await db.run(sql`CREATE INDEX \`users_updated_at_idx\` ON \`users\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`users_created_at_idx\` ON \`users\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`users_email_idx\` ON \`users\` (\`email\`);`)
  await db.run(sql`CREATE TABLE \`media\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`alt\` text NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`url\` text,
  	\`thumbnail_u_r_l\` text,
  	\`filename\` text,
  	\`mime_type\` text,
  	\`filesize\` numeric,
  	\`width\` numeric,
  	\`height\` numeric
  );
  `)
  await db.run(sql`CREATE INDEX \`media_updated_at_idx\` ON \`media\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`media_created_at_idx\` ON \`media\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`media_filename_idx\` ON \`media\` (\`filename\`);`)
  await db.run(sql`CREATE TABLE \`bot_speech_examples\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`example\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`bot\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`bot_speech_examples_order_idx\` ON \`bot_speech_examples\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`bot_speech_examples_parent_id_idx\` ON \`bot_speech_examples\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`bot\` (
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
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`picture_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`bot_user_idx\` ON \`bot\` (\`user_id\`);`)
  await db.run(sql`CREATE INDEX \`bot_picture_idx\` ON \`bot\` (\`picture_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`bot_slug_idx\` ON \`bot\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`bot_updated_at_idx\` ON \`bot\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`bot_created_at_idx\` ON \`bot\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`bot_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`knowledge_collections_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`bot\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`knowledge_collections_id\`) REFERENCES \`knowledge_collections\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`bot_rels_order_idx\` ON \`bot_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`bot_rels_parent_idx\` ON \`bot_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`bot_rels_path_idx\` ON \`bot_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`bot_rels_knowledge_collections_id_idx\` ON \`bot_rels\` (\`knowledge_collections_id\`);`)
  await db.run(sql`CREATE TABLE \`api_key\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`user_id\` integer NOT NULL,
  	\`nickname\` text NOT NULL,
  	\`provider\` text NOT NULL,
  	\`key\` text NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`api_key_user_idx\` ON \`api_key\` (\`user_id\`);`)
  await db.run(sql`CREATE INDEX \`api_key_updated_at_idx\` ON \`api_key\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`api_key_created_at_idx\` ON \`api_key\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`mood\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`user_id\` integer NOT NULL,
  	\`timestamp\` text,
  	\`mood\` text NOT NULL,
  	\`note\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`mood_user_idx\` ON \`mood\` (\`user_id\`);`)
  await db.run(sql`CREATE INDEX \`mood_updated_at_idx\` ON \`mood\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`mood_created_at_idx\` ON \`mood\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`knowledge_tags\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`tag\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`knowledge\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`knowledge_tags_order_idx\` ON \`knowledge_tags\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`knowledge_tags_parent_id_idx\` ON \`knowledge_tags\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`knowledge\` (
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
  await db.run(sql`CREATE INDEX \`knowledge_user_idx\` ON \`knowledge\` (\`user_id\`);`)
  await db.run(sql`CREATE INDEX \`knowledge_knowledge_collection_idx\` ON \`knowledge\` (\`knowledge_collection_id\`);`)
  await db.run(sql`CREATE INDEX \`knowledge_updated_at_idx\` ON \`knowledge\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`knowledge_created_at_idx\` ON \`knowledge\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`knowledge_collections\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`user_id\` integer NOT NULL,
  	\`created_timestamp\` text,
  	\`modified_timestamp\` text,
  	\`description\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`knowledge_collections_user_idx\` ON \`knowledge_collections\` (\`user_id\`);`)
  await db.run(sql`CREATE INDEX \`knowledge_collections_updated_at_idx\` ON \`knowledge_collections\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`knowledge_collections_created_at_idx\` ON \`knowledge_collections\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`knowledge_collections_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`bot_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`knowledge_collections\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`bot_id\`) REFERENCES \`bot\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`knowledge_collections_rels_order_idx\` ON \`knowledge_collections_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`knowledge_collections_rels_parent_idx\` ON \`knowledge_collections_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`knowledge_collections_rels_path_idx\` ON \`knowledge_collections_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`knowledge_collections_rels_bot_id_idx\` ON \`knowledge_collections_rels\` (\`bot_id\`);`)
  await db.run(sql`CREATE TABLE \`conversation\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`user_id\` integer NOT NULL,
  	\`created_timestamp\` text,
  	\`modified_timestamp\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`conversation_user_idx\` ON \`conversation\` (\`user_id\`);`)
  await db.run(sql`CREATE INDEX \`conversation_updated_at_idx\` ON \`conversation\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`conversation_created_at_idx\` ON \`conversation\` (\`created_at\`);`)
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
  await db.run(sql`CREATE TABLE \`message\` (
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
  await db.run(sql`CREATE INDEX \`message_user_idx\` ON \`message\` (\`user_id\`);`)
  await db.run(sql`CREATE INDEX \`message_conversation_idx\` ON \`message\` (\`conversation_id\`);`)
  await db.run(sql`CREATE INDEX \`message_bot_idx\` ON \`message\` (\`bot_id\`);`)
  await db.run(sql`CREATE INDEX \`message_updated_at_idx\` ON \`message\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`message_created_at_idx\` ON \`message\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`memory\` (
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
  await db.run(sql`CREATE INDEX \`memory_user_idx\` ON \`memory\` (\`user_id\`);`)
  await db.run(sql`CREATE INDEX \`memory_bot_idx\` ON \`memory\` (\`bot_id\`);`)
  await db.run(sql`CREATE INDEX \`memory_conversation_idx\` ON \`memory\` (\`conversation_id\`);`)
  await db.run(sql`CREATE INDEX \`memory_updated_at_idx\` ON \`memory\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`memory_created_at_idx\` ON \`memory\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`token_gifts\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`sender_id\` integer NOT NULL,
  	\`receiver_id\` integer NOT NULL,
  	\`message\` text,
  	\`tokens\` numeric NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`sender_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`receiver_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`token_gifts_sender_idx\` ON \`token_gifts\` (\`sender_id\`);`)
  await db.run(sql`CREATE INDEX \`token_gifts_receiver_idx\` ON \`token_gifts\` (\`receiver_id\`);`)
  await db.run(sql`CREATE INDEX \`token_gifts_updated_at_idx\` ON \`token_gifts\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`token_gifts_created_at_idx\` ON \`token_gifts\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`subscription_payments\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`user_id\` integer NOT NULL,
  	\`date\` text,
  	\`tokens\` numeric NOT NULL,
  	\`amount\` numeric NOT NULL,
  	\`currency\` text NOT NULL,
  	\`payment_method\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`subscription_payments_user_idx\` ON \`subscription_payments\` (\`user_id\`);`)
  await db.run(sql`CREATE INDEX \`subscription_payments_updated_at_idx\` ON \`subscription_payments\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`subscription_payments_created_at_idx\` ON \`subscription_payments\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`subscription_tiers_features\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`feature\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`subscription_tiers\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`subscription_tiers_features_order_idx\` ON \`subscription_tiers_features\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`subscription_tiers_features_parent_id_idx\` ON \`subscription_tiers_features\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`subscription_tiers\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`cost\` numeric NOT NULL,
  	\`tokens\` numeric NOT NULL,
  	\`currency\` text NOT NULL,
  	\`billing_period\` text NOT NULL,
  	\`is_active\` integer DEFAULT true,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`subscription_tiers_updated_at_idx\` ON \`subscription_tiers\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`subscription_tiers_created_at_idx\` ON \`subscription_tiers\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`token_packages\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`cost\` numeric NOT NULL,
  	\`tokens\` numeric NOT NULL,
  	\`currency\` text NOT NULL,
  	\`description\` text,
  	\`is_popular\` integer DEFAULT false,
  	\`is_active\` integer DEFAULT true,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`token_packages_updated_at_idx\` ON \`token_packages\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`token_packages_created_at_idx\` ON \`token_packages\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`global_slug\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_global_slug_idx\` ON \`payload_locked_documents\` (\`global_slug\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_updated_at_idx\` ON \`payload_locked_documents\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_created_at_idx\` ON \`payload_locked_documents\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents_rels\` (
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
  await db.run(sql`CREATE TABLE \`payload_preferences\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text,
  	\`value\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_preferences_key_idx\` ON \`payload_preferences\` (\`key\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_updated_at_idx\` ON \`payload_preferences\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_created_at_idx\` ON \`payload_preferences\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_preferences_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_preferences\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_order_idx\` ON \`payload_preferences_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_parent_idx\` ON \`payload_preferences_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_path_idx\` ON \`payload_preferences_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_users_id_idx\` ON \`payload_preferences_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE TABLE \`payload_migrations\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`batch\` numeric,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_migrations_updated_at_idx\` ON \`payload_migrations\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_migrations_created_at_idx\` ON \`payload_migrations\` (\`created_at\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`users_sessions\`;`)
  await db.run(sql`DROP TABLE \`users\`;`)
  await db.run(sql`DROP TABLE \`media\`;`)
  await db.run(sql`DROP TABLE \`bot_speech_examples\`;`)
  await db.run(sql`DROP TABLE \`bot\`;`)
  await db.run(sql`DROP TABLE \`bot_rels\`;`)
  await db.run(sql`DROP TABLE \`api_key\`;`)
  await db.run(sql`DROP TABLE \`mood\`;`)
  await db.run(sql`DROP TABLE \`knowledge_tags\`;`)
  await db.run(sql`DROP TABLE \`knowledge\`;`)
  await db.run(sql`DROP TABLE \`knowledge_collections\`;`)
  await db.run(sql`DROP TABLE \`knowledge_collections_rels\`;`)
  await db.run(sql`DROP TABLE \`conversation\`;`)
  await db.run(sql`DROP TABLE \`conversation_rels\`;`)
  await db.run(sql`DROP TABLE \`message\`;`)
  await db.run(sql`DROP TABLE \`memory\`;`)
  await db.run(sql`DROP TABLE \`token_gifts\`;`)
  await db.run(sql`DROP TABLE \`subscription_payments\`;`)
  await db.run(sql`DROP TABLE \`subscription_tiers_features\`;`)
  await db.run(sql`DROP TABLE \`subscription_tiers\`;`)
  await db.run(sql`DROP TABLE \`token_packages\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_migrations\`;`)
}
