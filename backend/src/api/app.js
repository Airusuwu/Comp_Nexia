import { createServer } from 'node:http';

export function createApp() {
  return createServer((request, response) => {
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');

    if (request.url === '/api/health') {
      if (request.method !== 'GET') {
        response.writeHead(405, { Allow: 'GET' });
        response.end(JSON.stringify({ message: 'Método no permitido.' }));
        return;
      }

      response.writeHead(200);
      response.end(JSON.stringify({
        status: 'ok',
        service: 'nexia-backend',
        capabilities: { analysis: false, execution: false }
      }));
      return;
    }

    response.writeHead(404);
    response.end(JSON.stringify({ message: 'Ruta no disponible.' }));
  });
}
