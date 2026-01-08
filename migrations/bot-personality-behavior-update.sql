-- Migration: Add personality traits, behavior settings, signature phrases, and tags to bot
-- This preserves existing bot data while adding new columns

-- Add personality traits columns
ALTER TABLE bot ADD COLUMN personality_traits_tone TEXT;
ALTER TABLE bot ADD COLUMN personality_traits_formality_level TEXT;
ALTER TABLE bot ADD COLUMN personality_traits_humor_style TEXT;
ALTER TABLE bot ADD COLUMN personality_traits_communication_style TEXT;

-- Add behavior settings columns
ALTER TABLE bot ADD COLUMN behavior_settings_response_length TEXT;
ALTER TABLE bot ADD COLUMN behavior_settings_creativity_level TEXT;
ALTER TABLE bot ADD COLUMN behavior_settings_knowledge_sharing TEXT;

-- Create signature phrases table
CREATE TABLE IF NOT EXISTS bot_signature_phrases (
  id INTEGER PRIMARY KEY NOT NULL,
  _order INTEGER NOT NULL,
  _parent_id INTEGER NOT NULL,
  phrase TEXT,
  FOREIGN KEY (_parent_id) REFERENCES bot(id) ON UPDATE NO ACTION ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS bot_signature_phrases_order_idx ON bot_signature_phrases (_order);
CREATE INDEX IF NOT EXISTS bot_signature_phrases_parent_id_idx ON bot_signature_phrases (_parent_id);

-- Create tags table
CREATE TABLE IF NOT EXISTS bot_tags (
  id INTEGER PRIMARY KEY NOT NULL,
  _order INTEGER NOT NULL,
  _parent_id INTEGER NOT NULL,
  tag TEXT,
  FOREIGN KEY (_parent_id) REFERENCES bot(id) ON UPDATE NO ACTION ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS bot_tags_order_idx ON bot_tags (_order);
CREATE INDEX IF NOT EXISTS bot_tags_parent_id_idx ON bot_tags (_parent_id);
