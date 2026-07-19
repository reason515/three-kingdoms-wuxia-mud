import { loadBundledQuests, loadBundledSkills } from '@hanmo/content';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { createDatabase, migrate } from './db/client.js';
import { createGameServer } from './game-server.js';
import { CombatEngine } from './engine/combat-engine.js';
import { QuestEngine } from './engine/quest.js';
import { RoomEngine } from './engine/room.js';
import { TrainingEngine } from './engine/training.js';
import { WorldTick } from './tick.js';

const port = Number(process.env.SERVER_PORT ?? 3001);
const databaseFile = resolve(process.env.DATABASE_URL ?? './data/hanmo.db');
mkdirSync(dirname(databaseFile), { recursive: true });
const { client, db } = await createDatabase(databaseFile);
await migrate(client);
const tick = new WorldTick();
const training = new TrainingEngine(db, await loadBundledSkills());
await training.hydrate();
tick.register(training);
const combat = new CombatEngine(db);
tick.register(combat);
const quests = new QuestEngine(await loadBundledQuests(), db, await loadBundledSkills());
tick.start();
const rooms = await RoomEngine.fromContent();
const server = createGameServer(db, tick, rooms, training, combat, quests);

server.listen(port, '127.0.0.1', () => {
  console.info(`Game server listening on http://127.0.0.1:${port}`);
});

function shutdown() {
  server.close(() => {
    tick.stop();
    client.close();
    process.exit(0);
  });
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
