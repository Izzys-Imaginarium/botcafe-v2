-- Migration 20260114_025430 - Apply to remote D1 (Part 2: Missing tables and ALTER statements)

-- Create missing knowledge activation settings tables
CREATE TABLE IF NOT EXISTS knowledge_activation_settings_primary_keys (_order integer NOT NULL, _parent_id integer NOT NULL, id text PRIMARY KEY NOT NULL, keyword text, FOREIGN KEY (_parent_id) REFERENCES knowledge(id) ON UPDATE no action ON DELETE cascade);
CREATE INDEX IF NOT EXISTS knowledge_activation_settings_primary_keys_order_idx ON knowledge_activation_settings_primary_keys (_order);
CREATE INDEX IF NOT EXISTS knowledge_activation_settings_primary_keys_parent_id_idx ON knowledge_activation_settings_primary_keys (_parent_id);

CREATE TABLE IF NOT EXISTS knowledge_activation_settings_secondary_keys (_order integer NOT NULL, _parent_id integer NOT NULL, id text PRIMARY KEY NOT NULL, keyword text, FOREIGN KEY (_parent_id) REFERENCES knowledge(id) ON UPDATE no action ON DELETE cascade);
CREATE INDEX IF NOT EXISTS knowledge_activation_settings_secondary_keys_order_idx ON knowledge_activation_settings_secondary_keys (_order);
CREATE INDEX IF NOT EXISTS knowledge_activation_settings_secondary_keys_parent_id_idx ON knowledge_activation_settings_secondary_keys (_parent_id);

-- Create missing knowledge filtering tables
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

-- Add bot personality and behavior columns
ALTER TABLE bot ADD COLUMN personality_traits_tone text;
ALTER TABLE bot ADD COLUMN personality_traits_formality_level text;
ALTER TABLE bot ADD COLUMN personality_traits_humor_style text;
ALTER TABLE bot ADD COLUMN personality_traits_communication_style text;
ALTER TABLE bot ADD COLUMN behavior_settings_response_length text;
ALTER TABLE bot ADD COLUMN behavior_settings_creativity_level text;
ALTER TABLE bot ADD COLUMN behavior_settings_knowledge_sharing text;

-- Add knowledge activation settings columns
ALTER TABLE knowledge ADD COLUMN activation_settings_activation_mode text DEFAULT 'vector' NOT NULL;
ALTER TABLE knowledge ADD COLUMN activation_settings_keywords_logic text DEFAULT 'AND_ANY';
ALTER TABLE knowledge ADD COLUMN activation_settings_case_sensitive integer DEFAULT false;
ALTER TABLE knowledge ADD COLUMN activation_settings_match_whole_words integer DEFAULT false;
ALTER TABLE knowledge ADD COLUMN activation_settings_use_regex integer DEFAULT false;
ALTER TABLE knowledge ADD COLUMN activation_settings_vector_similarity_threshold numeric DEFAULT 0.7;
ALTER TABLE knowledge ADD COLUMN activation_settings_max_vector_results numeric DEFAULT 5;
ALTER TABLE knowledge ADD COLUMN activation_settings_probability numeric DEFAULT 100;
ALTER TABLE knowledge ADD COLUMN activation_settings_use_probability integer DEFAULT false;
ALTER TABLE knowledge ADD COLUMN activation_settings_scan_depth numeric DEFAULT 2;
ALTER TABLE knowledge ADD COLUMN activation_settings_match_in_user_messages integer DEFAULT true;
ALTER TABLE knowledge ADD COLUMN activation_settings_match_in_bot_messages integer DEFAULT true;
ALTER TABLE knowledge ADD COLUMN activation_settings_match_in_system_prompts integer DEFAULT false;

-- Add knowledge positioning columns
ALTER TABLE knowledge ADD COLUMN positioning_position text DEFAULT 'before_character' NOT NULL;
ALTER TABLE knowledge ADD COLUMN positioning_depth numeric DEFAULT 0;
ALTER TABLE knowledge ADD COLUMN positioning_role text DEFAULT 'system';
ALTER TABLE knowledge ADD COLUMN positioning_order numeric DEFAULT 100;

-- Add knowledge advanced activation columns
ALTER TABLE knowledge ADD COLUMN advanced_activation_sticky numeric DEFAULT 0;
ALTER TABLE knowledge ADD COLUMN advanced_activation_cooldown numeric DEFAULT 0;
ALTER TABLE knowledge ADD COLUMN advanced_activation_delay numeric DEFAULT 0;

-- Add knowledge filtering columns
ALTER TABLE knowledge ADD COLUMN filtering_filter_by_bots integer DEFAULT false;
ALTER TABLE knowledge ADD COLUMN filtering_filter_by_personas integer DEFAULT false;
ALTER TABLE knowledge ADD COLUMN filtering_match_bot_description integer DEFAULT false;
ALTER TABLE knowledge ADD COLUMN filtering_match_bot_personality integer DEFAULT false;
ALTER TABLE knowledge ADD COLUMN filtering_match_persona_description integer DEFAULT false;

-- Add knowledge budget control columns
ALTER TABLE knowledge ADD COLUMN budget_control_ignore_budget integer DEFAULT false;
ALTER TABLE knowledge ADD COLUMN budget_control_token_cost numeric DEFAULT 0;
ALTER TABLE knowledge ADD COLUMN budget_control_max_tokens numeric DEFAULT 1000;

-- Add personas columns
ALTER TABLE personas ADD COLUMN gender text;
ALTER TABLE personas ADD COLUMN age numeric;
ALTER TABLE personas ADD COLUMN pronouns text;
ALTER TABLE personas ADD COLUMN custom_pronouns text;
