# Contexto de Nexia

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
- Último commit relevante al iniciar esta mejora: `fa29482 feat: construir maqueta visual de Nexia`.
- Estructura inicial y exclusiones de Git creadas.
- Documentación del punto 4 completada.
- `GUIA_GIT.md` completada para el flujo de colaboración del proyecto.
- Referencia visual guardada sin cambios en `docs/referencias/nexia-referencia.png`.
- Referencia analizada y guía de diseño ajustada a su paleta, composición y jerarquía.
- Maqueta visual de escritorio implementada con HTML y CSS.
- Encabezado, acciones, editor, estructuras, resultado y error incluidos como contenido estático.
- Diseño adaptable completado para escritorio, tableta y celular.
- Estados de `hover`, foco y pulsación definidos; movimiento reducido respetado.
- No existe JavaScript ni lógica funcional o de backend.
- No hay cambios integrados en `main` después del commit inicial.

## Validaciones y pendientes

- Se verificó que `main`, `front` y `back` existen localmente y en GitHub.
- La referencia mide 1672 × 941 px y su copia coincide con el archivo recibido.
- La revisión por localhost solicitada por el usuario quedó completada y verificada.
- Se comprobaron 1440 × 900, 1024 × 768 y 390 × 844 en un navegador.
- No se detectó desplazamiento horizontal global; el editor usa desplazamiento interno en celular.
- Se confirmó foco visible mediante teclado y controles anunciados como no disponibles.
- Falta realizar la validación final completa del punto 9.

## Próximos pasos

1. Realizar la validación final visual y técnica del punto 9.
2. Corregir cualquier diferencia o problema detectado.
3. Actualizar el contexto y preparar la entrega en GitHub.
