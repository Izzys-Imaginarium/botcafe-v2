import type { BotFormData } from '@/modules/bot-create/ui/components/bot-wizard-form'
import type {
  TavernCardV1,
  TavernCardV2,
  TavernCardV2Data,
  BotCafeExtensions,
  CharacterBook,
  CharacterBookEntry,
} from './types'

// ─── Export: BotCafe -> TavernCardV2 ────────────────────────────────────────

interface BotDataForExport {
  name: string
  description?: string | null
  system_prompt: string
  greeting?: string | null
  gender?: string | null
  age?: number | null
  creator_display_name: string
  personality_traits?: {
    tone?: string | null
    formality_level?: string | null
    humor_style?: string | null
    communication_style?: string | null
  } | null
  behavior_settings?: {
    response_length?: string | null
    creativity_level?: string | null
    knowledge_sharing?: string | null
  } | null
  speech_examples?: Array<{ example?: string | null }> | null
  signature_phrases?: Array<{ phrase?: string | null }> | null
  tags?: Array<{ tag?: string | null }> | null
  classifications?: Array<{ classification?: string | null }> | null
}

interface KnowledgeEntryForExport {
  entry: string
  activation_settings?: {
    activation_mode?: string | null
    primary_keys?: Array<{ keyword?: string | null }> | null
  } | null
  positioning?: {
    position?: string | null
    order?: number | null
  } | null
}

export function botToTavernCard(
  bot: BotDataForExport,
  knowledgeEntries?: KnowledgeEntryForExport[],
): TavernCardV2 {
  // Format personality traits into a readable string
  const personalityParts: string[] = []
  if (bot.personality_traits?.tone)
    personalityParts.push(`Tone: ${bot.personality_traits.tone}`)
  if (bot.personality_traits?.formality_level)
    personalityParts.push(`Formality: ${bot.personality_traits.formality_level}`)
  if (bot.personality_traits?.humor_style)
    personalityParts.push(`Humor: ${bot.personality_traits.humor_style}`)
  if (bot.personality_traits?.communication_style)
    personalityParts.push(`Style: ${bot.personality_traits.communication_style}`)
  const personalityString = personalityParts.join('\n')

  // Format speech examples into ST mes_example format
  const mesExamples = (bot.speech_examples || [])
    .filter((ex) => ex.example?.trim())
    .map((ex) => `<START>\n{{char}}: ${ex.example}`)
    .join('\n')

  // Build character book from knowledge entries
  let characterBook: CharacterBook | undefined
  if (knowledgeEntries && knowledgeEntries.length > 0) {
    characterBook = {
      name: `${bot.name}'s Lore`,
      description: 'Knowledge entries exported from BotCafe',
      scan_depth: 2,
      token_budget: 2048,
      recursive_scanning: false,
      extensions: {},
      entries: knowledgeEntries.map((entry, idx) => {
        const keys = extractKeywordsFromEntry(entry)
        const isConstant = entry.activation_settings?.activation_mode === 'constant'
        return {
          keys,
          content: entry.entry,
          extensions: {},
          enabled: entry.activation_settings?.activation_mode !== 'disabled',
          insertion_order: idx,
          name: `Entry ${idx + 1}`,
          priority: 10,
          id: idx,
          constant: isConstant,
          position: mapPosition(entry.positioning?.position),
        } satisfies CharacterBookEntry
      }),
    }
  }

  // Build BotCafe extensions for round-tripping
  const botcafeExtensions: BotCafeExtensions = {
    signature_phrases: (bot.signature_phrases || [])
      .filter((p) => p.phrase?.trim())
      .map((p) => p.phrase!),
    behavior_settings: {
      response_length: bot.behavior_settings?.response_length || undefined,
      creativity_level: bot.behavior_settings?.creativity_level || undefined,
      knowledge_sharing: bot.behavior_settings?.knowledge_sharing || undefined,
    },
    personality_traits: {
      tone: bot.personality_traits?.tone || undefined,
      formality_level: bot.personality_traits?.formality_level || undefined,
      humor_style: bot.personality_traits?.humor_style || undefined,
      communication_style: bot.personality_traits?.communication_style || undefined,
    },
    gender: bot.gender || undefined,
    age: bot.age || undefined,
    classifications: (bot.classifications || [])
      .filter((c) => c.classification)
      .map((c) => c.classification!),
    botcafe_version: '2.0',
  }

  // Build scenario from gender/age
  const scenarioParts: string[] = []
  if (bot.gender) scenarioParts.push(`Gender: ${bot.gender}`)
  if (bot.age) scenarioParts.push(`Age: ${bot.age}`)

  return {
    spec: 'chara_card_v2',
    spec_version: '2.0',
    data: {
      name: bot.name,
      description: bot.description || '',
      personality: personalityString,
      scenario: scenarioParts.join('\n'),
      first_mes: bot.greeting || '',
      mes_example: mesExamples,
      creator_notes: `Exported from BotCafe`,
      system_prompt: bot.system_prompt,
      post_history_instructions: '',
      alternate_greetings: [],
      character_book: characterBook,
      tags: (bot.tags || []).filter((t) => t.tag?.trim()).map((t) => t.tag!),
      creator: bot.creator_display_name,
      character_version: '1.0',
      extensions: {
        botcafe: botcafeExtensions,
      },
    },
  }
}

function extractKeywordsFromEntry(entry: KnowledgeEntryForExport): string[] {
  if (entry.activation_settings?.primary_keys) {
    const keywords = entry.activation_settings.primary_keys
      .filter((k) => k.keyword?.trim())
      .map((k) => k.keyword!)
    if (keywords.length > 0) return keywords
  }
  // Fallback: extract significant words from the entry text
  return (entry.entry || '')
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 5)
}

function mapPosition(
  position?: string | null,
): 'before_char' | 'after_char' | undefined {
  if (position === 'before_character' || position === 'before_examples') return 'before_char'
  if (position === 'after_character' || position === 'after_examples') return 'after_char'
  return 'after_char'
}

// ─── Import: TavernCard -> BotFormData ──────────────────────────────────────

export function tavernCardToBotFormData(
  data: TavernCardV1 | TavernCardV2Data,
  version: 'v1' | 'v2',
): Partial<BotFormData> {
  if (version === 'v1') {
    return tavernCardV1ToBotFormData(data as TavernCardV1)
  }

  const v2data = data as TavernCardV2Data

  // Check for BotCafe extensions (round-trip support)
  const bcExt = v2data.extensions?.botcafe as BotCafeExtensions | undefined

  // Build system_prompt: prefer the card's system_prompt, fall back to combined fields
  let systemPrompt = v2data.system_prompt
  if (!systemPrompt?.trim()) {
    const parts = [v2data.description, v2data.personality, v2data.scenario].filter(Boolean)
    systemPrompt = parts.join('\n\n')
  }

  // Parse mes_example back to speech examples
  const speechExamples = parseMesExamples(v2data.mes_example)

  // Restore personality traits from BotCafe extensions if available
  const personalityTraits = bcExt?.personality_traits || {
    tone: '',
    formality_level: '',
    humor_style: '',
    communication_style: '',
  }

  const behaviorSettings = bcExt?.behavior_settings || {
    response_length: 'medium',
    creativity_level: 'moderate',
    knowledge_sharing: 'balanced',
  }

  // Auto-generate slug from name
  const slug = v2data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  return {
    name: v2data.name,
    description: v2data.description || '',
    system_prompt: systemPrompt || '',
    greeting: v2data.first_mes || '',
    creator_display_name: v2data.creator || '',
    slug,
    gender: bcExt?.gender || '',
    age: bcExt?.age?.toString() || '',
    speech_examples: speechExamples.length > 0 ? speechExamples : [''],
    personality_traits: {
      tone: personalityTraits.tone || '',
      formality_level: personalityTraits.formality_level || '',
      humor_style: personalityTraits.humor_style || '',
      communication_style: personalityTraits.communication_style || '',
    },
    behavior_settings: {
      response_length: behaviorSettings.response_length || 'medium',
      creativity_level: behaviorSettings.creativity_level || 'moderate',
      knowledge_sharing: behaviorSettings.knowledge_sharing || 'balanced',
    },
    signature_phrases:
      bcExt?.signature_phrases && bcExt.signature_phrases.length > 0
        ? bcExt.signature_phrases
        : [''],
    tags: v2data.tags || [],
    classifications: bcExt?.classifications || [],
    is_public: false,
    visibility: 'private' as const,
  }
}

function tavernCardV1ToBotFormData(data: TavernCardV1): Partial<BotFormData> {
  // V1 has no system_prompt field - combine description + personality + scenario
  const systemPrompt = [data.description, data.personality, data.scenario]
    .filter(Boolean)
    .join('\n\n')

  const speechExamples = parseMesExamples(data.mes_example)
  const slug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  return {
    name: data.name,
    description: data.description || '',
    system_prompt: systemPrompt || 'Imported character',
    greeting: data.first_mes || '',
    slug,
    speech_examples: speechExamples.length > 0 ? speechExamples : [''],
    personality_traits: {
      tone: '',
      formality_level: '',
      humor_style: '',
      communication_style: '',
    },
    behavior_settings: {
      response_length: 'medium',
      creativity_level: 'moderate',
      knowledge_sharing: 'balanced',
    },
    signature_phrases: [''],
    tags: [],
    classifications: [],
    is_public: false,
    visibility: 'private' as const,
  }
}

/**
 * Parse SillyTavern mes_example format back to an array of example strings.
 * Format: `<START>\n{{char}}: example text\n<START>\n{{char}}: next example`
 */
function parseMesExamples(mesExample: string): string[] {
  if (!mesExample?.trim()) return []

  // Split on <START> delimiters
  const blocks = mesExample.split(/<START>/i).filter((b) => b.trim())

  return blocks
    .map((block) => {
      // Remove {{char}}: and {{user}}: prefixes, clean up
      return block
        .replace(/\{\{char\}\}:\s*/gi, '')
        .replace(/\{\{user\}\}:\s*/gi, 'User: ')
        .trim()
    })
    .filter((ex) => ex.length > 0)
}
