# Análisis léxico — punto 7

`backend/src/lexer/tokenize.js` expone `tokenize(source)` y devuelve
`{ tokens, diagnostics, truncated }`. No calcula expresiones, no valida
compatibilidad entre operandos ni construye un AST.

## Convenciones y alcance

- Por confirmación de Uriel, las palabras reservadas no distinguen mayúsculas.
  Se conserva `lexeme` original y se añade `canonical` para palabras reconocidas.
  Los identificadores conservan su escritura; su igualdad entre ámbitos no
  queda decidida por esta regla de palabras reservadas.
- Palabras reconocidas: Inicio, Fin, Definir, Como, Leer, Escribir, Si, Entonces,
  Sino, FinSi y Mientras; los cinco tipos del PDF; VERDADERO/FALSO; Y/O/NO.
- Se reconocen +, -, *, /, %, <-, <, >, <=, >=, == y !=, con prioridad de
  operadores de dos caracteres. Los signos son tokens separados de números.
- Delimitadores documentados: paréntesis y coma. Los saltos son NEWLINE.
  Se omiten espacios, tabuladores y comentarios // presentes en la maqueta;
  se conserva el salto al terminar un comentario. Un BOM inicial se omite.
- Convención técnica de identificación: letra Unicode o guion bajo inicial,
  seguido de letras, marcas combinantes, números o guion bajo. No normaliza
  Unicode. La gramática podrá acotar nombres en su etapa; esto no constituye
  una especificación completa del lenguaje aprobada por el PDF.
- Para, Repetir y Función son etiquetas de la interfaz, pero no tienen sintaxis
  completa acordada: por ahora se tokenizan como identificadores. No se inventan
  cierres de bloques, funciones ni nuevas palabras basándose en los iconos.

## Tokens y posiciones

Categorías: KEYWORD, TYPE, IDENTIFIER, INTEGER_LITERAL, REAL_LITERAL,
TEXT_LITERAL, CHARACTER_LITERAL, BOOLEAN_LITERAL, OPERATOR, DELIMITER,
NEWLINE y EOF. Cada token contiene:

```text
category, lexeme, offset, line, column, endOffset, endLine, endColumn
```

Offsets desde 0, final exclusivo; líneas/columnas desde 1. Columnas y offsets
cuentan unidades UTF-16 como el editor. CRLF constituye un salto con lexema
de dos unidades; también se aceptan CR y LF. No se altera el texto recibido.
Siempre se cumple `source.slice(offset, endOffset) === lexeme`.
EOF tiene lexema vacío y apunta al final real; no se emite si se truncó.

## Errores y recuperación

- Símbolos desconocidos: INVALID_SYMBOL; para ← se indica usar <- según A5.
  La muestra antigua del editor contiene ← y ahora genera ese diagnóstico;
  no se modifica automáticamente el programa del usuario.
- Literales sin comillas finales: UNCLOSED_LITERAL, recuperando en el salto
  o fin de archivo. CARACTER vacío o de varios puntos de código:
  INVALID_CHARACTER. El criterio Unicode pendiente se registra en type-rules.md.
- `literalType` se reutiliza solo para reconocer literales, no para validar
  operaciones. Escapes, notación científica, `.5`, `5.` y otros formatos no
  definidos producen UNSPECIFIED_LITERAL_FORMAT; siguen pendientes de acuerdo.
  El scanner consume candidatos numéricos completos para no ocultar casos
  como `1e3`, `2abc` o `1.2.3` dividiéndolos en tokens aparentemente válidos.
- Los diagnósticos incluyen code, message, severity error, stage lexer y
  posiciones inicial/final. No se emite token válido para un literal erróneo.
- Tras 100 errores se detiene si queda texto, con DIAGNOSTIC_LIMIT y
  truncated true. Es una protección de recursos, no una regla del lenguaje.

## Integración y verificaciones

POST /api/analyze mantiene la validación HTTP del punto 5. Devuelve 200 y
status partial si el léxico termina sin errores; 422 y lexical_error si falla.
Incluye tokens y estado de cada fase; executed siempre false, results vacío.
No se presenta el éxito léxico como programa correcto ni ejecución terminada.
La terminal existente muestra los diagnósticos y señala líneas; no se añadieron
controles ni se modificó el diseño.

102 aserciones ejecutadas en Node.js: categorías, operadores, variantes de caja,
literales, recuperación, Unicode, offsets, CRLF/CR/LF, comentarios, límite de
errores y respuestas HTTP 200/422. Se comprobó que `"texto" + 12` y `10 / 0`
no producen errores léxicos: corresponden a fases posteriores.
Sintaxis verificada con el comando check. No se repitieron pruebas móviles
ni se incorporaron dependencias. Estas aserciones se ejecutaron en terminal;
todavía no hay suite de pruebas persistente.
