import type { CollectionConfig } from 'payload'

export const BotInteraction: CollectionConfig = {
  slug: 'botInteractions',
  admin: {
    useAsTitle: 'id',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'bot',
      type: 'relationship',
      relationTo: 'bot',
      required: true,
      index: true,
    },
    {
      name: 'liked',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'favorited',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'created_date',
      type: 'date',
      defaultValue: () => new Date(),
    },
    {
      name: 'updated_date',
      type: 'date',
      defaultValue: () => new Date(),
      hooks: {
        beforeChange: [
          () => {
            return new Date()
          },
        ],
      },
    },
  ],
}
