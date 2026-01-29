import type { CollectionConfig } from 'payload'

export const Conversation: CollectionConfig = {
  slug: 'conversation',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'user', 'conversation_type', 'participant_count', 'last_activity', 'status'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        user: {
          equals: user.id,
        },
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
      name: 'title',
      type: 'text',
      admin: {
        description: 'Custom name for the conversation (optional)',
      },
    },
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
      name: 'conversation_type',
      type: 'select',
      required: true,
      defaultValue: 'single-bot',
      options: [
        { label: 'Single Bot', value: 'single-bot' },
        { label: 'Multi Bot', value: 'multi-bot' },
        { label: 'Group Chat', value: 'group-chat' },
      ],
    },
    {
      name: 'bot_participation',
      type: 'array',
      required: false,
      fields: [
        {
          name: 'bot_id',
          type: 'relationship',
          relationTo: 'bot',
          required: true,
        },
        {
          name: 'joined_at',
          type: 'date',
          defaultValue: () => new Date(),
        },
        {
          name: 'role',
          type: 'select',
          required: true,
          defaultValue: 'secondary',
          options: [
            { label: 'Primary', value: 'primary' },
            { label: 'Secondary', value: 'secondary' },
            { label: 'Moderator', value: 'moderator' },
          ],
        },
        {
          name: 'is_active',
          type: 'checkbox',
          defaultValue: true,
        },
      ],
    },
    // RAG System - Participant Tracking
    {
      name: 'participants',
      type: 'json',
      admin: {
        description: 'Tracks all participants: { personas: string[], bots: string[], primary_persona?: string, persona_changes?: Array<{persona_id, switched_at, message_index}> }',
      },
    },
    {
      name: 'total_tokens',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Running token count for conversation',
      },
    },
    {
      name: 'last_summarized_at',
      type: 'date',
      admin: {
        description: 'When conversation was last summarized',
      },
    },
    {
      name: 'last_summarized_message_index',
      type: 'number',
      admin: {
        description: 'Last message included in summary',
      },
    },
    {
      name: 'requires_summarization',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Flag when token threshold reached',
      },
    },
    {
      name: 'memory_tome',
      type: 'relationship',
      relationTo: 'knowledgeCollections',
      admin: {
        description: 'Knowledge collection (tome) where memories from this conversation are stored',
      },
    },
    {
      name: 'conversation_metadata',
      type: 'group',
      fields: [
        {
          name: 'total_messages',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'participant_count',
          type: 'number',
          defaultValue: 1,
        },
        {
          name: 'last_activity',
          type: 'date',
          defaultValue: () => new Date(),
        },
        {
          name: 'conversation_summary',
          type: 'textarea',
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
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Archived', value: 'archived' },
        { label: 'Muted', value: 'muted' },
        { label: 'Pinned', value: 'pinned' },
      ],
    },
    {
      name: 'conversation_settings',
      type: 'group',
      fields: [
        {
          name: 'allow_file_sharing',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'message_retention_days',
          type: 'number',
          defaultValue: 365,
        },
        {
          name: 'auto_save_conversations',
          type: 'checkbox',
          defaultValue: true,
        },
        // AI Configuration - persisted between sessions
        {
          name: 'api_key_id',
          type: 'number',
          admin: {
            description: 'Selected API key ID for this conversation',
          },
        },
        {
          name: 'model',
          type: 'text',
          admin: {
            description: 'Selected AI model for this conversation',
          },
        },
        {
          name: 'provider',
          type: 'text',
          admin: {
            description: 'AI provider name (e.g., openai, anthropic)',
          },
        },
      ],
    },
  ],
}
