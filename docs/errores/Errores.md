# Registro de errores del front

## Alcance

Revisión de los cambios de frontend incorporados en `front` mediante el commit
`b3f1c4b`. Los tres hallazgos y sus correcciones corresponden al frontend. El
problema de entrega del módulo de preferencias se resolvió en `front` al integrar
esa lógica en `editor.js`, sin modificar el backend.

## Errores encontrados y correcciones

### 1. Contador de errores desactualizado al editar

- **Detectado:** 9 de octubre de 2026.
- **Problema:** después de un análisis con errores, al editar el código se
  limpiaban las marcas de error de las líneas, pero el contador conservaba la
  cantidad anterior.
- **Causa:** el manejador de cambios del editor no reiniciaba el contador.
- **Corrección:** al cambiar el código, se limpia el texto y se oculta el contador.

### 2. Cursor de bloque desalineado al cambiar tamaño o fuente

- **Detectado:** 9 de octubre de 2026.
- **Problema:** el ancho de carácter se medía al inicializar el editor y al
  cambiar el zoom de lectura. Si cambiaba el tamaño de la ventana o terminaba
  de cargarse la fuente web, el cursor podía quedar desplazado respecto al texto.
- **Causa:** el ancho medido se almacenaba y no se invalidaba en esos cambios.
- **Corrección:** se vuelve a medir tras redimensionar la ventana y cuando las
  fuentes terminan de cargar. Las actualizaciones se agrupan por cuadro de
  animación para evitar mediciones repetidas durante un mismo redimensionado.

### 3. El servidor no entrega el módulo de preferencias

- **Detectado:** 9 de octubre de 2026.
- **Problema:** el navegador solicita `frontend/assets/js/preferences.mjs` porque
  `editor.js` lo importa como módulo. El servidor local responde `404` y el
  navegador no puede inicializar el editor.
- **Causa:** `backend/src/api/static.js` usa una lista cerrada que solo incluye
  `editor.js`; no contempla la ruta nueva.
- **Corrección:** para no requerir cambios en `back`, se integró la lógica de
  preferencias dentro de `editor.js`, que ya está en la lista de archivos
  estáticos, y se restauró su carga como script clásico. El navegador ya no
  necesita solicitar `preferences.mjs`; la lista cerrada del servidor se conserva.
- **Verificación:** la ruta nueva devolvía `404` antes de retirar la importación.
  Después del ajuste, las pruebas de inicialización y 12 recargas consecutivas
  pasan para los estados visible y minimizado. También pasó la comprobación de
  sintaxis del proyecto.
- **Estado:** resuelto en `front`; no se modificó el backend. La comprobación
  visual en navegador queda pendiente.

## Verificación

La comprobación de sintaxis anterior a estas correcciones había pasado para el
commit revisado. La verificación funcional y visual de estas correcciones queda
pendiente.
