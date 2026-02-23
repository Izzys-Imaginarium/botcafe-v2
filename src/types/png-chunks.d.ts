declare module 'png-chunks-extract' {
  interface PngChunk {
    name: string
    data: Uint8Array
  }
  function extractChunks(data: Uint8Array): PngChunk[]
  export = extractChunks
}

declare module 'png-chunks-encode' {
  interface PngChunk {
    name: string
    data: Uint8Array
  }
  function encodeChunks(chunks: PngChunk[]): Uint8Array
  export = encodeChunks
}

declare module 'png-chunk-text' {
  interface TextChunkData {
    keyword: string
    text: string
  }
  interface PngChunk {
    name: string
    data: Uint8Array
  }
  function encode(keyword: string, text: string): PngChunk
  function decode(data: Uint8Array): TextChunkData
  export { encode, decode }
}
