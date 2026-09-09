# Plan de implementación — Nexia

## Objetivo de la entrega

Preparar el proyecto y terminar una maqueta visual adaptable del frontend. La
entrega de hoy utiliza HTML y CSS; no incluye lógica funcional ni backend.

## Reglas generales

- Implementar el trabajo en el orden acordado y conservar cualquier avance existente.
- No inventar ni redefinir las reglas del pseudocódigo.
- Mantener `main` estable y realizar el diseño en `front`.
- Reservar `back` para el desarrollo posterior del backend.
- Usar commits pequeños y descriptivos, sin credenciales, temporales ni dependencias generadas.
- Proponer los cambios terminados mediante un Pull Request hacia `main`.
- Revisar el Pull Request y usar **Squash and merge**; no integrarlo automáticamente.

## Trabajo autorizado para hoy

### 1. Revisar el entorno

- Confirmar la carpeta raíz `Comp_Nexia`, su contenido y las instrucciones del proyecto.
- Verificar Git, el repositorio local, el acceso a GitHub y los recursos de referencia.
- Solicitar únicamente cualquier dato indispensable que falte.

### 2. Preparar GitHub y las ramas

- Crear o reutilizar el repositorio privado `Comp_Nexia`.
- Conectar la carpeta local y guardar la estructura inicial.
- Mantener las ramas permanentes `main`, `front` y `back`.

### 3. Organizar las carpetas

- Separar `frontend`, `backend` y `docs`.
- Mantener el HTML separado de los estilos generales y de componentes.
- No incorporar frameworks, compiladores ni JavaScript funcional.

### 4. Crear la documentación

- Registrar este plan en `docs/plan.md`.
- Definir las decisiones visuales en `docs/design-guide.md`.
- Mantener el estado de continuidad en `docs/CONTEXTO.md`.
- Explicar el proyecto y su revisión en `README.md`.

### 5. Crear la guía de Git

- Escribir `GUIA_GIT.md` en español para una persona sin experiencia.
- Explicar conceptos, comandos, ramas, Pull Requests, resolución segura de problemas y ejemplos completos.

### 6. Incorporar la referencia visual

- Guardar la imagen facilitada por el usuario como `docs/referencias/nexia-referencia.png`.
- Estudiarla antes de maquetar y usarla como guía, no como sustituto de la interfaz.
- Conservar amarillo y morado oscuro, la composición de paneles, controles grandes y bordes redondeados.
- Aplicar Claymorphism con volumen suave y sombras interiores y exteriores.

### 7. Construir la interfaz visual

- Crear el encabezado con la identidad Nexia y el lema “Programar también es para todos”.
- Crear el panel izquierdo con acciones visuales para ejecutar, detener, escuchar, aumentar texto y guardar.
- Crear un editor central estático con título, ayuda, líneas de muestra, pseudocódigo y una línea resaltada.
- Crear el panel derecho con las estructuras Si–Entonces, Para, Mientras, Repetir, Definir y Función.
- Crear el panel inferior con ejemplos estáticos de resultado correcto y error con número de línea.
- Identificar los controles no disponibles de forma accesible, sin añadir funcionalidad.

### 8. Terminar el diseño adaptable

- Conservar tres columnas en escritorio y un orden claro en tabletas y celulares.
- Evitar desplazamiento horizontal de la página y permitirlo internamente en el editor cuando haga falta.
- Usar variables CSS, iconos consistentes, foco visible y estados de interacción.

### 9. Validar la entrega

- Revisar composición, Claymorphism, paneles, controles, textos e iconos en un navegador.
- Comprobar escritorio, tableta y celular sin superposiciones ni cortes.
- Confirmar que el código está organizado y que no existe lógica funcional o de backend.
- Informar cualquier validación que no se haya podido ejecutar.

### 10. Guardar y entregar

- Guardar el trabajo en `front` y subirlo a GitHub.
- Actualizar `docs/CONTEXTO.md`.
- Dejar un Pull Request hacia `main` listo para revisión, sin integrarlo.
- Resumir implementación, validaciones, pendientes y forma de abrir la maqueta.

## Pendientes para mañana — no implementar hoy

- Revisar las reglas existentes del pseudocódigo y definir el alcance funcional.
- Implementar edición real y numeración dinámica.
- Ejecutar y detener programas con límites para evitar ciclos infinitos.
- Insertar estructuras y generar resultados y errores reales.
- Incorporar lectura por voz y controles reales de tamaño de texto.
- Guardar y abrir programas.
- Definir e implementar backend y almacenamiento, si fueran necesarios.
- Añadir pruebas funcionales y preparar la publicación de la aplicación.

## Criterio de finalización de hoy

La entrega concluye cuando el repositorio y sus ramas están preparados, la
estructura y documentación existen, la guía de Git permite colaborar a un
principiante, la maqueta visual adaptable está terminada en `front` y el
contexto permite retomar el desarrollo mañana.
