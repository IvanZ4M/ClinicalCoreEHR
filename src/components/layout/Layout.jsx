import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Toaster } from 'sonner'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { NotificationsProvider } from '../../context/NotificationsContext'
import { useTheme } from '../../context/ThemeContext'
import { safeAnimate, slideUp } from '../../lib/animations'

export default function Layout({ children }) {
  const location = useLocation()
  const { isDark } = useTheme()

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
