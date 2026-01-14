-- Migration 20260114_025430 - Apply to remote D1 (Part 1: Tables)

-- Create indexes for bot_signature_phrases
CREATE INDEX IF NOT EXISTS bot_signature_phrases_order_idx ON bot_signature_phrases (_order);
CREATE INDEX IF NOT EXISTS bot_signature_phrases_parent_id_idx ON bot_signature_phrases (_parent_id);

-- Create bot_tags table
CREATE TABLE IF NOT EXISTS bot_tags (_order integer NOT NULL, _parent_id integer NOT NULL, id text PRIMARY KEY NOT NULL, tag text, FOREIGN KEY (_parent_id) REFERENCES bot(id) ON UPDATE no action ON DELETE cascade);
CREATE INDEX IF NOT EXISTS bot_tags_order_idx ON bot_tags (_order);
CREATE INDEX IF NOT EXISTS bot_tags_parent_id_idx ON bot_tags (_parent_id);

-- Create knowledge activation settings tables
CREATE TABLE IF NOT EXISTS knowledge_activation_settings_primary_keys (_order integer NOT NULL, _parent_id integer NOT NULL, id text PRIMARY KEY NOT NULL, keyword text, FOREIGN KEY (_parent_id) REFERENCES knowledge(id) ON UPDATE no action ON DELETE cascade);
CREATE INDEX IF NOT EXISTS knowledge_activation_settings_primary_keys_order_idx ON knowledge_activation_settings_primary_keys (_order);
CREATE INDEX IF NOT EXISTS knowledge_activation_settings_primary_keys_parent_id_idx ON knowledge_activation_settings_primary_keys (_parent_id);

CREATE TABLE IF NOT EXISTS knowledge_activation_settings_secondary_keys (_order integer NOT NULL, _parent_id integer NOT NULL, id text PRIMARY KEY NOT NULL, keyword text, FOREIGN KEY (_parent_id) REFERENCES knowledge(id) ON UPDATE no action ON DELETE cascade);
CREATE INDEX IF NOT EXISTS knowledge_activation_settings_secondary_keys_order_idx ON knowledge_activation_settings_secondary_keys (_order);
CREATE INDEX IF NOT EXISTS knowledge_activation_settings_secondary_keys_parent_id_idx ON knowledge_activation_settings_secondary_keys (_parent_id);

-- Create knowledge filtering tables
CREATE TABLE IF NOT EXISTS knowledge_filtering_allowed_bot_ids (_order integer NOT NULL, _parent_id integer NOT NULL, id text PRIMARY KEY NOT NULL, bot_id numeric, FOREIGN KEY (_parent_id) REFERENCES knowledge(id) ON UPDATE no action ON DELETE cascade);
CREATE INDEX IF NOT EXISTS knowledge_filtering_allowed_bot_ids_order_idx ON knowledge_filtering_allowed_bot_ids (_order);
CREATE INDEX IF NOT EXISTS knowledge_filtering_allowed_bot_ids_parent_id_idx ON knowledge_filtering_allowed_bot_ids (_parent_id);

CREATE TABLE IF NOT EXISTS knowledge_filtering_excluded_bot_ids (_order integer NOT NULL, _parent_id integer NOT NULL, id text PRIMARY KEY NOT NULL, bot_id numeric, FOREIGN KEY (_parent_id) REFERENCES knowledge(id) ON UPDATE no action ON DELETE cascade);
CREATE INDEX IF NOT EXISTS knowledge_filtering_excluded_bot_ids_order_idx ON knowledge_filtering_excluded_bot_ids (_order);
CREATE INDEX IF NOT EXISTS knowledge_filtering_excluded_bot_ids_parent_id_idx ON knowledge_filtering_excluded_bot_ids (_parent_id);

CREATE TABLE IF NOT EXISTS knowledge_filtering_allowed_persona_ids (_order integer NOT NULL, _parent_id integer NOT NULL, id text PRIMARY KEY NOT NULL, persona_id numeric, FOREIGN KEY (_parent_id) REFERENCES knowledge(id) ON UPDATE no action ON DELETE cascade);
CREATE INDEX IF NOT EXISTS knowledge_filtering_allowed_persona_ids_order_idx ON knowledge_filtering_allowed_persona_ids (_order);
CREATE INDEX IF NOT EXISTS knowledge_filtering_allowed_persona_ids_parent_id_idx ON knowledge_filtering_allowed_persona_ids (_parent_id);

CREATE TABLE IF NOT EXISTS knowledge_filtering_excluded_persona_ids (_order integer NOT NULL, _parent_id integer NOT NULL, id text PRIMARY KEY NOT NULL, persona_id numeric, FOREIGN KEY (_parent_id) REFERENCES knowledge(id) ON UPDATE no action ON DELETE cascade);
CREATE INDEX IF NOT EXISTS knowledge_filtering_excluded_persona_ids_order_idx ON knowledge_filtering_excluded_persona_ids (_order);
CREATE INDEX IF NOT EXISTS knowledge_filtering_excluded_persona_ids_parent_id_idx ON knowledge_filtering_excluded_persona_ids (_parent_id);

-- Create knowledge_activation_log table FIRST (before matched_keywords)
CREATE TABLE IF NOT EXISTS knowledge_activation_log (id integer PRIMARY KEY NOT NULL, conversation_id_id integer NOT NULL, message_index numeric NOT NULL, knowledge_entry_id_id integer NOT NULL, activation_method text NOT NULL, activation_score numeric NOT NULL, vector_similarity numeric, position_inserted text NOT NULL, tokens_used numeric NOT NULL, was_included integer DEFAULT true NOT NULL, exclusion_reason text, activation_timestamp text NOT NULL, updated_at text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL, created_at text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL, FOREIGN KEY (conversation_id_id) REFERENCES conversation(id) ON UPDATE no action ON DELETE set null, FOREIGN KEY (knowledge_entry_id_id) REFERENCES knowledge(id) ON UPDATE no action ON DELETE set null);
CREATE INDEX IF NOT EXISTS knowledge_activation_log_conversation_id_idx ON knowledge_activation_log (conversation_id_id);
CREATE INDEX IF NOT EXISTS knowledge_activation_log_knowledge_entry_id_idx ON knowledge_activation_log (knowledge_entry_id_id);
CREATE INDEX IF NOT EXISTS knowledge_activation_log_updated_at_idx ON knowledge_activation_log (updated_at);
CREATE INDEX IF NOT EXISTS knowledge_activation_log_created_at_idx ON knowledge_activation_log (created_at);

-- Create knowledge_activation_log_matched_keywords AFTER the parent table
CREATE TABLE IF NOT EXISTS knowledge_activation_log_matched_keywords (_order integer NOT NULL, _parent_id integer NOT NULL, id text PRIMARY KEY NOT NULL, keyword text, FOREIGN KEY (_parent_id) REFERENCES knowledge_activation_log(id) ON UPDATE no action ON DELETE cascade);
CREATE INDEX IF NOT EXISTS knowledge_activation_log_matched_keywords_order_idx ON knowledge_activation_log_matched_keywords (_order);
CREATE INDEX IF NOT EXISTS knowledge_activation_log_matched_keywords_parent_id_idx ON knowledge_activation_log_matched_keywords (_parent_id);
