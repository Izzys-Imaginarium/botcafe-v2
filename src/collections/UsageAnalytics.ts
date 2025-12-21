import type { CollectionConfig } from 'payload'

export const UsageAnalytics: CollectionConfig = {
  slug: 'usage-analytics',
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
      required: true,
    },
    {
      name: 'session_id',
      type: 'text',
      admin: {
        description: 'Unique session identifier',
      },
    },
    {
      name: 'event_type',
      type: 'select',
      required: true,
      options: [
        { label: 'Page View', value: 'page_view' },
        { label: 'Bot Interaction', value: 'bot_interaction' },
        { label: 'Conversation Start', value: 'conversation_start' },
        { label: 'Conversation End', value: 'conversation_end' },
        { label: 'Message Sent', value: 'message_sent' },
        { label: 'Message Received', value: 'message_received' },
        { label: 'Persona Switch', value: 'persona_switch' },
        { label: 'Bot Creation', value: 'bot_creation' },
        { label: 'Bot Deletion', value: 'bot_deletion' },
        { label: 'Knowledge Upload', value: 'knowledge_upload' },
        { label: 'Settings Change', value: 'settings_change' },
        { label: 'Export Data', value: 'export_data' },
        { label: 'Import Data', value: 'import_data' },
        { label: 'Search Query', value: 'search_query' },
        { label: 'Filter Applied', value: 'filter_applied' },
        { label: 'Sort Applied', value: 'sort_applied' },
        { label: 'Pagination', value: 'pagination' },
        { label: 'Download', value: 'download' },
        { label: 'Upload', value: 'upload' },
        { label: 'Share Action', value: 'share_action' },
        { label: 'Login', value: 'login' },
        { label: 'Logout', value: 'logout' },
        { label: 'Registration', value: 'registration' },
        { label: 'Password Reset', value: 'password_reset' },
        { label: 'Profile Update', value: 'profile_update' },
      ],
    },
    {
      name: 'event_category',
      type: 'select',
      required: true,
      options: [
        { label: 'User Interaction', value: 'user_interaction' },
        { label: 'Bot Management', value: 'bot_management' },
        { label: 'Conversation', value: 'conversation' },
        { label: 'Content', value: 'content' },
        { label: 'System', value: 'system' },
        { label: 'Authentication', value: 'authentication' },
        { label: 'Data Management', value: 'data_management' },
        { label: 'Analytics', value: 'analytics' },
        { label: 'UI/UX', value: 'ui_ux' },
      ],
    },
    {
      name: 'resource_details',
      type: 'group',
      fields: [
        {
          name: 'bot_id',
          type: 'relationship',
          relationTo: 'bot',
          admin: {
            description: 'Related bot (if applicable)',
          },
        },
        {
          name: 'conversation_id',
          type: 'relationship',
          relationTo: 'conversation',
          admin: {
            description: 'Related conversation (if applicable)',
          },
        },
        {
          name: 'persona_id',
          type: 'relationship',
          relationTo: 'personas',
          admin: {
            description: 'Related persona (if applicable)',
          },
        },
        {
          name: 'page_url',
          type: 'text',
          admin: {
            description: 'URL of the page (if applicable)',
          },
        },
        {
          name: 'action_target',
          type: 'text',
          admin: {
            description: 'Element or feature that was interacted with',
          },
        },
      ],
    },
    {
      name: 'performance_metrics',
      type: 'group',
      fields: [
        {
          name: 'response_time_ms',
          type: 'number',
          min: 0,
          admin: {
            description: 'Response time in milliseconds',
          },
        },
        {
          name: 'load_time_ms',
          type: 'number',
          min: 0,
          admin: {
            description: 'Page/feature load time in milliseconds',
          },
        },
        {
          name: 'duration_seconds',
          type: 'number',
          min: 0,
          admin: {
            description: 'Duration of the interaction in seconds',
          },
        },
        {
          name: 'error_occurred',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Whether an error occurred during this event',
          },
        },
        {
          name: 'error_message',
          type: 'textarea',
          admin: {
            description: 'Error message if an error occurred',
          },
        },
      ],
    },
    {
      name: 'context_data',
      type: 'group',
      fields: [
        {
          name: 'user_agent',
          type: 'text',
          admin: {
            description: 'Browser/user agent information',
          },
        },
        {
          name: 'device_type',
          type: 'select',
          options: [
            { label: 'Desktop', value: 'desktop' },
            { label: 'Mobile', value: 'mobile' },
            { label: 'Tablet', value: 'tablet' },
            { label: 'Unknown', value: 'unknown' },
          ],
        },
        {
          name: 'browser',
          type: 'text',
          admin: {
            description: 'Browser name and version',
          },
        },
        {
          name: 'operating_system',
          type: 'text',
          admin: {
            description: 'Operating system information',
          },
        },
        {
          name: 'screen_resolution',
          type: 'text',
          admin: {
            description: 'Screen resolution (e.g., 1920x1080)',
          },
        },
        {
          name: 'referrer',
          type: 'text',
          admin: {
            description: 'URL that referred to this page',
          },
        },
        {
          name: 'ip_address',
          type: 'text',
          admin: {
            description: 'IP address (hashed or masked for privacy)',
          },
        },
      ],
    },
    {
      name: 'custom_properties',
      type: 'group',
      fields: [
        {
          name: 'metadata',
          type: 'json',
          admin: {
            description: 'Additional custom data as JSON',
          },
        },
        {
          name: 'tags',
          type: 'text',
          admin: {
            placeholder: 'tag1, tag2, tag3',
            description: 'Comma-separated custom tags',
          },
        },
        {
          name: 'importance_level',
          type: 'select',
          options: [
            { label: 'Low', value: 'low' },
            { label: 'Normal', value: 'normal' },
            { label: 'High', value: 'high' },
            { label: 'Critical', value: 'critical' },
          ],
          defaultValue: 'normal',
        },
      ],
    },
    {
      name: 'aggregation_ready',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether this event is ready for aggregation',
      },
    },
    {
      name: 'processed_for_aggregation',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether this event has been processed for analytics aggregation',
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        // Add session ID if not provided
        if (!data.session_id && req.user) {
          data.session_id = `session_${req.user.id}_${Date.now()}`
        }
        return data
      },
    ],
  },
}
