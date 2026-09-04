import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Electron loads files via file://, where the crossorigin attribute blocks
// ES module loading. This plugin strips it from the generated HTML.
const removeElectronCrossorigin = {
  name: 'remove-electron-crossorigin',
  transformIndexHtml(html) {
    return html.replace(/ crossorigin/g, '')
  },
}

export default defineConfig({
  plugins: [react(), removeElectronCrossorigin],
  server: {
    port: 5173,
    strictPort: true, // Si 5173 está ocupado, falla en lugar de cambiar de puerto
  },
  base: './',
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/react') || id.includes('/react-dom') || id.includes('/react-router')) {
            return 'react-vendor'
          }
          if (id.includes('/pocketbase')) {
            return 'pocketbase'
          }
        },
      },
    },
  },
})
