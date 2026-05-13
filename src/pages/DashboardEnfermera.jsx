import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useColeccion } from '../hooks/usePocketBase'
import { saludo } from '../lib/roles'
import { I } from '../components/icons'

const ESTADO_COLOR = {
  pendiente:   { color: 'var(--warn)',   dim: 'var(--warn-dim)',   label: 'Pendiente'   },
  confirmada:  { color: 'var(--accent)', dim: 'var(--accent-dim)', label: 'Confirmada'  },
  en_proceso:  { color: 'var(--ok)',     dim: 'var(--ok-dim)',     label: 'En proceso'  },
  completada:  { color: 'var(--text-3)', dim: 'var(--bg)',         label: 'Completada'  },
  cancelada:   { color: 'var(--danger)', dim: 'var(--danger-dim)', label: 'Cancelada'   },
}

function hoy() {
  return new Date().toISOString().slice(0, 10)
}

export default function DashboardEnfermera() {
  const navigate       = useNavigate()
  const { usuario }    = useAuth()

  const filtroHoy = `fecha >= "${hoy()} 00:00:00" && fecha <= "${hoy()} 23:59:59"`

  const { datos: citasHoy,      cargando: cargCitas }    = useColeccion('citas', { filtro: filtroHoy,              orden: 'hora_inicio', expandir: 'paciente' })
  const { datos: citasProceso,  cargando: cargProceso }  = useColeccion('citas', { filtro: `${filtroHoy} && estado = "en_proceso"`, orden: 'hora_inicio', expandir: 'paciente' })

  const nombre = usuario?.nombre || 'Enfermera'

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="anim-fade">

      {/* ── Saludo ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            {saludo(nombre, 'enfermera')}
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)', marginTop: '0.25rem' }}>
            {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button onClick={() => navigate('/citas')} className="btn btn-outline" style={{ fontSize: '0.8125rem' }}>
          <I.Calendar width={14} height={14} /> Ver todas las citas
        </button>
      </div>

      {/* ── Estadísticas del día ────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <StatCard
          label="Citas hoy"
          value={cargCitas ? '—' : citasHoy.length}
          Icon={I.Calendar}
          colorVar="var(--accent)"
          dimVar="var(--accent-dim)"
        />
        <StatCard
          label="En proceso"
          value={cargProceso ? '—' : citasProceso.length}
          Icon={I.Activity}
          colorVar="var(--ok)"
          dimVar="var(--ok-dim)"
        />
        <StatCard
          label="Completadas"
          value={cargCitas ? '—' : citasHoy.filter(c => c.estado === 'completada').length}
          Icon={I.Check}
          colorVar="var(--text-2)"
          dimVar="var(--bg-inset)"
        />
      </div>

      {/* ── Citas en proceso — acción principal ─────────────────────── */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <I.Activity width={15} height={15} style={{ color: 'var(--ok)' }} />
          <h2 style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text)' }}>
            Pacientes en proceso
          </h2>
          {!cargProceso && (
            <span className="badge badge-ok" style={{ marginLeft: 'auto' }}>{citasProceso.length}</span>
          )}
        </div>

        {cargProceso ? (
          <CargandoFila />
        ) : citasProceso.length === 0 ? (
          <VacioFila texto="No hay pacientes en proceso en este momento" />
        ) : (
          <table style={{ width: '100%', fontSize: '0.8125rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Paciente', 'Hora', 'Motivo', 'Acción'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.625rem 1.25rem', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {citasProceso.map(c => {
                const pac = c.expand?.paciente
                const initials = `${pac?.nombre?.[0] || ''}${pac?.apellidos?.[0] || ''}`
                return (
                  <tr key={c.id} className="row-hover" style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.6875rem' }}>{initials}</div>
                        <p style={{ fontWeight: 600, color: 'var(--text)' }}>{pac ? `${pac.nombre} ${pac.apellidos}` : '—'}</p>
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem', color: 'var(--text-2)', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.75rem' }}>
                      {c.hora_inicio || '—'}
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem', color: 'var(--text-2)', maxWidth: 200 }}>
                      <span style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {c.motivo || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      {pac && (
                        <button
                          onClick={() => navigate(`/pacientes/${pac.id}`)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          Ver expediente <I.ChevronRight width={12} height={12} />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Agenda completa del día ─────────────────────────────────── */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <I.Calendar width={15} height={15} style={{ color: 'var(--accent)' }} />
          <h2 style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text)' }}>Agenda del día</h2>
        </div>

        {cargCitas ? (
          <CargandoFila />
        ) : citasHoy.length === 0 ? (
          <VacioFila texto="No hay citas programadas para hoy" />
        ) : (
          <table style={{ width: '100%', fontSize: '0.8125rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Hora', 'Paciente', 'Estado'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.625rem 1.25rem', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {citasHoy.map(c => {
                const pac  = c.expand?.paciente
                const cfg  = ESTADO_COLOR[c.estado] || ESTADO_COLOR.pendiente
                return (
                  <tr key={c.id} className="row-hover" style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem 1.25rem', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.75rem', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
                      {c.hora_inicio || '—'}
                    </td>
                    <td style={{ padding: '0.75rem 1.25rem', fontWeight: 500, color: 'var(--text)' }}>
                      {pac ? `${pac.nombre} ${pac.apellidos}` : '—'}
                    </td>
                    <td style={{ padding: '0.75rem 1.25rem' }}>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 600, padding: '0.25rem 0.625rem', borderRadius: 'var(--radius-full)', background: cfg.dim, color: cfg.color }}>
                        {cfg.label}
                      </span>
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
