import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { loadNpcs } from '../src/loaders/npcs.js';
import { loadRooms } from '../src/loaders/rooms.js';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const opposite: Record<string, string> = { north: 'south', south: 'north', east: 'west', west: 'east', up: 'down', down: 'up' };

describe('Chang’an starter content', () => {
  it('loads the planned eight-room starter map and named NPCs', async () => {
    const [rooms, npcs] = await Promise.all([
      loadRooms(resolve(packageRoot, 'rooms/changan')),
      loadNpcs(resolve(packageRoot, 'npcs/changan')),
    ]);
    expect(rooms).toHaveLength(8);
    expect(npcs).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'npc.innkeeper_qin', name: '秦掌柜' })]));
  });

  it('has unique IDs, resolved bidirectional exits, and room-matched NPCs', async () => {
    const [rooms, npcs] = await Promise.all([
      loadRooms(resolve(packageRoot, 'rooms/changan')),
      loadNpcs(resolve(packageRoot, 'npcs/changan')),
    ]);
    const byRoom = new Map(rooms.map((room) => [room.id, room]));
    const byNpc = new Map(npcs.map((npc) => [npc.id, npc]));
    expect(byRoom.size).toBe(rooms.length);
    expect(byNpc.size).toBe(npcs.length);
    for (const room of rooms) {
      for (const [direction, targetId] of Object.entries(room.exits)) {
        const target = byRoom.get(targetId);
        expect(target, `${room.id}: ${direction} target exists`).toBeDefined();
        expect(target?.exits[opposite[direction] as keyof typeof target.exits]).toBe(room.id);
      }
      for (const npcId of room.npcs) expect(byNpc.get(npcId)?.location).toBe(room.id);
    }
  });
});
