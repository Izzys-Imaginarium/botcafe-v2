-- Fix memory table's lore_entry_id foreign key to add ON DELETE SET NULL
-- This prevents delete errors on knowledge entries

-- Step 1: Disable foreign keys temporarily
PRAGMA foreign_keys=OFF;

-- Step 2: Create new memory table with correct FK constraint
CREATE TABLE memory_new (
  id integer PRIMARY KEY NOT NULL,
  user_id integer NOT NULL,
  created_timestamp text,
  modified_timestamp text,
  bot_id integer NOT NULL,
  conversation_id integer,
  tokens numeric DEFAULT 0,
  entry text NOT NULL,
  updated_at text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  created_at text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  type text DEFAULT 'short_term',
  participants text,
  is_vectorized integer DEFAULT false,
  converted_to_lore integer DEFAULT false,
  lore_entry_id integer,
  converted_at text,
  importance numeric DEFAULT 5,
  emotional_context text,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE no action ON DELETE set null,
  FOREIGN KEY (bot_id) REFERENCES bot(id) ON UPDATE no action ON DELETE set null,
  FOREIGN KEY (conversation_id) REFERENCES conversation(id) ON UPDATE no action ON DELETE set null,
  FOREIGN KEY (lore_entry_id) REFERENCES knowledge(id) ON UPDATE no action ON DELETE set null
);

-- Step 3: Copy data from old table to new table
INSERT INTO memory_new SELECT * FROM memory;

-- Step 4: Drop old table
DROP TABLE memory;

-- Step 5: Rename new table to original name
ALTER TABLE memory_new RENAME TO memory;

-- Step 6: Re-enable foreign keys
PRAGMA foreign_keys=ON;
