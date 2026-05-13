import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useNotifications } from '../../context/NotificationsContext'
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

function tiempoRelativo(fechaISO) {
  if (!fechaISO) return ''
  const diff = Date.now() - new Date(fechaISO).getTime()
  const min  = Math.floor(diff / 60000)
  if (min < 1)   return 'ahora'
  if (min < 60)  return `hace ${min} min`
  const hrs = Math.floor(min / 60)
  if (hrs < 24)  return `hace ${hrs} h`
  return `hace ${Math.floor(hrs / 24)} d`
}

const TIPO_ICONO = {
  nueva_cita:    '📅',
  paciente_listo: '🔔',
  recordatorio:  '⏰',
}

export default function TopBar() {
  const { usuario } = useAuth()
  const { isDark, toggleDark } = useTheme()
  const { notificaciones, totalNoLeidas, marcarLeida, marcarTodasLeidas } = useNotifications()
  const location = useLocation()
  const navigate = useNavigate()

  const [searchOpen,  setSearchOpen]  = useState(false)
  const [searchVal,   setSearchVal]   = useState('')
  const [panelAbierto, setPanelAbierto] = useState(false)

  const searchRef = useRef(null)
  const bellRef   = useRef(null)
  const panelRef  = useRef(null)

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
      if (e.key === 'Escape') { setSearchOpen(false); setSearchVal(''); setPanelAbierto(false) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  /* Close notification panel on outside click */
  useEffect(() => {
    if (!panelAbierto) return
    const handler = (e) => {
      if (!bellRef.current?.contains(e.target) && !panelRef.current?.contains(e.target)) {
        setPanelAbierto(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [panelAbierto])

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
      <h1 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text)', lineHeight: 1.2, letterSpacing: '-0.01em', flexShrink: 0 }}>
        {pageLabel}
      </h1>

      {/* ── Center: search bar ───────────────────────────────────── */}
      <div style={{ flex: 1, maxWidth: 340, position: 'relative' }}>
        {searchOpen ? (
          <div style={{ position: 'relative' }}>
            <I.Search width={14} height={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
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
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.375rem 0.75rem', background: 'var(--bg-subtle)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-3)', fontSize: '0.8125rem', cursor: 'text', transition: 'border-color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--text-3)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <I.Search width={13} height={13} />
            <span style={{ flex: 1, textAlign: 'left' }}>Buscar…</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, padding: '0 5px', height: 20, background: 'var(--bg-elev)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.6875rem', fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-3)' }}>
              ⌘K
            </span>
          </button>
        )}
      </div>

      {/* ── Right: actions ───────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>

        {/* Dark mode toggle */}
        <button onClick={toggleDark} title={isDark ? 'Modo claro' : 'Modo oscuro'} className="btn btn-ghost btn-icon" style={{ color: 'var(--text-3)' }}>
          {isDark ? <I.Sun width={17} height={17} /> : <I.Moon width={17} height={17} />}
        </button>

        {/* Notifications bell */}
        <div style={{ position: 'relative' }}>
          <button
            ref={bellRef}
            onClick={() => setPanelAbierto(p => !p)}
            className="btn btn-ghost btn-icon"
            style={{ position: 'relative', color: panelAbierto ? 'var(--text)' : 'var(--text-3)' }}
            title="Notificaciones"
          >
            <I.Bell width={17} height={17} />
            {totalNoLeidas > 0 && (
              <span style={{
                position: 'absolute', top: 4, right: 4,
                minWidth: 14, height: 14, lineHeight: '14px',
                background: 'var(--danger)',
                borderRadius: 'var(--radius-full)',
                border: '1.5px solid var(--bg-elev)',
                fontSize: '0.5rem', fontWeight: 700, color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 2px',
              }}>
                {totalNoLeidas > 9 ? '9+' : totalNoLeidas}
              </span>
            )}
          </button>

          {/* Notifications panel */}
          {panelAbierto && (
            <div
              ref={panelRef}
              className="card anim-scale-in"
              style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                width: 320, maxHeight: 440, overflowY: 'auto',
                zIndex: 200, padding: 0,
                boxShadow: '0 8px 24px -4px rgba(0,0,0,0.18)',
              }}
            >
              {/* Panel header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)' }}>Notificaciones</span>
                  {totalNoLeidas > 0 && (
                    <span className="badge badge-danger" style={{ fontSize: '0.625rem' }}>{totalNoLeidas}</span>
                  )}
                </div>
                {totalNoLeidas > 0 && (
                  <button
                    onClick={marcarTodasLeidas}
                    style={{ fontSize: '0.6875rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    Marcar todas leídas
                  </button>
                )}
              </div>

              {/* Panel body */}
              {notificaciones.length === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-3)' }}>
                  <I.Bell width={28} height={28} style={{ opacity: 0.3, margin: '0 auto 0.5rem', display: 'block' }} />
                  <p style={{ fontSize: '0.8125rem' }}>Sin notificaciones</p>
                </div>
              ) : (
                <div>
                  {notificaciones.slice(0, 15).map(n => (
                    <button
                      key={n.id}
                      onClick={() => { marcarLeida(n.id); if (n.cita) { navigate('/citas'); setPanelAbierto(false) } }}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                        width: '100%', padding: '0.75rem 1rem',
                        background: n.leida ? 'transparent' : 'color-mix(in oklch, var(--accent) 5%, transparent)',
                        borderBottom: '1px solid var(--border)',
                        border: 'none', cursor: 'pointer',
                        textAlign: 'left', transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                      onMouseLeave={e => e.currentTarget.style.background = n.leida ? 'transparent' : 'color-mix(in oklch, var(--accent) 5%, transparent)'}
                    >
                      <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: 1 }}>
                        {TIPO_ICONO[n.tipo] || '🔔'}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text)', lineHeight: 1.45, fontWeight: n.leida ? 400 : 500 }}>
                          {n.mensaje}
                        </p>
                        <p style={{ fontSize: '0.6875rem', color: 'var(--text-3)', marginTop: 2 }}>
                          {tiempoRelativo(n.created)}
                        </p>
                      </div>
                      {!n.leida && (
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: 5 }} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 0.5rem' }} />

        {/* User chip */}
        <button
          onClick={() => navigate('/configuracion')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.5rem 0.25rem 0.25rem', borderRadius: 'var(--radius-md)', border: 'none', background: 'transparent', cursor: 'pointer', transition: 'background 0.12s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div className="avatar" style={{ width: 30, height: 30, fontSize: '0.6875rem' }}>{initials}</div>
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
