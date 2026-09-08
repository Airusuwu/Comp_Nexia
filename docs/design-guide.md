# Guía de diseño — Nexia

## Referencia principal

La referencia visual principal será
`docs/referencias/nexia-referencia.png`. La imagen aún no ha sido facilitada,
por lo que los valores de esta guía son una base provisional derivada del plan.
Antes de maquetar se deberá guardar y estudiar la imagen, y ajustar los valores
que no coincidan con ella.

La referencia debe orientar la composición y el lenguaje visual. No se usará
como una captura única que sustituya los elementos HTML.

## Dirección visual

- Apariencia amable, clara e inclusiva para aprender programación.
- Amarillo como color enérgico principal y morado oscuro como base de contraste.
- Claymorphism mediante superficies redondeadas, volumen suave y combinación de sombras exteriores e interiores.
- Controles grandes, legibles y fáciles de reconocer.

## Colores provisionales

| Uso | Variable propuesta | Valor inicial |
| --- | --- | --- |
| Fondo principal | `--color-bg` | `#F5C842` |
| Superficie amarilla | `--color-surface` | `#FFD95A` |
| Morado principal | `--color-primary` | `#35245F` |
| Morado profundo | `--color-primary-deep` | `#24163F` |
| Texto sobre amarillo | `--color-text` | `#261B3F` |
| Texto sobre morado | `--color-text-inverse` | `#FFFFFF` |
| Éxito | `--color-success` | `#287A55` |
| Error | `--color-error` | `#B53B45` |
| Foco | `--color-focus` | `#1769E0` |

Los contrastes deberán verificarse después de comparar esta paleta con la imagen.

## Tipografía

- Usar una familia sans serif del sistema para la interfaz, con alternativas seguras y sin dependencias externas.
- Usar una familia monoespaciada del sistema para el pseudocódigo y los números de línea.
- Mantener un tamaño base mínimo de `16px` y una altura de línea aproximada de `1.5`.
- Diferenciar títulos, ayudas y etiquetas principalmente con tamaño y peso, no solo mediante color.

## Espaciado y composición

- Utilizar una escala basada en `4px`: 4, 8, 12, 16, 24 y 32px.
- Mantener tres columnas en pantallas amplias: acciones, editor y estructuras.
- Colocar resultados y errores debajo del editor.
- Mantener separación suficiente para que las sombras no mezclen los paneles.
- En pantallas estrechas, apilar los bloques siguiendo el orden encabezado, acciones, editor, estructuras y resultados.

## Bordes y sombras

- Usar radios amplios entre `16px` y `28px`; los controles pequeños pueden usar radios menores.
- Evitar bordes duros cuando la separación pueda lograrse con contraste y profundidad.
- Definir sombras mediante variables CSS para mantener consistencia.
- Combinar una sombra exterior suave con brillos y sombras interiores discretos.
- Reducir las sombras en pantallas pequeñas si afectan la legibilidad o el espacio disponible.

## Iconos

- Utilizar iconos SVG simples y consistentes, acompañados por etiquetas visibles cuando representen acciones.
- Evitar emojis como sustitutos de iconos.
- Tratar los iconos decorativos como no anunciables para lectores de pantalla.
- No depender únicamente del icono o del color para comunicar el estado de un control.

## Estados de los controles

- Definir estados visuales de reposo, `hover`, foco y pulsación.
- Mantener un indicador de foco visible con contraste suficiente.
- Los controles sin funcionalidad deberán conservar su apariencia demostrativa e indicar accesiblemente que todavía no están disponibles.
- No simular que una acción se ejecutó cuando todo el contenido es estático.

## Comportamiento adaptable

- Escritorio: conservar las tres columnas y priorizar el área del editor.
- Tableta: permitir una reorganización en dos columnas sin perder el orden de lectura.
- Celular: usar una sola columna y controles cómodos para interacción táctil.
- Evitar el desplazamiento horizontal global; el contenido extenso del editor podrá desplazarse dentro de su propio panel.
- Impedir textos cortados, controles superpuestos y áreas táctiles demasiado pequeñas.

## Validación pendiente

Cuando la referencia esté disponible, se deberán confirmar la paleta exacta,
las proporciones de los paneles, los radios, las sombras, la tipografía, los
iconos y el comportamiento en escritorio, tableta y celular.
