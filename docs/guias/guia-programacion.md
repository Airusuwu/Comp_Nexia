# Guía básica para programar en Nexia

Nexia permite escribir instrucciones para realizar operaciones, solicitar datos
y mostrar resultados. Esta guía describe las funciones de la primera versión.

## 1. Estructura de un programa

Todo programa comienza con `Inicio` y termina con `Fin`. Escribe una instrucción
por línea, sin punto y coma.

```text
Inicio
Escribir "Hola, mundo"
Fin
```

Pulsa **Ejecutar programa** o **Ctrl+Enter** para ejecutarlo. Los ejemplos cortos
de las siguientes secciones deben escribirse dentro de `Inicio` y `Fin`.

## 2. Declarar variables

Una variable guarda un dato. Antes de utilizarla debes declarar su nombre y tipo:

```text
Definir edad Como ENTERO
```

Puedes declarar varias variables del mismo tipo separándolas con comas:

```text
Definir a, b, c Como ENTERO
```

Utiliza nombres descriptivos y sin espacios, como `edad`, `precio` o `resultado`.
No uses palabras reservadas como `Leer`, `Texto`, `Y` u `O`.

## 3. Tipos de datos aceptados

| Tipo | Qué almacena | Ejemplos en el código |
| --- | --- | --- |
| `ENTERO` | Números sin decimales. | `10`, `-5`, `0` |
| `REAL` | Números que pueden tener decimales. | `3.5`, `-2.75` |
| `TEXTO` | Palabras o frases entre comillas dobles. | `"Hola"`, `"Resultado: "` |
| `CARACTER` | Un carácter entre comillas simples. | `'A'`, `'7'` |
| `BOOLEANO` | Un valor verdadero o falso. | `VERDADERO`, `FALSO` |

Los decimales se escriben con punto: `3.5`, no `3,5`. Escribe dígitos antes y
después del punto: `0.5`, no `.5`.

## 4. Asignar valores

Asignar significa guardar un valor en una variable. Se utiliza `<-`, escrito
con los símbolos menor que y guion.

```text
Inicio
Definir edad Como ENTERO
Definir precio Como REAL
Definir nombre Como TEXTO
Definir letra Como CARACTER
Definir activo Como BOOLEANO

edad <- 18
precio <- 25.50
nombre <- "Ana"
letra <- 'A'
activo <- VERDADERO

Escribir nombre, " tiene ", edad, " años."
Escribir "Precio: ", precio
Escribir "Letra: ", letra
Escribir "Activo: ", activo
Fin
```

Declarar una variable **no le asigna un valor automáticamente**. Debes darle uno
mediante `<-` o `Leer` antes de usarla. La declaración y la asignación van en
líneas separadas.

Una variable conserva su tipo: no puedes guardar `"Hola"` en una variable
`ENTERO`. Puedes asignar un `ENTERO` a una variable `REAL`, pero no un `REAL` a
una variable `ENTERO`, incluso si el valor es `5.0`.

## 5. Mostrar valores y texto

Utiliza `Escribir` para mostrar información en la terminal:

```text
Inicio
Definir c Como ENTERO
c <- 12
Escribir "Resultado: ", c
Fin
```

Salida:

```text
Resultado: 12
```

- Lo que está entre comillas se muestra literalmente.
- Un nombre sin comillas muestra el valor de esa variable.
- Las comas permiten combinar textos, variables y operaciones.
- Cada instrucción `Escribir` produce una nueva línea.
- Nexia no agrega espacios entre valores: inclúyelos dentro del texto.

Por ejemplo, después de asignar valores a `a` y `b`:

```text
Escribir "La suma de ", a, " y ", b, " es: ", a + b
```

Para mostrar texto junto con números utiliza comas, no `+`. El operador `+`
también permite unir textos, pero solo cuando ambos valores son `TEXTO`:

```text
Escribir "Hola, " + "mundo"
```

## 6. Solicitar datos

`Leer` permite introducir el valor de una variable desde la terminal de Nexia.

```text
Inicio
Definir nombre Como TEXTO
Escribir "¿Cómo te llamas?"
Leer nombre
Escribir "Hola, ", nombre
Fin
```

Cuando aparezca el campo de entrada, escribe el dato y pulsa **Enter** o
**Enviar**. Cada instrucción `Leer` recibe una sola variable.

| Tipo de variable | Cómo introducir el dato en la terminal |
| --- | --- |
| `ENTERO` | Un número sin decimales, como `18` o `-3`; no `18.0`. |
| `REAL` | Un número entero o decimal con punto, como `18` o `3.5`. |
| `TEXTO` | Texto sin comillas, como `Ana López`. |
| `CARACTER` | Un carácter sin comillas, como `A`. |
| `BOOLEANO` | `VERDADERO` o `FALSO`, sin comillas. |

Una entrada incompatible detiene el programa con un mensaje de error. Vuelve a
ejecutarlo para introducir los datos correctos. **Escape** en el campo de entrada
o **Detener** cancela la ejecución.

## 7. Realizar operaciones

| Operador | Operación | Ejemplo |
| --- | --- | --- |
| `+` | Suma | `a + b` |
| `-` | Resta | `a - b` |
| `*` | Multiplicación | `a * b` |
| `/` | División | `a / b` |
| `%` | Residuo de una división entre enteros | `10 % 3` produce `1`. |

La multiplicación, división y residuo se calculan antes que la suma y resta.
Puedes utilizar paréntesis para indicar qué calcular primero:

```text
resultado <- (a + b) * 2
```

**La división siempre produce un valor `REAL`**, aunque el resultado no tenga
parte decimal. Si quieres guardarla, declara el destino como `REAL`:

```text
Definir cociente Como REAL
cociente <- 10 / 2
Escribir "Cociente: ", cociente
```

No se permite dividir entre cero ni calcular `%` con divisor cero. `%` solo
acepta enteros. Los cálculos con `REAL` pueden mostrar aproximaciones decimales.

## 8. Ejemplo completo: sumar dos números

```text
Inicio
Definir a, b, c Como ENTERO

Escribir "Ingresa el primer número:"
Leer a

Escribir "Ingresa el segundo número:"
Leer b

c <- a + b

Escribir "Resultado: ", c
Fin
```

Si introduces `3` y `4`, el resultado será `Resultado: 7`.

Para practicar resta o multiplicación, cambia únicamente la operación por
`c <- a - b` o `c <- a * b`. Para guardar una división, declara `c` por separado
como `REAL`.

## 9. Tomar decisiones

Utiliza `Si`, `Entonces`, `Sino` y `FinSi`:

```text
Inicio
Definir edad Como ENTERO
Escribir "Ingresa tu edad:"
Leer edad

Si edad >= 18 Entonces
    Escribir "Eres mayor de edad."
Sino
    Escribir "Eres menor de edad."
FinSi
Fin
```

`Sino` es opcional. La condición debe producir un valor `BOOLEANO`.

| Operador | Significado |
| --- | --- |
| `>` | Mayor que. |
| `<` | Menor que. |
| `>=` | Mayor o igual que. |
| `<=` | Menor o igual que. |
| `==` | Igual a. |
| `!=` | Diferente de. |

Las comparaciones de orden se utilizan entre números. La igualdad permite
comparar valores del mismo tipo o combinar `ENTERO` y `REAL`.

**`==` compara valores; `<-` asigna un valor.** Puedes combinar condiciones
booleanas con `Y`, `O` y `NO`:

```text
Si (edad >= 18) Y (edad <= 65) Entonces
    Escribir "Edad entre 18 y 65."
FinSi
```

Usa paréntesis al negar una comparación, por ejemplo `NO (edad == 18)`.

## 10. Repetir instrucciones

`Mientras` repite un bloque mientras su condición sea verdadera:

```text
Inicio
Definir contador Como ENTERO
contador <- 1

Mientras contador <= 5 Hacer
    Escribir "Número: ", contador
    contador <- contador + 1
FinMientras
Fin
```

Este programa muestra los números del `1` al `5`. Actualiza el contador para
que el ciclo termine; Nexia limita las ejecuciones demasiado largas.

## 11. Para: repetir una cantidad conocida de veces

**Estado actual: `Para` todavía no está implementado en Nexia.** Su botón aparece
en la interfaz, pero no está habilitado. Escribir una instrucción `Para` tampoco
funciona aún. Su sintaxis definitiva está pendiente de implementación.

Conceptualmente, un ciclo Para sirve para recorrer una secuencia con un contador,
por ejemplo mostrar los números del 1 al 5. Debes identificar el valor inicial,
el valor final y el incremento del contador.

Por ahora puedes hacer ese recorrido con `Mientras`. Este ejemplo sí funciona:

```text
Inicio
Definir contador Como ENTERO
contador <- 1

Mientras contador <= 5 Hacer
    Escribir "Vuelta: ", contador
    contador <- contador + 1
FinMientras
Fin
```

El contador comienza en 1, aumenta de uno en uno y deja de entrar al ciclo cuando
vale 6. Por eso se realizan cinco vueltas. No olvides actualizar el contador.

## 12. Repetir: ejecutar antes de comprobar la condición

**Estado actual: `Repetir` todavía no está implementado en Nexia.** Su botón no
está habilitado y no se puede escribir esa instrucción en un programa ejecutable.
La explicación siguiente es conceptual, no una gramática aprobada para Nexia.

En un ciclo del tipo «repetir hasta que», el bloque se ejecuta **al menos una vez**
y después se comprueba una condición de salida. Esto lo diferencia de `Mientras`,
que comprueba su condición antes de ejecutar el bloque y podría no entrar nunca.

Por ejemplo, para pedir un número hasta que sea positivo, puedes usar una variable
booleana con `Mientras`. Este equivalente sí funciona en la versión actual:

```text
Inicio
Definir numero Como ENTERO
Definir continuar Como BOOLEANO
continuar <- VERDADERO

Mientras continuar Hacer
    Escribir "Ingresa un número entero mayor que cero:"
    Leer numero
    continuar <- numero <= 0
FinMientras

Escribir "Se recibió un número positivo."
Fin
```

Como `continuar` comienza en VERDADERO, se solicita el dato al menos una vez.
Con un entero negativo o cero se repite; con uno positivo se termina. Una entrada
que no sea un entero produce un error y detiene el programa, no un nuevo intento.
Recuerda que el motor tiene un límite de 100 lecturas por ejecución.

## 13. Consejos para evitar errores

- Declara las variables antes de usarlas y asígnales un valor.
- No declares dos veces el mismo nombre dentro del mismo ámbito.
- Si necesitas una variable después de un `Si` o `Mientras`, declárala antes
  del bloque. Las variables declaradas dentro son locales a ese bloque.
- Escribe `<-`, no `=` ni la flecha `←`, para asignar.
- Cierra las comillas, los paréntesis y los bloques.
- Las palabras reservadas aceptan mayúsculas o minúsculas: `Escribir` y
  `escribir` funcionan igual.
- Si aparece un error, revisa el mensaje, la línea y la columna indicados.
- Puedes añadir comentarios con `//`; no se ejecutan.

Esta versión admite `Si` y `Mientras`, pero todavía no admite `Para`, `Repetir`
ni funciones. Para detalles técnicos y límites consulta [el motor de ejecución](../tecnica/runtime.md).
