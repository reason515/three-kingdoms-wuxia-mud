export type Attributes = { strength: number; intelligence: number; dexterity: number; constitution: number };
export type Character = { id: string; name: string; locationRoomId: string; stamina: number; maxStamina: number; attributes: Attributes };
export type SkillProgress = { skillId: string; name: string; proficiency: number };
export type TrainingProgress = { active?: { characterId: string; skillId: string; startedAt: number }; skills: SkillProgress[]; stamina: number; maxStamina: number; offlineSettled?: { gain: number; hours: number } }; 

const api = 'http://127.0.0.1:3001/api';

async function request<T>(path: string, body?: object): Promise<T> {
  const response = await fetch(`${api}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(result.error ?? '江湖文牒未能送达。');
  return result;
}

export async function register(username: string, password: string): Promise<string> {
  const result = await request<{ playerId: string }>('/accounts', { username, password });
  return result.playerId;
}

export async function roll(): Promise<Attributes> {
  return (await request<{ attributes: Attributes }>('/characters/roll')).attributes;
}

export async function createCharacter(playerId: string, name: string, attributes: Attributes): Promise<Character> {
  return (await request<{ character: Character }>('/characters', { playerId, name, attributes })).character;
}

export async function signIn(username: string, password: string): Promise<Character | null> {
  return (await request<{ character: Character | null }>('/sessions', { username, password })).character;
}

export async function trainingProgress(characterId: string): Promise<TrainingProgress> {
  const response = await fetch(`${api}/characters/${encodeURIComponent(characterId)}/training`);
  if (!response.ok) throw new Error('修炼进度暂不可见。');
  return response.json() as Promise<TrainingProgress>;
}

export function startTraining(characterId: string, skillId: string): Promise<unknown> {
  return request(`/characters/${encodeURIComponent(characterId)}/training`, { skillId });
}

export function stopTraining(characterId: string): Promise<unknown> {
  return request(`/characters/${encodeURIComponent(characterId)}/training/stop`, {});
}

export type CombatLogEntry = { round: number; type: string; attacker: string; damage: number; message: string };
export type CombatSnapshot = { state?: { characterId: string; enemy: { id: string; name: string; hp: number; atk: number; def: number }; enemyHp: number; playerHp: number; playerMaxHp: number; round: number; log: CombatLogEntry[]; result?: string }; proficiency: { skillId: string; name: string; proficiency: number }[] };

export async function combatStatus(characterId: string): Promise<{ combat: CombatSnapshot['state'] | null }> {
  const response = await fetch(`${api}/characters/${encodeURIComponent(characterId)}/combat`);
  if (!response.ok) return { combat: null };
  return response.json() as Promise<{ combat: CombatSnapshot['state'] | null }>;
}

export function startCombat(characterId: string, enemyId: string): Promise<unknown> {
  return request(`/characters/${encodeURIComponent(characterId)}/combat`, { enemyId });
}

export function fleeCombat(characterId: string): Promise<unknown> {
  return request(`/characters/${encodeURIComponent(characterId)}/combat/flee`, {});
}

export type QuestProgress = { questId: string; questName: string; stepIndex: number; stepCount: number; stepDescription: string; completed: boolean };

export async function questsProgress(characterId: string): Promise<{ quests: QuestProgress[] }> {
  const response = await fetch(`${api}/characters/${encodeURIComponent(characterId)}/quests`);
  if (!response.ok) return { quests: [] };
  return response.json() as Promise<{ quests: QuestProgress[] }>;
}

export function acceptQuest(characterId: string, questId: string): Promise<QuestProgress | null> {
  return request(`/characters/${encodeURIComponent(characterId)}/quests`, { questId });
}

export function reportQuestAction(characterId: string, type: string, target: string): Promise<{ result: { questId: string; stepIndex: number; completed: boolean; message: string } | null }> {
  return request(`/characters/${encodeURIComponent(characterId)}/quests/action`, { type, target });
}
