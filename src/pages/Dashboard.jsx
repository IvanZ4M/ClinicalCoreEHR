import { useState, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useColeccion } from '../hooks/usePocketBase'
import { useTriageRealtime } from '../hooks/useTriage'
import pb from '../lib/pb'
import { I } from '../components/icons'

function obtenerSaludo() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

function formatearHora(fechaISO) {
  if (!fechaISO) return '—'
  return new Date(fechaISO).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

function formatearFecha(fechaISO) {
  if (!fechaISO) return '—'
  return new Date(fechaISO).toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

const ESTADO_CLASS = {
  programada:  'badge badge-accent',
  confirmada:  'badge badge-ok',
  en_sala:     'badge badge-warn',
  en_consulta: 'badge badge-violet',
  completada:  'badge badge-neutral',
  cancelada:   'badge badge-danger',
}
const ESTADO_LABEL = {
  programada: 'Programada', confirmada: 'Confirmada', en_sala: 'En sala',
  en_consulta: 'En consulta', completada: 'Completada', cancelada: 'Cancelada',
}
const TIPO_LABEL = {
  consulta_general: 'Consulta General', seguimiento: 'Seguimiento',
  urgencia: 'Urgencia', revision: 'Revisión', chequeo: 'Chequeo',
}

/* Simple SVG sparkline ------------------------------------------------------- */
function Sparkline({ data, color = 'var(--ok)' }) {
  const max = Math.max(...data, 1)
  const W = 64, H = 22
  const pts = data.map((v, i) => {
    const x = data.length < 2 ? W / 2 : (i / (data.length - 1)) * W
    const y = H - (v / max) * (H - 2) - 1
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  return (
    <svg width={W} height={H} style={{ overflow: 'visible', display: 'block' }}>
      <polyline fill="none" stroke={color} strokeWidth="1.75"
        strokeLinejoin="round" strokeLinecap="round" points={pts} />
    </svg>
  )
}

/* Stat card ------------------------------------------------------------------ */
function StatCard({ label, value, sub, Icon, colorVar, dimVar, sparkline }) {
  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
        <div style={{
          width: 36, height: 36,
          background: dimVar,
          borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon width={17} height={17} style={{ color: colorVar }} />
        </div>
        {sparkline && <div style={{ marginTop: 2 }}>{sparkline}</div>}
      </div>
      <p className="tabular" style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
        {value}
      </p>
      <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '0.375rem' }}>
        {label}
      </p>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.125rem' }}>{sub}</p>
    </div>
  )
}

export default function Dashboard() {
  const navigate    = useNavigate()
  const { usuario } = useAuth()

  const [notificacion,    setNotificacion]    = useState(null)
  const recargarCitasRef                      = useRef(null)

  const hoy = useMemo(() => new Date(), [])

  const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
    .toISOString().replace('T', ' ').slice(0, 19)
  const finDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59)
    .toISOString().replace('T', ' ').slice(0, 19)

  // Start of current week (Monday)
  const inicioSemana = useMemo(() => {
    const d = new Date(hoy)
    const day = d.getDay() === 0 ? 7 : d.getDay()
    d.setDate(d.getDate() - day + 1)
    d.setHours(0, 0, 0, 0)
    return d.toISOString().replace('T', ' ').slice(0, 19)
  }, [hoy])

  // 7 days ago start
  const inicio7Dias = useMemo(() => {
    const d = new Date(hoy)
    d.setDate(d.getDate() - 6)
    d.setHours(0, 0, 0, 0)
    return d.toISOString().replace('T', ' ').slice(0, 19)
  }, [hoy])

  const { datos: todosLosPacientes } = useColeccion('pacientes', { filtro: 'activo = true' })
  const { datos: citasHoy, recargar: recargarCitas } = useColeccion('citas', {
    filtro: `fecha_hora >= "${inicioDia}" && fecha_hora <= "${finDia}"`,
    orden: 'fecha_hora', expandir: 'paciente,medico',
  })
  const { datos: informesPendientes } = useColeccion('consultas', { filtro: 'estado = "borrador"' })
  const { datos: todasLasCitas }      = useColeccion('citas', { filtro: 'estado != "cancelada"' })
  const { datos: diagnosticos }       = useColeccion('diagnosticos', { porPagina: 500 })
  const { datos: triagesHoy }         = useColeccion('triage', {
    filtro: `created >= "${inicioDia}" && created <= "${finDia}" && estado = "completado"`,
  })
  const { datos: citasCompletadasSemana } = useColeccion('citas', {
    filtro: `estado = "completada" && fecha_hora >= "${inicioSemana}"`,
    orden: 'fecha_hora',
  })
  const { datos: citas7Dias } = useColeccion('citas', {
    filtro: `estado = "completada" && fecha_hora >= "${inicio7Dias}"`,
    orden: 'fecha_hora',
  })

  recargarCitasRef.current = recargarCitas

  useTriageRealtime(async (record) => {
    try {
      const pac = await pb.collection('pacientes').getOne(record.paciente_id)
      setNotificacion({ nombre: `${pac.nombre} ${pac.apellidos}`, id: record.id })
    } catch {
      setNotificacion({ nombre: 'Paciente', id: record.id })
    }
    recargarCitasRef.current?.()
  })

  const diagnosticosFrecuentes = useMemo(() => {
    const conteo = {}
    diagnosticos.forEach(d => { conteo[d.descripcion] = (conteo[d.descripcion] || 0) + 1 })
    return Object.entries(conteo).sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([nombre, cantidad]) => ({
        nombre,
        porcentaje: Math.round((cantidad / Math.max(diagnosticos.length, 1)) * 100),
      }))
  }, [diagnosticos])

  // Sparkline: completed citas per day for last 7 days
  const sparkData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(hoy)
      d.setDate(d.getDate() - (6 - i))
      const start = new Date(d); start.setHours(0, 0, 0, 0)
      const end   = new Date(d); end.setHours(23, 59, 59, 999)
      return citas7Dias.filter(c => {
        if (!c.fecha_hora) return false
        const t = new Date(c.fecha_hora).getTime()
        return t >= start.getTime() && t <= end.getTime()
      }).length
    })
  }, [citas7Dias, hoy])

  const citasPendientes = todasLasCitas.filter(
    c => c.estado === 'programada' || c.estado === 'confirmada'
  ).length

  const tieneTriageHoy = (citaId) => triagesHoy.some(t => t.cita_id === citaId)

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="anim-fade">

      {/* ── Triage notification banner ───────────────────────────── */}
      {notificacion && (
        <div className="anim-slide-left" style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          background: 'var(--ok-dim)', border: '1px solid var(--ok)',
          borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem',
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ok)', flexShrink: 0 }} />
          <p style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500, color: 'var(--text)' }}>
            Paciente listo —{' '}
            <strong>{notificacion.nombre}</strong>
            {' '}ha completado la valoración inicial de enfermería.
          </p>
          <button onClick={() => setNotificacion(null)} className="btn-icon btn-ghost" style={{ padding: '0.25rem', borderRadius: 'var(--radius-sm)' }}>
            <I.X width={14} height={14} />
          </button>
        </div>
      )}

      {/* ── Header ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            {obtenerSaludo()}, Dr.&nbsp;{usuario?.nombre}
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)', marginTop: '0.25rem', textTransform: 'capitalize' }}>
            {formatearFecha(new Date().toISOString())}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => navigate('/citas')} className="btn btn-outline" style={{ fontSize: '0.8125rem' }}>
            <I.Calendar width={14} height={14} /> Nueva Cita
          </button>
          <button onClick={() => navigate('/pacientes')} className="btn btn-primary" style={{ fontSize: '0.8125rem' }}>
            <I.Plus width={14} height={14} /> Nuevo Paciente
          </button>
        </div>
      </div>

      {/* ── Stats (4 cards) ──────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
        <StatCard
          label="Total Pacientes"
          value={todosLosPacientes.length}
          sub="activos en el sistema"
          Icon={I.Patients}
          colorVar="var(--accent)"
          dimVar="var(--accent-dim)"
        />
        <StatCard
          label="Citas Hoy"
          value={citasHoy.length}
          sub={`${citasPendientes} pendientes`}
          Icon={I.Calendar}
          colorVar="var(--ok)"
          dimVar="var(--ok-dim)"
        />
        <StatCard
          label="Borradores"
          value={informesPendientes.length}
          sub={informesPendientes.length > 0 ? 'consultas sin completar' : 'al día'}
          Icon={I.Clipboard}
          colorVar={informesPendientes.length > 0 ? 'var(--warn)' : 'var(--text-3)'}
          dimVar={informesPendientes.length > 0 ? 'var(--warn-dim)' : 'var(--bg-subtle)'}
        />
        <StatCard
          label="Completadas — semana"
          value={citasCompletadasSemana.length}
          sub="últimos 7 días"
          Icon={I.Check}
          colorVar="var(--violet)"
          dimVar="oklch(62% 0.18 290 / 0.12)"
          sparkline={<Sparkline data={sparkData} color="var(--violet)" />}
        />
      </div>

      {/* ── Main grid ────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1rem' }}>

        {/* Citas de hoy */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text)' }}>Citas de Hoy</h2>
            <button onClick={() => navigate('/citas')} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 500, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
              Ver agenda <I.ChevronRight width={13} height={13} />
            </button>
          </div>

          {citasHoy.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3.5rem 1rem', color: 'var(--text-3)' }}>
              <I.Calendar width={32} height={32} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
              <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>Sin citas para hoy</p>
            </div>
          ) : (
            <table style={{ width: '100%', fontSize: '0.8125rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Paciente', 'Hora', 'Tipo', 'Estado', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '0.625rem 1rem', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {citasHoy.map(cita => {
                  const pac = cita.expand?.paciente
                  const initials = pac ? `${pac.nombre?.[0] || ''}${pac.apellidos?.[0] || ''}` : '?'
                  const conTriage = tieneTriageHoy(cita.id)
                  const tieneAlergias = pac?.alergias_criticas && pac?.alergias

                  // Determine action label + destination
                  const { accionLabel, accionUrl } = (() => {
                    if (cita.estado === 'en_consulta')
                      return { accionLabel: 'Continuar consulta', accionUrl: `/consulta/nueva?paciente=${cita.paciente}` }
                    if (cita.estado === 'en_sala' || cita.estado === 'confirmada')
                      return { accionLabel: 'Iniciar visita', accionUrl: `/consulta/nueva?paciente=${cita.paciente}` }
                    if (cita.estado === 'completada')
                      return { accionLabel: 'Ver resumen', accionUrl: `/pacientes/${cita.paciente}` }
                    return { accionLabel: 'Ver historial', accionUrl: `/pacientes/${cita.paciente}` }
                  })()

                  return (
                    <tr key={cita.id} className="row-hover" style={{ borderBottom: '1px solid var(--border)', background: conTriage ? 'color-mix(in oklch, var(--ok) 6%, transparent)' : undefined }}>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                          <div className="avatar" style={{ width: 28, height: 28, fontSize: '0.625rem' }}>{initials}</div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 500, color: 'var(--text)' }}>
                                {pac ? `${pac.nombre} ${pac.apellidos}` : 'Desconocido'}
                              </span>
                              {tieneAlergias && (
                                <span style={{ fontSize: '0.5625rem', fontWeight: 700, color: 'var(--danger)', background: 'var(--danger-dim)', border: '1px solid var(--danger)', borderRadius: 3, padding: '0 4px', whiteSpace: 'nowrap' }}>
                                  ⚠ Alergias
                                </span>
                              )}
                            </div>
                            {conTriage && (
                              <span style={{ display: 'block', fontSize: '0.625rem', fontWeight: 600, color: 'var(--ok)', marginTop: 1 }}>
                                ✓ Valorado por enfermería
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>
                        {formatearHora(cita.fecha_hora)}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-2)' }}>
                        {TIPO_LABEL[cita.tipo] || cita.tipo}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span className={ESTADO_CLASS[cita.estado] || 'badge badge-neutral'}>
                          {ESTADO_LABEL[cita.estado] || cita.estado}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <button
                          onClick={() => navigate(accionUrl)}
                          style={{
                            fontSize: '0.75rem', fontWeight: 600,
                            color: cita.estado === 'en_consulta' ? 'var(--violet)' : 'var(--accent)',
                            background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                          }}
                        >
                          {accionLabel}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Diagnósticos frecuentes */}
          <div className="card" style={{ flex: 1, padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <I.Activity width={15} height={15} style={{ color: 'var(--text-3)' }} />
              <h2 style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)' }}>Diagnósticos Frecuentes</h2>
            </div>
            {diagnosticosFrecuentes.length === 0 ? (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', textAlign: 'center', padding: '1.5rem 0' }}>
                Se mostrarán al registrar consultas
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {diagnosticosFrecuentes.map((dx, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                      <span style={{ color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '0.5rem' }}>
                        {dx.nombre}
                      </span>
                      <span className="tabular" style={{ color: 'var(--text-3)', flexShrink: 0 }}>{dx.porcentaje}%</span>
                    </div>
                    <div style={{ width: '100%', background: 'var(--bg-inset)', borderRadius: 'var(--radius-full)', height: 4 }}>
                      <div style={{ width: `${dx.porcentaje}%`, height: 4, background: 'var(--accent)', borderRadius: 'var(--radius-full)', transition: 'width 0.5s var(--ease-out)' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Borradores */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h2 style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)', marginBottom: '0.75rem' }}>Borradores</h2>
            {informesPendientes.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--ok)' }}>
                <div style={{ width: 6, height: 6, borderRadius: 'var(--radius-full)', background: 'var(--ok)' }} />
                Todo al día
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {informesPendientes.slice(0, 3).map(inf => (
                  <div key={inf.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-2)' }}>
                    <div style={{ width: 6, height: 6, borderRadius: 'var(--radius-full)', background: 'var(--warn)', marginTop: 4, flexShrink: 0 }} />
                    <p style={{ lineHeight: 1.4 }}>{inf.motivo || 'Consulta sin completar'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
