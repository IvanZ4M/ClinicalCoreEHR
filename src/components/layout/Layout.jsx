import { useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Toaster } from 'sonner'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { NotificationsProvider } from '../../context/NotificationsContext'
import { useTheme } from '../../context/ThemeContext'
import { safeAnimate, slideUp } from '../../lib/animations'
import { logWarn } from '../../lib/logger'
import pb from '../../lib/pb'

// VULN-FIX (ÁREA 3): en entorno médico, si el sistema queda desatendido
// otro personal —o el propio paciente, con la pantalla a la vista— podría ver
// el expediente anterior. La sesión se cierra sola tras un rato sin actividad.
//
// El tiempo se configura por despliegue con VITE_INACTIVITY_TIMEOUT (ver
// .env.example). Antes estaba escrito a mano aquí y la variable existía en los
// .env sin que nadie la leyera: el valor configurado no tenía ningún efecto.
const INACTIVIDAD_POR_DEFECTO_MS = 5 * 60 * 1000

// Vite entrega las variables de entorno como cadena. Un valor vacío, no numérico
// o negativo dejaría la sesión abierta para siempre (NaN en setTimeout) o la
// cerraría al instante, así que se valida y se cae al valor por defecto.
function leerInactividadMs() {
  const crudo = import.meta.env.VITE_INACTIVITY_TIMEOUT
  if (crudo === undefined || crudo === '') return INACTIVIDAD_POR_DEFECTO_MS

  const ms = Number(crudo)
  if (!Number.isFinite(ms) || ms <= 0) {
    logWarn('inactividad', `VITE_INACTIVITY_TIMEOUT no es un número válido ("${crudo}"); se usan ${INACTIVIDAD_POR_DEFECTO_MS} ms`)
    return INACTIVIDAD_POR_DEFECTO_MS
  }
  return ms
}

const INACTIVIDAD_MS = leerInactividadMs()

export default function Layout({ children }) {
  const location = useLocation()
  const navigate  = useNavigate()
  const { isDark } = useTheme()
  const timerRef  = useRef(null)

  const cerrarSesionPorInactividad = useCallback(() => {
    pb.authStore.clear()
    navigate('/login', { state: { reason: 'inactivity' } })
  }, [navigate])

  useEffect(() => {
    const reiniciar = () => {
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(cerrarSesionPorInactividad, INACTIVIDAD_MS)
    }

    // Arrancar el timer al montar el layout (usuario está autenticado aquí)
    reiniciar()

    // Resetear en cualquier interacción real del usuario
    const eventos = ['mousedown', 'keydown', 'scroll', 'touchstart']
    eventos.forEach(ev => window.addEventListener(ev, reiniciar, { passive: true }))

    return () => {
      clearTimeout(timerRef.current)
      eventos.forEach(ev => window.removeEventListener(ev, reiniciar))
    }
  }, [cerrarSesionPorInactividad])

  return (
    <NotificationsProvider>
      <div style={{
        display: 'flex',
        height: '100svh',
        background: 'var(--bg)',
        overflow: 'hidden',
      }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <TopBar />
          <motion.main
            key={location.pathname}
            style={{ flex: 1, overflowX: 'hidden', overflowY: 'auto' }}
            {...safeAnimate({ initial: slideUp.initial, animate: slideUp.animate, transition: slideUp.transition })}
          >
            {children}
          </motion.main>
        </div>
      </div>
      <Toaster position="bottom-right" richColors theme={isDark ? 'dark' : 'light'} />
    </NotificationsProvider>
  )
}
