import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { validators } from '../lib/validators'
import { FormField } from '../components/FormField'
import pb from '../lib/pb'
import { I } from '../components/icons'

const TABS = ['Apariencia', 'Consultorio', 'Mi Perfil', 'Seguridad']

const ACCENT_PRESETS = [
  { label: 'Azul',     h: 214 },
  { label: 'Cielo',    h: 200 },
  { label: 'Teal',     h: 175 },
  { label: 'Verde',    h: 145 },
  { label: 'Violeta',  h: 285 },
  { label: 'Rosa',     h: 340 },
  { label: 'Naranja',  h: 35  },
  { label: 'Ámbar',    h: 65  },
]

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
  const { theme, setTheme, isDark, accentH, setAccentH, density, setDensity, radius, setRadius, sidebar, setSidebar } = useTheme()
  const [tabActiva, setTabActiva] = useState('Apariencia')

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
  const [guardandoPass, setGuardandoPass]   = useState(false)
  const [mensajePass,   setMensajePass]     = useState('')
  const [errorPass,     setErrorPass]       = useState('')
  const [perfilErrors,  setPerfilErrors]    = useState({})
  const [perfilTouched, setPerfilTouched]   = useState({})
  const [passErrors,    setPassErrors]      = useState({})
  const [passTouched,   setPassTouched]     = useState({})

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

  const PERFIL_RULES = {
    nombre:    validators.nombre,
    apellidos: validators.apellido,
    email:     validators.emailRequired,
  }

  const handlePerfilBlur = (field) => {
    setPerfilTouched(t => ({ ...t, [field]: true }))
    if (PERFIL_RULES[field]) setPerfilErrors(e => ({ ...e, [field]: PERFIL_RULES[field](perfil[field]) }))
  }

  const handleGuardarPerfil = async () => {
    const newErrors = {}
    let ok = true
    for (const [f, rule] of Object.entries(PERFIL_RULES)) {
      const err = rule(perfil[f])
      if (err) { newErrors[f] = err; ok = false }
    }
    setPerfilErrors(newErrors)
    setPerfilTouched({ nombre: true, apellidos: true, email: true })
    if (!ok) return
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

  const PASS_RULES = {
    passwordActual:  (v) => !v ? 'Ingresa tu contraseña actual' : null,
    passwordNuevo:   validators.password,
    passwordConfirm: (v) => v !== seguridad.passwordNuevo ? 'Las contraseñas no coinciden' : null,
  }

  const handlePassBlur = (field) => {
    setPassTouched(t => ({ ...t, [field]: true }))
    if (PASS_RULES[field]) setPassErrors(e => ({ ...e, [field]: PASS_RULES[field](seguridad[field]) }))
  }

  const handleCambiarPassword = async () => {
    setMensajePass('')
    const newErrors = {}
    let ok = true
    for (const [f, rule] of Object.entries(PASS_RULES)) {
      const err = rule(seguridad[f])
      if (err) { newErrors[f] = err; ok = false }
    }
    setPassErrors(newErrors)
    setPassTouched({ passwordActual: true, passwordNuevo: true, passwordConfirm: true })
    if (!ok) { setErrorPass(''); return }
    setErrorPass('')
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

      {/* ── TAB: Apariencia ────────────────────────────────────────── */}
      {tabActiva === 'Apariencia' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Tema */}
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <SeccionApariencia icon={<I.Sun width={15} height={15} />} titulo="Modo de color">
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[
                  { v: 'light',  label: 'Claro',   icon: <I.Sun  width={14} height={14} /> },
                  { v: 'dark',   label: 'Oscuro',  icon: <I.Moon width={14} height={14} /> },
                  { v: 'system', label: 'Sistema', icon: <I.Kbd  width={14} height={14} /> },
                ].map(opt => (
                  <button key={opt.v} onClick={() => setTheme(opt.v)}
                    style={{
                      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      padding: '0.75rem 0.5rem', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                      border: theme === opt.v ? '2px solid var(--accent)' : '2px solid var(--border)',
                      background: theme === opt.v ? 'var(--accent-dim)' : 'var(--bg)',
                      color: theme === opt.v ? 'var(--accent)' : 'var(--text-2)',
                      transition: 'all 0.15s',
                    }}>
                    {opt.icon}
                    <span style={{ fontSize: '0.75rem', fontWeight: theme === opt.v ? 600 : 400 }}>{opt.label}</span>
                  </button>
                ))}
              </div>
            </SeccionApariencia>
          </div>

          {/* Color de énfasis */}
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <SeccionApariencia icon={<I.Drop width={15} height={15} />} titulo="Color de énfasis">
              <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
                {ACCENT_PRESETS.map(p => {
                  const active = Math.abs(accentH - p.h) < 8
                  return (
                    <button key={p.h} onClick={() => setAccentH(p.h)}
                      title={p.label}
                      style={{
                        width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', border: 'none', padding: 0,
                        background: `oklch(55% 0.20 ${p.h})`,
                        outline: active ? `3px solid oklch(55% 0.20 ${p.h})` : '3px solid transparent',
                        outlineOffset: 2,
                        boxShadow: active ? `0 0 0 2px var(--bg-elev)` : 'none',
                        transition: 'transform 0.15s, outline 0.15s',
                        transform: active ? 'scale(1.15)' : 'scale(1)',
                      }} />
                  )
                })}
              </div>
              <div style={{ marginTop: '0.25rem' }}>
                <label className="field-label">Matiz personalizado ({accentH}°)</label>
                <input type="range" min={0} max={359} value={accentH} onChange={e => setAccentH(e.target.value)}
                  style={{ width: '100%', accentColor: `oklch(55% 0.20 ${accentH})`, cursor: 'pointer' }} />
              </div>
            </SeccionApariencia>
          </div>

          {/* Densidad + Radio en grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

            {/* Densidad */}
            <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <SeccionApariencia icon={<I.Filter width={14} height={14} />} titulo="Densidad">
                {[
                  { v: 'compact',   label: 'Compacto',  desc: 'Más información en pantalla' },
                  { v: 'regular',   label: 'Regular',   desc: 'Balance por defecto' },
                  { v: 'spacious',  label: 'Espacioso', desc: 'Mayor legibilidad' },
                ].map(opt => (
                  <button key={opt.v} onClick={() => setDensity(opt.v)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.625rem',
                      padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                      border: density === opt.v ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
                      background: density === opt.v ? 'var(--accent-dim)' : 'var(--bg)',
                      textAlign: 'left', width: '100%',
                      transition: 'all 0.15s',
                    }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                      background: density === opt.v ? 'var(--accent)' : 'var(--border)',
                      transition: 'background 0.15s',
                    }} />
                    <div>
                      <p style={{ fontSize: '0.8125rem', fontWeight: density === opt.v ? 600 : 400, color: density === opt.v ? 'var(--accent)' : 'var(--text)' }}>
                        {opt.label}
                      </p>
                      <p style={{ fontSize: '0.6875rem', color: 'var(--text-3)', marginTop: 1 }}>{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </SeccionApariencia>
            </div>

            {/* Radio de bordes */}
            <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <SeccionApariencia icon={<I.Edit width={14} height={14} />} titulo="Radio de bordes">
                {[
                  { v: 4,  label: 'Cuadrado',   preview: 4  },
                  { v: 8,  label: 'Redondeado',  preview: 8  },
                  { v: 12, label: 'Suave',        preview: 12 },
                  { v: 16, label: 'Circular',     preview: 16 },
                ].map(opt => (
                  <button key={opt.v} onClick={() => setRadius(opt.v)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                      border: radius === opt.v ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
                      background: radius === opt.v ? 'var(--accent-dim)' : 'var(--bg)',
                      textAlign: 'left', width: '100%',
                      transition: 'all 0.15s',
                    }}>
                    <div style={{
                      width: 22, height: 22, flexShrink: 0,
                      background: radius === opt.v ? 'var(--accent)' : 'var(--border)',
                      borderRadius: opt.preview,
                      transition: 'background 0.15s',
                    }} />
                    <span style={{ fontSize: '0.8125rem', fontWeight: radius === opt.v ? 600 : 400, color: radius === opt.v ? 'var(--accent)' : 'var(--text)' }}>
                      {opt.label}
                    </span>
                  </button>
                ))}
              </SeccionApariencia>
            </div>
          </div>

          {/* Barra lateral */}
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <SeccionApariencia icon={<I.SidebarOpen width={15} height={15} />} titulo="Ancho de barra lateral">
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[
                  { v: 'rail',    label: 'Compacta', w: 52  },
                  { v: 'regular', label: 'Regular',  w: 240 },
                  { v: 'wide',    label: 'Amplia',   w: 280 },
                ].map(opt => (
                  <button key={opt.v} onClick={() => setSidebar(opt.v)}
                    style={{
                      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                      padding: '0.875rem 0.5rem', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                      border: sidebar === opt.v ? '2px solid var(--accent)' : '2px solid var(--border)',
                      background: sidebar === opt.v ? 'var(--accent-dim)' : 'var(--bg)',
                      transition: 'all 0.15s',
                    }}>
                    <div style={{ display: 'flex', gap: 3, alignItems: 'flex-start', height: 24 }}>
                      <div style={{ width: opt.v === 'rail' ? 6 : opt.v === 'regular' ? 10 : 14, height: '100%', background: sidebar === opt.v ? 'var(--accent)' : 'var(--border)', borderRadius: 2, transition: 'all 0.2s' }} />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {[1,2,3].map(i => <div key={i} style={{ height: 4, background: 'var(--border)', borderRadius: 2 }} />)}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: sidebar === opt.v ? 600 : 400, color: sidebar === opt.v ? 'var(--accent)' : 'var(--text-2)' }}>
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </SeccionApariencia>
          </div>

          {/* Live preview note */}
          <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', textAlign: 'center', padding: '0 1rem' }}>
            Los cambios se aplican en tiempo real y se guardan automáticamente en este dispositivo.
          </p>
        </div>
      )}

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
            <FormField label="Nombre(s)" required error={perfilErrors.nombre} touched={perfilTouched.nombre}>
              <input className="input" type="text" value={perfil.nombre}
                onChange={e => setPerfil({ ...perfil, nombre: e.target.value })}
                onBlur={() => handlePerfilBlur('nombre')} />
            </FormField>
            <FormField label="Apellidos" required error={perfilErrors.apellidos} touched={perfilTouched.apellidos}>
              <input className="input" type="text" value={perfil.apellidos}
                onChange={e => setPerfil({ ...perfil, apellidos: e.target.value })}
                onBlur={() => handlePerfilBlur('apellidos')} />
            </FormField>
          </div>
          <FormField label="Correo electrónico" required error={perfilErrors.email} touched={perfilTouched.email}>
            <input className="input" type="email" value={perfil.email}
              onChange={e => setPerfil({ ...perfil, email: e.target.value })}
              onBlur={() => handlePerfilBlur('email')} />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="field-label">Cédula profesional</label>
              <input className="input" type="text" value={perfil.cedula_profesional} placeholder="Número de cédula"
                onChange={e => setPerfil({ ...perfil, cedula_profesional: e.target.value })} />
            </div>
            <div>
              <label className="field-label">Especialidad</label>
              <input className="input" type="text" value={perfil.especialidad} placeholder="Ej: Medicina General"
                onChange={e => setPerfil({ ...perfil, especialidad: e.target.value })} />
            </div>
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

            <FormField label="Contraseña actual" error={passErrors.passwordActual} touched={passTouched.passwordActual}>
              <input className="input" type="password" value={seguridad.passwordActual} placeholder="Tu contraseña actual"
                onChange={e => setSeguridad({ ...seguridad, passwordActual: e.target.value })}
                onBlur={() => handlePassBlur('passwordActual')} />
            </FormField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <FormField label="Nueva contraseña" error={passErrors.passwordNuevo} touched={passTouched.passwordNuevo}>
                <input className="input" type="password" value={seguridad.passwordNuevo} placeholder="Mínimo 8 caracteres"
                  onChange={e => setSeguridad({ ...seguridad, passwordNuevo: e.target.value })}
                  onBlur={() => handlePassBlur('passwordNuevo')} />
              </FormField>
              <FormField label="Confirmar nueva contraseña" error={passErrors.passwordConfirm} touched={passTouched.passwordConfirm}>
                <input className="input" type="password" value={seguridad.passwordConfirm} placeholder="Repetir nueva contraseña"
                  onChange={e => setSeguridad({ ...seguridad, passwordConfirm: e.target.value })}
                  onBlur={() => handlePassBlur('passwordConfirm')} />
              </FormField>
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

function SeccionApariencia({ icon, titulo, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ color: 'var(--text-3)' }}>{icon}</span>
        <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-2)' }}>{titulo}</p>
      </div>
      {children}
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
