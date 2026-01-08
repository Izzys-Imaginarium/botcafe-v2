import type { CollectionConfig } from 'payload'

export const Knowledge: CollectionConfig = {
  slug: 'knowledge',
  admin: {
    useAsTitle: 'entry',
    defaultColumns: ['user', 'type', 'privacy_level', 'access_count', 'last_accessed'],
  },
  access: {
    read: ({ req: { user } }) => {
      return {
        or: [
          {
            user: {
              equals: user?.id,
            },
          },
          {
            'privacy_settings.privacy_level': {
              equals: 'public',
            },
          },
        ],
      }
    },
    create: ({ req: { user } }) => {
      return {
        user: {
          equals: user?.id,
        },
      }
    },
    update: ({ req: { user } }) => {
      return {
        user: {
          equals: user?.id,
        },
      }
    },
    delete: ({ req: { user } }) => {
      return {
        user: {
          equals: user?.id,
        },
      }
    },
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'created_timestamp',
      type: 'date',
      defaultValue: () => new Date(),
    },
    {
      name: 'modified_timestamp',
      type: 'date',
      defaultValue: () => new Date(),
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Document', value: 'document' },
        { label: 'URL', value: 'url' },
        { label: 'Text', value: 'text' },
        { label: 'Image', value: 'image' },
        { label: 'Audio', value: 'audio' },
        { label: 'Video', value: 'video' },
        { label: 'Legacy Memory', value: 'legacy_memory' },
      ],
    },
    {
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'tag',
          type: 'text',
        },
      ],
    },
    {
      name: 'tokens',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'entry',
      type: 'textarea',
      required: true,
    },
    {
      name: 'knowledge_collection',
      type: 'relationship',
      relationTo: 'knowledgeCollections',
      required: true,
    },
    // RAG System Fields
    {
      name: 'is_legacy_memory',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether this is a converted memory from conversations',
      },
    },
    {
      name: 'source_memory_id',
      type: 'relationship',
      relationTo: 'memory',
      admin: {
        description: 'Link to original Memory record (for legacy memories)',
        condition: (data) => data.is_legacy_memory === true,
      },
    },
    {
      name: 'source_conversation_id',
      type: 'relationship',
      relationTo: 'conversation',
      admin: {
        description: 'Link to original Conversation (for legacy memories)',
        condition: (data) => data.is_legacy_memory === true,
      },
    },
    {
      name: 'original_participants',
      type: 'json',
      admin: {
        description: 'Original participants: { personas: string[], bots: string[] }',
        condition: (data) => data.is_legacy_memory === true,
      },
    },
    {
      name: 'memory_date_range',
      type: 'json',
      admin: {
        description: 'Date range of original conversation: { start: timestamp, end: timestamp }',
        condition: (data) => data.is_legacy_memory === true,
      },
    },
    {
      name: 'applies_to_bots',
      type: 'relationship',
      relationTo: 'bot',
      hasMany: true,
      admin: {
        description: 'Bots this knowledge applies to',
      },
    },
    {
      name: 'applies_to_personas',
      type: 'relationship',
      relationTo: 'personas',
      hasMany: true,
      admin: {
        description: 'Personas this knowledge applies to (for legacy memories)',
        condition: (data) => data.is_legacy_memory === true,
      },
    },
    {
      name: 'is_vectorized',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether content has been vectorized for RAG',
      },
    },
    {
      name: 'vector_records',
      type: 'relationship',
      relationTo: 'vectorRecords',
      hasMany: true,
      admin: {
        description: 'Links to vector chunks in Vectorize',
        condition: (data) => data.is_vectorized === true,
      },
    },
    {
      name: 'chunk_count',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Number of chunks created during vectorization',
      },
    },
    {
      name: 'r2_file_key',
      type: 'text',
      admin: {
        description: 'R2 object storage key for uploaded files',
      },
    },
    {
      name: 'privacy_settings',
      type: 'group',
      fields: [
        {
          name: 'privacy_level',
          type: 'select',
          required: true,
          defaultValue: 'private',
          options: [
            { label: 'Private', value: 'private' },
            { label: 'Shared', value: 'shared' },
            { label: 'Public', value: 'public' },
          ],
        },
        {
          name: 'allow_sharing',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'share_expiration',
          type: 'date',
        },
        {
          name: 'password_protected',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'share_password',
          type: 'text',
        },
        {
          name: 'access_count',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'last_accessed',
          type: 'date',
        },
      ],
    },
    {
      name: 'shared_access',
      type: 'group',
      fields: [
        {
          name: 'shared_with_user_ids',
          type: 'array',
          fields: [
            {
              name: 'user_id',
              type: 'number',
            },
          ],
        },
        {
          name: 'permissions',
          type: 'array',
          fields: [
            {
              name: 'permission',
              type: 'select',
              options: [
                { label: 'Read', value: 'read' },
                { label: 'Write', value: 'write' },
                { label: 'Admin', value: 'admin' },
              ],
            },
          ],
        },
        {
          name: 'shared_by_user_id',
          type: 'number',
        },
        {
          name: 'shared_at',
          type: 'date',
          defaultValue: () => new Date(),
        },
        {
          name: 'sharing_notes',
          type: 'textarea',
        },
      ],
    },
    {
      name: 'content_metadata',
      type: 'group',
      fields: [
        {
          name: 'source_url',
          type: 'text',
        },
        {
          name: 'author',
          type: 'text',
        },
        {
          name: 'language',
          type: 'text',
        },
        {
          name: 'word_count',
          type: 'number',
        },
        {
          name: 'reading_time_minutes',
          type: 'number',
        },
        {
          name: 'content_hash',
          type: 'text',
        },
        {
          name: 'processing_status',
          type: 'select',
          defaultValue: 'pending',
          options: [
            { label: 'Pending', value: 'pending' },
            { label: 'Processing', value: 'processing' },
            { label: 'Completed', value: 'completed' },
            { label: 'Failed', value: 'failed' },
          ],
        },
      ],
    },
    {
      name: 'usage_analytics',
      type: 'group',
      fields: [
        {
          name: 'view_count',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'search_count',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: '引用_count',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'last_searched',
          type: 'date',
        },
        {
          name: 'popularity_score',
          type: 'number',
          defaultValue: 0,
        },
      ],
    },
  ],
}
