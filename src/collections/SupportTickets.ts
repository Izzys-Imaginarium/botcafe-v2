import type { CollectionConfig } from 'payload'

export const SupportTickets: CollectionConfig = {
  slug: 'support-tickets',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'priority', 'category', 'createdAt'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Account Issues', value: 'account-issues' },
        { label: 'Bot Creation', value: 'bot-creation' },
        { label: 'Bot Management', value: 'bot-management' },
        { label: 'Knowledge Base', value: 'knowledge-base' },
        { label: 'Payment & Billing', value: 'payment-billing' },
        { label: 'Technical Issues', value: 'technical-issues' },
        { label: 'Feature Requests', value: 'feature-requests' },
        { label: 'Bug Reports', value: 'bug-reports' },
        { label: 'API Support', value: 'api-support' },
        { label: 'Integration Help', value: 'integration-help' },
        { label: 'Performance Issues', value: 'performance-issues' },
        { label: 'Security Concerns', value: 'security-concerns' },
        { label: 'Legal & Compliance', value: 'legal-compliance' },
        { label: 'General Inquiry', value: 'general-inquiry' },
      ],
    },
    {
      name: 'priority',
      type: 'select',
      required: true,
      defaultValue: 'medium',
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
        { label: 'Urgent', value: 'urgent' },
        { label: 'Critical', value: 'critical' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'open',
      options: [
        { label: 'Open', value: 'open' },
        { label: 'In Progress', value: 'in-progress' },
        { label: 'Waiting for User', value: 'waiting-for-user' },
        { label: 'Resolved', value: 'resolved' },
        { label: 'Closed', value: 'closed' },
        { label: 'Escalated', value: 'escalated' },
      ],
    },
    {
      name: 'creator',
      type: 'relationship',
      relationTo: 'users',
      required: false,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        description: 'User who submitted the support ticket',
      },
    },
    {
      name: 'assignedTo',
      type: 'relationship',
      relationTo: 'users',
      required: false,
      admin: {
        description: 'Support agent assigned to this ticket',
      },
    },
    {
      name: 'createdAt',
      type: 'date',
      defaultValue: () => new Date(),
    },
    {
      name: 'updatedAt',
      type: 'date',
      defaultValue: () => new Date(),
    },
    {
      name: 'resolvedAt',
      type: 'date',
      admin: {
        description: 'When the ticket was resolved',
      },
    },
    {
      name: 'messages',
      type: 'array',
      fields: [
        {
          name: 'messageId',
          type: 'text',
          required: true,
        },
        {
          name: 'sender',
          type: 'relationship',
          relationTo: 'users',
          required: true,
        },
        {
          name: 'content',
          type: 'richText',
          required: true,
        },
        {
          name: 'timestamp',
          type: 'date',
          defaultValue: () => new Date(),
        },
        {
          name: 'isInternal',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Whether this is an internal note (not visible to user)',
          },
        },
        {
          name: 'attachments',
          type: 'upload',
          relationTo: 'media',
          hasMany: true,
        },
      ],
      admin: {
        description: 'Conversation messages between user and support',
      },
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
      name: 'userAgent',
      type: 'textarea',
      required: false,
      admin: {
        description: 'Browser information when ticket was created',
      },
    },
    {
      name: 'ipAddress',
      type: 'text',
      required: false,
      admin: {
        description: 'IP address when ticket was created',
      },
    },
    {
      name: 'satisfactionRating',
      type: 'number',
      min: 1,
      max: 5,
      admin: {
        description: 'User satisfaction rating (1-5 stars)',
      },
    },
    {
      name: 'feedback',
      type: 'textarea',
      required: false,
      admin: {
        description: 'User feedback after ticket resolution',
      },
    },
    {
      name: 'estimatedResolutionTime',
      type: 'number',
      required: false,
      min: 1,
      admin: {
        description: 'Estimated time to resolution in hours',
      },
    },
    {
      name: 'actualResolutionTime',
      type: 'number',
      required: false,
      min: 1,
      admin: {
        description: 'Actual time to resolution in hours',
      },
    },
    {
      name: 'escalationLevel',
      type: 'select',
      required: true,
      defaultValue: '1',
      options: [
        { label: 'Level 1 - Basic Support', value: '1' },
        { label: 'Level 2 - Technical Support', value: '2' },
        { label: 'Level 3 - Engineering Support', value: '3' },
        { label: 'Level 4 - Management', value: '4' },
      ],
    },
    {
      name: 'followUpRequired',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether follow-up is required after resolution',
      },
    },
    {
      name: 'followUpDate',
      type: 'date',
      required: false,
      admin: {
        description: 'Date for scheduled follow-up',
      },
    },
    {
      name: 'resolution',
      type: 'textarea',
      required: false,
      admin: {
        description: 'Resolution description provided to user',
      },
    },
    {
      name: 'resolutionMethod',
      type: 'select',
      required: false,
      options: [
        { label: 'Self-Service', value: 'self-service' },
        { label: 'Remote Assistance', value: 'remote-assistance' },
        { label: 'Email Response', value: 'email-response' },
        { label: 'Phone Call', value: 'phone-call' },
        { label: 'Code Fix', value: 'code-fix' },
        { label: 'Configuration Change', value: 'configuration-change' },
        { label: 'Feature Implementation', value: 'feature-implementation' },
        { label: 'Documentation Update', value: 'documentation-update' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'isEscalated',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether this ticket has been escalated',
      },
    },
    {
      name: 'escalationReason',
      type: 'textarea',
      required: false,
      admin: {
        description: 'Reason for escalation',
      },
    },
    {
      name: 'internalNotes',
      type: 'textarea',
      required: false,
      admin: {
        description: 'Internal notes for support team (not visible to users)',
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation }) => {
        // Update updatedAt when ticket changes
        if (operation === 'update' && data) {
          data.updatedAt = new Date()

          // Set resolvedAt when status changes to resolved
          if (data.status === 'resolved' && !data.resolvedAt) {
            data.resolvedAt = new Date()
          }
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, req, operation }) => {
        // Log ticket changes for audit purposes
        if (operation === 'update') {
          try {
            console.log(`Support ticket updated: ${doc.title} (${doc.status})`)
          } catch (error) {
            console.error('Failed to log support ticket change:', error)
          }
        }
      },
    ],
  },
}
