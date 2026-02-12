// Lightweight types for the export-card route to avoid importing full Payload generated types

export interface KnowledgeCollectionDoc {
  id: number | string
  name: string
}

export interface KnowledgeDoc {
  id: number | string
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
