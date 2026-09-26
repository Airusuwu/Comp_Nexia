# Cómo funciona el backend de Nexia

Esta guía está dirigida al equipo que necesita entender y explicar el código.
Los comentarios dentro de `src/` destacan responsabilidades y decisiones importantes.

## 1. Idea general

El backend es un servidor local escrito en JavaScript con módulos ES y Node.js.
No utiliza Express, base de datos ni paquetes externos. Sirve el frontend y
procesa el pseudocódigo que recibe del editor.

Aunque el proyecto se denomina compilador educativo, esta versión ejecuta mediante
un **intérprete del AST**: no genera un ejecutable ni convierte el programa a
JavaScript. No utiliza `eval` ni `Function` para ejecutar el texto del usuario.

```text
Editor del frontend
    -> POST /api/analyze o POST /api/execute
    -> Validación de la solicitud
    -> Lexer: texto a tokens
    -> Parser: tokens a AST
    -> Semántica: comprobación de tipos y variables
    -> Motor: ejecución del AST (solo /api/execute)
    -> Respuesta JSON con resultados, estado y diagnósticos
    -> Terminal del frontend
```

Una fase con errores impide continuar con las fases dependientes. Por ejemplo,
un error semántico evita ejecutar incluso las instrucciones válidas anteriores.

## 2. Mapa de archivos

Todas las rutas siguientes son relativas a `backend/`.

| Archivo | Responsabilidad |
| --- | --- |
| `package.json` | Declara módulos ES, versión de Node y comandos de arranque/comprobación. |
| `src/server.js` | Crea la aplicación y escucha en `127.0.0.1:3000`. Informa errores de arranque. |
| `src/api/app.js` | Enruta las solicitudes, valida método/host/origen, responde JSON y conecta la cancelación. |
| `src/api/analyze.js` | Lee y valida el cuerpo HTTP; coordina lexer, parser, semántica y ejecución. |
| `src/api/static.js` | Entrega únicamente los archivos del frontend incluidos en una lista permitida. |
| `src/lexer/tokenize.js` | Reconoce palabras, literales, operadores, delimitadores y posiciones. |
| `src/parser/parse.js` | Reconoce la gramática y construye el árbol de sintaxis abstracta. |
| `src/semantic/analyze.js` | Recorre el árbol para verificar tipos, declaraciones e inicialización. |
| `src/symbols/table.js` | Administra variables por ámbitos y combina estados del análisis. |
| `src/types/compatibility.js` | Define los cinco tipos y las combinaciones válidas de operadores/asignaciones. |
| `src/types/guards.js` | Comprueba declaración, redeclaración, inicialización y divisores. |
| `src/types/literals.js` | Valida el formato escrito de un literal, sin calcular operaciones. |
| `src/runtime/values.js` | Convierte entradas y literales en valores tipados, calcula operaciones y formatea salidas. |
| `src/runtime/execute.js` | Ejecuta instrucciones y bloques; controla entradas, salidas y límites. |
| `src/diagnostics/response.js` | Construye respuestas uniformes para errores de solicitud. |
| `tests/README.md` | Describe el estado de las pruebas; no es una suite automatizada. |

## 3. Comunicación y validaciones HTTP

- `GET /api/health`: confirma que el servicio está disponible y enumera capacidades.
- `POST /api/analyze`: analiza sin ejecutar.
- `POST /api/execute`: analiza y, si no hay errores, ejecuta.

Los POST reciben JSON con `code` como texto. Para ejecutar se puede incluir
`inputs`, una lista de textos introducidos mediante `Leer`.

```json
{
  "code": "Inicio\nEscribir 3 + 4\nFin",
  "inputs": []
}
```

`readBody` recibe fragmentos del cuerpo y limita su tamaño a 512 KiB. El código
puede ocupar hasta 64 KiB UTF-8. `TextDecoder` rechaza UTF-8 incorrecto; después
`JSON.parse` verifica el JSON. También se rechazan código vacío y entradas inválidas.

`RequestError` contiene el estado HTTP, un código y un mensaje público. Los
errores inesperados se responden como 500 sin exponer detalles internos.
Los errores del lenguaje se devuelven con HTTP 422. Una espera de entrada no es
un fallo: responde 200 con `waiting_input`.

El servidor está pensado para uso local, no como servicio público. `static.js`
no publica el repositorio completo: archivos del backend, documentos y `.git`
quedan fuera de su lista de rutas.

## 4. Análisis léxico: reconocer las piezas

`tokenize(source)` devuelve `{ tokens, diagnostics, truncated }`.

Para `c <- a + 2`, reconoce un identificador, asignación, identificador, suma y
literal entero. Cada token guarda:

- `category`: clase de token, como `IDENTIFIER` o `INTEGER_LITERAL`.
- `lexeme`: texto original, útil para mostrar lo que escribió el usuario.
- `canonical`: forma normalizada cuando corresponde.
- `offset`, `line`, `column` y posiciones finales: ubicación en el código.

Líneas y columnas comienzan en 1; offsets en 0. Las posiciones utilizan unidades
UTF-16 y el extremo final es exclusivo. Se reconocen saltos de línea, se omiten
comentarios `//` y se añade `EOF` al terminar normalmente.

El lexer prueba operadores de dos caracteres antes que los de uno. Así `<-`
no se interpreta como `<` seguido de `-`. No decide si sumar texto y número es válido:
esa responsabilidad pertenece al análisis semántico.

## 5. Análisis sintáctico: construir el AST

`parse(tokens)` devuelve `{ ast, diagnostics, truncated }`. El AST es un árbol
que representa la estructura del programa, no su resultado.

Por ejemplo, `c <- a + 2` produce conceptualmente:

```text
Assignment
  target: Identifier(c)
  value: BinaryExpression(+)
    left: Identifier(a)
    right: Literal(ENTERO, 2)
```

`statement` reconoce declaraciones, asignaciones, Leer, Escribir, Si y Mientras.
`expression` aplica precedencias y paréntesis. `block` lee instrucciones hasta
el cierre correspondiente. `node` añade ubicación y controla profundidad.

El parser informa el primer error y devuelve `ast: null`; no entrega un árbol
parcial como válido. Los límites de anidamiento protegen la pila de JavaScript.

## 6. Semántica y tabla de símbolos

`analyzeSemantics(ast)` comprueba que un programa bien escrito tenga sentido:
variables declaradas e inicializadas, operaciones compatibles y condiciones booleanas.
Devuelve `diagnostics`, `symbols` y `runtimeChecks`.

`SymbolTable` usa una pila de mapas llamada `frames`. El primer mapa es global;
cada bloque añade un ámbito temporal. `declare` registra una variable; `resolve`
busca desde el ámbito más cercano. Los nombres se comparan en mayúsculas.

Durante el análisis cada símbolo registra tipo, ubicación, inicialización y,
cuando se conoce con seguridad, una constante numérica. Durante la ejecución
también contiene su valor real en `value`. Son tablas distintas: cada fase crea la suya.

Para `Si/Sino`, se clona el estado y se analizan ambos caminos. `merge` considera
una variable inicializada después del condicional solo si ambos caminos la inicializan.
Un `Mientras` podría no ejecutarse: inicializar dentro no garantiza un valor después.

La propagación de constantes es conservadora; no pretende ejecutar el programa.
Si el divisor se desconoce, se registra un `CHECK_DIVISOR`. `Leer` registra un
`CHECK_INPUT_TYPE`. Estos registros explican comprobaciones pendientes; el motor
aplica sus propias validaciones sobre los valores reales.

## 7. Reglas de tipos y valores

Los tipos son `ENTERO`, `REAL`, `TEXTO`, `CARACTER` y `BOOLEANO`.
`binaryResultType` y `unaryResultType` reciben tipos y devuelven el tipo resultante,
o lanzan `TypeRuleError`. No reciben los valores ni realizan la operación.

Ejemplos: `/` siempre produce REAL; `%` requiere enteros; `Y`, `O` y `NO` requieren
booleanos; la asignación permite ENTERO hacia REAL, pero no a la inversa.
La concatenación con `+` solo admite dos textos.

`runtime/values.js` trabaja con objetos `{ type, value }`:

- `literalValue`: convierte el literal del AST en un valor utilizable.
- `inputValue`: valida el texto recibido por Leer antes de convertirlo.
- `binaryValue` y `unaryValue`: consultan las reglas y calculan el resultado.
- `valueOf`: comprueba límites numéricos y de texto.
- `formatValue`: prepara la salida; por ejemplo, convierte booleanos a VERDADERO/FALSO.

Las operaciones enteras utilizan BigInt como cálculo intermedio, pero el rango
aceptado sigue siendo el de enteros seguros de Number. REAL utiliza aproximación
binaria: no debe prometerse precisión decimal exacta.

## 8. Ejecución y entrada de datos

`execute(ast, inputs, { signal })` recorre el árbol con funciones asíncronas.
`expression` obtiene valores; `statements` ejecuta instrucciones; `block` abre y
cierra ámbitos. `Escribir` añade una línea a `results`, uniendo sus argumentos
sin espacios automáticos.

Cuando `Leer` necesita un dato que aún no está en `inputs`, `NeedInput` interrumpe
el recorrido y se convierte en una respuesta `waiting_input`. No queda un proceso
esperando ni una sesión persistida en el backend.

Ejemplo de dos lecturas:

1. El frontend envía `inputs: []`; el motor solicita el primer dato.
2. El frontend envía `inputs: ["3"]`; el motor vuelve a empezar y solicita el segundo.
3. El frontend envía `inputs: ["3", "4"]`; el motor vuelve a empezar y termina.

El frontend reemplaza las salidas completas para no duplicarlas. Este modelo es
adecuado para el lenguaje actual, sin efectos externos ni aleatoriedad; habría
que revisarlo antes de incorporar archivos, reloj u otros efectos.

`tick` cuenta pasos, comprueba cancelación y limita la ejecución a 50000 pasos o
2 segundos por solicitud. Cada 128 pasos cede el turno al bucle de eventos de Node.
Hay además límites de 100 entradas, 1000 líneas y 65536 unidades UTF-16 de salida.
Los operadores Y/O evalúan ambos operandos: no hay cortocircuito.

## 9. Estados y diagnósticos

| Estado | Significado |
| --- | --- |
| `analyzed` | Análisis completado, sin ejecución. |
| `lexical_error`, `syntactic_error`, `semantic_error` | Error previo a ejecutar. |
| `waiting_input` | El motor comenzó y necesita una entrada. |
| `completed` | Ejecución finalizada correctamente. |
| `runtime_error` | Fallo al ejecutar; se conservan salidas anteriores. |
| `stopped` | El motor detectó cancelación; puede que la conexión ya esté cerrada. |
| `invalid_request`, `error` | Solicitud incorrecta o fallo interno del servicio. |

**`executed: true` no significa éxito**: indica que comenzó la ejecución. Debe
consultarse `status` para saber cómo terminó o si necesita datos.

Un diagnóstico contiene `code`, `message`, `severity`, `stage` y ubicación cuando
corresponde. Los errores de solicitud llevan línea y columna `null`, porque no
representan una instrucción incorrecta. No todos los tipos de respuesta incluyen
tokens, AST y símbolos: la respuesta mínima de solicitud solo incluye el diagnóstico.

## 10. Cómo explicar y mantener el proyecto

Para una exposición, seguir este orden: servidor y rutas, lexer, parser, semántica,
tabla de símbolos, reglas y finalmente motor/Leer. Usar una suma como ejemplo y
después mostrar una variable sin inicializar para distinguir análisis de ejecución.

Desde la raíz del repositorio:

```powershell
npm.cmd --prefix backend start
npm.cmd --prefix backend run check
```

El primer comando inicia el servidor; el segundo comprueba sintaxis, no sustituye
pruebas funcionales. Actualmente no existe una suite persistente. Las verificaciones
anteriores y límites están en [verification.md](../docs/pruebas/verification.md) y
[runtime.md](../docs/tecnica/runtime.md). Algunas secciones históricas describen etapas
anteriores; para el contrato actual consultar también [README.md](README.md).

Si se agrega una instrucción, revisar lexer, parser, semántica y motor. Si cambia
una regla de tipos, centralizarla en `types/` y comprobar análisis y ejecución.
La interfaz y sus eventos pertenecen a `frontend/`, no a este backend.
