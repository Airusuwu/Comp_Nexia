import { setImmediate as yieldTurn } from 'node:timers/promises';
import { TypeRuleError, assignmentResultType, requireBooleanCondition } from '../types/compatibility.js';
import { requireInitialized } from '../types/guards.js';
import { SymbolTable } from '../symbols/table.js';
import { literalValue, inputValue, unaryValue, binaryValue, valueOf, formatValue } from './values.js';

// Señal interna de pausa lógica: se transforma en waiting_input, no en un error del programa.
class NeedInput extends Error {
  constructor(input) { super('Entrada pendiente'); this.input = input; }
}

// Interpreta un AST ya validado. Cada llamada empieza desde cero con su propia tabla.
// Para Leer, el cliente reenvía las entradas acumuladas y se repite el recorrido.
export async function execute(ast, inputs = [], { signal } = {}) {
  const symbols = new SymbolTable();
  const results = [];
  let activeNode = ast;
  let steps = 0;
  let inputIndex = 0;
  let outputSize = 0;
  const started = performance.now();

  // Cede periódicamente el turno a Node para atender HTTP/cancelaciones y limita recursos.
  async function tick(node) {
    activeNode = node;
    steps += 1;
    if (steps % 128 === 0) await yieldTurn();
    if (signal?.aborted) throw new TypeRuleError('EXECUTION_STOPPED', 'Ejecución detenida.');
    if (steps > 50000 || performance.now() - started > 2000) {
      throw new TypeRuleError('EXECUTION_LIMIT', 'Se detuvo el programa: excedió 50000 pasos o 2 segundos de ejecución.');
    }
  }

  async function expression(node) {
    await tick(node);
    if (node.kind === 'Literal') return literalValue(node);
    if (node.kind === 'Identifier') {
      const symbol = symbols.resolve(node.name);
      requireInitialized(node.name, symbol.initialized);
      return valueOf(symbol.type, symbol.value);
    }
    if (node.kind === 'GroupExpression') return expression(node.expression);
    if (node.kind === 'UnaryExpression') {
      const argument = await expression(node.argument);
      activeNode = node;
      return unaryValue(node.operator, argument);
    }
    if (node.kind === 'BinaryExpression') {
      // Ambos operandos se evalúan incluso para Y/O: esta versión no usa cortocircuito.
      const left = await expression(node.left);
      const right = await expression(node.right);
      activeNode = ['/', '%'].includes(node.operator) ? node.right : node;
      return binaryValue(node.operator, left, right);
    }
    throw new TypeError('Expresión desconocida.');
  }

  async function block(body) {
    symbols.enter();
    try { await statements(body); } finally { symbols.leave(); }
  }

  async function statements(body) {
    for (const node of body) {
      await tick(node);
      if (node.kind === 'Declaration') {
        for (const target of node.targets) {
          await tick(target);
          symbols.declare(target.name, node.declaredType, target.location);
        }
      } else if (node.kind === 'Assignment') {
        const target = symbols.resolve(node.target.name);
        const result = await expression(node.value);
        activeNode = node.value;
        assignmentResultType(target.type, result.type);
        target.value = result.value;
        target.initialized = true;
      } else if (node.kind === 'ReadStatement') {
        const target = symbols.resolve(node.target.name);
        activeNode = node.target;
        if (inputIndex >= 100) throw new TypeRuleError('INPUT_LIMIT', 'Se alcanzó el límite de 100 entradas por ejecución.');
        if (inputIndex === inputs.length) throw new NeedInput({
          index: inputIndex, name: target.name, type: target.type, location: node.target.location
        });
        target.value = inputValue(inputs[inputIndex++], target.type).value;
        target.initialized = true;
      } else if (node.kind === 'WriteStatement') {
        const values = [];
        let lineSize = 0;
        for (const value of node.values) {
          const text = formatValue(await expression(value));
          lineSize += text.length;
          activeNode = node;
          if (outputSize + lineSize > 65536) throw new TypeRuleError('OUTPUT_LIMIT', 'Se excedió el límite de salida de 65536 unidades UTF-16.');
          values.push(text);
        }
        // Escribir concatena representaciones sin agregar espacios entre argumentos.
        const text = values.join('');
        outputSize += text.length;
        activeNode = node;
        if (results.length >= 1000 || outputSize > 65536) throw new TypeRuleError('OUTPUT_LIMIT', 'Se excedió el límite de salida (1000 líneas o 65536 unidades UTF-16).');
        results.push(text);
      } else if (node.kind === 'IfStatement') {
        const condition = await expression(node.condition);
        requireBooleanCondition(condition.type);
        await block(condition.value ? node.consequent : node.alternate ?? []);
      } else if (node.kind === 'WhileStatement') {
        while (true) {
          const condition = await expression(node.condition);
          requireBooleanCondition(condition.type);
          if (!condition.value) break;
          await block(node.body);
        }
      } else throw new TypeError('Instrucción desconocida.');
    }
  }

  try {
    await statements(ast.body);
    return { status: 'completed', executed: true, results, diagnostics: [], steps };
  } catch (error) {
    // executed=true indica que el motor comenzó; solo completed confirma que terminó.
    // Las salidas anteriores se conservan también al pedir datos o encontrar un error.
    if (error instanceof NeedInput) return { status: 'waiting_input', executed: true, results, diagnostics: [], input: error.input, steps };
    if (!(error instanceof TypeRuleError)) throw error;
    return {
      status: error.code === 'EXECUTION_STOPPED' ? 'stopped' : 'runtime_error', executed: true, results, steps,
      diagnostics: [{ code: error.code, message: error.message, severity: 'error', stage: 'runtime', ...activeNode.location }]
    };
  }
}
