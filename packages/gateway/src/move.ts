import type { RoomState } from './protocol.js';

export type MoveCharacter = (characterId: string, direction: string) => Promise<RoomState>;
type MoveResponse = { room: RoomState; error?: string };

export function moveCharacterViaGameServer(gameServerUrl = process.env.GAME_SERVER_URL ?? 'http://127.0.0.1:3001'): MoveCharacter {
  return async (characterId, direction) => {
    const response = await fetch(`${gameServerUrl}/api/characters/${encodeURIComponent(characterId)}/move`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ direction }),
    });
    const payload = (await response.json()) as MoveResponse;
    if (!response.ok) throw new Error(payload.error ?? '脚下道路暂不可通行。');
    return payload.room;
  };
}
