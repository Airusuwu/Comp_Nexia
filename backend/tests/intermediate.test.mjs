import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { tokenize } from '../src/lexer/tokenize.js';
import { parse } from '../src/parser/parse.js';
import { analyzeSemantics } from '../src/semantic/analyze.js';
import { generateIntermediate } from '../src/intermediate/generate.js';
import { createApp } from '../src/api/app.js';
import { SymbolTable } from '../src/symbols/table.js';

function validatedAst(body) {
  const lexical = tokenize(`Inicio\n${body}\nFin`);
  assert.deepEqual(lexical.diagnostics, []);
  const syntax = parse(lexical.tokens);
  assert.deepEqual(syntax.diagnostics, []);
  assert.deepEqual(analyzeSemantics(syntax.ast).diagnostics, []);
  return syntax.ast;
}

const generate = (body) => generateIntermediate(validatedAst(body));
const value = (operand) => operand === null ? null : operand.kind === 'literal' ? operand.raw : operand.id;
const rows = (code) => code.quadruples.map((quad) => [quad.op, value(quad.arg1), value(quad.arg2), value(quad.result)]);

// Comprueba referencias y destinos usando el contrato público, no el recorrido del generador.
function assertReferences(code) {
  const ids = (entries) => new Set(entries.map(({ id }) => id));
  const variables = ids(code.variables);
  const temporaries = ids(code.temporaries);
  const scopes = ids(code.scopes);
  const labelRows = code.quadruples.filter(({ op }) => op === 'LABEL');
  const labels = new Set(labelRows.map(({ result }) => result.id));
  assert.equal(variables.size, code.variables.length);
  assert.equal(temporaries.size, code.temporaries.length);
  assert.equal(scopes.size, code.scopes.length);
  assert.equal(labels.size, labelRows.length);
  for (const scope of code.scopes) {
    if (scope.parent !== null) assert.ok(scopes.has(scope.parent));
  }
  for (const entry of [...code.variables, ...code.temporaries]) assert.ok(scopes.has(entry.scope));
  for (const quad of code.quadruples) {
    assert.deepEqual(Object.keys(quad).sort(), ['arg1', 'arg2', 'location', 'op', 'result']);
    assert.ok(quad.location.line >= 1);
    assert.ok(quad.location.column >= 1);
    for (const operand of [quad.arg1, quad.arg2, quad.result]) {
      if (operand === null) continue;
      if (operand.kind === 'literal') {
        assert.equal(typeof operand.raw, 'string');
        assert.ok(['ENTERO', 'REAL', 'TEXTO', 'CARACTER', 'BOOLEANO'].includes(operand.type));
      } else {
        const registry = { variable: variables, temporary: temporaries, label: labels }[operand.kind];
        assert.ok(registry?.has(operand.id), `Referencia sin definición: ${JSON.stringify(operand)}`);
      }
    }
  }
}

describe('generación independiente de cuádruplos', () => {
  it('genera un programa vacío completo', () => {
    const code = generate('');
    assert.equal(code.version, 1);
    assert.equal(code.format, 'quadruples');
    assert.deepEqual(code.quadruples, []);
    assert.deepEqual(code.variables, []);
    assert.deepEqual(code.temporaries, []);
    assert.equal(code.scopes.length, 1);
    assert.equal(code.scopes[0].parent, null);
  });

  it('respeta precedencia, tipos, temporales y ubicaciones de origen', () => {
    const code = generate('Definir a Como ENTERO\na <- 2 + 3 * 4');
    assert.deepEqual(rows(code), [
      ['DECLARE', null, null, 'v1'], ['*', '3', '4', 't1'],
      ['+', '2', 't1', 't2'], ['ASSIGN', 't2', null, 'v1']
    ]);
    assert.deepEqual(code.temporaries.map(({ id, type }) => ({ id, type })), [
      { id: 't1', type: 'ENTERO' }, { id: 't2', type: 'ENTERO' }
    ]);
    assert.equal(code.quadruples[1].location.line, 3);
    assert.equal(code.quadruples[1].location.column, 10);
    assert.equal(code.quadruples[2].location.column, 6);
    assertReferences(code);
  });

  it('preserva paréntesis, operadores unarios y asociatividad', () => {
    const code = generate('Escribir -(2 + 3) * +4, 8 - 3 - 1, NO (VERDADERO Y FALSO)');
    assert.deepEqual(rows(code).map(([op]) => op), [
      'WRITE_BEGIN', '+', 'NEG', 'POS', '*', 'WRITE_ARG', '-', '-', 'WRITE_ARG',
      'Y', 'NO', 'WRITE_ARG', 'WRITE_END'
    ]);
    const subtraction = code.quadruples.filter(({ op }) => op === '-');
    assert.deepEqual(subtraction.map(({ arg1, arg2 }) => [value(arg1), value(arg2)]), [['8', '3'], ['t5', '1']]);
    assertReferences(code);
  });

  it('aplica las reglas compartidas de todos los operadores binarios y cinco tipos', () => {
    const cases = [
      ['2 + 3', '+', 'ENTERO'], ['2 - 3', '-', 'ENTERO'], ['2 * 3', '*', 'ENTERO'],
      ['2 / 3', '/', 'REAL'], ['2 % 3', '%', 'ENTERO'], ['2 < 3', '<', 'BOOLEANO'],
      ['2 > 3', '>', 'BOOLEANO'], ['2 <= 3', '<=', 'BOOLEANO'], ['2 >= 3', '>=', 'BOOLEANO'],
      ['2 == 3', '==', 'BOOLEANO'], ['2 != 3', '!=', 'BOOLEANO'],
      ['VERDADERO Y FALSO', 'Y', 'BOOLEANO'], ['VERDADERO O FALSO', 'O', 'BOOLEANO'],
      ['"a" + "b"', '+', 'TEXTO'], ['1.5 + 2', '+', 'REAL'], ["'a' == 'b'", '==', 'BOOLEANO']
    ];
    for (const [source, op, type] of cases) {
      const code = generate(`Escribir ${source}`);
      assert.equal(code.quadruples[1].op, op, source);
      assert.equal(code.temporaries[0].type, type, source);
      assertReferences(code);
    }
    const promoted = generate('Definir r Como REAL\nr <- 1 + 2');
    assert.equal(promoted.variables[0].type, 'REAL');
    assert.equal(promoted.temporaries[0].type, 'ENTERO');
  });

  it('evalúa ambos operandos de Y/O en orden sin introducir cortocircuito', () => {
    const code = generate('Escribir VERDADERO O (2 / 1 > 0)');
    assert.deepEqual(rows(code).map(([op]) => op), ['WRITE_BEGIN', '/', '>', 'O', 'WRITE_ARG', 'WRITE_END']);
    assert.deepEqual(rows(code)[3], ['O', 'VERDADERO', 't2', 't3']);
  });

  it('conserva los literales sin redondearlos ni normalizar su escritura', () => {
    const code = generate('Escribir 9007199254740993, 0.00000000000000000000000000000001, "á", \'ñ\', verdadero');
    const operands = code.quadruples.filter(({ op }) => op === 'WRITE_ARG').map(({ arg1 }) => arg1);
    assert.deepEqual(operands.map(({ raw }) => raw), ['9007199254740993', '0.00000000000000000000000000000001', '"á"', "'ñ'", 'verdadero']);
    assert.deepEqual(operands.map(({ type }) => type), ['ENTERO', 'REAL', 'TEXTO', 'CARACTER', 'BOOLEANO']);
    assert.equal(operands[4].canonical, 'VERDADERO');
  });

  it('distingue homónimos y nombres parecidos a temporales sin perder igualdad entre mayúsculas', () => {
    const code = generate(`Definir t1, L1 Como ENTERO
t1 <- 1
L1 <- 2
Si VERDADERO Entonces
    Definir T1 Como ENTERO
    t1 <- 3
    Escribir T1
FinSi
Escribir T1 + l1`);
    assert.deepEqual(code.variables.map(({ id, name, scope }) => [id, name, scope]), [
      ['v1', 't1', 's1'], ['v2', 'L1', 's1'], ['v3', 'T1', 's2']
    ]);
    const writes = code.quadruples.filter(({ op }) => op === 'WRITE_ARG');
    assert.deepEqual(writes[0].arg1, { kind: 'variable', id: 'v3' });
    assert.deepEqual(rows(code).find(([op]) => op === '+'), ['+', 'v1', 'v2', 't1']);
    assertReferences(code);
  });

  it('genera destinos definidos y ramas separadas para Si/Sino', () => {
    const code = generate('Si FALSO Entonces\nEscribir 1\nSino\nEscribir 2\nFinSi');
    assert.deepEqual(rows(code), [
      ['JUMP_IF_FALSE', 'FALSO', null, 'L2'],
      ['WRITE_BEGIN', null, null, null], ['WRITE_ARG', '1', null, null], ['WRITE_END', null, null, null],
      ['JUMP', null, null, 'L1'], ['LABEL', null, null, 'L2'],
      ['WRITE_BEGIN', null, null, null], ['WRITE_ARG', '2', null, null], ['WRITE_END', null, null, null],
      ['LABEL', null, null, 'L1']
    ]);
    assertReferences(code);
  });

  it('sitúa la condición de Mientras antes del cuerpo y reevalúa al volver', () => {
    const code = generate('Definir n Como ENTERO\nn <- 0\nMientras n < 2 Hacer\nn <- n + 1\nFinMientras');
    assert.deepEqual(rows(code), [
      ['DECLARE', null, null, 'v1'], ['ASSIGN', '0', null, 'v1'], ['LABEL', null, null, 'L1'],
      ['<', 'v1', '2', 't1'], ['JUMP_IF_FALSE', 't1', null, 'L2'],
      ['+', 'v1', '1', 't2'], ['ASSIGN', 't2', null, 'v1'],
      ['JUMP', null, null, 'L1'], ['LABEL', null, null, 'L2']
    ]);
    assertReferences(code);
  });

  it('sitúa el cuerpo de Repetir antes de la condición y vuelve solo cuando es falsa', () => {
    const code = generate('Definir n Como ENTERO\nRepetir\nn <- 1\nHasta Que n > 0\nEscribir n');
    assert.deepEqual(rows(code).slice(0, 5), [
      ['DECLARE', null, null, 'v1'], ['LABEL', null, null, 'L1'], ['ASSIGN', '1', null, 'v1'],
      ['>', 'v1', '0', 't1'], ['JUMP_IF_FALSE', 't1', null, 'L1']
    ]);
    assertReferences(code);
  });

  it('captura los límites de Para una vez antes del contador local y separa su avance', () => {
    const code = generate(`Definir i Como ENTERO
i <- 2
Para i <- i Hasta Hacer i + 1
    Escribir i
    i <- 100
FinPara
Escribir i`);
    assert.deepEqual(rows(code), [
      ['DECLARE', null, null, 'v1'], ['ASSIGN', '2', null, 'v1'],
      ['ASSIGN', 'v1', null, 't1'], ['+', 'v1', '1', 't2'], ['ASSIGN', 't2', null, 't3'],
      ['DECLARE', null, null, 'v2'], ['LABEL', null, null, 'L1'],
      ['<=', 't1', 't3', 't4'], ['JUMP_IF_FALSE', 't4', null, 'L2'], ['ASSIGN', 't1', null, 'v2'],
      ['WRITE_BEGIN', null, null, null], ['WRITE_ARG', 'v2', null, null], ['WRITE_END', null, null, null],
      ['ASSIGN', '100', null, 'v2'], ['>=', 't1', 't3', 't5'], ['JUMP_IF_TRUE', 't5', null, 'L2'],
      ['+', 't1', '1', 't6'], ['ASSIGN', 't6', null, 't1'], ['JUMP', null, null, 'L1'], ['LABEL', null, null, 'L2'],
      ['WRITE_BEGIN', null, null, null], ['WRITE_ARG', 'v1', null, null], ['WRITE_END', null, null, null]
    ]);
    assert.equal(code.variables[1].scope, 's2');
    assert.equal(code.scopes[2].parent, 's2');
    assertReferences(code);
  });

  it('permite cero vueltas y protege el límite ENTERO máximo antes del incremento', () => {
    for (const [initial, limit] of [['4', '2'], ['9007199254740991', '9007199254740991']]) {
      const code = generate(`Para i <- ${initial} Hasta Hacer ${limit}\nFinPara`);
      const ops = rows(code).map(([op]) => op);
      assert.ok(ops.indexOf('<=') < ops.indexOf('JUMP_IF_FALSE'));
      assert.ok(ops.indexOf('JUMP_IF_FALSE') < ops.indexOf('+'));
      assert.ok(ops.indexOf('>=') < ops.indexOf('JUMP_IF_TRUE'));
      assert.ok(ops.indexOf('JUMP_IF_TRUE') < ops.indexOf('+'));
      assertReferences(code);
    }
  });

  it('genera ciclos y condiciones anidados con declaraciones dentro del recorrido del cuerpo', () => {
    const code = generate(`Definir listo Como BOOLEANO
listo <- FALSO
Repetir
    Para i <- 1 Hasta Hacer 2
        Si i == 1 Entonces
            Definir local Como ENTERO
            local <- i
            Escribir local
        Sino
            Escribir i
        FinSi
    FinPara
    listo <- VERDADERO
Hasta Que listo`);
    assertReferences(code);
    const local = code.variables.find(({ name }) => name === 'local');
    const declaration = code.quadruples.findIndex(({ op, result }) => op === 'DECLARE' && result.id === local.id);
    assert.ok(declaration > code.quadruples.findIndex(({ op }) => op === 'JUMP_IF_FALSE'));
    assert.equal(code.quadruples.at(-1).op, 'JUMP_IF_FALSE');
    assert.equal(code.quadruples.at(-1).result.id, 'L1');
  });

  it('representa Leer y agrupa argumentos y líneas de Escribir sin ejecutarlos', () => {
    const code = generate('Definir n Como ENTERO\nLeer n\nEscribir "n=", n, 1 + 2\nEscribir n');
    assert.deepEqual(rows(code), [
      ['DECLARE', null, null, 'v1'], ['READ', null, null, 'v1'],
      ['WRITE_BEGIN', null, null, null], ['WRITE_ARG', '"n="', null, null], ['WRITE_ARG', 'v1', null, null],
      ['+', '1', '2', 't1'], ['WRITE_ARG', 't1', null, null], ['WRITE_END', null, null, null],
      ['WRITE_BEGIN', null, null, null], ['WRITE_ARG', 'v1', null, null], ['WRITE_END', null, null, null]
    ]);
    assertReferences(code);
  });

  it('es determinista y no modifica ni comparte ubicaciones mutables con el AST', () => {
    const ast = validatedAst('Para i <- 1 Hasta Hacer 2\nEscribir i + 1\nFinPara');
    const original = structuredClone(ast);
    const code = generateIntermediate(ast);
    assert.deepEqual(code, generateIntermediate(ast));
    assert.deepEqual(ast, original);
    code.quadruples[0].location.line = 999;
    code.scopes[0].location.line = 999;
    assert.deepEqual(ast, original);
  });

  it('rechaza AST o nodos no soportados en lugar de devolver generación parcial', () => {
    assert.throws(() => generateIntermediate(null), TypeError);
    assert.throws(() => generateIntermediate({ kind: 'Program' }), TypeError);
    const ast = validatedAst('Escribir 1');
    ast.body.push({ kind: 'UnknownStatement', location: ast.location });
    assert.throws(() => generateIntermediate(ast), /Instrucción no soportada/);
    ast.body.pop();
    ast.body[0].values[0].kind = 'UnknownExpression';
    assert.throws(() => generateIntermediate(ast), /Expresión no soportada/);
  });
});

describe('código intermedio por la API', () => {
  let server;
  let baseUrl;

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
      server.close((error) => error ? reject(error) : resolve());
    });
  });

  async function request(path, code, inputs = []) {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code, inputs })
    });
    return { httpStatus: response.status, body: await response.json() };
  }

  it('anuncia la cuarta fase y mantiene las capacidades existentes', async () => {
    const body = await (await fetch(`${baseUrl}/api/health`)).json();
    assert.deepEqual(body.capabilities, {
      analysis: true, lexical: true, syntactic: true, semantic: true, intermediate: true,
      intermediateExecution: true, optimization: true, execution: true
    });
  });

  it('devuelve cuádruplos iguales al analizar y ejecutar, con ejecución real intacta', async () => {
    const source = 'Inicio\nDefinir a Como ENTERO\na <- 2 + 3 * 4\nEscribir a\nFin';
    const analyzed = await request('/api/analyze', source);
    const executed = await request('/api/execute', source);
    assert.equal(analyzed.httpStatus, 200);
    assert.equal(analyzed.body.status, 'analyzed');
    assert.equal(analyzed.body.executed, false);
    assert.deepEqual(analyzed.body.results, []);
    assert.deepEqual(analyzed.body.analysis, {
      lexical: 'completed', syntactic: 'completed', semantic: 'completed', intermediate: 'completed', optimization: 'completed'
    });
    assertReferences(analyzed.body.intermediateCode);
    assert.equal(executed.httpStatus, 200);
    assert.equal(executed.body.status, 'completed');
    assert.equal(executed.body.executed, true);
    assert.deepEqual(executed.body.results, ['14']);
    assert.deepEqual(analyzed.body.intermediateCode, executed.body.intermediateCode);
  });

  it('mantiene generación completa durante la espera y el replay de Leer', async () => {
    const source = 'Inicio\nDefinir n Como ENTERO\nLeer n\nEscribir "n=", n\nFin';
    const waiting = await request('/api/execute', source);
    const completed = await request('/api/execute', source, ['7']);
    assert.equal(waiting.httpStatus, 200);
    assert.equal(waiting.body.status, 'waiting_input');
    assert.equal(waiting.body.input.name, 'n');
    assert.equal(waiting.body.analysis.intermediate, 'completed');
    assert.equal(completed.body.status, 'completed');
    assert.deepEqual(completed.body.results, ['n=7']);
    assert.deepEqual(completed.body.intermediateCode, waiting.body.intermediateCode);
  });

  it('no anticipa los límites numéricos del motor durante la generación', async () => {
    const source = 'Inicio\nEscribir 9007199254740993\nFin';
    const analyzed = await request('/api/analyze', source);
    const executed = await request('/api/execute', source);
    assert.equal(analyzed.httpStatus, 200);
    assert.equal(analyzed.body.intermediateCode.quadruples.find(quad => quad.op === 'EVAL').arg1.raw, '9007199254740993');
    assert.equal(executed.httpStatus, 422);
    assert.equal(executed.body.status, 'runtime_error');
    assert.equal(executed.body.diagnostics[0].code, 'NUMERIC_LIMIT');
    assert.equal(executed.body.analysis.intermediate, 'completed');
    assert.deepEqual(executed.body.intermediateCode, analyzed.body.intermediateCode);
  });

  for (const [stage, source] of [
    ['lexical', 'Inicio\nEscribir @\nFin'],
    ['syntactic', 'Inicio\nEscribir\nFin'],
    ['semantic', 'Inicio\nEscribir desconocida\nFin']
  ]) {
    it(`omite la generación ante error ${stage} en ambos endpoints`, async () => {
      for (const endpoint of ['/api/analyze', '/api/execute']) {
        const { httpStatus, body } = await request(endpoint, source);
        assert.equal(httpStatus, 422);
        assert.equal(body.status, `${stage}_error`);
        assert.equal(body.analysis.intermediate, 'skipped');
        assert.equal(body.intermediateCode, null);
        assert.equal(body.executed, false);
        assert.deepEqual(body.results, []);
      }
    });
  }

  it('mantiene el contrato de errores de solicitud sin generación ni ejecución', async () => {
    const { httpStatus, body } = await request('/api/execute', '');
    assert.equal(httpStatus, 400);
    assert.equal(body.status, 'invalid_request');
    assert.equal(body.intermediateCode, null);
    assert.equal(body.executed, false);
    assert.deepEqual(body.results, []);
  });

  it('bloquea la ejecución y oculta los cuádruplos parciales ante un fallo interno', async (context) => {
    const originalDeclare = SymbolTable.prototype.declare;
    let declarations = 0;
    context.mock.method(SymbolTable.prototype, 'declare', function (...args) {
      declarations += 1;
      // Dos declaraciones semánticas; falla la segunda del generador tras emitir la primera.
      if (declarations === 4) throw new Error('Fallo simulado dentro del generador');
      return originalDeclare.apply(this, args);
    });
    const source = 'Inicio\nDefinir a, b Como ENTERO\na <- 1\nb <- 2\nEscribir a + b\nFin';
    const { httpStatus, body } = await request('/api/execute', source);
    assert.equal(httpStatus, 500);
    assert.equal(body.status, 'error');
    assert.equal(body.diagnostics[0].code, 'INTERNAL_ERROR');
    assert.ok(!JSON.stringify(body).includes('Fallo simulado'));
    assert.equal(body.executed, false);
    assert.equal(body.intermediateCode, null);
    assert.deepEqual(body.results, []);
    assert.equal(declarations, 4); // El motor no llegó a declarar sus variables.
  });
});
