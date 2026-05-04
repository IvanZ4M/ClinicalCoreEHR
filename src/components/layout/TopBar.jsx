import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { I } from '../icons'

const ROUTE_LABELS = {
  '/':               'Panel de Control',
  '/pacientes':      'Pacientes',
  '/citas':          'Citas y Agenda',
  '/informes':       'Informes',
  '/configuracion':  'Configuración',
  '/usuarios':       'Gestión de Usuarios',
  '/consulta/nueva': 'Nueva Consulta',
}

export default function TopBar() {
  const { usuario } = useAuth()
  const { isDark, toggleDark } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchVal, setSearchVal]   = useState('')
  const searchRef = useRef(null)

  const pageLabel = ROUTE_LABELS[location.pathname] ||
    ROUTE_LABELS[Object.keys(ROUTE_LABELS).find(k => k !== '/' && location.pathname.startsWith(k)) || '/'] ||
    'ClinicalCore'

  /* ⌘K / Ctrl+K opens search */
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
        setTimeout(() => searchRef.current?.focus(), 50)
      }
      if (e.key === 'Escape') { setSearchOpen(false); setSearchVal('') }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const initials = usuario
    ? `${usuario.nombre?.[0] || ''}${usuario.apellidos?.[0] || ''}`.toUpperCase()
    : 'US'

  return (
    <header style={{
      height: 56,
      flexShrink: 0,
      background: 'var(--bg-elev)',
      borderBottom: '1px solid var(--border)',
      padding: '0 1.25rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
    }}>

      {/* ── Left: page title ─────────────────────────────────────── */}
      <h1 style={{
        fontSize: '0.9375rem',
        fontWeight: 600,
        color: 'var(--text)',
        lineHeight: 1.2,
        letterSpacing: '-0.01em',
        flexShrink: 0,
      }}>
        {pageLabel}
      </h1>

      {/* ── Center: search bar ───────────────────────────────────── */}
      <div style={{ flex: 1, maxWidth: 340, position: 'relative' }}>
        {searchOpen ? (
          <div style={{ position: 'relative' }}>
            <I.Search
              width={14} height={14}
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }}
            />
            <input
              ref={searchRef}
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              onBlur={() => { if (!searchVal) setSearchOpen(false) }}
              placeholder="Buscar pacientes, citas…"
              className="input"
              style={{ paddingLeft: 30, paddingRight: 12, height: 34, fontSize: '0.8125rem' }}
            />
          </div>
        ) : (
          <button
            onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 50) }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              width: '100%', padding: '0.375rem 0.75rem',
              background: 'var(--bg-subtle)',
              border: '1.5px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-3)',
              fontSize: '0.8125rem',
              cursor: 'text',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--text-3)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <I.Search width={13} height={13} />
            <span style={{ flex: 1, textAlign: 'left' }}>Buscar…</span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 2,
              padding: '0 5px', height: 20,
              background: 'var(--bg-elev)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.6875rem',
              fontFamily: 'var(--font-mono, monospace)',
              color: 'var(--text-3)',
            }}>
              ⌘K
            </span>
          </button>
        )}
      </div>

      {/* ── Right: actions ───────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>

        {/* Dark mode toggle */}
        <button
          onClick={toggleDark}
          title={isDark ? 'Modo claro' : 'Modo oscuro'}
          className="btn btn-ghost btn-icon"
          style={{ color: 'var(--text-3)' }}
        >
          {isDark
            ? <I.Sun  width={17} height={17} />
            : <I.Moon width={17} height={17} />}
        </button>

        {/* Notifications */}
        <button
          className="btn btn-ghost btn-icon"
          style={{ position: 'relative', color: 'var(--text-3)' }}
          title="Notificaciones"
        >
          <I.Bell width={17} height={17} />
          {/* unread dot */}
          <span style={{
            position: 'absolute', top: 6, right: 6,
            width: 6, height: 6,
            background: 'var(--danger)',
            borderRadius: 'var(--radius-full)',
            border: '1.5px solid var(--bg-elev)',
          }} />
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 0.5rem' }} />

        {/* User chip */}
        <button
          onClick={() => navigate('/configuracion')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.25rem 0.5rem 0.25rem 0.25rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            transition: 'background 0.12s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div className="avatar" style={{ width: 30, height: 30, fontSize: '0.6875rem' }}>
            {initials}
          </div>
          <div style={{ textAlign: 'left', display: 'none' }} className="md:block">
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text)', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
              {usuario ? `Dr. ${usuario.nombre}` : 'Usuario'}
            </p>
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-3)', textTransform: 'capitalize', marginTop: 1 }}>
              {usuario?.especialidad || usuario?.rol || ''}
            </p>
          </div>
        </button>
      </div>
    </header>
  )
}
