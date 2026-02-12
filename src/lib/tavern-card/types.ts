// SillyTavern Character Card V1 (legacy flat format)
export interface TavernCardV1 {
  name: string
  description: string
  personality: string
  scenario: string
  first_mes: string
  mes_example: string
}

// Character Book Entry (V2 lorebook entry)
export interface CharacterBookEntry {
  keys: string[]
  content: string
  extensions: Record<string, unknown>
  enabled: boolean
  insertion_order: number
  case_sensitive?: boolean
  name?: string
  priority?: number
  id?: number
  comment?: string
  selective?: boolean
  secondary_keys?: string[]
  constant?: boolean
  position?: 'before_char' | 'after_char'
}

// Character Book (V2 lorebook)
export interface CharacterBook {
  name?: string
  description?: string
  scan_depth?: number
  token_budget?: number
  recursive_scanning?: boolean
  extensions: Record<string, unknown>
  entries: CharacterBookEntry[]
}

// SillyTavern Character Card V2
export interface TavernCardV2 {
  spec: 'chara_card_v2'
  spec_version: '2.0'
  data: TavernCardV2Data
}

export interface TavernCardV2Data {
  name: string
  description: string
  personality: string
  scenario: string
  first_mes: string
  mes_example: string
  creator_notes: string
  system_prompt: string
  post_history_instructions: string
  alternate_greetings: string[]
  character_book?: CharacterBook
  tags: string[]
  creator: string
  character_version: string
  extensions: Record<string, unknown>
}

// BotCafe-specific extension data preserved for round-tripping
export interface BotCafeExtensions {
  signature_phrases: string[]
  behavior_settings: {
    response_length?: string
    creativity_level?: string
    knowledge_sharing?: string
  }
  personality_traits: {
    tone?: string
    formality_level?: string
    humor_style?: string
    communication_style?: string
  }
  gender?: string
  age?: number
  classifications?: string[]
  botcafe_version: string
}

// Result of parsing a card file
export interface ParsedCardResult {
  version: 'v1' | 'v2'
  data: TavernCardV1 | TavernCardV2Data
  imageBuffer: Buffer | null
}
