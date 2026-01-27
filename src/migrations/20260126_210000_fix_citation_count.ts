import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Rename the incorrectly named column from usage_analytics_count to usage_analytics_citation_count
  await db.run(sql`ALTER TABLE \`knowledge\` RENAME COLUMN \`usage_analytics_count\` TO \`usage_analytics_citation_count\``)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Revert: rename back to the original incorrect name
  await db.run(sql`ALTER TABLE \`knowledge\` RENAME COLUMN \`usage_analytics_citation_count\` TO \`usage_analytics_count\``)
}
