import { useState } from 'react'
import { useColeccion } from '../hooks/usePocketBase'
import { useAuth } from '../context/AuthContext'
import { validators } from '../lib/validators'
import { FormField } from '../components/FormField'
import pb from '../lib/pb'
import { I } from '../components/icons'

const ROLES = [
  { valor: 'medico',        etiqueta: 'Médico',        badgeClass: 'badge-accent'  },
  { valor: 'enfermera',     etiqueta: 'Enfermera',     badgeClass: 'badge-ok'      },
  { valor: 'recepcionista', etiqueta: 'Recepcionista', badgeClass: 'badge-warn'    },
  { valor: 'administrador', etiqueta: 'Administrador', badgeClass: 'badge-violet'  },
]

function formatearFecha(fechaISO) {
  if (!fechaISO) return '—'
  return new Date(fechaISO).toLocaleString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function rolBadge(rol) { return ROLES.find(r => r.valor === rol)?.badgeClass || 'badge-neutral' }
function rolLabel(rol) { return ROLES.find(r => r.valor === rol)?.etiqueta || rol }

export default function Users() {
  const { usuario: usuarioActual } = useAuth()
  const [filtroRol,    setFiltroRol]    = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modalEditar,  setModalEditar]  = useState(null)
  const [guardando,    setGuardando]    = useState(false)
  const [errorForm,    setErrorForm]    = useState('')
  const [confirmBlock, setConfirmBlock] = useState(null)
  const [formErrors,   setFormErrors]   = useState({})
  const [formTouched,  setFormTouched]  = useState({})

  const [form, setForm] = useState({
    nombre: '', apellidos: '', email: '',
    password: '', passwordConfirm: '',
    rol: 'medico', cedula_profesional: '', especialidad: '', consultorio: '', activo: true,
  })

  const getUserRules = (esNuevo) => ({
    nombre:    validators.nombre,
    apellidos: validators.apellido,
    email:     validators.emailRequired,
    ...(esNuevo
      ? { password: validators.password }
      : form.password ? { password: validators.password } : {}),
    passwordConfirm: (v) => {
      if (esNuevo || form.password) {
        return v !== form.password ? 'Las contraseñas no coinciden' : null
      }
      return null
    },
  })

  const handleUserBlur = (field, esNuevo) => {
    setFormTouched(t => ({ ...t, [field]: true }))
    const rules = getUserRules(esNuevo)
    if (rules[field]) {
      setFormErrors(e => ({ ...e, [field]: rules[field](form[field]) }))
    }
  }

  const validateAllUserFields = (esNuevo) => {
    const rules = getUserRules(esNuevo)
    const newErrors = {}
    let isValid = true
    for (const [field, rule] of Object.entries(rules)) {
      const err = rule(form[field])
      if (err) { newErrors[field] = err; isValid = false }
    }
    setFormErrors(newErrors)
    setFormTouched(Object.keys(rules).reduce((a, k) => ({ ...a, [k]: true }), {}))
    return isValid
  }

  const partesFiltro = ['id != ""']
  if (filtroRol) partesFiltro.push(`rol = "${filtroRol}"`)
  if (filtroEstado === 'activo') partesFiltro.push('activo = true')
  if (filtroEstado === 'inactivo') partesFiltro.push('activo = false')

  const { datos: usuarios, cargando, recargar } = useColeccion('usuarios', { filtro: partesFiltro.join(' && '), orden: '-created' })

  const totalUsuarios = usuarios.length
  const medicos       = usuarios.filter(u => u.rol === 'medico').length
  const enfermeras    = usuarios.filter(u => u.rol === 'enfermera').length
  const bloqueados    = usuarios.filter(u => !u.activo).length

  const resetForm = () => {
    setForm({ nombre: '', apellidos: '', email: '', password: '', passwordConfirm: '', rol: 'medico', cedula_profesional: '', especialidad: '', consultorio: '', activo: true })
    setErrorForm('')
    setFormErrors({})
    setFormTouched({})
  }

  const handleCrear = async () => {
    if (!validateAllUserFields(true)) return
    setGuardando(true); setErrorForm('')
    try {
      await pb.collection('usuarios').create({ ...form })
      setModalAbierto(false); resetForm(); recargar()
    } catch (err) { setErrorForm('Error al crear: ' + (err.data?.message || err.message)) }
    finally { setGuardando(false) }
  }

  const abrirEditar = (usuario) => {
    setForm({ nombre: usuario.nombre || '', apellidos: usuario.apellidos || '', email: usuario.email || '', password: '', passwordConfirm: '', rol: usuario.rol || 'medico', cedula_profesional: usuario.cedula_profesional || '', especialidad: usuario.especialidad || '', consultorio: usuario.consultorio || '', activo: usuario.activo ?? true })
    setModalEditar(usuario); setErrorForm(''); setFormErrors({}); setFormTouched({})
  }

  const handleEditar = async () => {
    if (!validateAllUserFields(false)) return
    setGuardando(true); setErrorForm('')
    try {
      const datos = { nombre: form.nombre, apellidos: form.apellidos, email: form.email, rol: form.rol, cedula_profesional: form.cedula_profesional, especialidad: form.especialidad, consultorio: form.consultorio, activo: form.activo }
      if (form.password) { datos.password = form.password; datos.passwordConfirm = form.passwordConfirm }
      await pb.collection('usuarios').update(modalEditar.id, datos)
      setModalEditar(null); resetForm(); recargar()
    } catch (err) { setErrorForm('Error al actualizar: ' + (err.data?.message || err.message)) }
    finally { setGuardando(false) }
  }

  const toggleActivo = async (usuario) => {
    if (usuario.id === usuarioActual?.id) return
    try { await pb.collection('usuarios').update(usuario.id, { activo: !usuario.activo }); recargar() }
    catch (err) { console.error('Error al cambiar estado:', err) }
  }

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="anim-fade">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>Gestión de Usuarios</h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)', marginTop: '0.25rem' }}>Administre el acceso del personal y configure permisos de seguridad</p>
        </div>
        <button onClick={() => { resetForm(); setModalAbierto(true) }} className="btn btn-primary" style={{ fontSize: '0.8125rem' }}>
          <I.Plus width={14} height={14} /> Nuevo Usuario
        </button>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
        {[
          { label: 'Total Usuarios',      value: totalUsuarios, sub: 'en el sistema',          colorVar: 'var(--text)' },
          { label: 'Médicos Activos',      value: medicos,       sub: 'con acceso activo',       colorVar: 'var(--accent)' },
          { label: 'Enfermería',           value: enfermeras,    sub: 'personal de enfermería',  colorVar: 'var(--ok)' },
          { label: 'Accesos Bloqueados',   value: bloqueados,    sub: bloqueados > 0 ? 'requieren atención' : 'todo en orden', colorVar: bloqueados > 0 ? 'var(--danger)' : 'var(--text-3)' },
        ].map(({ label, value, sub, colorVar }) => (
          <div key={label} className="card" style={{ padding: '1.25rem' }}>
            <p className="tabular" style={{ fontSize: '1.875rem', fontWeight: 700, color: colorVar, lineHeight: 1 }}>{value}</p>
            <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '0.375rem' }}>{label}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.125rem' }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <select value={filtroRol} onChange={e => setFiltroRol(e.target.value)} className="input" style={{ width: 'auto', minWidth: 160 }}>
          <option value="">Todos los roles</option>
          {ROLES.map(r => <option key={r.valor} value={r.valor}>{r.etiqueta}</option>)}
        </select>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="input" style={{ width: 'auto', minWidth: 140 }}>
          <option value="">Cualquier estado</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginLeft: 'auto' }}>
          {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Table ──────────────────────────────────────────────────── */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {cargando ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1rem', color: 'var(--text-3)' }}>
            <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', marginBottom: '0.75rem' }} className="anim-spin" />
            <p style={{ fontSize: '0.875rem' }}>Cargando usuarios...</p>
          </div>
        ) : usuarios.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1rem', color: 'var(--text-3)' }}>
            <I.User width={36} height={36} style={{ marginBottom: '0.75rem', opacity: 0.3 }} />
            <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-2)' }}>Sin usuarios encontrados</p>
          </div>
        ) : (
          <table style={{ width: '100%', fontSize: '0.8125rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Usuario', 'Rol', 'Especialidad', 'Última act.', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.625rem 1.25rem', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => {
                const esYo = u.id === usuarioActual?.id
                return (
                  <tr key={u.id} className="row-hover" style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="avatar" style={{ width: 36, height: 36, fontSize: '0.75rem' }}>
                          {u.nombre?.[0]}{u.apellidos?.[0]}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text)' }}>{u.nombre} {u.apellidos}</span>
                            {esYo && <span className="badge badge-accent" style={{ fontSize: '0.625rem' }}>Tú</span>}
                          </div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <span className={`badge ${rolBadge(u.rol)}`}>{rolLabel(u.rol)}</span>
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem', color: 'var(--text-2)' }}>{u.especialidad || '—'}</td>
                    <td className="tabular" style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', color: 'var(--text-3)' }}>
                      {formatearFecha(u.updated)}
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <button
                        onClick={() => !esYo && toggleActivo(u)}
                        disabled={esYo}
                        className={`badge ${u.activo ? 'badge-ok' : 'badge-danger'}`}
                        style={{ cursor: esYo ? 'default' : 'pointer', border: 'none' }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: 'var(--radius-full)', background: 'currentColor' }} />
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <button onClick={() => abrirEditar(u)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 500, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
                          <I.Edit width={11} height={11} /> Editar
                        </button>
                        {!esYo && (
                          <button onClick={() => setConfirmBlock(u)} style={{ fontSize: '0.75rem', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>
                            Bloquear
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Info panels ────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div style={{ width: 32, height: 32, background: 'var(--accent-dim)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <I.Shield width={14} height={14} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h3 style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)', marginBottom: '0.5rem' }}>Políticas de Acceso</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                Cada rol tiene permisos específicos. No asigne roles de Administrador a menos que sea estrictamente necesario.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {ROLES.map(r => (
                  <div key={r.valor} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                    <span className={`badge ${r.badgeClass}`} style={{ fontSize: '0.625rem' }}>{r.etiqueta}</span>
                    <span style={{ color: 'var(--text-3)' }}>
                      {r.valor === 'administrador' ? '— Acceso total al sistema' : ''}
                      {r.valor === 'medico' ? '— Consultas, expedientes, recetas' : ''}
                      {r.valor === 'enfermera' ? '— Signos vitales, notas, citas' : ''}
                      {r.valor === 'recepcionista' ? '— Citas, registro de pacientes' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div style={{ width: 32, height: 32, background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <I.Clipboard width={14} height={14} style={{ color: 'var(--text-3)' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)', marginBottom: '0.5rem' }}>Registro de Auditoría</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                Todos los cambios de roles, creaciones y modificaciones quedan registrados con marca de tiempo.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {usuarios.slice(0, 3).map(u => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-3)' }}>
                    <span style={{ width: 6, height: 6, borderRadius: 'var(--radius-full)', background: 'var(--border)', flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.nombre} {u.apellidos} — {rolLabel(u.rol)} — {formatearFecha(u.created)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal: Nuevo / Editar ────────────────────────────────────── */}
      {(modalAbierto || modalEditar) && (
        <ModalUsuario
          titulo={modalEditar ? `Editar — ${modalEditar.nombre} ${modalEditar.apellidos}` : 'Nuevo Usuario'}
          form={form} setForm={setForm}
          formErrors={formErrors} formTouched={formTouched}
          onBlur={field => handleUserBlur(field, !modalEditar)}
          errorForm={errorForm} guardando={guardando}
          onGuardar={modalEditar ? handleEditar : handleCrear}
          onCerrar={() => { setModalAbierto(false); setModalEditar(null); resetForm() }}
          esNuevo={!modalEditar}
        />
      )}

      {/* ── Confirm block ────────────────────────────────────────────── */}
      {confirmBlock && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div className="card anim-scale-in" style={{ width: '100%', maxWidth: 380, padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ width: 36, height: 36, background: 'var(--danger-dim)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <I.Alert width={16} height={16} style={{ color: 'var(--danger)' }} />
              </div>
              <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text)' }}>¿Bloquear usuario?</h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              El usuario <strong style={{ color: 'var(--text)' }}>{confirmBlock.nombre} {confirmBlock.apellidos}</strong> no podrá iniciar sesión hasta que se reactive su cuenta.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setConfirmBlock(null)} className="btn btn-outline" style={{ fontSize: '0.875rem' }}>Cancelar</button>
              <button
                onClick={async () => { await pb.collection('usuarios').update(confirmBlock.id, { activo: false }); setConfirmBlock(null); recargar() }}
                className="btn btn-danger" style={{ fontSize: '0.875rem' }}>
                Bloquear acceso
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ModalUsuario({ titulo, form, setForm, formErrors, formTouched, onBlur, errorForm, guardando, onGuardar, onCerrar, esNuevo }) {
  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
      <div className="card anim-scale-in" style={{ width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 32, height: 32, background: 'var(--accent-dim)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <I.User width={14} height={14} style={{ color: 'var(--accent)' }} />
            </div>
            <h2 style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text)' }}>{titulo}</h2>
          </div>
          <button onClick={onCerrar} className="btn btn-ghost btn-icon"><I.X width={16} height={16} /></button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormField label="Nombre(s)" required error={formErrors.nombre} touched={formTouched.nombre}>
              <input className="input" type="text" value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
                onBlur={() => onBlur('nombre')} />
            </FormField>
            <FormField label="Apellidos" required error={formErrors.apellidos} touched={formTouched.apellidos}>
              <input className="input" type="text" value={form.apellidos}
                onChange={e => setForm({ ...form, apellidos: e.target.value })}
                onBlur={() => onBlur('apellidos')} />
            </FormField>
          </div>
          <FormField label="Correo electrónico" required error={formErrors.email} touched={formTouched.email}>
            <input className="input" type="email" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              onBlur={() => onBlur('email')} />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormField label={esNuevo ? 'Contraseña' : 'Nueva contraseña (opcional)'} required={esNuevo} error={formErrors.password} touched={formTouched.password}>
              <input className="input" type="password" value={form.password} placeholder="Mínimo 8 caracteres"
                onChange={e => setForm({ ...form, password: e.target.value })}
                onBlur={() => onBlur('password')} />
            </FormField>
            <FormField label="Confirmar contraseña" error={formErrors.passwordConfirm} touched={formTouched.passwordConfirm}>
              <input className="input" type="password" value={form.passwordConfirm} placeholder="Repetir contraseña"
                onChange={e => setForm({ ...form, passwordConfirm: e.target.value })}
                onBlur={() => onBlur('passwordConfirm')} />
            </FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="field-label">Rol *</label>
              <select value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })} className="input">
                {ROLES.map(r => <option key={r.valor} value={r.valor}>{r.etiqueta}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Especialidad</label>
              <input className="input" type="text" value={form.especialidad} placeholder="Ej: Pediatría, Cardiología..."
                onChange={e => setForm({ ...form, especialidad: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="field-label">Cédula profesional</label>
            <input className="input" type="text" value={form.cedula_profesional} placeholder="Número de cédula"
              onChange={e => setForm({ ...form, cedula_profesional: e.target.value })} />
          </div>
          {form.rol === 'medico' && (
            <div>
              <label className="field-label">Consultorio</label>
              <input className="input" type="text" value={form.consultorio} placeholder="Ej: Consultorio 3, Sala B..."
                onChange={e => setForm({ ...form, consultorio: e.target.value })} />
            </div>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.875rem', color: 'var(--text-2)', cursor: 'pointer', userSelect: 'none' }}>
            <input type="checkbox" checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />
            Usuario activo (puede iniciar sesión)
          </label>
          {errorForm && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', background: 'var(--danger-dim)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', color: 'var(--danger)', fontSize: '0.875rem' }}>
              <I.Alert width={14} height={14} style={{ flexShrink: 0, marginTop: 1 }} /> {errorForm}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1rem 1.5rem', borderTop: '1px solid var(--border)' }}>
          <button onClick={onCerrar} className="btn btn-outline" style={{ fontSize: '0.875rem' }}>Cancelar</button>
          <button onClick={onGuardar} disabled={guardando} className="btn btn-primary" style={{ fontSize: '0.875rem' }}>
            {guardando ? 'Guardando...' : esNuevo ? 'Crear Usuario' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}
