import { literalType } from '../types/literals.js';
import { TypeRuleError } from '../types/compatibility.js';

const keywords = new Set(['Inicio', 'Fin', 'Definir', 'Como', 'Leer', 'Escribir', 'Si', 'Entonces', 'Sino', 'FinSi', 'Mientras', 'Hacer', 'FinMientras']);
const typeNames = new Set(['ENTERO', 'REAL', 'TEXTO', 'CARACTER', 'BOOLEANO']);
const booleanNames = new Set(['VERDADERO', 'FALSO']);
const logicalOperators = new Set(['Y', 'O', 'NO']);
const symbolicOperators = new Set(['<-', '<=', '>=', '==', '!=', '+', '-', '*', '/', '%', '<', '>']);
const literalCategories = {
  ENTERO: 'INTEGER_LITERAL', REAL: 'REAL_LITERAL', TEXTO: 'TEXT_LITERAL', CARACTER: 'CHARACTER_LITERAL'
};
const wordStart = /[\p{L}_]/u;
const wordPart = /[\p{L}\p{M}\p{N}_]/u;

export function tokenize(source, { caseSensitive = false } = {}) {
  if (typeof source !== 'string') throw new TypeError('El código debe ser texto.');
  if (typeof caseSensitive !== 'boolean') throw new TypeError('caseSensitive debe ser booleano.');
  const tokens = [];
  const diagnostics = [];
  let offset = 0;
  let line = 1;
  let column = 1;

  const current = () => offset < source.length ? String.fromCodePoint(source.codePointAt(offset)) : '';
  const position = () => ({ offset, line, column });
  function advance() {
    const character = current();
    if (character === '\r' || character === '\n') {
      offset += character === '\r' && source[offset + 1] === '\n' ? 2 : 1;
      line += 1;
      column = 1;
    } else {
      offset += character.length;
      column += character.length;
    }
  }
  function addToken(category, start, canonical) {
    const token = {
      category, lexeme: source.slice(start.offset, offset), ...start,
      endOffset: offset, endLine: line, endColumn: column
    };
    if (canonical !== undefined) token.canonical = canonical;
    tokens.push(token);
  }
  function addError(code, message, start) {
    diagnostics.push({
      code, message, severity: 'error', stage: 'lexer', ...start,
      endOffset: offset, endLine: line, endColumn: column
    });
  }
  function classifyLiteral(start) {
    try {
      addToken(literalCategories[literalType(source.slice(start.offset, offset))], start);
    } catch (error) {
      if (!(error instanceof TypeRuleError)) throw error;
      addError(error.code, error.message, start);
    }
  }
  function matchWord(group, word) {
    if (caseSensitive) return group.has(word) ? word : undefined;
    const uppercase = word.toUpperCase();
    return Array.from(group).find((candidate) => candidate.toUpperCase() === uppercase);
  }

  while (offset < source.length && diagnostics.length < 100) {
    const start = position();
    const character = current();
    if (character === ' ' || character === '\t' || (offset === 0 && character === '\uFEFF')) {
      advance();
      continue;
    }
    if (character === '\r' || character === '\n') {
      advance();
      addToken('NEWLINE', start);
      continue;
    }
    if (source.startsWith('//', offset)) {
      while (offset < source.length && !['\r', '\n'].includes(current())) advance();
      continue;
    }
    if (character === '"' || character === "'") {
      advance();
      let closed = false;
      while (offset < source.length && !['\r', '\n'].includes(current())) {
        const next = current();
        advance();
        if (next === character) {
          closed = true;
          break;
        }
        if (next === '\\' && offset < source.length && !['\r', '\n'].includes(current())) advance();
      }
      if (closed) classifyLiteral(start);
      else addError('UNCLOSED_LITERAL', 'El literal tiene comillas sin cerrar antes del fin de línea o archivo.', start);
      continue;
    }
    if (/[0-9]/.test(character) || (character === '.' && /[0-9]/.test(source[offset + 1] ?? ''))) {
      advance();
      while (offset < source.length) {
        const next = current();
        if (wordPart.test(next) || next === '.') advance();
        else if (['+', '-'].includes(next) && /[eE]/.test(source[offset - 1])) advance();
        else break;
      }
      classifyLiteral(start);
      continue;
    }
    if (wordStart.test(character)) {
      advance();
      while (offset < source.length && wordPart.test(current())) advance();
      const word = source.slice(start.offset, offset);
      let matched = false;
      for (const [group, category] of [[keywords, 'KEYWORD'], [typeNames, 'TYPE'], [booleanNames, 'BOOLEAN_LITERAL'], [logicalOperators, 'OPERATOR']]) {
        const canonical = matchWord(group, word);
        if (canonical !== undefined) {
          addToken(category, start, canonical);
          matched = true;
          break;
        }
      }
      if (!matched) addToken('IDENTIFIER', start);
      continue;
    }
    const pair = source.slice(offset, offset + 2);
    if (symbolicOperators.has(pair)) {
      advance();
      advance();
      addToken('OPERATOR', start, pair);
      continue;
    }
    advance();
    if (symbolicOperators.has(character)) addToken('OPERATOR', start, character);
    else if (['(', ')', ','].includes(character)) addToken('DELIMITER', start, character);
    else addError('INVALID_SYMBOL', character === '←'
      ? 'La asignación documentada se escribe <-, no ←.'
      : `Símbolo no reconocido: ${JSON.stringify(character)}.`, start);
  }

  const truncated = offset < source.length;
  if (truncated) addError('DIAGNOSTIC_LIMIT', 'Se detuvo el análisis léxico al alcanzar 100 errores. Corrige estos errores y vuelve a enviar.', position());
  else addToken('EOF', position());
  return { tokens, diagnostics, truncated };
}
