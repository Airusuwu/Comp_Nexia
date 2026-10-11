import { setImmediate as yieldTurn } from 'node:timers/promises';
import { TypeRuleError, assignmentResultType, requireBooleanCondition } from '../types/compatibility.js';
import { requireInitialized } from '../types/guards.js';
import { literalValue, inputValue, unaryValue, binaryValue, valueOf, formatValue } from './values.js';
import { binaryOperations, unaryOperations, validateExecutable } from '../intermediate/format.js';

class NeedInput extends Error {
  constructor(input) { super('Entrada pendiente'); this.input = input; }
}

// Máquina de cuádruplos: no recibe ni consulta un AST. Cada llamada inicia un estado nuevo.
export async function executeIntermediate(code, inputs = [], { signal } = {}) {
  const { variables, temporaries, labels } = validateExecutable(code);
  const variableValues = new Map();
  const temporaryValues = new Map();
  const results = [];
  let pc = 0;
  let steps = 0;
  let instructions = 0;
  let inputIndex = 0;
  let outputSize = 0;
  let output = null;
  let lineSize = 0;
  let active = null;
  const started = performance.now();

  async function tick() {
    steps += 1;
    if (steps % 128 === 0) await yieldTurn();
    if (signal?.aborted) throw new TypeRuleError('EXECUTION_STOPPED', 'Ejecución detenida.');
    if (steps > 50000 || performance.now() - started > 2000) {
      throw new TypeRuleError('EXECUTION_LIMIT', 'Se detuvo el programa: excedió 50000 pasos o 2 segundos de ejecución.');
    }
  }

  function read(operand) {
    if (operand.kind === 'literal') return literalValue({ ...operand, literalType: operand.type });
    if (operand.kind === 'constant') return valueOf(operand.type, operand.negativeZero ? -0 : operand.value);
    if (operand.kind === 'variable') {
      requireInitialized(active.name ?? variables.get(operand.id).name, variableValues.has(operand.id));
      return variableValues.get(operand.id);
    }
    if (!temporaryValues.has(operand.id)) throw new TypeError('Temporal sin valor en el código intermedio.');
    return temporaryValues.get(operand.id);
  }

  function store(operand, value) {
    const entries = operand.kind === 'variable' ? variables : temporaries;
    const type = assignmentResultType(entries.get(operand.id).type, value.type);
    (operand.kind === 'variable' ? variableValues : temporaryValues).set(operand.id, valueOf(type, value.value));
  }

  try {
    while (pc < code.quadruples.length) {
      const quad = code.quadruples[pc];
      active = code.executionMap[pc];
      instructions += 1;
      // También protege el despacho si un IR interno defectuoso no contiene TICK.
      if (instructions % 128 === 0) await yieldTurn();
      pc += 1;
      if (quad.op === 'TICK') {
        await tick();
        continue;
      }
      if (signal?.aborted) throw new TypeRuleError('EXECUTION_STOPPED', 'Ejecución detenida.');
      if (performance.now() - started > 2000) {
        throw new TypeRuleError('EXECUTION_LIMIT', 'Se detuvo el programa: excedió 50000 pasos o 2 segundos de ejecución.');
      }
      if (quad.op === 'DECLARE') {
        variableValues.delete(quad.result.id);
      } else if (['EVAL', 'ASSIGN'].includes(quad.op)) {
        store(quad.result, read(quad.arg1));
      } else if (unaryOperations.has(quad.op)) {
        store(quad.result, unaryValue(unaryOperations.get(quad.op), read(quad.arg1)));
      } else if (binaryOperations.has(quad.op)) {
        // Los operandos ya se materializaron de izquierda a derecha; Y/O son estrictos.
        store(quad.result, binaryValue(quad.op, read(quad.arg1), read(quad.arg2)));
      } else if (quad.op === 'READ') {
        const target = variables.get(quad.result.id);
        if (inputIndex >= 100) throw new TypeRuleError('INPUT_LIMIT', 'Se alcanzó el límite de 100 entradas por ejecución.');
        if (inputIndex === inputs.length) throw new NeedInput({
          index: inputIndex, name: target.name, type: target.type, location: active.location
        });
        store(quad.result, inputValue(inputs[inputIndex++], target.type));
      } else if (quad.op === 'WRITE_BEGIN') {
        if (output !== null) throw new TypeError('Grupo Escribir anidado en el código intermedio.');
        output = [];
        lineSize = 0;
      } else if (quad.op === 'WRITE_ARG') {
        if (output === null) throw new TypeError('Argumento sin grupo Escribir.');
        const text = formatValue(read(quad.arg1));
        lineSize += text.length;
        if (outputSize + lineSize > 65536) throw new TypeRuleError('OUTPUT_LIMIT', 'Se excedió el límite de salida de 65536 unidades UTF-16.');
        output.push(text);
      } else if (quad.op === 'WRITE_END') {
        if (output === null) throw new TypeError('Cierre sin grupo Escribir.');
        outputSize += lineSize;
        if (results.length >= 1000 || outputSize > 65536) {
          throw new TypeRuleError('OUTPUT_LIMIT', 'Se excedió el límite de salida (1000 líneas o 65536 unidades UTF-16).');
        }
        results.push(output.join(''));
        output = null;
      } else if (quad.op === 'JUMP') {
        pc = labels.get(quad.result.id) + 1;
      } else if (quad.op.startsWith('JUMP_IF_')) {
        const condition = read(quad.arg1);
        requireBooleanCondition(condition.type);
        if (condition.value === (quad.op === 'JUMP_IF_TRUE')) pc = labels.get(quad.result.id) + 1;
      } // LABEL solo marca un destino; su resolución se hizo antes de ejecutar.
    }
    if (output !== null) throw new TypeError('Grupo Escribir incompleto en el código intermedio.');
    return { status: 'completed', executed: true, results, diagnostics: [], steps, instructions };
  } catch (error) {
    if (error instanceof NeedInput) return {
      status: 'waiting_input', executed: true, results, diagnostics: [], input: error.input, steps, instructions
    };
    if (!(error instanceof TypeRuleError)) throw error;
    return {
      status: error.code === 'EXECUTION_STOPPED' ? 'stopped' : 'runtime_error', executed: true, results, steps, instructions,
      diagnostics: [{ code: error.code, message: error.message, severity: 'error', stage: 'runtime', ...active.location }]
    };
  }
}
