import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { loadNpcs } from '../src/loaders/npcs.js';
import { loadQuests } from '../src/loaders/quests.js';
import { loadRooms } from '../src/loaders/rooms.js';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

describe('quest content', () => {
  it('newbie guide steps reference existing NPCs and rooms', async () => {
    const [quests, npcs, rooms] = await Promise.all([
      loadQuests(resolve(packageRoot, 'quests')),
      loadNpcs(resolve(packageRoot, 'npcs/changan')),
      loadRooms(resolve(packageRoot, 'rooms/changan')),
    ]);
    const npcIds = new Set(npcs.map((npc) => npc.id));
    const roomIds = new Set(rooms.map((room) => room.id));

    const guide = quests.find((quest) => quest.id === 'quest.newbie_guide');
    expect(guide).toBeDefined();
    expect(guide!.steps).toHaveLength(4);

    for (const step of guide!.steps) {
      if (step.type === 'talk') expect(npcIds).toContain(step.target);
      if (step.type === 'goto') expect(roomIds).toContain(step.target);
    }
  });
});
