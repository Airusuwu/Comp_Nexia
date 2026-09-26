# Análisis semántico — punto 9

## Decisiones aprobadas por Uriel

- Las variables declaradas en Si, Sino o Mientras son locales a ese bloque.
  Se permite acceder a variables externas. No se permite redeclarar un nombre
  en el mismo ámbito; un bloque hijo puede ocultar el nombre externo.
- Los identificadores no distinguen mayúsculas: edad, Edad y EDAD designan
  la misma variable. Se usa toUpperCase, como las palabras reservadas, sin
  normalizar Unicode; se conserva la escritura original para los mensajes.

## Módulos y comprobaciones

`backend/src/symbols/table.js` administra ámbitos mediante Map, declaraciones,
resolución de nombres, copias independientes y unión de estados.
`backend/src/semantic/analyze.js` expone `analyzeSemantics(ast)` y recorre
el AST del parser sin modificarlo. No depende de HTTP, DOM ni eval.

Se reutilizan las reglas del punto 6 para operaciones binarias/unarias,
asignaciones, condiciones, agrupación, salida, inicialización y divisores.
Una asignación valida el destino declarado y el tipo antes de inicializarlo;
su tipo nunca cambia. ENTERO puede asignarse a REAL, no a la inversa.
Leer exige una declaración e inicializa solo bajo el supuesto de que una
futura entrada válida finalice correctamente. No solicita datos actualmente.

La inicialización es conservadora y sigue el orden de las instrucciones:

- Si/Sino se analizan con copias independientes. Una variable externa queda
  inicializada al salir solo si lo está en ambos caminos. Sin Sino, el segundo
  camino es el estado anterior. Las declaraciones locales no salen del bloque.
- Mientras puede ejecutarse cero veces: su cuerpo no establece inicialización
  garantizada después del ciclo. La condición se comprueba antes del cuerpo.
- Se revisan ambos caminos incluso con condiciones literales. No se hace
  eliminación de código inalcanzable ni se supone cortocircuito para Y/O.

## Cero y controles en ejecución

Se detectan divisores cero literales (también -0 y 0.0), agrupados, propagados
desde asignaciones y calculados mediante operaciones exactas acotadas.
Para no imponer precisión del motor, solo se propagan valores enteros exactos
representables de forma segura, incluidos REAL escritos con fracción .0.
La aritmética auxiliar usa BigInt y descarta resultados fuera de ese rango;
la división solo se propaga si es exacta y el módulo solo con operandos no
negativos y divisor positivo. Esto no limita los literales válidos del lenguaje.

No se calculan constantes fraccionarias generales ni valores fuera del rango
seguro; por ejemplo, 0.1 - 0.1 queda desconocido en esta implementación.
Ampliar esa evaluación estática requiere acordar precisión y semántica numérica.
Si el valor no se conoce, se registra CHECK_DIVISOR para ejecución, nunca se
afirma que sea distinto de cero. En ramas solo se conserva una constante si
coincide en ambos caminos. Antes y después de analizar un ciclo se descartan
las constantes externas para no reutilizar valores de una sola iteración.

Cada Leer registra CHECK_INPUT_TYPE con el tipo esperado. El futuro motor
deberá convertir la entrada explícitamente, usar readResultType y rechazar
datos incompatibles antes de almacenarlos. También deberá comprobar todos
los divisores en ejecución. runtimeChecks es un inventario estático con
ubicaciones, no una cola de instrucciones ni un reemplazo del recorrido del AST.

## Respuesta y errores

El módulo devuelve `{diagnostics, symbols, runtimeChecks}`. symbols resume
variables del ámbito del programa: nombre original, tipo, ubicación de la
declaración e inicialización garantizada al final; no contiene valores runtime
ni variables locales que ya salieron de ámbito.

Ante el primer TypeRuleError devuelve un diagnóstico de etapa semantic con
ubicación UTF-16 del nodo responsable. symbols y runtimeChecks quedan vacíos,
evitando presentar estados parciales como definitivos. No acumula errores.

POST /api/analyze solo ejecuta semántica si hay AST válido:

- HTTP 200, status analyzed, las tres fases completed si no hay errores.
- HTTP 422, semantic_error y fase semantic error si falla.
- Error léxico/sintáctico: semantic skipped; se mantienen sus diagnósticos.
- Siempre executed false y results vacío. El AST sintáctico se conserva aun
  si falla semántica; eso no significa que sea ejecutable.
- health: analysis, lexical, syntactic y semantic true; execution false.

La terminal existente muestra mensajes reales y líneas de error. No se
añadieron controles ni se cambió el diseño. Un análisis exitoso indica el
número de controles pendientes, no salidas de Escribir ni ejecución terminada.

## Validación y siguiente etapa

498 aserciones satisfactorias mediante script temporal eliminado: matriz de
325 operadores/tipos, 25 asignaciones, ámbitos, mayúsculas, ocultamiento,
inicialización entre ramas y ciclos, posiciones, constantes, cero y HTTP.
La matriz verifica la integración con el módulo de tipos, no una segunda
fuente independiente de las reglas. Los casos de control y errores tienen
expectativas explícitas. Check incluye los dos módulos nuevos.

Sin nuevas dependencias, suite persistente, pruebas móviles ni auditoría nueva
de navegador/lector de pantalla. El comando largo fue bloqueado por Windows;
se ejecutaron las mismas pruebas desde un archivo temporal local.

Siguiente: punto 10, verificación integral y registro de pendientes. Todavía
no hay motor de ejecución, entrada interactiva, salidas ni detención real.
Los controles Guardar/Aumentar texto continúan pendientes según el contexto.
