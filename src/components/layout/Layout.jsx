import { useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Toaster } from 'sonner'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { NotificationsProvider } from '../../context/NotificationsContext'
import { useTheme } from '../../context/ThemeContext'
import { safeAnimate, slideUp } from '../../lib/animations'
import pb from '../../lib/pb'

// VULN-FIX (ÁREA 3): en entorno médico, si el sistema queda desatendido
// otro personal podría ver el expediente del paciente anterior.
// 30 minutos de inactividad cierra la sesión automáticamente.
const INACTIVIDAD_MS = 30 * 60 * 1000

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
