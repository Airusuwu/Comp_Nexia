# Nexia

Nexia es una propuesta de interfaz accesible y amigable para aprender a
programar mediante pseudocódigo. Su objetivo es presentar las acciones, el
editor, las estructuras del lenguaje y los resultados de una forma clara para
personas con distintos niveles de experiencia.

## Estado del proyecto

El editor permite escribir, seleccionar y pegar código, con numeración de
líneas. El botón existente Ejecutar o `Ctrl+Enter` envía el texto al backend;
realiza análisis léxico, sintáctico y semántico, pero todavía no ejecuta
programas. La terminal muestra el estado real
de la solicitud y los errores, sin borrar el contenido del editor.

Con el foco en el editor, `Ctrl+O` permite abrir un archivo `.txt` UTF-8 de
hasta 64 KiB, con confirmación antes de reemplazar contenido. Guardar,
Aumentar texto, Detener y Escuchar siguen pendientes; no se añadieron botones.

La nueva etapa funcional se desarrolla en `back`. El backend cuenta con una
infraestructura local en Node.js conectada al editor y las tres fases de análisis. Consulta
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
3. Con Node.js 24 instalado, ejecuta `npm.cmd --prefix backend start`.
4. Abre `http://127.0.0.1:3000/` en el navegador de tu PC.

No es necesario instalar paquetes ni compilar. Abrir el HTML directamente
permite editar, pero no comunicarse con el backend. La validación actual se
centra en PC; las comprobaciones móviles quedan aplazadas por decisión de Uriel.

## Ramas de trabajo

- `main` contiene la versión estable.
- `front` contiene el trabajo del frontend.
- `back` contiene el desarrollo funcional en curso.

Los cambios de `front` y `back` se revisarán mediante Pull Requests hacia
`main`. El método de integración acordado es **Squash and merge**.

## Documentación

- [`docs/semantic-analysis.md`](docs/semantic-analysis.md): ámbitos, tipos, inicialización y controles pendientes de ejecución.
- [`docs/syntax-analysis.md`](docs/syntax-analysis.md): gramática aprobada, AST y límites del punto 8.
- [`docs/plan.md`](docs/plan.md): plan histórico de la maqueta visual.
- [`docs/design-guide.md`](docs/design-guide.md): decisiones visuales y adaptables.
- [`docs/CONTEXTO.md`](docs/CONTEXTO.md): estado breve para continuar el trabajo.
- [`GUIA_GIT.md`](GUIA_GIT.md): guía de colaboración.
