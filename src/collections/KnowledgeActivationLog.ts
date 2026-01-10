import type { CollectionConfig } from 'payload'

export const KnowledgeActivationLog: CollectionConfig = {
  slug: 'knowledgeActivationLog',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['conversation_id', 'knowledge_entry_id', 'activation_method', 'activation_timestamp'],
    description: 'Tracks when and how knowledge entries are activated during conversations',
  },
  access: {
    read: ({ req: { user } }) => {
      // Users can only read their own activation logs
      return {
        'conversation_id.user': {
          equals: user?.id,
        },
      }
    },
    create: () => true, // System can create
    update: () => false, // Logs are immutable
    delete: ({ req: { user } }) => {
      // Users can delete their own logs
      return {
        'conversation_id.user': {
          equals: user?.id,
        },
      }
    },
  },
  fields: [
    {
      name: 'conversation_id',
      type: 'relationship',
      relationTo: 'conversation',
      required: true,
      admin: {
        description: 'The conversation this activation occurred in',
      },
    },
    {
      name: 'message_index',
      type: 'number',
      required: true,
      admin: {
        description: 'Message number in the conversation (0-indexed)',
      },
    },
    {
      name: 'knowledge_entry_id',
      type: 'relationship',
      relationTo: 'knowledge',
      required: true,
      admin: {
        description: 'The knowledge entry that was activated',
      },
    },
    {
      name: 'activation_method',
      type: 'select',
      required: true,
      options: [
        { label: 'Keyword Match', value: 'keyword' },
        { label: 'Vector Similarity', value: 'vector' },
        { label: 'Constant (Always Active)', value: 'constant' },
        { label: 'Manual Override', value: 'manual' },
      ],
      admin: {
        description: 'How this entry was activated',
      },
    },
    {
      name: 'activation_score',
      type: 'number',
      required: true,
      admin: {
        description: 'Score that triggered activation (keyword score or vector similarity)',
      },
    },
    {
      name: 'matched_keywords',
      type: 'array',
      admin: {
        description: 'Keywords that matched (if keyword activation)',
        condition: (data) => data.activation_method === 'keyword',
      },
      fields: [
        {
          name: 'keyword',
          type: 'text',
        },
      ],
    },
    {
      name: 'vector_similarity',
      type: 'number',
      admin: {
        description: 'Similarity score (if vector activation)',
        condition: (data) => data.activation_method === 'vector',
      },
    },
    {
      name: 'position_inserted',
      type: 'text',
      required: true,
      admin: {
        description: 'Where the entry was inserted in the prompt',
      },
    },
    {
      name: 'tokens_used',
      type: 'number',
      required: true,
      admin: {
        description: 'Number of tokens this entry consumed',
      },
    },
    {
      name: 'was_included',
      type: 'checkbox',
      defaultValue: true,
      required: true,
      admin: {
        description: 'Whether entry was actually included (false if budget exceeded)',
      },
    },
    {
      name: 'exclusion_reason',
      type: 'select',
      options: [
        { label: 'Budget Exceeded', value: 'budget_exceeded' },
        { label: 'Group Scoring Lost', value: 'group_scoring_lost' },
        { label: 'Cooldown Active', value: 'cooldown_active' },
        { label: 'Delay Not Met', value: 'delay_not_met' },
        { label: 'Probability Failed', value: 'probability_failed' },
        { label: 'Filter Excluded', value: 'filter_excluded' },
      ],
      admin: {
        description: 'Why entry was excluded (if was_included = false)',
        condition: (data) => data.was_included === false,
      },
    },
    {
      name: 'activation_timestamp',
      type: 'date',
      required: true,
      defaultValue: () => new Date(),
      admin: {
        description: 'When this activation occurred',
      },
    },
  ],
  indexes: [
    {
      fields: {
        conversation_id: 'asc',
        message_index: 'asc',
      },
    },
    {
      fields: {
        knowledge_entry_id: 'asc',
        activation_timestamp: 'desc',
      },
    },
    {
      fields: {
        activation_method: 'asc',
      },
    },
  ],
}
