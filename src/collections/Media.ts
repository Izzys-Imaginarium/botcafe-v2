import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: {
    // Disable all sharp-dependent features for Cloudflare Workers compatibility
    crop: false,
    focalPoint: false,
    // Disable image size generation (requires sharp)
    // With no imageSizes, admin thumbnails won't be generated
    imageSizes: [],
    // Disable resizing and format conversion
    resizeOptions: undefined,
    formatOptions: undefined,
    // Explicitly allow common image types
    mimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
      'text/plain',
    ],
  },
}
