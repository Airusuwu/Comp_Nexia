import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { createApp } from '../src/api/app.js';

let server;
let baseUrl;

before(async () => {
  server = createApp();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server?.listening) await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

async function execute(code) {
  const response = await fetch(`${baseUrl}/api/execute`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code })
  });
  return { httpStatus: response.status, body: await response.json() };
}

describe('ciclo Para por el endpoint de ejecución', () => {
  it('recorre el rango inclusivo y avanza de uno en uno', async () => {
    const { httpStatus, body } = await execute(`Inicio
Para i <- 1 Hasta Hacer 3
    Escribir i
FinPara
Fin`);

    assert.equal(httpStatus, 200);
    assert.equal(body.status, 'completed');
    assert.deepEqual(body.results, ['1', '2', '3']);
    assert.deepEqual(body.analysis, { lexical: 'completed', syntactic: 'completed', semantic: 'completed', intermediate: 'completed' });
  });

  it('no ejecuta el cuerpo si inicio supera el límite', async () => {
    const { httpStatus, body } = await execute(`Inicio
Para i <- 4 Hasta Hacer 2
    Escribir i
FinPara
Fin`);

    assert.equal(httpStatus, 200);
    assert.equal(body.status, 'completed');
    assert.deepEqual(body.results, []);
  });

  it('mantiene local el contador y permite un homónimo externo', async () => {
    const { httpStatus, body } = await execute(`Inicio
Definir i Como ENTERO
i <- 9
Para i <- 1 Hasta Hacer 2
    Escribir i
FinPara
Escribir i
Fin`);

    assert.equal(httpStatus, 200);
    assert.equal(body.status, 'completed');
    assert.deepEqual(body.results, ['1', '2', '9']);
  });

  it('conserva el paso fijo aunque el cuerpo asigne otro valor al contador', async () => {
    const { httpStatus, body } = await execute(`Inicio
Para i <- 1 Hasta Hacer 3
    Escribir i
    i <- 100
FinPara
Fin`);

    assert.equal(httpStatus, 200);
    assert.equal(body.status, 'completed');
    assert.deepEqual(body.results, ['1', '2', '3']);
  });

  it('rechaza límites REAL durante el análisis semántico y no ejecuta', async () => {
    const { httpStatus, body } = await execute(`Inicio
Para i <- 1.5 Hasta Hacer 3
    Escribir i
FinPara
Fin`);

    assert.equal(httpStatus, 422);
    assert.equal(body.status, 'semantic_error');
    assert.equal(body.executed, false);
    assert.equal(body.diagnostics[0].code, 'FOR_INTEGER_REQUIRED');
    assert.deepEqual(body.results, []);
  });

  it('rechaza el orden anterior Hasta límite Hacer', async () => {
    const { httpStatus, body } = await execute(`Inicio
Para i <- 1 Hasta 3 Hacer
    Escribir i
FinPara
Fin`);

    assert.equal(httpStatus, 422);
    assert.equal(body.status, 'syntactic_error');
    assert.equal(body.executed, false);
  });
});

describe('ciclo Repetir por el endpoint de ejecución', () => {
  it('ejecuta el cuerpo al menos una vez y se detiene con condición verdadera', async () => {
    const { httpStatus, body } = await execute(`Inicio
Definir listo Como BOOLEANO
listo <- VERDADERO
Repetir
    Escribir "una vez"
Hasta Que listo
Fin`);

    assert.equal(httpStatus, 200);
    assert.equal(body.status, 'completed');
    assert.deepEqual(body.results, ['una vez']);
  });

  it('repite hasta que la condición se vuelve verdadera', async () => {
    const { httpStatus, body } = await execute(`Inicio
Definir vueltas Como ENTERO
vueltas <- 0
Repetir
    vueltas <- vueltas + 1
    Escribir vueltas
Hasta Que vueltas >= 3
Escribir "fin"
Fin`);

    assert.equal(httpStatus, 200);
    assert.equal(body.status, 'completed');
    assert.deepEqual(body.results, ['1', '2', '3', 'fin']);
  });

  it('permite inicializar en el cuerpo una variable externa usada en la condición', async () => {
    const { httpStatus, body } = await execute(`Inicio
Definir valor Como ENTERO
Repetir
    valor <- 7
Hasta Que valor > 0
Escribir valor
Fin`);

    assert.equal(httpStatus, 200);
    assert.equal(body.status, 'completed');
    assert.deepEqual(body.results, ['7']);
  });

  it('exige que la condición sea BOOLEANO', async () => {
    const { httpStatus, body } = await execute(`Inicio
Repetir
    Escribir "vuelta"
Hasta Que 1
Fin`);

    assert.equal(httpStatus, 422);
    assert.equal(body.status, 'semantic_error');
    assert.equal(body.executed, false);
    assert.equal(body.diagnostics[0].code, 'NON_BOOLEAN_CONDITION');
    assert.deepEqual(body.results, []);
  });

  it('no expone variables locales del cuerpo a la condición final', async () => {
    const { httpStatus, body } = await execute(`Inicio
Repetir
    Definir local Como ENTERO
    local <- 1
Hasta Que local > 0
Fin`);

    assert.equal(httpStatus, 422);
    assert.equal(body.status, 'semantic_error');
    assert.equal(body.diagnostics[0].code, 'UNDECLARED_VARIABLE');
  });
});
