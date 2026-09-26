# Verificación integral — punto 10

Fecha: 2026-09-10. Rama: back. Alcance: PC, análisis del lenguaje y comunicación
local. Este registro no certifica la ejecución de programas ni una auditoría
completa de accesibilidad. No se modificó el diseño ni la lógica en esta etapa.

## Resultado automático

Se ejecutaron 26 programas de prueba mediante POST /api/analyze, con
140 aserciones satisfactorias en total. El servidor de pruebas escuchó en
127.0.0.1 con un puerto efímero y se cerró al terminar. El script temporal se
eliminó; todavía no existe una suite persistente ni npm test.

Los casos se basan en las reglas A5 ya transcritas en type-rules.md y las
ampliaciones aprobadas por Uriel. No se volvió a incorporar el PDF a Git.

| Grupo | Casos comprobados |
| --- | --- |
| Declaraciones | Lista a, b, c; duplicado edad/Edad; símbolos independientes |
| Aritmética | Enteros, operación mixta REAL, división de enteros produce REAL |
| Asignación | ENTERO hacia REAL permitido; REAL hacia ENTERO rechazado |
| Comparación/lógica | Orden, igualdad numérica mixta, NO/Y/O; rechazo de número Y booleano |
| Texto | TEXTO + TEXTO permitido; TEXTO + ENTERO rechazado |
| Literales | CARACTER válido, CARACTER de varios símbolos y comillas sin cerrar |
| Expresiones | Unarios, paréntesis y operando faltante |
| Módulo/cero | % entero válido; % real inválido; /0 y %0 rechazados |
| Inicialización | Variable sin inicializar; una rama no basta; ambas ramas sí; ciclo no garantiza asignación |
| Condiciones | Si con número rechazado |
| Leer | No pide datos ni ejecuta: registra validación de entrada y divisor desconocido |
| Léxico | Flecha ← rechazada con indicación de usar <- |

En cada programa se verificaron código HTTP, diagnóstico esperado,
executed false y results vacío. Los errores deben tener línea y columna.
Se verificaron adicionalmente:

- JSON inválido, campo code ausente, texto vacío y bytes UTF-8 inválidos: 400.
- Código mayor de 64 KiB: 413; Content-Type incorrecto: 415.
- Origen no autorizado: 403; GET sobre la ruta de análisis: 405.
- .git/config, backend/package.json, CONTEXTO.md y PDF no servidos: 404.
- Frontend y script disponibles: 200; capacidades reales de /api/health.
- Límites técnicos del parser y del lexer: diagnóstico sin caída del servicio.

`npm.cmd --prefix backend run check` y `git diff --check` satisfactorios.
Estas verificaciones complementan las anteriores, no suman sus cantidades
como si todas las pruebas históricas se hubieran vuelto a ejecutar hoy.

## Pruebas reales en Edge de PC

Se utilizó una pestaña nueva de prueba, sin editar pestañas ni código del
usuario. El servicio fue http://127.0.0.1:55962/.

- Seleccionar todo y pegar un programa multilínea conserva el contenido.
- Ctrl+Enter llega al backend y presenta el éxito de las tres fases sin
  resultados ficticios. Se verificaron declaraciones múltiples.
- Error semántico: variable b sin inicializar, línea 4, columna 10.
- Error sintáctico: coma sin nombre en Definir, línea 2, columna 12.
- Error léxico: flecha ←, línea 2, columna 3.
- Editor vacío: mensaje específico y foco conservado en el editor.
- Leer y división desconocida: mensaje de análisis terminado con dos controles
  pendientes; no se muestra un resultado de ejecución.
- Tab sale del editor; Shift+Tab permite regresar. Se llegó a Ejecutar por
  teclado y se activó con Enter. No se observó una trampa de foco.
- Capturas en PC: foco visible en Ejecutar/editor, terminal de error con
  texto amarillo sobre violeta y señalización de línea que no depende solo
  del color. No se observaron superposiciones en la ventana probada.
- Documento de 63 líneas: desplazamiento hasta el final, numeración alineada,
  error de variable no declarada en línea 62 y marca visible correspondiente.
- Desconexión real: se detuvo el servidor propio, se envió código y se observó
  procesamiento seguido de error de comunicación sin pérdida del contenido.
  Se reinició el mismo puerto y se pudo analizar de nuevo con Enter.

La inspección del código confirma aria-labelledby/aria-describedby del editor,
aria-invalid/aria-errormessage para errores y una terminal role=status con
aria-live polite. El árbol accesible muestra los mensajes y controles
pendientes como deshabilitados. Esto NO equivale a escucharlos con un lector.

## Ejemplo para repetir la prueba básica

```text
Inicio
Definir a, b, c Como ENTERO
a <- 5
b <- 3
c <- a + b
Escribir c
Fin
```

Resultado actual: análisis exitoso, sin ejecución ni salida 8. Al retirar
`b <- 3`, debe aparecer error de b sin inicializar. Al escribir `a ← 5`, debe
aparecer un error léxico. No se modifica automáticamente el código del usuario.

## Pendientes y límites de cierre

El punto 10 tiene comprobaciones técnicas registradas, pero no se declara
validado todo el producto ni se ocultan los siguientes pendientes:

1. Prueba real con NVDA o Narrador: nombre del editor, aviso de resultados,
   error con línea/columna, navegación, conservación de foco y ausencia de
   anuncios duplicados. Las herramientas de esta sesión no permiten controlar
   aplicaciones nativas; no se inició un lector de pantalla.
2. Apertura .txt mediante selector real, confirmación de reemplazo y archivo
   inválido: no se repitió el intento antes bloqueado por permisos del navegador.
3. Timeout exacto de ocho segundos, respuestas obsoletas y envíos duplicados
   bajo latencia artificial no se volvieron a probar en navegador.
4. Suite persistente de regresión, precisión numérica definitiva y ampliación
   del cálculo de constantes. El semántico sigue siendo conservador.
5. Guardar, Aumentar texto y botones de estructuras continúan deshabilitados.
   El punto 4 se retiró por petición del usuario; no se consideran terminados.
6. Motor de ejecución con Leer/Escribir reales, control de ciclos y Detener.
   Escuchar/dictado continúan fuera de esta etapa por acuerdo.

No se hicieron pruebas móviles. El trabajo permanece en back; commit local
sin push, Pull Request ni integración automática a main. La validación manual
de accesibilidad puede continuar usando esta lista. La siguiente implementación
principal es el motor de ejecución, con autorización del usuario y decisiones
pendientes de entradas/precisión/límites explicitadas antes de programarlo.
