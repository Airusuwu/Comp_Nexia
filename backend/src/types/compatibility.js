// Reglas compartidas por análisis y ejecución; no dependen de conversiones de JavaScript.
export const TYPES = Object.freeze({
  ENTERO: 'ENTERO', REAL: 'REAL', TEXTO: 'TEXTO', CARACTER: 'CARACTER', BOOLEANO: 'BOOLEANO'
});

const knownTypes = new Set(Object.values(TYPES));
const numericTypes = new Set([TYPES.ENTERO, TYPES.REAL]);
const binaryOperators = new Set(['+', '-', '*', '/', '%', '<', '>', '<=', '>=', '==', '!=', 'Y', 'O']);

export class TypeRuleError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'TypeRuleError';
    this.code = code;
  }
}

export function requireType(type) {
  if (!knownTypes.has(type)) {
    throw new TypeRuleError('UNKNOWN_TYPE', `Tipo no reconocido: ${String(type)}.`);
  }
  return type;
}

// Recibe tipos, no valores: determina si la operación existe y qué tipo produce.
export function binaryResultType(operator, leftType, rightType) {
  requireType(leftType);
  requireType(rightType);
  if (!binaryOperators.has(operator)) {
    throw new TypeRuleError('UNKNOWN_OPERATOR', `Operador binario no reconocido: ${String(operator)}.`);
  }
  const bothNumeric = numericTypes.has(leftType) && numericTypes.has(rightType);
  if (operator === '+' && leftType === TYPES.TEXTO && rightType === TYPES.TEXTO) return TYPES.TEXTO;
  if (['+', '-', '*', '/'].includes(operator) && bothNumeric) {
    return operator === '/' || leftType === TYPES.REAL || rightType === TYPES.REAL ? TYPES.REAL : TYPES.ENTERO;
  }
  if (operator === '%' && leftType === TYPES.ENTERO && rightType === TYPES.ENTERO) return TYPES.ENTERO;
  if (['<', '>', '<=', '>='].includes(operator) && bothNumeric) return TYPES.BOOLEANO;
  if (['==', '!='].includes(operator) && (leftType === rightType || bothNumeric)) return TYPES.BOOLEANO;
  if (['Y', 'O'].includes(operator) && leftType === TYPES.BOOLEANO && rightType === TYPES.BOOLEANO) return TYPES.BOOLEANO;
  throw new TypeRuleError('INCOMPATIBLE_OPERANDS', `El operador ${operator} no admite ${leftType} y ${rightType}.`);
}

export function unaryResultType(operator, operandType) {
  requireType(operandType);
  if (!['+', '-', 'NO'].includes(operator)) {
    throw new TypeRuleError('UNKNOWN_OPERATOR', `Operador unario no reconocido: ${String(operator)}.`);
  }
  if (operator === 'NO' && operandType === TYPES.BOOLEANO) return TYPES.BOOLEANO;
  if (['+', '-'].includes(operator) && numericTypes.has(operandType)) return operandType;
  throw new TypeRuleError('INCOMPATIBLE_OPERAND', `El operador ${operator} no admite ${operandType}.`);
}

// Única promoción permitida al asignar: ENTERO hacia REAL; nunca a la inversa.
export function assignmentResultType(targetType, sourceType) {
  requireType(targetType);
  requireType(sourceType);
  if (targetType === sourceType || (targetType === TYPES.REAL && sourceType === TYPES.ENTERO)) return targetType;
  throw new TypeRuleError('INCOMPATIBLE_ASSIGNMENT', `No se puede asignar ${sourceType} a ${targetType} mediante <-.`);
}

export function requireBooleanCondition(type) {
  requireType(type);
  if (type !== TYPES.BOOLEANO) {
    throw new TypeRuleError('NON_BOOLEAN_CONDITION', `Si y Mientras requieren BOOLEANO, no ${type}.`);
  }
  return type;
}

export function readResultType(variableType, inputType) {
  return assignmentResultType(variableType, inputType);
}

export function outputTypes(types) {
  if (!Array.isArray(types) || types.length === 0) {
    throw new TypeRuleError('OUTPUT_VALUES_REQUIRED', 'Escribir requiere uno o varios valores.');
  }
  return types.map(requireType);
}

export function groupedResultType(type) {
  return requireType(type);
}
