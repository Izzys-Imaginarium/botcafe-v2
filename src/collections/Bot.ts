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
      admin: {
        description: 'Legacy field - use sharing.visibility instead',
        hidden: true,
      },
    },
    {
      name: 'sharing',
      type: 'group',
      admin: {
        description: 'Control who can access and edit this bot',
      },
      fields: [
        {
          name: 'visibility',
          type: 'select',
          defaultValue: 'private',
          options: [
            { label: 'Private', value: 'private' },
            { label: 'Shared', value: 'shared' },
            { label: 'Public', value: 'public' },
          ],
          admin: {
            description: 'Private: Only you. Shared: Specific users you invite. Public: Anyone can view.',
          },
        },
      ],
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
      name: 'personality_traits',
      type: 'group',
      admin: {
        description: 'Define the bot\'s communication style and personality',
      },
      fields: [
        {
          name: 'tone',
          type: 'select',
          options: [
            { label: 'Friendly', value: 'friendly' },
            { label: 'Professional', value: 'professional' },
            { label: 'Playful', value: 'playful' },
            { label: 'Mysterious', value: 'mysterious' },
            { label: 'Wise', value: 'wise' },
            { label: 'Humorous', value: 'humorous' },
            { label: 'Empathetic', value: 'empathetic' },
            { label: 'Authoritative', value: 'authoritative' },
          ],
          admin: {
            description: 'The overall tone of the bot\'s responses',
          },
        },
        {
          name: 'formality_level',
          type: 'select',
          options: [
            { label: 'Very Casual', value: 'very-casual' },
            { label: 'Casual', value: 'casual' },
            { label: 'Neutral', value: 'neutral' },
            { label: 'Formal', value: 'formal' },
            { label: 'Very Formal', value: 'very-formal' },
          ],
          admin: {
            description: 'How formal or casual the bot should be',
          },
        },
        {
          name: 'humor_style',
          type: 'select',
          options: [
            { label: 'None', value: 'none' },
            { label: 'Light', value: 'light' },
            { label: 'Moderate', value: 'moderate' },
            { label: 'Dark', value: 'dark' },
            { label: 'Sarcastic', value: 'sarcastic' },
          ],
          admin: {
            description: 'The type of humor the bot uses',
          },
        },
        {
          name: 'communication_style',
          type: 'select',
          options: [
            { label: 'Direct', value: 'direct' },
            { label: 'Elaborate', value: 'elaborate' },
            { label: 'Concise', value: 'concise' },
            { label: 'Storytelling', value: 'storytelling' },
            { label: 'Questioning', value: 'questioning' },
          ],
          admin: {
            description: 'How the bot structures its responses',
          },
        },
      ],
    },
    {
      name: 'behavior_settings',
      type: 'group',
      admin: {
        description: 'Control how the bot responds',
      },
      fields: [
        {
          name: 'response_length',
          type: 'select',
          options: [
            { label: 'Very Short', value: 'very-short' },
            { label: 'Short', value: 'short' },
            { label: 'Medium', value: 'medium' },
            { label: 'Long', value: 'long' },
            { label: 'Very Long', value: 'very-long' },
          ],
          admin: {
            description: 'Preferred length of responses',
          },
        },
        {
          name: 'creativity_level',
          type: 'select',
          options: [
            { label: 'Conservative', value: 'conservative' },
            { label: 'Moderate', value: 'moderate' },
            { label: 'Creative', value: 'creative' },
            { label: 'Highly Creative', value: 'highly-creative' },
          ],
          admin: {
            description: 'How creative or unpredictable the bot should be',
          },
        },
        {
          name: 'knowledge_sharing',
          type: 'select',
          options: [
            { label: 'Very Limited', value: 'very-limited' },
            { label: 'Limited', value: 'limited' },
            { label: 'Balanced', value: 'balanced' },
            { label: 'Generous', value: 'generous' },
            { label: 'Very Generous', value: 'very-generous' },
          ],
          admin: {
            description: 'How freely the bot shares information',
          },
        },
      ],
    },
    {
      name: 'signature_phrases',
      type: 'array',
      admin: {
        description: 'Catchphrases or signature expressions the bot uses',
      },
      fields: [
        {
          name: 'phrase',
          type: 'text',
        },
      ],
    },
    {
      name: 'tags',
      type: 'array',
      admin: {
        description: 'Tags to help categorize and discover this bot',
      },
      fields: [
        {
          name: 'tag',
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
