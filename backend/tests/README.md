# Pruebas del backend

Ejecuta la suite persistente desde la raíz con `npm.cmd --prefix backend test`.
No requiere dependencias externas ni ocupa el puerto de desarrollo: inicia el
servidor en un puerto local efímero y prueba los contratos de análisis y ejecución.

## Plan de pruebas de ejecución y optimización — 2026-10-11

**Objetivo:** comprobar que el motor de cuádruplos conserva el comportamiento
del lenguaje y que optimizar cambia la representación sin alterar resultados,
errores, entradas ni el presupuesto de pasos.

| Etapa | Archivo | Casos | Criterio |
| --- | --- | ---: | --- |
| Regresión de generación/API | `intermediate.test.mjs` | 25 | Contratos previos, literales, referencias y fallos de generación conservados. |
| Regresión de ciclos | `loops.test.mjs` | 11 | `Para` y `Repetir` mantienen su semántica a través de HTTP. |
| Equivalencia de ejecución | `intermediate-runtime.test.mjs` | 75 | AST de referencia, IR original e IR optimizado coinciden en resultados, estados, diagnósticos, ubicación, entrada y pasos. |
| Optimizador y contrato ejecutable | `optimization.test.mjs` | 26 | Transformaciones seguras, determinismo, IR inmutable, metadatos y rechazo de IR inválido. |
| Integración de ejecución/optimización | `intermediate-api.test.mjs` | 23 | API usa cuádruplos, permite desactivar optimización y conserva aislamiento, replay y manejo de errores. |
| **Total backend** | | **160** | **160 aprobados; 0 fallos, omisiones o cancelaciones.** |

### Casos de equivalencia

- Operadores aritméticos, comparaciones, Y/O/NO, unarios, precedencia,
  paréntesis, cinco tipos y promoción ENTERO a REAL.
- Ramas verdaderas/falsas, Mientras, Para y Repetir, combinaciones anidadas,
  homónimos, variables locales, límites capturados una vez y avance privado de Para.
- `Leer` para los cinco tipos, entradas inválidas, espera y replay con dos
  lecturas, lectura dentro de ciclos y salidas agrupadas sin duplicados.
- Divisor cero, rango numérico, subdesbordamiento de literal REAL, texto excesivo,
  errores de ambas partes de una expresión y evaluación estricta de Y/O.
- Ubicaciones completas de diagnóstico, incluidas columnas UTF-16 con emoji,
  tabulador y finales CRLF. Una línea incompleta de Escribir no se publica.
- Límites: 100 lecturas, 1000 líneas, 65536 unidades UTF-16, 50000 pasos y
  dos segundos; cancelación previa, durante un ciclo y ante IR sin TICK.

`helpers/compilation.mjs` exige que los programas de prueba superen lexer,
parser y semántica antes de generar IR. Cada escenario comprueba resultados
esperados explícitos y compara los tres motores. Se excluye de esa igualdad
solo `instructions`, porque la optimización puede reducir el trabajo real.
La cancelación cooperativa comprueba estado y salidas; no exige un paso exacto
porque el momento de atender una señal depende del despacho.

### Casos de optimización y API

- Plegado y propagación de constantes, eliminación de copias constantes sin
  lectores, conservación de TICK y temporales usados después de etiquetas.
- Tipos y cero negativo en JSON; errores constantes conservados para runtime,
  incluidos errores de ramas inactivas. No se elimina la evaluación de `x * 0`.
- 80 programas adicionales generados con semilla fija, mezclando operaciones
  constantes y entradas. Estos escenarios están dentro de un caso automatizado;
  no se suman nuevamente al total de 160 pruebas.
- Rechazo de versión 1 para ejecución, operaciones/referencias/tipos/ubicaciones
  inválidos, etiquetas duplicadas, metadatos faltantes y lecturas sin inicializar.
- `optimize: true` por defecto y `false`, análisis sin ejecutar, IR determinista
  en replay, errores HTTP 400/422/500 y ausencia de datos parciales ante fallos internos.
- Dos comprobaciones de que no se llama al intérprete AST; una marca de prueba
  inyectada solo en IR optimizado confirma que la API ejecuta esa representación.
- Ocho solicitudes simultáneas con entradas/opciones diferentes y cancelación
  de una petición HTTP sin perder disponibilidad del servidor.

### Ejecución y resultado

Desde la raíz, en Node.js 24.11.1 y npm 11.6.2:

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix backend run check
node --test frontend/tests/preferences.test.mjs
git diff --check
```

Los cuatro comandos pasan. Las pruebas del frontend conservan sus ocho casos
de preferencias y apertura de archivos, sin cambios de código en frontend.
Los ensayos HTTP usan puertos efímeros y cierran sus servidores; no requieren
ni reinician el servidor de desarrollo en el puerto 3000.

El límite de pasos se prueba con reloj fijo para que la velocidad del equipo
no cambie el resultado. El límite de tiempo se prueba mediante reloj simulado;
no es una medición de rendimiento real ni de latencia del botón Detener.

Evidencia y alcance en [verificación de cuádruplos](../../docs/pruebas/intermediate-runtime.md).
La revisión visual del navegador y con lector de pantalla queda fuera de estas suites.

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

Estas suites previas aportan 36 de los 160 casos actuales: 25 de generación/API
y 11 de ciclos. También pasan con el nuevo motor conectado a la API.
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
