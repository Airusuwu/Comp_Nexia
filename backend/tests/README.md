# Estado de pruebas

Esta carpeta reserva las pruebas del backend y del lenguaje. Todavía no hay
una suite automatizada ni un comando `npm test`; no interpretar su ausencia
como una validación satisfactoria del compilador.

Los módulos ya tienen comprobaciones ejecutadas en terminal, documentadas por
etapa. En el punto 10 se verificaron 26 programas con 140 aserciones de API y
el flujo real en Edge PC; no se conservaron los scripts temporales como suite.
Véase [verificación integral](../../docs/verification.md) para casos repetibles,
resultados y limitaciones. El PDF A5 continúa ignorado por Git.

Pendientes: lector de pantalla real, selector de archivos, suite persistente,
entrada/salida real, detención y límites del futuro motor. No presentar estas
funciones como verificadas: actualmente solo existe análisis del programa.
