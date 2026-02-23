import extractChunks from 'png-chunks-extract'
import encodeChunks from 'png-chunks-encode'
import { encode, decode } from 'png-chunk-text'
import type { TavernCardV2 } from './types'

// Minimal 1x1 transparent PNG (used when bot has no PNG picture)
const MINIMAL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

/**
 * Embed TavernCardV2 data into a PNG file as a tEXt chunk.
 * The data is JSON-stringified, base64-encoded, and stored under keyword 'chara'.
 */
export function embedTavernCardInPng(
  pngBuffer: Buffer | null,
  cardData: TavernCardV2,
): Buffer {
  const sourcePng = pngBuffer && pngBuffer.length > 8 ? pngBuffer : MINIMAL_PNG

  const chunks = extractChunks(new Uint8Array(sourcePng))

  // Remove any existing 'chara' tEXt chunks to avoid duplicates
  const filteredChunks = chunks.filter((chunk) => {
    if (chunk.name !== 'tEXt') return true
    try {
      const decoded = decode(chunk.data)
      return decoded.keyword !== 'chara'
    } catch {
      return true
    }
  })

  // Build new tEXt chunk with base64-encoded JSON
  // encode() returns { name: 'tEXt', data: Uint8Array } — push directly into chunks
  const jsonString = JSON.stringify(cardData)
  const base64Data = Buffer.from(jsonString, 'utf-8').toString('base64')
  const newTextChunk = encode('chara', base64Data)

  // Insert before IEND chunk (last chunk in a valid PNG)
  const iendIndex = filteredChunks.findIndex((c) => c.name === 'IEND')
  if (iendIndex === -1) {
    // If no IEND found, append at the end (shouldn't happen with valid PNGs)
    filteredChunks.push(newTextChunk)
  } else {
    filteredChunks.splice(iendIndex, 0, newTextChunk)
  }

  return Buffer.from(encodeChunks(filteredChunks))
}

/**
 * Get the minimal placeholder PNG buffer.
 * Used when exporting a bot that has no PNG profile picture.
 */
export function getMinimalPng(): Buffer {
  return Buffer.from(MINIMAL_PNG)
}
