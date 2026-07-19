import { createServer, type Server } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';

import type { Authenticate } from './auth.js';
import type { MoveCharacter } from './move.js';
import { parseCommand, type CharacterSummary, type GatewayEvent } from './protocol.js';
import type { LoadRoom } from './room.js';

function send(socket: WebSocket, event: GatewayEvent): void {
  socket.send(JSON.stringify(event));
}

export function createGatewayServer(
  authenticate: Authenticate,
  loadRoom: LoadRoom,
  moveCharacter: MoveCharacter,
): { server: Server; websocket: WebSocketServer } {
  const server = createServer((request, response) => {
    if (request.method === 'GET' && request.url === '/health') {
      response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ status: 'ok', service: 'gateway' }));
      return;
    }
    response.writeHead(404).end();
  });
  const websocket = new WebSocketServer({ server, path: '/ws' });

  websocket.on('connection', (socket) => {
    let character: CharacterSummary | undefined;
    socket.on('message', async (raw) => {
      const command = parseCommand(raw.toString());
      if (!command) return send(socket, { type: 'error', code: 'invalid_message', message: '消息格式不正确。' });
      if (command.type === 'ping') return send(socket, { type: 'pong' });
      if (command.type === 'auth.login') {
        try {
          character = await authenticate(command.username, command.password);
          send(socket, { type: 'session.ready', character });
          send(socket, { type: 'room.update', room: await loadRoom(character.locationRoomId) });
        } catch {
          return send(socket, { type: 'error', code: 'authentication_failed', message: '账号、口令或角色状态不正确。' });
        }
        return;
      }
      if (!character) return send(socket, { type: 'error', code: 'session_required', message: '请先入城登记。' });
      if (command.type === 'move') {
        try {
          const room = await moveCharacter(character.id, command.direction);
          character = { ...character, locationRoomId: room.id };
          return send(socket, { type: 'room.update', room });
        } catch {
          return send(socket, { type: 'error', code: 'move_failed', message: '此路不通。' });
        }
      }
      try {
        send(socket, { type: 'room.update', room: await loadRoom(character.locationRoomId) });
      } catch {
        send(socket, { type: 'error', code: 'room_unavailable', message: '眼前景物暂不可见。' });
      }
    });
  });

  return { server, websocket };
}
