import type { CollectionConfig } from 'payload'

export const Personas: CollectionConfig = {
  slug: 'personas',
  admin: {
    useAsTitle: 'name',
    description: 'User personas/masks system for bot interactions',
  },
  access: {
    read: ({ req: { user } }) => {
      // Users can read their own personas and public ones
      return {
        or: [
          {
            user: {
              equals: user?.id,
            },
          },
          {
            is_public: {
              equals: true,
            },
          },
        ],
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
      name: 'name',
      type: 'text',
      required: true,
      maxLength: 100,
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      maxLength: 500,
    },
    {
      name: 'personality_traits',
      type: 'group',
      fields: [
        {
          name: 'tone',
          type: 'select',
          options: [
            { label: 'Friendly', value: 'friendly' },
            { label: 'Professional', value: 'professional' },
            { label: 'Playful', value: 'playful' },
            { label: 'Mysterious', value: 'mysterious' },
            { label: 'Wise', value: 'wise' },
            { label: 'Humorous', value: 'humorous' },
            { label: 'Empathetic', value: 'empathetic' },
            { label: 'Authoritative', value: 'authoritative' },
          ],
        },
        {
          name: 'formality_level',
          type: 'select',
          options: [
            { label: 'Very Casual', value: 'very-casual' },
            { label: 'Casual', value: 'casual' },
            { label: 'Neutral', value: 'neutral' },
            { label: 'Formal', value: 'formal' },
            { label: 'Very Formal', value: 'very-formal' },
          ],
        },
        {
          name: 'humor_style',
          type: 'select',
          options: [
            { label: 'None', value: 'none' },
            { label: 'Light', value: 'light' },
            { label: 'Moderate', value: 'moderate' },
            { label: 'Dark', value: 'dark' },
            { label: 'Sarcastic', value: 'sarcastic' },
          ],
        },
        {
          name: 'communication_style',
          type: 'select',
          options: [
            { label: 'Direct', value: 'direct' },
            { label: 'Elaborate', value: 'elaborate' },
            { label: 'Concise', value: 'concise' },
            { label: 'Storytelling', value: 'storytelling' },
            { label: 'Questioning', value: 'questioning' },
          ],
        },
      ],
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
        {
          name: 'visual_theme',
          type: 'select',
          options: [
            { label: 'Classic', value: 'classic' },
            { label: 'Modern', value: 'modern' },
            { label: 'Fantasy', value: 'fantasy' },
            { label: 'Minimalist', value: 'minimalist' },
            { label: 'Vintage', value: 'vintage' },
            { label: 'Futuristic', value: 'futuristic' },
          ],
        },
        {
          name: 'color_scheme',
          type: 'text',
          maxLength: 50,
        },
      ],
    },
    {
      name: 'behavior_settings',
      type: 'group',
      fields: [
        {
          name: 'response_length',
          type: 'select',
          options: [
            { label: 'Very Short', value: 'very-short' },
            { label: 'Short', value: 'short' },
            { label: 'Medium', value: 'medium' },
            { label: 'Long', value: 'long' },
            { label: 'Very Long', value: 'very-long' },
          ],
        },
        {
          name: 'creativity_level',
          type: 'select',
          options: [
            { label: 'Conservative', value: 'conservative' },
            { label: 'Moderate', value: 'moderate' },
            { label: 'Creative', value: 'creative' },
            { label: 'Highly Creative', value: 'highly-creative' },
          ],
        },
        {
          name: 'knowledge_sharing',
          type: 'select',
          options: [
            { label: 'Very Limited', value: 'very-limited' },
            { label: 'Limited', value: 'limited' },
            { label: 'Balanced', value: 'balanced' },
            { label: 'Generous', value: 'generous' },
            { label: 'Very Generous', value: 'very-generous' },
          ],
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
        },
        {
          name: 'conversation_starter',
          type: 'textarea',
          maxLength: 200,
        },
        {
          name: 'signature_phrases',
          type: 'array',
          fields: [
            {
              name: 'phrase',
              type: 'text',
              maxLength: 100,
            },
          ],
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
      name: 'is_public',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Allow other users to view and use this persona',
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
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'tag',
          type: 'text',
        },
      ],
      admin: {
        description: 'Tags to help categorize and find this persona',
      },
    },
    {
      name: 'custom_instructions',
      type: 'textarea',
      admin: {
        description: 'Additional custom instructions for this persona',
      },
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, operation, req }) => {
        // Update usage statistics when persona is created
        if (operation === 'create') {
          console.log(`New persona created: ${doc.name} by user ${doc.user}`)
        }

        // Auto-update modified timestamp
        if (operation === 'update') {
          // This would be handled by the defaultValue, but we can add custom logic here
        }
      },
    ],
  },
}
