import { readFile } from 'node:fs/promises';

const frontendRoot = new URL('../../../frontend/', import.meta.url);
// Lista cerrada: nunca se usa la ruta solicitada para leer archivos arbitrarios.
const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/assets/css/base.css', ['assets/css/base.css', 'text/css; charset=utf-8']],
  ['/assets/css/components.css', ['assets/css/components.css', 'text/css; charset=utf-8']],
  ['/assets/js/editor.js', ['assets/js/editor.js', 'text/javascript; charset=utf-8']]
]);

// Devuelve true si atendió la ruta; false permite que app.js responda 404.
export async function serveFrontend(request, response, pathname) {
  const asset = assets.get(pathname);
  if (!asset) return false;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end();
    return true;
  }
  const [filename, contentType] = asset;
  const contents = await readFile(new URL(filename, frontendRoot));
  response.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': contents.length,
    'X-Content-Type-Options': 'nosniff'
  });
  // HEAD devuelve los mismos encabezados que GET, pero sin el contenido.
  response.end(request.method === 'HEAD' ? undefined : contents);
  return true;
}
