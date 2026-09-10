# Motor básico de ejecución

Estado: implementado el 2026-09-10 por solicitud de Uriel. El motor interpreta
el AST existente; no genera código JavaScript, no usa eval/Function y no añade
gramática para Para, Repetir o funciones.

## Funcionamiento

Ejecutar o Ctrl+Enter envía el código a POST /api/execute. Primero se realizan
los tres análisis. Un error léxico, sintáctico o semántico impide ejecutar
cualquier instrucción. POST /api/analyze conserva su uso de solo análisis.

`src/runtime/execute.js` recorre el AST con una tabla de símbolos nueva por
solicitud. Ejecuta declaraciones múltiples, asignaciones, Leer, Escribir,
Si/Sino y Mientras. Cada entrada a un bloque crea su ámbito; al salir se
descarta. Se conservan las reglas aprobadas de mayúsculas y tipos fijos.

`src/runtime/values.js` representa cada valor con tipo y contenido separados.
Usa las funciones de compatibilidad, entrada y divisor del punto 6, sin
conversiones implícitas entre TEXTO y números. Soporta +, -, *, /, %, orden,
igualdad, Y/O/NO, unarios y paréntesis. Y/O evalúan ambos operandos, coherente
con el análisis conservador; no se implementa cortocircuito.

Cada Escribir produce una línea. Sus argumentos se unen sin separador
automático: `Escribir "Edad: ", edad`. TEXTO/CARACTER salen sin comillas y
BOOLEANO como VERDADERO/FALSO. La terminal recibe texto, nunca HTML ejecutable.
Las salidas anteriores a un error runtime se conservan y no se muestra una
finalización exitosa cuando la ejecución falla.

## Leer sin rediseñar la interfaz

Leer solicita el dato mediante el diálogo nativo del navegador. No se añadió
un panel ni botones nuevos. Reglas de entrada del motor básico:

- ENTERO: dígitos con signo opcional; no admite 2.5 ni 2.0.
- REAL: entero o decimal con punto y dígitos a ambos lados.
- BOOLEANO: VERDADERO/FALSO sin distinguir mayúsculas.
- TEXTO: contenido literal sin comillas; conserva espacios y acepta vacío.
- CARACTER: un punto de código Unicode sin comillas.
- En números/booleanos se recortan espacios exteriores. La entrada inválida
  detiene la ejecución con diagnóstico; corregir y ejecutar de nuevo.

Mecanismo sencillo sin sesiones persistentes: cuando faltan datos se responde
waiting_input con índice, nombre, tipo y ubicación. El frontend reúne inputs
y reenvía el mismo código con las entradas recibidas. El motor repite desde el
inicio de forma determinista hasta la siguiente lectura o el final. La terminal
reemplaza las salidas completas, sin duplicarlas. Esto solo es apropiado mientras
el lenguaje no tenga efectos externos, aleatoriedad o acceso al reloj.
No hay procesos esperando mientras el usuario escribe en el diálogo.

Cancelar/Escape detiene esta secuencia. El botón Detener aborta la solicitud
activa; el servidor observa la desconexión y cancela cooperativamente el motor.
Editar el código también aborta y descarta respuestas obsoletas. Mientras esté
abierto el diálogo modal se utiliza Cancelar, no el botón de la página.

## Límites técnicos explícitos

Son límites de esta implementación, no nuevas reglas atribuidas al PDF:

- ENTERO: intervalo seguro de JavaScript, de -9007199254740991 a
  9007199254740991. Operaciones enteras usan BigInt internamente para detectar
  resultados fuera del intervalo sin pérdida silenciosa de precisión.
- REAL: precisión binaria de Number, aproximada (por ejemplo 8/3 se muestra
  2.6666666666666665). Rechaza valores no finitos; no promete decimales exactos.
  Se rechazan literales no nulos que se convertirían en cero por subdesbordamiento.
  La aritmética REAL conserva las aproximaciones de esa representación.
- % usa residuo con signo del dividendo. La precisión decimal definitiva y
  otras convenciones numéricas se pueden revisar en una ampliación posterior.
- Máximo 50000 pasos de nodos/declaraciones o 2 segundos por solicitud.
  El motor cede el control cada 128 pasos para atender cancelaciones y HTTP.
- Máximo 100 lecturas; 1000 líneas y 65536 unidades UTF-16 de salida total;
  65536 unidades por texto. La salida se limita antes de unir textos grandes.
- Se conservan 64 KiB de código y 512 KiB por solicitud JSON. En el replay de
  Leer los límites de tiempo/pasos se aplican a cada solicitud desde el inicio.
- El frontend limita a ocho segundos cada petición; no cuenta el tiempo de
  espera del diálogo de entrada.

## Contrato HTTP

```json
{"code":"Inicio\nEscribir 5 + 3\nFin","inputs":[]}
```

POST /api/execute devuelve los metadatos de análisis y, si se ejecutó:

- completed, HTTP 200: results con salidas reales y steps.
- waiting_input, HTTP 200: results parciales e input con index/name/type/location.
- runtime_error, HTTP 422: diagnóstico ubicado y salidas parciales.
- stopped: motor cancelado; la respuesta puede no enviarse si el cliente cerró.

executed true significa que comenzó la fase de ejecución, no necesariamente
que terminó: debe comprobarse status. Errores de análisis mantienen executed
false y results vacío. Los inputs deben ser hasta 100 strings; valores ajenos
a ese contrato devuelven 400. Se mantienen protecciones de origen/host y rutas.
No se guarda código, entradas ni resultados. health declara execution true.

## Prueba rápida

```text
Inicio
Definir a, b Como ENTERO
a <- 8
b <- 3
Escribir "Suma: ", a + b
Escribir "Resta: ", a - b
Escribir "Producto: ", a * b
Escribir "División: ", a / b
Fin
```

Resultados: 11, 5, 24 y 2.6666666666666665, con las etiquetas escritas.
Para entrada: `Definir dato Como REAL`, `Leer dato`, `Escribir dato * 2`
entre Inicio/Fin. Introducir 4.5 produce 9.

## Validación y pendientes

93 aserciones satisfactorias del motor/API: operaciones, tipos, ámbitos,
ciclos, entradas, cero proveniente de Leer, salidas parciales, límites de
números/salida/pasos, cancelación con AbortSignal y separación analyze/execute.
Se ejecutó check y se eliminó el script temporal; no hay suite persistente.
Una prueba adicional usó inicialmente TEXTO como nombre de variable (reservado);
se corrigió el caso a mensaje y la pasada completa terminó satisfactoriamente.

En Edge PC se verificaron las cuatro operaciones del ejemplo, Leer REAL 4.5
con salida 9 y Cancelar/Escape sin pérdida del código. No se realizó auditoría
con lector de pantalla, pruebas móviles ni prueba cronometrada del botón
Detener desde el navegador (sí se comprobó la cancelación del motor).

Guardar/Aumentar texto, inserción de estructuras y voz siguen sin implementar.
La muestra antigua del editor conserva ← y Escribir y: no es un programa válido
de prueba; reemplazarla por el ejemplo. No se altera código del usuario.
