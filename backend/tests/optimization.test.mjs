import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { compile, equivalent } from './helpers/compilation.mjs';
import { generateIntermediate } from '../src/intermediate/generate.js';
import { optimizeIntermediate } from '../src/intermediate/optimize.js';
import { validateExecutable } from '../src/intermediate/format.js';
import { executeIntermediate } from '../src/runtime/execute-intermediate.js';

describe('transformaciones del optimizador', () => {
  it('pliega 2 + 3 * 4, reduce instrucciones reales y conserva los pasos de origen', async () => {
    const program = compile('Escribir 2 + 3 * 4');
    const before = structuredClone(program.code);
    const result = optimizeIntermediate(program.code);
    assert.deepEqual(program.code, before);
    assert.equal(result.stats.foldedExpressions, 2);
    assert.ok(result.stats.propagatedOperands > 0);
    assert.ok(result.stats.removedInstructions > 0);
    assert.equal(result.stats.inputInstructions, program.code.quadruples.length);
    assert.equal(result.stats.outputInstructions, result.code.quadruples.length);
    assert.equal(result.stats.removedInstructions, result.stats.inputInstructions - result.stats.outputInstructions);
    assert.ok(!result.code.quadruples.some(quad => ['+', '*'].includes(quad.op)));
    assert.deepEqual(result.code.quadruples.find(quad => quad.op === 'WRITE_ARG').arg1, {
      kind: 'constant', type: 'ENTERO', value: 14
    });
    assert.deepEqual(result.code.temporaries, []);
    const runs = await equivalent(program, [], { status: 'completed', results: ['14'] });
    assert.ok(runs[2].instructions < runs[1].instructions);
    assert.equal(runs[2].steps, runs[1].steps);
  });

  it('es determinista e idempotente sobre el código ya optimizado', () => {
    const program = compile('Para i <- 1 Hasta Hacer 2\nEscribir i, 2 + 3 * 4\nFinPara');
    assert.deepEqual(optimizeIntermediate(program.code), optimizeIntermediate(program.code));
    assert.deepEqual(optimizeIntermediate(program.optimized).code, program.optimized);
  });

  it('conserva TICK, etiquetas, saltos, variables y ubicaciones de diagnóstico', () => {
    const { code, optimized } = compile('Definir b Como BOOLEANO\nLeer b\nSi b Entonces\nEscribir ((2 + 3) * 4)\nSino\nEscribir 1 + 2\nFinSi');
    for (const predicate of [quad => quad.op === 'TICK', quad => quad.op === 'LABEL' || quad.op.startsWith('JUMP')]) {
      assert.deepEqual(optimized.quadruples.filter(predicate), code.quadruples.filter(predicate));
    }
    assert.deepEqual(optimized.variables, code.variables);
    assert.equal(optimized.executionMap.length, optimized.quadruples.length);
    let start = 0;
    for (const entry of optimized.executionMap) {
      const index = code.executionMap.findIndex((candidate, i) => i >= start && JSON.stringify(candidate) === JSON.stringify(entry));
      assert.ok(index >= start, 'El mapa de diagnósticos debe ser una subsecuencia del original.');
      start = index + 1;
    }
    validateExecutable(optimized);
  });

  it('no comparte metadatos mutables con el IR ni con el AST originales', () => {
    const program = compile('Definir n Como ENTERO\nn <- 1\nEscribir n');
    const original = structuredClone({ ast: program.ast, code: program.code });
    program.optimized.variables[0].name = 'cambiado';
    program.optimized.scopes[0].location.line = 999;
    program.optimized.executionMap[0].location.column = 999;
    assert.deepEqual({ ast: program.ast, code: program.code }, original);
  });

  it('no propaga variables de Leer ni aplica la identidad x * 0', async () => {
    const program = compile('Definir n Como ENTERO\nLeer n\nEscribir n * 0 + 2');
    assert.ok(program.optimized.quadruples.some(quad => quad.op === 'READ'));
    assert.ok(program.optimized.quadruples.some(quad => quad.op === 'EVAL' && quad.arg1.kind === 'variable'));
    assert.ok(program.optimized.quadruples.some(quad => quad.op === '*'));
    assert.equal(program.stats.foldedExpressions, 0);
    await equivalent(program, ['7'], { status: 'completed', results: ['2'] });
  });

  it('conserva temporales usados después de una etiqueta en Para', async () => {
    const program = compile('Para i <- 1 Hasta Hacer 2\nEscribir i\nFinPara');
    const guard = program.optimized.quadruples.find(quad => quad.op === '<=');
    assert.equal(guard.arg1.kind, 'temporary');
    assert.equal(guard.arg2.kind, 'temporary');
    for (const operand of [guard.arg1, guard.arg2]) {
      assert.ok(program.optimized.quadruples.some(quad => quad.op === 'ASSIGN' && quad.result.id === operand.id));
    }
    await equivalent(program, [], { status: 'completed', results: ['1', '2'] });
  });

  it('conserva tipos REAL y BOOLEANO en las constantes calculadas', async () => {
    const program = compile('Escribir 8 / 3, ":", NO FALSO');
    const arguments_ = program.optimized.quadruples.filter(quad => quad.op === 'WRITE_ARG').map(quad => quad.arg1);
    assert.equal(arguments_[0].type, 'REAL');
    assert.equal(arguments_[0].value, 8 / 3);
    assert.equal(arguments_[2].type, 'BOOLEANO');
    assert.equal(arguments_[2].value, true);
    await equivalent(program, [], { status: 'completed', results: ['2.6666666666666665:VERDADERO'] });
  });

  it('conserva el marcador de cero negativo al serializar y ejecutar el IR', async () => {
    const program = compile('Escribir -0.0');
    const argument = program.optimized.quadruples.find(quad => quad.op === 'WRITE_ARG').arg1;
    assert.ok(Object.is(argument.value, -0));
    assert.equal(argument.negativeZero, true);
    const transported = JSON.parse(JSON.stringify(program.optimized));
    assert.equal(transported.quadruples.find(quad => quad.op === 'WRITE_ARG').arg1.negativeZero, true);
    const original = await executeIntermediate(program.optimized);
    assert.deepEqual(await executeIntermediate(transported), original);
  });

  it('mantiene operaciones constantes que pueden fallar en runtime', async () => {
    const overflow = compile('Escribir 9007199254740991 + 1');
    assert.ok(overflow.optimized.quadruples.some(quad => quad.op === '+'));
    await equivalent(overflow, [], { status: 'runtime_error' });
    // Semántica no propaga residuo con dividendo negativo: el cero se conoce al optimizar.
    const divisor = compile('Escribir 1 / ((-1) % 1)');
    assert.ok(divisor.optimized.quadruples.some(quad => quad.op === '/'));
    const runs = await equivalent(divisor, [], { status: 'runtime_error' });
    assert.equal(runs[0].diagnostics[0].code, 'ZERO_DIVISOR');
  });

  it('no transforma un error numérico de una rama inactiva en un fallo del optimizador', async () => {
    const program = compile('Si FALSO Entonces\nEscribir 9007199254740993\nFinSi\nEscribir "bien"');
    assert.ok(program.optimized.quadruples.some(quad => quad.op === 'EVAL' && quad.arg1.raw === '9007199254740993'));
    await equivalent(program, [], { status: 'completed', results: ['bien'] });
  });

  it('compara 80 programas constantes y con entradas mediante una semilla fija', async () => {
    let state = 0x4e455849;
    const next = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state % 41 - 20; };
    for (let i = 0; i < 80; i += 1) {
      const left = next(), factor = next(), tail = next(), input = next();
      const dynamic = i % 2 === 1;
      const expression = dynamic ? `((dato + ${left}) * ${factor}) - ${tail}` : `((${input} + ${left}) * ${factor}) - ${tail}`;
      const prefix = dynamic ? 'Definir dato Como ENTERO\nLeer dato\n' : '';
      await equivalent(compile(`${prefix}Escribir ${expression}`), dynamic ? [String(input)] : [], {
        status: 'completed', results: [String((input + left) * factor - tail)]
      });
    }
  });
});

describe('validación del contrato de IR ejecutable', () => {
  it('rechaza el perfil compacto versión 1 antes de ejecutar u optimizar', async () => {
    const legacy = generateIntermediate(compile('Escribir 1').ast);
    assert.throws(() => optimizeIntermediate(legacy), TypeError);
    await assert.rejects(executeIntermediate(legacy), TypeError);
  });

  const corruptions = [
    ['operación desconocida', code => { code.quadruples[0].op = 'UNKNOWN'; }],
    ['mapa de ejecución incompleto', code => { code.executionMap.pop(); }],
    ['ubicación inválida', code => { code.executionMap[0].location.line = 0; }],
    ['variable sin metadatos', code => { code.variables = []; }],
    ['metadatos duplicados', code => { code.variables.push(structuredClone(code.variables[0])); }],
    ['tipo desconocido', code => { code.temporaries[0].type = 'UNKNOWN'; }],
    ['temporal sin definición', code => { code.quadruples.find(quad => quad.op === 'WRITE_ARG').arg1.id = 't999'; }],
    ['salto a etiqueta inexistente', code => { code.quadruples.find(quad => quad.op === 'JUMP').result = { kind: 'label', id: 'L999' }; }],
    ['etiqueta duplicada', code => {
      const index = code.quadruples.findIndex(quad => quad.op === 'LABEL');
      code.quadruples.push(structuredClone(code.quadruples[index]));
      code.executionMap.push(structuredClone(code.executionMap[index]));
    }],
    ['ámbito padre inexistente', code => { code.scopes[0].parent = 's999'; }],
    ['constante no finita', code => { code.quadruples.find(quad => quad.op === 'EVAL').arg1 = { kind: 'constant', type: 'REAL', value: Infinity }; }],
    ['constante ENTERO fraccionaria', code => { code.quadruples.find(quad => quad.op === 'EVAL').arg1 = { kind: 'constant', type: 'ENTERO', value: 1.5 }; }],
    ['destino de Leer incorrecto', code => { code.quadruples.find(quad => quad.op === 'READ').result = { kind: 'temporary', id: code.temporaries[0].id }; }]
  ];
  for (const [name, corrupt] of corruptions) {
    it(`rechaza ${name}`, async () => {
      const code = compile('Definir x Como ENTERO\nLeer x\nMientras x < 0 Hacer\nx <- x + 1\nFinMientras\nEscribir x').code;
      corrupt(code);
      assert.throws(() => validateExecutable(code), TypeError);
      assert.throws(() => optimizeIntermediate(code), TypeError);
      await assert.rejects(executeIntermediate(code), TypeError);
    });
  }

  it('DECLARE reinicia el valor previo y el motor detecta una lectura sin inicializar', async () => {
    const code = compile('Definir dato Como ENTERO\ndato <- 7\nEscribir DATO').code;
    const declaration = code.quadruples.findIndex(quad => quad.op === 'DECLARE');
    const writing = code.quadruples.findIndex(quad => quad.op === 'WRITE_BEGIN');
    code.quadruples.splice(writing, 0, structuredClone(code.quadruples[declaration]));
    code.executionMap.splice(writing, 0, structuredClone(code.executionMap[declaration]));
    for (const ir of [code, optimizeIntermediate(code).code]) {
      const result = await executeIntermediate(ir);
      assert.equal(result.status, 'runtime_error');
      assert.equal(result.diagnostics[0].code, 'UNINITIALIZED_VARIABLE');
      assert.match(result.diagnostics[0].message, /"DATO"/);
      assert.equal(result.diagnostics[0].line, 4);
      assert.deepEqual(result.results, []);
    }
  });
});
