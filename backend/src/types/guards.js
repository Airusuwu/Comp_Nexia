import { TYPES, TypeRuleError, requireType } from './compatibility.js';

export function requireDeclared(name, declaration) {
  if (declaration === undefined || declaration === null) {
    throw new TypeRuleError('UNDECLARED_VARIABLE', `La variable "${name}" debe declararse antes de utilizarse.`);
  }
  requireType(declaration.type);
  return declaration;
}

export function requireNewDeclaration(name, declaredInCurrentScope) {
  if (typeof declaredInCurrentScope !== 'boolean') throw new TypeError('Se requiere un indicador booleano del ámbito actual.');
  if (declaredInCurrentScope) {
    throw new TypeRuleError('REDECLARED_VARIABLE', `La variable "${name}" ya está declarada en este ámbito.`);
  }
}

export function requireInitialized(name, initialized) {
  if (typeof initialized !== 'boolean') throw new TypeError('Se requiere un estado de inicialización booleano.');
  if (!initialized) {
    throw new TypeRuleError('UNINITIALIZED_VARIABLE', `Error: la variable "${name}" no tiene un valor asignado`);
  }
}

export function checkDivisor(operator, type, value = undefined) {
  requireType(type);
  if (!['/', '%'].includes(operator)) throw new TypeError('El control de divisor solo admite / y %.');
  if ((operator === '%' && type !== TYPES.ENTERO)
    || (operator === '/' && ![TYPES.ENTERO, TYPES.REAL].includes(type))) {
    throw new TypeRuleError('INVALID_DIVISOR_TYPE', `El operador ${operator} no admite un divisor ${type}.`);
  }
  if (value === undefined) return { requiresRuntimeCheck: true };
  if (typeof value !== 'bigint' && (typeof value !== 'number' || !Number.isFinite(value))) {
    throw new TypeError('Se requiere un valor numérico conocido, sin conversiones implícitas.');
  }
  if (type === TYPES.ENTERO && typeof value === 'number' && !Number.isInteger(value)) {
    throw new TypeError('El valor proporcionado no corresponde al tipo ENTERO.');
  }
  if (value === 0 || value === 0n) {
    throw new TypeRuleError('ZERO_DIVISOR', 'Error: no es posible dividir entre cero');
  }
  return { requiresRuntimeCheck: false };
}
