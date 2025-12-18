import type { CollectionConfig } from 'payload'

export const Bot: CollectionConfig = {
  slug: 'bot',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'created_date',
      type: 'date',
      defaultValue: () => new Date(),
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'picture',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'gender',
      type: 'select',
      options: [
        { label: 'Male', value: 'male' },
        { label: 'Female', value: 'female' },
        { label: 'Non-binary', value: 'non-binary' },
        { label: 'Other', value: 'other' },
        { label: 'Prefer not to say', value: 'prefer-not-to-say' },
      ],
    },
    {
      name: 'age',
      type: 'number',
      min: 1,
      max: 200,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'system_prompt',
      type: 'textarea',
      required: true,
    },
    {
      name: 'is_public',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'greeting',
      type: 'textarea',
    },
    {
      name: 'speech_examples',
      type: 'array',
      fields: [
        {
          name: 'example',
          type: 'text',
        },
      ],
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      required: true,
    },
    {
      name: 'knowledge_collections',
      type: 'relationship',
      relationTo: 'knowledgeCollections',
      hasMany: true,
    },
  ],
}
