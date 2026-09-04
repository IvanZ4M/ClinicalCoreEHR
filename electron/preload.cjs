const { contextBridge, ipcRenderer } = require('electron');

// VULN-FIX (ÁREA 1): lista blanca de canales IPC permitidos.
// 'ui:set-zoom' — el modo presentación (F9) pide escalar el renderer para que
// también crezcan las gráficas SVG, que no responden a --ui-scale.
// El proceso principal valida el factor recibido antes de aplicarlo.
const CANALES_PERMITIDOS = ['ui:set-zoom'];

contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel, data) => {
    if (CANALES_PERMITIDOS.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  invoke: (channel, data) => {
    if (CANALES_PERMITIDOS.includes(channel)) {
      return ipcRenderer.invoke(channel, data);
    }
    return Promise.reject(new Error(`Canal IPC no autorizado: ${channel}`));
  },
  on: (channel, callback) => {
    if (CANALES_PERMITIDOS.includes(channel)) {
      ipcRenderer.on(channel, (_event, ...args) => callback(...args));
    }
  },
});
