import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.argv.includes('--dev');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),

      // VULN-FIX (ÁREA 1): nodeIntegration desactivado — el renderer (React) no
      // tiene acceso a las APIs de Node.js. Sin esto, cualquier script en la
      // webview podría leer el sistema de archivos o ejecutar procesos.
      nodeIntegration: false,

      // VULN-FIX (ÁREA 1): contextIsolation activo — el mundo JS del preload
      // está aislado del renderer. Impide que código React acceda a require/process.
      contextIsolation: true,

      // VULN-FIX (ÁREA 1): webSecurity activo — bloquea peticiones cross-origin
      // no autorizadas desde el renderer.
      webSecurity: true,

      // VULN-FIX (ÁREA 1): nunca mezclar contenido HTTP dentro de la app.
      allowRunningInsecureContent: false,

      // NOTA: sandbox:true requiere preloads en CommonJS; este proyecto usa
      // ESM en el preload, por lo que sandbox queda desactivado. Migrar el
      // preload a CJS si se desea habilitar sandbox en el futuro.
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));

    // VULN-FIX (ÁREA 1): en producción, impedir que se abran las DevTools.
    // Sin esto, cualquier usuario con acceso físico puede inspeccionar tokens
    // de sesión, datos de pacientes en memoria y peticiones de red.
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.closeDevTools();
    });

    // VULN-FIX (ÁREA 1): deshabilitar "Inspeccionar elemento" en el menú
    // contextual para que no haya atajo hacia las DevTools.
    mainWindow.webContents.on('context-menu', (e) => e.preventDefault());
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
