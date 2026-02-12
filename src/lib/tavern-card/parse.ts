import extractChunks from 'png-chunks-extract'
import { decode } from 'png-chunk-text'
import type { TavernCardV1, TavernCardV2, TavernCardV2Data, ParsedCardResult } from './types'

/**
 * Extract character card data from a PNG file buffer.
 * Looks for a tEXt chunk with keyword 'chara' containing base64-encoded JSON.
 */
export function extractTavernCardFromPng(pngBuffer: Buffer): ParsedCardResult {
  // Validate PNG magic bytes
  if (
    pngBuffer.length < 8 ||
    pngBuffer[0] !== 0x89 ||
    pngBuffer[1] !== 0x50 ||
    pngBuffer[2] !== 0x4e ||
    pngBuffer[3] !== 0x47
  ) {
    throw new Error('Not a valid PNG file.')
  }

  const chunks = extractChunks(new Uint8Array(pngBuffer))

  // Find tEXt chunk with keyword 'chara'
  const textChunks = chunks.filter((c) => c.name === 'tEXt')

  let charaData: string | null = null
  for (const chunk of textChunks) {
    const decoded = decode(chunk.data)
    if (decoded.keyword === 'chara') {
      charaData = decoded.text
      break
    }
  }

  if (!charaData) {
    throw new Error(
      'No character card data found in this PNG file. Make sure it is a valid SillyTavern character card.',
    )
  }

  // Base64 decode to JSON string
  const jsonString = Buffer.from(charaData, 'base64').toString('utf-8')

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonString)
  } catch {
    throw new Error('The character data in this PNG appears to be corrupted.')
  }

  return classifyAndReturn(parsed, pngBuffer)
}

/**
 * Parse a JSON character card (plain .json file, not embedded in PNG).
 * Supports both V1 flat format and V2 wrapped format.
 */
export function parseCardJson(jsonString: string): ParsedCardResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonString)
  } catch {
    throw new Error('Invalid JSON file. Could not parse character card data.')
  }

  return classifyAndReturn(parsed, null)
}

/**
 * Classify parsed JSON as V1 or V2 and return a ParsedCardResult.
 */
function classifyAndReturn(parsed: unknown, imageBuffer: Buffer | null): ParsedCardResult {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Character card data is not a valid object.')
  }

  const obj = parsed as Record<string, unknown>

  // V2: has spec field and data object
  if (obj.spec === 'chara_card_v2' && obj.data && typeof obj.data === 'object') {
    const v2 = obj as unknown as TavernCardV2
    return { version: 'v2', data: v2.data, imageBuffer }
  }

  // V1: flat structure with at least a name field
  if (typeof obj.name === 'string') {
    const v1: TavernCardV1 = {
      name: (obj.name as string) || '',
      description: (obj.description as string) || '',
      personality: (obj.personality as string) || '',
      scenario: (obj.scenario as string) || '',
      first_mes: (obj.first_mes as string) || '',
      mes_example: (obj.mes_example as string) || '',
    }
    return { version: 'v1', data: v1, imageBuffer }
  }

  throw new Error(
    'Unrecognized character card format. Expected SillyTavern V1 or V2 format.',
  )
}
