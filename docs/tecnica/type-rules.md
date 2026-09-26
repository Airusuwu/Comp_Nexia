# Reglas de tipos — punto 6

Nota de continuidad: el alcance de API y los pendientes escritos aquí describen
el punto 6. Las reglas se integraron al AST en el punto 9 (semantic-analysis.md)
y se verificaron en el punto 10 (verification.md). La API ya no responde 501
para el análisis y sí existe tabla de símbolos; la ejecución sigue pendiente.

Fuente: `docs/referencias/A5 Reglas de tipos de datos.pdf`, documento del equipo fechado
05/09/2026, apartado «Reglas», páginas 3–7 y ejemplos de páginas 8–11.
El PDF permanece local e ignorado por Git. Se extrajo su texto con pdftotext;
las columnas de las tablas se desordenan en la extracción, por lo que se
contrastaron las reglas numeradas y sus ejemplos, no filas reconstruidas por
posición. No se realizó revisión visual: no había renderizador PDF disponible.

## Alcance real

El módulo no analiza programas ni calcula operaciones: recibe tipos ya
identificados y devuelve compatibilidad o errores en español. Es independiente
de HTTP, del DOM y de la futura representación del AST.
La API continúa devolviendo 501 para el análisis pendiente.

Tipos canónicos: ENTERO, REAL, TEXTO, CARACTER y BOOLEANO. La API interna exige
estas etiquetas exactas; no determina si el futuro lenguaje distinguirá
mayúsculas en palabras reservadas o identificadores.

## Correspondencia con el PDF

| Regla | Función / responsabilidad |
| --- | --- |
| 1. Aritmética | `binaryResultType`: +, -, * numéricos; ENTERO con ENTERO conserva ENTERO, participación de REAL produce REAL. / siempre REAL. |
| 2. Comparación | Orden solo numérico. Igualdad entre tipos iguales o ENTERO/REAL. Siempre BOOLEANO. |
| 3. Lógica | Y/O solo BOOLEANO; `unaryResultType` permite NO booleano. |
| 4. Asignación | `assignmentResultType(destino, origen)`: mismo tipo o ENTERO hacia REAL. Ninguna conversión inversa, incluso para un REAL sin fracción. |
| 5. Concatenación | + permite TEXTO con TEXTO; nunca conversión automática de otros tipos. |
| 6. Entrada/salida | `readResultType` valida el tipo ya identificado del dato; `outputTypes` acepta uno o varios valores de cualquier tipo. No realizan E/S. |
| 7. Declaración | `requireDeclared`, `requireNewDeclaration` comprueban el estado recibido del futuro gestor de símbolos. La asignación no modifica la declaración. |
| 8. Condiciones | `requireBooleanCondition` exige BOOLEANO en Si/Mientras. |
| 9. Módulo | % exclusivamente ENTERO con ENTERO; resultado ENTERO. |
| 10. Cero | `checkDivisor` rechaza cero conocido en / y %, con el mensaje del PDF. |
| 11. Inicialización | `requireInitialized` rechaza el estado falso e incluye el nombre de la variable. |
| 12. Literales | `literalType` reconoce los formatos básicos documentados; no tokeniza. |
| 13. Promoción | Aritmética mixta produce REAL; igualdad/orden mantienen BOOLEANO según la regla específica 2. |
| 14. Unarios | + y - numéricos conservan ENTERO/REAL. |
| 15. Paréntesis | `groupedResultType` conserva el tipo de una expresión ya validada; no procesa paréntesis. |

Las funciones de compatibilidad y `TypeRuleError` están en
`backend/src/types/compatibility.js`; las comprobaciones de estado/valor en
`guards.js`; la clasificación auxiliar de literales en `literals.js`.
Los errores incluyen `code` y `message`. El futuro llamador añadirá etapa,
línea y columna a partir del token o nodo, sin inventar ubicaciones.

## Comprobaciones estáticas y de ejecución

- Tipos de operaciones, asignaciones y condiciones se comprueban antes de
  ejecutar. No se usa la coerción de JavaScript para decidir compatibilidad.
- `checkDivisor(operador, tipo)` devuelve `requiresRuntimeCheck: true` si
  todavía no se conoce el valor, por ejemplo cuando procede de Leer.
  Con un valor conocido verifica cero, incluidos -0 y 0n. No ejecuta división
  ni módulo. Valores mal representados por el llamador producen TypeError,
  no una conversión automática de texto/booleanos a números.
- Un resultado desconocido no se considera seguro: el motor deberá repetir
  el control con el valor real justo antes de la operación.
- La tabla de símbolos todavía no existe. El punto 9 deberá resolver ámbitos,
  declaraciones y tipos fijos; calcular inicialización por caminos de control,
  y llamar a estas funciones antes de usar variables en expresiones o Escribir.
  No basta con encontrar una asignación en una rama o dentro de un ciclo.
- El formato de entrada de Leer y la conversión de su texto a valores tipados
  quedan para su integración. `readResultType` no acepta texto crudo como
  número ni decide que cualquier entrada es TEXTO.

## Literales y decisiones pendientes

Reconocidos: dígitos decimales, decimal con dígitos a ambos lados del punto,
signo opcional, comillas dobles para TEXTO, simples para CARACTER y
VERDADERO/FALSO. Ejemplos: `-8`, `5.0`, `"Hola"`, `'A'`.
No se recortan espacios ni se transforman lexemas. En el lexer, los signos
podrán ser tokens separados: esta función clasifica un literal completo,
no sustituye la tokenización o la precedencia del parser.

La implementación cuenta puntos de código Unicode para CARACTER, no unidades
UTF-16. Queda pendiente precisar si «un símbolo» debe admitir grafemas
compuestos (por ejemplo una letra y un acento combinante). No se normaliza
Unicode ni se interpreta una secuencia escapada.

El PDF no fija escapes, comillas internas, literales multilínea, notación
científica ni decimales como `.5` o `5.`. Se devuelve
`UNSPECIFIED_LITERAL_FORMAT` para estos formatos: no es una regla gramatical
aprobada que los prohíba. Tampoco se fijaron rangos/precisión numérica,
precedencia completa, sensibilidad a mayúsculas, alcances o formato de Leer.
Consultar estas decisiones al abordar las fases que las necesitan.

## Validación realizada

449 aserciones mediante Node.js, sin dependencias nuevas: 325 combinaciones
binarias (13 operadores × 5 × 5 tipos), asignación y Leer en las 25 parejas,
unarios, condiciones, agrupación, salida, literales válidos/incorrectos,
declaración, inicialización y cero conocido/desconocido. Sintaxis comprobada
con `npm.cmd --prefix backend run check`.
Son comprobaciones del módulo ejecutadas en terminal, no una suite persistente
ni una prueba de programas completos. No se realizaron pruebas de navegador
ni móviles en este punto.
