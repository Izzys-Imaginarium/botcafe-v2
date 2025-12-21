import type { CollectionConfig } from 'payload'

export const AccessControl: CollectionConfig = {
  slug: 'access-control',
  admin: {
    useAsTitle: 'resource_type',
    description: 'Fine-grained permissions management for all resources',
  },
  access: {
    read: ({ req: { user } }) => {
      // Users can read their own access grants
      return {
        or: [
          {
            user: {
              equals: user?.id,
            },
          },
          {
            granted_by: {
              equals: user?.id,
            },
          },
        ],
      }
    },
    create: ({ req: { user } }) => {
      // Users can grant access to their own resources
      return {
        user: {
          equals: user?.id,
        },
      }
    },
    update: ({ req: { user } }) => {
      // Users can update access they granted
      return {
        granted_by: {
          equals: user?.id,
        },
      }
    },
    delete: ({ req: { user } }) => {
      // Users can remove access they granted
      return {
        granted_by: {
          equals: user?.id,
        },
      }
    },
  },
  fields: [
    {
      name: 'resource_type',
      type: 'select',
      required: true,
      options: [
        { label: 'Bot', value: 'bot' },
        { label: 'Knowledge', value: 'knowledge' },
        { label: 'Knowledge Collection', value: 'knowledgeCollection' },
        { label: 'Memory', value: 'memory' },
        { label: 'Conversation', value: 'conversation' },
        { label: 'Persona', value: 'persona' },
        { label: 'Creator Profile', value: 'creatorProfile' },
      ],
      admin: {
        description: 'Type of resource this access control applies to',
      },
    },
    {
      name: 'resource_id',
      type: 'text',
      required: true,
      admin: {
        description: 'ID of the specific resource',
      },
    },
    {
      name: 'resource_title',
      type: 'text',
      admin: {
        description: 'Human-readable title/name of the resource (for display purposes)',
      },
    },
    {
      name: 'permission_type',
      type: 'select',
      required: true,
      options: [
        { label: 'Read', value: 'read' },
        { label: 'Write', value: 'write' },
        { label: 'Admin', value: 'admin' },
        { label: 'Share', value: 'share' },
        { label: 'Delete', value: 'delete' },
      ],
      admin: {
        description: 'Type of permission granted',
      },
    },
    {
      name: 'permission_scope',
      type: 'select',
      options: [
        { label: 'Full Access', value: 'full' },
        { label: 'Limited Access', value: 'limited' },
        { label: 'View Only', value: 'view-only' },
        { label: 'Comment Only', value: 'comment-only' },
        { label: 'Share Only', value: 'share-only' },
      ],
      defaultValue: 'full',
      admin: {
        description: 'Scope of the permission',
      },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        description: 'User being granted access',
      },
    },
    {
      name: 'granted_by',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        description: 'User who granted this access',
      },
    },
    {
      name: 'granted_reason',
      type: 'textarea',
      admin: {
        description: 'Reason or context for granting this access',
      },
    },
    {
      name: 'grant_method',
      type: 'select',
      options: [
        { label: 'Direct Share', value: 'direct-share' },
        { label: 'Collaboration Invite', value: 'collaboration-invite' },
        { label: 'Public Access', value: 'public-access' },
        { label: 'Program Membership', value: 'program-membership' },
        { label: 'Role Assignment', value: 'role-assignment' },
        { label: 'System Generated', value: 'system-generated' },
      ],
      defaultValue: 'direct-share',
    },
    {
      name: 'created_timestamp',
      type: 'date',
      defaultValue: () => new Date(),
      admin: {
        description: 'When this access was granted',
      },
    },
    {
      name: 'last_used',
      type: 'date',
      admin: {
        description: 'When this access was last used',
      },
    },
    {
      name: 'expiration_date',
      type: 'date',
      admin: {
        description: 'When this access expires (optional)',
      },
    },
    {
      name: 'access_count',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        description: 'Number of times this access has been used',
      },
    },
    {
      name: 'is_revoked',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether this access has been revoked',
      },
    },
    {
      name: 'revoked_by',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'User who revoked this access',
      },
    },
    {
      name: 'revoked_reason',
      type: 'textarea',
      admin: {
        description: 'Reason for revoking this access',
      },
    },
    {
      name: 'revoked_timestamp',
      type: 'date',
      admin: {
        description: 'When this access was revoked',
      },
    },
    {
      name: 'notify_on_access',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Notify resource owner when access is granted',
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
      admin: {
        description: 'Tags for organizing and searching access controls',
      },
    },
    {
      name: 'conditions',
      type: 'textarea',
      admin: {
        description: 'Specific conditions or limitations for this permission',
      },
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, operation }) => {
        // Log access control changes for valid operations only
        if (operation === 'create') {
          console.log(
            `Access granted: ${doc.permission_type} on ${doc.resource_type} to user ${doc.user}`,
          )
        }
      },
    ],
  },
}
