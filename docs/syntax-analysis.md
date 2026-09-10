# Análisis sintáctico — punto 8

## Fuentes y decisiones

El PDF A5 documenta declaraciones `Definir nombre Como TIPO`, asignaciones
con `<-`, `Leer variable`, `Escribir` con valores separados por comas y
`Si condición Entonces` cerrado por `FinSi`. La maqueta existente incluye
`Sino`. No constituye una gramática completa.

Uriel aprobó expresamente en esta etapa:

- Programas delimitados por `Inicio` y `Fin`, una instrucción por línea.
- `Mientras condición Hacer` cerrado por `FinMientras`.
- Prioridad de mayor a menor: paréntesis; unarios +, - y NO; *, / y %;
  + y - binarios; comparaciones; Y; O.

La indiferencia a mayúsculas de palabras reservadas continúa vigente.
El lexer incorpora Hacer y FinMientras. No se cambia el código del editor
automáticamente ni se admiten asignaciones con la flecha Unicode ←.

## Gramática implementada

```text
programa    = saltos Inicio salto bloque Fin saltos EOF
bloque      = { declaración | asignación | lectura | escritura | condicional | ciclo }
declaración = Definir identificador Como tipo finLínea
asignación  = identificador <- expresión finLínea
lectura     = Leer identificador finLínea
escritura   = Escribir expresión { , expresión } finLínea
condicional = Si expresión Entonces salto bloque [ Sino salto bloque ] FinSi finLínea
ciclo       = Mientras expresión Hacer salto bloque FinMientras finLínea
primaria    = literal | identificador | ( expresión )
unaria      = ( + | - | NO ) unaria | primaria
```

`expresión` combina unarias con operadores binarios según la prioridad
aprobada. En esta implementación los binarios de igual prioridad se agrupan
de izquierda a derecha; los unarios, de derecha a izquierda. Es una convención
técnica explícita, no una regla extraída del PDF. Las comparaciones encadenadas
no se convierten implícitamente en conjunciones; su validez de tipos corresponde
al punto 9. Por ejemplo, `NO a == b` se agrupa como `(NO a) == b`.

`salto` significa uno o más tokens NEWLINE; se permiten líneas vacías y
comentarios. `finLínea` admite también EOF para diagnosticar el cierre faltante.
Fin puede terminar en EOF sin salto final. Inicio, Fin y cierres ocupan líneas
propias. La indentación no determina bloques; se admiten bloques vacíos.

El alcance usa una variable por Definir o Leer, como los ejemplos de A5;
no extiende esas instrucciones a listas. No admite expresiones multilínea,
inicializadores en declaraciones, funciones, Para o Repetir: esas extensiones
no tienen gramática acordada. Tampoco decide ámbitos, igualdad entre nombres,
rangos numéricos ni conversiones. Estas decisiones siguen pendientes.

## Contrato del AST

`backend/src/parser/parse.js` expone `parse(tokens)` y devuelve
`{ ast, diagnostics, truncated }`. Requiere tokens válidos del lexer con EOF;
la API no lo llama cuando hay errores léxicos. No depende de HTTP ni del DOM.

Cada nodo contiene `kind` y `location` (offset, line, column, endOffset,
endLine, endColumn). Se conserva la convención UTF-16, offsets desde cero,
líneas/columnas desde uno y final exclusivo del lexer. Los nodos de bloque
incluyen sus cierres, pero no el salto posterior.

| kind | Campos específicos |
| --- | --- |
| Program | body: instrucciones |
| Declaration | target: Identifier, declaredType |
| Assignment | target: Identifier, value: expresión |
| ReadStatement | target: Identifier |
| WriteStatement | values: expresiones |
| IfStatement | condition, consequent: instrucciones, alternate: instrucciones o null |
| WhileStatement | condition, body: instrucciones |
| Identifier | name: escritura original |
| Literal | literalType, raw; canonical para booleanos |
| UnaryExpression | operator, argument |
| BinaryExpression | operator, left, right |
| GroupExpression | expression |

Los literales conservan el texto, sin convertir números a Number ni perder
precisión. literalType clasifica la forma, no demuestra compatibilidad de tipos.
Los paréntesis mantienen un nodo propio y su ubicación. No se usa eval.

## Diagnósticos y límites

El parser informa el primer error con `stage: parser`, código y ubicación del
token inesperado o EOF. Devuelve ast null: nunca ofrece un árbol incompleto
como programa válido. Corregir y reenviar permite localizar el siguiente error.
La recuperación de múltiples errores sintácticos queda como mejora futura.

Límites técnicos: 64 llamadas anidadas de expresiones/bloques y 128 niveles de
AST, incluidas cadenas binarias. Al excederlos: SYNTAX_LIMIT, truncated true,
ast null; no un desbordamiento de pila. No son restricciones gramaticales.

## API y estado real

- Sin errores: HTTP 200, status partial, lexical/syntactic completed, AST.
- Error léxico: HTTP 422, lexical_error, syntactic skipped, ast null.
- Error sintáctico: HTTP 422, syntactic_error, syntactic error, ast null.
- En todos los casos semantic not_implemented, executed false y results vacío.
- health añade syntactic true; analysis general continúa false.

La terminal existente muestra errores y posiciones sin nuevos controles ni
cambios de diseño. Un análisis sintáctico exitoso no demuestra que los tipos,
variables o condiciones sean válidos y no produce salidas de Escribir.

## Verificación

397 aserciones satisfactorias ejecutadas en terminal con Node.js: formas del
AST, cinco tipos de literal, precedencia, asociatividad, anidamiento Si/Mientras,
mayúsculas, comentarios, CRLF/CR/LF, posiciones, cierres y operandos faltantes,
tokens sobrantes, límites de recursos y HTTP 200/422/400/413/415. Se comprobó
que errores de tipos y división entre cero aún no se diagnostican en sintaxis.
También se ejecutó `npm.cmd --prefix backend run check`.

La primera pasada falló por la codificación del pipe PowerShell al enviar un
emoji; se repitió con escapes Unicode en el script, sin modificar el lexer.
No hay suite persistente; no se añadieron dependencias. No se hicieron pruebas
móviles ni una nueva auditoría de navegador/lector de pantalla.

Próximo paso: punto 9, recorrido semántico del AST y tabla de símbolos.
La ejecución real requiere una etapa posterior.
