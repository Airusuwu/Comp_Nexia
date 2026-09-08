# Nexia

Nexia es una propuesta de interfaz accesible y amigable para aprender a
programar mediante pseudocódigo. Su objetivo es presentar las acciones, el
editor, las estructuras del lenguaje y los resultados de una forma clara para
personas con distintos niveles de experiencia.

## Estado del proyecto

La entrega actual es una **maqueta visual en preparación**. Utiliza HTML y CSS
y no ejecuta, analiza ni guarda programas. Los resultados y errores que se
mostrarán en pantalla serán ejemplos estáticos de demostración.

El backend, la ejecución de pseudocódigo y el resto de las funciones están
fuera del alcance de esta entrega.

## Estructura principal

```text
Comp_Nexia/
├── frontend/
│   ├── index.html
│   └── assets/
│       ├── css/
│       ├── images/
│       ├── icons/
│       └── fonts/
├── backend/
├── docs/
├── GUIA_GIT.md
└── README.md
```

## Cómo revisar el frontend

La interfaz todavía no está construida. Cuando se complete el diseño:

1. Descarga o clona el repositorio.
2. Abre la carpeta `Comp_Nexia`.
3. Abre `frontend/index.html` en un navegador moderno.

No será necesario instalar dependencias ni ejecutar herramientas de compilación.

## Ramas de trabajo

- `main` contiene la versión estable.
- `front` contiene el trabajo del frontend.
- `back` queda reservada para el backend.

Los cambios de `front` y `back` se revisarán mediante Pull Requests hacia
`main`. El método de integración acordado es **Squash and merge**.

## Documentación

- [`docs/plan.md`](docs/plan.md): alcance y orden de implementación.
- [`docs/design-guide.md`](docs/design-guide.md): decisiones visuales y adaptables.
- [`docs/CONTEXTO.md`](docs/CONTEXTO.md): estado breve para continuar el trabajo.
- [`GUIA_GIT.md`](GUIA_GIT.md): guía de colaboración, pendiente del punto 5.
