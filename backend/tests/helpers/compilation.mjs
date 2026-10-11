import assert from 'node:assert/strict';
import { tokenize } from '../../src/lexer/tokenize.js';
import { parse } from '../../src/parser/parse.js';
import { analyzeSemantics } from '../../src/semantic/analyze.js';
import { generateIntermediate } from '../../src/intermediate/generate.js';
import { optimizeIntermediate } from '../../src/intermediate/optimize.js';
import { execute } from '../../src/runtime/execute.js';
import { executeIntermediate } from '../../src/runtime/execute-intermediate.js';

export function compile(body) {
  const lexical = tokenize(`Inicio\n${body}\nFin`);
  assert.deepEqual(lexical.diagnostics, [], 'El caso debe superar el lexer.');
  const syntax = parse(lexical.tokens);
  assert.deepEqual(syntax.diagnostics, [], 'El caso debe superar el parser.');
  assert.deepEqual(analyzeSemantics(syntax.ast).diagnostics, [], 'El caso debe superar semántica.');
  const code = generateIntermediate(syntax.ast, { executable: true });
  const optimized = optimizeIntermediate(code);
  return { ast: syntax.ast, code, optimized: optimized.code, stats: optimized.stats };
}

export const engines = (program) => [
  ['AST de referencia', (inputs, options) => execute(program.ast, inputs, options)],
  ['cuádruplos originales', (inputs, options) => executeIntermediate(program.code, inputs, options)],
  ['cuádruplos optimizados', (inputs, options) => executeIntermediate(program.optimized, inputs, options)]
];

export function observable(result) {
  const { instructions, ...rest } = result;
  return rest;
}

// El AST es un oráculo de regresión adicional; cada caso también exige resultados esperados.
export async function equivalent(program, inputs = [], expected = {}) {
  const runs = [];
  for (const [name, run] of engines(program)) {
    const result = await run(inputs);
    for (const [key, value] of Object.entries(expected)) assert.deepEqual(result[key], value, `${name}: ${key}`);
    if (runs.length) assert.deepEqual(observable(result), observable(runs[0]), name);
    runs.push(result);
  }
  return runs;
}
