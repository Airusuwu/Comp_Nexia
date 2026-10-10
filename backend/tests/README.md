# Pruebas del backend

Ejecuta la suite persistente desde la raíz con `npm.cmd --prefix backend test`.
No requiere dependencias externas ni ocupa el puerto de desarrollo: inicia el
servidor en un puerto local efímero y prueba el contrato de `/api/execute`.

## Plan de `Para` y `Repetir`

La suite `loops.test.mjs` recorre lexer, parser, análisis semántico, API y motor
(11 casos en total):

- `Para` usa la forma `Para i <- inicio Hasta Hacer límite`: rango inclusivo,
  incremento fijo, rango vacío, contador local con
  homónimo externo, asignación al contador desde el cuerpo y rechazo de límites
  que no sean `ENTERO`. También se verifica que el orden anterior se rechace.
- `Repetir`: ejecución mínima de una vuelta, repetición hasta condición
  verdadera, inicialización de variables externas, validación `BOOLEANO` y
  rechazo de variables locales del cuerpo usadas en la condición.
- Para errores semánticos, comprueba HTTP 422, diagnóstico esperado, ausencia
  de ejecución y resultados vacíos.

La verificación manual de la interfaz, teclado, lector de pantalla y navegador
no forma parte de esta suite automatizada.
