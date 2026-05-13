import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { NotificationsProvider } from '../../context/NotificationsContext'

export default function Layout({ children }) {
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
          <main style={{ flex: 1, overflowX: 'hidden', overflowY: 'auto' }}>
            {children}
          </main>
        </div>
      </div>
    </NotificationsProvider>
  )
}
