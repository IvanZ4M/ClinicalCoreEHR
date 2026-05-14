import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import log from 'electron-log/main.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.argv.includes('--dev');

// ── Logging ──────────────────────────────────────────────────────────────────
log.transports.file.resolvePathFn = () =>
  path.join(app.getPath('userData'), 'logs', 'clinicalcore.log');
log.transports.file.maxSize = 10 * 1024 * 1024; // 10 MB

process.on('uncaughtException', (error) => {
  log.error('Error no manejado:', error);
});

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),

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

  // Capture renderer errors and console output to the log file
  mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => {
    log.error(`[Renderer] did-fail-load: ${code} ${desc} — ${url}`);
  });
  mainWindow.webContents.on('render-process-gone', (_e, details) => {
    log.error('[Renderer] process gone:', JSON.stringify(details));
  });
  mainWindow.webContents.on('console-message', (_e, level, message, line, source) => {
    const lvl = ['verbose', 'info', 'warn', 'error'][level] ?? 'info';
    log[lvl === 'verbose' ? 'debug' : lvl](`[Renderer] ${message} (${source}:${line})`);
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
    log.info('ClinicalCore EHR iniciado en modo desarrollo');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));

    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.closeDevTools();
    });

    mainWindow.webContents.on('context-menu', (e) => e.preventDefault());

    log.info('ClinicalCore EHR iniciado — versión', app.getVersion());
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
