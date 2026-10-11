import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { setImmediate as yieldTurn } from 'node:timers/promises';
import { compile, engines, equivalent } from './helpers/compilation.mjs';
import { executeIntermediate } from '../src/runtime/execute-intermediate.js';

describe('equivalencia de expresiones entre AST, IR y optimización', () => {
  const expressions = [
    ['2 + 3 * 4', '14'], ['-(2 + 3) * +4', '-20'], ['8 - 3 - 1', '4'],
    ['8 / 3', '2.6666666666666665'], ['(-7) % 3', '-1'], ['1.5 + 2', '3.5'],
    ['0.1 + 0.2', '0.30000000000000004'], ['2 < 3', 'VERDADERO'], ['2 <= 2', 'VERDADERO'],
    ['2 > 3', 'FALSO'], ['2 >= 2', 'VERDADERO'], ['2 == 2.0', 'VERDADERO'], ['2 != 3', 'VERDADERO'],
    ['VERDADERO Y FALSO', 'FALSO'], ['FALSO O VERDADERO', 'VERDADERO'],
    ['NO (VERDADERO Y FALSO)', 'VERDADERO'], ['"hola" + " mundo"', 'hola mundo'],
    ["'ñ' == 'ñ'", 'VERDADERO'], ["'😀' != 'ñ'", 'VERDADERO'], ['-0.0', '0']
  ];
  for (const [expression, result] of expressions) {
    it(`conserva resultado, tipo y pasos de ${expression}`, async () => {
      await equivalent(compile(`Escribir ${expression}`), [], { status: 'completed', results: [result], diagnostics: [] });
    });
  }

  it('ejecuta el programa vacío sin pasos ni instrucciones', async () => {
    const runs = await equivalent(compile(''), [], { status: 'completed', results: [], steps: 0 });
    assert.equal(runs[1].instructions, 0);
    assert.equal(runs[2].instructions, 0);
  });

  it('respeta declaraciones múltiples, mayúsculas y promoción ENTERO a REAL', async () => {
    await equivalent(compile('Definir a, b Como ENTERO\nDefinir r Como REAL\na <- 2\nB <- 3\nr <- A + b\nEscribir r / 2'), [], {
      status: 'completed', results: ['2.5']
    });
  });
});

describe('ámbitos, condiciones y ciclos en la máquina de cuádruplos', () => {
  const cases = [
    ['ambas ramas de Si/Sino', 'Si VERDADERO Entonces\nEscribir 1\nSino\nEscribir 2\nFinSi\nSi FALSO Entonces\nEscribir 3\nSino\nEscribir 4\nFinSi', ['1', '4']],
    ['Mientras reevalúa sus temporales', 'Definir n Como ENTERO\nn <- 0\nMientras n < 3 Hacer\nn <- n + 1\nEscribir n\nFinMientras', ['1', '2', '3']],
    ['Mientras vacío sin vueltas', 'Mientras FALSO Hacer\nFinMientras\nEscribir "fin"', ['fin']],
    ['Repetir vacío con condición verdadera', 'Repetir\nHasta Que VERDADERO\nEscribir "fin"', ['fin']],
    ['Repetir ejecuta primero el cuerpo', 'Definir n Como ENTERO\nn <- 0\nRepetir\nn <- n + 1\nEscribir n\nHasta Que n >= 3', ['1', '2', '3']],
    ['Para con cero iteraciones', 'Para i <- 4 Hasta Hacer 2\nEscribir i\nFinPara\nEscribir "fin"', ['fin']],
    ['Para en el entero máximo', 'Para i <- 9007199254740991 Hasta Hacer 9007199254740991\nEscribir i\nFinPara', ['9007199254740991']],
    ['Para conserva su avance privado', 'Para i <- 1 Hasta Hacer 3\nEscribir i\ni <- 99\nEscribir i\nFinPara', ['1', '99', '2', '99', '3', '99']],
    ['Para calcula límites una vez', 'Definir desde, limite Como ENTERO\ndesde <- 1\nlimite <- 3\nPara i <- desde Hasta Hacer limite\ndesde <- 99\nlimite <- 99\nEscribir i\nFinPara', ['1', '2', '3']],
    ['contadores homónimos anidados', 'Definir i Como ENTERO\ni <- 7\nPara i <- 1 Hasta Hacer 2\nPara i <- i Hasta Hacer i + 1\nEscribir i\nFinPara\nEscribir i\nFinPara\nEscribir i', ['1', '2', '1', '2', '3', '2', '7']],
    ['variables locales reiniciadas en cada vuelta', 'Definir t1, L1 Como ENTERO\nt1 <- 10\nL1 <- 20\nPara i <- 1 Hasta Hacer 3\nDefinir T1 Como ENTERO\nT1 <- i\nEscribir T1\nFinPara\nEscribir t1 + l1', ['1', '2', '3', '30']],
    ['declaración anidada en rama de ciclo', 'Para i <- 1 Hasta Hacer 3\nSi i % 2 == 0 Entonces\nDefinir local Como TEXTO\nlocal <- "par"\nEscribir local\nSino\nEscribir i\nFinSi\nFinPara', ['1', 'par', '3']],
    ['Repetir con Para y Si anidados', 'Definir suma Como ENTERO\nsuma <- 0\nRepetir\nPara i <- 1 Hasta Hacer 2\nSi i == 1 Entonces\nsuma <- suma + 1\nSino\nsuma <- suma + 2\nFinSi\nFinPara\nHasta Que suma >= 6\nEscribir suma', ['6']]
  ];
  for (const [name, body, results] of cases) {
    it(name, async () => { await equivalent(compile(body), [], { status: 'completed', results }); });
  }
});

describe('lecturas, replay y escritura agrupada', () => {
  const inputs = [
    ['ENTERO', ' -7 ', '-7'], ['REAL', '+2.5', '2.5'], ['REAL', '3', '3'],
    ['BOOLEANO', ' verdadero ', 'VERDADERO'], ['TEXTO', ' con espacios ', ' con espacios '],
    ['TEXTO', '', ''], ['CARACTER', '😀', '😀']
  ];
  for (const [type, input, output] of inputs) {
    it(`Lee ${type} con entrada ${JSON.stringify(input)}`, async () => {
      await equivalent(compile(`Definir dato Como ${type}\nLeer dato\nEscribir dato`), [input], {
        status: 'completed', results: [output]
      });
    });
  }

  const invalid = [['ENTERO', '2.0'], ['ENTERO', ''], ['REAL', 'abc'], ['BOOLEANO', '1'], ['CARACTER', 'ab'], ['CARACTER', 'á']];
  for (const [type, input] of invalid) {
    it(`rechaza entrada inválida ${JSON.stringify(input)} para ${type}`, async () => {
      const runs = await equivalent(compile(`Definir dato Como ${type}\nLeer dato\nEscribir dato`), [input], {
        status: 'runtime_error', results: []
      });
      assert.equal(runs[0].diagnostics[0].code, type === 'ENTERO' && input === '2.0' ? 'INCOMPATIBLE_ASSIGNMENT' : 'INVALID_INPUT');
      assert.equal(runs[0].diagnostics[0].line, 3);
      assert.equal(runs[0].diagnostics[0].column, 6);
    });
  }

  it('espera dos lecturas, conserva ubicación y completa el replay sin salidas duplicadas', async () => {
    const program = compile('Definir a, b Como ENTERO\nEscribir "inicio"\nLeer a\nEscribir "a=", a\nLeer b\nEscribir "suma=", a + b');
    const before = structuredClone(program);
    const first = await equivalent(program, [], { status: 'waiting_input', results: ['inicio'] });
    assert.equal(first[0].input.index, 0);
    assert.equal(first[0].input.location.column, 6);
    const second = await equivalent(program, ['3'], { status: 'waiting_input', results: ['inicio', 'a=3'] });
    assert.equal(second[0].input.index, 1);
    assert.equal(second[0].input.name, 'b');
    await equivalent(program, ['3', '4'], { status: 'completed', results: ['inicio', 'a=3', 'suma=7'] });
    await equivalent(program, [], { status: 'waiting_input', results: ['inicio'] });
    assert.deepEqual(program, before, 'La ejecución no debe modificar AST ni IR compartidos entre replays.');
  });

  it('espera entrada dentro de Para sin perder las vueltas anteriores', async () => {
    const program = compile('Definir dato Como ENTERO\nPara i <- 1 Hasta Hacer 2\nLeer dato\nEscribir i, ":", dato\nFinPara');
    await equivalent(program, ['4'], { status: 'waiting_input', results: ['1:4'] });
    await equivalent(program, ['4', '5'], { status: 'completed', results: ['1:4', '2:5'] });
  });

  it('publica una línea por Escribir y concatena los argumentos sin separadores', async () => {
    await equivalent(compile('Escribir "a=", 2 + 3, \'ñ\', FALSO\nEscribir "fin"'), [], {
      status: 'completed', results: ['a=5ñFALSO', 'fin']
    });
  });
});

describe('errores y límites conservados al optimizar', () => {
  const numericCases = [
    ['literal ENTERO fuera de rango', '9007199254740993'],
    ['desbordamiento ENTERO', '9007199254740991 + 1'],
    ['literal REAL no finito', `${'9'.repeat(310)}.0`],
    ['subdesbordamiento de literal REAL', `0.${'0'.repeat(324)}1`]
  ];
  for (const [name, expression] of numericCases) {
    it(name, async () => {
      const runs = await equivalent(compile(`Escribir "anterior"\nEscribir ${expression}`), [], {
        status: 'runtime_error', results: ['anterior']
      });
      assert.equal(runs[0].diagnostics[0].code, 'NUMERIC_LIMIT');
    });
  }

  for (const operator of ['/', '%']) {
    it(`preserva error y ubicación del divisor de ${operator}`, async () => {
      const runs = await equivalent(compile(`Definir d Como ENTERO\nLeer d\nEscribir "anterior"\nEscribir "sin publicar", 1 ${operator} d`), ['0'], {
        status: 'runtime_error', results: ['anterior']
      });
      assert.equal(runs[0].diagnostics[0].code, 'ZERO_DIVISOR');
      assert.equal(runs[0].diagnostics[0].line, 5);
      assert.equal(runs[0].diagnostics[0].column, 30);
    });
  }

  it('valida el literal izquierdo antes de calcular una división derecha que también falla', async () => {
    const runs = await equivalent(compile('Definir d Como ENTERO\nLeer d\nEscribir 9007199254740993 + (1 / d)'), ['0'], {
      status: 'runtime_error', results: []
    });
    assert.equal(runs[0].diagnostics[0].code, 'NUMERIC_LIMIT');
    assert.equal(runs[0].diagnostics[0].column, 10);
  });

  it('conserva columnas UTF-16 con emoji, tabulador y finales CRLF', async () => {
    const runs = await equivalent(compile('Definir d Como ENTERO\r\nLeer d\r\n\tEscribir "😀", 1 / d'), ['0'], {
      status: 'runtime_error', results: []
    });
    assert.equal(runs[0].diagnostics[0].code, 'ZERO_DIVISOR');
    assert.equal(runs[0].diagnostics[0].line, 4);
    assert.equal(runs[0].diagnostics[0].column, 21);
  });

  for (const expression of ['FALSO Y (1 / d > 0)', 'VERDADERO O (1 / d > 0)', '(1 / d) * 0']) {
    it(`no oculta el error de ${expression}`, async () => {
      const runs = await equivalent(compile(`Definir d Como ENTERO\nLeer d\nEscribir ${expression}`), ['0'], { status: 'runtime_error' });
      assert.equal(runs[0].diagnostics[0].code, 'ZERO_DIVISOR');
    });
  }

  it('no anticipa un error numérico de una rama que no se ejecuta', async () => {
    await equivalent(compile('Si FALSO Entonces\nEscribir 9007199254740991 + 1\nFinSi\nEscribir "bien"'), [], {
      status: 'completed', results: ['bien']
    });
  });

  it('rechaza concatenaciones que superan el límite de texto', async () => {
    const runs = await equivalent(compile('Definir t Como TEXTO\nLeer t\nEscribir "anterior"\nEscribir t + t'), ['x'.repeat(32769)], {
      status: 'runtime_error', results: ['anterior']
    });
    assert.equal(runs[0].diagnostics[0].code, 'TEXT_LIMIT');
  });

  it('admite exactamente 65536 unidades UTF-16 de salida', async () => {
    const text = '😀'.repeat(32768);
    await equivalent(compile('Definir t Como TEXTO\nLeer t\nEscribir t'), [text], { status: 'completed', results: [text] });
  });

  it('conserva salidas anteriores y descarta el grupo que excede 65536 unidades', async () => {
    const runs = await equivalent(compile('Definir t Como TEXTO\nLeer t\nEscribir "prev"\nEscribir t, "!"'), ['x'.repeat(65532)], {
      status: 'runtime_error', results: ['prev']
    });
    assert.equal(runs[0].diagnostics[0].code, 'OUTPUT_LIMIT');
    assert.equal(runs[0].diagnostics[0].line, 5);
    assert.equal(runs[0].diagnostics[0].column, 1);
  });

  for (const limit of [1000, 1001]) {
    it(`aplica el límite de líneas al solicitar ${limit} salidas`, async () => {
      const runs = await equivalent(compile(`Para i <- 1 Hasta Hacer ${limit}\nEscribir ""\nFinPara`), [], {
        status: limit === 1000 ? 'completed' : 'runtime_error', results: Array(1000).fill('')
      });
      if (limit === 1001) assert.equal(runs[0].diagnostics[0].code, 'OUTPUT_LIMIT');
    });
  }

  for (const limit of [100, 101]) {
    it(`aplica el límite de lecturas al solicitar ${limit} entradas`, async () => {
      const runs = await equivalent(compile(`Definir dato Como ENTERO\nPara i <- 1 Hasta Hacer ${limit}\nLeer dato\nFinPara`), Array(100).fill('1'), {
        status: limit === 100 ? 'completed' : 'runtime_error', results: []
      });
      if (limit === 101) assert.equal(runs[0].diagnostics[0].code, 'INPUT_LIMIT');
    });
  }

  it('detiene un ciclo infinito en el mismo paso 50001 con y sin optimización', async context => {
    // Aísla el presupuesto de pasos de la velocidad de la máquina; el reloj se prueba aparte.
    context.mock.method(performance, 'now', () => 0);
    const runs = await equivalent(compile('Mientras VERDADERO Hacer\nFinMientras'), [], {
      status: 'runtime_error', results: [], steps: 50001
    });
    assert.equal(runs[0].diagnostics[0].code, 'EXECUTION_LIMIT');
  });

  it('comprueba el límite de tiempo sin esperar dos segundos reales', async context => {
    const program = compile('Escribir "no se publica"');
    for (const [name, run] of engines(program)) {
      let calls = 0;
      const mock = context.mock.method(performance, 'now', () => calls++ === 0 ? 0 : 2001);
      try {
        const result = await run([]);
        assert.equal(result.status, 'runtime_error', name);
        assert.equal(result.diagnostics[0].code, 'EXECUTION_LIMIT');
        assert.equal(result.steps, 1);
        assert.deepEqual(result.results, []);
      } finally { mock.mock.restore(); }
    }
  });

  it('respeta una cancelación previa sin producir salida', async () => {
    const controller = new AbortController();
    controller.abort();
    for (const [name, run] of engines(compile('Escribir "no se publica"'))) {
      const result = await run([], { signal: controller.signal });
      assert.equal(result.status, 'stopped', name);
      assert.equal(result.diagnostics[0].code, 'EXECUTION_STOPPED');
      assert.equal(result.steps, 1);
      assert.deepEqual(result.results, []);
    }
  });

  it('cede el turno para cancelar un ciclo activo conservando sus salidas anteriores', async () => {
    for (const [name, run] of engines(compile('Escribir "prev"\nMientras VERDADERO Hacer\nFinMientras'))) {
      const controller = new AbortController();
      const pending = run([], { signal: controller.signal });
      await yieldTurn();
      controller.abort();
      const result = await pending;
      assert.equal(result.status, 'stopped', name);
      assert.equal(result.diagnostics[0].code, 'EXECUTION_STOPPED');
      assert.deepEqual(result.results, ['prev']);
      assert.ok(result.steps < 50001);
    }
  });

  it('mantiene la cancelación del despacho incluso ante un ciclo de IR sin TICK', async () => {
    const code = compile('').code;
    const location = code.scopes[0].location;
    const target = { kind: 'label', id: 'L1' };
    code.quadruples = [
      { op: 'LABEL', arg1: null, arg2: null, result: target, location },
      { op: 'JUMP', arg1: null, arg2: null, result: target, location }
    ];
    code.executionMap = [{ location }, { location }];
    const controller = new AbortController();
    const pending = executeIntermediate(code, [], { signal: controller.signal });
    await yieldTurn();
    controller.abort();
    const result = await pending;
    assert.equal(result.status, 'stopped');
    assert.equal(result.diagnostics[0].code, 'EXECUTION_STOPPED');
    assert.equal(result.steps, 0);
    assert.ok(result.instructions >= 128);
  });
});
