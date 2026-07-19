import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { createDatabase, migrate } from './client.js';

const filename = resolve(process.env.DATABASE_URL ?? './data/hanmo.db');
mkdirSync(dirname(filename), { recursive: true });
const { client } = await createDatabase(filename);
await migrate(client);
await client.close();
console.info(`Migrated SQLite database: ${filename}`);
