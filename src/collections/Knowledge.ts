import type { CollectionConfig } from 'payload'

export const Knowledge: CollectionConfig = {
  slug: 'knowledge',
  // Disable document locking - causes issues with D1 adapter
  lockDocuments: false,
  admin: {
    useAsTitle: 'entry',
    defaultColumns: ['user', 'type', 'privacy_level', 'access_count', 'last_accessed'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        or: [
          {
            user: {
              equals: user.id,
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
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        user: {
          equals: user.id,
        },
      }
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        user: {
          equals: user.id,
        },
      }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        user: {
          equals: user.id,
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
      // Not required — ON DELETE SET NULL needs the column to be nullable
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
          name: 'citation_count',
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
    // Hybrid Activation System Fields
    {
      name: 'activation_settings',
      type: 'group',
      admin: {
        description: 'Control how this knowledge entry is activated during conversations',
      },
      fields: [
        {
          name: 'activation_mode',
          type: 'select',
          required: true,
          defaultValue: 'vector',
          admin: {
            description: 'How this entry should be activated',
          },
          options: [
            { label: 'Keyword Only', value: 'keyword' },
            { label: 'Vector Only (Semantic)', value: 'vector' },
            { label: 'Hybrid (Keyword OR Vector)', value: 'hybrid' },
            { label: 'Constant (Always Active)', value: 'constant' },
            { label: 'Disabled', value: 'disabled' },
          ],
        },
        {
          name: 'primary_keys',
          type: 'array',
          admin: {
            description: 'Primary keywords that trigger this entry',
            condition: (data, siblingData) =>
              siblingData?.activation_mode === 'keyword' ||
              siblingData?.activation_mode === 'hybrid',
          },
          fields: [
            {
              name: 'keyword',
              type: 'text',
            },
          ],
        },
        {
          name: 'secondary_keys',
          type: 'array',
          admin: {
            description: 'Secondary keywords (lower weight)',
            condition: (data, siblingData) =>
              siblingData?.activation_mode === 'keyword' ||
              siblingData?.activation_mode === 'hybrid',
          },
          fields: [
            {
              name: 'keyword',
              type: 'text',
            },
          ],
        },
        {
          name: 'keywords_logic',
          type: 'select',
          defaultValue: 'AND_ANY',
          admin: {
            description: 'How to combine keywords',
            condition: (data, siblingData) =>
              siblingData?.activation_mode === 'keyword' ||
              siblingData?.activation_mode === 'hybrid',
          },
          options: [
            { label: 'Any primary OR any secondary', value: 'AND_ANY' },
            { label: 'All primary AND all secondary', value: 'AND_ALL' },
            { label: 'NOT all (exclude if all match)', value: 'NOT_ALL' },
            { label: 'NOT any (exclude if any match)', value: 'NOT_ANY' },
          ],
        },
        {
          name: 'case_sensitive',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            condition: (data, siblingData) =>
              siblingData?.activation_mode === 'keyword' ||
              siblingData?.activation_mode === 'hybrid',
          },
        },
        {
          name: 'match_whole_words',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            condition: (data, siblingData) =>
              siblingData?.activation_mode === 'keyword' ||
              siblingData?.activation_mode === 'hybrid',
          },
        },
        {
          name: 'use_regex',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Treat keywords as regex patterns (advanced)',
            condition: (data, siblingData) =>
              siblingData?.activation_mode === 'keyword' ||
              siblingData?.activation_mode === 'hybrid',
          },
        },
        {
          name: 'vector_similarity_threshold',
          type: 'number',
          defaultValue: 0.4,
          min: 0,
          max: 1,
          admin: {
            description: 'Minimum similarity score (0.0-1.0)',
            condition: (data, siblingData) =>
              siblingData?.activation_mode === 'vector' ||
              siblingData?.activation_mode === 'hybrid',
          },
        },
        {
          name: 'max_vector_results',
          type: 'number',
          defaultValue: 5,
          min: 1,
          max: 20,
          admin: {
            description: 'Maximum results from vector search',
            condition: (data, siblingData) =>
              siblingData?.activation_mode === 'vector' ||
              siblingData?.activation_mode === 'hybrid',
          },
        },
        {
          name: 'probability',
          type: 'number',
          defaultValue: 100,
          min: 0,
          max: 100,
          admin: {
            description: 'Activation probability (0-100%)',
          },
        },
        {
          name: 'use_probability',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Enable probability-based activation',
          },
        },
        {
          name: 'scan_depth',
          type: 'number',
          defaultValue: 2,
          min: 1,
          max: 20,
          admin: {
            description: 'How many recent messages to scan for keywords',
            condition: (data, siblingData) =>
              siblingData?.activation_mode === 'keyword' ||
              siblingData?.activation_mode === 'hybrid',
          },
        },
        {
          name: 'match_in_user_messages',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            condition: (data, siblingData) =>
              siblingData?.activation_mode === 'keyword' ||
              siblingData?.activation_mode === 'hybrid',
          },
        },
        {
          name: 'match_in_bot_messages',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            condition: (data, siblingData) =>
              siblingData?.activation_mode === 'keyword' ||
              siblingData?.activation_mode === 'hybrid',
          },
        },
        {
          name: 'match_in_system_prompts',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            condition: (data, siblingData) =>
              siblingData?.activation_mode === 'keyword' ||
              siblingData?.activation_mode === 'hybrid',
          },
        },
      ],
    },
    {
      name: 'positioning',
      type: 'group',
      admin: {
        description: 'Control where this entry is inserted in the prompt',
      },
      fields: [
        {
          name: 'position',
          type: 'select',
          defaultValue: 'before_character',
          required: true,
          options: [
            { label: 'Before Character Description', value: 'before_character' },
            { label: 'After Character Description', value: 'after_character' },
            { label: 'Before Examples', value: 'before_examples' },
            { label: 'After Examples', value: 'after_examples' },
            { label: 'At Specific Depth', value: 'at_depth' },
            { label: 'System Messages Top', value: 'system_top' },
            { label: 'System Messages Bottom', value: 'system_bottom' },
          ],
        },
        {
          name: 'depth',
          type: 'number',
          defaultValue: 0,
          min: 0,
          max: 100,
          admin: {
            description: 'Depth in conversation history (0 = most recent)',
            condition: (data, siblingData) => siblingData?.position === 'at_depth',
          },
        },
        {
          name: 'role',
          type: 'select',
          defaultValue: 'system',
          admin: {
            description: 'Message role for depth insertion',
            condition: (data, siblingData) => siblingData?.position === 'at_depth',
          },
          options: [
            { label: 'System', value: 'system' },
            { label: 'User', value: 'user' },
            { label: 'Assistant', value: 'assistant' },
          ],
        },
        {
          name: 'order',
          type: 'number',
          defaultValue: 100,
          min: 0,
          max: 1000,
          admin: {
            description: 'Priority (higher = inserted first)',
          },
        },
      ],
    },
    {
      name: 'advanced_activation',
      type: 'group',
      admin: {
        description: 'Timed effects and advanced activation controls',
      },
      fields: [
        {
          name: 'sticky',
          type: 'number',
          defaultValue: 0,
          min: 0,
          max: 50,
          admin: {
            description: 'Stay active for N messages after activation',
          },
        },
        {
          name: 'cooldown',
          type: 'number',
          defaultValue: 0,
          min: 0,
          max: 50,
          admin: {
            description: 'Cooldown for N messages after deactivation',
          },
        },
        {
          name: 'delay',
          type: 'number',
          defaultValue: 0,
          min: 0,
          max: 100,
          admin: {
            description: 'Only activate after message N in conversation',
          },
        },
      ],
    },
    {
      name: 'filtering',
      type: 'group',
      admin: {
        description: 'Filter which bots/personas can activate this entry',
      },
      fields: [
        {
          name: 'filter_by_bots',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Enable bot-specific filtering',
          },
        },
        {
          name: 'allowed_bot_ids',
          type: 'array',
          admin: {
            description: 'Only activate for these bots (leave empty for all)',
            condition: (data, siblingData) => siblingData?.filter_by_bots === true,
          },
          fields: [
            {
              name: 'bot_id',
              type: 'number',
            },
          ],
        },
        {
          name: 'excluded_bot_ids',
          type: 'array',
          admin: {
            description: 'Never activate for these bots',
            condition: (data, siblingData) => siblingData?.filter_by_bots === true,
          },
          fields: [
            {
              name: 'bot_id',
              type: 'number',
            },
          ],
        },
        {
          name: 'filter_by_personas',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Enable persona-specific filtering',
          },
        },
        {
          name: 'allowed_persona_ids',
          type: 'array',
          admin: {
            description: 'Only activate for these personas',
            condition: (data, siblingData) => siblingData?.filter_by_personas === true,
          },
          fields: [
            {
              name: 'persona_id',
              type: 'number',
            },
          ],
        },
        {
          name: 'excluded_persona_ids',
          type: 'array',
          admin: {
            description: 'Never activate for these personas',
            condition: (data, siblingData) => siblingData?.filter_by_personas === true,
          },
          fields: [
            {
              name: 'persona_id',
              type: 'number',
            },
          ],
        },
        {
          name: 'match_bot_description',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Match keywords in bot description',
          },
        },
        {
          name: 'match_bot_personality',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Match keywords in bot personality',
          },
        },
        {
          name: 'match_persona_description',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Match keywords in persona description',
          },
        },
      ],
    },
    {
      name: 'budget_control',
      type: 'group',
      admin: {
        description: 'Token budget management',
      },
      fields: [
        {
          name: 'ignore_budget',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Always include this entry even if budget is exhausted',
          },
        },
        {
          name: 'token_cost',
          type: 'number',
          defaultValue: 0,
          admin: {
            description: 'Token count (auto-calculated)',
            readOnly: true,
          },
        },
        {
          name: 'max_tokens',
          type: 'number',
          defaultValue: 1000,
          min: 0,
          max: 8000,
          admin: {
            description: 'Maximum tokens this entry can use',
          },
        },
      ],
    },
  ],
}
