# Pruebas del backend

Ejecuta la suite persistente desde la raíz con `npm.cmd --prefix backend test`.
No requiere dependencias externas ni ocupa el puerto de desarrollo: inicia el
servidor en un puerto local efímero y prueba los contratos de análisis y ejecución.

## Plan de código intermedio

`intermediate.test.mjs` contiene 25 casos del generador independiente y la API:

- Precedencia, operadores binarios/unarios, cinco tipos, temporales y ubicaciones.
- Literales originales sin redondeo, determinismo y AST conservado.
- Ámbitos, homónimos, nombres parecidos a IDs internos y referencias definidas.
- Saltos de condiciones/ciclos, cuerpos anidados y avance privado de `Para`.
- `Leer` y argumentos de `Escribir` agrupados en una sola línea.
- Fase omitida ante errores previos, generación completa durante espera de
  entrada/errores runtime, capacidades de salud y contratos HTTP existentes.
- Rechazo de nodos inesperados sin devolver una representación parcial.
- Fallo interno simulado durante generación: HTTP 500, sin cuádruplos parciales
  ni inicio de ejecución.

La suite completa pasa 36 casos: estos 25 y los 11 casos de ciclos descritos abajo.
El contrato de los cuádruplos está en
[código intermedio](../../docs/tecnica/intermediate-code.md).

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
