import { once } from 'node:events';
import { describe, expect, it } from 'vitest';

import { createDatabase, migrate } from '../src/db/client.js';
import { createGameServer } from '../src/game-server.js';
import { CombatEngine } from '../src/engine/combat-engine.js';
import { RoomEngine } from '../src/engine/room.js';
import { TrainingEngine } from '../src/engine/training.js';
import { FakeClock, WorldTick } from '../src/tick.js';

describe('health endpoint', () => {
  it('returns service health together with an observable world-tick snapshot', async () => {
    const { client, db } = await createDatabase();
    await migrate(client);
    const clock = new FakeClock(100);
    const tick = new WorldTick(clock);
    clock.advance(1_000);
    await tick.tick();
    const rooms = new RoomEngine([{ id: 'changan.inn', name: '长安客店', description: '客店灯火未熄，掌柜在柜后拨弄算盘，等候远客。', exits: {}, npcs: [], features: ['safe'] }]);
    const { QuestEngine } = await import('../src/engine/quest.js');
    const server = createGameServer(db, tick, rooms, new TrainingEngine(db, []), new CombatEngine(db), new QuestEngine([], db)).listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address();
    if (address === null || typeof address === 'string') throw new Error('Expected TCP address');

    const response = await fetch(`http://127.0.0.1:${address.port}/health`);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: 'ok',
      service: 'game-server',
      tick: { tickId: 1, lastTickAt: 1_100, deltaMs: 1_000, running: false },
    });

    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    client.close();
  });
});
