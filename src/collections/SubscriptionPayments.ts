import type { CollectionConfig } from 'payload'

export const SubscriptionPayments: CollectionConfig = {
  slug: 'subscriptionPayments',
  admin: {
    useAsTitle: 'date',
  },
  access: {
    read: ({ req: { user } }) => {
      return {
        user: {
          equals: user?.id,
        },
      }
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
        user: {
          equals: user?.id,
        },
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
    },
    {
      name: 'date',
      type: 'date',
      defaultValue: () => new Date(),
    },
    {
      name: 'tokens',
      type: 'number',
      required: true,
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
    },
    {
      name: 'currency',
      type: 'select',
      required: true,
      options: [
        { label: 'USD', value: 'usd' },
        { label: 'EUR', value: 'eur' },
        { label: 'GBP', value: 'gbp' },
      ],
    },
    {
      name: 'payment_method',
      type: 'select',
      options: [
        { label: 'Credit Card', value: 'credit-card' },
        { label: 'PayPal', value: 'paypal' },
        { label: 'Stripe', value: 'stripe' },
        { label: 'Other', value: 'other' },
      ],
    },
  ],
}
