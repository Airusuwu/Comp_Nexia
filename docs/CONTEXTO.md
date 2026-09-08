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
- Último commit base: `6a8dadc chore: preparar estructura inicial del proyecto`.
- Estructura inicial y exclusiones de Git creadas.
- Documentación del punto 4 completada en esta mejora.
- No hay interfaz implementada ni lógica funcional.
- No hay cambios integrados en `main` después del commit inicial.

## Validaciones y pendientes

- Se verificó que `main`, `front` y `back` existen localmente y en GitHub.
- La imagen `docs/referencias/nexia-referencia.png` aún no ha sido facilitada.
- Falta crear `GUIA_GIT.md`, estudiar la referencia, construir la interfaz y validarla en un navegador.

## Próximos pasos

1. Completar `GUIA_GIT.md`.
2. Recibir y guardar la imagen de referencia.
3. Ajustar la guía visual a la referencia antes de maquetar.
4. Implementar y validar la interfaz en `front`.
