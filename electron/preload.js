import { contextBridge, ipcRenderer } from 'electron';

// VULN-FIX (ÁREA 1): lista blanca de canales IPC permitidos.
// La versión anterior exponía acceso irrestricto a TODOS los canales IPC,
// lo que permitiría a código malicioso en el renderer comunicarse con el
// proceso principal en canales arbitrarios.
// Solo los canales listados aquí pueden ser usados desde React.
const CANALES_PERMITIDOS = [
  // Agregar canales aquí cuando sean necesarios, p.ej.:
  // 'get-app-version', 'open-external-url'
];

contextBridge.exposeInMainWorld('electronAPI', {
  // Envía un mensaje al proceso principal (one-way)
  send: (channel, data) => {
    if (CANALES_PERMITIDOS.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  // Invoca al proceso principal y espera respuesta (request-response)
  invoke: (channel, data) => {
    if (CANALES_PERMITIDOS.includes(channel)) {
      return ipcRenderer.invoke(channel, data);
    }
    return Promise.reject(new Error(`Canal IPC no autorizado: ${channel}`));
  },
  // Registra un listener para mensajes del proceso principal
  on: (channel, callback) => {
    if (CANALES_PERMITIDOS.includes(channel)) {
      ipcRenderer.on(channel, (_event, ...args) => callback(...args));
    }
  },
});
