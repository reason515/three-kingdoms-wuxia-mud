import type { Room } from '@hanmo/content';
import { describe, expect, it } from 'vitest';

import { RoomEngine } from '../../src/engine/room.js';

const inn: Room = { id: 'changan.inn', name: '长安客店', description: '旧木梁撑起低矮屋檐，灯火映在擦得发亮的桌面上，掌柜正在柜后拨弄算盘。', exits: { west: 'changan.west_market' }, npcs: [], features: ['safe'] };
const market: Room = { id: 'changan.west_market', name: '长安西市', description: '晨雾从青石板缝间散去，胡商的铃铛与远处的锤声一同醒来。', exits: { east: 'changan.inn' }, npcs: [], features: [] };

describe('RoomEngine', () => {
  it('returns the player-facing room state without exposing runtime internals', () => {
    const engine = new RoomEngine([inn, market]);
    expect(engine.look('changan.inn')).toEqual({ id: 'changan.inn', name: '长安客店', description: inn.description, exits: { west: 'changan.west_market' }, npcs: [] });
  });

  it('moves only through declared exits and rejects invalid directions', () => {
    const engine = new RoomEngine([inn, market]);
    expect(engine.move('changan.inn', 'west')).toMatchObject({ id: 'changan.west_market', name: '长安西市' });
    expect(() => engine.move('changan.inn', 'east')).toThrow('no east exit');
  });

  it('rejects an unknown room ID', () => {
    expect(() => new RoomEngine([inn, market]).look('changan.missing')).toThrow('Unknown room');
  });
});
