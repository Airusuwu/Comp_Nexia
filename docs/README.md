# Documentación de Nexia

Índice de documentos agrupados por su propósito. Las rutas de los ejemplos de
terminal se interpretan desde la raíz del repositorio, salvo indicación contraria.

## Organización

| Carpeta | Contenido |
| --- | --- |
| `proyecto/` | Planificación inicial y decisiones de diseño. |
| `contexto/` | Historial y contexto para continuar el trabajo en otro chat de Codex. |
| `guias/` | Instrucciones para aprender a utilizar el lenguaje. |
| `tecnica/` | Reglas, analizadores, errores y motor de ejecución. |
| `pruebas/` | Evidencias de validación y pendientes de QA. |
| `sprints/` | Entregables, resultados y pendientes de cada sprint. |
| `referencias/` | Imagen de referencia y PDF A5 local, excluido de Git. |

## Proyecto

- [Plan inicial de la maqueta](proyecto/plan.md): documento histórico, no el alcance funcional actual.
- [Guía de diseño](proyecto/design-guide.md): paleta, composición y referencia visual.
- [Inicio y requisitos](../README.md): cómo levantar la aplicación.
- [Colaboración con Git](../GUIA_GIT.md): ramas y flujo de integración.

## Continuar en otro chat

1. Leer [CONTEXTO.md](contexto/CONTEXTO.md), empezando por las secciones recientes.
2. Comprobar la rama y los cambios locales antes de modificar archivos.
3. Consultar el sprint y los documentos técnicos relacionados con la tarea.
4. Actualizar el contexto al terminar, conservando los antecedentes.

Las notas históricas pueden describir funciones que entonces estaban pendientes.
No deben tomarse como el estado actual sin contrastarlas con el código y Git.

## Guías de uso

- [Guía de programación para principiantes](guias/guia-programacion.md).

## Documentación técnica

- [Reglas de tipos](tecnica/type-rules.md).
- [Análisis léxico](tecnica/lexical-analysis.md).
- [Análisis sintáctico y AST](tecnica/syntax-analysis.md).
- [Análisis semántico](tecnica/semantic-analysis.md).
- [Motor de ejecución](tecnica/runtime.md).
- [Cómo se detectan los errores](tecnica/errores-lexicos-semanticos.md).
- [Guía del código del backend](../backend/GUIA_CODIGO.md).
- [Configuración y API del backend](../backend/README.md).

## Pruebas y entregables

- [Verificación integral](pruebas/verification.md).
- [Sprint 0 — Primer entregable](sprints/Sprint%200.md).

Los futuros entregables se agregarán en `sprints/`, sin reemplazar los anteriores.

## Referencias

- [Imagen de referencia](referencias/nexia-referencia.png).
- PDF local: `docs/referencias/A5 Reglas de tipos de datos.pdf`. No se publica
  en Git ni es necesario para ejecutar Nexia; sus reglas implementadas están
  descritas en la documentación técnica.

El contenido que antes estaba en este README se conserva completo en
[Cómo se detectan los errores](tecnica/errores-lexicos-semanticos.md).
