export type CharacterSummary = {
  id: string;
  name: string;
  locationRoomId: string;
  stamina: number;
  maxStamina: number;
  attributes: { strength: number; intelligence: number; dexterity: number; constitution: number };
};

export type RoomNpc = { id: string; name: string; role: string };
export type RoomState = { id: string; name: string; description: string; exits: Record<string, string>; npcs: RoomNpc[] };

export type GatewayCommand =
  | { type: 'auth.login'; username: string; password: string }
  | { type: 'move'; direction: string }
  | { type: 'look' }
  | { type: 'ping' };

export type GatewayEvent =
  | { type: 'session.ready'; character: CharacterSummary }
  | { type: 'room.update'; room: RoomState }
  | { type: 'pong' }
  | { type: 'error'; code: 'invalid_message' | 'authentication_failed' | 'session_required' | 'room_unavailable' | 'move_failed'; message: string };

export function parseCommand(raw: string): GatewayCommand | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null || !('type' in value)) return null;
    if (value.type === 'ping' || value.type === 'look') return { type: value.type };
    if (value.type === 'move' && 'direction' in value && typeof value.direction === 'string') return { type: 'move', direction: value.direction };
    if (value.type === 'auth.login' && 'username' in value && typeof value.username === 'string' && 'password' in value && typeof value.password === 'string') return { type: 'auth.login', username: value.username, password: value.password };
    return null;
  } catch {
    return null;
  }
}
