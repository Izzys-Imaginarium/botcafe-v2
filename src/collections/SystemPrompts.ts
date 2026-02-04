import type { CollectionConfig } from 'payload'

/**
 * SystemPrompts collection stores configurable prompt templates for chat.
 * Allows admins to modify the base prompts used by bots without code changes.
 */
export const SystemPrompts: CollectionConfig = {
  slug: 'system-prompts',
  admin: {
    useAsTitle: 'name',
    group: 'Settings',
    defaultColumns: ['name', 'promptType', 'isActive', 'updatedAt'],
    description: 'Configure the base prompts used by bots in chat conversations',
  },
  access: {
    // Only admins can modify prompts
    read: ({ req }) => {
      if (req.user?.role === 'admin') return true
      // Allow reading active prompts for system use
      return { isActive: { equals: true } }
    },
    create: ({ req }) => req.user?.role === 'admin',
    update: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Internal name for this prompt template',
      },
    },
    {
      name: 'promptType',
      type: 'select',
      required: true,
      options: [
        { label: 'Roleplay Introduction', value: 'roleplay_intro' },
        { label: 'Knowledge Instructions', value: 'knowledge_instructions' },
        { label: 'Roleplay Guidelines', value: 'roleplay_guidelines' },
        { label: 'Multi-Bot Instructions', value: 'multibot_instructions' },
        { label: 'AI Disclaimer', value: 'ai_disclaimer' },
        { label: 'Custom Section', value: 'custom' },
      ],
      admin: {
        description: 'The type of prompt section this template represents',
      },
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
      admin: {
        description: 'The prompt content. Use {{bot_name}} for bot name placeholder.',
        rows: 15,
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Only active prompts are used. Only one prompt per type can be active.',
      },
    },
    {
      name: 'priority',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Higher priority prompts are used first when multiple active prompts exist',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Internal notes about this prompt version',
        rows: 3,
      },
    },
    {
      name: 'version',
      type: 'text',
      defaultValue: '1.0',
      admin: {
        description: 'Version number for tracking changes',
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        // When activating a prompt, deactivate other prompts of the same type
        if (data?.isActive && data?.promptType && req.payload) {
          await req.payload.update({
            collection: 'system-prompts',
            where: {
              promptType: { equals: data.promptType },
              id: { not_equals: data.id || 0 },
            },
            data: {
              isActive: false,
            },
          })
        }
        return data
      },
    ],
  },
}
