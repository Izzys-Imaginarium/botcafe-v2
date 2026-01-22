import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_vector_records\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`vector_id\` text NOT NULL,
  	\`source_type\` text NOT NULL,
  	\`source_id\` text NOT NULL,
  	\`user_id_id\` integer NOT NULL,
  	\`tenant_id\` text NOT NULL,
  	\`chunk_index\` numeric NOT NULL,
  	\`total_chunks\` numeric NOT NULL,
  	\`chunk_text\` text NOT NULL,
  	\`metadata\` text NOT NULL,
  	\`embedding_model\` text DEFAULT '@cf/baai/bge-m3' NOT NULL,
  	\`embedding_dimensions\` numeric DEFAULT 1024 NOT NULL,
  	\`embedding\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`user_id_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new_vector_records\`("id", "vector_id", "source_type", "source_id", "user_id_id", "tenant_id", "chunk_index", "total_chunks", "chunk_text", "metadata", "embedding_model", "embedding_dimensions", "embedding", "updated_at", "created_at") SELECT "id", "vector_id", "source_type", "source_id", "user_id_id", "tenant_id", "chunk_index", "total_chunks", "chunk_text", "metadata", "embedding_model", "embedding_dimensions", "embedding", "updated_at", "created_at" FROM \`vector_records\`;`)
  await db.run(sql`DROP TABLE \`vector_records\`;`)
  await db.run(sql`ALTER TABLE \`__new_vector_records\` RENAME TO \`vector_records\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE UNIQUE INDEX \`vector_records_vector_id_idx\` ON \`vector_records\` (\`vector_id\`);`)
  await db.run(sql`CREATE INDEX \`vector_records_source_type_idx\` ON \`vector_records\` (\`source_type\`);`)
  await db.run(sql`CREATE INDEX \`vector_records_source_id_idx\` ON \`vector_records\` (\`source_id\`);`)
  await db.run(sql`CREATE INDEX \`vector_records_user_id_idx\` ON \`vector_records\` (\`user_id_id\`);`)
  await db.run(sql`CREATE INDEX \`vector_records_tenant_id_idx\` ON \`vector_records\` (\`tenant_id\`);`)
  await db.run(sql`CREATE INDEX \`vector_records_updated_at_idx\` ON \`vector_records\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`vector_records_created_at_idx\` ON \`vector_records\` (\`created_at\`);`)
  await db.run(sql`ALTER TABLE \`bot\` ADD \`sharing_visibility\` text DEFAULT 'private';`)
  await db.run(sql`ALTER TABLE \`conversation\` ADD \`title\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_vector_records\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`vector_id\` text NOT NULL,
  	\`source_type\` text NOT NULL,
  	\`source_id\` text NOT NULL,
  	\`user_id_id\` integer NOT NULL,
  	\`tenant_id\` text NOT NULL,
  	\`chunk_index\` numeric NOT NULL,
  	\`total_chunks\` numeric NOT NULL,
  	\`chunk_text\` text NOT NULL,
  	\`metadata\` text NOT NULL,
  	\`embedding_model\` text DEFAULT 'text-embedding-3-small' NOT NULL,
  	\`embedding_dimensions\` numeric DEFAULT 1536 NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`user_id_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new_vector_records\`("id", "vector_id", "source_type", "source_id", "user_id_id", "tenant_id", "chunk_index", "total_chunks", "chunk_text", "metadata", "embedding_model", "embedding_dimensions", "updated_at", "created_at") SELECT "id", "vector_id", "source_type", "source_id", "user_id_id", "tenant_id", "chunk_index", "total_chunks", "chunk_text", "metadata", "embedding_model", "embedding_dimensions", "updated_at", "created_at" FROM \`vector_records\`;`)
  await db.run(sql`DROP TABLE \`vector_records\`;`)
  await db.run(sql`ALTER TABLE \`__new_vector_records\` RENAME TO \`vector_records\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE UNIQUE INDEX \`vector_records_vector_id_idx\` ON \`vector_records\` (\`vector_id\`);`)
  await db.run(sql`CREATE INDEX \`vector_records_source_type_idx\` ON \`vector_records\` (\`source_type\`);`)
  await db.run(sql`CREATE INDEX \`vector_records_source_id_idx\` ON \`vector_records\` (\`source_id\`);`)
  await db.run(sql`CREATE INDEX \`vector_records_user_id_idx\` ON \`vector_records\` (\`user_id_id\`);`)
  await db.run(sql`CREATE INDEX \`vector_records_tenant_id_idx\` ON \`vector_records\` (\`tenant_id\`);`)
  await db.run(sql`CREATE INDEX \`vector_records_updated_at_idx\` ON \`vector_records\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`vector_records_created_at_idx\` ON \`vector_records\` (\`created_at\`);`)
  await db.run(sql`ALTER TABLE \`bot\` DROP COLUMN \`sharing_visibility\`;`)
  await db.run(sql`ALTER TABLE \`conversation\` DROP COLUMN \`title\`;`)
}
