import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { ROLE_NAV_CONFIG, ROLE_LABELS, ROLES_CON_NUEVA_CONSULTA } from '../../lib/roles'
import { I } from '../icons'

export default function Sidebar() {
  const location  = useLocation()
  const navigate  = useNavigate()
  const { usuario, logout } = useAuth()
  const { isDark } = useTheme()

  const rol   = usuario?.rol || 'medico'
  const items = ROLE_NAV_CONFIG[rol] ?? ROLE_NAV_CONFIG['medico']

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  const handleLogout = () => { logout(); navigate('/login') }

  const initials = usuario
    ? `${usuario.nombre?.[0] || ''}${usuario.apellidos?.[0] || ''}`.toUpperCase()
    : 'US'

  const rolLabel = ROLE_LABELS[rol] || rol

  return (
    <aside
      style={{
        width: 'var(--sidebar-w)',
        flexShrink: 0,
        background: 'var(--bg-elev)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        userSelect: 'none',
        transition: 'width 0.2s var(--ease-out)',
      }}
    >
      {/* ── Logo ───────────────────────────────────────────────────── */}
      <div style={{ padding: '1.25rem 1.25rem 1rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        <div style={{
          width: 36, height: 36,
          background: 'var(--accent)',
          borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 2px 8px var(--accent-dim)',
        }}>
          <I.Pulse width={18} height={18} stroke="white" strokeWidth={2} />
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
            ClinicalCore
          </p>
          <p style={{ fontSize: '0.625rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>
            EHR Sistema
          </p>
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--border)', margin: '0 1rem 0.75rem' }} />

      {/* ── Nav ────────────────────────────────────────────────────── */}
      <nav style={{ flex: 1, padding: '0 0.625rem', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        <p style={{ fontSize: '0.625rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '0 0.625rem', marginBottom: '0.375rem' }}>
          Módulos
        </p>

        {items.map(({ path, Icon, label }) => {
          const active = isActive(path)
          return (
            <Link
              key={path}
              to={path}
              className={`nav-item${active ? ' active' : ''} anim-slide-left`}
              style={{ textDecoration: 'none' }}
            >
              <Icon width={16} height={16} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: '0.8125rem' }}>{label}</span>
              {active && (
                <span style={{
                  width: 6, height: 6,
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--accent)',
                  flexShrink: 0,
                }} />
              )}
            </Link>
          )
        })}
      </nav>

      {/* ── Nueva Consulta CTA — solo para médico ──────────────────── */}
      {ROLES_CON_NUEVA_CONSULTA.includes(rol) && (
        <div style={{ padding: '0.75rem 0.625rem 0.625rem' }}>
          <button
            onClick={() => navigate('/consulta/nueva')}
            className="btn btn-primary"
            style={{ width: '100%', fontSize: '0.8125rem', gap: '0.375rem' }}
          >
            <I.Plus width={15} height={15} />
            Nueva Consulta
          </button>
        </div>
      )}

      <div style={{ height: 1, background: 'var(--border)', margin: '0 0.625rem' }} />

      {/* ── User card ──────────────────────────────────────────────── */}
      <div style={{ padding: '0.75rem 0.625rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.6875rem' }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3 }}>
            {usuario ? `${usuario.nombre} ${usuario.apellidos}` : 'Usuario'}
          </p>
          <p style={{ fontSize: '0.6875rem', color: 'var(--text-3)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {rolLabel}
          </p>
        </div>
        <button
          onClick={handleLogout}
          title="Cerrar sesión"
          className="btn-icon btn-ghost"
          style={{ padding: '0.375rem', borderRadius: 'var(--radius-sm)' }}
        >
          <I.Logout width={14} height={14} />
        </button>
      </div>
    </aside>
  )
}
