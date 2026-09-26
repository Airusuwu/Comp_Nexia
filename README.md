# Nexia

Nexia es una propuesta de interfaz accesible y amigable para aprender a
programar mediante pseudocódigo. Su objetivo es presentar las acciones, el
editor, las estructuras del lenguaje y los resultados de una forma clara para
personas con distintos niveles de experiencia.

## Estado del proyecto

El editor permite escribir, seleccionar y pegar código, con numeración de
líneas. El botón existente Ejecutar o `Ctrl+Enter` envía el texto al backend;
realiza análisis léxico, sintáctico y semántico y ejecuta el programa si es válido.
La terminal muestra las salidas de Escribir, el estado real
de la solicitud y los errores, sin borrar el contenido del editor.

Con el foco en el editor, `Ctrl+O` permite abrir un archivo `.txt` UTF-8 de
hasta 64 KiB, con confirmación antes de reemplazar contenido. Guardar descarga
el código como `programa-nexia.txt`. Aumentar texto amplía código y resultados
en pasos de 25 % hasta 200 %; el siguiente clic vuelve al 100 %.
Escuchar sigue pendiente; no se añadieron botones.
Leer solicita datos dentro de la terminal; Enter o Enviar confirma. Escape o Detener
interrumpen la ejecución. Consulta los ejemplos y límites en
[`docs/tecnica/runtime.md`](docs/tecnica/runtime.md).

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

## Inicio rápido

### Requisitos y dependencias

- Node.js **24.x, versión mínima 24.11.1**, con npm incluido.
- Git para clonar el repositorio (o descargar y descomprimir el código).
- Navegador de escritorio; las pruebas actuales se centran en PC.
- Acceso al repositorio de GitHub para obtener el código.

No requiere paquetes externos, base de datos, Python, framework, archivo .env
ni compilación previa. **No es necesario ejecutar npm install**. El PDF A5
no se distribuye con Git y no hace falta para iniciar la aplicación.

### Descargar e iniciar en Windows

En PowerShell, para una copia nueva de la primera versión funcional:

```powershell
git clone --branch back https://github.com/Airusuwu/Comp_Nexia.git
cd Comp_Nexia
node --version
npm.cmd --version
npm.cmd --prefix backend start
```

Si ya tienes el proyecto, abre una terminal en su carpeta raíz y ejecuta solo
el comando start. No cambies de rama con trabajo pendiente sin conservarlo.
La rama back contiene esta entrega mientras se revisa su PR hacia main.

Abre **http://127.0.0.1:3000/** y deja la terminal del servidor abierta.
El mismo servidor sirve frontend y backend; no necesitas Live Server.
En una terminal que no sea PowerShell puedes usar `npm` en lugar de `npm.cmd`.

### Ejecutar un programa

Reemplaza el ejemplo antiguo del editor por este código:

```text
Inicio
Definir a, b Como ENTERO
Escribir "Ingresa el primer número:"
Leer a
Escribir "Ingresa el segundo número:"
Leer b
Escribir "La suma es: ", a + b
Fin
```

Pulsa **Ejecutar** o **Ctrl+Enter**. Escribe los datos en la terminal de Nexia
y confirma con Enter o Enviar. Si introduces 3 y 4, debe mostrar 7.
Usa `<-` para asignar, no la flecha `←`. Detener o Escape en el campo de
entrada cancela el programa; no apaga el servidor.

### Comprobar y detener

Desde otra terminal en la raíz:

```powershell
npm.cmd --prefix backend run check
Invoke-RestMethod http://127.0.0.1:3000/api/health
```

Check comprueba la sintaxis de los módulos; no sustituye pruebas funcionales.
Consulta [las verificaciones](docs/pruebas/verification.md) y [los límites del motor](docs/tecnica/runtime.md).
Para apagar el servidor, pulsa **Ctrl+C en la terminal donde ejecutaste start**.

### Problemas habituales

- **node no se reconoce:** instala la versión requerida y vuelve a abrir la terminal.
- **npm.ps1 bloqueado:** usa `npm.cmd`; no hace falta cambiar políticas de PowerShell.
- **Puerto 3000 ocupado (EADDRINUSE):** detén tu instancia anterior con Ctrl+C;
  no cierres procesos ajenos. El arranque normal usa el puerto fijo 3000.
- **Fallo de comunicación:** comprueba que start siga activo y que abriste la URL
  del servidor, no index.html directamente ni otro puerto de una sesión anterior.
- **Página desactualizada:** copia primero tu código y luego pulsa Ctrl+Shift+R.
  Guarda antes tu código como .txt, porque recargar pierde la edición actual.

## Ramas de trabajo

- `main` contiene la versión estable.
- `front` contiene el trabajo del frontend.
- `back` contiene el desarrollo funcional en curso.

Los cambios de `front` y `back` se revisarán mediante Pull Requests hacia
`main`. El método de integración acordado es **Squash and merge**.

## Documentación

Consulta el [índice de documentación](docs/README.md) para navegar por tema.

- [`docs/pruebas/verification.md`](docs/pruebas/verification.md): verificación en PC y pendientes reales del punto 10.
- [`docs/tecnica/semantic-analysis.md`](docs/tecnica/semantic-analysis.md): ámbitos, tipos, inicialización y controles pendientes de ejecución.
- [`docs/tecnica/syntax-analysis.md`](docs/tecnica/syntax-analysis.md): gramática aprobada, AST y límites del punto 8.
- [`docs/proyecto/plan.md`](docs/proyecto/plan.md): plan histórico de la maqueta visual.
- [`docs/proyecto/design-guide.md`](docs/proyecto/design-guide.md): decisiones visuales y adaptables.
- [`docs/contexto/CONTEXTO.md`](docs/contexto/CONTEXTO.md): estado breve para continuar el trabajo.
- [`GUIA_GIT.md`](GUIA_GIT.md): guía de colaboración.
