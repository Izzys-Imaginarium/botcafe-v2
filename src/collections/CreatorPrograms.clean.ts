import type { CollectionConfig } from 'payload'

export const CreatorPrograms: CollectionConfig = {
  slug: 'creatorPrograms',
  admin: {
    useAsTitle: 'program_name',
    description: 'Featured creator program management and applications',
  },
  access: {
    read: () => {
      // Programs are publicly readable for transparency
      return true
    },
    create: ({ req: { user } }) => {
      // Only admins can create programs
      return {
        user: {
          equals: null, // This would need admin check in actual implementation
        },
      }
    },
    update: ({ req: { user } }) => {
      // Only admins can update programs
      return {
        user: {
          equals: null, // This would need admin check in actual implementation
        },
      }
    },
    delete: ({ req: { user } }) => {
      // Only admins can delete programs
      return {
        user: {
          equals: null, // This would need admin check in actual implementation
        },
      }
    },
  },
  fields: [
    {
      name: 'program_name',
      type: 'text',
      required: true,
      maxLength: 200,
      admin: {
        description: 'Name of the creator program',
      },
    },
    {
      name: 'program_slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL-friendly identifier for the program',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      maxLength: 2000,
      admin: {
        description: 'Detailed description of the program',
      },
    },
    {
      name: 'short_description',
      type: 'text',
      required: true,
      maxLength: 500,
      admin: {
        description: 'Brief description for program listings',
      },
    },
    {
      name: 'program_type',
      type: 'select',
      required: true,
      options: [
        { label: 'Featured Creator', value: 'featured-creator' },
        { label: 'Verified Creator', value: 'verified-creator' },
        { label: 'Premium Creator', value: 'premium-creator' },
        { label: 'Mentorship Program', value: 'mentorship' },
        { label: 'Community Ambassador', value: 'ambassador' },
        { label: 'Educational Program', value: 'educational' },
        { label: 'Innovation Lab', value: 'innovation-lab' },
      ],
      admin: {
        description: 'Type of creator program',
      },
    },
    {
      name: 'program_status',
      type: 'select',
      required: true,
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Closed', value: 'closed' },
        { label: 'Paused', value: 'paused' },
        { label: 'Archived', value: 'archived' },
      ],
      defaultValue: 'active',
      admin: {
        description: 'Current status of the program',
      },
    },
    {
      name: 'program_media',
      type: 'group',
      fields: [
        {
          name: 'banner_image',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Program banner/hero image',
          },
        },
        {
          name: 'icon',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Program icon or logo',
          },
        },
      ],
    },
    {
      name: 'application_requirements',
      type: 'group',
      fields: [
        {
          name: 'minimum_bot_count',
          type: 'number',
          defaultValue: 1,
          admin: {
            description: 'Minimum number of bots required to apply',
          },
        },
        {
          name: 'minimum_conversation_count',
          type: 'number',
          defaultValue: 0,
          admin: {
            description: 'Minimum total conversations required',
          },
        },
        {
          name: 'minimum_rating',
          type: 'number',
          min: 0,
          max: 5,
          admin: {
            description: 'Minimum average bot rating required',
          },
        },
        {
          name: 'required_specialties',
          type: 'array',
          fields: [
            {
              name: 'specialty',
              type: 'select',
              options: [
                { label: 'Conversational AI', value: 'conversational-ai' },
                { label: 'Fantasy/RPG Bots', value: 'fantasy-rpg' },
                { label: 'Educational Bots', value: 'educational' },
                { label: 'Creative Writing', value: 'creative-writing' },
                { label: 'Technical Support', value: 'technical-support' },
                { label: 'Entertainment', value: 'entertainment' },
                { label: 'Productivity', value: 'productivity' },
                { label: 'Mental Health', value: 'mental-health' },
                { label: 'Gaming', value: 'gaming' },
                { label: 'Business/Customer Service', value: 'business' },
              ],
            },
          ],
          admin: {
            description: 'Required specialties for this program',
          },
        },
        {
          name: 'verification_required',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Requires identity verification',
          },
        },
        {
          name: 'portfolio_review',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Requires manual portfolio review',
          },
        },
        {
          name: 'community_standing',
          type: 'select',
          options: [
            { label: 'No requirement', value: 'none' },
            { label: 'Good standing', value: 'good' },
            { label: 'Excellent standing', value: 'excellent' },
            { label: 'No violations', value: 'clean' },
          ],
          defaultValue: 'good',
          admin: {
            description: 'Required community standing',
          },
        },
      ],
    },
    {
      name: 'application_process',
      type: 'group',
      fields: [
        {
          name: 'application_deadline',
          type: 'date',
          admin: {
            description: 'Application deadline (if applicable)',
          },
        },
        {
          name: 'application_method',
          type: 'select',
          options: [
            { label: 'Automatic Approval', value: 'automatic' },
            { label: 'Application Form', value: 'form' },
            { label: 'Portfolio Review', value: 'portfolio' },
            { label: 'Interview Process', value: 'interview' },
            { label: 'Community Voting', value: 'voting' },
          ],
          defaultValue: 'form',
        },
        {
          name: 'application_questions',
          type: 'array',
          fields: [
            {
              name: 'question',
              type: 'text',
              required: true,
            },
            {
              name: 'question_type',
              type: 'select',
              options: [
                { label: 'Short Text', value: 'short-text' },
                { label: 'Long Text', value: 'long-text' },
                { label: 'Multiple Choice', value: 'multiple-choice' },
                { label: 'Yes/No', value: 'yes-no' },
              ],
              defaultValue: 'short-text',
            },
            {
              name: 'required',
              type: 'checkbox',
              defaultValue: false,
            },
            {
              name: 'options',
              type: 'array',
              fields: [
                {
                  name: 'option',
                  type: 'text',
                },
              ],
            },
          ],
          admin: {
            description: 'Custom application questions for this program',
          },
        },
        {
          name: 'review_process',
          type: 'textarea',
          admin: {
            description: 'Description of how applications are reviewed',
          },
        },
        {
          name: 'review_timeline',
          type: 'text',
          admin: {
            description: 'Expected timeline for application review',
          },
        },
      ],
    },
    {
      name: 'program_benefits',
      type: 'group',
      fields: [
        {
          name: 'primary_benefits',
          type: 'array',
          fields: [
            {
              name: 'benefit',
              type: 'textarea',
              required: true,
            },
          ],
          admin: {
            description: 'Primary benefits of joining this program',
          },
        },
        {
          name: 'promotional_benefits',
          type: 'array',
          fields: [
            {
              name: 'benefit',
              type: 'textarea',
            },
          ],
          admin: {
            description: 'Promotional and marketing benefits',
          },
        },
        {
          name: 'technical_benefits',
          type: 'array',
          fields: [
            {
              name: 'benefit',
              type: 'textarea',
            },
          ],
          admin: {
            description: 'Technical or feature benefits',
          },
        },
        {
          name: 'community_benefits',
          type: 'array',
          fields: [
            {
              name: 'benefit',
              type: 'textarea',
            },
          ],
          admin: {
            description: 'Community and networking benefits',
          },
        },
        {
          name: 'financial_benefits',
          type: 'array',
          fields: [
            {
              name: 'benefit',
              type: 'textarea',
            },
          ],
          admin: {
            description: 'Financial or monetization benefits',
          },
        },
      ],
    },
    {
      name: 'program_tiers',
      type: 'array',
      fields: [
        {
          name: 'tier_name',
          type: 'text',
          required: true,
        },
        {
          name: 'tier_level',
          type: 'number',
          required: true,
        },
        {
          name: 'tier_description',
          type: 'textarea',
          required: true,
        },
        {
          name: 'tier_benefits',
          type: 'array',
          fields: [
            {
              name: 'benefit',
              type: 'text',
            },
          ],
        },
        {
          name: 'requirements',
          type: 'textarea',
        },
      ],
      admin: {
        description: 'Multiple tiers within the program (if applicable)',
      },
    },
    {
      name: 'program_stats',
      type: 'group',
      fields: [
        {
          name: 'total_applicants',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
            description: 'Total number of applications received',
          },
        },
        {
          name: 'accepted_creators',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
            description: 'Number of creators accepted into the program',
          },
        },
        {
          name: 'active_creators',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
            description: 'Number of currently active program participants',
          },
        },
      ],
    },
    {
      name: 'program_settings',
      type: 'group',
      fields: [
        {
          name: 'max_participants',
          type: 'number',
          admin: {
            description: 'Maximum number of participants (leave empty for unlimited)',
          },
        },
        {
          name: 'renewal_required',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Program membership requires periodic renewal',
          },
        },
        {
          name: 'renewal_period_months',
          type: 'number',
          admin: {
            description: 'Renewal period in months',
          },
        },
        {
          name: 'auto_accept_criteria',
          type: 'textarea',
          admin: {
            description: 'Criteria for automatic acceptance (if applicable)',
          },
        },
      ],
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
      name: 'launch_date',
      type: 'date',
      admin: {
        description: 'Date when the program was launched',
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
        description: 'Tags to categorize and discover this program',
      },
    },
    {
      name: 'program_notes',
      type: 'textarea',
      admin: {
        description: 'Internal notes about the program (admin only)',
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ operation, data }) => {
        // Auto-generate program slug from name if not provided
        if (!data.program_slug && data.program_name) {
          data.program_slug = data.program_name
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '-')
        }

        // Set modified timestamp
        if (operation === 'update') {
          data.modified_timestamp = new Date()
        }
      },
    ],
    afterChange: [
      async ({ doc, operation }) => {
        if (operation === 'create') {
          console.log(`New creator program created: ${doc.program_name}`)
        }
      },
    ],
  },
}
