import { SymbolTable } from '../symbols/table.js';
import { requireType, binaryResultType, unaryResultType, assignmentResultType } from '../types/compatibility.js';

// Cuarta fase: convierte un AST semánticamente válido en instrucciones, sin ejecutarlo.
export function generateIntermediate(ast) {
  if (ast?.kind !== 'Program' || !Array.isArray(ast.body)) {
    throw new TypeError('Se requiere un AST Program validado por la semántica.');
  }

  const table = new SymbolTable();
  const quadruples = [];
  const variables = [];
  const temporaries = [];
  const scopes = [{ id: 's1', parent: null, location: { ...ast.location } }];
  const scopeStack = ['s1'];
  let labelCount = 0;
  const locationOf = (node) => ({ ...node.location });
  const reference = (kind, id) => ({ kind, id });

  function emit(op, node, arg1 = null, arg2 = null, result = null) {
    quadruples.push({ op, arg1, arg2, result, location: locationOf(node) });
  }

  function temporary(type, node) {
    const id = `t${temporaries.length + 1}`;
    temporaries.push({ id, type: requireType(type), scope: scopeStack.at(-1), location: locationOf(node) });
    return reference('temporary', id);
  }

  const label = () => reference('label', `L${++labelCount}`);

  function enterScope(node) {
    const id = `s${scopes.length + 1}`;
    scopes.push({ id, parent: scopeStack.at(-1), location: locationOf(node) });
    scopeStack.push(id);
    table.enter();
  }

  function leaveScope() {
    table.leave();
    scopeStack.pop();
  }

  function declare(target, type) {
    table.declare(target.name, requireType(type), target.location);
    const symbol = table.resolve(target.name);
    symbol.id = `v${variables.length + 1}`;
    variables.push({ id: symbol.id, name: target.name, type, scope: scopeStack.at(-1), location: locationOf(target) });
    const operand = reference('variable', symbol.id);
    // DECLARE reinicia la variable sin valor cada vez que se visita esta instrucción.
    emit('DECLARE', target, null, null, operand);
    return operand;
  }

  function variable(target) {
    const symbol = table.resolve(target.name);
    return { operand: reference('variable', symbol.id), type: symbol.type };
  }

  function expression(node) {
    if (node.kind === 'Literal') {
      return {
        type: requireType(node.literalType),
        operand: {
          kind: 'literal', type: node.literalType, raw: node.raw,
          ...(node.literalType === 'BOOLEANO' ? { canonical: node.canonical } : {})
        }
      };
    }
    if (node.kind === 'Identifier') return variable(node);
    if (node.kind === 'GroupExpression') return expression(node.expression);
    if (node.kind === 'UnaryExpression') {
      const argument = expression(node.argument);
      const type = unaryResultType(node.operator, argument.type);
      const result = temporary(type, node);
      const op = node.operator === '+' ? 'POS' : node.operator === '-' ? 'NEG' : 'NO';
      emit(op, node, argument.operand, null, result);
      return { operand: result, type };
    }
    if (node.kind === 'BinaryExpression') {
      // Conserva el orden y la evaluación de ambos operandos, incluidos Y/O.
      const left = expression(node.left);
      const right = expression(node.right);
      const type = binaryResultType(node.operator, left.type, right.type);
      const result = temporary(type, node);
      emit(node.operator, node, left.operand, right.operand, result);
      return { operand: result, type };
    }
    throw new TypeError(`Expresión no soportada por el generador: ${node.kind}.`);
  }

  function block(body, node) {
    enterScope(node);
    try { statements(body); } finally { leaveScope(); }
  }

  function statements(body) {
    for (const node of body) {
      if (node.kind === 'Declaration') {
        for (const target of node.targets) declare(target, node.declaredType);
      } else if (node.kind === 'Assignment') {
        const target = variable(node.target);
        const value = expression(node.value);
        assignmentResultType(target.type, value.type);
        emit('ASSIGN', node, value.operand, null, target.operand);
      } else if (node.kind === 'ReadStatement') {
        emit('READ', node, null, null, variable(node.target).operand);
      } else if (node.kind === 'WriteStatement') {
        emit('WRITE_BEGIN', node);
        for (const value of node.values) emit('WRITE_ARG', value, expression(value).operand);
        emit('WRITE_END', node);
      } else if (node.kind === 'IfStatement') {
        const condition = expression(node.condition);
        const end = label();
        const alternate = node.alternate ? label() : end;
        emit('JUMP_IF_FALSE', node.condition, condition.operand, null, alternate);
        block(node.consequent, node);
        if (node.alternate) {
          emit('JUMP', node, null, null, end);
          emit('LABEL', node, null, null, alternate);
          block(node.alternate, node);
        }
        emit('LABEL', node, null, null, end);
      } else if (node.kind === 'WhileStatement') {
        const start = label();
        const end = label();
        emit('LABEL', node, null, null, start);
        const condition = expression(node.condition);
        emit('JUMP_IF_FALSE', node.condition, condition.operand, null, end);
        block(node.body, node);
        emit('JUMP', node, null, null, start);
        emit('LABEL', node, null, null, end);
      } else if (node.kind === 'RepeatUntilStatement') {
        const start = label();
        emit('LABEL', node, null, null, start);
        block(node.body, node);
        const condition = expression(node.condition);
        emit('JUMP_IF_FALSE', node.condition, condition.operand, null, start);
      } else if (node.kind === 'ForStatement') {
        // Captura ambos límites antes de crear el contador local que podría ocultarlos.
        const initial = expression(node.initial);
        const current = temporary('ENTERO', node.initial);
        emit('ASSIGN', node.initial, initial.operand, null, current);
        const limitValue = expression(node.limit);
        const limit = temporary('ENTERO', node.limit);
        emit('ASSIGN', node.limit, limitValue.operand, null, limit);

        enterScope(node);
        try {
          const counter = declare(node.variable, 'ENTERO');
          const start = label();
          const end = label();
          emit('LABEL', node, null, null, start);
          const inRange = temporary('BOOLEANO', node);
          emit('<=', node, current, limit, inRange);
          emit('JUMP_IF_FALSE', node, inRange, null, end);
          emit('ASSIGN', node.variable, current, null, counter);
          block(node.body, node);

          // Salir antes de sumar evita desbordar cuando el límite es el entero máximo.
          const finished = temporary('BOOLEANO', node);
          emit('>=', node, current, limit, finished);
          emit('JUMP_IF_TRUE', node, finished, null, end);
          const next = temporary('ENTERO', node);
          emit('+', node, current, { kind: 'literal', type: 'ENTERO', raw: '1' }, next);
          emit('ASSIGN', node, next, null, current);
          emit('JUMP', node, null, null, start);
          emit('LABEL', node, null, null, end);
        } finally { leaveScope(); }
      } else {
        throw new TypeError(`Instrucción no soportada por el generador: ${node.kind}.`);
      }
    }
  }

  statements(ast.body);
  return { version: 1, format: 'quadruples', quadruples, variables, temporaries, scopes };
}
