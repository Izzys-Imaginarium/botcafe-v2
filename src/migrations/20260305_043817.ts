import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`creator_profiles\` ADD \`social_links_subscribestar\` text;`)
  await db.run(sql`ALTER TABLE \`creator_profiles\` ADD \`social_links_facebook\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`creator_profiles\` DROP COLUMN \`social_links_subscribestar\`;`)
  await db.run(sql`ALTER TABLE \`creator_profiles\` DROP COLUMN \`social_links_facebook\`;`)
}
