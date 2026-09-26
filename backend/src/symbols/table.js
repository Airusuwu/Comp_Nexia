import { requireDeclared, requireNewDeclaration } from '../types/guards.js';

// Pila de ámbitos: el primero es global y el último es el bloque actualmente activo.
export class SymbolTable {
  constructor(frames = [new Map()]) {
    this.frames = frames;
  }

  declare(name, type, location) {
    const frame = this.frames.at(-1);
    const key = name.toUpperCase();
    requireNewDeclaration(name, frame.has(key));
    frame.set(key, { name, type, location, initialized: false, constant: undefined });
  }

  // Busca desde el ámbito más cercano; los identificadores no distinguen mayúsculas.
  resolve(name) {
    const key = name.toUpperCase();
    for (let index = this.frames.length - 1; index >= 0; index -= 1) {
      if (this.frames[index].has(key)) return this.frames[index].get(key);
    }
    return requireDeclared(name, undefined);
  }

  // Copia el estado de símbolos para analizar caminos sin modificar el original.
  clone() {
    return new SymbolTable(this.frames.map((frame) => new Map(
      Array.from(frame, ([key, value]) => [key, { ...value }])
    )));
  }

  enter() { this.frames.push(new Map()); }
  leave() { this.frames.pop(); }

  forgetConstants() {
    for (const frame of this.frames) {
      for (const symbol of frame.values()) symbol.constant = undefined;
    }
  }

  // Tras Si/Sino, una variable solo está inicializada si lo está en ambos caminos.
  merge(left, right) {
    this.frames.forEach((frame, index) => {
      for (const [key, symbol] of frame) {
        const first = left.frames[index].get(key);
        const second = right.frames[index].get(key);
        symbol.initialized = first.initialized && second.initialized;
        symbol.constant = symbol.initialized && first.constant === second.constant ? first.constant : undefined;
      }
    });
  }

  summary() {
    return Array.from(this.frames[0].values(), ({ constant, ...symbol }) => symbol);
  }
}
