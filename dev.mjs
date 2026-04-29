import { spawn } from 'child_process'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import waitOn from 'wait-on'

const __dirname = dirname(fileURLToPath(import.meta.url))

const pbPath = join(__dirname, 'pocketbase', 'pocketbase.exe')

// 1. Arrancar PocketBase
const pb = spawn(pbPath, ['serve'], {
  cwd: join(__dirname, 'pocketbase'),
  stdio: 'pipe',
  shell: false,
})

pb.stdout.on('data', (d) => console.log('[PocketBase]', d.toString().trim()))
pb.stderr.on('data', (d) => console.error('[PocketBase Error]', d.toString().trim()))
pb.on('error', (e) => console.error('[PocketBase] No se pudo iniciar:', e.message))

// 2. Arrancar Vite directamente (sin llamar a otro script npm)
const vite = spawn('npx', ['vite'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname,
})

// 3. Esperar a que Vite esté listo y luego arrancar Electron
try {
  await waitOn({ resources: ['http://localhost:5173'], timeout: 30000 })

  const electron = spawn('npx', ['electron', '.', '--dev'], {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname,
  })

  electron.on('close', () => {
    vite.kill()
    pb.kill()
    process.exit(0)
  })

} catch (e) {
  console.error('Error esperando a Vite:', e.message)
  vite.kill()
  pb.kill()
  process.exit(1)
}

process.on('SIGINT', () => {
  vite.kill()
  pb.kill()
  process.exit(0)
})