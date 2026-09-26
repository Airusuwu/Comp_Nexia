import { createApp } from './api/app.js';

// Punto de entrada: abre el puerto local; las rutas se definen en api/app.js.
const host = '127.0.0.1';
const port = 3000;
const server = createApp();

server.on('error', (error) => {
  console.error(`No se pudo iniciar el backend de Nexia: ${error.message}`);
  process.exitCode = 1;
});

server.listen(port, host, () => {
  console.log(`Nexia: http://${host}:${port}/`);
  console.log('Editor, análisis léxico/sintáctico/semántico y ejecución básica disponibles.');
});
