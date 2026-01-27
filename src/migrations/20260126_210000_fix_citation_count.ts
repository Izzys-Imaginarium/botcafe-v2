import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Rename the incorrectly named column from usage_analytics_count to usage_analytics_citation_count
  await db.run(
    `ALTER TABLE knowledge RENAME COLUMN usage_analytics_count TO usage_analytics_citation_count`
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Revert: rename back to the original incorrect name
  await db.run(
    `ALTER TABLE knowledge RENAME COLUMN usage_analytics_citation_count TO usage_analytics_count`
  )
}
