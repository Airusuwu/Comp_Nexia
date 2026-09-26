# Cómo detecta Nexia los errores léxicos y semánticos

Este documento explica cómo Nexia revisa un programa antes de ejecutarlo,
qué errores puede encontrar y cómo ayuda a corregirlos.

## 1. Recorrido desde el editor hasta el resultado

Cuando se pulsa **Ejecutar programa**, el código pasa por estas revisiones:

1. **Análisis léxico:** reconoce las palabras, los números y los símbolos escritos.
2. **Análisis sintáctico:** comprueba que las instrucciones estén organizadas
   correctamente, por ejemplo que un `Si` tenga su cierre `FinSi`.
3. **Análisis semántico:** comprueba que las variables y las operaciones se usen
   de acuerdo con las reglas del lenguaje.
4. **Ejecución:** si las revisiones anteriores terminan sin errores, realiza
   las instrucciones, solicita los datos de `Leer` y muestra las salidas.

Si una revisión encuentra errores, no se ejecuta el programa. Las etapas
posteriores de análisis tampoco se realizan si no tienen una entrada válida.
La ruta `/api/analyze` solo revisa; `/api/execute` también ejecuta si todo es válido.

## 2. Cómo detecta los errores léxicos

El analizador léxico recorre el texto y lo divide en piezas pequeñas llamadas
**tokens**. Cada pieza conserva lo que se escribió, su categoría y su ubicación.

Por ejemplo:

```text
edad <- 18
```

Se reconoce como un nombre de variable (`edad`), un operador de asignación
(`<-`) y un número entero (`18`). En esta etapa todavía no se comprueba si
`edad` está declarada ni qué tipo de dato acepta.

### Qué revisa durante el recorrido

- Reconoce palabras reservadas como `Definir`, `Leer` y `Escribir`, los cinco
  tipos de datos, los booleanos y los operadores lógicos.
- Reconoce nombres de variables. Pueden empezar con una letra o guion bajo;
  después pueden incluir números. No distingue mayúsculas en las palabras
  reservadas cuando se utiliza desde la aplicación.
- Comprueba la escritura de números, textos y caracteres.
- Reconoce primero operadores de dos símbolos, como `<-`, `<=` y `!=`, para
  no separarlos incorrectamente.
- Ignora espacios y comentarios iniciados con `//`, pero conserva los saltos
  de línea necesarios para las siguientes revisiones.
- Registra un error si encuentra un símbolo o un formato no admitido.

### Errores léxicos que puede encontrar

Los ejemplos de esta tabla son fragmentos independientes, no programas completos.

| Situación | Ejemplo incorrecto | Motivo |
| --- | --- | --- |
| Símbolo desconocido fuera de un texto | `edad <- 18 @` | `@` no es un símbolo admitido en esa instrucción. |
| Flecha de asignación incorrecta | `edad ← 18` | Debe escribirse `<-`, no `←`. |
| Comillas sin cerrar | `Escribir "Hola` | El texto llega al final de la línea sin cerrar sus comillas. |
| Más de un carácter entre comillas simples | `letra <- 'AB'` | `CARACTER` admite un solo carácter, no dos. |
| Carácter vacío | `letra <- ''` | No hay un carácter entre las comillas simples. |
| Número con formato no admitido | `precio <- 3.5.2` | Un número no puede tener dos puntos decimales. |
| Formato de número todavía no implementado | `precio <- .5` | Debe utilizarse `0.5`; tampoco se admite la notación `1e3`. |

Los textos se escriben entre comillas dobles y los caracteres entre comillas
simples. La versión actual no admite saltos de línea dentro de un texto ni
secuencias de escape, como una barra invertida seguida de `n`.

**Importante:** una palabra desconocida no siempre es un error léxico. Por
ejemplo, `Escrbir` puede reconocerse como un nombre de variable. El problema
se detectará después, según el lugar donde se utilice. Del mismo modo, un
`@` dentro de `"correo@ejemplo"` forma parte del texto y no es un símbolo inválido.

### Ejemplo completo

```text
Inicio
Escribir "Hola
Fin
```

Nexia encuentra que faltan las comillas de cierre en la segunda línea y no
continúa con las siguientes etapas. La corrección es:

```text
Inicio
Escribir "Hola"
Fin
```

El analizador puede recoger varios errores léxicos en una revisión. Si alcanza
100 errores y todavía queda texto por revisar, se detiene y agrega un aviso
para que se corrijan antes de volver a enviar el programa.

## 3. Cómo detecta los errores semánticos

Esta revisión comienza cuando las palabras y la estructura del programa ya
son válidas. Recibe una representación organizada de las instrucciones,
llamada **árbol de sintaxis abstracta (AST)**, y la recorre en orden.

Para seguir el uso de las variables utiliza una **tabla de símbolos**: un
registro con su nombre, tipo, lugar de declaración y si ya tienen un valor
garantizado. No es una lista de los resultados finales del programa.

Por ejemplo, al encontrar:

```text
Definir edad Como ENTERO
edad <- 18.5
```

Primero registra que `edad` acepta enteros. Después reconoce que `18.5` es
`REAL`, compara ambos tipos y rechaza la asignación.

### Reglas que comprueba

- **Declaración previa:** una variable debe existir antes de leerse, recibir
  una asignación o utilizarse en una expresión.
- **Sin declaraciones repetidas en el mismo bloque:** `edad` y `EDAD` son
  el mismo nombre. No se permite declararlos dos veces en ese ámbito.
- **Alcance de las variables:** las declaradas dentro de `Si`, `Sino` o
  `Mientras` no están disponibles fuera de ese bloque. Un bloque interno sí
  puede declarar una variable local con el mismo nombre que una externa.
- **Valor antes del uso:** declarar una variable no le da un valor automático.
  Debe recibirlo mediante una asignación válida o una lectura.
- **Tipos compatibles:** una variable mantiene su tipo. Se permite asignar
  `ENTERO` a `REAL`, pero no `REAL` a `ENTERO`, ni texto a un número.
- **Operaciones válidas:** la aritmética requiere números; `/` siempre produce
  `REAL` y `%` solo admite enteros. `+` también une dos valores `TEXTO`.
- **Comparaciones válidas:** el orden se compara entre números. La igualdad
  admite tipos iguales o una combinación de `ENTERO` y `REAL`.
- **Lógica y condiciones:** `Y`, `O` y `NO` requieren booleanos. Las condiciones
  de `Si` y `Mientras` también deben producir `BOOLEANO`.
- **Salida válida:** `Escribir` permite mezclar valores separados por comas,
  pero cada expresión debe ser válida y sus variables deben tener un valor.
- **Divisor distinto de cero:** se rechaza `/` o `%` con cero cuando el valor
  puede conocerse durante el análisis.

### Errores semánticos que puede encontrar

| Situación | Ejemplo o caso | Cómo corregirlo |
| --- | --- | --- |
| Variable no declarada | `Escribir total` sin declarar `total`. | Declararla y darle un valor antes de usarla. |
| Variable sin valor | Declarar `total` y mostrarlo sin asignación ni lectura. | Asignar un valor o utilizar `Leer total`. |
| Declaración repetida | Declarar `edad` dos veces en el mismo bloque. | Conservar una declaración y usar asignaciones para cambiar su valor. |
| Variable fuera de su bloque | Mostrar fuera de un `Si` una variable declarada solo dentro de él. | Declararla en un ámbito accesible y garantizar su valor. |
| Asignación incompatible | Guardar `18.5` en una variable `ENTERO`. | Utilizar un entero o declarar la variable como `REAL`. |
| Operación incompatible | `Escribir "Hola" - 2`. | Utilizar valores numéricos para la resta. |
| Unión de texto y número con `+` | `Escribir "Resultado: " + 5`. | Escribir `Escribir "Resultado: ", 5`. |
| Operación lógica incorrecta | `Escribir NO 10`. | Aplicar `NO` a una expresión booleana. |
| Comparación incompatible | `Escribir "Hola" > 3`. | Comparar números para establecer un orden. |
| Condición incorrecta | `Si 5 Entonces`. | Escribir una condición, como `Si edad >= 18 Entonces`. |
| Residuo con decimales | `Escribir 5.5 % 2`. | Utilizar enteros con `%`. |
| División o residuo entre cero conocido | `Escribir 10 / 0`. | Utilizar un divisor diferente de cero. |

### Ejemplo completo: asignación incompatible

```text
Inicio
Definir edad Como ENTERO
edad <- 18.5
Fin
```

Las palabras y la estructura son correctas, pero el valor no corresponde al
tipo declarado. El mensaje semántico indica:

```text
No se puede asignar REAL a ENTERO mediante <-.
```

Para corregirlo se puede cambiar `18.5` por `18`, o declarar `edad` como `REAL`
si se necesitan decimales.

### Cómo revisa los diferentes caminos del programa

El analizador no supone que todas las instrucciones llegarán a ejecutarse:

- En `Si/Sino`, una variable que no tenía valor debe recibirlo en ambos
  caminos para poder utilizarse después con seguridad.
- Sin `Sino`, la condición podría ser falsa y la asignación no ocurrir.
- Un `Mientras` puede ejecutarse cero veces; asignar dentro del ciclo no
  garantiza que la variable tenga valor al terminar.

Se revisan ambos caminos de un `Si`, incluso cuando su condición es un valor
literal. Esta revisión es conservadora: prefiere señalar una posible falta de
valor antes que asumir que cierto camino siempre se ejecutará.

La etapa semántica informa **el primer error encontrado**, no todos a la vez.
Después de corregirlo, se puede volver a ejecutar para encontrar el siguiente.

## 4. Errores que necesitan esperar a la ejecución

No todos los problemas pueden conocerse antes de solicitar los datos del usuario.

```text
Inicio
Definir divisor Como ENTERO
Leer divisor
Escribir 10 / divisor
Fin
```

El análisis comprueba que `divisor` existe y tiene un tipo adecuado. Sin embargo,
todavía no sabe qué número introducirá la persona. Registra que debe comprobarse
el divisor durante la ejecución. Si se introduce `0`, el motor detiene el
programa y muestra el error correspondiente.

También se comprueba al ejecutar que una entrada de `Leer` corresponda al tipo
esperado. Introducir `hola` cuando se solicita un entero es un problema de
entrada durante la ejecución, no un error léxico del código del editor.

Nexia puede deducir algunos ceros antes de ejecutar, por ejemplo en `10 / (3 - 3)`.
No calcula estáticamente todas las expresiones posibles: si no puede conocer
el valor con seguridad, deja esa comprobación al motor. Superar el análisis
no garantiza que la ejecución termine sin errores.

## 5. Cómo se muestra la ubicación del error

Al recorrer el texto, Nexia cuenta líneas y columnas desde 1. Cada pieza del
código conserva su posición; esa información pasa a las instrucciones que
revisan las siguientes etapas.

Cuando falla una comprobación, se genera un diagnóstico con el tipo de error,
su mensaje, la etapa, la línea y la columna. Así, la terminal puede indicar
dónde revisar el código sin borrarlo del editor. La posición puede señalar
el valor o la expresión que ocasionó el problema, no necesariamente el inicio
de la instrucción.

Como detalle técnico, las columnas se cuentan en unidades UTF-16. Algunos
símbolos, como ciertos emojis, pueden ocupar dos unidades aunque se vean como
un solo carácter.

## 6. Archivos responsables

| Archivo | Responsabilidad |
| --- | --- |
| [tokenize.js](../../backend/src/lexer/tokenize.js) | Recorrer el texto, reconocer tokens y registrar errores léxicos. |
| [literals.js](../../backend/src/types/literals.js) | Comprobar el formato de números, textos y caracteres escritos en el código. |
| [parse.js](../../backend/src/parser/parse.js) | Revisar la estructura y construir el árbol de instrucciones. |
| [analyze.js del analizador semántico](../../backend/src/semantic/analyze.js) | Revisar variables, expresiones y caminos de ejecución. |
| [table.js](../../backend/src/symbols/table.js) | Registrar variables y controlar sus ámbitos e inicialización. |
| [compatibility.js](../../backend/src/types/compatibility.js) | Definir qué tipos pueden combinarse en cada operación. |
| [guards.js](../../backend/src/types/guards.js) | Comprobar declaración, inicialización y divisores. |
| [analyze.js de la API](../../backend/src/api/analyze.js) | Coordinar las revisiones y decidir si se puede ejecutar. |
| [execute.js](../../backend/src/runtime/execute.js) y [values.js](../../backend/src/runtime/values.js) | Ejecutar el programa y validar los datos y operaciones en ese momento. |

Para aprender a escribir programas, consulta la [guía de programación](../guias/guia-programacion.md).
Para conocer los límites de ejecución, consulta [el documento del motor](runtime.md).
