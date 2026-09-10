import { SymbolTable } from '../symbols/table.js';
import {
  TypeRuleError, binaryResultType, unaryResultType, assignmentResultType,
  requireBooleanCondition, outputTypes, groupedResultType
} from '../types/compatibility.js';
import { requireInitialized, checkDivisor } from '../types/guards.js';

function literalConstant(node) {
  if (!['ENTERO', 'REAL'].includes(node.literalType)) return undefined;
  if (!/^\d+(?:\.0+)?$/.test(node.raw)) return undefined;
  const value = Number(node.raw);
  return Number.isSafeInteger(value) ? value : undefined;
}

function numericConstant(operator, left, right) {
  if (left === undefined || right === undefined) return undefined;
  const first = BigInt(left);
  const second = BigInt(right);
  let value;
  if (operator === '+') value = first + second;
  else if (operator === '-') value = first - second;
  else if (operator === '*') value = first * second;
  else if (operator === '/' && second !== 0n && first % second === 0n) value = first / second;
  else if (operator === '%' && second !== 0n && first >= 0n && second > 0n) value = first % second;
  else return undefined;
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : undefined;
}

export function analyzeSemantics(ast) {
  if (ast?.kind !== 'Program') throw new TypeError('Se requiere un AST Program válido.');
  const table = new SymbolTable();
  const runtimeChecks = [];
  let activeNode = ast;

  function at(node, action) {
    activeNode = node;
    return action();
  }

  function expression(node, symbols) {
    if (node.kind === 'Literal') return { type: node.literalType, constant: literalConstant(node) };
    if (node.kind === 'Identifier') {
      return at(node, () => {
        const symbol = symbols.resolve(node.name);
        requireInitialized(node.name, symbol.initialized);
        return { type: symbol.type, constant: symbol.constant };
      });
    }
    if (node.kind === 'GroupExpression') {
      const inner = expression(node.expression, symbols);
      return { ...inner, type: at(node, () => groupedResultType(inner.type)) };
    }
    if (node.kind === 'UnaryExpression') {
      const argument = expression(node.argument, symbols);
      const type = at(node, () => unaryResultType(node.operator, argument.type));
      const constant = argument.constant === undefined || node.operator === 'NO' ? undefined
        : node.operator === '-' ? -argument.constant : argument.constant;
      return { type, constant };
    }
    if (node.kind === 'BinaryExpression') {
      const left = expression(node.left, symbols);
      const right = expression(node.right, symbols);
      const type = at(node, () => binaryResultType(node.operator, left.type, right.type));
      if (['/', '%'].includes(node.operator)) {
        const check = at(node.right, () => checkDivisor(node.operator, right.type, right.constant));
        if (check.requiresRuntimeCheck) runtimeChecks.push({
          code: 'CHECK_DIVISOR', message: 'Comprobar que el divisor no sea cero durante la ejecución.',
          operator: node.operator, location: node.right.location
        });
      }
      return { type, constant: numericConstant(node.operator, left.constant, right.constant) };
    }
    throw new TypeError(`Nodo de expresión desconocido: ${node.kind}.`);
  }

  function block(body, symbols) {
    symbols.enter();
    try { statements(body, symbols); } finally { symbols.leave(); }
  }

  function statements(body, symbols) {
    for (const node of body) {
      if (node.kind === 'Declaration') {
        at(node.target, () => symbols.declare(node.target.name, node.declaredType, node.target.location));
      } else if (node.kind === 'Assignment') {
        const target = at(node.target, () => symbols.resolve(node.target.name));
        const value = expression(node.value, symbols);
        at(node.value, () => assignmentResultType(target.type, value.type));
        target.initialized = true;
        target.constant = value.constant;
      } else if (node.kind === 'ReadStatement') {
        const target = at(node.target, () => symbols.resolve(node.target.name));
        target.initialized = true;
        target.constant = undefined;
        runtimeChecks.push({
          code: 'CHECK_INPUT_TYPE', message: `Validar la entrada de Leer como ${target.type} antes de almacenarla.`,
          expectedType: target.type, location: node.target.location
        });
      } else if (node.kind === 'WriteStatement') {
        const types = node.values.map((value) => expression(value, symbols).type);
        at(node, () => outputTypes(types));
      } else if (node.kind === 'IfStatement') {
        const condition = expression(node.condition, symbols);
        at(node.condition, () => requireBooleanCondition(condition.type));
        const consequent = symbols.clone();
        const alternate = symbols.clone();
        block(node.consequent, consequent);
        if (node.alternate) block(node.alternate, alternate);
        symbols.merge(consequent, alternate);
      } else if (node.kind === 'WhileStatement') {
        const loop = symbols.clone();
        loop.forgetConstants();
        const condition = expression(node.condition, loop);
        at(node.condition, () => requireBooleanCondition(condition.type));
        block(node.body, loop);
        symbols.forgetConstants();
      } else {
        throw new TypeError(`Instrucción desconocida: ${node.kind}.`);
      }
    }
  }

  try {
    statements(ast.body, table);
    return { diagnostics: [], symbols: table.summary(), runtimeChecks };
  } catch (error) {
    if (!(error instanceof TypeRuleError)) throw error;
    return {
      diagnostics: [{ code: error.code, message: error.message, severity: 'error', stage: 'semantic', ...activeNode.location }],
      symbols: [], runtimeChecks: []
    };
  }
}
