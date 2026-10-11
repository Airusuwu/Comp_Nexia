import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { setImmediate as yieldTurn } from 'node:timers/promises';
import { createApp } from '../src/api/app.js';
import { executeIntermediate } from '../src/runtime/execute-intermediate.js';
import { SymbolTable } from '../src/symbols/table.js';

let server;
let baseUrl;
const source = body => `Inicio\n${body}\nFin`;
const arithmetic = source('Definir a Como ENTERO\na <- 2 + 3 * 4\nEscribir a');

before(async () => {
  server = createApp();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  if (server?.listening) await new Promise((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
  });
});

async function request(endpoint, payload) {
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload)
  });
  return { httpStatus: response.status, body: await response.json() };
}

describe('contrato API de ejecución y optimización', () => {
  it('analiza y optimiza por defecto sin iniciar el motor ni pedir entradas', async () => {
    const { httpStatus, body } = await request('/api/analyze', {
      code: source('Definir dato Como ENTERO\nLeer dato\nEscribir dato, 2 + 3 * 4')
    });
    assert.equal(httpStatus, 200);
    assert.equal(body.status, 'analyzed');
    assert.equal(body.executed, false);
    assert.equal(body.executionEngine, null);
    assert.equal(body.input, undefined);
    assert.deepEqual(body.results, []);
    assert.equal(body.analysis.optimization, 'completed');
    assert.equal(body.optimization.enabled, true);
    assert.equal(body.optimization.foldedExpressions, 2);
    assert.equal(body.intermediateCode.version, 2);
    assert.equal(body.optimizedIntermediateCode.version, 2);
  });

  it('ejecuta el mismo IR optimizado que entrega en la respuesta', async () => {
    const { httpStatus, body } = await request('/api/execute', { code: arithmetic });
    assert.equal(httpStatus, 200);
    assert.equal(body.status, 'completed');
    assert.equal(body.executionEngine, 'quadruples');
    assert.deepEqual(body.results, ['14']);
    const direct = await executeIntermediate(body.optimizedIntermediateCode);
    for (const field of ['status', 'executed', 'results', 'diagnostics', 'steps', 'instructions']) {
      assert.deepEqual(body[field], direct[field], field);
    }
    assert.equal(body.optimization.inputInstructions, body.intermediateCode.quadruples.length);
    assert.equal(body.optimization.outputInstructions, body.optimizedIntermediateCode.quadruples.length);
  });

  it('optimize false usa el IR original y conserva resultados y presupuesto de pasos', async () => {
    const enabled = await request('/api/execute', { code: arithmetic, optimize: true });
    const disabled = await request('/api/execute', { code: arithmetic, optimize: false });
    assert.equal(disabled.httpStatus, 200);
    assert.equal(disabled.body.executionEngine, 'quadruples');
    assert.equal(disabled.body.analysis.optimization, 'skipped');
    assert.equal(disabled.body.optimization.enabled, false);
    assert.equal(disabled.body.optimization.foldedExpressions, 0);
    assert.equal(disabled.body.optimizedIntermediateCode, null);
    assert.deepEqual(disabled.body.results, enabled.body.results);
    assert.deepEqual(disabled.body.intermediateCode, enabled.body.intermediateCode);
    assert.equal(disabled.body.steps, enabled.body.steps);
    assert.ok(disabled.body.instructions > enabled.body.instructions);
    const direct = await executeIntermediate(disabled.body.intermediateCode);
    assert.equal(disabled.body.instructions, direct.instructions);
  });

  it('analizar con optimize false conserva IR sin ejecutar ni optimizar', async () => {
    const { httpStatus, body } = await request('/api/analyze', { code: arithmetic, optimize: false });
    assert.equal(httpStatus, 200);
    assert.equal(body.status, 'analyzed');
    assert.equal(body.executionEngine, null);
    assert.equal(body.executed, false);
    assert.equal(body.analysis.intermediate, 'completed');
    assert.equal(body.analysis.optimization, 'skipped');
    assert.equal(body.intermediateCode.version, 2);
    assert.equal(body.optimizedIntermediateCode, null);
    assert.deepEqual(body.results, []);
  });

  for (const optimize of [false, true]) {
    it(`no entra al intérprete AST con optimize ${optimize}`, async context => {
      let declarations = 0;
      const original = SymbolTable.prototype.declare;
      context.mock.method(SymbolTable.prototype, 'declare', function (...args) {
        declarations += 1;
        // Una declaración en semántica y una al generar. El motor AST haría una tercera.
        if (declarations > 2) throw new Error('El intérprete AST no debe ejecutarse');
        return original.apply(this, args);
      });
      const { httpStatus, body } = await request('/api/execute', { code: arithmetic, optimize });
      assert.equal(httpStatus, 200);
      assert.equal(body.status, 'completed');
      assert.deepEqual(body.results, ['14']);
      assert.equal(declarations, 2);
    });
  }

  it('una marca inyectada solo en IR optimizado modifica su ejecución, no el AST ni el IR original', async context => {
    const original = globalThis.structuredClone;
    context.mock.method(globalThis, 'structuredClone', function (...args) {
      const clone = original.apply(this, args);
      if (clone?.version === 2 && clone.format === 'quadruples') {
        clone.quadruples.find(quad => quad.op === 'WRITE_ARG').arg1 = { kind: 'constant', type: 'ENTERO', value: 77 };
      }
      return clone;
    });
    const { httpStatus, body } = await request('/api/execute', { code: arithmetic });
    assert.equal(httpStatus, 200);
    assert.deepEqual(body.results, ['77'], 'La ejecución debe consumir el IR optimizado, no reproducir el resultado del AST.');
    assert.deepEqual((await executeIntermediate(body.intermediateCode)).results, ['14']);
    assert.equal(body.ast.body.at(-1).values[0].name, 'a');
  });

  it('mantiene IR determinista y salidas sin duplicar durante dos lecturas por HTTP', async () => {
    const code = source('Definir a, b Como ENTERO\nEscribir "inicio"\nLeer a\nEscribir a\nLeer b\nEscribir a + b');
    const first = await request('/api/execute', { code });
    const second = await request('/api/execute', { code, inputs: ['3'] });
    const final = await request('/api/execute', { code, inputs: ['3', '4'] });
    assert.equal(first.body.status, 'waiting_input');
    assert.equal(first.body.input.index, 0);
    assert.deepEqual(first.body.results, ['inicio']);
    assert.equal(second.body.status, 'waiting_input');
    assert.equal(second.body.input.index, 1);
    assert.deepEqual(second.body.results, ['inicio', '3']);
    assert.equal(final.body.status, 'completed');
    assert.deepEqual(final.body.results, ['inicio', '3', '7']);
    for (const result of [first, second, final]) {
      assert.equal(result.httpStatus, 200);
      assert.equal(result.body.executionEngine, 'quadruples');
      assert.deepEqual(result.body.intermediateCode, first.body.intermediateCode);
      assert.deepEqual(result.body.optimizedIntermediateCode, first.body.optimizedIntermediateCode);
    }
  });

  it('devuelve HTTP 422 con salida parcial y ubicación del error runtime', async () => {
    const { httpStatus, body } = await request('/api/execute', {
      code: source('Definir n Como ENTERO\nLeer n\nEscribir "prev"\nEscribir 100 / n'), inputs: ['0']
    });
    assert.equal(httpStatus, 422);
    assert.equal(body.status, 'runtime_error');
    assert.equal(body.executed, true);
    assert.equal(body.executionEngine, 'quadruples');
    assert.deepEqual(body.results, ['prev']);
    assert.equal(body.diagnostics[0].code, 'ZERO_DIVISOR');
    assert.equal(body.diagnostics[0].line, 5);
    assert.equal(body.diagnostics[0].column, 16);
    assert.equal(body.analysis.optimization, 'completed');
    assert.equal(body.intermediateCode.version, 2);
    assert.equal(body.optimizedIntermediateCode.version, 2);
  });

  for (const [stage, body] of [['lexical', 'Escribir @'], ['syntactic', 'Escribir'], ['semantic', 'Escribir ausente']]) {
    it(`omite optimización y ejecución ante un error ${stage}`, async () => {
      for (const endpoint of ['/api/analyze', '/api/execute']) {
        const result = await request(endpoint, { code: source(body) });
        assert.equal(result.httpStatus, 422);
        assert.equal(result.body.status, `${stage}_error`);
        assert.equal(result.body.analysis.optimization, 'skipped');
        assert.equal(result.body.intermediateCode, null);
        assert.equal(result.body.optimizedIntermediateCode, null);
        assert.equal(result.body.executionEngine, null);
        assert.equal(result.body.executed, false);
        assert.deepEqual(result.body.results, []);
      }
    });
  }

  for (const optimize of [null, 'false', 0, 1, [], {}]) {
    it(`rechaza optimize inválido ${JSON.stringify(optimize)}`, async () => {
      for (const endpoint of ['/api/analyze', '/api/execute']) {
        const { httpStatus, body } = await request(endpoint, { code: arithmetic, optimize });
        assert.equal(httpStatus, 400);
        assert.equal(body.diagnostics[0].code, 'INVALID_OPTIMIZE');
        assert.equal(body.executed, false);
        assert.equal(body.intermediateCode, null);
        assert.equal(body.optimizedIntermediateCode, null);
        assert.equal(body.optimization, null);
        assert.equal(body.executionEngine, null);
      }
    });
  }

  it('mantiene los límites HTTP de cantidad y longitud de entradas', async () => {
    for (const inputs of [Array(101).fill('1'), ['x'.repeat(65537)]]) {
      const { httpStatus, body } = await request('/api/execute', { code: arithmetic, inputs });
      assert.equal(httpStatus, 400);
      assert.equal(body.diagnostics[0].code, 'INVALID_INPUTS');
      assert.equal(body.executionEngine, null);
      assert.deepEqual(body.results, []);
    }
  });

  it('oculta un fallo interno del optimizador y no ejecuta una alternativa', async context => {
    const original = globalThis.structuredClone;
    let failures = 0;
    context.mock.method(globalThis, 'structuredClone', function (...args) {
      if (args[0]?.version === 2 && args[0].format === 'quadruples') {
        failures += 1;
        throw new Error('DETALLE_PRIVADO_DEL_OPTIMIZADOR');
      }
      return original.apply(this, args);
    });
    for (const endpoint of ['/api/analyze', '/api/execute']) {
      const { httpStatus, body } = await request(endpoint, { code: arithmetic });
      assert.equal(httpStatus, 500);
      assert.equal(body.status, 'error');
      assert.equal(body.diagnostics[0].code, 'INTERNAL_ERROR');
      assert.equal(body.executed, false);
      assert.equal(body.intermediateCode, null);
      assert.equal(body.optimizedIntermediateCode, null);
      assert.equal(body.executionEngine, null);
      assert.deepEqual(body.results, []);
      assert.ok(!JSON.stringify(body).includes('DETALLE_PRIVADO'));
    }
    assert.equal(failures, 2);
    const disabled = await request('/api/execute', { code: arithmetic, optimize: false });
    assert.equal(disabled.httpStatus, 200);
    assert.deepEqual(disabled.body.results, ['14']);
    assert.equal(failures, 2, 'Desactivar optimización no debe llamar al optimizador.');
  });

  it('bloquea IR corrupto producido por un fallo interno de optimización', async context => {
    const original = globalThis.structuredClone;
    context.mock.method(globalThis, 'structuredClone', function (...args) {
      const clone = original.apply(this, args);
      if (clone?.version === 2 && clone.format === 'quadruples') clone.quadruples[0].op = 'BROKEN';
      return clone;
    });
    const { httpStatus, body } = await request('/api/execute', { code: arithmetic });
    assert.equal(httpStatus, 500);
    assert.equal(body.diagnostics[0].code, 'INTERNAL_ERROR');
    assert.equal(body.executed, false);
    assert.equal(body.optimizedIntermediateCode, null);
    assert.deepEqual(body.results, []);
  });

  it('aísla ocho solicitudes simultáneas con entradas y opciones distintas', async () => {
    const code = source('Definir n Como ENTERO\nLeer n\nEscribir n + (2 * 3)');
    const results = await Promise.all(Array.from({ length: 8 }, (_, i) => request('/api/execute', {
      code, inputs: [String(i)], optimize: i % 2 === 0
    })));
    results.forEach(({ httpStatus, body }, i) => {
      assert.equal(httpStatus, 200);
      assert.equal(body.status, 'completed');
      assert.deepEqual(body.results, [String(i + 6)]);
      assert.equal(body.optimization.enabled, i % 2 === 0);
      assert.equal(body.executionEngine, 'quadruples');
    });
  });

  it('permite cancelar la petición activa y mantiene disponible el servidor', async () => {
    const controller = new AbortController();
    const received = new Promise(resolve => server.once('request', resolve));
    const pending = fetch(`${baseUrl}/api/execute`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: source('Mientras VERDADERO Hacer\nFinMientras') }), signal: controller.signal
    });
    const rejected = assert.rejects(pending, { name: 'AbortError' });
    await received;
    await yieldTurn();
    controller.abort();
    await rejected;
    const health = await fetch(`${baseUrl}/api/health`);
    assert.equal(health.status, 200);
    assert.equal((await health.json()).capabilities.intermediateExecution, true);
  });
});
