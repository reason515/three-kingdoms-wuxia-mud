import { authenticateViaGameServer } from './auth.js';
import { createGatewayServer } from './gateway-server.js';
import { moveCharacterViaGameServer } from './move.js';
import { loadRoomViaGameServer } from './room.js';

const port = Number(process.env.GATEWAY_PORT ?? 3002);
const { server } = createGatewayServer(authenticateViaGameServer(), loadRoomViaGameServer(), moveCharacterViaGameServer());

server.listen(port, '127.0.0.1', () => console.info(`Gateway listening on ws://127.0.0.1:${port}/ws`));
