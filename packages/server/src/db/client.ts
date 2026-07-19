import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

import { createClient, type Client } from '@libsql/client';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';

import * as schema from './schema.js';

export type GameDatabase = LibSQLDatabase<typeof schema>;

function databaseUrl(filename: string): string {
  if (filename === ':memory:') return 'file::memory:';
  return filename.startsWith('file:') ? filename : pathToFileURL(resolve(filename)).href;
}

export async function createDatabase(filename = ':memory:'): Promise<{ client: Client; db: GameDatabase }> {
  const client = createClient({ url: databaseUrl(filename) });
  await client.execute('PRAGMA foreign_keys = ON');
  return { client, db: drizzle(client, { schema }) };
}

function readMigration(filename: string): string {
  const migrationPath = resolve(dirname(fileURLToPath(import.meta.url)), `../../drizzle/${filename}`);
  return readFileSync(migrationPath, 'utf8').replaceAll('--> statement-breakpoint', '');
}

export async function migrate(client: Client): Promise<void> {
  const runSafe = async (filename: string) => {
    try { await client.executeMultiple(readMigration(filename)); } catch (error) { if (!(error instanceof Error && /duplicate column/i.test(error.message))) throw error; }
  };
  await client.executeMultiple(readMigration('0000_initial.sql'));
  await client.executeMultiple(readMigration('0001_character_skills.sql'));
  await client.executeMultiple(readMigration('0002_training_states.sql'));
  await runSafe('0003_stamina.sql');
  await runSafe('0004_training_stopped_at.sql');
  await runSafe('0005_character_quests.sql');
}

export async function resetDatabase(client: Client): Promise<void> {
  await client.executeMultiple(readMigration('0005_character_quests.down.sql'));
  await client.executeMultiple(readMigration('0004_training_stopped_at.down.sql'));
  await client.executeMultiple(readMigration('0003_stamina.down.sql'));
  await client.executeMultiple(readMigration('0002_training_states.down.sql'));
  await client.executeMultiple(readMigration('0001_character_skills.down.sql'));
  await client.executeMultiple(readMigration('0000_initial.down.sql'));
}
