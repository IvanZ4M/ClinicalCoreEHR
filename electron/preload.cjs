const { contextBridge, ipcRenderer } = require('electron');

// VULN-FIX (ÁREA 1): lista blanca de canales IPC permitidos.
const CANALES_PERMITIDOS = [];

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
