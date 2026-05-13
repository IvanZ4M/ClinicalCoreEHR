import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useColeccion } from '../hooks/usePocketBase'
import { saludo, ROLE_LABELS } from '../lib/roles'
import { I } from '../components/icons'

const ROL_BADGE = {
  medico:          'badge-accent',
  enfermera:       'badge-ok',
  recepcionista:   'badge-warn',
  administrador:   'badge-violet',
}

function hoy() {
  return new Date().toISOString().slice(0, 10)
}

export default function DashboardAdmin() {
  const navigate    = useNavigate()
  const { usuario } = useAuth()

  const { datos: usuarios,   cargando: cargUsuarios } = useColeccion('usuarios',  { filtro: 'activo = true', orden: 'nombre' })
  const { datos: todosUsuarios }                       = useColeccion('usuarios',  {})
  const { datos: consultas,  cargando: cargConsultas } = useColeccion('consultas', { filtro: `created >= "${hoy()} 00:00:00"`, orden: '-created' })
  const { datos: citasHoy,   cargando: cargCitas }     = useColeccion('citas',     { filtro: `fecha >= "${hoy()} 00:00:00" && fecha <= "${hoy()} 23:59:59"`, expandir: 'medico' })

  const nombre = usuario?.nombre || 'Admin'

  // Conteo de usuarios por rol
  const usuariosPorRol = todosUsuarios.reduce((acc, u) => {
    acc[u.rol] = (acc[u.rol] || 0) + 1
    return acc
  }, {})

  const inactivos = todosUsuarios.length - usuarios.length

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="anim-fade">

      {/* ── Saludo ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            {saludo(nombre, 'administrador')}
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)', marginTop: '0.25rem' }}>
            {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button onClick={() => navigate('/usuarios')} className="btn btn-primary" style={{ fontSize: '0.8125rem' }}>
          <I.User width={14} height={14} /> Gestionar usuarios
        </button>
      </div>

      {/* ── Resumen del sistema ────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <StatCard label="Usuarios activos"  value={cargUsuarios ? '—' : usuarios.length}       Icon={I.User}        colorVar="var(--accent)" dimVar="var(--accent-dim)" />
        <StatCard label="Inactivos"          value={cargUsuarios ? '—' : inactivos}              Icon={I.Lock}        colorVar="var(--danger)" dimVar="var(--danger-dim)" />
        <StatCard label="Consultas hoy"      value={cargConsultas ? '—' : consultas.length}     Icon={I.Stethoscope} colorVar="var(--ok)"     dimVar="var(--ok-dim)"     />
        <StatCard label="Citas hoy"          value={cargCitas ? '—' : citasHoy.length}          Icon={I.Calendar}    colorVar="var(--violet)" dimVar="var(--violet-dim)" />
      </div>

      {/* ── Distribución por rol + actividad ─────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

        {/* Distribución de roles */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <I.User width={15} height={15} style={{ color: 'var(--accent)' }} />
            <h2 style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text)' }}>Usuarios por rol</h2>
          </div>
          {cargUsuarios ? (
            <p style={{ color: 'var(--text-3)', fontSize: '0.875rem' }}>Cargando...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {Object.entries(ROLE_LABELS).map(([rol, etiqueta]) => {
                const count = usuariosPorRol[rol] || 0
                const total = todosUsuarios.length || 1
                const pct   = Math.round((count / total) * 100)
                return (
                  <div key={rol}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className={`badge ${ROL_BADGE[rol]}`} style={{ fontSize: '0.6875rem' }}>{etiqueta}</span>
                      </span>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text)' }}>{count}</span>
                    </div>
                    <div style={{ height: 5, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 99, transition: 'width 0.6s var(--ease-out)' }} className="anim-bar-rise" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Actividad de consultas recientes */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <I.Activity width={15} height={15} style={{ color: 'var(--ok)' }} />
            <h2 style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text)' }}>Consultas de hoy</h2>
          </div>
          {cargConsultas ? (
            <p style={{ color: 'var(--text-3)', fontSize: '0.875rem' }}>Cargando...</p>
          ) : consultas.length === 0 ? (
            <p style={{ color: 'var(--text-3)', fontSize: '0.875rem' }}>Sin consultas registradas hoy.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', maxHeight: 220 }}>
              {consultas.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.estado === 'completada' ? 'var(--ok)' : 'var(--warn)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.motivo || 'Sin motivo registrado'}
                    </p>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--text-3)', marginTop: 1 }}>
                      {new Date(c.created).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)', background: c.estado === 'completada' ? 'var(--ok-dim)' : 'var(--warn-dim)', color: c.estado === 'completada' ? 'var(--ok)' : 'var(--warn)', textTransform: 'capitalize', flexShrink: 0 }}>
                    {c.estado || 'borrador'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Usuarios activos ───────────────────────────────────────── */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <I.User width={15} height={15} style={{ color: 'var(--accent)' }} />
            <h2 style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text)' }}>Personal activo</h2>
          </div>
          <button
            onClick={() => navigate('/usuarios')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Ver todos <I.ChevronRight width={12} height={12} />
          </button>
        </div>

        {cargUsuarios ? (
          <CargandoFila />
        ) : usuarios.length === 0 ? (
          <VacioFila texto="No hay usuarios activos" />
        ) : (
          <table style={{ width: '100%', fontSize: '0.8125rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Nombre', 'Correo', 'Rol', 'Especialidad'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.625rem 1.25rem', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usuarios.slice(0, 8).map(u => {
                const initials = `${u.nombre?.[0] || ''}${u.apellidos?.[0] || ''}`
                return (
                  <tr key={u.id} className="row-hover" style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div className="avatar" style={{ width: 30, height: 30, fontSize: '0.6875rem' }}>{initials}</div>
                        <p style={{ fontWeight: 600, color: 'var(--text)' }}>{u.nombre} {u.apellidos}</p>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1.25rem', color: 'var(--text-3)', fontSize: '0.75rem' }}>{u.email}</td>
                    <td style={{ padding: '0.75rem 1.25rem' }}>
                      <span className={`badge ${ROL_BADGE[u.rol] || 'badge-neutral'}`} style={{ textTransform: 'capitalize' }}>
                        {ROLE_LABELS[u.rol] || u.rol}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1.25rem', color: 'var(--text-2)' }}>
                      {u.especialidad || <span style={{ color: 'var(--text-3)' }}>—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, Icon, colorVar, dimVar }) {
  return (
    <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
        <div style={{ width: 30, height: 30, borderRadius: 'var(--radius-md)', background: dimVar, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon width={15} height={15} style={{ color: colorVar }} />
        </div>
      </div>
      <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</p>
    </div>
  )
}

function CargandoFila() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2.5rem', color: 'var(--text-3)', gap: '0.75rem' }}>
      <div style={{ width: 20, height: 20, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} className="anim-spin" />
      <p style={{ fontSize: '0.875rem' }}>Cargando...</p>
    </div>
  )
}

function VacioFila({ texto }) {
  return (
    <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-3)', fontSize: '0.875rem' }}>
      {texto}
    </div>
  )
}
