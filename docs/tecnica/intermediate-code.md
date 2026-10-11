# Generación de código intermedio

Implementada el 2026-10-10. La cuarta fase convierte un AST semánticamente válido
en cuádruplos. La representación se consulta mediante la API; el motor actual
continúa ejecutando el AST. Generar instrucciones no solicita entradas ni produce
salidas de `Escribir`.

```text
Código → Lexer → Parser (AST) → Semántica → Generación (cuádruplos)
                                               ↓
                                     Ejecución del AST
```

## Módulo y contrato

`backend/src/intermediate/generate.js` expone `generateIntermediate(ast)`.
No depende de HTTP ni del DOM. Su entrada debe haber superado el análisis
semántico. No modifica el AST ni convierte los literales numéricos a `Number`.
Cada llamada comienza con identificadores nuevos y genera el mismo resultado
para el mismo AST, sin estado compartido entre solicitudes.

La representación JSON contiene:

| Campo | Contenido |
| --- | --- |
| `version` | `1`, versión del contrato. |
| `format` | `quadruples`. |
| `quadruples` | Lista ordenada de instrucciones. Un programa vacío produce `[]`. |
| `variables` | Metadatos `{id, name, type, scope, location}` de las variables, incluidas las locales. |
| `temporaries` | Metadatos `{id, type, scope, location}` de los temporales. |
| `scopes` | Ámbitos estáticos `{id, parent, location}`; `s1` es global y tiene `parent: null`. |

Cada cuádruplo contiene exactamente `op`, `arg1`, `arg2`, `result` y `location`.
Los operandos no usados son `null`. Las ubicaciones conservan los seis campos
del AST: `offset`, `line`, `column`, `endOffset`, `endLine`, `endColumn`. Líneas y
columnas comienzan en 1; offsets y columnas siguen la convención UTF-16 del parser.

Los operandos distinguen explícitamente sus clases:

```json
{"kind":"variable","id":"v1"}
{"kind":"temporary","id":"t1"}
{"kind":"label","id":"L1"}
{"kind":"literal","type":"ENTERO","raw":"3"}
{"kind":"literal","type":"BOOLEANO","raw":"verdadero","canonical":"VERDADERO"}
```

Los identificadores internos se asignan en orden de generación: `v1`, `t1`,
`L1`, `s1`, etc. Las etiquetas se definen mediante `LABEL`; pueden referenciarse
antes de su definición. Su número indica orden de creación, no posición en la lista.
Los tipos se obtienen de las reglas compartidas de `types/compatibility.js`.
`raw` conserva comillas, decimales y mayúsculas tal como se escribieron; los
booleanos también guardan `canonical` para conocer su significado.

## Operaciones

| `op` | `arg1` | `arg2` | `result` | Significado |
| --- | --- | --- | --- | --- |
| `DECLARE` | null | null | variable | Declara/reinicia una variable sin valor al visitar la instrucción. |
| `ASSIGN` | valor | null | variable o temporal | Copia el valor; la asignación a variables respeta el tipo destino y la promoción ENTERO a REAL. |
| `+`, `-`, `*`, `/`, `%` | valor izquierdo | valor derecho | temporal | Operación aritmética o concatenación válida según tipos. |
| `<`, `>`, `<=`, `>=`, `==`, `!=`, `Y`, `O` | valor izquierdo | valor derecho | temporal BOOLEANO | Comparación u operación lógica. |
| `POS`, `NEG`, `NO` | valor | null | temporal | Operador unario `+`, `-` o `NO`. |
| `READ` | null | null | variable | Representa `Leer`, con tipo destino disponible en los metadatos. |
| `WRITE_BEGIN` | null | null | null | Inicia el grupo de argumentos de una línea de `Escribir`. |
| `WRITE_ARG` | valor | null | null | Añade la representación del argumento al grupo, sin espacios automáticos. |
| `WRITE_END` | null | null | null | Termina el grupo como una sola línea de salida. |
| `LABEL` | null | null | etiqueta | Define un destino de salto. |
| `JUMP` | null | null | etiqueta | Salto incondicional. |
| `JUMP_IF_FALSE`, `JUMP_IF_TRUE` | condición | null | etiqueta | Salta cuando la condición es falsa o verdadera. |

Los temporales pueden recibir valores en cada vuelta de un ciclo; esta
representación no impone asignación única. Los paréntesis determinan el recorrido
del AST y no necesitan una instrucción propia. No se evalúan ni simplifican
operaciones durante la generación.

## Reglas de traducción

- Las expresiones se recorren de izquierda a derecha, respetando precedencia y
  asociatividad del AST. `Y/O` generan ambos operandos, sin cortocircuito.
- Cada declaración tiene un ID único. La resolución de nombres conserva la
  indiferencia a mayúsculas y permite ocultar variables externas en bloques hijos.
  Las declaraciones dentro de un ciclo quedan dentro del recorrido de su cuerpo,
  por lo que representan una variable local nueva en cada vuelta.
- `Si/Sino` se traduce con salto condicional y etiquetas de alternativa/final.
  `Mientras` coloca la condición antes del cuerpo y vuelve a evaluarla al regresar.
- `Repetir` coloca el cuerpo antes de la condición y vuelve al inicio cuando es
  falsa. La condición se resuelve fuera del ámbito local del cuerpo.
- `Para i <- inicio Hasta Hacer límite` captura inicio y límite en temporales
  antes de crear el contador local, incluso si oculta un nombre externo. Un
  temporal privado mantiene el avance, separado del contador visible. El rango
  usa `<=` y puede ejecutar cero vueltas. Después del cuerpo se comprueba `>=`
  antes de sumar uno, evitando un incremento innecesario al alcanzar el entero
  máximo. Modificar `i` en el cuerpo no altera la progresión del rango.
- `WRITE_BEGIN/ARG/END` representan una salida agrupada: los argumentos no son
  líneas separadas. Un futuro ejecutor deberá validar y completar el grupo antes
  de publicarlo, como hace actualmente el motor con `Escribir`.

Ejemplo: para `a <- 2 + 3 * 4`, suponiendo que `a` ya se declaró como `v1`:

| Operación | Argumento 1 | Argumento 2 | Resultado |
| --- | --- | --- | --- |
| `*` | literal ENTERO `3` | literal ENTERO `4` | `t1` |
| `+` | literal ENTERO `2` | `t1` | `t2` |
| `ASSIGN` | `t2` | null | `v1` |

El primer cuádruplo, con ubicación de ejemplo, tiene esta forma real:

```json
{
  "op": "*",
  "arg1": {"kind":"literal","type":"ENTERO","raw":"3"},
  "arg2": {"kind":"literal","type":"ENTERO","raw":"4"},
  "result": {"kind":"temporary","id":"t1"},
  "location": {"offset":37,"line":3,"column":10,"endOffset":42,"endLine":3,"endColumn":15}
}
```

Los nombres, tipos y posiciones de las variables están en `variables`; las
instrucciones usan sus IDs para evitar ambigüedades.

## API y fallos

`POST /api/analyze` y `POST /api/execute` añaden `intermediateCode` y
`analysis.intermediate`. Tras una semántica correcta, la fase es `completed` y
la representación está completa. Si falla lexer, parser o semántica, la fase
es `skipped` y `intermediateCode` es `null`.

Se conservan los estados existentes (`analyzed`, `completed`, `waiting_input`,
etc.) y los códigos HTTP. El análisis permanece con `executed: false` y
`results: []`. La ejecución conserva el código intermedio incluso si espera
una entrada o encuentra un error runtime. El replay de `Leer` genera la misma
representación, independientemente de las entradas.

Los errores de solicitud e internos mantienen la respuesta mínima existente,
añadiendo `intermediateCode: null`; no incluyen el objeto `analysis`. Un fallo
inesperado del generador se propaga al manejador HTTP, que responde 500 y
`status: error`, sin publicar datos parciales ni ejecutar el AST.
`GET /api/health` añade `capabilities.intermediate: true`.

Desde PowerShell, con el servidor iniciado:

```powershell
$payload = @{ code = "Inicio`nDefinir a Como ENTERO`na <- 2 + 3 * 4`nEscribir a`nFin" } | ConvertTo-Json
$analysis = Invoke-RestMethod http://127.0.0.1:3000/api/analyze -Method Post -ContentType 'application/json' -Body $payload
$analysis.intermediateCode | ConvertTo-Json -Depth 12
```

Los límites existentes de tamaño de código y profundidad del AST acotan la
generación, que recorre estructuras finitas. No se simulan vueltas de ciclos.
Los controles runtime siguen siendo responsabilidad del motor actual:
divisores, entradas, rango numérico, salida, tiempo, pasos y cancelación.
Por ejemplo, un literal entero fuera del rango seguro se conserva al generar;
el motor puede rechazarlo después al ejecutar.

## Verificación

`backend/tests/intermediate.test.mjs` incluye 25 casos de generador y API:
operaciones, tipos, ubicaciones, ámbitos, etiquetas, ciclos, grupos de salida,
lecturas, literales, determinismo y rechazo de nodos no soportados. Comprueba
generación omitida ante errores previos y la diferencia entre generar y ejecutar.
Un fallo simulado durante generación verifica la respuesta HTTP 500 sin datos
parciales ni inicio de ejecución.
Las 11 pruebas existentes de ciclos mantienen sus resultados.

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix backend run check
```

La suite automatizada tiene 36 casos. No verifica una máquina virtual de
cuádruplos ni una vista de código intermedio en navegador: esta etapa ofrece
la generación y consulta por API.
