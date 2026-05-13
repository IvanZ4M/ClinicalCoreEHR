import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useColeccion } from '../hooks/usePocketBase'
import { saludo } from '../lib/roles'
import { I } from '../components/icons'
import pb from '../lib/pb'

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

export default function DashboardRecepcionista() {
  const navigate    = useNavigate()
  const { usuario } = useAuth()

  const filtroHoy = `fecha >= "${hoy()} 00:00:00" && fecha <= "${hoy()} 23:59:59"`

  const { datos: citasHoy, cargando, recargar } = useColeccion('citas', {
    filtro: filtroHoy, orden: 'hora_inicio', expandir: 'paciente,medico',
  })

  const nombre = usuario?.nombre || 'Recepcionista'

  const pendientes  = citasHoy.filter(c => c.estado === 'pendiente')
  const confirmadas = citasHoy.filter(c => c.estado === 'confirmada')
  const enProceso   = citasHoy.filter(c => c.estado === 'en_proceso')
  const completadas = citasHoy.filter(c => c.estado === 'completada')

  const confirmarLlegada = async (citaId) => {
    try {
      await pb.collection('citas').update(citaId, { estado: 'confirmada' })
      recargar()
    } catch (err) {
      console.error('Error al confirmar llegada:', err)
    }
  }

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="anim-fade">

      {/* ── Saludo ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            {saludo(nombre, 'recepcionista')}
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)', marginTop: '0.25rem' }}>
            {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.625rem' }}>
          <button onClick={() => navigate('/citas')} className="btn btn-outline" style={{ fontSize: '0.8125rem' }}>
            <I.Calendar width={14} height={14} /> Gestionar citas
          </button>
          <button onClick={() => navigate('/pacientes')} className="btn btn-primary" style={{ fontSize: '0.8125rem' }}>
            <I.Plus width={14} height={14} /> Nuevo paciente
          </button>
        </div>
      </div>

      {/* ── Estadísticas ─────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <StatCard label="Total hoy"    value={cargando ? '—' : citasHoy.length}      Icon={I.Calendar}    colorVar="var(--accent)" dimVar="var(--accent-dim)" />
        <StatCard label="Pendientes"   value={cargando ? '—' : pendientes.length}     Icon={I.Bell}        colorVar="var(--warn)"   dimVar="var(--warn-dim)"   />
        <StatCard label="En proceso"   value={cargando ? '—' : enProceso.length}      Icon={I.Activity}    colorVar="var(--ok)"     dimVar="var(--ok-dim)"     />
        <StatCard label="Completadas"  value={cargando ? '—' : completadas.length}    Icon={I.Check}       colorVar="var(--text-3)" dimVar="var(--bg-inset)"   />
      </div>

      {/* ── Llegadas pendientes de confirmar ─────────────────────────── */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <I.Bell width={15} height={15} style={{ color: 'var(--warn)' }} />
          <h2 style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text)' }}>
            Llegadas por confirmar
          </h2>
          {!cargando && (
            <span className="badge badge-warn" style={{ marginLeft: 'auto' }}>{pendientes.length}</span>
          )}
        </div>

        {cargando ? (
          <CargandoFila />
        ) : pendientes.length === 0 ? (
          <VacioFila texto="No hay llegadas pendientes" icono={<I.Check width={20} height={20} />} />
        ) : (
          <table style={{ width: '100%', fontSize: '0.8125rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Paciente', 'Hora', 'Médico', 'Motivo', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.625rem 1.25rem', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pendientes.map(c => {
                const pac = c.expand?.paciente
                const med = c.expand?.medico
                const initials = `${pac?.nombre?.[0] || ''}${pac?.apellidos?.[0] || ''}`
                return (
                  <tr key={c.id} className="row-hover" style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.6875rem' }}>{initials}</div>
                        <p style={{ fontWeight: 600, color: 'var(--text)' }}>{pac ? `${pac.nombre} ${pac.apellidos}` : '—'}</p>
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.75rem', color: 'var(--text-2)' }}>
                      {c.hora_inicio || '—'}
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem', color: 'var(--text-2)' }}>
                      {med ? `Dr. ${med.nombre} ${med.apellidos}` : '—'}
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem', color: 'var(--text-2)', maxWidth: 180 }}>
                      <span style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {c.motivo || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <button
                        onClick={() => confirmarLlegada(c.id)}
                        className="btn btn-primary"
                        style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem', gap: 4 }}
                      >
                        <I.Check width={12} height={12} /> Confirmar llegada
                      </button>
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
          <h2 style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text)' }}>Agenda completa del día</h2>
        </div>

        {cargando ? (
          <CargandoFila />
        ) : citasHoy.length === 0 ? (
          <VacioFila texto="No hay citas programadas para hoy" />
        ) : (
          <table style={{ width: '100%', fontSize: '0.8125rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Hora', 'Paciente', 'Médico', 'Estado', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.625rem 1.25rem', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {citasHoy.map(c => {
                const pac = c.expand?.paciente
                const med = c.expand?.medico
                const cfg = ESTADO_COLOR[c.estado] || ESTADO_COLOR.pendiente
                return (
                  <tr key={c.id} className="row-hover" style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem 1.25rem', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.75rem', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
                      {c.hora_inicio || '—'}
                    </td>
                    <td style={{ padding: '0.75rem 1.25rem', fontWeight: 500, color: 'var(--text)' }}>
                      {pac ? `${pac.nombre} ${pac.apellidos}` : '—'}
                    </td>
                    <td style={{ padding: '0.75rem 1.25rem', color: 'var(--text-2)' }}>
                      {med ? `Dr. ${med.nombre}` : '—'}
                    </td>
                    <td style={{ padding: '0.75rem 1.25rem' }}>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 600, padding: '0.25rem 0.625rem', borderRadius: 'var(--radius-full)', background: cfg.dim, color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1.25rem' }}>
                      <button
                        onClick={() => navigate('/citas')}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        Editar <I.ChevronRight width={12} height={12} />
                      </button>
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

function VacioFila({ texto, icono }) {
  return (
    <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-3)', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      {icono && <span style={{ opacity: 0.4 }}>{icono}</span>}
      {texto}
    </div>
  )
}
