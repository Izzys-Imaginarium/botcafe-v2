import type { CollectionConfig } from 'payload'

export const ApiKey: CollectionConfig = {
  slug: 'api-key',
  admin: {
    useAsTitle: 'nickname',
    defaultColumns: [
      'user',
      'provider',
      'nickname',
      'key_encryption_level',
      'is_active',
      'last_used',
    ],
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
      name: 'nickname',
      type: 'text',
      required: true,
    },
    {
      name: 'provider',
      type: 'select',
      required: true,
      options: [
        { label: 'OpenAI', value: 'openai' },
        { label: 'Anthropic', value: 'anthropic' },
        { label: 'Google AI', value: 'google' },
        { label: 'DeepSeek', value: 'deepseek' },
        { label: 'OpenRouter', value: 'openrouter' },
        { label: 'Electron Hub', value: 'electronhub' },
      ],
    },
    {
      name: 'key',
      type: 'text',
      required: true,
    },
    {
      name: 'key_configuration',
      type: 'group',
      fields: [
        {
          name: 'model_preferences',
          type: 'array',
          fields: [
            {
              name: 'model',
              type: 'text',
            },
          ],
        },
        {
          name: 'rate_limits',
          type: 'group',
          fields: [
            {
              name: 'requests_per_hour',
              type: 'number',
            },
            {
              name: 'tokens_per_minute',
              type: 'number',
            },
          ],
        },
        {
          name: 'usage_tracking',
          type: 'group',
          fields: [
            {
              name: 'monthly_quota',
              type: 'number',
            },
            {
              name: 'daily_limit',
              type: 'number',
            },
          ],
        },
        {
          name: 'fallback_providers',
          type: 'array',
          fields: [
            {
              name: 'provider_id',
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
          name: 'total_requests',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'total_tokens_used',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'monthly_usage',
          type: 'json',
        },
        {
          name: 'average_response_time',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'error_rate',
          type: 'number',
          defaultValue: 0,
        },
      ],
    },
    {
      name: 'security_features',
      type: 'group',
      fields: [
        {
          name: 'key_encryption_level',
          type: 'select',
          defaultValue: 'basic',
          options: [
            { label: 'Basic', value: 'basic' },
            { label: 'Advanced', value: 'advanced' },
            { label: 'Military-Grade', value: 'military-grade' },
          ],
        },
        {
          name: 'auto_rotation_enabled',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'rotation_schedule',
          type: 'text',
        },
        {
          name: 'last_rotation_date',
          type: 'date',
        },
        {
          name: 'key_expiry_date',
          type: 'date',
        },
        {
          name: 'is_active',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'last_used',
          type: 'date',
        },
      ],
    },
    {
      name: 'provider_specific_settings',
      type: 'group',
      fields: [
        {
          name: 'openai_settings',
          type: 'group',
          fields: [
            {
              name: 'organization_id',
              type: 'text',
            },
            {
              name: 'project_id',
              type: 'text',
            },
          ],
        },
        {
          name: 'anthropic_settings',
          type: 'group',
          fields: [
            {
              name: 'account_preferences',
              type: 'json',
            },
          ],
        },
        {
          name: 'google_settings',
          type: 'group',
          fields: [
            {
              name: 'project_configuration',
              type: 'json',
            },
          ],
        },
        {
          name: 'custom_settings',
          type: 'group',
          fields: [
            {
              name: 'configuration',
              type: 'json',
            },
            {
              name: 'api_endpoint',
              type: 'text',
            },
          ],
        },
      ],
    },
  ],
}
