# Backend de Nexia

## Estado con ejecución básica

Editor conectado al servidor, con tres fases de análisis y ejecución del AST.
`GET /api/health` indica disponibilidad del servidor. `POST /api/analyze`
valida la solicitud y devuelve tokens, AST, símbolos, controles runtime o errores
ubicados. Nunca devuelve resultados de ejecución ficticios.

`POST /api/execute` analiza y ejecuta; `/api/analyze` sigue siendo solo análisis.
Contrato de entrada, salidas, cancelación y límites en
[`docs/runtime.md`](../docs/runtime.md).

Ya existe un módulo independiente de compatibilidad de tipos, basado en el
PDF A5, con controles auxiliares de declaración, inicialización y divisor.
La compatibilidad se aplica al AST durante el análisis semántico. Véase
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
  "capabilities": { "analysis": true, "lexical": true, "syntactic": true, "semantic": true, "execution": true }
}
```

Detener este servidor de desarrollo con Ctrl+C. El botón Detener del compilador
cancela la petición de ejecución, no el servidor. Solo escucha en la interfaz local;
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

Respuesta sin errores de análisis (HTTP 200, extracto sin tokens, AST ni símbolos):

```json
{
  "status": "analyzed",
  "executed": false,
  "results": [],
  "diagnostics": [{
    "code": "ANALYSIS_COMPLETED",
    "message": "Análisis léxico, sintáctico y semántico completados. El programa no se ha ejecutado. Controles pendientes de ejecución: 0.",
    "severity": "info",
    "stage": "service",
    "line": null,
    "column": null
  }]
}
```

La respuesta también incluye `tokens`, `ast`, `symbols`, `runtimeChecks`, `truncated` y `analysis` con el estado
lexical, syntactic y semantic. Los errores léxicos devuelven HTTP 422,
`status: "lexical_error"` y diagnósticos ubicados. Documentación detallada en
[`docs/lexical-analysis.md`](../docs/lexical-analysis.md).

Los errores sintácticos devuelven HTTP 422, `syntactic_error`, `ast: null`
y el primer diagnóstico de etapa parser. Si falla el lexer, sintaxis queda
skipped. Sin errores las tres fases quedan completed. Gramática y AST en
[`docs/syntax-analysis.md`](../docs/syntax-analysis.md).

Errores semánticos: HTTP 422, semantic_error, primer diagnóstico ubicado.
Si falla una fase previa, semantic queda skipped. Ámbitos, inicialización y
controles que requieren valores reales se describen en
[`docs/semantic-analysis.md`](../docs/semantic-analysis.md).

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
cancela la solicitud y la ejecución en curso. Los mensajes se insertan
como texto, no HTML. Ctrl+O abre un .txt local sin enviarlo automáticamente.

## Responsabilidades

| Ruta | Responsabilidad | Estado |
| --- | --- | --- |
| `src/server.js` | Arranque local y errores de escucha | Implementado |
| `src/api/app.js` | Rutas, origen y errores HTTP | Implementado |
| `src/api/analyze.js` | Validación y coordinación de las tres fases | Implementado |
| `src/api/static.js` | Lista permitida de recursos del frontend | Implementado |
| `src/lexer/` | Tokens y ubicaciones originales | Implementado, punto 7 |
| `src/parser/` | Gramática, precedencia y AST | Implementado, punto 8 |
| `src/semantic/` | Validación estática del AST | Implementado, punto 9 |
| `src/types/` | Compatibilidad, literales básicos y controles auxiliares | Integrado con semántica y runtime |
| `src/symbols/` | Declaraciones, tipos y ámbitos | Implementado, punto 9 |
| `src/diagnostics/` | Esquema de respuesta y diagnósticos | Solicitudes implementadas |
| `src/runtime/` | Ejecución, Leer, Escribir, límites y detención | Motor básico implementado |
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

El punto 10 registró 140 aserciones de integración (26 programas), pruebas
reales en Edge PC y recuperación ante desconexión. Véase
[`docs/verification.md`](../docs/verification.md) para evidencia y pendientes;
no constituye una auditoría completa con lector de pantalla.

```powershell
npm.cmd --prefix backend run check
```

Este comando comprueba sintaxis de los módulos implementados, incluido el script
del editor; no prueba reglas del lenguaje. Se realizaron 23 verificaciones HTTP
con aserciones y se comprobó en Edge de PC el envío, la conservación del texto
y el aviso de editor vacío. No hay suite automatizada persistente todavía.
En el punto 7 se añadieron 102 comprobaciones de lexer y HTTP satisfactorias.
En el punto 8 se ejecutaron 397 aserciones de parser, AST, límites y API.
En el punto 9 se ejecutaron 498 aserciones de símbolos, semántica y API.
Falta comprobar apertura mediante el selector real (bloqueada por permisos de
la extensión), lector de pantalla y las futuras fases del compilador.
