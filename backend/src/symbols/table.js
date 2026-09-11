import { requireDeclared, requireNewDeclaration } from '../types/guards.js';

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

  resolve(name) {
    const key = name.toUpperCase();
    for (let index = this.frames.length - 1; index >= 0; index -= 1) {
      if (this.frames[index].has(key)) return this.frames[index].get(key);
    }
    return requireDeclared(name, undefined);
  }

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
