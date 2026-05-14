import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useColeccion } from '../hooks/usePocketBase'
import { saludo } from '../lib/roles'
import { I } from '../components/icons'

const ESTADO_COLOR = {
  programada:  { color: 'var(--accent)',       dim: 'var(--accent-dim)',             label: 'Programada'  },
  confirmada:  { color: 'var(--ok)',           dim: 'var(--ok-dim)',                 label: 'Confirmada'  },
  en_sala:     { color: 'var(--warn)',         dim: 'var(--warn-dim)',               label: 'En sala'     },
  en_consulta: { color: 'var(--violet)',       dim: 'var(--violet-dim)',             label: 'En consulta' },
  completada:  { color: 'var(--text-3)',       dim: 'var(--bg)',                     label: 'Completada'  },
  cancelada:   { color: 'var(--danger)',       dim: 'var(--danger-dim)',             label: 'Cancelada'   },
  no_acudio:   { color: 'oklch(52% 0.22 50)', dim: 'oklch(62% 0.18 50 / 0.12)',    label: 'No acudió'   },
}

function hoyRango() {
  const d = new Date()
  const p = n => String(n).padStart(2, '0')
  const fmt = dt => `${dt.getUTCFullYear()}-${p(dt.getUTCMonth()+1)}-${p(dt.getUTCDate())} ${p(dt.getUTCHours())}:${p(dt.getUTCMinutes())}:${p(dt.getUTCSeconds())}`
  const inicio = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const fin    = new Date(inicio.getTime() + 86400000 - 1000)
  return { inicio: fmt(inicio), fin: fmt(fin) }
}

function formatearHora(fechaISO) {
  if (!fechaISO) return '—'
  return new Date(fechaISO).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

export default function DashboardEnfermera() {
  const navigate       = useNavigate()
  const { usuario }    = useAuth()

  const { inicio, fin } = hoyRango()
  const filtroHoy = `fecha_hora >= "${inicio}" && fecha_hora <= "${fin}"`

  const { datos: citasHoy,    cargando: cargCitas,  recargar: recargarHoy    } = useColeccion('citas', { filtro: filtroHoy,                             orden: 'fecha_hora', expandir: 'paciente' })
  const { datos: citasEnSala, cargando: cargEnSala, recargar: recargarEnSala } = useColeccion('citas', { filtro: `${filtroHoy} && estado = "en_sala"`, orden: 'fecha_hora', expandir: 'paciente' })

  // Auto-refresh every 30 s so the nurse sees status changes without manual reload
  const recargarRef = useRef(recargarEnSala)
  useEffect(() => { recargarRef.current = recargarEnSala })
  useEffect(() => {
    const id = setInterval(() => recargarRef.current(), 30_000)
    return () => clearInterval(id)
  }, [])

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
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => { recargarHoy(); recargarEnSala() }} className="btn btn-ghost" style={{ fontSize: '0.8125rem' }}>
            <I.Refresh width={14} height={14} /> Actualizar
          </button>
          <button onClick={() => navigate('/citas')} className="btn btn-outline" style={{ fontSize: '0.8125rem' }}>
            <I.Calendar width={14} height={14} /> Ver todas las citas
          </button>
        </div>
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
          label="En sala"
          value={cargEnSala ? '—' : citasEnSala.length}
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
          {!cargEnSala && (
            <span className="badge badge-ok" style={{ marginLeft: 'auto' }}>{citasEnSala.length}</span>
          )}
        </div>

        {cargEnSala ? (
          <CargandoFila />
        ) : citasEnSala.length === 0 ? (
          <VacioFila texto="No hay pacientes en sala en este momento" />
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
              {citasEnSala.map(c => {
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
                      {formatearHora(c.fecha_hora)}
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
                const cfg  = ESTADO_COLOR[c.estado] || ESTADO_COLOR.programada
                return (
                  <tr key={c.id} className="row-hover" style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem 1.25rem', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.75rem', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
                      {formatearHora(c.fecha_hora)}
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
