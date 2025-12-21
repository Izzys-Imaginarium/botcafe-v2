import type { CollectionConfig } from 'payload'

export const CrisisSupport: CollectionConfig = {
  slug: 'crisis-support',
  admin: {
    useAsTitle: 'title',
  },
  access: {
    read: () => true, // Public read access for crisis resources
    create: ({ req: { user } }) => {
      // Only allow authenticated users to create
      return !!user
    },
    update: ({ req: { user } }) => {
      // Only allow authenticated users to update
      return !!user
    },
    delete: ({ req: { user } }) => {
      // Only allow authenticated users to delete
      return !!user
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Name/title of the crisis support resource',
      },
    },
    {
      name: 'resource_type',
      type: 'select',
      required: true,
      options: [
        { label: 'Hotline', value: 'hotline' },
        { label: 'Crisis Chat', value: 'chat' },
        { label: 'Text Support', value: 'text' },
        { label: 'Online Resources', value: 'online' },
        { label: 'Emergency Services', value: 'emergency' },
        { label: 'Mental Health Apps', value: 'apps' },
        { label: 'Support Groups', value: 'groups' },
        { label: 'Professional Help', value: 'professional' },
      ],
    },
    {
      name: 'resource_category',
      type: 'select',
      required: true,
      options: [
        { label: 'Suicide Prevention', value: 'suicide-prevention' },
        { label: 'Mental Health Crisis', value: 'mental-health' },
        { label: 'Domestic Violence', value: 'domestic-violence' },
        { label: 'Substance Abuse', value: 'substance-abuse' },
        { label: 'LGBTQ+ Support', value: 'lgbtq' },
        { label: 'Youth Support', value: 'youth' },
        { label: 'Senior Support', value: 'senior' },
        { label: 'General Crisis', value: 'general' },
        { label: 'Financial Crisis', value: 'financial' },
        { label: 'Relationship Issues', value: 'relationship' },
      ],
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Detailed description of the resource and what it offers',
      },
    },
    {
      name: 'contact_info',
      type: 'group',
      required: true,
      fields: [
        {
          name: 'phone_number',
          type: 'text',
          admin: {
            placeholder: '+1-800-123-4567',
          },
        },
        {
          name: 'text_number',
          type: 'text',
          admin: {
            placeholder: 'Text HOME to 741741',
          },
        },
        {
          name: 'website',
          type: 'text',
          admin: {
            placeholder: 'https://crisis-support.org',
          },
        },
        {
          name: 'email',
          type: 'email',
        },
        {
          name: 'chat_url',
          type: 'text',
          admin: {
            placeholder: 'https://support.org/chat',
          },
        },
        {
          name: 'app_download_url',
          type: 'text',
          admin: {
            placeholder: 'https://apps.apple.com/app/support',
          },
        },
      ],
    },
    {
      name: 'availability',
      type: 'group',
      fields: [
        {
          name: 'is_24_7',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Available 24/7',
          },
        },
        {
          name: 'operating_hours',
          type: 'group',
          fields: [
            {
              name: 'monday',
              type: 'text',
              admin: {
                placeholder: '9 AM - 5 PM',
              },
            },
            {
              name: 'tuesday',
              type: 'text',
              admin: {
                placeholder: '9 AM - 5 PM',
              },
            },
            {
              name: 'wednesday',
              type: 'text',
              admin: {
                placeholder: '9 AM - 5 PM',
              },
            },
            {
              name: 'thursday',
              type: 'text',
              admin: {
                placeholder: '9 AM - 5 PM',
              },
            },
            {
              name: 'friday',
              type: 'text',
              admin: {
                placeholder: '9 AM - 5 PM',
              },
            },
            {
              name: 'saturday',
              type: 'text',
              admin: {
                placeholder: '10 AM - 2 PM',
              },
            },
            {
              name: 'sunday',
              type: 'text',
              admin: {
                placeholder: 'Closed',
              },
            },
          ],
        },
        {
          name: 'timezone',
          type: 'text',
          defaultValue: 'UTC',
          admin: {
            description: 'Operating timezone (e.g., EST, PST, UTC)',
          },
        },
      ],
    },
    {
      name: 'geographic_region',
      type: 'select',
      required: true,
      options: [
        { label: 'United States (National)', value: 'us-national' },
        { label: 'Canada (National)', value: 'ca-national' },
        { label: 'United Kingdom', value: 'uk' },
        { label: 'Australia', value: 'au' },
        { label: 'European Union', value: 'eu' },
        { label: 'Worldwide/Online', value: 'worldwide' },
        { label: 'California', value: 'ca-state' },
        { label: 'New York', value: 'ny-state' },
        { label: 'Texas', value: 'tx-state' },
        { label: 'Florida', value: 'fl-state' },
        { label: 'Custom Region', value: 'custom' },
      ],
    },
    {
      name: 'language_support',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Support available in multiple languages',
      },
    },
    {
      name: 'languages_available',
      type: 'text',
      admin: {
        placeholder: 'English, Spanish, French',
        description: 'Comma-separated list of supported languages',
      },
    },
    {
      name: 'cost_information',
      type: 'select',
      required: true,
      options: [
        { label: 'Free', value: 'free' },
        { label: 'Insurance Accepted', value: 'insurance' },
        { label: 'Sliding Scale', value: 'sliding-scale' },
        { label: 'Low Cost', value: 'low-cost' },
        { label: 'Paid', value: 'paid' },
      ],
    },
    {
      name: 'specialized_features',
      type: 'group',
      fields: [
        {
          name: 'anonymous_support',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'peer_support',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'professional_counselors',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'volunteer_support',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'family_support',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'trauma_informed',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
    {
      name: 'verification_status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Verified', value: 'verified' },
        { label: 'Pending Review', value: 'pending' },
        { label: 'Under Review', value: 'under-review' },
        { label: 'Expired', value: 'expired' },
        { label: 'Needs Update', value: 'needs-update' },
      ],
      admin: {
        description: 'Verification status of the resource',
      },
    },
    {
      name: 'last_verified',
      type: 'date',
      admin: {
        readOnly: true,
        description: 'Last time this resource was verified',
      },
    },
    {
      name: 'verification_notes',
      type: 'textarea',
      admin: {
        description: 'Notes about verification process or status',
      },
    },
    {
      name: 'tags',
      type: 'text',
      admin: {
        placeholder: 'urgent, 24/7, anonymous, free',
        description: 'Comma-separated tags for filtering',
      },
    },
    {
      name: 'is_emergency',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Mark as emergency resource (high priority display)',
      },
    },
    {
      name: 'display_order',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Lower numbers display first (0 = highest priority)',
      },
    },
    {
      name: 'is_active',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'created_by',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        readOnly: true,
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation === 'create' && req.user) {
          data.created_by = req.user.id
          data.last_verified = new Date()
        }
        if (operation === 'update') {
          data.last_verified = new Date()
        }
        return data
      },
    ],
  },
}
