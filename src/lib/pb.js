import PocketBase from 'pocketbase'

// VULN-FIX (ÁREA 5): URL leída desde variable de entorno en lugar de
// hardcodeada. En producción se configura en .env sin tocar el código.
// Fallback a localhost solo para desarrollo local.
const PB_URL = import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090'

const pb = new PocketBase(PB_URL)

pb.autoCancellation(false)

// Cargar sesión guardada si existe
const sesionGuardada = localStorage.getItem('pb_auth')
if (sesionGuardada) {
  try {
    const { token, record } = JSON.parse(sesionGuardada)
    pb.authStore.save(token, record)
  } catch {
    localStorage.removeItem('pb_auth')
  }
}

// VULN-FIX (ÁREA 3): escuchar cambios en el authStore.
// Si el token se elimina (sesión expirada o logout) y el usuario no está
// ya en la pantalla de login, forzar redirección completa.
// window.location.href asegura que el estado React se limpia por completo.
pb.authStore.onChange((token, record) => {
  if (token && record) {
    localStorage.setItem('pb_auth', JSON.stringify({ token, record }))
  } else {
    localStorage.removeItem('pb_auth')
    if (typeof window !== 'undefined' && !window.location.pathname.endsWith('/login')) {
      window.location.href = '/login'
    }
  }
})

export default pb
