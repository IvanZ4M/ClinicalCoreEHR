import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useColeccion } from '../hooks/usePocketBase'
import { useForm } from '../hooks/useForm'
import { validators } from '../lib/validators'
import { FormField } from '../components/FormField'
import pb from '../lib/pb'
import { sanitizePatientData } from '../lib/sanitize'
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
  return new Date(fechaISO).toLocaleDateString('es-MX')
}

const FORM_EMPTY = {
  nombre: '', apellidos: '', curp: '',
  fecha_nacimiento: '', sexo: '', grupo_sanguineo: '',
  telefono: '', email: '', alergias: '',
  alergias_criticas: false, activo: true,
}

const REGLAS_PACIENTE = {
  nombre:           validators.nombre,
  apellidos:        validators.apellido,
  curp:             validators.curp,
  fecha_nacimiento: validators.fechaNacimiento,
  telefono:         validators.telefonoRequired,
  email:            validators.email,
}

export default function Patients() {
  const [busqueda,     setBusqueda]     = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [guardando,    setGuardando]    = useState(false)
  const [errorForm,    setErrorForm]    = useState('')
  const navigate = useNavigate()

  const { values: form, errors, touched, setValue, handleBlur, validateAll, reset: resetForm } = useForm(FORM_EMPTY, REGLAS_PACIENTE)

  const filtro = busqueda.trim()
    ? `nombre ~ "${busqueda}" || apellidos ~ "${busqueda}" || curp ~ "${busqueda}" || email ~ "${busqueda}"`
    : 'activo = true'

  const { datos: pacientes, cargando, recargar } = useColeccion('pacientes', { filtro, orden: 'nombre' })

  const handleGuardar = async () => {
    if (!validateAll()) return
    setGuardando(true)
    setErrorForm('')
    try {
      // VULN-FIX (ÁREA 4): sanitizar datos antes de enviar a PocketBase
      await pb.collection('pacientes').create(sanitizePatientData(form))
      setModalAbierto(false)
      resetForm()
      recargar()
    } catch (err) {
      setErrorForm('Error al guardar: ' + err.message)
    } finally {
      setGuardando(false)
    }
  }

  const cerrarModal = () => { setModalAbierto(false); setErrorForm(''); resetForm() }

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="anim-fade">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            Pacientes
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)', marginTop: '0.25rem' }}>
            {pacientes.length} paciente{pacientes.length !== 1 ? 's' : ''} registrado{pacientes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => setModalAbierto(true)} className="btn btn-primary" style={{ fontSize: '0.8125rem' }}>
          <I.Plus width={14} height={14} />
          Nuevo Paciente
        </button>
      </div>

      {/* ── Search ─────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', maxWidth: 420 }}>
        <I.Search width={14} height={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
        <input
          type="text"
          placeholder="Buscar por nombre, CURP o correo..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="input"
          style={{ paddingLeft: 32 }}
        />
      </div>

      {/* ── Table ──────────────────────────────────────────────────── */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {cargando ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1rem', color: 'var(--text-3)' }}>
            <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', marginBottom: '0.75rem' }} className="anim-spin" />
            <p style={{ fontSize: '0.875rem' }}>Cargando pacientes...</p>
          </div>
        ) : pacientes.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1rem', color: 'var(--text-3)' }}>
            <I.Patients width={36} height={36} style={{ marginBottom: '0.75rem', opacity: 0.35 }} />
            <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-2)' }}>
              {busqueda ? 'No se encontraron resultados' : 'Aún no hay pacientes registrados'}
            </p>
            {!busqueda && (
              <button onClick={() => setModalAbierto(true)} className="btn btn-primary" style={{ marginTop: '1rem', fontSize: '0.8125rem' }}>
                Registrar primer paciente
              </button>
            )}
          </div>
        ) : (
          <table style={{ width: '100%', fontSize: '0.8125rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Paciente', 'CURP', 'Edad', 'Contacto', 'Alergias', 'Registro', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.625rem 1.25rem', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pacientes.map(p => {
                const initials = `${p.nombre?.[0] || ''}${p.apellidos?.[0] || ''}`
                return (
                  <tr key={p.id} className="row-hover" style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="avatar" style={{ width: 36, height: 36, fontSize: '0.75rem' }}>
                          {initials}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, color: 'var(--text)' }}>{p.nombre} {p.apellidos}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', textTransform: 'capitalize', marginTop: 1 }}>
                            {p.sexo || '—'} · {p.grupo_sanguineo || 'Tipo no registrado'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.75rem', color: 'var(--text-2)' }}>
                      {p.curp || '—'}
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem', color: 'var(--text-2)' }}>
                      {calcularEdad(p.fecha_nacimiento)} años
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <p style={{ color: 'var(--text-2)' }}>{p.telefono || '—'}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{p.email || ''}</p>
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      {p.alergias_criticas ? (
                        <span className="badge badge-danger">
                          <I.Alert width={10} height={10} /> Críticas
                        </span>
                      ) : p.alergias ? (
                        <span className="badge badge-warn">Con alergias</span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Ninguna</span>
                      )}
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', color: 'var(--text-3)' }}>
                      {formatearFecha(p.created)}
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <button
                        onClick={() => navigate(`/pacientes/${p.id}`)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        Ver expediente <I.ChevronRight width={12} height={12} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal: Nuevo Paciente ───────────────────────────────────── */}
      {modalAbierto && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div className="card anim-scale-in" style={{ width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 32, height: 32, background: 'var(--accent-dim)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <I.Patients width={14} height={14} style={{ color: 'var(--accent)' }} />
                </div>
                <h2 style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text)' }}>Registrar Nuevo Paciente</h2>
              </div>
              <button onClick={cerrarModal} className="btn btn-ghost btn-icon">
                <I.X width={16} height={16} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <FormField label="Nombre(s)" required error={errors.nombre} touched={touched.nombre}>
                  <input className="input" type="text" value={form.nombre}
                    onChange={e => setValue('nombre', e.target.value)}
                    onBlur={() => handleBlur('nombre')} />
                </FormField>
                <FormField label="Apellidos" required error={errors.apellidos} touched={touched.apellidos}>
                  <input className="input" type="text" value={form.apellidos}
                    onChange={e => setValue('apellidos', e.target.value)}
                    onBlur={() => handleBlur('apellidos')} />
                </FormField>
              </div>
              <FormField label="CURP" required error={errors.curp} touched={touched.curp}>
                <input className="input" type="text" value={form.curp} placeholder="ZAMD000101HCOMNR00"
                  onChange={e => setValue('curp', e.target.value.toUpperCase())}
                  onBlur={() => handleBlur('curp')} />
              </FormField>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <FormField label="Fecha de nacimiento" required error={errors.fecha_nacimiento} touched={touched.fecha_nacimiento}>
                  <input className="input" type="date" value={form.fecha_nacimiento}
                    onChange={e => setValue('fecha_nacimiento', e.target.value)}
                    onBlur={() => handleBlur('fecha_nacimiento')} />
                </FormField>
                <div>
                  <label className="field-label">Sexo</label>
                  <select className="input" value={form.sexo} onChange={e => setValue('sexo', e.target.value)}>
                    <option value="">Seleccionar...</option>
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="field-label">Grupo sanguíneo</label>
                  <select className="input" value={form.grupo_sanguineo} onChange={e => setValue('grupo_sanguineo', e.target.value)}>
                    <option value="">Seleccionar...</option>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <FormField label="Teléfono" required error={errors.telefono} touched={touched.telefono}>
                  <input className="input" type="text" value={form.telefono} placeholder="871 000 0000"
                    onChange={e => setValue('telefono', e.target.value)}
                    onBlur={() => handleBlur('telefono')} />
                </FormField>
              </div>
              <FormField label="Correo electrónico" error={errors.email} touched={touched.email}>
                <input className="input" type="email" value={form.email}
                  onChange={e => setValue('email', e.target.value)}
                  onBlur={() => handleBlur('email')} />
              </FormField>
              <div>
                <label className="field-label">Alergias conocidas</label>
                <textarea
                  value={form.alergias}
                  onChange={e => setValue('alergias', e.target.value)}
                  placeholder="Ej: Penicilina, Látex, Cacahuates..."
                  rows={2}
                  className="input"
                  style={{ resize: 'none' }}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.875rem', color: 'var(--text-2)', cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={form.alergias_criticas}
                  onChange={e => setValue('alergias_criticas', e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: 'var(--danger)' }}
                />
                <I.Shield width={13} height={13} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                Marcar como alergias críticas (mostrará alerta roja en el expediente)
              </label>

              {errorForm && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', background: 'var(--danger-dim)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', color: 'var(--danger)', fontSize: '0.875rem' }}>
                  <I.Alert width={14} height={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  {errorForm}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1rem 1.5rem', borderTop: '1px solid var(--border)' }}>
              <button onClick={cerrarModal} className="btn btn-outline" style={{ fontSize: '0.875rem' }}>Cancelar</button>
              <button onClick={handleGuardar} disabled={guardando} className="btn btn-primary" style={{ fontSize: '0.875rem' }}>
                {guardando ? 'Guardando...' : 'Guardar Paciente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

