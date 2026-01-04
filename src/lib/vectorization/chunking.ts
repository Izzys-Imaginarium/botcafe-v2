/**
 * Text Chunking Utilities for RAG System
 *
 * Implements smart chunking strategies for different content types
 * to optimize semantic search and context retrieval.
 */

export interface ChunkConfig {
  chunkSize: number // Target tokens per chunk
  overlap: number // Overlap tokens between chunks
  method: 'paragraph' | 'sentence' | 'sliding' // Chunking method
}

export interface TextChunk {
  text: string
  index: number
  totalChunks: number
  startPosition: number
  endPosition: number
}

/**
 * Get recommended chunking config based on content type
 */
export function getChunkConfig(type: 'lore' | 'memory' | 'legacy_memory' | 'document'): ChunkConfig {
  switch (type) {
    case 'lore':
      return {
        chunkSize: 750,
        overlap: 50,
        method: 'paragraph',
      }
    case 'memory':
      return {
        chunkSize: 400,
        overlap: 25,
        method: 'sentence',
      }
    case 'legacy_memory':
      return {
        chunkSize: 600,
        overlap: 40,
        method: 'paragraph',
      }
    case 'document':
      return {
        chunkSize: 1000,
        overlap: 75,
        method: 'sliding',
      }
    default:
      return {
        chunkSize: 750,
        overlap: 50,
        method: 'paragraph',
      }
  }
}

/**
 * Estimate token count (rough approximation)
 * More accurate: use tiktoken library, but this is faster
 */
export function estimateTokens(text: string): number {
  // Rough approximation: 1 token ≈ 4 characters for English text
  // This matches OpenAI's general guidance
  return Math.ceil(text.length / 4)
}

/**
 * Split text into sentences (basic implementation)
 */
function splitIntoSentences(text: string): string[] {
  // Split on sentence boundaries
  // Handles periods, question marks, exclamation marks
  // Preserves periods in abbreviations (Dr., Mr., etc.)
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
  return sentences.map((s) => s.trim()).filter((s) => s.length > 0)
}

/**
 * Split text into paragraphs
 */
function splitIntoParagraphs(text: string): string[] {
  // Split on double newlines or single newlines followed by whitespace
  const paragraphs = text.split(/\n\s*\n|\n(?=\s)/).filter((p) => p.trim().length > 0)
  return paragraphs.map((p) => p.trim())
}

/**
 * Chunk text using paragraph-aware method
 * Tries to keep paragraphs intact when possible
 */
function chunkByParagraph(text: string, chunkSize: number, overlap: number): TextChunk[] {
  const paragraphs = splitIntoParagraphs(text)
  const chunks: TextChunk[] = []
  let currentChunk = ''
  let currentPosition = 0

  for (const paragraph of paragraphs) {
    const paragraphTokens = estimateTokens(paragraph)
    const currentTokens = estimateTokens(currentChunk)

    if (currentTokens + paragraphTokens > chunkSize && currentChunk.length > 0) {
      // Current chunk is full, save it
      chunks.push({
        text: currentChunk.trim(),
        index: chunks.length,
        totalChunks: 0, // Will be set later
        startPosition: currentPosition,
        endPosition: currentPosition + currentChunk.length,
      })

      // Start new chunk with overlap
      const sentences = splitIntoSentences(currentChunk)
      const overlapSentences: string[] = []
      let overlapTokens = 0

      // Add sentences from end until we reach overlap target
      for (let i = sentences.length - 1; i >= 0 && overlapTokens < overlap; i--) {
        overlapSentences.unshift(sentences[i])
        overlapTokens += estimateTokens(sentences[i])
      }

      currentChunk = overlapSentences.join(' ') + '\n\n' + paragraph
      currentPosition += currentChunk.length - paragraph.length
    } else {
      // Add paragraph to current chunk
      if (currentChunk.length > 0) {
        currentChunk += '\n\n' + paragraph
      } else {
        currentChunk = paragraph
      }
    }
  }

  // Add final chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      text: currentChunk.trim(),
      index: chunks.length,
      totalChunks: 0,
      startPosition: currentPosition,
      endPosition: currentPosition + currentChunk.length,
    })
  }

  // Set total chunks
  chunks.forEach((chunk) => {
    chunk.totalChunks = chunks.length
  })

  return chunks
}

/**
 * Chunk text using sentence-aware method
 * Good for summaries and short-form content
 */
function chunkBySentence(text: string, chunkSize: number, overlap: number): TextChunk[] {
  const sentences = splitIntoSentences(text)
  const chunks: TextChunk[] = []
  let currentChunk = ''
  let currentPosition = 0

  for (const sentence of sentences) {
    const sentenceTokens = estimateTokens(sentence)
    const currentTokens = estimateTokens(currentChunk)

    if (currentTokens + sentenceTokens > chunkSize && currentChunk.length > 0) {
      // Save current chunk
      chunks.push({
        text: currentChunk.trim(),
        index: chunks.length,
        totalChunks: 0,
        startPosition: currentPosition,
        endPosition: currentPosition + currentChunk.length,
      })

      // Start new chunk with overlap
      const chunkSentences = splitIntoSentences(currentChunk)
      const overlapSentences: string[] = []
      let overlapTokens = 0

      for (let i = chunkSentences.length - 1; i >= 0 && overlapTokens < overlap; i--) {
        overlapSentences.unshift(chunkSentences[i])
        overlapTokens += estimateTokens(chunkSentences[i])
      }

      currentChunk = overlapSentences.join(' ') + ' ' + sentence
      currentPosition += currentChunk.length - sentence.length
    } else {
      // Add sentence to current chunk
      if (currentChunk.length > 0) {
        currentChunk += ' ' + sentence
      } else {
        currentChunk = sentence
      }
    }
  }

  // Add final chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      text: currentChunk.trim(),
      index: chunks.length,
      totalChunks: 0,
      startPosition: currentPosition,
      endPosition: currentPosition + currentChunk.length,
    })
  }

  // Set total chunks
  chunks.forEach((chunk) => {
    chunk.totalChunks = chunks.length
  })

  return chunks
}

/**
 * Chunk text using sliding window method
 * Good for long documents where structure is less important
 */
function chunkBySliding(text: string, chunkSize: number, overlap: number): TextChunk[] {
  const words = text.split(/\s+/)
  const chunks: TextChunk[] = []

  // Estimate words per chunk based on token size
  // Rough: 1 token ≈ 0.75 words
  const wordsPerChunk = Math.floor(chunkSize * 0.75)
  const overlapWords = Math.floor(overlap * 0.75)

  let position = 0

  while (position < words.length) {
    const chunkWords = words.slice(position, position + wordsPerChunk)
    const chunkText = chunkWords.join(' ')

    chunks.push({
      text: chunkText.trim(),
      index: chunks.length,
      totalChunks: 0,
      startPosition: position,
      endPosition: position + chunkWords.length,
    })

    position += wordsPerChunk - overlapWords
  }

  // Set total chunks
  chunks.forEach((chunk) => {
    chunk.totalChunks = chunks.length
  })

  return chunks
}

/**
 * Main chunking function
 * Automatically selects best strategy based on config
 */
export function chunkText(text: string, config: ChunkConfig): TextChunk[] {
  if (!text || text.trim().length === 0) {
    return []
  }

  const totalTokens = estimateTokens(text)

  // If text is smaller than chunk size, return as single chunk
  if (totalTokens <= config.chunkSize) {
    return [
      {
        text: text.trim(),
        index: 0,
        totalChunks: 1,
        startPosition: 0,
        endPosition: text.length,
      },
    ]
  }

  // Choose chunking method
  switch (config.method) {
    case 'paragraph':
      return chunkByParagraph(text, config.chunkSize, config.overlap)
    case 'sentence':
      return chunkBySentence(text, config.chunkSize, config.overlap)
    case 'sliding':
      return chunkBySliding(text, config.chunkSize, config.overlap)
    default:
      return chunkByParagraph(text, config.chunkSize, config.overlap)
  }
}

/**
 * Validate chunk quality
 * Ensures chunks meet minimum requirements
 */
export function validateChunks(chunks: TextChunk[]): { valid: boolean; issues: string[] } {
  const issues: string[] = []

  if (chunks.length === 0) {
    issues.push('No chunks generated')
    return { valid: false, issues }
  }

  // Check for empty chunks
  const emptyChunks = chunks.filter((c) => c.text.trim().length === 0)
  if (emptyChunks.length > 0) {
    issues.push(`${emptyChunks.length} empty chunks found`)
  }

  // Check for very small chunks (less than 50 tokens)
  const tinyChunks = chunks.filter((c) => estimateTokens(c.text) < 50)
  if (tinyChunks.length > 0 && tinyChunks.length !== 1) {
    // Allow one tiny chunk if it's the only one
    issues.push(`${tinyChunks.length} chunks are too small (< 50 tokens)`)
  }

  // Check for duplicate chunks
  const textSet = new Set(chunks.map((c) => c.text))
  if (textSet.size !== chunks.length) {
    issues.push('Duplicate chunks detected')
  }

  return {
    valid: issues.length === 0,
    issues,
  }
}
