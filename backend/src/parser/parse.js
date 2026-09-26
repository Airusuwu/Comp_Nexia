// A mayor número, mayor prioridad: multiplicar se agrupa antes que sumar.
const precedence = new Map([
  ['O', 1], ['Y', 2], ['==', 3], ['!=', 3], ['<', 3], ['>', 3], ['<=', 3], ['>=', 3],
  ['+', 4], ['-', 4], ['*', 5], ['/', 5], ['%', 5]
]);
const literalTypes = {
  INTEGER_LITERAL: 'ENTERO', REAL_LITERAL: 'REAL', TEXT_LITERAL: 'TEXTO',
  CHARACTER_LITERAL: 'CARACTER', BOOLEAN_LITERAL: 'BOOLEANO'
};

class ParseError extends Error {
  constructor(code, message, token) {
    super(message);
    this.diagnostic = {
      code, message, severity: 'error', stage: 'parser',
      offset: token.offset, line: token.line, column: token.column,
      endOffset: token.endOffset, endLine: token.endLine, endColumn: token.endColumn
    };
  }
}

// Segunda fase: tokens -> AST (árbol de instrucciones y expresiones), sin ejecutarlo.
export function parse(tokens) {
  if (!Array.isArray(tokens) || tokens.at(-1)?.category !== 'EOF') {
    throw new TypeError('El parser requiere tokens léxicos válidos terminados en EOF.');
  }
  let cursor = 0;
  let nesting = 0;
  const depths = new WeakMap();
  const current = () => tokens[cursor];
  const matches = (value) => (current().canonical ?? current().lexeme) === value;
  const take = () => tokens[cursor++];
  const fail = (message, code = 'UNEXPECTED_TOKEN') => {
    throw new ParseError(code, message, current());
  };
  function expect(value) {
    if (!matches(value)) fail(`Se esperaba ${value}; se encontró ${current().lexeme || 'fin de archivo'}.`);
    return take();
  }
  // Cada nodo conserva su ubicación para que las fases siguientes puedan señalar errores.
  function node(kind, start, fields = {}, children = []) {
    const depth = 1 + Math.max(0, ...children.map((child) => depths.get(child)));
    if (depth > 128) fail('El AST supera la profundidad técnica de 128 niveles.', 'SYNTAX_LIMIT');
    const end = tokens[Math.max(0, cursor - 1)];
    const result = {
      kind, ...fields,
      location: {
        offset: start.offset, line: start.line, column: start.column,
        endOffset: end.endOffset, endLine: end.endLine, endColumn: end.endColumn
      }
    };
    depths.set(result, depth);
    return result;
  }
  // Límite técnico para evitar desbordamientos de pila con código muy anidado.
  function nested(action) {
    nesting += 1;
    if (nesting > 64) fail('Se superó el límite técnico de anidamiento (64).', 'SYNTAX_LIMIT');
    try {
      return action();
    } finally {
      nesting -= 1;
    }
  }
  function newlines() {
    while (current().category === 'NEWLINE') take();
  }
  function endLine() {
    if (current().category === 'EOF') return;
    if (current().category !== 'NEWLINE') fail('Se esperaba un salto de línea después de la instrucción.');
    newlines();
  }
  function identifier() {
    const start = current();
    if (start.category !== 'IDENTIFIER') fail('Se esperaba el nombre de una variable.');
    take();
    return node('Identifier', start, { name: start.lexeme });
  }
  // Ascenso de precedencia: priority + 1 hace asociativos a la izquierda los binarios.
  function expression(minimum = 1) {
    return nested(() => {
      const start = current();
      let left;
      if (['+', '-', 'NO'].some(matches)) {
        const operator = take().canonical;
        const argument = expression(6);
        left = node('UnaryExpression', start, { operator, argument }, [argument]);
      } else if (matches('(')) {
        take();
        const inner = expression();
        expect(')');
        left = node('GroupExpression', start, { expression: inner }, [inner]);
      } else if (literalTypes[start.category]) {
        take();
        left = node('Literal', start, {
          literalType: literalTypes[start.category], raw: start.lexeme,
          ...(start.canonical ? { canonical: start.canonical } : {})
        });
      } else if (start.category === 'IDENTIFIER') {
        left = identifier();
      } else {
        fail('Se esperaba un literal, variable, operador unario o expresión entre paréntesis.');
      }
      while (current().category === 'OPERATOR') {
        const operator = current().canonical;
        const priority = precedence.get(operator);
        if (priority === undefined || priority < minimum) break;
        take();
        const right = expression(priority + 1);
        left = node('BinaryExpression', start, { operator, left, right }, [left, right]);
      }
      return left;
    });
  }
  function block(stops) {
    return nested(() => {
      const body = [];
      newlines();
      while (current().category !== 'EOF' && !stops.some(matches)) {
        body.push(statement());
        endLine();
      }
      return body;
    });
  }
  // Cada alternativa reconoce una instrucción y construye su nodo correspondiente.
  function statement() {
    const start = current();
    if (matches('Definir')) {
      take();
      const targets = [identifier()];
      while (matches(',')) {
        take();
        targets.push(identifier());
      }
      expect('Como');
      if (current().category !== 'TYPE') fail('Se esperaba ENTERO, REAL, TEXTO, CARACTER o BOOLEANO.');
      const declaredType = take().canonical;
      return node('Declaration', start, { targets, declaredType }, targets);
    }
    if (matches('Leer')) {
      take();
      const target = identifier();
      return node('ReadStatement', start, { target }, [target]);
    }
    if (matches('Escribir')) {
      take();
      const values = [expression()];
      while (matches(',')) {
        take();
        values.push(expression());
      }
      return node('WriteStatement', start, { values }, values);
    }
    if (matches('Si')) {
      take();
      const condition = expression();
      expect('Entonces');
      endLine();
      const consequent = block(['Sino', 'FinSi']);
      let alternate = null;
      if (matches('Sino')) {
        take();
        endLine();
        alternate = block(['FinSi']);
      }
      expect('FinSi');
      return node('IfStatement', start, { condition, consequent, alternate }, [condition, ...consequent, ...(alternate ?? [])]);
    }
    if (matches('Mientras')) {
      take();
      const condition = expression();
      expect('Hacer');
      endLine();
      const body = block(['FinMientras']);
      expect('FinMientras');
      return node('WhileStatement', start, { condition, body }, [condition, ...body]);
    }
    if (start.category === 'IDENTIFIER') {
      const target = identifier();
      expect('<-');
      const value = expression();
      return node('Assignment', start, { target, value }, [target, value]);
    }
    fail('Se esperaba una declaración, asignación, Leer, Escribir, Si o Mientras.');
  }

  try {
    newlines();
    const start = expect('Inicio');
    endLine();
    const body = block(['Fin']);
    expect('Fin');
    const ast = node('Program', start, { body }, body);
    endLine();
    if (current().category !== 'EOF') fail('No se permiten instrucciones después de Fin.');
    return { ast, diagnostics: [], truncated: false };
  } catch (error) {
    if (!(error instanceof ParseError)) throw error;
    return { ast: null, diagnostics: [error.diagnostic], truncated: error.diagnostic.code === 'SYNTAX_LIMIT' };
  }
}
