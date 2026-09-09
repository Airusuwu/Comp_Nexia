# Contexto de Nexia

## Estado vigente — punto 3 completado (2026-09-09)

Este registro tiene prioridad sobre los anteriores. El punto 4 no se ha iniciado.

- Rama activa: `back`. Se inició sin cambios locales, después del cierre del
  punto 2 (`7893bf1`). Se conservaron frontend, documentación histórica y PDF.
- Tecnología elegida y justificada antes de crear infraestructura: JavaScript
  con módulos ES y Node.js 24.x. El equipo tiene Node.js 24.11.1 y npm 11.6.2.
  No había decisiones tecnológicas previas para backend. Se utiliza `node:http`
  integrado; no se instalaron dependencias, frameworks ni base de datos.
- `backend/package.json` define arranque y comprobación de sintaxis.
  `backend/src/server.js` arranca en `127.0.0.1:3000`; `src/api/app.js` separa
  la capa HTTP. Solo existe `GET /api/health`, con capacidades de análisis y
  ejecución explícitamente desactivadas. No sirve archivos ni conecta el editor.
- Se reservaron lexer, parser, semantic, types, symbols, diagnostics, runtime
  y tests. Los directorios del lenguaje solo contienen `.gitkeep`; no hay
  analizadores, reglas inventadas ni resultados simulados. `tests/README.md`
  registra cobertura pendiente, no una suite aprobada.
- `backend/README.md` documenta tecnología, arranque, responsabilidades y límites.
  Los componentes del lenguaje serán independientes de HTTP y del DOM; la
  ejecución real deberá interpretar el AST, no utilizar eval/Function.
- Validaciones realizadas: `npm.cmd --prefix backend run check` sin errores;
  comprobación HTTP local con puerto efímero y aserciones de salud 200, JSON,
  capacidades desactivadas, ruta inexistente 404 y método no permitido 405.
  El servidor temporal se cerró al finalizar. Esto no prueba el compilador.
- Se confirmó frontend sin modificaciones y PDF excluido. No se leyó el PDF,
  ni se probaron navegador o lector de pantalla. No hay ejecución de pseudocódigo.
- Cierre mediante commit local sin push. No se actualizó software del equipo.
- Siguiente paso: punto 4, acciones de la barra izquierda. Precisar Guardar y
  Aumentar texto; respetar exclusión de voz. Ejecutar/Detener seguirán pendientes
  de conexión y motor real, sin anunciar funcionamiento inexistente.

## Estado vigente — punto 2 completado (2026-09-09)

Esta sección tiene prioridad sobre los registros históricos posteriores.
El punto 2 abarca revisión y documentación; el punto 3 no se ha iniciado.

### Objetivo y alcance acordados

- Nexia es un compilador educativo orientado a personas con baja visión o
  ceguera. Se conservarán la paleta amarilla/violeta y el diseño existente.
- El objetivo funcional incluye escribir, editar, seleccionar y pegar código,
  analizarlo y ejecutarlo realmente. Uriel aclaró que `Ejecutar` debe realizar
  operaciones, solicitar datos con `Leer` y mostrar salidas de `Escribir`.
- `Detener` debe interrumpir el programa; deben existir límites para evitar
  ciclos infinitos. Un análisis exitoso no equivale a una ejecución realizada.
- No se incorporará dictado ni lectura de voz integrada en esta etapa. Esto
  no excluye la compatibilidad con lectores de pantalla externos.
- Se avanzará por puntos, verificando cada cierre y actualizando este archivo;
  no se tomarán funcionalidades pendientes como si ya estuvieran terminadas.

### Revisión y estado real del código

- Se revisaron README, el plan histórico, la guía de diseño, este contexto,
  las secciones de colaboración de la guía Git y el HTML; se inspeccionaron
  los estilos de paleta, foco, editor y adaptación de pantalla.
- `frontend/index.html` no carga scripts. El editor es una lista estática;
  los cinco botones de acciones y los seis de estructuras están marcados
  con `aria-disabled="true"`. No existe edición, envío ni ejecución real.
- La terminal contiene resultados y errores fijos de demostración. No deben
  reutilizarse como pruebas de resultados correctos del futuro motor.
- `backend/` contiene únicamente `.gitkeep`; no hay tecnología configurada,
  API, analizadores, motor, almacenamiento ni pruebas automatizadas.
- No se encontró una gramática completa en los documentos de texto revisados.
  La muestra visual usa `←`, mientras que el plan nuevo exige `<-`: no se
  asumirá que ambas formas son válidas sin una regla explícita.

### Decisiones vigentes y cambios respecto de la maqueta

- La rama activa es `back`, no `front`. El punto 1 quedó registrado en
  `24affcc`; `main` contiene el frontend integrado en `aade6e8`.
- Las restricciones históricas de no añadir JavaScript ni backend eran de
  la entrega visual. La nueva etapa sí contempla funcionalidad, pero todavía
  no se ha implementado ni seleccionado una tecnología.
- La indicación antigua de editar solo backend desde `back` se sustituye
  para esta etapa: los cambios de interfaz se harán en `frontend/`, aun
  trabajando en `back`. No se mezclará código de interfaz en `backend/`.
- La voz prevista en los pendientes antiguos queda fuera de esta etapa;
  `Escuchar resultado` no se habilitará como si ya tuviera funcionamiento.
- La aclaración de Uriel amplía el plan original de análisis con un motor de
  ejecución real. Su integración y pruebas deben planificarse explícitamente
  después del análisis semántico, antes de declarar cumplido ese objetivo.
- La tecnología se seleccionará y justificará en el punto 3 antes de añadir
  dependencias. Se separarán comunicación, léxico, sintaxis, semántica/tipos,
  símbolos, diagnósticos, pruebas y, por el alcance ampliado, ejecución.
- Se mantienen commits claros en `back`, revisión mediante Pull Request y
  Squash and merge. No se hará integración automática ni reescritura destructiva.

### Recorrido pendiente y criterios de implementación

1. Punto 3: justificar la tecnología y organizar módulos conforme se necesiten.
2. Punto 4: conectar acciones definidas sin inventar comportamientos. Precisar
   destino/formato de Guardar y alcance/límites de Aumentar texto. Ejecutar y
   Detener solo podrán darse por terminados con el motor real disponible.
3. Punto 5: editor editable y comunicación con respuesta estructurada de estado,
   resultados y diagnósticos (mensaje, etapa, línea y columna cuando corresponda).
   Conservar código ante errores y comunicar vacío, procesamiento y fallos de
   conexión. Señalar errores con inversión de colores y texto accesible.
4. Punto 6: solicitar la lectura del PDF local `docs/A5 Reglas de tipos de datos.pdf`
   en ese momento, contrastarlo con el plan y centralizar compatibilidad de tipos.
   El PDF está excluido de Git y NO se ha leído; otro equipo deberá recibirlo
   por separado. No estará disponible al clonar el repositorio.
5. Punto 7: tokens con categoría, texto original y ubicación; errores léxicos
   para símbolos y literales inválidos, sin validar tipos en esta fase.
6. Punto 8: gramática y AST con precedencia y paréntesis. Consultar lo que falte
   sobre literales, mayúsculas, ámbitos, delimitadores y estructuras, sin
   presentar propuestas como reglas aprobadas. Los iconos no definen sintaxis.
7. Punto 9: semántica y tabla de símbolos, distinguiendo comprobaciones estáticas
   de controles en ejecución. La inicialización debe considerar condicionales
   y ciclos; los valores recibidos con Leer requieren validación en ejecución.
8. Alcance ampliado: motor de ejecución con entrada/salida, controles de tipos
   y división/módulo por cero, detención real y límites. Aún no está implementado.
9. Punto 10 y cada cierre: casos válidos e inválidos, recorrido editor-backend,
   pruebas de ejecución, teclado y lector de pantalla; documentar resultados
   reales y limitaciones antes de proponer la integración.

El punto 6 deberá contrastar con el PDF estos requisitos del plan: ENTERO,
REAL, TEXTO, CARACTER y BOOLEANO; división numérica con resultado REAL; orden
numérico e igualdad compatible; Y/O/NO booleanos; asignación `<-` con promoción
ENTERO a REAL, nunca inversa; concatenación solo TEXTO con TEXTO; Leer compatible
y Escribir con varios valores; declaración previa, tipo fijo y sin redeclaración
en el mismo ámbito; condiciones booleanas en Si/Mientras; módulo entero;
prohibición de división/módulo por cero y uso sin inicializar; literales,
operadores unarios y agrupación. No heredar conversiones del lenguaje anfitrión.
Esta lista registra el plan, no afirma que el PDF ya haya sido verificado.

### Validaciones y siguiente paso

- Se confirmó inicio limpio en `back` y exclusión del PDF con `git check-ignore`.
- Esta etapa solo cambia documentación; no se ejecutaron pruebas funcionales,
  navegador ni lector de pantalla. Las validaciones históricas no certifican
  accesibilidad ni funcionamiento de características todavía inexistentes.
- Se registrará el cierre en un commit local sin push. No se han cambiado
  archivos de aplicación, instalado dependencias ni leído el PDF.
- Siguiente paso: punto 3, revisar el entorno técnico y justificar la tecnología
  del backend antes de introducir dependencias o crear módulos.

## Actualización — etapa funcional, punto 1 (2026-09-09)

Esta sección actualiza el estado vigente; las secciones posteriores conservan
los antecedentes de la maqueta y no describen necesariamente el estado actual
de las ramas.

- Objetivo acordado: habilitar edición, análisis léxico, sintáctico y semántico,
  y ejecución real de pseudocódigo con `Leer`, `Escribir` y detención del programa.
- Solo se ha autorizado e implementado el punto 1 de preparación; no se ha
  iniciado la implementación funcional ni se han introducido dependencias.
- Se revisaron las instrucciones disponibles, este contexto y el estado local.
  Al iniciar, la rama era `front` y el único archivo no rastreado era el PDF A5;
  no había modificaciones en archivos rastreados.
- Se excluyó `/docs/A5 Reglas de tipos de datos.pdf` mediante `.gitignore`.
  El PDF permanece local y no se ha leído: su análisis queda para el punto 6.
- Se actualizaron las referencias mediante `git fetch origin`. Se comprobó
  que `origin/main` contiene el frontend de `front` sin diferencias, en el
  commit `aade6e8` (`Merge pull request #1 from Airusuwu/front`). Esto reemplaza
  el antecedente de que el frontend todavía no estaba integrado en `main`.
- `main` local se actualizó mediante avance rápido desde `origin/main` y
  `back` incorporó `main` también mediante avance rápido, sin conflictos.
  La exclusión del PDF se conservó durante ambos cambios de rama.
- Rama de trabajo vigente: `back`. No se modificó el código del frontend ni
  del backend, no se sobrescribió trabajo y no se creó un nuevo Pull Request.
- Validaciones: exclusión del PDF con `git check-ignore`, comparación del
  frontend entre ramas y comprobación de los avances rápidos de Git.
  No se ejecutaron pruebas funcionales: esta etapa solo prepara el repositorio.
- El cierre se registra en un commit local; no se realiza push en este punto.
- Próximo paso: punto 2, revisar la documentación para la nueva etapa y
  ampliar el contexto. Siguen pendientes tecnología, gramática completa,
  reglas del PDF, analizadores, motor de ejecución y pruebas de accesibilidad.
- La futura integración conserva el flujo acordado de Pull Request y
  Squash and merge; no se integra automáticamente a `main`.

## Propósito y alcance actual

Nexia será una interfaz accesible para escribir y ejecutar pseudocódigo. La
entrega actual es únicamente una maqueta visual adaptable con HTML y CSS; no
incluye JavaScript funcional ni backend.

## Tecnologías y estructura

- HTML semántico en `frontend/index.html`.
- CSS general en `frontend/assets/css/base.css`.
- CSS de interfaz en `frontend/assets/css/components.css`.
- Recursos estáticos en `frontend/assets/`.
- Documentación en `docs/` y backend reservado en `backend/`.

## Flujo de ramas

- `main`: versión estable.
- `front`: frontend y documentación relacionada; es la rama activa.
- `back`: backend y documentación relacionada.
- Los cambios terminados se proponen mediante Pull Request hacia `main` y se revisan antes de usar **Squash and merge**.

## Estado actual

- Repositorio privado: `https://github.com/Airusuwu/Comp_Nexia`.
- Rama activa: `front`, sincronizada con `origin/front` al iniciar esta mejora.
- Último commit relevante disponible al iniciar las mejoras: `60a2056 docs: registrar cierre y mejoras pendientes`.
- Estructura inicial y exclusiones de Git creadas.
- Documentación del punto 4 completada.
- `GUIA_GIT.md` completada para el flujo de colaboración del proyecto.
- Referencia visual guardada sin cambios en `docs/referencias/nexia-referencia.png`.
- Referencia analizada y guía de diseño ajustada a su paleta, composición y jerarquía.
- Maqueta visual de escritorio implementada con HTML y CSS.
- Encabezado, acciones, editor, estructuras, resultado y error incluidos como contenido estático.
- Diseño adaptable completado para escritorio, tableta y celular.
- Estados de `hover`, foco y pulsación definidos; movimiento reducido respetado.
- Validación visual y técnica del punto 9 completada sin defectos bloqueantes.
- No existe JavaScript ni lógica funcional o de backend.
- No hay cambios integrados en `main` después del commit inicial.
- El usuario decidió no abrir todavía el Pull Request porque realizará mejoras adicionales.
- El trabajo continúa en `front`; no se creó ni integró ningún Pull Request.
- Se eliminaron del encabezado los controles decorativos de minimizar, maximizar y cerrar, junto con sus SVG y estilos sin uso.

## Validaciones y pendientes

- Se verificó que `main`, `front` y `back` existen localmente y en GitHub.
- La referencia mide 1672 × 941 px y su copia coincide con el archivo recibido.
- La revisión por localhost solicitada por el usuario quedó completada y verificada.
- Se comprobaron 1440 × 900, 1024 × 768 y 390 × 844 en un navegador.
- No se detectó desplazamiento horizontal global; el editor usa desplazamiento interno en celular.
- Se confirmó foco visible mediante teclado y controles anunciados como no disponibles.
- La comparación final también se realizó a 1672 × 941, tamaño de la referencia.
- No se detectaron textos cortados, superposiciones, identificadores duplicados ni errores de consola.
- Las dos hojas CSS respondieron con HTTP 200 y los 19 usos de iconos SVG resolvieron correctamente.
- La revisión confirmó 0 scripts y un backend reservado únicamente con `.gitkeep`.
- La revisión de navegador se realizó en Edge/Chromium; no se ejecutaron pruebas en Firefox o Safari ni una auditoría WCAG completa.

## Próximos pasos

1. Recopilar e implementar las mejoras adicionales indicadas por el usuario en `front`.
2. Repetir las validaciones visuales y técnicas después de los cambios.
3. Actualizar este contexto y confirmar que `front` esté sincronizada con GitHub.
4. Abrir el Pull Request de `front` hacia `main` únicamente cuando el usuario lo autorice.
5. Mantener pendiente la integración y usar **Squash and merge** después de la revisión.
