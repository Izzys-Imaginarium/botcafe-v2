import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
    // Email added by default
    {
      name: 'username',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'profile_pic',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'bio',
      type: 'textarea',
    },
    {
      name: 'pronouns',
      type: 'text',
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
    },
    {
      name: 'first_name',
      type: 'text',
    },
    {
      name: 'last_name',
      type: 'text',
    },
    {
      name: 'birthday',
      type: 'date',
    },
    {
      name: 'discord',
      type: 'text',
    },
    {
      name: 'google_id',
      type: 'text',
      unique: true,
    },
    {
      name: 'api_keys',
      type: 'relationship',
      relationTo: 'api-key',
      hasMany: true,
    },
  ],
}
