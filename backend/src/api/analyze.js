import { tokenize } from '../lexer/tokenize.js';
import { parse } from '../parser/parse.js';
import { analyzeSemantics } from '../semantic/analyze.js';
import { execute } from '../runtime/execute.js';

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

export async function analyzeRequest(request, { run = false, signal } = {}) {
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
  const inputs = payload.inputs ?? [];
  if (run && (!Array.isArray(inputs) || inputs.length > 100 || inputs.some(input => typeof input !== 'string' || input.length > 65536))) {
    throw new RequestError(400, 'INVALID_INPUTS', 'inputs debe ser una lista de hasta 100 textos de máximo 65536 unidades cada uno.');
  }

  const lexical = tokenize(payload.code);
  const failed = lexical.diagnostics.length > 0;
  const syntax = failed ? null : parse(lexical.tokens);
  const syntaxFailed = syntax?.diagnostics.length > 0;
  const semantic = syntax?.ast ? analyzeSemantics(syntax.ast) : null;
  const semanticFailed = semantic?.diagnostics.length > 0;
  const analysis = {
    status: failed ? 'lexical_error' : syntaxFailed ? 'syntactic_error' : semanticFailed ? 'semantic_error' : 'analyzed',
    executed: false,
    results: [],
    analysis: { lexical: failed ? 'error' : 'completed', syntactic: failed ? 'skipped' : syntaxFailed ? 'error' : 'completed', semantic: !semantic ? 'skipped' : semanticFailed ? 'error' : 'completed' },
    symbols: semantic?.symbols ?? [],
    runtimeChecks: semantic?.runtimeChecks ?? [],
    tokens: lexical.tokens,
    ast: syntax?.ast ?? null,
    truncated: lexical.truncated || (syntax?.truncated ?? false),
    diagnostics: failed ? lexical.diagnostics : syntaxFailed ? syntax.diagnostics : semanticFailed ? semantic.diagnostics : [{
      code: 'ANALYSIS_COMPLETED',
      message: `Análisis léxico, sintáctico y semántico completados. El programa no se ha ejecutado. Controles pendientes de ejecución: ${semantic.runtimeChecks.length}.`,
      severity: 'info', stage: 'service', line: null, column: null
    }]
  };
  if (!run || analysis.status !== 'analyzed') return analysis;
  return { ...analysis, ...await execute(syntax.ast, inputs, { signal }) };
}
