const types = new Set(['ENTERO', 'REAL', 'TEXTO', 'CARACTER', 'BOOLEANO']);
export const binaryOperations = new Set(['+', '-', '*', '/', '%', '<', '<=', '>', '>=', '==', '!=', 'Y', 'O']);
export const unaryOperations = new Map([['POS', '+'], ['NEG', '-'], ['NO', 'NO']]);
const jumps = new Set(['JUMP', 'JUMP_IF_FALSE', 'JUMP_IF_TRUE']);
const operations = new Set([
  ...binaryOperations, ...unaryOperations.keys(), ...jumps,
  'DECLARE', 'ASSIGN', 'EVAL', 'READ', 'WRITE_BEGIN', 'WRITE_ARG', 'WRITE_END', 'LABEL', 'TICK'
]);

// Solo se acepta IR completo: un contrato inválido es un fallo interno, no del pseudocódigo.
export function validateExecutable(code) {
  const fail = () => { throw new TypeError('Código intermedio ejecutable inválido.'); };
  if (code?.version !== 2 || code.format !== 'quadruples'
    || !['quadruples', 'variables', 'temporaries', 'scopes', 'executionMap'].every(key => Array.isArray(code[key]))
    || code.executionMap.length !== code.quadruples.length) fail();

  function registry(entries, typed = false) {
    const result = new Map();
    for (const entry of entries) {
      if (!entry || typeof entry.id !== 'string' || result.has(entry.id) || (typed && !types.has(entry.type))) fail();
      result.set(entry.id, entry);
    }
    return result;
  }
  const variables = registry(code.variables, true);
  const temporaries = registry(code.temporaries, true);
  const scopes = registry(code.scopes);
  for (const scope of scopes.values()) if (scope.parent !== null && !scopes.has(scope.parent)) fail();
  for (const entry of [...variables.values(), ...temporaries.values()]) if (!scopes.has(entry.scope)) fail();
  for (const entry of variables.values()) if (typeof entry.name !== 'string') fail();

  const labels = new Map();
  code.quadruples.forEach((quad, index) => {
    if (quad?.op !== 'LABEL') return;
    if (quad.result?.kind !== 'label' || typeof quad.result.id !== 'string' || labels.has(quad.result.id)) fail();
    labels.set(quad.result.id, index);
  });

  function operand(value, kinds) {
    if (!value || !kinds.includes(value.kind)) fail();
    if (value.kind === 'literal') {
      if (!types.has(value.type) || typeof value.raw !== 'string') fail();
      if (value.type === 'BOOLEANO' && !['VERDADERO', 'FALSO'].includes(value.canonical)) fail();
    } else if (value.kind === 'constant') {
      if (!types.has(value.type)) fail();
      const expected = ['ENTERO', 'REAL'].includes(value.type) ? 'number'
        : value.type === 'BOOLEANO' ? 'boolean' : 'string';
      if (typeof value.value !== expected) fail();
      if (expected === 'number' && (!Number.isFinite(value.value)
        || (value.type === 'ENTERO' && !Number.isSafeInteger(value.value)))) fail();
      if (value.negativeZero !== undefined && (value.negativeZero !== true || expected !== 'number' || value.value !== 0)) fail();
    } else if (!(value.kind === 'variable' ? variables : value.kind === 'temporary' ? temporaries : labels).has(value.id)) fail();
  }
  const values = ['literal', 'constant', 'variable', 'temporary'];
  function location(value) {
    if (!value || !['offset', 'line', 'column', 'endOffset', 'endLine', 'endColumn']
      .every(key => Number.isInteger(value[key]) && value[key] >= (key.endsWith('Offset') || key === 'offset' ? 0 : 1))) fail();
  }
  for (const [index, quad] of code.quadruples.entries()) {
    if (!operations.has(quad?.op)) fail();
    location(quad.location);
    location(code.executionMap[index]?.location);
    if (binaryOperations.has(quad.op)) {
      operand(quad.arg1, values); operand(quad.arg2, values); operand(quad.result, ['temporary']);
    } else if (unaryOperations.has(quad.op) || ['EVAL', 'ASSIGN'].includes(quad.op)) {
      operand(quad.arg1, values);
      operand(quad.result, quad.op === 'ASSIGN' ? ['variable', 'temporary'] : ['temporary']);
      if (quad.arg2 !== null) fail();
    } else if (['READ', 'DECLARE'].includes(quad.op)) {
      operand(quad.result, ['variable']);
      if (quad.arg1 !== null || quad.arg2 !== null) fail();
    } else if (quad.op === 'WRITE_ARG') {
      operand(quad.arg1, values);
      if (quad.arg2 !== null || quad.result !== null) fail();
    } else if (jumps.has(quad.op) || quad.op === 'LABEL') {
      operand(quad.result, ['label']);
      if (quad.arg2 !== null) fail();
      if (quad.op.startsWith('JUMP_IF_')) operand(quad.arg1, values);
      else if (quad.arg1 !== null) fail();
    } else if (quad.arg1 !== null || quad.arg2 !== null || quad.result !== null) fail();
  }
  return { variables, temporaries, labels };
}
