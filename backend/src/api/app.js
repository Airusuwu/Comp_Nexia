import { createServer } from 'node:http';
import { analyzeRequest, RequestError } from './analyze.js';
import { serveFrontend } from './static.js';
import { diagnosticResponse } from '../diagnostics/response.js';

// Centraliza la serialización HTTP; payload contiene el resultado del compilador.
function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

// Crea el servidor sin abrir un puerto: server.js decide dónde escuchar.
export function createApp() {
  return createServer({ requestTimeout: 10000, headersTimeout: 10000 }, async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    try {
      // Defensa adicional al enlace local: rechaza Host ajenos a localhost.
      const host = request.headers.host ?? '';
      if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host)) {
        throw new RequestError(403, 'LOCAL_ONLY', 'Este servidor solo admite acceso local.');
      }
      const pathname = new URL(request.url, `http://${host}`).pathname;
      if (pathname === '/api/health') {
        if (request.method !== 'GET') {
          response.setHeader('Allow', 'GET');
          throw new RequestError(405, 'METHOD_NOT_ALLOWED', 'Método no permitido.');
        }
        sendJson(response, 200, {
          status: 'ok',
          service: 'nexia-backend',
          capabilities: { analysis: true, lexical: true, syntactic: true, semantic: true, execution: true }
        });
        return;
      }
      if (['/api/analyze', '/api/execute'].includes(pathname)) {
        if (request.method !== 'POST') {
          response.setHeader('Allow', 'POST');
          throw new RequestError(405, 'METHOD_NOT_ALLOWED', 'Usa POST para enviar el código.');
        }
        if (request.headers.origin && request.headers.origin !== `http://${host}`) {
          throw new RequestError(403, 'ORIGIN_NOT_ALLOWED', 'Abre Nexia desde este servidor local para enviar el código.');
        }
        // Si el cliente cierra la conexión, el motor puede cancelar cooperativamente.
        const controller = new AbortController();
        const cancel = () => controller.abort();
        response.once('close', cancel);
        try {
          const analysis = await analyzeRequest(request, { run: pathname === '/api/execute', signal: controller.signal });
          if (!response.destroyed) sendJson(response, ['lexical_error', 'syntactic_error', 'semantic_error', 'runtime_error'].includes(analysis.status) ? 422 : 200, analysis);
        } finally {
          response.removeListener('close', cancel);
        }
        return;
      }
      if (await serveFrontend(request, response, pathname)) return;
      throw new RequestError(404, 'NOT_FOUND', 'Ruta no disponible.');
    } catch (error) {
      if (response.destroyed || response.writableEnded) return;
      // Los errores internos no se exponen al navegador con sus detalles técnicos.
      const knownError = error instanceof RequestError;
      sendJson(response, knownError ? error.statusCode : 500, diagnosticResponse(
        knownError ? 'invalid_request' : 'error',
        knownError ? error.code : 'INTERNAL_ERROR',
        knownError ? error.message : 'No se pudo procesar la solicitud. El código permanece en el editor.'
      ));
    }
  });
}
