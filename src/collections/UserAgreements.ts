import type { CollectionConfig } from 'payload'

export const UserAgreements: CollectionConfig = {
  slug: 'user-agreements',
  admin: {
    useAsTitle: 'user',
    defaultColumns: ['user', 'document', 'status', 'acceptedAt'],
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
      name: 'document',
      type: 'relationship',
      relationTo: ['users', 'legal-documents'] as any,
      required: true,
    },
    {
      name: 'acceptedAt',
      type: 'date',
      required: true,
      defaultValue: () => new Date(),
    },
    {
      name: 'revokedAt',
      type: 'date',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'accepted',
      options: [
        { label: 'Accepted', value: 'accepted' },
        { label: 'Revoked', value: 'revoked' },
        { label: 'Pending', value: 'pending' },
        { label: 'Expired', value: 'expired' },
      ],
    },
    {
      name: 'ipAddress',
      type: 'text',
      required: false,
      admin: {
        description: 'IP address where the agreement was accepted',
      },
    },
    {
      name: 'userAgent',
      type: 'textarea',
      required: false,
      admin: {
        description: 'Browser/user agent information',
      },
    },
    {
      name: 'creator',
      type: 'relationship',
      relationTo: 'users',
      required: false,
    },
    {
      name: 'sessionId',
      type: 'text',
      required: false,
      admin: {
        description: 'Session identifier for tracking',
      },
    },
    {
      name: 'consentMethod',
      type: 'select',
      required: true,
      defaultValue: 'explicit',
      options: [
        { label: 'Explicit Acceptance', value: 'explicit' },
        { label: 'Implicit Acceptance', value: 'implicit' },
        { label: 'Auto-accept', value: 'auto-accept' },
        { label: 'Updated Version', value: 'updated-version' },
      ],
    },
    {
      name: 'version',
      type: 'text',
      required: true,
    },
    {
      name: 'notes',
      type: 'textarea',
      required: false,
      admin: {
        description: 'Additional notes about the agreement',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether this agreement record is currently active',
      },
    },
    {
      name: 'agreementType',
      type: 'select',
      required: true,
      defaultValue: 'general',
      options: [
        { label: 'General Terms', value: 'general' },
        { label: 'Privacy Policy', value: 'privacy' },
        { label: 'Cookie Policy', value: 'cookies' },
        { label: 'Data Processing', value: 'data-processing' },
        { label: 'Creator Agreement', value: 'creator' },
        { label: 'User Agreement', value: 'user' },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation }) => {
        // When revoking an agreement, set the revokedAt date
        if (operation === 'update' && data?.status === 'revoked' && !data.revokedAt) {
          data.revokedAt = new Date()
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, req, operation }) => {
        // Log agreement changes for audit purposes
        try {
          if (operation === 'create') {
            console.log(
              `User agreement created: User ${doc.user} accepted document ${doc.document}`,
            )
          } else if (operation === 'update' && doc.status === 'revoked') {
            console.log(`User agreement revoked: User ${doc.user} revoked document ${doc.document}`)
          }
        } catch (error) {
          console.error('Failed to log user agreement change:', error)
        }
      },
    ],
  },
}
