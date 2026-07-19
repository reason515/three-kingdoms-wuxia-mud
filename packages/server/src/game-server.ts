import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';

import {
  AccountError,
  createCharacter,
  login,
  moveCharacter,
  registerAccount,
  rollAttributes,
  type InnateAttributes,
} from './db/character-service.js';
import type { GameDatabase } from './db/client.js';
import type { CombatEngine } from './engine/combat-engine.js';
import type { QuestEngine } from './engine/quest.js';
import type { Direction, RoomEngine } from './engine/room.js';
import type { TrainingEngine } from './engine/training.js';
import type { WorldTick } from './tick.js';

const corsHeaders = {
  'access-control-allow-origin': 'http://127.0.0.1:5180',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
};

async function body(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  const value: unknown = JSON.parse(raw);
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new AccountError('请求格式不正确。');
  return value as Record<string, unknown>;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function direction(value: unknown): Direction {
  const candidate = text(value);
  if (!['north', 'south', 'east', 'west', 'up', 'down'].includes(candidate)) throw new AccountError('方向不正确。');
  return candidate as Direction;
}

function attributes(value: unknown): InnateAttributes {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new AccountError('先天属性格式不正确。');
  const record = value as Record<string, unknown>;
  return {
    strength: record.strength as number,
    intelligence: record.intelligence as number,
    dexterity: record.dexterity as number,
    constitution: record.constitution as number,
  };
}

function json(response: ServerResponse, status: number, payload: unknown): void {
  response.writeHead(status, { ...corsHeaders, 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

export function createGameServer(db: GameDatabase, tick: WorldTick, rooms: RoomEngine, training: TrainingEngine, combat: CombatEngine, quests: QuestEngine): Server {
  return createServer(async (request, response) => {
    try {
      if (request.method === 'OPTIONS') return json(response, 204, {});
      if (request.method === 'GET' && request.url === '/health') return json(response, 200, { status: 'ok', service: 'game-server', tick: tick.snapshot() });
      if (request.method === 'POST' && request.url === '/api/characters/roll') return json(response, 200, { attributes: rollAttributes() });
      if (request.method === 'GET' && request.url?.startsWith('/api/rooms/')) {
        return json(response, 200, { room: rooms.look(decodeURIComponent(request.url.slice('/api/rooms/'.length))) });
      }

      const trainingMatch = request.url?.match(/^\/api\/characters\/([^/]+)\/training$/);
      if (trainingMatch && request.method === 'GET') return json(response, 200, await training.progress(decodeURIComponent(trainingMatch[1]!)));
      if (trainingMatch && request.method === 'POST') {
        const payload = await body(request);
        return json(response, 200, await training.start(decodeURIComponent(trainingMatch[1]!), text(payload.skillId)));
      }
      const stopTrainingMatch = request.url?.match(/^\/api\/characters\/([^/]+)\/training\/stop$/);
      if (stopTrainingMatch && request.method === 'POST') {
        await training.stop(decodeURIComponent(stopTrainingMatch[1]!));
        return json(response, 200, { stopped: true });
      }

      const combatMatch = request.url?.match(/^\/api\/characters\/([^/]+)\/combat$/);
      if (combatMatch && request.method === 'GET') return json(response, 200, { combat: combat.status(decodeURIComponent(combatMatch[1]!)) ?? null });
      if (combatMatch && request.method === 'POST') {
        const payload = await body(request);
        return json(response, 200, await combat.start(decodeURIComponent(combatMatch[1]!), text(payload.enemyId)));
      }
      const fleeMatch = request.url?.match(/^\/api\/characters\/([^/]+)\/combat\/flee$/);
      if (fleeMatch && request.method === 'POST') {
        await combat.flee(decodeURIComponent(fleeMatch[1]!));
        return json(response, 200, { fled: true });
      }

      const questMatch = request.url?.match(/^\/api\/characters\/([^/]+)\/quests$/);
      if (questMatch && request.method === 'GET') return json(response, 200, { quests: await quests.progress(decodeURIComponent(questMatch[1]!)) });
      if (questMatch && request.method === 'POST') {
        const payload = await body(request);
        return json(response, 201, await quests.accept(decodeURIComponent(questMatch[1]!), text(payload.questId)));
      }
      const questActionMatch = request.url?.match(/^\/api\/characters\/([^/]+)\/quests\/action$/);
      if (questActionMatch && request.method === 'POST') {
        const payload = await body(request);
        return json(response, 200, { result: await quests.reportAction(decodeURIComponent(questActionMatch[1]!), { type: text(payload.type) as 'talk' | 'goto' | 'kill', target: text(payload.target) }) });
      }

      if (request.method === 'POST' && request.url === '/api/accounts') {
        const payload = await body(request);
        const playerId = await registerAccount(db, text(payload.username), text(payload.password));
        return json(response, 201, { playerId });
      }
      const moveMatch = request.url?.match(/^\/api\/characters\/([^/]+)\/move$/);
      if (request.method === 'POST' && moveMatch) {
        const payload = await body(request);
        const room = await moveCharacter(db, rooms, decodeURIComponent(moveMatch[1]!), direction(payload.direction));
        return json(response, 200, { room });
      }
      if (request.method === 'POST' && request.url === '/api/characters') {
        const payload = await body(request);
        const profile = await createCharacter(db, text(payload.playerId), text(payload.name), attributes(payload.attributes));
        return json(response, 201, { character: profile });
      }
      if (request.method === 'POST' && request.url === '/api/sessions') {
        const payload = await body(request);
        return json(response, 200, { character: await login(db, text(payload.username), text(payload.password)) });
      }
      return json(response, 404, { error: 'not_found' });
    } catch (error) {
      if (error instanceof AccountError) return json(response, 400, { error: error.message });
      if (error instanceof SyntaxError) return json(response, 400, { error: '请求格式不正确。' });
      console.error(error);
      return json(response, 500, { error: '服务器暂时无法处理此请求。' });
    }
  });
}
