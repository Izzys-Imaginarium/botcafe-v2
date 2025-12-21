// storage-adapter-import-placeholder
import { sqliteD1Adapter } from '@payloadcms/db-d1-sqlite' // database-adapter-import
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { resendAdapter } from '@payloadcms/email-resend'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import { CloudflareContext, getCloudflareContext } from '@opennextjs/cloudflare'
import { GetPlatformProxyOptions } from 'wrangler'
import { r2Storage } from '@payloadcms/storage-r2'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Bot } from './collections/Bot'
import { ApiKey } from './collections/ApiKey'
import { Mood } from './collections/Mood'
import { Knowledge } from './collections/Knowledge'
import { KnowledgeCollections } from './collections/KnowledgeCollections'
import { Conversation } from './collections/Conversation'
import { Message } from './collections/Message'
import { Memory } from './collections/Memory'
import { TokenGifts } from './collections/TokenGifts'
import { SubscriptionPayments } from './collections/SubscriptionPayments'
import { SubscriptionTiers } from './collections/SubscriptionTiers'
import { TokenPackages } from './collections/TokenPackages'
import { Personas } from './collections/Personas'
import { CreatorProfiles } from './collections/CreatorProfiles'
import { CreatorPrograms } from './collections/CreatorPrograms'
import { migrations } from './migrations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const cloudflareRemoteBindings = process.env.NODE_ENV === 'production'
const cloudflare =
  process.argv.find((value) => value.match(/^(generate|migrate):?/)) || !cloudflareRemoteBindings
    ? await getCloudflareContextFromWrangler()
    : await getCloudflareContext({ async: true })

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Media,
    Bot,
    ApiKey,
    Mood,
    Knowledge,
    KnowledgeCollections,
    Conversation,
    Message,
    Memory,
    TokenGifts,
    SubscriptionPayments,
    SubscriptionTiers,
    TokenPackages,
    // New collections for multi-tenant architecture
    Personas,
    CreatorProfiles,
    CreatorPrograms,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  email: resendAdapter({
    defaultFromAddress: process.env.FROM_EMAIL || 'noreply@botcafe.app',
    defaultFromName: process.env.FROM_NAME || 'BotCafe Admin',
    apiKey: process.env.RESEND_API_KEY || '',
  }),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  // database-adapter-config-start
  db: sqliteD1Adapter({
    binding: cloudflare.env.D1,
    // Disable schema push in production - use migrations only
    push: process.env.NODE_ENV !== 'production',
    // Provide migrations for production builds
    prodMigrations: migrations,
    // Skip migration checks during build
    migrationDir:
      process.env.NODE_ENV === 'production' ? undefined : path.resolve(dirname, 'migrations'),
  }),
  // database-adapter-config-end
  plugins: [
    // storage-adapter-placeholder
    r2Storage({
      bucket: cloudflare.env.R2,
      collections: { media: true },
    }),
  ],
})

// Adapted from https://github.com/opennextjs/opennextjs-cloudflare/blob/d00b3a13e42e65aad76fba41774815726422cc39/packages/cloudflare/src/api/cloudflare-context.ts#L328C36-L328C46
function getCloudflareContextFromWrangler(): Promise<CloudflareContext> {
  return import(/* webpackIgnore: true */ `${'__wrangler'.replaceAll('_', '')}`).then(
    ({ getPlatformProxy }) =>
      getPlatformProxy({
        environment: process.env.CLOUDFLARE_ENV,
      } satisfies GetPlatformProxyOptions),
  )
}
