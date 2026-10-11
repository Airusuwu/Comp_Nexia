import { TypeRuleError, assignmentResultType } from '../types/compatibility.js';
import { literalValue, valueOf, unaryValue, binaryValue } from '../runtime/values.js';
import { binaryOperations, unaryOperations, validateExecutable } from './format.js';

function constant(typed) {
  return {
    kind: 'constant', type: typed.type, value: typed.value,
    ...(Object.is(typed.value, -0) ? { negativeZero: true } : {})
  };
}

// No modifica el IR original. Las constantes se conocen solo dentro de un bloque lineal.
export function optimizeIntermediate(original) {
  const { temporaries } = validateExecutable(original);
  const code = structuredClone(original);
  const known = new Map();
  const stats = {
    inputInstructions: code.quadruples.length, outputInstructions: 0,
    foldedExpressions: 0, propagatedOperands: 0, removedInstructions: 0
  };

  function resolve(operand) {
    if (operand?.kind === 'temporary' && known.has(operand.id)) {
      stats.propagatedOperands += 1;
      return constant(known.get(operand.id));
    }
    return operand;
  }

  function typed(operand) {
    if (operand?.kind === 'literal') return literalValue({ ...operand, literalType: operand.type });
    if (operand?.kind === 'constant') return valueOf(operand.type, operand.negativeZero ? -0 : operand.value);
    return null;
  }

  for (const quad of code.quadruples) {
    // Ninguna constante atraviesa un destino de salto o un cambio de control.
    if (quad.op === 'LABEL') known.clear();
    quad.arg1 = resolve(quad.arg1);
    quad.arg2 = resolve(quad.arg2);
    if (quad.result?.kind === 'temporary') known.delete(quad.result.id);

    try {
      let result = null;
      if (['EVAL', 'ASSIGN'].includes(quad.op) && quad.result.kind === 'temporary') {
        const source = typed(quad.arg1);
        if (source) {
          const type = assignmentResultType(temporaries.get(quad.result.id).type, source.type);
          result = valueOf(type, source.value);
        }
      } else if (unaryOperations.has(quad.op)) {
        const argument = typed(quad.arg1);
        if (argument) result = unaryValue(unaryOperations.get(quad.op), argument);
      } else if (binaryOperations.has(quad.op)) {
        const left = typed(quad.arg1);
        const right = typed(quad.arg2);
        if (left && right) result = binaryValue(quad.op, left, right);
      }
      if (result) {
        if (binaryOperations.has(quad.op) || unaryOperations.has(quad.op)) stats.foldedExpressions += 1;
        known.set(quad.result.id, result);
        quad.op = 'ASSIGN';
        quad.arg1 = constant(result);
        quad.arg2 = null;
      }
    } catch (error) {
      // Desbordamientos, divisor cero y textos excesivos deben fallar al ejecutar,
      // en su posición original, incluso si la rama nunca llega a ejecutarse.
      if (!(error instanceof TypeRuleError)) throw error;
    }
    if (quad.op.startsWith('JUMP')) known.clear();
  }

  // Solo elimina escrituras constantes cuyo temporal ya no se lee en ningún lugar.
  // EVAL de variables, operaciones que pueden fallar y TICK nunca se descartan aquí.
  const used = new Set(code.quadruples.flatMap(quad => [quad.arg1, quad.arg2])
    .filter(operand => operand?.kind === 'temporary').map(operand => operand.id));
  const quadruples = [];
  const executionMap = [];
  code.quadruples.forEach((quad, index) => {
    if (quad.op === 'ASSIGN' && quad.arg1.kind === 'constant'
      && quad.result.kind === 'temporary' && !used.has(quad.result.id)) return;
    quadruples.push(quad);
    executionMap.push(code.executionMap[index]);
  });
  code.quadruples = quadruples;
  code.executionMap = executionMap;
  const retained = new Set(quadruples.flatMap(quad => [quad.arg1, quad.arg2, quad.result])
    .filter(operand => operand?.kind === 'temporary').map(operand => operand.id));
  code.temporaries = code.temporaries.filter(entry => retained.has(entry.id));
  stats.outputInstructions = quadruples.length;
  stats.removedInstructions = stats.inputInstructions - stats.outputInstructions;
  validateExecutable(code);
  return { code, stats };
}
