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
    {
      name: 'privacy_controls',
      type: 'group',
      fields: [
        {
          name: 'privacy_level',
          type: 'select',
          required: true,
          options: [
            { label: 'Private', value: 'private' },
            { label: 'Shared', value: 'shared' },
            { label: 'Public', value: 'public' },
            { label: 'Select People', value: 'select-people' },
          ],
          defaultValue: 'private',
          admin: {
            description: 'Bot visibility and sharing level',
          },
        },
        {
          name: 'allowed_users',
          type: 'relationship',
          relationTo: 'users',
          hasMany: true,
          admin: {
            description: 'Users allowed access when privacy_level is "Select People"',
          },
        },
        {
          name: 'sharing_settings',
          type: 'group',
          fields: [
            {
              name: 'allow_copying',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description: 'Allow users to create copies/forks of this bot',
              },
            },
            {
              name: 'allow_remixing',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description: 'Allow users to remix and modify this bot',
              },
            },
            {
              name: 'share_expiration',
              type: 'date',
              admin: {
                description: 'When sharing access expires (optional)',
              },
            },
            {
              name: 'require_attribution',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                description: 'Require attribution when bot is shared or used',
              },
            },
          ],
        },
        {
          name: 'collaboration_settings',
          type: 'group',
          fields: [
            {
              name: 'allow_collaboration',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description: 'Allow other users to collaborate on this bot',
              },
            },
            {
              name: 'collaborator_permissions',
              type: 'select',
              options: [
                { label: 'Read Only', value: 'read-only' },
                { label: 'Comment', value: 'comment' },
                { label: 'Edit', value: 'edit' },
                { label: 'Full Access', value: 'full' },
              ],
              defaultValue: 'read-only',
            },
            {
              name: 'max_collaborators',
              type: 'number',
              defaultValue: 5,
              admin: {
                description: 'Maximum number of collaborators allowed',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'usage_stats',
      type: 'group',
      fields: [
        {
          name: 'access_count',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
            description: 'Number of times this bot has been accessed',
          },
        },
        {
          name: 'last_accessed',
          type: 'date',
          admin: {
            description: 'Last time this bot was accessed',
          },
        },
        {
          name: 'total_conversations',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
            description: 'Total conversations involving this bot',
          },
        },
      ],
    },
    {
      name: 'featured_status',
      type: 'group',
      fields: [
        {
          name: 'is_featured',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Feature this bot prominently on the platform',
          },
        },
        {
          name: 'featured_reason',
          type: 'textarea',
          admin: {
            description: 'Reason for featuring this bot (admin only)',
          },
        },
        {
          name: 'featured_date',
          type: 'date',
          admin: {
            description: 'Date when bot was featured',
          },
        },
      ],
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, operation }) => {
        if (operation === 'create') {
          console.log(`New bot created: ${doc.name} by user ${doc.user}`)
        }

        // Update usage stats when bot is accessed (would be triggered by access events)
        if (operation === 'update') {
          // This would typically be triggered by bot access events
        }
      },
    ],
  },
}
