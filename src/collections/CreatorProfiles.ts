import type { CollectionConfig } from 'payload'

export const CreatorProfiles: CollectionConfig = {
  slug: 'creatorProfiles',
  admin: {
    useAsTitle: 'username',
    description: 'Multi-tenant creator showcase and profile management',
  },
  access: {
    read: () => {
      // Creator profiles are publicly readable for the showcase
      return true
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
        or: [
          {
            user: {
              equals: user?.id,
            },
          },
          // Allow admins to update any creator profile
          {
            user: {
              equals: null, // This would need admin check in actual implementation
            },
          },
        ],
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
      admin: {
        description: 'The user who owns this creator profile',
      },
    },
    {
      name: 'username',
      type: 'text',
      required: true,
      unique: true,
      maxLength: 50,
      admin: {
        description: 'Unique username for creator profile (used in URLs)',
      },
    },
    {
      name: 'display_name',
      type: 'text',
      required: true,
      maxLength: 100,
      admin: {
        description: 'Public display name for the creator',
      },
    },
    {
      name: 'bio',
      type: 'textarea',
      required: true,
      maxLength: 1000,
      admin: {
        description: 'Creator biography and description',
      },
    },
    {
      name: 'profile_media',
      type: 'group',
      fields: [
        {
          name: 'avatar',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Creator profile picture',
          },
        },
        {
          name: 'banner_image',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Profile banner/header image',
          },
        },
      ],
    },
    {
      name: 'social_links',
      type: 'group',
      fields: [
        {
          name: 'website',
          type: 'text',
          admin: {
            description: 'Personal or professional website URL',
          },
        },
        {
          name: 'github',
          type: 'text',
          admin: {
            description: 'GitHub profile URL',
          },
        },
        {
          name: 'twitter',
          type: 'text',
          admin: {
            description: 'Twitter/X profile URL',
          },
        },
        {
          name: 'linkedin',
          type: 'text',
          admin: {
            description: 'LinkedIn profile URL',
          },
        },
        {
          name: 'discord',
          type: 'text',
          admin: {
            description: 'Discord username or server invite',
          },
        },
        {
          name: 'youtube',
          type: 'text',
          admin: {
            description: 'YouTube channel URL',
          },
        },
        {
          name: 'other_links',
          type: 'array',
          fields: [
            {
              name: 'platform',
              type: 'text',
              required: true,
            },
            {
              name: 'url',
              type: 'text',
              required: true,
            },
          ],
          admin: {
            description: 'Additional social media or professional links',
          },
        },
      ],
    },
    {
      name: 'creator_info',
      type: 'group',
      fields: [
        {
          name: 'creator_type',
          type: 'select',
          required: true,
          options: [
            { label: 'Individual', value: 'individual' },
            { label: 'Studio/Team', value: 'studio' },
            { label: 'Organization', value: 'organization' },
            { label: 'Educational', value: 'educational' },
            { label: 'Open Source', value: 'open-source' },
          ],
        },
        {
          name: 'specialties',
          type: 'array',
          fields: [
            {
              name: 'specialty',
              type: 'select',
              options: [
                { label: 'Conversational AI', value: 'conversational-ai' },
                { label: 'Creative Writing', value: 'creative-writing' },
                { label: 'Fantasy/RPG', value: 'fantasy-rpg' },
                { label: 'Gaming', value: 'gaming' },
                { label: 'Fanfic', value: 'fanfic' },
                { label: 'OC (Original Characters)', value: 'oc' },
                { label: 'Dead Dove', value: 'dead-dove' },
                { label: 'Comedy/Parody', value: 'comedy-parody' },
                { label: 'Long-form', value: 'long-form' },
                { label: 'One-shot', value: 'one-shot' },
              ],
            },
          ],
          admin: {
            description: 'Areas of expertise and bot creation specialties',
          },
        },
        {
          name: 'experience_level',
          type: 'select',
          options: [
            { label: 'Beginner', value: 'beginner' },
            { label: 'Intermediate', value: 'intermediate' },
            { label: 'Advanced', value: 'advanced' },
            { label: 'Expert', value: 'expert' },
            { label: 'Professional', value: 'professional' },
          ],
        },
        {
          name: 'location',
          type: 'text',
          maxLength: 100,
          admin: {
            description: 'Geographic location (optional)',
          },
        },
        {
          name: 'languages',
          type: 'array',
          fields: [
            {
              name: 'language',
              type: 'text',
            },
          ],
          admin: {
            description: 'Languages supported in created bots',
          },
        },
      ],
    },
    {
      name: 'portfolio',
      type: 'group',
      fields: [
        {
          name: 'featured_bots',
          type: 'relationship',
          relationTo: 'bot',
          hasMany: true,
          admin: {
            description: 'Bots to feature prominently on creator profile',
          },
        },
        {
          name: 'bot_count',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
            description: 'Total number of bots created by this creator',
          },
        },
        {
          name: 'total_conversations',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
            description: 'Total conversations across all created bots',
          },
        },
        {
          name: 'average_rating',
          type: 'number',
          min: 0,
          max: 5,
          admin: {
            description: "Average rating of creator's bots",
          },
        },
      ],
    },
    {
      name: 'community_stats',
      type: 'group',
      fields: [
        {
          name: 'follower_count',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
            description: 'Number of followers',
          },
        },
        {
          name: 'following_count',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
            description: 'Number of creators being followed',
          },
        },
        {
          name: 'total_likes',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
            description: 'Total likes received across all content',
          },
        },
      ],
    },
    {
      name: 'verification_status',
      type: 'select',
      options: [
        { label: 'Unverified', value: 'unverified' },
        { label: 'Pending Review', value: 'pending' },
        { label: 'Verified', value: 'verified' },
        { label: 'Premium', value: 'premium' },
      ],
      defaultValue: 'unverified',
      admin: {
        description: 'Creator verification and trust status',
      },
    },
    {
      name: 'featured_creator',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Feature this creator prominently on the platform',
      },
    },
    {
      name: 'profile_settings',
      type: 'group',
      fields: [
        {
          name: 'profile_visibility',
          type: 'select',
          options: [
            { label: 'Public', value: 'public' },
            { label: 'Unlisted', value: 'unlisted' },
            { label: 'Private', value: 'private' },
          ],
          defaultValue: 'public',
        },
        {
          name: 'allow_collaborations',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Allow other creators to collaborate on bots',
          },
        },
        {
          name: 'accept_commissions',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Available for custom bot commissions',
          },
        },
        {
          name: 'commission_info',
          type: 'textarea',
          admin: {
            description: 'Commission rates and availability information',
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
      name: 'last_active',
      type: 'date',
      admin: {
        description: 'Last time the creator was active on the platform',
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
        description: 'Tags to help categorize and discover this creator',
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ operation, data }) => {
        // Ensure username is lowercase and URL-safe
        if (data.username) {
          data.username = data.username.toLowerCase().replace(/[^a-z0-9-_]/g, '-')
        }

        // Set modified timestamp
        if (operation === 'update') {
          data.modified_timestamp = new Date()
        }
      },
    ],
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation === 'create') {
          console.log(`New creator profile created: ${doc.display_name} (@${doc.username})`)
        }

        // Update last_active when profile is modified
        if (operation === 'update') {
          // This would typically update the user's last_active field
        }
      },
    ],
  },
}
