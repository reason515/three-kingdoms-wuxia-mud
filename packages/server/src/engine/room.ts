import { loadBundledNpcs, loadBundledRooms, type Npc, type Room } from '@hanmo/content';

export type NpcState = Pick<Npc, 'id' | 'name' | 'role'>;
export type RoomState = Omit<Pick<Room, 'id' | 'name' | 'description' | 'exits'>, 'npcs'> & { npcs: NpcState[] };
export type Direction = keyof Room['exits'];

export class RoomEngine {
  private readonly rooms: ReadonlyMap<string, Room>;
  private readonly npcs: ReadonlyMap<string, Npc>;

  constructor(rooms: readonly Room[], npcs: readonly Npc[] = []) {
    this.rooms = new Map(rooms.map((room) => [room.id, room]));
    this.npcs = new Map(npcs.map((npc) => [npc.id, npc]));
  }

  static async fromContent(): Promise<RoomEngine> {
    const [rooms, npcs] = await Promise.all([loadBundledRooms(), loadBundledNpcs()]);
    return new RoomEngine(rooms, npcs);
  }

  look(roomId: string): RoomState {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error(`Unknown room: ${roomId}`);
    const npcs = room.npcs.map((id) => {
      const npc = this.npcs.get(id);
      if (!npc) throw new Error(`${roomId}: unknown NPC ${id}`);
      return { id: npc.id, name: npc.name, role: npc.role };
    });
    return { id: room.id, name: room.name, description: room.description, exits: room.exits, npcs };
  }

  move(roomId: string, direction: Direction): RoomState {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error(`Unknown room: ${roomId}`);
    const targetId = room.exits[direction];
    if (!targetId) throw new Error(`${roomId}: no ${direction} exit`);
    return this.look(targetId);
  }
}
