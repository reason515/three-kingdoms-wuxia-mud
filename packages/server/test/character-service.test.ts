import { describe, expect, it } from 'vitest';

import { createCharacter, login, moveCharacter, registerAccount, rollAttributes } from '../src/db/character-service.js';
import { createDatabase, migrate } from '../src/db/client.js';
import { RoomEngine } from '../src/engine/room.js';
import { characterSkills } from '../src/db/schema.js';

const attributes = { strength: 18, intelligence: 16, dexterity: 14, constitution: 15 };

describe('account and character persistence', () => {
  it('creates, reads, and re-logs a character with its inn location and attributes', async () => {
    const { client, db } = await createDatabase();
    await migrate(client);

    const playerId = await registerAccount(db, 'hanmo_test', 'stable-password');
    await createCharacter(db, playerId, '杜缄', attributes);

    await expect(login(db, 'hanmo_test', 'stable-password')).resolves.toMatchObject({
      name: '杜缄',
      locationRoomId: 'changan.inn',
      attributes,
    });
    await expect(login(db, 'hanmo_test', 'wrong-password')).rejects.toThrow('账号或口令不正确。');
    await expect(db.select().from(characterSkills)).resolves.toEqual([
      expect.objectContaining({ skillId: 'skill.basic_breathing', proficiency: 0 }),
    ]);
    client.close();
  });

  it('persists a legal room move for the next login', async () => {
    const { client, db } = await createDatabase();
    await migrate(client);
    const playerId = await registerAccount(db, 'move_test', 'stable-password');
    const character = await createCharacter(db, playerId, '任朔', attributes);
    const rooms = new RoomEngine([
      { id: 'changan.inn', name: '长安客店', description: '客店灯火未熄，掌柜正在柜后拨弄算盘，等候远客。', exits: { west: 'changan.west_market' }, npcs: [], features: ['safe'] },
      { id: 'changan.west_market', name: '长安西市', description: '晨雾从青石板缝间散去，胡商的铃铛与远处的锤声一同醒来。', exits: { east: 'changan.inn' }, npcs: [], features: [] },
    ]);

    await expect(moveCharacter(db, rooms, character.id, 'west')).resolves.toMatchObject({ id: 'changan.west_market' });
    await expect(login(db, 'move_test', 'stable-password')).resolves.toMatchObject({ locationRoomId: 'changan.west_market' });
    await expect(moveCharacter(db, rooms, character.id, 'north')).rejects.toThrow('no north exit');
    client.close();
  });

  it('rolls exactly four 3d10 attributes with an injectable random source', () => {
    expect(rollAttributes(() => 0)).toEqual({ strength: 3, intelligence: 3, dexterity: 3, constitution: 3 });
    expect(rollAttributes(() => 0.999)).toEqual({ strength: 30, intelligence: 30, dexterity: 30, constitution: 30 });
  });
});
