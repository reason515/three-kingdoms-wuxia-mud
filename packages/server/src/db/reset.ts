import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { createDatabase, resetDatabase } from './client.js';

const filename = resolve(process.env.DATABASE_URL ?? './data/hanmo.db');
mkdirSync(dirname(filename), { recursive: true });
const { client } = await createDatabase(filename);
await resetDatabase(client);
client.close();
console.info(`Reset SQLite database: ${filename}`);
