import type { CollectionConfig } from 'payload'

export const Personas: CollectionConfig = {
  slug: 'personas',
  admin: {
    useAsTitle: 'name',
    description: 'User personas for bot interactions - represents how the user wants to be seen by bots',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      // Admins can read all personas
      if (user.role === 'admin') return true
      // Users can only read their own personas
      return {
        user: {
          equals: user.id,
        },
      }
    },
    create: ({ req: { user } }) => {
      if (!user) return false
      // Admins can create personas for any user
      if (user.role === 'admin') return true
      return {
        user: {
          equals: user.id,
        },
      }
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      // Admins can update any persona
      if (user.role === 'admin') return true
      return {
        user: {
          equals: user.id,
        },
      }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      // Admins can delete any persona
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
      name: 'name',
      type: 'text',
      required: true,
      maxLength: 100,
      admin: {
        description: 'The name you want bots to call you',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      maxLength: 500,
      admin: {
        description: 'A brief description of this persona for your reference',
      },
    },
    {
      name: 'gender',
      type: 'select',
      options: [
        { label: 'Male', value: 'male' },
        { label: 'Female', value: 'female' },
        { label: 'Non-binary', value: 'non-binary' },
        { label: 'Prefer not to say', value: 'unspecified' },
        { label: 'Other', value: 'other' },
      ],
      admin: {
        description: 'Your gender identity for this persona',
      },
    },
    {
      name: 'age',
      type: 'number',
      min: 1,
      max: 150,
      admin: {
        description: 'Age of this persona (optional)',
      },
    },
    {
      name: 'pronouns',
      type: 'select',
      options: [
        { label: 'He/Him', value: 'he-him' },
        { label: 'She/Her', value: 'she-her' },
        { label: 'They/Them', value: 'they-them' },
        { label: 'He/They', value: 'he-they' },
        { label: 'She/They', value: 'she-they' },
        { label: 'Any pronouns', value: 'any' },
        { label: 'Other', value: 'other' },
      ],
      admin: {
        description: 'Preferred pronouns for this persona',
      },
    },
    {
      name: 'custom_pronouns',
      type: 'text',
      maxLength: 50,
      admin: {
        description: 'Custom pronouns if "Other" is selected',
        condition: (data) => data?.pronouns === 'other',
      },
    },
    {
      name: 'appearance',
      type: 'group',
      fields: [
        {
          name: 'avatar',
          type: 'upload',
          relationTo: 'media',
        },
      ],
    },
    {
      name: 'interaction_preferences',
      type: 'group',
      fields: [
        {
          name: 'preferred_topics',
          type: 'array',
          fields: [
            {
              name: 'topic',
              type: 'text',
            },
          ],
          admin: {
            description: 'Topics you enjoy discussing',
          },
        },
        {
          name: 'avoid_topics',
          type: 'array',
          fields: [
            {
              name: 'topic',
              type: 'text',
            },
          ],
          admin: {
            description: 'Topics you prefer to avoid',
          },
        },
      ],
    },
    {
      name: 'is_default',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Set as default persona for new conversations',
      },
    },
    {
      name: 'usage_count',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        description: 'Number of times this persona has been used',
      },
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
      name: 'custom_instructions',
      type: 'textarea',
      admin: {
        description: 'Additional context or instructions for bots when using this persona',
      },
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, operation }) => {
        if (operation === 'create') {
          console.log(`New persona created: ${doc.name} by user ${doc.user}`)
        }
      },
    ],
  },
}
