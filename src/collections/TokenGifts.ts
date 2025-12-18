import type { CollectionConfig } from 'payload'

export const TokenGifts: CollectionConfig = {
  slug: 'tokenGifts',
  admin: {
    useAsTitle: 'message',
  },
  access: {
    read: ({ req: { user } }) => {
      return {
        or: [
          {
            sender: {
              equals: user?.id,
            },
          },
          {
            receiver: {
              equals: user?.id,
            },
          },
        ],
      }
    },
    create: ({ req: { user } }) => {
      return {
        sender: {
          equals: user?.id,
        },
      }
    },
    update: ({ req: { user } }) => {
      return {
        sender: {
          equals: user?.id,
        },
      }
    },
    delete: ({ req: { user } }) => {
      return {
        sender: {
          equals: user?.id,
        },
      }
    },
  },
  fields: [
    {
      name: 'sender',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'receiver',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'message',
      type: 'textarea',
    },
    {
      name: 'tokens',
      type: 'number',
      required: true,
      min: 1,
    },
  ],
}
