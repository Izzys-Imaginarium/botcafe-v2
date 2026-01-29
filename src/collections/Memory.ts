import type { CollectionConfig } from 'payload'

export const Memory: CollectionConfig = {
  slug: 'memory',
  admin: {
    useAsTitle: 'created_timestamp',
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
      name: 'bot',
      type: 'relationship',
      relationTo: 'bot',
      hasMany: true,
      required: true,
      admin: {
        description: 'Bot(s) involved in this memory (supports multi-bot conversations)',
      },
    },
    {
      name: 'persona',
      type: 'relationship',
      relationTo: 'personas',
      hasMany: true,
      admin: {
        description: 'User persona(s) used during this memory',
      },
    },
    {
      name: 'conversation',
      type: 'relationship',
      relationTo: 'conversation',
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
    // RAG System Fields
    {
      name: 'type',
      type: 'select',
      defaultValue: 'short_term',
      options: [
        { label: 'Short Term', value: 'short_term' },
        { label: 'Long Term', value: 'long_term' },
        { label: 'Consolidated', value: 'consolidated' },
      ],
      admin: {
        description: 'Memory type based on summarization level',
      },
    },
    {
      name: 'participants',
      type: 'json',
      admin: {
        description: 'Participants in conversation: { personas: string[], bots: string[] }',
      },
    },
    {
      name: 'is_vectorized',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether memory has been vectorized for RAG',
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
      name: 'converted_to_lore',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether memory has been saved as legacy lore',
      },
    },
    {
      name: 'lore_entry',
      type: 'relationship',
      relationTo: 'knowledge',
      admin: {
        description: 'Link to created lore entry (if converted)',
        condition: (data) => data.converted_to_lore === true,
      },
    },
    {
      name: 'converted_at',
      type: 'date',
      admin: {
        description: 'When converted to lore',
        condition: (data) => data.converted_to_lore === true,
      },
    },
    {
      name: 'importance',
      type: 'number',
      min: 1,
      max: 10,
      defaultValue: 5,
      admin: {
        description: 'Significance rating 1-10',
      },
    },
    {
      name: 'emotional_context',
      type: 'textarea',
      admin: {
        description: 'Mood/emotion tags and context',
      },
    },
  ],
}
