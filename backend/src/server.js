import { createApp } from './api/app.js';

const host = '127.0.0.1';
const port = 3000;
const server = createApp();

server.on('error', (error) => {
  console.error(`No se pudo iniciar el backend de Nexia: ${error.message}`);
  process.exitCode = 1;
});

server.listen(port, host, () => {
  console.log(`Backend de Nexia: http://${host}:${port}/api/health`);
  console.log('Solo infraestructura; análisis y ejecución todavía no disponibles.');
});
