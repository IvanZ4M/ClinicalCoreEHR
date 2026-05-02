import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import pb from '../lib/pb'

const TABS = ['Consultorio', 'Mi Perfil', 'Seguridad']

export default function Settings() {
  const { usuario, login } = useAuth()
  const [tabActiva, setTabActiva] = useState('Consultorio')

  // ── Estado: Consultorio ──────────────────────────────────────────────────────
  const [consultorio, setConsultorio] = useState({
    nombre:     '',
    direccion:  '',
    telefono:   '',
    email:      '',
    horario:    '',
    especialidades: '',
  })
  const [guardandoConsultorio, setGuardandoConsultorio] = useState(false)
  const [mensajeConsultorio, setMensajeConsultorio] = useState('')

  // ── Estado: Mi Perfil ────────────────────────────────────────────────────────
  const [perfil, setPerfil] = useState({
    nombre:             '',
    apellidos:          '',
    email:              '',
    cedula_profesional: '',
    especialidad:       '',
  })
  const [guardandoPerfil, setGuardandoPerfil] = useState(false)
  const [mensajePerfil, setMensajePerfil] = useState('')

  // ── Estado: Seguridad ────────────────────────────────────────────────────────
  const [seguridad, setSeguridad] = useState({
    passwordActual:  '',
    passwordNuevo:   '',
    passwordConfirm: '',
  })
  const [guardandoPass, setGuardandoPass] = useState(false)
  const [mensajePass, setMensajePass] = useState('')
  const [errorPass, setErrorPass] = useState('')

  // Cargar datos del usuario al montar
  useEffect(() => {
    if (usuario) {
      setPerfil({
        nombre:             usuario.nombre             || '',
        apellidos:          usuario.apellidos          || '',
        email:              usuario.email              || '',
        cedula_profesional: usuario.cedula_profesional || '',
        especialidad:       usuario.especialidad       || '',
      })
    }

    // Cargar config del consultorio desde localStorage
    const configGuardada = localStorage.getItem('config_consultorio')
    if (configGuardada) {
      try { setConsultorio(JSON.parse(configGuardada)) } catch {}
    }
  }, [usuario])

  // ── Guardar configuración del consultorio ────────────────────────────────────
  const handleGuardarConsultorio = async () => {
    setGuardandoConsultorio(true)
    setMensajeConsultorio('')
    try {
      // Guardamos en localStorage (no requiere colección extra en PocketBase)
      localStorage.setItem('config_consultorio', JSON.stringify(consultorio))
      setMensajeConsultorio('✓ Configuración guardada correctamente')
      setTimeout(() => setMensajeConsultorio(''), 3000)
    } catch (err) {
      setMensajeConsultorio('Error al guardar: ' + err.message)
    } finally {
      setGuardandoConsultorio(false)
    }
  }

  // ── Guardar perfil del usuario ───────────────────────────────────────────────
  const handleGuardarPerfil = async () => {
    if (!perfil.nombre || !perfil.apellidos || !perfil.email) {
      setMensajePerfil('Nombre, apellidos y correo son obligatorios.')
      return
    }
    setGuardandoPerfil(true)
    setMensajePerfil('')
    try {
      await pb.collection('usuarios').update(usuario.id, {
        nombre:             perfil.nombre,
        apellidos:          perfil.apellidos,
        email:              perfil.email,
        cedula_profesional: perfil.cedula_profesional,
        especialidad:       perfil.especialidad,
      })
      setMensajePerfil('✓ Perfil actualizado correctamente')
      setTimeout(() => setMensajePerfil(''), 3000)
    } catch (err) {
      setMensajePerfil('Error al guardar: ' + (err.data?.message || err.message))
    } finally {
      setGuardandoPerfil(false)
    }
  }

  // ── Cambiar contraseña ───────────────────────────────────────────────────────
  const handleCambiarPassword = async () => {
    setErrorPass('')
    setMensajePass('')

    if (!seguridad.passwordActual) {
      setErrorPass('Ingresa tu contraseña actual.')
      return
    }
    if (seguridad.passwordNuevo.length < 8) {
      setErrorPass('La nueva contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (seguridad.passwordNuevo !== seguridad.passwordConfirm) {
      setErrorPass('Las contraseñas nuevas no coinciden.')
      return
    }

    setGuardandoPass(true)
    try {
      await pb.collection('usuarios').update(usuario.id, {
        oldPassword:     seguridad.passwordActual,
        password:        seguridad.passwordNuevo,
        passwordConfirm: seguridad.passwordConfirm,
      })
      setMensajePass('✓ Contraseña actualizada correctamente')
      setSeguridad({ passwordActual: '', passwordNuevo: '', passwordConfirm: '' })
      setTimeout(() => setMensajePass(''), 3000)
    } catch (err) {
      setErrorPass('Error: ' + (err.data?.message || err.message))
    } finally {
      setGuardandoPass(false)
    }
  }

  return (
    <div className="p-6 space-y-5 max-w-3xl">

      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Personaliza el sistema y administra tu cuenta
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setTabActiva(tab)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                tabActiva === tab
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB: Consultorio ── */}
      {tabActiva === 'Consultorio' && (
        <div className="space-y-5">

          {/* Vista previa del encabezado */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {consultorio.nombre
                ? consultorio.nombre.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                : 'CM'}
            </div>
            <div>
              <p className="font-bold text-gray-900">
                {consultorio.nombre || 'Nombre del Consultorio'}
              </p>
              <p className="text-sm text-gray-500">
                {consultorio.especialidades || 'Especialidades médicas'}
              </p>
              <p className="text-xs text-gray-400">
                {consultorio.direccion || 'Dirección del consultorio'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Datos del Consultorio</h2>

            <Campo
              label="Nombre del consultorio"
              value={consultorio.nombre}
              onChange={(v) => setConsultorio({ ...consultorio, nombre: v })}
              placeholder="Ej: Centro Médico Familiar"
            />
            <Campo
              label="Dirección"
              value={consultorio.direccion}
              onChange={(v) => setConsultorio({ ...consultorio, direccion: v })}
              placeholder="Calle, número, colonia, ciudad"
            />
            <div className="grid grid-cols-2 gap-4">
              <Campo
                label="Teléfono"
                value={consultorio.telefono}
                onChange={(v) => setConsultorio({ ...consultorio, telefono: v })}
                placeholder="871 000 0000"
              />
              <Campo
                label="Correo de contacto"
                type="email"
                value={consultorio.email}
                onChange={(v) => setConsultorio({ ...consultorio, email: v })}
                placeholder="contacto@consultorio.com"
              />
            </div>
            <Campo
              label="Horario de atención"
              value={consultorio.horario}
              onChange={(v) => setConsultorio({ ...consultorio, horario: v })}
              placeholder="Lun-Vie 9:00am - 6:00pm, Sáb 9:00am - 2:00pm"
            />
            <Campo
              label="Especialidades"
              value={consultorio.especialidades}
              onChange={(v) => setConsultorio({ ...consultorio, especialidades: v })}
              placeholder="Medicina General, Pediatría, Cardiología..."
            />

            {/* Mensaje de confirmación */}
            {mensajeConsultorio && (
              <div className={`text-sm px-4 py-3 rounded-lg ${
                mensajeConsultorio.startsWith('✓')
                  ? 'bg-green-50 text-green-700 border border-green-100'
                  : 'bg-red-50 text-red-600 border border-red-100'
              }`}>
                {mensajeConsultorio}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={handleGuardarConsultorio}
                disabled={guardandoConsultorio}
                className="px-6 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-60"
              >
                {guardandoConsultorio ? 'Guardando...' : 'Guardar Configuración'}
              </button>
            </div>
          </div>

          {/* Info del sistema */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Información del Sistema</h2>
            <div className="space-y-3 text-sm">
              <InfoFila label="Sistema"     valor="ClinicalCore EHR" />
              <InfoFila label="Versión"     valor="1.0.0 — En desarrollo" />
              <InfoFila label="Base de datos" valor="PocketBase v0.37 (Local)" />
              <InfoFila label="Framework"   valor="Electron + React 19" />
              <InfoFila label="Plataforma"  valor={`Windows — ${navigator.userAgent.includes('Win') ? 'x64' : 'x86'}`} />
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Mi Perfil ── */}
      {tabActiva === 'Mi Perfil' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">

          {/* Avatar */}
          <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
            <div className="w-16 h-16 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-2xl font-bold">
              {usuario?.nombre?.[0]}{usuario?.apellidos?.[0]}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-lg">
                {usuario?.nombre} {usuario?.apellidos}
              </p>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
                usuario?.rol === 'administrador' ? 'bg-purple-100 text-purple-700' :
                usuario?.rol === 'medico'        ? 'bg-blue-100 text-blue-700'     :
                usuario?.rol === 'enfermera'     ? 'bg-green-100 text-green-700'   :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {usuario?.rol}
              </span>
            </div>
          </div>

          <h2 className="font-semibold text-gray-900">Datos personales</h2>

          <div className="grid grid-cols-2 gap-4">
            <Campo
              label="Nombre(s) *"
              value={perfil.nombre}
              onChange={(v) => setPerfil({ ...perfil, nombre: v })}
            />
            <Campo
              label="Apellidos *"
              value={perfil.apellidos}
              onChange={(v) => setPerfil({ ...perfil, apellidos: v })}
            />
          </div>

          <Campo
            label="Correo electrónico *"
            type="email"
            value={perfil.email}
            onChange={(v) => setPerfil({ ...perfil, email: v })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Campo
              label="Cédula profesional"
              value={perfil.cedula_profesional}
              onChange={(v) => setPerfil({ ...perfil, cedula_profesional: v })}
              placeholder="Número de cédula"
            />
            <Campo
              label="Especialidad"
              value={perfil.especialidad}
              onChange={(v) => setPerfil({ ...perfil, especialidad: v })}
              placeholder="Ej: Medicina General"
            />
          </div>

          {mensajePerfil && (
            <div className={`text-sm px-4 py-3 rounded-lg ${
              mensajePerfil.startsWith('✓')
                ? 'bg-green-50 text-green-700 border border-green-100'
                : 'bg-red-50 text-red-600 border border-red-100'
            }`}>
              {mensajePerfil}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={handleGuardarPerfil}
              disabled={guardandoPerfil}
              className="px-6 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-60"
            >
              {guardandoPerfil ? 'Guardando...' : 'Actualizar Perfil'}
            </button>
          </div>
        </div>
      )}

      {/* ── TAB: Seguridad ── */}
      {tabActiva === 'Seguridad' && (
        <div className="space-y-4">

          {/* Cambiar contraseña */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div>
              <h2 className="font-semibold text-gray-900">Cambiar Contraseña</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Usa una contraseña segura de al menos 8 caracteres
              </p>
            </div>

            <Campo
              label="Contraseña actual"
              type="password"
              value={seguridad.passwordActual}
              onChange={(v) => setSeguridad({ ...seguridad, passwordActual: v })}
              placeholder="Tu contraseña actual"
            />
            <div className="grid grid-cols-2 gap-4">
              <Campo
                label="Nueva contraseña"
                type="password"
                value={seguridad.passwordNuevo}
                onChange={(v) => setSeguridad({ ...seguridad, passwordNuevo: v })}
                placeholder="Mínimo 8 caracteres"
              />
              <Campo
                label="Confirmar nueva contraseña"
                type="password"
                value={seguridad.passwordConfirm}
                onChange={(v) => setSeguridad({ ...seguridad, passwordConfirm: v })}
                placeholder="Repetir nueva contraseña"
              />
            </div>

            {/* Indicador de fortaleza */}
            {seguridad.passwordNuevo && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Fortaleza de la contraseña:</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((n) => {
                    const fortaleza = calcularFortaleza(seguridad.passwordNuevo)
                    return (
                      <div
                        key={n}
                        className={`h-1.5 flex-1 rounded-full ${
                          n <= fortaleza
                            ? fortaleza <= 1 ? 'bg-red-400'
                            : fortaleza <= 2 ? 'bg-yellow-400'
                            : fortaleza <= 3 ? 'bg-blue-400'
                            : 'bg-green-500'
                            : 'bg-gray-200'
                        }`}
                      />
                    )
                  })}
                </div>
                <p className="text-xs mt-1 text-gray-400">
                  {calcularFortaleza(seguridad.passwordNuevo) <= 1 ? 'Muy débil' :
                   calcularFortaleza(seguridad.passwordNuevo) <= 2 ? 'Débil' :
                   calcularFortaleza(seguridad.passwordNuevo) <= 3 ? 'Moderada' : 'Fuerte ✓'}
                </p>
              </div>
            )}

            {errorPass && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-100">
                {errorPass}
              </div>
            )}
            {mensajePass && (
              <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg border border-green-100">
                {mensajePass}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={handleCambiarPassword}
                disabled={guardandoPass}
                className="px-6 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-60"
              >
                {guardandoPass ? 'Actualizando...' : 'Cambiar Contraseña'}
              </button>
            </div>
          </div>

          {/* Info de sesión */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Sesión Activa</h2>
            <div className="space-y-3 text-sm">
              <InfoFila label="Usuario"   valor={`${usuario?.nombre} ${usuario?.apellidos}`} />
              <InfoFila label="Correo"    valor={usuario?.email} />
              <InfoFila label="Rol"       valor={usuario?.rol} capitalizar />
              <InfoFila label="ID"        valor={usuario?.id?.slice(0, 12) + '...'} mono />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcularFortaleza(password) {
  let puntos = 0
  if (password.length >= 8)  puntos++
  if (password.length >= 12) puntos++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) puntos++
  if (/[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password)) puntos++
  return puntos
}

function Campo({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}

function InfoFila({ label, valor, mono, capitalizar }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className={`text-gray-900 font-medium ${mono ? 'font-mono text-xs' : ''} ${capitalizar ? 'capitalize' : ''}`}>
        {valor || '—'}
      </span>
    </div>
  )
}