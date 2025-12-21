import type { CollectionConfig } from 'payload'

export const Documentation: CollectionConfig = {
  slug: 'documentation',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'language', 'isPublished', 'lastUpdated'],
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
      name: 'content',
      type: 'richText',
      required: true,
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Getting Started', value: 'getting-started' },
        { label: 'Bot Creation', value: 'bot-creation' },
        { label: 'Bot Management', value: 'bot-management' },
        { label: 'Knowledge Base', value: 'knowledge-base' },
        { label: 'Personas & Moods', value: 'personas-moods' },
        { label: 'Analytics & Insights', value: 'analytics-insights' },
        { label: 'API Reference', value: 'api-reference' },
        { label: 'Troubleshooting', value: 'troubleshooting' },
        { label: 'Best Practices', value: 'best-practices' },
        { label: 'Account & Billing', value: 'account-billing' },
        { label: 'Creator Programs', value: 'creator-programs' },
        { label: 'Legal & Compliance', value: 'legal-compliance' },
        { label: 'Platform Updates', value: 'platform-updates' },
        { label: 'FAQ', value: 'faq' },
      ],
    },
    {
      name: 'subcategory',
      type: 'text',
      required: false,
      admin: {
        description: 'Optional subcategory for more specific organization',
      },
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      required: true,
    },
    {
      name: 'language',
      type: 'select',
      required: true,
      defaultValue: 'en',
      options: [
        { label: 'English', value: 'en' },
        { label: 'Spanish', value: 'es' },
        { label: 'French', value: 'fr' },
        { label: 'German', value: 'de' },
        { label: 'Italian', value: 'it' },
        { label: 'Portuguese', value: 'pt' },
        { label: 'Chinese (Simplified)', value: 'zh' },
        { label: 'Chinese (Traditional)', value: 'zh-tw' },
        { label: 'Japanese', value: 'ja' },
        { label: 'Korean', value: 'ko' },
        { label: 'Arabic', value: 'ar' },
        { label: 'Russian', value: 'ru' },
      ],
    },
    {
      name: 'isPublished',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether this documentation is published and visible to users',
      },
    },
    {
      name: 'creator',
      type: 'relationship',
      relationTo: 'users',
      required: false,
    },
    {
      name: 'lastUpdated',
      type: 'date',
      defaultValue: () => new Date(),
    },
    {
      name: 'viewCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Number of times this documentation has been viewed',
      },
    },
    {
      name: 'difficultyLevel',
      type: 'select',
      required: true,
      defaultValue: 'beginner',
      options: [
        { label: 'Beginner', value: 'beginner' },
        { label: 'Intermediate', value: 'intermediate' },
        { label: 'Advanced', value: 'advanced' },
        { label: 'Expert', value: 'expert' },
      ],
    },
    {
      name: 'estimatedReadTime',
      type: 'number',
      required: false,
      min: 1,
      admin: {
        description: 'Estimated time to read in minutes',
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
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      admin: {
        description: 'Images, videos, or other media associated with this documentation',
      },
    },
    {
      name: 'isFeatured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether this documentation should be featured prominently',
      },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Order for displaying within its category (lower numbers appear first)',
      },
    },
    {
      name: 'metaTitle',
      type: 'text',
      required: false,
      admin: {
        description: 'SEO title (defaults to title if not specified)',
      },
    },
    {
      name: 'metaDescription',
      type: 'textarea',
      maxLength: 160,
      required: false,
      admin: {
        description: 'SEO description for search engines',
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation }) => {
        // Update lastUpdated when content changes
        if (operation === 'update' && data) {
          data.lastUpdated = new Date()
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, req, operation }) => {
        // Log documentation changes for audit purposes
        if (operation === 'update') {
          try {
            console.log(`Documentation updated: ${doc.title} (${doc.category})`)
          } catch (error) {
            console.error('Failed to log documentation change:', error)
          }
        }
      },
    ],
  },
}
