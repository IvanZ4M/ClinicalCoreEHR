#!/usr/bin/env node
import { spawn } from 'child_process';
import http from 'http';

// Función para esperar a que Vite esté listo
function waitForVite(port, maxRetries = 30) {
  return new Promise((resolve, reject) => {
    let retries = 0;

    const checkPort = () => {
      const req = http.get(`http://localhost:${port}`, (res) => {
        if (res.statusCode < 500) {
          console.log(`✅ Vite is ready on port ${port}`);
          resolve(port);
        } else {
          retry();
        }
      });

      req.on('error', retry);

      function retry() {
        retries++;
        if (retries < maxRetries) {
          setTimeout(checkPort, 500);
        } else {
          reject(new Error(`Vite did not start after ${maxRetries * 500}ms`));
        }
      }
    };

    checkPort();
  });
}

// Iniciar Vite
console.log('🚀 Starting Vite...');
const vite = spawn('npm', ['run', 'dev:vite'], {
  stdio: 'inherit',
  shell: true,
});

// Esperar a que Vite esté listo, luego iniciar Electron
waitForVite(5173)
  .then((port) => {
    console.log('🎉 Starting Electron...');
    const electron = spawn('electron', ['.', '--dev'], {
      stdio: 'inherit',
      env: { ...process.env, VITE_PORT: port.toString() },
      shell: true,
    });

    electron.on('exit', (code) => {
      console.log(`Electron exited with code ${code}`);
      vite.kill();
      process.exit(code);
    });
  })
  .catch((err) => {
    console.error('❌ Error:', err.message);
    vite.kill();
    process.exit(1);
  });

vite.on('exit', (code) => {
  console.log(`Vite exited with code ${code}`);
  process.exit(code);
});
