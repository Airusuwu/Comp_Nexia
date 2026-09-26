# Sprint 0 — Primer entregable de Nexia

**Proyecto:** Nexia, compilador educativo orientado a personas con baja visión o ceguera.

**Fecha de elaboración de este resumen:** 25 de septiembre de 2026.

**Propósito:** registrar la primera versión funcional y establecer la base para Sprint 1.

Este documento resume el trabajo realizado; no define fechas de inicio o cierre
del sprint que no hayan sido acordadas. Distingue la entrega integrada de los
ajustes posteriores presentes en la copia de trabajo.

## 1. Objetivo del sprint

Construir una primera versión que permita escribir pseudocódigo, comprobar sus
reglas y ejecutar programas básicos con entrada y salida de datos. También se
establecieron la interfaz, la organización técnica, el control de versiones y
la documentación necesaria para continuar el desarrollo en equipo.

## 2. Trabajo realizado

### Interfaz y editor

- Se desarrolló el frontend con HTML, CSS y JavaScript, conservando la paleta
  amarillo/violeta y la organización en acciones, editor, resultados y estructuras.
- Se habilitó escribir, editar, seleccionar y pegar código multilínea.
- Se incorporó numeración de líneas y señalización de la posición de errores.
- Se conectó Ejecutar con el backend y se habilitó el atajo `Ctrl+Enter`.
- Se implementó apertura de archivos `.txt` UTF-8 mediante `Ctrl+O`, con
  confirmación antes de reemplazar el contenido del editor.
- Se incorporaron mensajes para código vacío, procesamiento y fallos de conexión,
  conservando el código ante errores.
- Se prepararon etiquetas accesibles, foco visible y navegación por teclado.
  La información de error se comunica con texto, no únicamente con colores.

### Infraestructura del backend

- Se organizó un servidor local en Node.js 24 con módulos ES y sin dependencias externas.
- Se separaron comunicación HTTP, lexer, parser, semántica, símbolos, tipos,
  diagnósticos y motor de ejecución.
- Se crearon las rutas `GET /api/health`, `POST /api/analyze` y `POST /api/execute`.
- Se definió una respuesta JSON con estado, resultados, diagnósticos y datos de
  análisis disponibles, distinguiendo analizar de ejecutar.
- Se limitaron tamaños de solicitudes y código y se restringió la entrega de
  archivos a una lista explícita del frontend.

### Análisis del lenguaje

| Etapa | Resultado implementado |
| --- | --- |
| Léxica | Reconoce palabras reservadas, identificadores, literales, operadores y delimitadores; genera tokens con ubicación. |
| Sintáctica | Valida la estructura del programa y construye un árbol de sintaxis abstracta (AST), respetando precedencia y paréntesis. |
| Semántica | Comprueba declaración, inicialización, ámbitos, tipos y condiciones antes de ejecutar. |
| Tabla de símbolos | Registra las variables y sus tipos; impide redeclaraciones en el mismo ámbito. |
| Diagnósticos | Informa etapa, mensaje, línea y columna cuando corresponde. |

Las reglas de tipos se basaron en el documento A5. Las decisiones que ese
documento no especificaba se registraron por separado en la documentación técnica.
El PDF se excluyó del repositorio y no es necesario para iniciar la aplicación.

### Lenguaje y operaciones disponibles

- Programas delimitados por `Inicio` y `Fin`, con una instrucción por línea.
- Declaraciones individuales y múltiples: `Definir a, b, c Como ENTERO`.
- Tipos `ENTERO`, `REAL`, `TEXTO`, `CARACTER` y `BOOLEANO`.
- Asignaciones con `<-`; promoción de ENTERO a REAL, sin conversión inversa automática.
- Suma, resta, multiplicación, división y residuo; la división produce REAL.
- Comparaciones, operadores booleanos `Y`, `O`, `NO`, unarios y paréntesis.
- Concatenación entre textos y salida de varios valores mediante `Escribir`.
- Entrada mediante `Leer`, condiciones `Si/Sino` y ciclos `Mientras`.
- Comentarios `//` y reconocimiento de palabras reservadas sin distinguir mayúsculas.

Se detectan, entre otros, símbolos inválidos, comillas sin cerrar, instrucciones
mal formadas, variables no declaradas o sin inicializar y operaciones incompatibles.
La división o residuo entre cero se comprueba durante el análisis si el valor se
conoce y durante la ejecución con los valores reales.

### Ejecución y consola

- Se implementó un intérprete que recorre el AST, sin utilizar `eval` ni generar
  ejecutables nativos.
- `Escribir` muestra resultados reales y permite combinar texto y variables,
  por ejemplo `Escribir "Resultado: ", c`.
- `Leer` solicita datos dentro de la terminal, sustituyendo el diálogo emergente.
- Se habilitó envío con Enter o Enviar y cancelación mediante Detener o Escape
  en el campo de entrada.
- Se conservan salidas anteriores a un error de ejecución y se diferencian los
  estados de espera, finalización, error y cancelación.
- Se añadieron límites de pasos, tiempo, entradas y salida para controlar
  programas excesivos o ciclos que no terminan.

### Control de versiones y documentación

- Se organizaron las ramas `main`, `front` y `back` y el trabajo mediante commits.
- La primera versión funcional se integró con el PR #2 de `back` hacia `main`,
  mediante Squash and merge, con commit resultante `4d25887`.
- Se documentaron requisitos, inicio local, reglas de tipos, gramática, análisis,
  ejecución, verificaciones y decisiones de continuidad.
- Se prepararon guías para principiantes y para explicar el backend al equipo,
  junto con comentarios dentro del código, como documentación complementaria.

## 3. Ajustes posteriores a la primera integración

Estos trabajos forman parte del estado local revisado al redactar el resumen,
pero **no deben confundirse con el contenido originalmente integrado en el PR #2**.

| Ajuste | Estado local observado |
| --- | --- |
| Restauración de Guardar como descarga `.txt` y aumento de texto entre 100 % y 200 % | Commit `24080d0` en `back`; su publicación e integración posterior no se verificaron en esta revisión. |
| Corrección del crecimiento del editor que desplazaba la terminal al ejecutar | Implementada y comprobada en Edge PC; pendiente de commit. |
| Guía de programación, explicación del backend y comentarios en sus módulos | Presentes localmente; hay documentos y cambios pendientes de commit. |

Antes de compartir una versión de cierre con QA, debe confirmarse qué ajustes
están publicados e integrados para que todos prueben el mismo código. La rama
`main` local puede estar desactualizada respecto de GitHub.

## 4. Verificaciones realizadas

La evidencia histórica registra pruebas por módulos y pruebas de integración:

- Casos válidos e inválidos de tipos, tokens, gramática, ámbitos e inicialización.
- Integración del análisis mediante 26 programas y 140 aserciones.
- Motor y API de ejecución con 93 aserciones sobre operaciones, entradas, errores,
  límites y cancelación.
- Pruebas en Edge de PC sobre editor, diagnósticos, teclado, comunicación y
  entradas en consola; dos lecturas con valores 3 y 4 produjeron una suma de 7.
- Comprobaciones de sintaxis mediante `npm.cmd --prefix backend run check`.
- Comprobación del ajuste visual: el editor y el inicio de la terminal mantuvieron
  su posición al ejecutar un programa con 15 salidas.

Estas son verificaciones registradas durante el desarrollo, **no una nueva
ejecución de todas las pruebas al redactar este documento**. Los scripts temporales
no constituyen una suite persistente. No se certifica una auditoría completa de
accesibilidad ni una validación móvil; la etapa funcional se centró en PC.

## 5. Resultado del primer entregable

Se obtuvo una base funcional para introducir pseudocódigo, revisarlo y ejecutar
programas sencillos con operaciones, variables, decisiones, ciclos y entrada/salida.
El equipo dispone de una estructura modular y documentación para continuar.

Ejemplo representativo del alcance:

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

## 6. Pendientes y límites conocidos

- `Para`, `Repetir` y funciones todavía no forman parte del lenguaje ejecutable.
- Los botones de inserción de estructuras no están habilitados.
- Escuchar resultados y dictado no se implementaron en esta entrega.
- Falta una suite automatizada persistente y una auditoría con lector de pantalla real.
- Quedan verificaciones de interacción por completar, como el selector real de
  archivos y la descarga/reapertura de Guardar tras su restauración.
- REAL utiliza precisión aproximada y ENTERO tiene un rango seguro limitado.
- La ejecución tiene límites documentados; no es un motor de propósito general.
- `Leer` utiliza reejecución con entradas acumuladas, sin sesiones persistentes.
- El ejemplo antiguo precargado en el editor contiene sintaxis inválida;
  debe reemplazarse por un ejemplo válido al realizar pruebas.

## 7. Base para planificar Sprint 1

Las siguientes son **propuestas para priorizar con el equipo**, no funciones ya
aprobadas ni implementadas:

1. Publicar y revisar los ajustes pendientes del cierre de Sprint 0.
2. Definir el objetivo de Sprint 1 y seleccionar las nuevas funciones a entregar.
3. Si se eligen `Para` y `Repetir`, acordar primero sintaxis y reglas; después
   ampliar lexer, parser, semántica, ejecución y documentación.
4. Establecer criterios de aceptación y casos de QA para cada función elegida.
5. Priorizar pruebas repetibles y validación con lector de pantalla.
6. Registrar en un documento de Sprint 1 su alcance, avances, pruebas y pendientes,
   sin reemplazar este historial del primer entregable.

## 8. Documentos de apoyo

- [Inicio y requisitos del proyecto](../../README.md).
- [Guía de programación](../guias/guia-programacion.md).
- [Explicación del código del backend](../../backend/GUIA_CODIGO.md).
- [Errores léxicos y semánticos](../tecnica/errores-lexicos-semanticos.md).
- [Reglas de tipos](../tecnica/type-rules.md) y [gramática](../tecnica/syntax-analysis.md).
- [Análisis semántico](../tecnica/semantic-analysis.md) y [motor de ejecución](../tecnica/runtime.md).
- [Verificaciones de integración](../pruebas/verification.md).
- [Contexto e historial de decisiones](../contexto/CONTEXTO.md).
