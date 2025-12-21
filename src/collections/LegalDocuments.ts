import type { CollectionConfig } from 'payload'

export const LegalDocuments: CollectionConfig = {
  slug: 'legal-documents',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'documentType', 'version', 'status', 'effectiveDate'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'documentType',
      type: 'select',
      required: true,
      options: [
        { label: 'Terms of Service', value: 'terms-of-service' },
        { label: 'Privacy Policy', value: 'privacy-policy' },
        { label: 'Cookie Policy', value: 'cookie-policy' },
        { label: 'Disclaimer', value: 'disclaimer' },
        { label: 'Acceptable Use Policy', value: 'acceptable-use-policy' },
        { label: 'Data Processing Agreement', value: 'data-processing-agreement' },
      ],
    },
    {
      name: 'version',
      type: 'text',
      required: true,
      defaultValue: '1.0',
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
    },
    {
      name: 'effectiveDate',
      type: 'date',
      required: true,
    },
    {
      name: 'expiryDate',
      type: 'date',
    },
    {
      name: 'language',
      type: 'text',
      required: true,
      defaultValue: 'en',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Active', value: 'active' },
        { label: 'Archived', value: 'archived' },
        { label: 'Pending Review', value: 'pending-review' },
      ],
    },
    {
      name: 'creator',
      type: 'relationship',
      relationTo: 'users',
      required: false,
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'lastModified',
      type: 'date',
      defaultValue: () => new Date(),
    },
    {
      name: 'summary',
      type: 'textarea',
      maxLength: 500,
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
      name: 'isGlobal',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'If checked, this document applies to all creators on the platform',
      },
    },
    {
      name: 'consentRequired',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'If checked, users must explicitly accept this document',
      },
    },
    {
      name: 'fileAttachments',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation }) => {
        if (operation === 'update' && data) {
          data.lastModified = new Date()
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, req, operation }) => {
        // Log legal document changes for audit purposes
        if (operation === 'update') {
          try {
            console.log(
              `Legal document updated: ${doc.title} (${doc.documentType}) v${doc.version}`,
            )
          } catch (error) {
            console.error('Failed to log legal document change:', error)
          }
        }
      },
    ],
  },
}
