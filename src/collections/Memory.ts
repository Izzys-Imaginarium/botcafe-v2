import type { CollectionConfig } from 'payload'

export const Memory: CollectionConfig = {
  slug: 'memory',
  admin: {
    useAsTitle: 'created_timestamp',
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
      required: true,
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
  ],
}
