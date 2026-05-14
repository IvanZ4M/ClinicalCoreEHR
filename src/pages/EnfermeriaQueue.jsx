import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useColeccion } from '../hooks/usePocketBase'
import { saludo } from '../lib/roles'
import { I } from '../components/icons'

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

function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return null
  const hoy = new Date()
  const nac = new Date(fechaNacimiento)
  let edad = hoy.getFullYear() - nac.getFullYear()
  if (hoy.getMonth() - nac.getMonth() < 0 || (hoy.getMonth() - nac.getMonth() === 0 && hoy.getDate() < nac.getDate())) edad--
  return edad
}

const TIPO_LABEL = {
  consulta_general: 'Consulta General', seguimiento: 'Seguimiento',
  urgencia: 'Urgencia', revision: 'Revisión', chequeo: 'Chequeo',
}

export default function EnfermeriaQueue() {
  const navigate    = useNavigate()
  const { usuario } = useAuth()

  const { inicio, fin } = hoyRango()
  const filtroHoy = `fecha_hora >= "${inicio}" && fecha_hora <= "${fin}" && estado = "en_sala"`

  const { datos: enSala, cargando, recargar } = useColeccion('citas', {
    filtro: filtroHoy, orden: 'fecha_hora', expandir: 'paciente,medico',
  })

  const { datos: triagesHoy } = useColeccion('triage', {
    filtro: `created >= "${inicio}" && created <= "${fin}"`,
    orden: '-created',
  })

  // Auto-refresh every 30 s — nurses need live updates as patients arrive
  const recargarRef = useRef(recargar)
  useEffect(() => { recargarRef.current = recargar })
  useEffect(() => {
    const id = setInterval(() => recargarRef.current(), 30_000)
    return () => clearInterval(id)
  }, [])

  const tieneTriageCompletado = (citaId) =>
    triagesHoy.some(t => t.cita_id === citaId && t.estado === 'completado')

  const valoradosCount  = triagesHoy.filter(t => t.estado === 'completado').length
  const pendientesCount = enSala.filter(c => !tieneTriageCompletado(c.id)).length

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="anim-fade">

      {/* ── Header ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            {saludo(usuario?.nombre || 'Enfermera', 'enfermera')}
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)', marginTop: '0.25rem' }}>
            {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button onClick={recargar} className="btn btn-ghost" style={{ fontSize: '0.8125rem' }}>
          <I.Refresh width={14} height={14} /> Actualizar
        </button>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <StatCard label="En sala"       value={cargando ? '—' : enSala.length}   Icon={I.Patients}  colorVar="var(--warn)"   dimVar="var(--warn-dim)"   />
        <StatCard label="Valorados hoy" value={cargando ? '—' : valoradosCount}  Icon={I.Check}     colorVar="var(--ok)"     dimVar="var(--ok-dim)"     />
        <StatCard label="Pendientes"    value={cargando ? '—' : pendientesCount} Icon={I.Activity}  colorVar="var(--accent)" dimVar="var(--accent-dim)" />
      </div>

      {/* ── Lista de pacientes ────────────────────────────────────── */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <I.Stethoscope width={15} height={15} style={{ color: 'var(--warn)' }} />
          <h2 style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text)' }}>Sala de espera</h2>
          {!cargando && (
            <span className="badge badge-warn" style={{ marginLeft: 'auto' }}>{enSala.length}</span>
          )}
        </div>

        {cargando ? (
          <CargandoFila />
        ) : enSala.length === 0 ? (
          <VacioFila texto="No hay pacientes en sala de espera en este momento" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {enSala.map(cita => {
              const pac        = cita.expand?.paciente
              const med        = cita.expand?.medico
              const yaValorado = tieneTriageCompletado(cita.id)
              const initials   = `${pac?.nombre?.[0] || ''}${pac?.apellidos?.[0] || ''}`
              const edad       = calcularEdad(pac?.fecha_nacimiento)

              return (
                <div
                  key={cita.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '1rem 1.25rem',
                    borderBottom: '1px solid var(--border)',
                    background: yaValorado ? 'var(--ok-dim)' : 'transparent',
                    transition: 'background 0.2s',
                  }}
                >
                  {/* Avatar */}
                  <div className="avatar" style={{ width: 42, height: 42, fontSize: '0.75rem', flexShrink: 0 }}>
                    {initials}
                  </div>

                  {/* Patient info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <p style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.9375rem' }}>
                        {pac ? `${pac.nombre} ${pac.apellidos}` : '—'}
                      </p>
                      {edad !== null && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{edad} años</span>
                      )}
                      {pac?.alergias && (
                        <span style={{
                          fontSize: '0.625rem', fontWeight: 700,
                          padding: '2px 6px', borderRadius: 'var(--radius-full)',
                          background: 'var(--danger-dim)', color: 'var(--danger)',
                        }}>
                          ⚠ Alergias
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
                        {formatearHora(cita.fecha_hora)} · {TIPO_LABEL[cita.tipo] || cita.tipo}
                      </span>
                      {med && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
                          Dr. {med.nombre} {med.apellidos}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action */}
                  <div style={{ flexShrink: 0 }}>
                    {yaValorado ? (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.375rem',
                        fontSize: '0.8125rem', color: 'var(--ok)', fontWeight: 600,
                      }}>
                        <I.Check width={15} height={15} /> Valoración completa
                      </div>
                    ) : (
                      <button
                        onClick={() => navigate(`/enfermeria/${cita.id}`)}
                        className="btn btn-primary"
                        style={{ fontSize: '0.8125rem' }}
                      >
                        <I.Stethoscope width={14} height={14} /> Iniciar valoración
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
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
    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)', fontSize: '0.875rem' }}>
      <I.Check width={28} height={28} style={{ margin: '0 auto 0.75rem', opacity: 0.3, display: 'block' }} />
      {texto}
    </div>
  )
}
