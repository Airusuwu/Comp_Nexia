import { TypeRuleError, binaryResultType, unaryResultType, readResultType } from '../types/compatibility.js';
import { checkDivisor } from '../types/guards.js';

export function valueOf(type, value) {
  if (['ENTERO', 'REAL'].includes(type) && (!Number.isFinite(value) || (type === 'ENTERO' && !Number.isSafeInteger(value)))) {
    throw new TypeRuleError('NUMERIC_LIMIT', 'El valor excede los límites numéricos del motor básico.');
  }
  if (typeof value === 'string' && value.length > 65536) {
    throw new TypeRuleError('TEXT_LIMIT', 'El texto supera el límite de 65536 unidades UTF-16.');
  }
  return { type, value };
}

export function literalValue(node) {
  if (node.literalType === 'BOOLEANO') return valueOf('BOOLEANO', node.canonical === 'VERDADERO');
  if (['TEXTO', 'CARACTER'].includes(node.literalType)) return valueOf(node.literalType, node.raw.slice(1, -1));
  const value = Number(node.raw);
  if (value === 0 && /[1-9]/.test(node.raw)) throw new TypeRuleError('NUMERIC_LIMIT', 'El literal es demasiado pequeño para este motor.');
  return valueOf(node.literalType, value);
}

export function inputValue(text, type) {
  if (type === 'TEXTO') return valueOf(type, text);
  if (type === 'CARACTER') {
    if (Array.from(text).length !== 1) throw new TypeRuleError('INVALID_INPUT', 'Leer CARACTER requiere exactamente un símbolo, sin comillas.');
    return valueOf(type, text);
  }
  const raw = text.trim();
  if (type === 'BOOLEANO') {
    if (!/^(VERDADERO|FALSO)$/i.test(raw)) throw new TypeRuleError('INVALID_INPUT', 'Leer BOOLEANO requiere VERDADERO o FALSO.');
    return valueOf(type, raw.toUpperCase() === 'VERDADERO');
  }
  const inputType = /^[+-]?\d+$/.test(raw) ? 'ENTERO' : /^[+-]?\d+\.\d+$/.test(raw) ? 'REAL' : null;
  if (!inputType) throw new TypeRuleError('INVALID_INPUT', 'Leer requiere un número decimal válido, sin comillas.');
  readResultType(type, inputType);
  const parsed = literalValue({ literalType: inputType, raw });
  return valueOf(type, parsed.value);
}

export function unaryValue(operator, operand) {
  const type = unaryResultType(operator, operand.type);
  return valueOf(type, operator === 'NO' ? !operand.value : operator === '-' ? -operand.value : operand.value);
}

export function binaryValue(operator, left, right) {
  const type = binaryResultType(operator, left.type, right.type);
  if (['/', '%'].includes(operator)) checkDivisor(operator, right.type, right.value);
  if (type === 'ENTERO') {
    const first = BigInt(left.value);
    const second = BigInt(right.value);
    const result = operator === '+' ? first + second : operator === '-' ? first - second
      : operator === '*' ? first * second : first % second;
    return valueOf(type, Number(result));
  }
  let result;
  switch (operator) {
    case '+': result = left.value + right.value; break;
    case '-': result = left.value - right.value; break;
    case '*': result = left.value * right.value; break;
    case '/': result = left.value / right.value; break;
    case '<': result = left.value < right.value; break;
    case '<=': result = left.value <= right.value; break;
    case '>': result = left.value > right.value; break;
    case '>=': result = left.value >= right.value; break;
    case '==': result = left.value === right.value; break;
    case '!=': result = left.value !== right.value; break;
    case 'Y': result = left.value && right.value; break;
    case 'O': result = left.value || right.value; break;
    default: throw new TypeError('Operador no implementado.');
  }
  return valueOf(type, result);
}

export function formatValue(typed) {
  return typed.type === 'BOOLEANO' ? (typed.value ? 'VERDADERO' : 'FALSO') : String(typed.value);
}
