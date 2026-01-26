import type { CollectionConfig } from 'payload'

/**
 * CreatorFollows Collection
 *
 * Tracks follow relationships between users and creator profiles.
 * A user can follow any creator profile (including their own, though UI may prevent this).
 */
export const CreatorFollows: CollectionConfig = {
  slug: 'creatorFollows',
  admin: {
    useAsTitle: 'id',
    description: 'Tracks user follows on creator profiles',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'follower',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      admin: {
        description: 'The user who is following',
      },
    },
    {
      name: 'following',
      type: 'relationship',
      relationTo: 'creatorProfiles',
      required: true,
      index: true,
      admin: {
        description: 'The creator profile being followed',
      },
    },
    {
      name: 'created_timestamp',
      type: 'date',
      defaultValue: () => new Date(),
      admin: {
        description: 'When the follow relationship was created',
      },
    },
  ],
  indexes: [
    {
      name: 'follower_following_unique',
      fields: ['follower', 'following'],
      unique: true,
    },
  ],
}
