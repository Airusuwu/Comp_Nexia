# Nexia

Nexia es una propuesta de interfaz accesible y amigable para aprender a
programar mediante pseudocódigo. Su objetivo es presentar las acciones, el
editor, las estructuras del lenguaje y los resultados de una forma clara para
personas con distintos niveles de experiencia.

## Estado del proyecto

La entrega actual es una **maqueta visual estática y adaptable**. Utiliza HTML
y CSS y no ejecuta, analiza ni guarda programas. Los resultados y errores
mostrados en pantalla son ejemplos estáticos de demostración.

La nueva etapa funcional se desarrolla en `back`. El backend cuenta con una
infraestructura local en Node.js y una ruta de salud, pero todavía no analiza
ni ejecuta pseudocódigo y no está conectado al editor. Consulta
[`backend/README.md`](backend/README.md) para iniciarlo y conocer sus límites.

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

1. Descarga o clona el repositorio.
2. Abre la carpeta `Comp_Nexia`.
3. Abre `frontend/index.html` en un navegador moderno.

Para revisar esta maqueta no será necesario instalar dependencias ni ejecutar herramientas de compilación.
La distribución se adapta a escritorio, tableta y celular.

## Ramas de trabajo

- `main` contiene la versión estable.
- `front` contiene el trabajo del frontend.
- `back` contiene el desarrollo funcional en curso.

Los cambios de `front` y `back` se revisarán mediante Pull Requests hacia
`main`. El método de integración acordado es **Squash and merge**.

## Documentación

- [`docs/plan.md`](docs/plan.md): plan histórico de la maqueta visual.
- [`docs/design-guide.md`](docs/design-guide.md): decisiones visuales y adaptables.
- [`docs/CONTEXTO.md`](docs/CONTEXTO.md): estado breve para continuar el trabajo.
- [`GUIA_GIT.md`](GUIA_GIT.md): guía de colaboración.
