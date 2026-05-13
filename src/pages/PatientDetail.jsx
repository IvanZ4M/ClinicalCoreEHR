import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useRegistro, useColeccion } from '../hooks/usePocketBase'
import { useAuth } from '../context/AuthContext'
import { PATIENT_TABS_POR_ROL } from '../lib/roles'
import pb from '../lib/pb'
import { I } from '../components/icons'

function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return '—'
  const hoy = new Date()
  const nac = new Date(fechaNacimiento)
  let edad = hoy.getFullYear() - nac.getFullYear()
  const m = hoy.getMonth() - nac.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--
  return edad
}

function formatearFecha(fechaISO) {
  if (!fechaISO) return '—'
  return new Date(fechaISO).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatearFechaHora(fechaISO) {
  if (!fechaISO) return '—'
  return new Date(fechaISO).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const TABS_TODOS = ['Datos Personales', 'Antecedentes', 'Historial Médico', 'Consultas Previas']

export default function PatientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario } = useAuth()

  const tabsPermitidos = PATIENT_TABS_POR_ROL[usuario?.rol] ?? TABS_TODOS

  const [tabActiva, setTabActiva]           = useState('Datos Personales')
  const [editandoAlergias, setEditando]     = useState(false)
  const [alergiasTxt, setAlergiasTxt]       = useState('')
  const [guardando, setGuardando]           = useState(false)

  const { dato: paciente, cargando, error, recargar: recargarPaciente } = useRegistro('pacientes', id)

  const { datos: consultas } = useColeccion('consultas', {
    filtro: `paciente = "${id}"`, orden: '-fecha', expandir: 'medico',
  })

  const { datos: diagnosticos } = useColeccion('diagnosticos', {
    filtro: consultas.length > 0
      ? consultas.map(c => `consulta = "${c.id}"`).join(' || ')
      : 'id = ""',
    orden: '-created',
  })

  const ahora = new Date().toISOString().replace('T', ' ').slice(0, 19)
  const { datos: citasFuturas } = useColeccion('citas', {
    filtro: `paciente = "${id}" && fecha_hora >= "${ahora}" && estado != "cancelada"`,
    orden: 'fecha_hora', expandir: 'medico',
  })

  const handleGuardarAlergias = async () => {
    setGuardando(true)
    try {
      await pb.collection('pacientes').update(id, { alergias: alergiasTxt })
      setEditando(false)
      recargarPaciente()
    } catch (e) { console.error(e) }
    finally { setGuardando(false) }
  }

  if (cargando) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{ textAlign: 'center', color: 'var(--text-3)' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', margin: '0 auto 12px' }} className="anim-spin" />
        <p style={{ fontSize: '0.875rem' }}>Cargando expediente...</p>
      </div>
    </div>
  )

  if (error || !paciente) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{ textAlign: 'center', color: 'var(--text-3)' }}>
        <I.Alert width={40} height={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
        <p style={{ fontWeight: 500, color: 'var(--text-2)' }}>Paciente no encontrado</p>
        <button onClick={() => navigate('/pacientes')} style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, margin: '1rem auto 0' }}>
          <I.ArrowLeft width={13} height={13} /> Volver a pacientes
        </button>
      </div>
    </div>
  )

  const condicionesActivas = diagnosticos.filter(d => d.estado === 'activo' || d.estado === 'cronico')
  const initials = `${paciente.nombre?.[0] || ''}${paciente.apellidos?.[0] || ''}`

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="anim-fade">

      {/* ── Back ─────────────────────────────────────────────────── */}
      <button onClick={() => navigate('/pacientes')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}>
        <I.ArrowLeft width={14} height={14} /> Volver a Pacientes
      </button>

      {/* ── Patient header ───────────────────────────────────────── */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
          <div className="avatar" style={{ width: 72, height: 72, fontSize: '1.5rem', borderRadius: 'var(--radius-lg)', flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                  {paciente.nombre} {paciente.apellidos}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.625rem', marginTop: '0.5rem' }}>
                  <span className="mono" style={{ fontSize: '0.6875rem', background: 'var(--bg-subtle)', color: 'var(--text-3)', border: '1px solid var(--border)', padding: '0 6px', borderRadius: 'var(--radius-sm)' }}>
                    #{paciente.id.slice(-6).toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-2)' }}>{calcularEdad(paciente.fecha_nacimiento)} años</span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-2)', textTransform: 'capitalize' }}>{paciente.sexo || '—'}</span>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text)' }}>{paciente.grupo_sanguineo || 'Tipo no registrado'}</span>
                </div>
                <p className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.25rem' }}>
                  CURP: {paciente.curp || '—'}
                </p>
              </div>
              <button onClick={() => navigate(`/consulta/nueva?paciente=${id}`)} className="btn btn-primary" style={{ flexShrink: 0, fontSize: '0.8125rem' }}>
                <I.Plus width={14} height={14} /> Nueva Consulta
              </button>
            </div>

            {paciente.alergias_criticas && paciente.alergias && (
              <div style={{ marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--danger-dim)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '0.5rem 0.875rem', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', fontWeight: 600 }}>
                <I.Alert width={14} height={14} />
                ALERGIAS CRÍTICAS: {paciente.alergias.toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
        {tabsPermitidos.map(tab => (
          <button key={tab} onClick={() => setTabActiva(tab)}
            className={`tab${tabActiva === tab ? ' active' : ''}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* ── TAB: Datos Personales ─────────────────────────────────── */}
      {tabActiva === 'Datos Personales' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 280px', gap: '1rem' }}>

          {/* Signos vitales */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <I.Activity width={15} height={15} style={{ color: 'var(--text-3)' }} />
              <h3 style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)', flex: 1 }}>Signos Vitales</h3>
              {consultas[0]?.signos_vitales && (
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-3)' }}>{formatearFecha(consultas[0]?.fecha)}</span>
              )}
            </div>
            {consultas[0]?.signos_vitales ? (() => {
              const sv = typeof consultas[0].signos_vitales === 'string'
                ? JSON.parse(consultas[0].signos_vitales)
                : consultas[0].signos_vitales
              return (
                <div>
                  {sv.presion_arterial  && <SignoVital label="Presión Arterial" valor={sv.presion_arterial} unidad="mmHg" />}
                  {sv.frecuencia_cardiaca && <SignoVital label="Frec. Cardíaca" valor={sv.frecuencia_cardiaca} unidad="lpm" />}
                  {sv.temperatura        && <SignoVital label="Temperatura" valor={sv.temperatura} unidad="°C" />}
                  {sv.peso && sv.talla && <SignoVital label="IMC" valor={(sv.peso / ((sv.talla / 100) ** 2)).toFixed(1)} unidad="kg/m²" />}
                  {sv.saturacion_o2      && <SignoVital label="SpO₂" valor={sv.saturacion_o2} unidad="%" />}
                </div>
              )
            })() : (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', textAlign: 'center', padding: '1rem 0' }}>Sin registros de signos vitales</p>
            )}
          </div>

          {/* Condiciones activas */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <I.Stethoscope width={15} height={15} style={{ color: 'var(--text-3)' }} />
              <h3 style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)' }}>Condiciones Actuales</h3>
            </div>
            {condicionesActivas.length === 0 ? (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', textAlign: 'center', padding: '1rem 0' }}>Sin condiciones registradas</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {condicionesActivas.map(dx => (
                  <div key={dx.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text)' }}>{dx.descripcion}</span>
                      <span className={dx.estado === 'cronico' ? 'badge badge-warn' : 'badge badge-accent'} style={{ fontSize: '0.625rem' }}>
                        {dx.estado === 'cronico' ? 'Crónico' : 'Activo'}
                      </span>
                    </div>
                    <p className="mono" style={{ fontSize: '0.6875rem', color: 'var(--text-3)' }}>CIE-10: {dx.codigo_cie10}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Próxima cita */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <I.Calendar width={15} height={15} style={{ color: 'var(--text-3)' }} />
                <h3 style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)' }}>Próxima Cita</h3>
              </div>
              {citasFuturas[0] ? (
                <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text)', textTransform: 'capitalize' }}>
                    {citasFuturas[0].tipo?.replace(/_/g, ' ')}
                  </p>
                  <p style={{ color: 'var(--accent)', fontWeight: 500, fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                    {formatearFechaHora(citasFuturas[0].fecha_hora)}
                  </p>
                  {citasFuturas[0].expand?.medico && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-2)', marginTop: '0.25rem' }}>
                      Dr. {citasFuturas[0].expand.medico.nombre} {citasFuturas[0].expand.medico.apellidos}
                    </p>
                  )}
                </div>
              ) : (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', textAlign: 'center', padding: '0.5rem 0' }}>Sin citas próximas</p>
              )}
            </div>

            {/* Contacto */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)', marginBottom: '0.75rem' }}>Contacto</h3>
              <Dato label="Teléfono" valor={paciente.telefono} />
              <Dato label="Correo"   valor={paciente.email} xs />
              <Dato label="Registro" valor={formatearFecha(paciente.created)} />
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Antecedentes ────────────────────────────────────── */}
      {tabActiva === 'Antecedentes' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <I.Shield width={15} height={15} style={{ color: 'var(--text-3)' }} />
                <h3 style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)' }}>Alergias y Reacciones</h3>
              </div>
              {!editandoAlergias && (
                <button onClick={() => { setAlergiasTxt(paciente.alergias || ''); setEditando(true) }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <I.Edit width={12} height={12} /> Editar
                </button>
              )}
            </div>
            {editandoAlergias ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <textarea value={alergiasTxt} onChange={e => setAlergiasTxt(e.target.value)} rows={4}
                  className="input" style={{ resize: 'none' }} placeholder="Ej: Penicilina, Látex..." />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={handleGuardarAlergias} disabled={guardando} className="btn btn-primary" style={{ fontSize: '0.8125rem' }}>
                    <I.Check width={13} height={13} /> {guardando ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button onClick={() => setEditando(false)} className="btn btn-outline" style={{ fontSize: '0.8125rem' }}>
                    <I.X width={13} height={13} /> Cancelar
                  </button>
                </div>
              </div>
            ) : (
              paciente.alergias ? (
                <div style={{
                  padding: '0.875rem', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', lineHeight: 1.6,
                  background: paciente.alergias_criticas ? 'var(--danger-dim)' : 'var(--warn-dim)',
                  border: `1px solid ${paciente.alergias_criticas ? 'var(--danger)' : 'var(--warn)'}`,
                  color: paciente.alergias_criticas ? 'var(--danger)' : 'var(--warn)',
                }}>
                  {paciente.alergias_criticas && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 700, fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>
                      <I.Alert width={11} height={11} /> Críticas
                    </div>
                  )}
                  {paciente.alergias}
                </div>
              ) : (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-3)' }}>Sin alergias registradas</p>
              )
            )}
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)', marginBottom: '1rem' }}>Información General</h3>
            <Dato label="Nombre completo"    valor={`${paciente.nombre} ${paciente.apellidos}`} />
            <Dato label="CURP"               valor={paciente.curp} mono />
            <Dato label="Fecha de nacimiento" valor={formatearFecha(paciente.fecha_nacimiento)} />
            <Dato label="Edad"               valor={`${calcularEdad(paciente.fecha_nacimiento)} años`} />
            <Dato label="Sexo"               valor={paciente.sexo} capitalizar />
            <Dato label="Grupo sanguíneo"    valor={paciente.grupo_sanguineo} />
          </div>
        </div>
      )}

      {/* ── TAB: Historial Médico ─────────────────────────────────── */}
      {tabActiva === 'Historial Médico' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text)' }}>Todos los diagnósticos registrados</h3>
          </div>
          {diagnosticos.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3.5rem 1rem', color: 'var(--text-3)' }}>
              <I.Clipboard width={36} height={36} style={{ marginBottom: '0.75rem', opacity: 0.3 }} />
              <p style={{ fontSize: '0.875rem' }}>Sin diagnósticos registrados</p>
              <button onClick={() => navigate(`/consulta/nueva?paciente=${id}`)} className="btn btn-primary" style={{ marginTop: '1rem', fontSize: '0.8125rem' }}>
                Iniciar primera consulta
              </button>
            </div>
          ) : (
            <table style={{ width: '100%', fontSize: '0.8125rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Código CIE-10', 'Diagnóstico', 'Tipo', 'Estado', 'Fecha'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '0.625rem 1.25rem', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {diagnosticos.map(dx => (
                  <tr key={dx.id} className="row-hover" style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem 1.25rem' }}>
                      <span className="mono" style={{ color: 'var(--accent)', fontWeight: 600 }}>{dx.codigo_cie10}</span>
                    </td>
                    <td style={{ padding: '0.75rem 1.25rem', color: 'var(--text)' }}>{dx.descripcion}</td>
                    <td style={{ padding: '0.75rem 1.25rem' }}>
                      <span className={dx.tipo === 'principal' ? 'badge badge-accent' : 'badge badge-neutral'}>
                        {dx.tipo === 'principal' ? 'Principal' : 'Secundario'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1.25rem' }}>
                      <span className={dx.estado === 'activo' ? 'badge badge-ok' : dx.estado === 'cronico' ? 'badge badge-warn' : 'badge badge-neutral'}>
                        {dx.estado === 'cronico' ? 'Crónico' : dx.estado === 'activo' ? 'Activo' : 'Resuelto'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1.25rem', color: 'var(--text-3)' }}>{formatearFecha(dx.created)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── TAB: Consultas Previas ────────────────────────────────── */}
      {tabActiva === 'Consultas Previas' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text)' }}>
              Historial de consultas ({consultas.length})
            </h3>
            <button onClick={() => navigate(`/consulta/nueva?paciente=${id}`)} className="btn btn-primary" style={{ fontSize: '0.8125rem' }}>
              <I.Plus width={13} height={13} /> Nueva Consulta
            </button>
          </div>
          {consultas.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3.5rem 1rem', color: 'var(--text-3)' }}>
              <I.Stethoscope width={36} height={36} style={{ marginBottom: '0.75rem', opacity: 0.3 }} />
              <p style={{ fontSize: '0.875rem' }}>Sin consultas previas</p>
            </div>
          ) : (
            <div>
              {consultas.map(c => (
                <div key={c.id} className="row-hover" style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text)' }}>
                        {c.motivo || 'Sin motivo registrado'}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.25rem' }}>
                        {c.expand?.medico ? `Dr. ${c.expand.medico.nombre} ${c.expand.medico.apellidos}` : 'Médico no asignado'}
                        {' · '}{formatearFechaHora(c.fecha)}
                      </p>
                    </div>
                    <span className={c.estado === 'completada' ? 'badge badge-ok' : 'badge badge-warn'} style={{ flexShrink: 0 }}>
                      {c.estado === 'completada' ? 'Completada' : 'Borrador'}
                    </span>
                  </div>
                  {c.plan_tratamiento && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-2)', marginTop: '0.625rem', paddingTop: '0.625rem', borderTop: '1px solid var(--border)' }}>
                      {c.plan_tratamiento}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SignoVital({ label, valor, unidad }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{label}</span>
      <span className="tabular" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>
        {valor} <span style={{ fontSize: '0.6875rem', color: 'var(--text-3)', fontWeight: 400 }}>{unidad}</span>
      </span>
    </div>
  )
}

function Dato({ label, valor, mono, capitalizar, xs }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{label}</span>
      <span style={{
        fontWeight: 500,
        color: 'var(--text)',
        fontSize: mono || xs ? '0.75rem' : '0.8125rem',
        fontFamily: mono ? 'JetBrains Mono, monospace' : 'inherit',
        textTransform: capitalizar ? 'capitalize' : 'none',
      }}>
        {valor || '—'}
      </span>
    </div>
  )
}
