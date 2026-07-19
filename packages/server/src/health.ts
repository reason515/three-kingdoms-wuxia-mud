import { createServer, type Server } from 'node:http';

export function createHealthServer(): Server {
  return createServer((request, response) => {
    if (request.method === 'GET' && request.url === '/health') {
      response.writeHead(200, {
        'access-control-allow-origin': 'http://127.0.0.1:5180',
        'content-type': 'application/json; charset=utf-8',
      });
      response.end(JSON.stringify({ status: 'ok', service: 'game-server' }));
      return;
    }

    response.writeHead(404, { 'content-type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ error: 'not_found' }));
  });
}
