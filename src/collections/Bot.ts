import type { CollectionConfig } from 'payload'

export const Bot: CollectionConfig = {
  slug: 'bot',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: () => true,
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'creator_profile',
      type: 'relationship',
      relationTo: 'creatorProfiles',
      required: true,
      admin: {
        description: 'The creator profile this bot belongs to (determines URL: /<username>/<slug>)',
      },
    },
    {
      name: 'created_date',
      type: 'date',
      defaultValue: () => new Date(),
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'picture',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'gender',
      type: 'select',
      options: [
        { label: 'Male', value: 'male' },
        { label: 'Female', value: 'female' },
        { label: 'Non-binary', value: 'non-binary' },
        { label: 'Other', value: 'other' },
        { label: 'Prefer not to say', value: 'prefer-not-to-say' },
      ],
    },
    {
      name: 'age',
      type: 'number',
      min: 1,
      max: 200,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'system_prompt',
      type: 'textarea',
      required: true,
    },
    {
      name: 'is_public',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'greeting',
      type: 'textarea',
    },
    {
      name: 'speech_examples',
      type: 'array',
      fields: [
        {
          name: 'example',
          type: 'text',
        },
      ],
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      admin: {
        description: 'URL slug for this bot (must be unique within creator profile)',
      },
    },
    {
      name: 'knowledge_collections',
      type: 'relationship',
      relationTo: 'knowledgeCollections',
      hasMany: true,
    },
    {
      name: 'likes_count',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'favorites_count',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'creator_display_name',
      type: 'text',
      required: true,
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation, req, originalDoc }) => {
        // Validate slug uniqueness within the creator's bots
        if (data.slug && data.creator_profile) {
          const creatorProfileId =
            typeof data.creator_profile === 'object' ? data.creator_profile.id : data.creator_profile

          // Query for existing bots with the same slug under this creator
          const existingBots = await req.payload.find({
            collection: 'bot',
            where: {
              and: [
                {
                  creator_profile: {
                    equals: creatorProfileId,
                  },
                },
                {
                  slug: {
                    equals: data.slug,
                  },
                },
              ],
            },
            limit: 1,
          })

          // If updating, exclude current document from check
          if (operation === 'update' && originalDoc) {
            const foundBot = existingBots.docs[0]
            if (foundBot && foundBot.id !== originalDoc.id) {
              throw new Error(
                'A bot with this slug already exists in your profile. Please choose a different slug.'
              )
            }
          } else if (operation === 'create' && existingBots.docs.length > 0) {
            throw new Error(
              'A bot with this slug already exists in your profile. Please choose a different slug.'
            )
          }
        }

        // Ensure slug is URL-safe
        if (data.slug) {
          data.slug = data.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-')
        }

        return data
      },
    ],
  },
}
