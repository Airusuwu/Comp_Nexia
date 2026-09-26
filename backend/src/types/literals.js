import { TYPES, TypeRuleError } from './compatibility.js';

// Clasifica la escritura de un literal sin convertirla todavía en un valor de ejecución.
export function literalType(lexeme) {
  if (typeof lexeme !== 'string') throw new TypeError('El literal debe proporcionarse como texto original.');
  if (lexeme === 'VERDADERO' || lexeme === 'FALSO') return TYPES.BOOLEANO;
  if (/^[+-]?\d+$/.test(lexeme)) return TYPES.ENTERO;
  if (/^[+-]?\d+\.\d+$/.test(lexeme)) return TYPES.REAL;
  if (lexeme.startsWith('"') || lexeme.startsWith("'")) {
    const quote = lexeme[0];
    if (lexeme.length < 2 || !lexeme.endsWith(quote)) {
      throw new TypeRuleError('UNCLOSED_LITERAL', 'El literal tiene comillas sin cerrar.');
    }
    const content = lexeme.slice(1, -1);
    if (/[\\\r\n]/.test(content) || content.includes(quote)) {
      throw new TypeRuleError('UNSPECIFIED_LITERAL_FORMAT', 'El PDF no define escapes, comillas internas ni literales multilínea.');
    }
    if (quote === '"') return TYPES.TEXTO;
    // Cuenta puntos de código Unicode, no grafemas compuestos ni unidades UTF-16.
    const symbols = Array.from(content);
    if (symbols.length !== 1) {
      throw new TypeRuleError('INVALID_CHARACTER', 'Un literal CARACTER debe contener un solo símbolo entre comillas simples.');
    }
    return TYPES.CARACTER;
  }
  throw new TypeRuleError('UNSPECIFIED_LITERAL_FORMAT', 'El formato del literal no está definido por los casos implementados del PDF.');
}
