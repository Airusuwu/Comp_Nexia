# Backend de Nexia

## Estado después del punto 8

Editor conectado al servidor, con análisis léxico y sintáctico sin ejecución de pseudocódigo.
`GET /api/health` indica disponibilidad del servidor. `POST /api/analyze`
valida la solicitud y devuelve tokens, AST o errores ubicados. El análisis
semántico sigue pendiente. Nunca devuelve resultados de ejecución ficticios.

Ya existe un módulo independiente de compatibilidad de tipos, basado en el
PDF A5, con controles auxiliares de declaración, inicialización y divisor.
La compatibilidad aún no se aplica a programas; el lexer solo reutiliza la
clasificación de literales. Véase
[`docs/type-rules.md`](../docs/type-rules.md) para reglas, límites y validaciones.

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

Abrir la aplicación en `http://127.0.0.1:3000/`. Frontend y API comparten origen;
ya no hace falta un servidor Python independiente. Consultar salud con:

```powershell
Invoke-RestMethod http://127.0.0.1:3000/api/health
```

Respuesta esperada:

```json
{
  "status": "ok",
  "service": "nexia-backend",
  "capabilities": { "analysis": false, "lexical": true, "syntactic": true, "execution": false }
}
```

Detener este servidor de desarrollo con Ctrl+C. Esto no implementa el botón
Detener del compilador. El servidor solo escucha en la interfaz local;
solo sirve una lista explícita de archivos del frontend, no publica el PDF y no está preparado
para despliegue público. Si el puerto 3000 está ocupado, informa el error
sin cerrar procesos ajenos. No hace falta ejecutar `npm install`.

Las rutas no autorizadas responden 404; los métodos no admitidos, 405.
El envío exige JSON y el mismo origen de la aplicación cuando existe cabecera
Origin. No se habilita CORS. No hay almacenamiento, registros del código
recibido ni acceso HTTP a docs, backend o archivos de Git.

## Contrato de envío

`POST /api/analyze`, con `Content-Type: application/json` y cuerpo
`{"code":"Inicio\nFin"}`. El texto no se recorta; se convierte en tokens con ubicación.
Límites técnicos: código de 64 KiB UTF-8 y cuerpo JSON de 512 KiB.

Respuesta sin errores léxicos ni sintácticos (HTTP 200, extracto sin tokens ni AST):

```json
{
  "status": "partial",
  "executed": false,
  "results": [],
  "diagnostics": [{
    "code": "SYNTAX_COMPLETED",
    "message": "Análisis léxico y sintáctico completados. La validación semántica y la ejecución todavía están pendientes.",
    "severity": "info",
    "stage": "service",
    "line": null,
    "column": null
  }]
}
```

La respuesta también incluye `tokens`, `ast`, `truncated` y `analysis` con el estado
lexical, syntactic y semantic. Los errores léxicos devuelven HTTP 422,
`status: "lexical_error"` y diagnósticos ubicados. Documentación detallada en
[`docs/lexical-analysis.md`](../docs/lexical-analysis.md).

Los errores sintácticos devuelven HTTP 422, `syntactic_error`, `ast: null`
y el primer diagnóstico de etapa parser. Si falla el lexer, sintaxis queda
skipped. Sin errores ambas fases quedan completed; semantic permanece
not_implemented. Gramática, AST, límites y ejemplo de sintaxis en
[`docs/syntax-analysis.md`](../docs/syntax-analysis.md).

Errores de solicitud: 400 para JSON/UTF-8 inválido, campo code inválido o
texto vacío; 413 para exceso de tamaño; 415 para formato distinto de JSON;
403 para host/origen no permitido. Mantienen el mismo esquema con
`status: "invalid_request"`, `executed: false` y diagnósticos de etapa request.
Los fallos internos devuelven 500 y `status: "error"`, sin detalles internos.

Las ubicaciones son null cuando no corresponden, nunca líneas inventadas.
Para las futuras fases serán índices desde 1; columnas en unidades UTF-16
como la selección del textarea, contando cada tabulador como una unidad.
El textarea normaliza finales CRLF/CR a LF al editar/abrir; conserva espacios,
líneas vacías e indentación. La gramática del punto 8 está documentada por separado.

El frontend conserva texto ante errores, bloquea envíos simultáneos, descarta
respuestas a versiones anteriores y limita la espera a 8 segundos. Editar
cancela la espera local, no una ejecución de programa. Los mensajes se insertan
como texto, no HTML. Ctrl+O abre un .txt local sin enviarlo automáticamente.

## Responsabilidades

| Ruta | Responsabilidad | Estado |
| --- | --- | --- |
| `src/server.js` | Arranque local y errores de escucha | Implementado |
| `src/api/app.js` | Rutas, origen y errores HTTP | Implementado |
| `src/api/analyze.js` | Validación, análisis léxico y sintáctico | Implementado |
| `src/api/static.js` | Lista permitida de recursos del frontend | Implementado |
| `src/lexer/` | Tokens y ubicaciones originales | Implementado, punto 7 |
| `src/parser/` | Gramática, precedencia y AST | Implementado, punto 8 |
| `src/semantic/` | Validación estática del AST | Reservado, punto 9 |
| `src/types/` | Compatibilidad, literales básicos y controles auxiliares | Implementado, integración pendiente |
| `src/symbols/` | Declaraciones, tipos y ámbitos | Reservado |
| `src/diagnostics/` | Esquema de respuesta y diagnósticos | Solicitudes implementadas |
| `src/runtime/` | Ejecución, Leer, Escribir, límites y detención | Reservado |
| `tests/` | Casos del lenguaje e integración | Solo planificación |

Las carpetas reservadas no contienen implementaciones ficticias. Sus archivos
`.gitkeep` solo permiten conservar la estructura en Git.

La API coordinará las fases, pero lexer, parser, semántica, tipos y símbolos
no dependerán de HTTP ni del DOM. El motor recorrerá el AST validado, con un
estado de ejecución separado por programa y controles de valores en ejecución.
No se ejecutará el pseudocódigo como JavaScript mediante `eval` o `Function`,
ni se heredarán conversiones implícitas del lenguaje anfitrión.

Los formatos de tokens y AST se documentan en sus respectivas etapas. El contrato HTTP
anterior no determina las reglas gramaticales a partir de la maqueta.
Los cambios visuales y los eventos del editor permanecerán en `frontend/`.

## Verificación

```powershell
npm.cmd --prefix backend run check
```

Este comando comprueba sintaxis de los módulos implementados, incluido el script
del editor; no prueba reglas del lenguaje. Se realizaron 23 verificaciones HTTP
con aserciones y se comprobó en Edge de PC el envío, la conservación del texto
y el aviso de editor vacío. No hay suite automatizada persistente todavía.
En el punto 7 se añadieron 102 comprobaciones de lexer y HTTP satisfactorias.
En el punto 8 se ejecutaron 397 aserciones de parser, AST, límites y API.
Falta comprobar apertura mediante el selector real (bloqueada por permisos de
la extensión), lector de pantalla y las futuras fases del compilador.
