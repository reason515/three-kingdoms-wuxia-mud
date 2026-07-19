import type { RoomState } from './protocol.js';

export type LoadRoom = (roomId: string) => Promise<RoomState>;

type RoomResponse = { room: RoomState; error?: string };

export function loadRoomViaGameServer(gameServerUrl = process.env.GAME_SERVER_URL ?? 'http://127.0.0.1:3001'): LoadRoom {
  return async (roomId) => {
    const response = await fetch(`${gameServerUrl}/api/rooms/${encodeURIComponent(roomId)}`);
    const payload = (await response.json()) as RoomResponse;
    if (!response.ok) throw new Error(payload.error ?? '场景未能载入。');
    return payload.room;
  };
}
