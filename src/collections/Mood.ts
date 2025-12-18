import type { CollectionConfig } from 'payload'

export const Mood: CollectionConfig = {
  slug: 'mood',
  admin: {
    useAsTitle: 'timestamp',
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
      name: 'timestamp',
      type: 'date',
      defaultValue: () => new Date(),
    },
    {
      name: 'mood',
      type: 'select',
      required: true,
      options: [
        { label: 'Very Happy', value: 'very-happy' },
        { label: 'Happy', value: 'happy' },
        { label: 'Content', value: 'content' },
        { label: 'Neutral', value: 'neutral' },
        { label: 'Sad', value: 'sad' },
        { label: 'Very Sad', value: 'very-sad' },
        { label: 'Anxious', value: 'anxious' },
        { label: 'Excited', value: 'excited' },
        { label: 'Angry', value: 'angry' },
        { label: 'Frustrated', value: 'frustrated' },
      ],
    },
    {
      name: 'note',
      type: 'textarea',
    },
  ],
}
