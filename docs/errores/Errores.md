# Registro de errores del front

## Alcance

Revisión de los cambios de frontend incorporados en `front` mediante el commit
`b3f1c4b`. Los problemas y las correcciones de este registro corresponden al
editor web; no fue necesario modificar el backend.

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

## Verificación

La comprobación de sintaxis anterior a estas correcciones había pasado para el
commit revisado. La verificación funcional y visual de estas correcciones queda
pendiente.
