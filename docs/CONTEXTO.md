# Contexto de Nexia

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
