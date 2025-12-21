import type { CollectionConfig } from 'payload'

export const Tutorials: CollectionConfig = {
  slug: 'tutorials',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'difficulty', 'estimatedTime', 'isPublished', 'creator'],
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
      name: 'steps',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'stepNumber',
          type: 'number',
          required: true,
          min: 1,
        },
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
          name: 'media',
          type: 'upload',
          relationTo: 'media',
          hasMany: true,
        },
        {
          name: 'codeExample',
          type: 'textarea',
          required: false,
          admin: {
            description: 'Optional code example for this step',
          },
        },
        {
          name: 'timeEstimate',
          type: 'number',
          required: false,
          min: 1,
          admin: {
            description: 'Estimated time in minutes for this step',
          },
        },
        {
          name: 'isOptional',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Whether this step is optional',
          },
        },
      ],
    },
    {
      name: 'difficulty',
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
      name: 'estimatedTime',
      type: 'number',
      required: true,
      min: 1,
      admin: {
        description: 'Total estimated time in minutes',
      },
    },
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      admin: {
        description: 'Tutorial thumbnail, preview images, or supporting media',
      },
    },
    {
      name: 'creator',
      type: 'relationship',
      relationTo: 'users',
      required: false,
    },
    {
      name: 'isPublished',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether this tutorial is published and visible to users',
      },
    },
    {
      name: 'completionCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Number of users who completed this tutorial',
      },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Getting Started', value: 'getting-started' },
        { label: 'Bot Creation', value: 'bot-creation' },
        { label: 'Bot Customization', value: 'bot-customization' },
        { label: 'Knowledge Base', value: 'knowledge-base' },
        { label: 'Personas & Moods', value: 'personas-moods' },
        { label: 'Analytics Setup', value: 'analytics-setup' },
        { label: 'API Integration', value: 'api-integration' },
        { label: 'Deployment', value: 'deployment' },
        { label: 'Advanced Features', value: 'advanced-features' },
        { label: 'Troubleshooting', value: 'troubleshooting' },
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
      name: 'prerequisites',
      type: 'array',
      fields: [
        {
          name: 'prerequisite',
          type: 'text',
          required: true,
        },
      ],
      admin: {
        description: 'Required knowledge or tutorials before starting this one',
      },
    },
    {
      name: 'learningObjectives',
      type: 'array',
      fields: [
        {
          name: 'objective',
          type: 'text',
          required: true,
        },
      ],
      admin: {
        description: 'What users will learn from this tutorial',
      },
    },
    {
      name: 'rating',
      type: 'number',
      min: 1,
      max: 5,
      defaultValue: 0,
      admin: {
        description: 'Average user rating (1-5 stars)',
      },
    },
    {
      name: 'reviewCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Number of user reviews',
      },
    },
    {
      name: 'lastUpdated',
      type: 'date',
      defaultValue: () => new Date(),
    },
    {
      name: 'isFeatured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether this tutorial should be featured prominently',
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
      name: 'resources',
      type: 'array',
      fields: [
        {
          name: 'resourceName',
          type: 'text',
          required: true,
        },
        {
          name: 'resourceUrl',
          type: 'text',
          required: true,
        },
        {
          name: 'resourceType',
          type: 'select',
          required: true,
          options: [
            { label: 'Documentation', value: 'documentation' },
            { label: 'Video', value: 'video' },
            { label: 'Article', value: 'article' },
            { label: 'Tool', value: 'tool' },
            { label: 'Download', value: 'download' },
            { label: 'External Link', value: 'external-link' },
          ],
        },
      ],
      admin: {
        description: 'Additional resources for this tutorial',
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation }) => {
        // Update lastUpdated when tutorial changes
        if (operation === 'update' && data) {
          data.lastUpdated = new Date()
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, req, operation }) => {
        // Log tutorial changes for audit purposes
        if (operation === 'update') {
          try {
            console.log(`Tutorial updated: ${doc.title} (${doc.difficulty})`)
          } catch (error) {
            console.error('Failed to log tutorial change:', error)
          }
        }
      },
    ],
  },
}
