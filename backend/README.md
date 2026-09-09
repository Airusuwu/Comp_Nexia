# Backend de Nexia

## Estado del punto 3

Infraestructura inicial, sin procesamiento de pseudocódigo. Solo funciona
`GET /api/health`; su estado `ok` significa que el servidor responde, NO que
un programa haya sido analizado o ejecutado. El frontend no está conectado.

## Decisión técnica

Se utiliza JavaScript con módulos ES y Node.js 24.x (mínimo 24.11.1).
El entorno revisado tiene Node.js 24.11.1 y npm 11.6.2. No se instaló ni
actualizó software del equipo.

No había tecnología previa configurada. Esta elección permite usar JavaScript
tanto en el futuro frontend funcional como en el backend y evita introducir
un compilador de TypeScript o un framework para la infraestructura inicial.
El servidor usa únicamente `node:http`, incluido en Node.js; no hay paquetes
externos, instalación de dependencias ni base de datos en esta etapa.

Referencia: [HTTP de Node.js 24](https://nodejs.org/docs/latest-v24.x/api/http.html).
La separación de módulos permite reconsiderar la capa HTTP si el proyecto lo
necesita, sin acoplar las reglas del lenguaje a un framework.

## Uso local

Desde la raíz del repositorio, en PowerShell:

```powershell
npm.cmd --prefix backend start
```

Consultar `http://127.0.0.1:3000/api/health` en un navegador o con:

```powershell
Invoke-RestMethod http://127.0.0.1:3000/api/health
```

Respuesta esperada:

```json
{
  "status": "ok",
  "service": "nexia-backend",
  "capabilities": { "analysis": false, "execution": false }
}
```

Detener este servidor de desarrollo con Ctrl+C. Esto no implementa el botón
Detener del compilador. El servidor solo escucha en la interfaz local;
no sirve archivos del repositorio, no publica el PDF y no está preparado
para despliegue público. Si el puerto 3000 está ocupado, informa el error
sin cerrar procesos ajenos. No hace falta ejecutar `npm install`.

Las otras rutas responden 404 y los métodos distintos de GET en la ruta de
salud responden 405. No hay rutas de análisis o ejecución simuladas.
La API funcional y su conexión con el editor corresponden al punto 5 y a
los componentes posteriores. Todavía no se habilita CORS ni se sirve el HTML.

## Responsabilidades

| Ruta | Responsabilidad | Estado |
| --- | --- | --- |
| `src/server.js` | Arranque local y errores de escucha | Implementado |
| `src/api/app.js` | Comunicación HTTP, sin reglas del lenguaje | Solo salud |
| `src/lexer/` | Tokens y ubicaciones originales | Reservado, punto 7 |
| `src/parser/` | Gramática, precedencia y AST | Reservado, punto 8 |
| `src/semantic/` | Validación estática del AST | Reservado, punto 9 |
| `src/types/` | Compatibilidad central de tipos | Reservado, punto 6 |
| `src/symbols/` | Declaraciones, tipos y ámbitos | Reservado |
| `src/diagnostics/` | Mensajes con etapa y ubicación | Reservado |
| `src/runtime/` | Ejecución, Leer, Escribir, límites y detención | Reservado |
| `tests/` | Casos del lenguaje e integración | Solo planificación |

Las carpetas reservadas no contienen implementaciones ficticias. Sus archivos
`.gitkeep` solo permiten conservar la estructura en Git.

La API coordinará las fases, pero lexer, parser, semántica, tipos y símbolos
no dependerán de HTTP ni del DOM. El motor recorrerá el AST validado, con un
estado de ejecución separado por programa y controles de valores en ejecución.
No se ejecutará el pseudocódigo como JavaScript mediante `eval` o `Function`,
ni se heredarán conversiones implícitas del lenguaje anfitrión.

Los formatos definitivos de tokens, AST, diagnósticos y respuestas se definirán
en sus etapas. No se han decidido reglas gramaticales a partir de la maqueta.
Los cambios visuales y los eventos del editor permanecerán en `frontend/`.

## Verificación

```powershell
npm.cmd --prefix backend run check
```

Este comando comprueba sintaxis de los dos módulos existentes; no prueba reglas
del lenguaje. Las verificaciones HTTP de esta etapa deben distinguir salud,
rutas inexistentes y métodos no permitidos. No hay pruebas funcionales del
compilador, navegador ni lector de pantalla realizadas por esta infraestructura.
