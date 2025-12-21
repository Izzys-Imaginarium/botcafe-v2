import type { CollectionConfig } from 'payload'

export const Knowledge: CollectionConfig = {
  slug: 'knowledge',
  admin: {
    useAsTitle: 'entry',
    defaultColumns: ['user', 'type', 'privacy_level', 'access_count', 'last_accessed'],
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
            'privacy_settings.privacy_level': {
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
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Document', value: 'document' },
        { label: 'URL', value: 'url' },
        { label: 'Text', value: 'text' },
        { label: 'Image', value: 'image' },
        { label: 'Audio', value: 'audio' },
        { label: 'Video', value: 'video' },
        { label: 'Code', value: 'code' },
      ],
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
    {
      name: 'knowledge_collection',
      type: 'relationship',
      relationTo: 'knowledgeCollections',
      required: true,
    },
    {
      name: 'privacy_settings',
      type: 'group',
      fields: [
        {
          name: 'privacy_level',
          type: 'select',
          required: true,
          defaultValue: 'private',
          options: [
            { label: 'Private', value: 'private' },
            { label: 'Shared', value: 'shared' },
            { label: 'Public', value: 'public' },
          ],
        },
        {
          name: 'allow_sharing',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'share_expiration',
          type: 'date',
        },
        {
          name: 'password_protected',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'share_password',
          type: 'text',
        },
        {
          name: 'access_count',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'last_accessed',
          type: 'date',
        },
      ],
    },
    {
      name: 'shared_access',
      type: 'group',
      fields: [
        {
          name: 'shared_with_user_ids',
          type: 'array',
          fields: [
            {
              name: 'user_id',
              type: 'number',
            },
          ],
        },
        {
          name: 'permissions',
          type: 'array',
          fields: [
            {
              name: 'permission',
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
          name: 'shared_by_user_id',
          type: 'number',
        },
        {
          name: 'shared_at',
          type: 'date',
          defaultValue: () => new Date(),
        },
        {
          name: 'sharing_notes',
          type: 'textarea',
        },
      ],
    },
    {
      name: 'content_metadata',
      type: 'group',
      fields: [
        {
          name: 'source_url',
          type: 'text',
        },
        {
          name: 'author',
          type: 'text',
        },
        {
          name: 'language',
          type: 'text',
        },
        {
          name: 'word_count',
          type: 'number',
        },
        {
          name: 'reading_time_minutes',
          type: 'number',
        },
        {
          name: 'content_hash',
          type: 'text',
        },
        {
          name: 'processing_status',
          type: 'select',
          defaultValue: 'pending',
          options: [
            { label: 'Pending', value: 'pending' },
            { label: 'Processing', value: 'processing' },
            { label: 'Completed', value: 'completed' },
            { label: 'Failed', value: 'failed' },
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
          name: 'search_count',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: '引用_count',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'last_searched',
          type: 'date',
        },
        {
          name: 'popularity_score',
          type: 'number',
          defaultValue: 0,
        },
      ],
    },
  ],
}
