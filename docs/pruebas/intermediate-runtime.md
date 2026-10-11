# Verificación de ejecución de cuádruplos y optimización

**Fecha:** 11 de octubre de 2026. **Rama:** `back`.
**Entorno:** Windows/PowerShell, Node.js 24.11.1, npm 11.6.2.

## Objetivo y método

Validar el cambio de ejecución del AST a una máquina de cuádruplos y la
optimización conservadora habilitada por defecto. El plan reproducible está
en [pruebas del backend](../../backend/tests/README.md).

Para programas válidos se generan cuádruplos originales y optimizados. Sus
ejecuciones se comparan con el intérprete AST de referencia y con resultados
esperados explícitos. Se comprueban estado, salidas, diagnósticos completos,
ubicación, solicitudes de entrada y pasos de origen. El conteo de cuádruplos
despachados puede variar; el presupuesto de pasos no aumenta al optimizar.

## Resultado

| Comprobación | Resultado |
| --- | --- |
| `npm.cmd --prefix backend test` | 160 pruebas, 11 suites; 160 aprobadas, 0 fallos, 0 omisiones y 0 cancelaciones. |
| `npm.cmd --prefix backend run check` | Sintaxis correcta en todos los módulos incluidos. |
| `node --test frontend/tests/preferences.test.mjs` | 8 pruebas aprobadas; sin fallos. |
| `git diff --check` | Sin errores de espacios en los cambios rastreados. |

Se añadieron 124 pruebas de backend a las 36 existentes: 75 del motor,
26 del optimizador/contrato y 23 de API. Dentro de un caso del optimizador
se compararon además 80 programas con semilla fija, tanto constantes como
con entradas. No se reproducen nuevos defectos del motor u optimizador en
estos escenarios; esta etapa añadió pruebas y documentación sin cambiar
su implementación de producción.

## Evidencia de optimización

Programa:

```text
Inicio
Escribir 2 + 3 * 4
Fin
```

| Motor | Salida | Pasos de origen | Cuádruplos despachados |
| --- | --- | ---: | ---: |
| AST de referencia | `14` | 6 | No aplica |
| IR original | `14` | 6 | 14 |
| IR optimizado | `14` | 6 | 9 |

El optimizador informa dos expresiones plegadas, cinco operandos propagados
y cinco instrucciones eliminadas. El IR original se conserva sin cambios.
La reducción de cuádruplos es evidencia de menor trabajo en este ejemplo;
no representa una garantía de velocidad para cualquier programa.

## Cobertura

- Cinco tipos, todos los operadores del lenguaje, promoción permitida,
  precedencia, asociatividad y agrupación.
- Si/Sino, Mientras, Para y Repetir, bloques anidados, homónimos, variables
  locales, captura única de límites y contador independiente del avance de Para.
- Lecturas válidas/inválidas, espera, replay, Unicode y salidas agrupadas.
- Errores numéricos y de divisor/texto, evaluación izquierda antes de derecha,
  Y/O sin cortocircuito, ubicaciones UTF-16 y conservación de salidas anteriores.
- Fronteras de 100 lecturas, 1000 líneas y 65536 unidades UTF-16; presupuesto
  de 50000 pasos, límite de tiempo y cancelación cooperativa.
- Determinismo, idempotencia, conservación de mapas/temporales, cero negativo,
  IR inválido y operaciones que deben continuar fallando únicamente en runtime.
- API con/sin optimización, prueba de consumo real del IR y ausencia de ejecución
  AST, fallos internos sin fallback, solicitudes concurrentes y cancelación HTTP.

## Alcance y límites de la evidencia

Las suites prueban módulos y API local con puertos efímeros; no ocupan el
puerto de desarrollo. El reloj se simula para aislar la prueba de tiempo y
el presupuesto de pasos. La cancelación durante un ciclo se comprueba usando
señales y cesión real del turno a Node, sin exigir un paso fijo de interrupción.

Las ocho pruebas del frontend comprueban preferencias y apertura de archivos
con su entorno simulado. No se realizó una revisión visual en navegador,
una auditoría con lector de pantalla ni un benchmark de rendimiento.
Las comprobaciones cubren los escenarios descritos, no todas las posibles
combinaciones de programas y entradas del lenguaje.
