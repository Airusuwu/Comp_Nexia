# Guía de diseño — Nexia

## Referencia principal

La referencia visual principal es
`docs/referencias/nexia-referencia.png`. Es una imagen PNG de 1672 × 941 px,
con proporción cercana a 16:9. Fue recibida, guardada sin cambios y estudiada
antes de comenzar la maquetación.

La referencia debe orientar la composición y el lenguaje visual. No se usará
como una captura única que sustituya los elementos HTML.

## Dirección visual

- Apariencia enérgica, amable y de alto contraste para aprender programación.
- Amarillo luminoso como superficie dominante y morado profundo para el fondo, los bordes, los textos y los controles.
- Claymorphism mediante paneles amarillos redondeados, resplandor suave, sombra morada exterior y relieve interior.
- Botones morados grandes con iconos y etiquetas amarillas.
- Trazos oscuros consistentes que separan cada región sin perder el volumen suave.

## Colores extraídos de la referencia

| Uso | Variable propuesta | Valor de referencia |
| --- | --- | --- |
| Fondo exterior | `--color-bg` | `#1E0D42` |
| Amarillo principal | `--color-surface` | `#FEE705` |
| Amarillo secundario | `--color-surface-deep` | `#F9E202` |
| Morado de controles | `--color-primary` | `#1D0B3D` |
| Morado resaltado | `--color-primary-soft` | `#250D49` |
| Morado del panel de error | `--color-primary-deep` | `#2A0942` |
| Texto sobre amarillo | `--color-text` | `#110F39` |
| Texto sobre morado | `--color-text-inverse` | `#FFFFFF` |
| Texto e iconos amarillos | `--color-accent` | `#FFED03` |
| Error coral | `--color-error` | `#F75947` |
| Foco accesible | `--color-focus` | `#FFFFFF` |

Los valores representan muestras de zonas planas de la imagen. Para reproducir
su volumen se podrán usar variaciones cercanas dentro de gradientes y sombras,
manteniendo siempre el contraste entre amarillo y morado.

## Tipografía

- Usar una familia sans serif gruesa y compacta para marca, títulos, botones y resultados, con alternativas del sistema y sin dependencias externas.
- Usar una familia monoespaciada de peso medio o alto para el pseudocódigo y los números de línea.
- Reservar cursiva para la ayuda “Escribe tu programa aquí”, como en la referencia.
- Mantener un tamaño base mínimo de `16px` y una altura de línea aproximada de `1.4`.
- Usar mayúsculas en encabezados de panel y acciones principales; mantener el lema y la ayuda en caja normal.
- Diferenciar títulos, ayudas y etiquetas mediante tamaño, peso y posición, no solo mediante color.

## Espaciado y composición

- Utilizar una escala basada en `4px`: 4, 8, 12, 16, 24 y 32px.
- Crear un encabezado horizontal de ancho completo con la marca y el lema alineados a la izquierda.
- Mantener tres columnas en pantallas amplias: acciones de aproximadamente 19%, área central de 62% y estructuras de 19%.
- Dividir el centro en editor arriba y terminal de resultados y errores abajo.
- Alinear las tarjetas de acciones y estructuras en listas verticales con alturas y separaciones regulares.
- Mantener separación estrecha y consistente entre paneles para que el fondo morado forme divisores visuales.
- En pantallas estrechas, apilar los bloques siguiendo el orden encabezado, acciones, editor, estructuras y resultados.

## Bordes y sombras

- Usar radios amplios entre `14px` y `22px`.
- Utilizar bordes morados finos en paneles y bordes algo más marcados en el editor y la terminal.
- Definir sombras mediante variables CSS para mantener consistencia.
- Combinar resplandor amarillo, sombra morada exterior y brillos interiores discretos para reproducir el Claymorphism.
- Usar un gradiente morado muy sutil en botones y en la fila de error.
- Reducir las sombras en pantallas pequeñas si afectan la legibilidad o el espacio disponible.

## Iconos

- Utilizar iconos SVG simples y consistentes, de trazo o relleno grueso, acompañados por etiquetas visibles cuando representen acciones.
- Reproducir la familia visual de la referencia: reproducir, detener, altavoz, lupa con signo más, guardar, documento, cubo, estructura, ciclo y función.
- Mantener los iconos amarillos sobre controles morados y morados sobre superficies amarillas.
- Evitar emojis como sustitutos de iconos.
- Tratar los iconos decorativos como no anunciables para lectores de pantalla.
- No depender únicamente del icono o del color para comunicar el estado de un control.

## Estados de los controles

- Definir estados visuales de reposo, `hover`, foco y pulsación.
- Mantener un indicador de foco visible con contraste suficiente.
- Los controles sin funcionalidad deberán conservar su apariencia demostrativa e indicar accesiblemente que todavía no están disponibles.
- No simular que una acción se ejecutó cuando todo el contenido es estático.

## Contenido y jerarquía observados

- Marca superior: símbolo de código, nombre “Nexia”, divisor vertical y lema “Programar también es para todos”.
- Panel izquierdo: encabezado “ACCIONES” y cinco controles grandes.
- Editor: icono de documento, título “EDITOR DE CÓDIGO”, ayuda en cursiva, canal de números de línea y trece líneas de muestra.
- Línea activa: franja morada completa con número, texto y contraste amarillo.
- Panel derecho: encabezado “ESTRUCTURAS” y seis controles grandes.
- Terminal inferior: encabezado común, una fila amarilla de resultado correcto y una fila morada de error.
- El éxito utiliza un círculo morado con marca amarilla; el error utiliza un círculo coral con una cruz morada.
- Los controles de ventana presentes en la referencia se omiten por decisión del usuario, ya que no representan acciones disponibles en la página.

## Comportamiento adaptable

- Escritorio: conservar las tres columnas y priorizar el área del editor.
- Tableta: permitir una reorganización en dos columnas sin perder el orden de lectura.
- Celular: usar una sola columna y controles cómodos para interacción táctil.
- Evitar el desplazamiento horizontal global; el contenido extenso del editor podrá desplazarse dentro de su propio panel.
- Impedir textos cortados, controles superpuestos y áreas táctiles demasiado pequeñas.

## Validación durante la maquetación

La comparación visual deberá hacerse con la referencia abierta a 1672 × 941 px.
Se comprobarán la jerarquía, las proporciones de paneles, la densidad de los
controles, los radios, el contraste y la sensación de volumen. La adaptación a
tableta y celular será una extensión accesible del diseño, ya que la referencia
solo muestra la composición de escritorio.
