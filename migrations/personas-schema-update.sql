-- Migration: Update personas schema to simplified version
-- Removes: personality_traits, behavior_settings, tags, signature_phrases, is_public
-- Adds: gender, age, pronouns, custom_pronouns

-- Drop deprecated related tables
DROP TABLE IF EXISTS personas_interaction_preferences_signature_phrases;
DROP TABLE IF EXISTS personas_tags;

-- Drop and recreate personas table with new schema
DROP TABLE IF EXISTS personas;

CREATE TABLE personas (
  id integer PRIMARY KEY NOT NULL,
  user_id integer NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  gender text,
  age numeric,
  pronouns text,
  custom_pronouns text,
  appearance_avatar_id integer,
  is_default integer DEFAULT false,
  usage_count numeric DEFAULT 0,
  created_timestamp text,
  modified_timestamp text,
  custom_instructions text,
  updated_at text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  created_at text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE no action ON DELETE set null,
  FOREIGN KEY (appearance_avatar_id) REFERENCES media(id) ON UPDATE no action ON DELETE set null
);

CREATE INDEX personas_user_idx ON personas (user_id);
CREATE INDEX personas_appearance_appearance_avatar_idx ON personas (appearance_avatar_id);
CREATE INDEX personas_updated_at_idx ON personas (updated_at);
CREATE INDEX personas_created_at_idx ON personas (created_at);
