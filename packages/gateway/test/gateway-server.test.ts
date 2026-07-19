import { once } from 'node:events';
import { describe, expect, it } from 'vitest';
import WebSocket from 'ws';

import { createGatewayServer } from '../src/gateway-server.js';

const character = { id: 'character-1', name: '杜缄', locationRoomId: 'changan.inn', stamina: 100, maxStamina: 100, attributes: { strength: 18, intelligence: 16, dexterity: 14, constitution: 15 } };
const inn = { id: 'changan.inn', name: '长安客店', description: '客店灯火未熄，掌柜在柜后拨弄算盘，等候远客。', exits: { west: 'changan.west_market' }, npcs: [] };
const market = { id: 'changan.west_market', name: '长安西市', description: '晨雾从青石板缝间散去，胡商的铃铛与远处的锤声一同醒来。', exits: { east: 'changan.inn' }, npcs: [] };

describe('gateway session movement', () => {
  it('authenticates, pushes the initial room, and updates the session after movement', async () => {
    const { server, websocket } = createGatewayServer(
      async (username, password) => {
        if (username === 'hanmo' && password === 'stable-password') return character;
        throw new Error('invalid credentials');
      },
      async (roomId) => roomId === inn.id ? inn : market,
      async (_characterId, direction) => {
        if (direction !== 'west') throw new Error('blocked');
        return market;
      },
    );
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Expected TCP address.');

    const client = new WebSocket(`ws://127.0.0.1:${address.port}/ws`);
    const messages: unknown[] = [];
    client.on('message', (message) => messages.push(JSON.parse(message.toString())));
    await once(client, 'open');
    client.send(JSON.stringify({ type: 'auth.login', username: 'hanmo', password: 'stable-password' }));
    await expect.poll(() => messages.length, { timeout: 1_000 }).toBe(2);
    expect(messages).toEqual([{ type: 'session.ready', character }, { type: 'room.update', room: inn }]);

    client.send(JSON.stringify({ type: 'move', direction: 'west' }));
    await expect.poll(() => messages.length, { timeout: 1_000 }).toBe(3);
    expect(messages[2]).toEqual({ type: 'room.update', room: market });

    client.send(JSON.stringify({ type: 'look' }));
    await expect.poll(() => messages.length, { timeout: 1_000 }).toBe(4);
    expect(messages[3]).toEqual({ type: 'room.update', room: market });

    client.close();
    websocket.close();
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  });
});
