import type { CollectionConfig } from 'payload'

export const VectorRecord: CollectionConfig = {
  slug: 'vectorRecords',
  admin: {
    useAsTitle: 'vector_id',
    description: 'Tracks vector embeddings in Cloudflare Vectorize for D1 coordination',
  },
  access: {
    // Users can only access their own vector records
    read: ({ req: { user } }) => {
      if (!user) return false
      return {
        user_id: {
          equals: user.id,
        },
      }
    },
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => {
      if (!user) return false
      return {
        user_id: {
          equals: user.id,
        },
      }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      return {
        user_id: {
          equals: user.id,
        },
      }
    },
  },
  fields: [
    {
      name: 'vector_id',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Unique ID in Vectorize database',
      },
    },
    {
      name: 'source_type',
      type: 'select',
      required: true,
      options: [
        { label: 'Knowledge', value: 'knowledge' },
        { label: 'Memory', value: 'memory' },
      ],
      index: true,
      admin: {
        description: 'Type of source document',
      },
    },
    {
      name: 'source_id',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'ID of source document in D1',
      },
    },
    {
      name: 'user_id',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      admin: {
        description: 'Owner of this vector',
      },
    },
    {
      name: 'tenant_id',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'Multi-tenant isolation ID',
      },
    },
    {
      name: 'chunk_index',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Position in document (0-based)',
      },
    },
    {
      name: 'total_chunks',
      type: 'number',
      required: true,
      min: 1,
      admin: {
        description: 'Total chunks in document',
      },
    },
    {
      name: 'chunk_text',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Original text of this chunk',
      },
    },
    {
      name: 'metadata',
      type: 'json',
      required: true,
      admin: {
        description: 'Full metadata object for Vectorize (includes type, tags, etc.)',
      },
    },
    {
      name: 'embedding_model',
      type: 'text',
      required: true,
      defaultValue: '@cf/baai/bge-m3',
      admin: {
        description: 'Embedding model used',
      },
    },
    {
      name: 'embedding_dimensions',
      type: 'number',
      required: true,
      defaultValue: 1024,
      admin: {
        description: 'Vector dimensions',
      },
    },
    {
      name: 'embedding',
      type: 'json',
      required: false,
      admin: {
        description: 'Stored embedding vector (JSON array of floats) for future-proofing metadata-only updates',
      },
    },
  ],
  timestamps: true,
}
