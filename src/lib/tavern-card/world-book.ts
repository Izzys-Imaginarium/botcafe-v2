import type { WorldBook, WorldBookEntry } from './types'

/**
 * Parse and validate a SillyTavern World Book JSON file.
 * World Books use a `{ entries: { "0": {...}, "1": {...} } }` structure
 * where each entry has activation keywords, content, and positioning settings.
 */
export function parseWorldBook(json: unknown): WorldBook {
  if (!json || typeof json !== 'object') {
    throw new Error('Invalid World Book: expected a JSON object')
  }

  const obj = json as Record<string, unknown>

  if (!obj.entries || typeof obj.entries !== 'object') {
    throw new Error('Invalid World Book: missing "entries" object')
  }

  const entries = obj.entries as Record<string, unknown>
  const parsedEntries: Record<string, WorldBookEntry> = {}

  for (const [key, value] of Object.entries(entries)) {
    if (!value || typeof value !== 'object') continue
    const raw = value as Record<string, unknown>

    // Validate required fields
    if (typeof raw.content !== 'string') continue

    parsedEntries[key] = {
      uid: typeof raw.uid === 'number' ? raw.uid : parseInt(key) || 0,
      key: parseKeywords(raw.key),
      keysecondary: parseKeywords(raw.keysecondary),
      comment: typeof raw.comment === 'string' ? raw.comment : '',
      content: raw.content as string,
      constant: raw.constant === true,
      vectorized: raw.vectorized === true,
      selective: raw.selective === true,
      selectiveLogic: typeof raw.selectiveLogic === 'number' ? raw.selectiveLogic : 0,
      order: typeof raw.order === 'number' ? raw.order : 100,
      position: typeof raw.position === 'number' ? raw.position : 1,
      disable: raw.disable === true,
      ignoreBudget: raw.ignoreBudget === true,
      excludeRecursion: raw.excludeRecursion === true,
      preventRecursion: raw.preventRecursion === true,
      probability: typeof raw.probability === 'number' ? raw.probability : 100,
      useProbability: raw.useProbability === true,
      depth: typeof raw.depth === 'number' ? raw.depth : 4,
      scanDepth: typeof raw.scanDepth === 'number' ? raw.scanDepth : null,
      caseSensitive: typeof raw.caseSensitive === 'boolean' ? raw.caseSensitive : null,
      matchWholeWords: typeof raw.matchWholeWords === 'boolean' ? raw.matchWholeWords : null,
      sticky: typeof raw.sticky === 'number' ? raw.sticky : 0,
      cooldown: typeof raw.cooldown === 'number' ? raw.cooldown : 0,
      delay: typeof raw.delay === 'number' ? raw.delay : 0,
      role: typeof raw.role === 'number' ? raw.role : null,
      group: typeof raw.group === 'string' ? raw.group : '',
      groupOverride: raw.groupOverride === true,
      groupWeight: typeof raw.groupWeight === 'number' ? raw.groupWeight : 100,
      displayIndex: typeof raw.displayIndex === 'number' ? raw.displayIndex : 0,
      characterFilter: parseCharacterFilter(raw.characterFilter),
      addMemo: raw.addMemo === true,
      matchPersonaDescription: raw.matchPersonaDescription === true,
      matchCharacterDescription: raw.matchCharacterDescription === true,
      matchCharacterPersonality: raw.matchCharacterPersonality === true,
      matchCharacterDepthPrompt: raw.matchCharacterDepthPrompt === true,
      matchScenario: raw.matchScenario === true,
      matchCreatorNotes: raw.matchCreatorNotes === true,
    }
  }

  if (Object.keys(parsedEntries).length === 0) {
    throw new Error('Invalid World Book: no valid entries found')
  }

  return { entries: parsedEntries }
}

/**
 * Parse keywords from a World Book entry, handling both array and comma-separated string formats.
 * Some SillyTavern versions store keys as a comma-separated string instead of an array.
 */
function parseKeywords(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((k): k is string => typeof k === 'string')
  }
  if (typeof raw === 'string' && raw.trim()) {
    return raw.split(',').map(k => k.trim()).filter(Boolean)
  }
  return []
}

function parseCharacterFilter(raw: unknown): WorldBookEntry['characterFilter'] {
  if (!raw || typeof raw !== 'object') {
    return { isExclude: false, names: [], tags: [] }
  }
  const obj = raw as Record<string, unknown>
  return {
    isExclude: obj.isExclude === true,
    names: Array.isArray(obj.names) ? obj.names.filter((n): n is string => typeof n === 'string') : [],
    tags: Array.isArray(obj.tags) ? obj.tags.filter((t): t is string => typeof t === 'string') : [],
  }
}

/**
 * Map World Book numeric position to Knowledge positioning.position string
 */
export function mapWorldBookPosition(position: number): 'before_character' | 'after_character' | 'before_examples' | 'after_examples' | 'at_depth' | 'system_top' | 'system_bottom' {
  switch (position) {
    case 0: return 'before_character'
    case 1: return 'after_character'
    case 2: return 'before_examples'
    case 3: return 'after_examples'
    case 4: return 'at_depth'
    default: return 'after_character'
  }
}

/**
 * Map World Book numeric role to Knowledge positioning.role string
 */
export function mapWorldBookRole(role: number | null): 'system' | 'user' | 'assistant' {
  switch (role) {
    case 0: return 'system'
    case 1: return 'user'
    case 2: return 'assistant'
    default: return 'system'
  }
}

/**
 * Map World Book selectiveLogic number to Knowledge keywords_logic string
 */
export function mapWorldBookSelectiveLogic(logic: number): 'AND_ANY' | 'AND_ALL' | 'NOT_ALL' | 'NOT_ANY' {
  switch (logic) {
    case 0: return 'AND_ANY'
    case 1: return 'AND_ALL'
    case 2: return 'NOT_ALL'
    case 3: return 'NOT_ANY'
    default: return 'AND_ANY'
  }
}

/**
 * Determine the activation mode for a World Book entry based on its settings
 */
export function getWorldBookActivationMode(entry: WorldBookEntry): 'keyword' | 'vector' | 'hybrid' | 'constant' | 'disabled' {
  if (entry.disable) return 'disabled'
  if (entry.constant) return 'constant'
  const hasKeys = entry.key.length > 0
  if (hasKeys && entry.vectorized) return 'hybrid'
  if (hasKeys) return 'keyword'
  if (entry.vectorized) return 'vector'
  return 'keyword' // fallback
}

/**
 * Get a summary of World Book entries for preview display
 */
export function getWorldBookSummary(worldBook: WorldBook): {
  totalEntries: number
  enabledEntries: number
  disabledEntries: number
  entries: Array<{
    uid: number
    comment: string
    keywords: string[]
    enabled: boolean
    mode: string
    displayIndex: number
  }>
} {
  const allEntries = Object.values(worldBook.entries)
  const sorted = [...allEntries].sort((a, b) => a.displayIndex - b.displayIndex)

  return {
    totalEntries: allEntries.length,
    enabledEntries: allEntries.filter(e => !e.disable).length,
    disabledEntries: allEntries.filter(e => e.disable).length,
    entries: sorted.map(entry => ({
      uid: entry.uid,
      comment: entry.comment || `Entry ${entry.uid}`,
      keywords: entry.key.slice(0, 5),
      enabled: !entry.disable,
      mode: getWorldBookActivationMode(entry),
      displayIndex: entry.displayIndex,
    })),
  }
}
