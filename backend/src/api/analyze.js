import { tokenize } from '../lexer/tokenize.js';

const maxBodyBytes = 512 * 1024;
const maxCodeBytes = 64 * 1024;

export class RequestError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let exceeded = false;

    request.on('data', (chunk) => {
      if (exceeded) return;
      size += chunk.length;
      if (size > maxBodyBytes) {
        exceeded = true;
        chunks.length = 0;
        reject(new RequestError(413, 'BODY_TOO_LARGE', 'La solicitud supera el límite de 512 KiB.'));
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => {
      if (!exceeded) resolve(Buffer.concat(chunks));
    });
    request.on('error', reject);
    request.on('aborted', () => reject(new RequestError(400, 'REQUEST_ABORTED', 'La solicitud se interrumpió.')));
  });
}

export async function analyzeRequest(request) {
  const mediaType = request.headers['content-type']?.split(';')[0].trim().toLowerCase();
  if (mediaType !== 'application/json') {
    throw new RequestError(415, 'JSON_REQUIRED', 'Envía el código como application/json.');
  }

  const body = await readBody(request);
  let payload;
  try {
    payload = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(body));
  } catch {
    throw new RequestError(400, 'INVALID_JSON', 'La solicitud debe contener JSON válido en UTF-8.');
  }
  if (!payload || Array.isArray(payload) || typeof payload.code !== 'string') {
    throw new RequestError(400, 'CODE_REQUIRED', 'La solicitud debe incluir el campo code como texto.');
  }
  if (Buffer.byteLength(payload.code, 'utf8') > maxCodeBytes) {
    throw new RequestError(413, 'CODE_TOO_LARGE', 'El código supera el límite de 64 KiB en UTF-8.');
  }
  if (!payload.code.trim()) {
    throw new RequestError(400, 'EMPTY_CODE', 'El editor está vacío. Escribe código antes de enviarlo.');
  }

  const lexical = tokenize(payload.code);
  const failed = lexical.diagnostics.length > 0;
  return {
    status: failed ? 'lexical_error' : 'partial',
    executed: false,
    results: [],
    analysis: { lexical: failed ? 'error' : 'completed', syntactic: 'not_implemented', semantic: 'not_implemented' },
    tokens: lexical.tokens,
    truncated: lexical.truncated,
    diagnostics: failed ? lexical.diagnostics : [{
      code: 'LEXICAL_COMPLETED',
      message: 'Análisis léxico completado. El análisis sintáctico, semántico y la ejecución todavía están pendientes.',
      severity: 'info', stage: 'service', line: null, column: null
    }]
  };
}
