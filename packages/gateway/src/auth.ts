import type { CharacterSummary } from './protocol.js';

export type Authenticate = (username: string, password: string) => Promise<CharacterSummary>;

type LoginResponse = { character: CharacterSummary | null; error?: string };

export function authenticateViaGameServer(gameServerUrl = process.env.GAME_SERVER_URL ?? 'http://127.0.0.1:3001'): Authenticate {
  return async (username, password) => {
    const response = await fetch(`${gameServerUrl}/api/sessions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const payload = (await response.json()) as LoginResponse;
    if (!response.ok || !payload.character) throw new Error(payload.error ?? '认证失败。');
    return payload.character;
  };
}
