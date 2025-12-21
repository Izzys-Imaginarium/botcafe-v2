import type { CollectionConfig } from 'payload'

export const Message: CollectionConfig = {
  slug: 'message',
  admin: {
    useAsTitle: 'created_timestamp',
    defaultColumns: ['user', 'message_type', 'conversation', 'is_ai_generated', 'delivery_status'],
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
      name: 'conversation',
      type: 'relationship',
      relationTo: 'conversation',
      required: true,
    },
    {
      name: 'message_type',
      type: 'select',
      required: true,
      defaultValue: 'text',
      options: [
        { label: 'Text', value: 'text' },
        { label: 'Image', value: 'image' },
        { label: 'File', value: 'file' },
        { label: 'System', value: 'system' },
        { label: 'Voice', value: 'voice' },
        { label: 'Code', value: 'code' },
      ],
    },
    {
      name: 'bot',
      type: 'relationship',
      relationTo: 'bot',
      required: false,
    },
    {
      name: 'message_attribution',
      type: 'group',
      fields: [
        {
          name: 'source_bot_id',
          type: 'relationship',
          relationTo: 'bot',
          required: false,
        },
        {
          name: 'is_ai_generated',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'model_used',
          type: 'text',
        },
        {
          name: 'confidence_score',
          type: 'number',
          min: 0,
          max: 1,
        },
      ],
    },
    {
      name: 'message_content',
      type: 'group',
      fields: [
        {
          name: 'text_content',
          type: 'richText',
        },
        {
          name: 'media_attachments',
          type: 'relationship',
          relationTo: 'media',
          hasMany: true,
        },
        {
          name: 'code_snippets',
          type: 'array',
          fields: [
            {
              name: 'language',
              type: 'text',
              required: true,
            },
            {
              name: 'code',
              type: 'textarea',
              required: true,
            },
            {
              name: 'filename',
              type: 'text',
            },
          ],
        },
        {
          name: 'reactions',
          type: 'json',
        },
      ],
    },
    {
      name: 'message_thread',
      type: 'group',
      fields: [
        {
          name: 'reply_to_id',
          type: 'relationship',
          relationTo: 'message',
        },
        {
          name: 'thread_depth',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'is_thread_parent',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
    {
      name: 'token_tracking',
      type: 'group',
      fields: [
        {
          name: 'input_tokens',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'output_tokens',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'total_tokens',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'cost_estimate',
          type: 'number',
          defaultValue: 0,
        },
      ],
    },
    {
      name: 'byo_key',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'message_status',
      type: 'group',
      fields: [
        {
          name: 'delivery_status',
          type: 'select',
          defaultValue: 'sent',
          options: [
            { label: 'Sent', value: 'sent' },
            { label: 'Delivered', value: 'delivered' },
            { label: 'Read', value: 'read' },
            { label: 'Failed', value: 'failed' },
          ],
        },
        {
          name: 'edit_history',
          type: 'array',
          fields: [
            {
              name: 'previous_content',
              type: 'textarea',
              required: true,
            },
            {
              name: 'edited_at',
              type: 'date',
              required: true,
            },
            {
              name: 'edit_reason',
              type: 'text',
            },
          ],
        },
        {
          name: 'is_edited',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'edited_at',
          type: 'date',
        },
      ],
    },
    {
      name: 'entry',
      type: 'textarea',
      required: true,
    },
    {
      name: 'metadata',
      type: 'group',
      fields: [
        {
          name: 'processing_time_ms',
          type: 'number',
        },
        {
          name: 'priority_level',
          type: 'select',
          defaultValue: 'normal',
          options: [
            { label: 'Low', value: 'low' },
            { label: 'Normal', value: 'normal' },
            { label: 'High', value: 'high' },
            { label: 'Urgent', value: 'urgent' },
          ],
        },
        {
          name: 'sensitivity_level',
          type: 'select',
          defaultValue: 'private',
          options: [
            { label: 'Public', value: 'public' },
            { label: 'Private', value: 'private' },
            { label: 'Confidential', value: 'confidential' },
          ],
        },
      ],
    },
  ],
}
