import type { CollectionConfig } from 'payload'

export const KnowledgeCollections: CollectionConfig = {
  slug: 'knowledgeCollections',
  // Disable document locking - causes issues with D1 adapter
  lockDocuments: false,
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['user', 'sharing_level', 'knowledge_count', 'last_updated', 'is_public'],
  },
  access: {
    read: ({ req: { user } }) => {
      return {
        or: [
          {
            user: {
              equals: user?.id,
            },
          },
          {
            'sharing_settings.sharing_level': {
              equals: 'public',
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
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'bot',
      type: 'relationship',
      relationTo: 'bot',
      hasMany: true,
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
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'sharing_settings',
      type: 'group',
      admin: {
        description: 'Control who can access this lore book. Note: Public visibility can only be set via admin panel.',
      },
      fields: [
        {
          name: 'sharing_level',
          type: 'select',
          required: true,
          defaultValue: 'private',
          options: [
            { label: 'Private', value: 'private' },
            { label: 'Shared', value: 'shared' },
            { label: 'Public', value: 'public' },
          ],
          admin: {
            description: 'Private: Only you. Shared: Specific users via AccessControl. Public: Anyone (admin-only).',
          },
        },
        {
          name: 'allow_collaboration',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'allow_fork',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'sharing_expiration',
          type: 'date',
        },
        {
          name: 'share_password',
          type: 'text',
        },
        {
          name: 'collaboration_requests',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'knowledge_count',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'last_updated',
          type: 'date',
          defaultValue: () => new Date(),
        },
        {
          name: 'is_public',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
    {
      name: 'collaborators',
      type: 'group',
      admin: {
        description: 'DEPRECATED: Use AccessControl collection for managing collaborators. This field is kept for backwards compatibility.',
        condition: () => false, // Hide from admin UI
      },
      fields: [
        {
          name: 'collab_user_ids',
          type: 'array',
          fields: [
            {
              name: 'user_id',
              type: 'number',
            },
          ],
        },
        {
          name: 'collab_perms',
          type: 'array',
          fields: [
            {
              name: 'perm',
              type: 'select',
              options: [
                { label: 'Read', value: 'read' },
                { label: 'Write', value: 'write' },
                { label: 'Admin', value: 'admin' },
              ],
            },
          ],
        },
        {
          name: 'invited_by_user',
          type: 'number',
        },
        {
          name: 'invited_at',
          type: 'date',
          defaultValue: () => new Date(),
        },
        {
          name: 'collab_notes',
          type: 'textarea',
        },
      ],
    },
    {
      name: 'collection_metadata',
      type: 'group',
      fields: [
        {
          name: 'total_size_bytes',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'total_words',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'average_quality_score',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'collection_category',
          type: 'text',
        },
        {
          name: 'difficulty_level',
          type: 'select',
          defaultValue: 'intermediate',
          options: [
            { label: 'Beginner', value: 'beginner' },
            { label: 'Intermediate', value: 'intermediate' },
            { label: 'Advanced', value: 'advanced' },
            { label: 'Expert', value: 'expert' },
          ],
        },
        {
          name: 'language',
          type: 'text',
          defaultValue: 'en',
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
        },
      ],
    },
    {
      name: 'usage_analytics',
      type: 'group',
      fields: [
        {
          name: 'view_count',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'fork_count',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'collaboration_count',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'last_viewed',
          type: 'date',
        },
        {
          name: 'popularity_score',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'rating',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'review_count',
          type: 'number',
          defaultValue: 0,
        },
      ],
    },
  ],
}
