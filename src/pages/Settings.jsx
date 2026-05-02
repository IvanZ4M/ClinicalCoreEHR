import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import pb from '../lib/pb'
import { I } from '../components/icons'

const TABS = ['Consultorio', 'Mi Perfil', 'Seguridad']

function calcularFortaleza(password) {
  let puntos = 0
  if (password.length >= 8)  puntos++
  if (password.length >= 12) puntos++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) puntos++
  if (/[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password)) puntos++
  return puntos
}

export default function Settings() {
  const { usuario } = useAuth()
  const [tabActiva, setTabActiva] = useState('Consultorio')

  const [consultorio, setConsultorio] = useState({
    nombre: '', direccion: '', telefono: '', email: '', horario: '', especialidades: '',
  })
  const [guardandoConsultorio, setGuardandoConsultorio] = useState(false)
  const [mensajeConsultorio, setMensajeConsultorio] = useState('')

  const [perfil, setPerfil] = useState({
    nombre: '', apellidos: '', email: '', cedula_profesional: '', especialidad: '',
  })
  const [guardandoPerfil, setGuardandoPerfil] = useState(false)
  const [mensajePerfil, setMensajePerfil] = useState('')

  const [seguridad, setSeguridad] = useState({
    passwordActual: '', passwordNuevo: '', passwordConfirm: '',
  })
  const [guardandoPass, setGuardandoPass] = useState(false)
  const [mensajePass, setMensajePass]     = useState('')
  const [errorPass,   setErrorPass]       = useState('')

  useEffect(() => {
    if (usuario) {
      setPerfil({
        nombre: usuario.nombre || '', apellidos: usuario.apellidos || '',
        email: usuario.email || '', cedula_profesional: usuario.cedula_profesional || '',
        especialidad: usuario.especialidad || '',
      })
    }
    const configGuardada = localStorage.getItem('config_consultorio')
    if (configGuardada) {
      try { setConsultorio(JSON.parse(configGuardada)) } catch {}
    }
  }, [usuario])

  const handleGuardarConsultorio = async () => {
    setGuardandoConsultorio(true); setMensajeConsultorio('')
    try {
      localStorage.setItem('config_consultorio', JSON.stringify(consultorio))
      setMensajeConsultorio('ok')
      setTimeout(() => setMensajeConsultorio(''), 3000)
    } catch (err) {
      setMensajeConsultorio('error:' + err.message)
    } finally { setGuardandoConsultorio(false) }
  }

  const handleGuardarPerfil = async () => {
    if (!perfil.nombre || !perfil.apellidos || !perfil.email) {
      setMensajePerfil('error:Nombre, apellidos y correo son obligatorios.'); return
    }
    setGuardandoPerfil(true); setMensajePerfil('')
    try {
      await pb.collection('usuarios').update(usuario.id, {
        nombre: perfil.nombre, apellidos: perfil.apellidos, email: perfil.email,
        cedula_profesional: perfil.cedula_profesional, especialidad: perfil.especialidad,
      })
      setMensajePerfil('ok')
      setTimeout(() => setMensajePerfil(''), 3000)
    } catch (err) {
      setMensajePerfil('error:' + (err.data?.message || err.message))
    } finally { setGuardandoPerfil(false) }
  }

  const handleCambiarPassword = async () => {
    setErrorPass(''); setMensajePass('')
    if (!seguridad.passwordActual) { setErrorPass('Ingresa tu contraseña actual.'); return }
    if (seguridad.passwordNuevo.length < 8) { setErrorPass('La nueva contraseña debe tener al menos 8 caracteres.'); return }
    if (seguridad.passwordNuevo !== seguridad.passwordConfirm) { setErrorPass('Las contraseñas nuevas no coinciden.'); return }
    setGuardandoPass(true)
    try {
      await pb.collection('usuarios').update(usuario.id, {
        oldPassword: seguridad.passwordActual,
        password: seguridad.passwordNuevo,
        passwordConfirm: seguridad.passwordConfirm,
      })
      setMensajePass('ok')
      setSeguridad({ passwordActual: '', passwordNuevo: '', passwordConfirm: '' })
      setTimeout(() => setMensajePass(''), 3000)
    } catch (err) {
      setErrorPass('Error: ' + (err.data?.message || err.message))
    } finally { setGuardandoPass(false) }
  }

  const rolBadge = {
    administrador: 'badge-violet',
    medico:        'badge-accent',
    enfermera:     'badge-ok',
  }

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 760 }} className="anim-fade">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
          Configuración
        </h1>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)', marginTop: '0.25rem' }}>
          Personaliza el sistema y administra tu cuenta
        </p>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: 0 }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setTabActiva(tab)}
            className={`tab${tabActiva === tab ? ' active' : ''}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── TAB: Consultorio ───────────────────────────────────────── */}
      {tabActiva === 'Consultorio' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Preview card */}
          <div style={{ background: 'var(--accent-dim)', border: '1px solid color-mix(in oklch, var(--accent) 30%, transparent)', borderRadius: 'var(--radius-lg)', padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="avatar" style={{ width: 56, height: 56, fontSize: '1.125rem', borderRadius: 'var(--radius-lg)', background: 'var(--accent)', color: '#fff', flexShrink: 0 }}>
              {consultorio.nombre
                ? consultorio.nombre.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                : 'CM'}
            </div>
            <div>
              <p style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.875rem' }}>
                {consultorio.nombre || 'Nombre del Consultorio'}
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-2)', marginTop: 2 }}>
                {consultorio.especialidades || 'Especialidades médicas'}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 1 }}>
                {consultorio.direccion || 'Dirección del consultorio'}
              </p>
            </div>
          </div>

          {/* Form card */}
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <I.Settings width={15} height={15} style={{ color: 'var(--text-3)' }} />
              <h2 style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text)' }}>Datos del Consultorio</h2>
            </div>

            <Campo label="Nombre del consultorio" value={consultorio.nombre}
              onChange={v => setConsultorio({ ...consultorio, nombre: v })}
              placeholder="Ej: Centro Médico Familiar" />
            <Campo label="Dirección" value={consultorio.direccion}
              onChange={v => setConsultorio({ ...consultorio, direccion: v })}
              placeholder="Calle, número, colonia, ciudad" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Campo label="Teléfono" value={consultorio.telefono}
                onChange={v => setConsultorio({ ...consultorio, telefono: v })}
                placeholder="871 000 0000" />
              <Campo label="Correo de contacto" type="email" value={consultorio.email}
                onChange={v => setConsultorio({ ...consultorio, email: v })}
                placeholder="contacto@consultorio.com" />
            </div>
            <Campo label="Horario de atención" value={consultorio.horario}
              onChange={v => setConsultorio({ ...consultorio, horario: v })}
              placeholder="Lun-Vie 9:00am – 6:00pm, Sáb 9:00am – 2:00pm" />
            <Campo label="Especialidades" value={consultorio.especialidades}
              onChange={v => setConsultorio({ ...consultorio, especialidades: v })}
              placeholder="Medicina General, Pediatría, Cardiología..." />

            <MensajeEstado msg={mensajeConsultorio} okText="Configuración guardada correctamente" />

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
              <button onClick={handleGuardarConsultorio} disabled={guardandoConsultorio} className="btn btn-primary" style={{ fontSize: '0.875rem' }}>
                {guardandoConsultorio ? 'Guardando...' : 'Guardar Configuración'}
              </button>
            </div>
          </div>

          {/* System info card */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text)', marginBottom: '1rem' }}>
              Información del Sistema
            </h2>
            <InfoFila label="Sistema"       valor="ClinicalCore EHR" />
            <InfoFila label="Versión"       valor="1.0.0 — En desarrollo" />
            <InfoFila label="Base de datos" valor="PocketBase v0.26 (Local)" />
            <InfoFila label="Framework"     valor="Electron + React 19" />
            <InfoFila label="Plataforma"    valor={`Windows — ${navigator.userAgent.includes('Win') ? 'x64' : 'x86'}`} />
          </div>
        </div>
      )}

      {/* ── TAB: Mi Perfil ─────────────────────────────────────────── */}
      {tabActiva === 'Mi Perfil' && (
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Avatar row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border)' }}>
            <div className="avatar" style={{ width: 64, height: 64, fontSize: '1.5rem', borderRadius: 'var(--radius-lg)', flexShrink: 0 }}>
              {usuario?.nombre?.[0]}{usuario?.apellidos?.[0]}
            </div>
            <div>
              <p style={{ fontWeight: 700, color: 'var(--text)', fontSize: '1.0625rem' }}>
                {usuario?.nombre} {usuario?.apellidos}
              </p>
              <span className={`badge ${rolBadge[usuario?.rol] || 'badge-warn'}`} style={{ marginTop: 6, textTransform: 'capitalize' }}>
                {usuario?.rol}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <I.User width={14} height={14} style={{ color: 'var(--text-3)' }} />
            <h2 style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text)' }}>Datos personales</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Campo label="Nombre(s) *" value={perfil.nombre} onChange={v => setPerfil({ ...perfil, nombre: v })} />
            <Campo label="Apellidos *"  value={perfil.apellidos} onChange={v => setPerfil({ ...perfil, apellidos: v })} />
          </div>
          <Campo label="Correo electrónico *" type="email" value={perfil.email}
            onChange={v => setPerfil({ ...perfil, email: v })} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Campo label="Cédula profesional" value={perfil.cedula_profesional}
              onChange={v => setPerfil({ ...perfil, cedula_profesional: v })}
              placeholder="Número de cédula" />
            <Campo label="Especialidad" value={perfil.especialidad}
              onChange={v => setPerfil({ ...perfil, especialidad: v })}
              placeholder="Ej: Medicina General" />
          </div>

          <MensajeEstado msg={mensajePerfil} okText="Perfil actualizado correctamente" />

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
            <button onClick={handleGuardarPerfil} disabled={guardandoPerfil} className="btn btn-primary" style={{ fontSize: '0.875rem' }}>
              {guardandoPerfil ? 'Guardando...' : 'Actualizar Perfil'}
            </button>
          </div>
        </div>
      )}

      {/* ── TAB: Seguridad ─────────────────────────────────────────── */}
      {tabActiva === 'Seguridad' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Password card */}
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', marginBottom: '0.25rem' }}>
              <I.Shield width={15} height={15} style={{ color: 'var(--text-3)', marginTop: 2 }} />
              <div>
                <h2 style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text)' }}>Cambiar Contraseña</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 2 }}>
                  Usa una contraseña segura de al menos 8 caracteres
                </p>
              </div>
            </div>

            <Campo label="Contraseña actual" type="password" value={seguridad.passwordActual}
              onChange={v => setSeguridad({ ...seguridad, passwordActual: v })}
              placeholder="Tu contraseña actual" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Campo label="Nueva contraseña" type="password" value={seguridad.passwordNuevo}
                onChange={v => setSeguridad({ ...seguridad, passwordNuevo: v })}
                placeholder="Mínimo 8 caracteres" />
              <Campo label="Confirmar nueva contraseña" type="password" value={seguridad.passwordConfirm}
                onChange={v => setSeguridad({ ...seguridad, passwordConfirm: v })}
                placeholder="Repetir nueva contraseña" />
            </div>

            {/* Password strength meter */}
            {seguridad.passwordNuevo && (() => {
              const f = calcularFortaleza(seguridad.passwordNuevo)
              const strengthColor = f <= 1 ? 'var(--danger)' : f <= 2 ? 'var(--warn)' : f <= 3 ? 'var(--accent)' : 'var(--ok)'
              const strengthLabel = f <= 1 ? 'Muy débil' : f <= 2 ? 'Débil' : f <= 3 ? 'Moderada' : 'Fuerte ✓'
              return (
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: 6 }}>Fortaleza de la contraseña:</p>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[1, 2, 3, 4].map(n => (
                      <div key={n} style={{
                        height: 5, flex: 1, borderRadius: 99,
                        background: n <= f ? strengthColor : 'var(--border)',
                        transition: 'background 0.3s',
                      }} />
                    ))}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: strengthColor, marginTop: 5, fontWeight: 500 }}>
                    {strengthLabel}
                  </p>
                </div>
              )
            })()}

            {errorPass && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', background: 'var(--danger-dim)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', color: 'var(--danger)', fontSize: '0.875rem' }}>
                <I.Alert width={14} height={14} style={{ flexShrink: 0, marginTop: 1 }} />
                {errorPass}
              </div>
            )}
            {mensajePass === 'ok' && (
              <MensajeEstado msg="ok" okText="Contraseña actualizada correctamente" />
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
              <button onClick={handleCambiarPassword} disabled={guardandoPass} className="btn btn-primary" style={{ fontSize: '0.875rem' }}>
                {guardandoPass ? 'Actualizando...' : 'Cambiar Contraseña'}
              </button>
            </div>
          </div>

          {/* Active session card */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text)', marginBottom: '1rem' }}>
              Sesión Activa
            </h2>
            <InfoFila label="Usuario" valor={`${usuario?.nombre} ${usuario?.apellidos}`} />
            <InfoFila label="Correo"  valor={usuario?.email} />
            <InfoFila label="Rol"     valor={usuario?.rol} capitalizar />
            <InfoFila label="ID"      valor={usuario?.id?.slice(0, 12) + '...'} mono />
          </div>
        </div>
      )}
    </div>
  )
}

function MensajeEstado({ msg, okText }) {
  if (!msg) return null
  const esOk    = msg === 'ok'
  const esError = msg.startsWith('error:')
  if (esOk) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--ok-dim)', border: '1px solid var(--ok)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', color: 'var(--ok)', fontSize: '0.875rem' }}>
        <I.Check width={14} height={14} /> {okText}
      </div>
    )
  }
  if (esError) {
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', background: 'var(--danger-dim)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', color: 'var(--danger)', fontSize: '0.875rem' }}>
        <I.Alert width={14} height={14} style={{ flexShrink: 0, marginTop: 1 }} /> {msg.slice(6)}
      </div>
    )
  }
  return null
}

function Campo({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="input" />
    </div>
  )
}

function InfoFila({ label, valor, mono, capitalizar }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{label}</span>
      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text)', fontFamily: mono ? 'var(--font-mono, monospace)' : undefined, textTransform: capitalizar ? 'capitalize' : undefined }}>
        {valor || '—'}
      </span>
    </div>
  )
}
