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
- Último commit relevante al iniciar esta mejora: `01dec13 docs: crear guía de colaboración con Git`.
- Estructura inicial y exclusiones de Git creadas.
- Documentación del punto 4 completada.
- `GUIA_GIT.md` completada para el flujo de colaboración del proyecto.
- Referencia visual guardada sin cambios en `docs/referencias/nexia-referencia.png`.
- Referencia analizada y guía de diseño ajustada a su paleta, composición y jerarquía.
- No hay interfaz implementada ni lógica funcional.
- No hay cambios integrados en `main` después del commit inicial.

## Validaciones y pendientes

- Se verificó que `main`, `front` y `back` existen localmente y en GitHub.
- La referencia mide 1672 × 941 px y su copia coincide con el archivo recibido.
- Falta construir la interfaz y validarla en un navegador.

## Próximos pasos

1. Implementar la interfaz estática con HTML y CSS en `front`.
2. Compararla visualmente con la referencia en escritorio.
3. Validar su adaptación a tableta y celular.
