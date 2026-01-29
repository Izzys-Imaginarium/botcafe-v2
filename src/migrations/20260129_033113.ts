import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`users\` ADD \`migration_completed\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`old_user_id\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`users\` DROP COLUMN \`migration_completed\`;`)
  await db.run(sql`ALTER TABLE \`users\` DROP COLUMN \`old_user_id\`;`)
}
