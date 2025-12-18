import type { CollectionConfig } from 'payload'

export const ApiKey: CollectionConfig = {
  slug: 'api-key',
  admin: {
    useAsTitle: 'nickname',
  },
  access: {
    read: ({ req: { user } }) => {
      return {
        user: {
          equals: user?.id,
        },
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
      name: 'nickname',
      type: 'text',
      required: true,
    },
    {
      name: 'provider',
      type: 'select',
      required: true,
      options: [
        { label: 'OpenAI', value: 'openai' },
        { label: 'Anthropic', value: 'anthropic' },
        { label: 'Google AI', value: 'google' },
        { label: 'Hugging Face', value: 'huggingface' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'key',
      type: 'text',
      required: true,
    },
  ],
}
