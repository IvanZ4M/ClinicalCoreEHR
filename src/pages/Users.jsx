import { useState } from 'react'
import { useColeccion } from '../hooks/usePocketBase'
import { useAuth } from '../context/AuthContext'
import pb from '../lib/pb'

const ROLES = [
  { valor: 'medico',          etiqueta: 'Médico',          color: 'bg-blue-100 text-blue-700'   },
  { valor: 'enfermera',       etiqueta: 'Enfermera',       color: 'bg-green-100 text-green-700' },
  { valor: 'recepcionista',   etiqueta: 'Recepcionista',   color: 'bg-yellow-100 text-yellow-700'},
  { valor: 'administrador',   etiqueta: 'Administrador',   color: 'bg-purple-100 text-purple-700'},
]

function formatearFecha(fechaISO) {
  if (!fechaISO) return '—'
  return new Date(fechaISO).toLocaleString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function obtenerColorRol(rol) {
  return ROLES.find(r => r.valor === rol)?.color || 'bg-gray-100 text-gray-600'
}

function obtenerEtiquetaRol(rol) {
  return ROLES.find(r => r.valor === rol)?.etiqueta || rol
}

export default function Users() {
  const { usuario: usuarioActual } = useAuth()
  const [filtroRol, setFiltroRol] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modalEditar, setModalEditar] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [errorForm, setErrorForm] = useState('')
  const [confirmEliminar, setConfirmEliminar] = useState(null)

  const [form, setForm] = useState({
    nombre: '', apellidos: '', email: '',
    password: '', passwordConfirm: '',
    rol: 'medico', cedula_profesional: '',
    especialidad: '', activo: true,
  })

  // Construir filtro dinámico
  const partesFiltro = ['id != ""']
  if (filtroRol) partesFiltro.push(`rol = "${filtroRol}"`)
  if (filtroEstado === 'activo') partesFiltro.push('activo = true')
  if (filtroEstado === 'inactivo') partesFiltro.push('activo = false')
  const filtro = partesFiltro.join(' && ')

  const { datos: usuarios, cargando, recargar } = useColeccion('usuarios', {
    filtro,
    orden: '-created',
  })

  // Contadores
  const totalUsuarios  = usuarios.length
  const medicos        = usuarios.filter(u => u.rol === 'medico').length
  const enfermeras     = usuarios.filter(u => u.rol === 'enfermera').length
  const bloqueados     = usuarios.filter(u => !u.activo).length

  const resetForm = () => {
    setForm({
      nombre: '', apellidos: '', email: '',
      password: '', passwordConfirm: '',
      rol: 'medico', cedula_profesional: '',
      especialidad: '', activo: true,
    })
    setErrorForm('')
  }

  // ── Crear usuario ────────────────────────────────────────────────────────────

  const handleCrear = async () => {
    if (!form.nombre || !form.apellidos || !form.email || !form.password) {
      setErrorForm('Nombre, apellidos, correo y contraseña son obligatorios.')
      return
    }
    if (form.password !== form.passwordConfirm) {
      setErrorForm('Las contraseñas no coinciden.')
      return
    }
    if (form.password.length < 8) {
      setErrorForm('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    setGuardando(true)
    setErrorForm('')
    try {
      await pb.collection('usuarios').create({
        nombre:             form.nombre,
        apellidos:          form.apellidos,
        email:              form.email,
        password:           form.password,
        passwordConfirm:    form.passwordConfirm,
        rol:                form.rol,
        cedula_profesional: form.cedula_profesional,
        especialidad:       form.especialidad,
        activo:             form.activo,
      })
      setModalAbierto(false)
      resetForm()
      recargar()
    } catch (err) {
      setErrorForm('Error al crear: ' + (err.data?.message || err.message))
    } finally {
      setGuardando(false)
    }
  }

  // ── Editar usuario ───────────────────────────────────────────────────────────

  const abrirEditar = (usuario) => {
    setForm({
      nombre:             usuario.nombre || '',
      apellidos:          usuario.apellidos || '',
      email:              usuario.email || '',
      password:           '',
      passwordConfirm:    '',
      rol:                usuario.rol || 'medico',
      cedula_profesional: usuario.cedula_profesional || '',
      especialidad:       usuario.especialidad || '',
      activo:             usuario.activo ?? true,
    })
    setModalEditar(usuario)
    setErrorForm('')
  }

  const handleEditar = async () => {
    if (!form.nombre || !form.apellidos || !form.email) {
      setErrorForm('Nombre, apellidos y correo son obligatorios.')
      return
    }
    if (form.password && form.password !== form.passwordConfirm) {
      setErrorForm('Las contraseñas no coinciden.')
      return
    }
    if (form.password && form.password.length < 8) {
      setErrorForm('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    setGuardando(true)
    setErrorForm('')
    try {
      const datos = {
        nombre:             form.nombre,
        apellidos:          form.apellidos,
        email:              form.email,
        rol:                form.rol,
        cedula_profesional: form.cedula_profesional,
        especialidad:       form.especialidad,
        activo:             form.activo,
      }
      // Solo actualizar contraseña si se proporcionó una nueva
      if (form.password) {
        datos.password       = form.password
        datos.passwordConfirm = form.passwordConfirm
      }
      await pb.collection('usuarios').update(modalEditar.id, datos)
      setModalEditar(null)
      resetForm()
      recargar()
    } catch (err) {
      setErrorForm('Error al actualizar: ' + (err.data?.message || err.message))
    } finally {
      setGuardando(false)
    }
  }

  // ── Cambiar estado activo/inactivo ───────────────────────────────────────────

  const toggleActivo = async (usuario) => {
    if (usuario.id === usuarioActual?.id) return
    try {
      await pb.collection('usuarios').update(usuario.id, { activo: !usuario.activo })
      recargar()
    } catch (err) {
      console.error('Error al cambiar estado:', err)
    }
  }

  return (
    <div className="p-6 space-y-5">

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Administre el acceso del personal y configure permisos de seguridad
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setModalAbierto(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
        >
          + Nuevo Usuario
        </button>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-4 gap-4">
        <TarjetaContador
          label="Total Usuarios"
          valor={totalUsuarios}
          badge="+4 este mes"
          badgeColor="text-green-600"
        />
        <TarjetaContador label="Médicos Activos"  valor={medicos}    />
        <TarjetaContador label="Enfermería"        valor={enfermeras} />
        <TarjetaContador
          label="Accesos Bloqueados"
          valor={bloqueados}
          rojo={bloqueados > 0}
        />
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3">
        <select
          value={filtroRol}
          onChange={(e) => setFiltroRol(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los roles</option>
          {ROLES.map(r => (
            <option key={r.valor} value={r.valor}>{r.etiqueta}</option>
          ))}
        </select>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Cualquier estado</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
        <span className="text-sm text-gray-400 ml-auto">
          Mostrando {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {cargando ? (
          <div className="text-center py-16 text-gray-400">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Cargando usuarios...</p>
          </div>
        ) : usuarios.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">👤</p>
            <p className="font-medium text-gray-600">Sin usuarios encontrados</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-xs text-gray-400 uppercase">
                <th className="text-left px-5 py-3 font-medium">Usuario</th>
                <th className="text-left px-5 py-3 font-medium">Rol</th>
                <th className="text-left px-5 py-3 font-medium">Especialidad</th>
                <th className="text-left px-5 py-3 font-medium">Último acceso</th>
                <th className="text-left px-5 py-3 font-medium">Estado</th>
                <th className="text-left px-5 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {usuarios.map((u) => {
                const esMiCuenta = u.id === usuarioActual?.id
                return (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">

                    {/* Usuario */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {u.nombre?.[0]}{u.apellidos?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {u.nombre} {u.apellidos}
                            {esMiCuenta && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">
                                Tú
                              </span>
                            )}
                          </p>
                          <p className="text-gray-400 text-xs">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Rol */}
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${obtenerColorRol(u.rol)}`}>
                        {obtenerEtiquetaRol(u.rol)}
                      </span>
                    </td>

                    {/* Especialidad */}
                    <td className="px-5 py-4 text-gray-600">
                      {u.especialidad || '—'}
                    </td>

                    {/* Último acceso */}
                    <td className="px-5 py-4 text-gray-500 text-xs">
                      {formatearFecha(u.updated)}
                    </td>

                    {/* Estado */}
                    <td className="px-5 py-4">
                      <button
                        onClick={() => !esMiCuenta && toggleActivo(u)}
                        disabled={esMiCuenta}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          u.activo
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-600 hover:bg-red-200'
                        } ${esMiCuenta ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${u.activo ? 'bg-green-500' : 'bg-red-500'}`} />
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>

                    {/* Acciones */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => abrirEditar(u)}
                          className="text-xs text-blue-600 hover:underline font-medium"
                        >
                          Editar
                        </button>
                        {!esMiCuenta && (
                          <button
                            onClick={() => setConfirmEliminar(u)}
                            className="text-xs text-red-400 hover:text-red-600 hover:underline"
                          >
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

      {/* Paneles inferiores */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🛡</span>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Políticas de Acceso</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Cada rol tiene permisos específicos definidos en el sistema.
                No asigne roles de Administrador a menos que sea estrictamente necesario.
              </p>
              <div className="mt-3 space-y-1">
                {ROLES.map(r => (
                  <div key={r.valor} className="flex items-center gap-2 text-xs text-gray-500">
                    <span className={`px-2 py-0.5 rounded-full ${r.color}`}>{r.etiqueta}</span>
                    <span>
                      {r.valor === 'administrador'  ? '— Acceso total al sistema'           : ''}
                      {r.valor === 'medico'         ? '— Consultas, expedientes, recetas'   : ''}
                      {r.valor === 'enfermera'      ? '— Signos vitales, notas, citas'      : ''}
                      {r.valor === 'recepcionista'  ? '— Citas, registro de pacientes'      : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📋</span>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Registro de Auditoría</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Todos los cambios de roles, creaciones y modificaciones de usuarios
                quedan registrados con marca de tiempo y autor para cumplimiento normativo.
              </p>
              <div className="mt-3 space-y-2">
                {usuarios.slice(0, 3).map(u => (
                  <div key={u.id} className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                    <span>
                      {u.nombre} {u.apellidos} — {obtenerEtiquetaRol(u.rol)} — {formatearFecha(u.created)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal: Nuevo Usuario ── */}
      {modalAbierto && (
        <ModalUsuario
          titulo="Nuevo Usuario"
          form={form}
          setForm={setForm}
          errorForm={errorForm}
          guardando={guardando}
          onGuardar={handleCrear}
          onCerrar={() => { setModalAbierto(false); resetForm() }}
          esNuevo
        />
      )}

      {/* ── Modal: Editar Usuario ── */}
      {modalEditar && (
        <ModalUsuario
          titulo={`Editar — ${modalEditar.nombre} ${modalEditar.apellidos}`}
          form={form}
          setForm={setForm}
          errorForm={errorForm}
          guardando={guardando}
          onGuardar={handleEditar}
          onCerrar={() => { setModalEditar(null); resetForm() }}
          esNuevo={false}
        />
      )}

      {/* ── Confirmación bloquear ── */}
      {confirmEliminar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">¿Bloquear usuario?</h3>
            <p className="text-sm text-gray-500 mb-5">
              El usuario <strong>{confirmEliminar.nombre} {confirmEliminar.apellidos}</strong> no
              podrá iniciar sesión hasta que se reactive su cuenta.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmEliminar(null)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await pb.collection('usuarios').update(confirmEliminar.id, { activo: false })
                  setConfirmEliminar(null)
                  recargar()
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                Bloquear acceso
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Modal reutilizable para crear/editar usuario ──────────────────────────────

function ModalUsuario({ titulo, form, setForm, errorForm, guardando, onGuardar, onCerrar, esNuevo }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{titulo}</h2>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="p-6 space-y-4">

          <div className="grid grid-cols-2 gap-4">
            <Campo label="Nombre(s) *" value={form.nombre}
              onChange={(v) => setForm({ ...form, nombre: v })} />
            <Campo label="Apellidos *" value={form.apellidos}
              onChange={(v) => setForm({ ...form, apellidos: v })} />
          </div>

          <Campo label="Correo electrónico *" type="email" value={form.email}
            onChange={(v) => setForm({ ...form, email: v })} />

          <div className="grid grid-cols-2 gap-4">
            <Campo
              label={esNuevo ? 'Contraseña *' : 'Nueva contraseña (opcional)'}
              type="password"
              value={form.password}
              onChange={(v) => setForm({ ...form, password: v })}
              placeholder="Mínimo 8 caracteres"
            />
            <Campo
              label="Confirmar contraseña"
              type="password"
              value={form.passwordConfirm}
              onChange={(v) => setForm({ ...form, passwordConfirm: v })}
              placeholder="Repetir contraseña"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
              <select
                value={form.rol}
                onChange={(e) => setForm({ ...form, rol: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {ROLES.map(r => (
                  <option key={r.valor} value={r.valor}>{r.etiqueta}</option>
                ))}
              </select>
            </div>
            <Campo label="Especialidad" value={form.especialidad}
              onChange={(v) => setForm({ ...form, especialidad: v })}
              placeholder="Ej: Pediatría, Cardiología..." />
          </div>

          <Campo label="Cédula profesional" value={form.cedula_profesional}
            onChange={(v) => setForm({ ...form, cedula_profesional: v })}
            placeholder="Número de cédula" />

          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => setForm({ ...form, activo: e.target.checked })}
              className="w-4 h-4 accent-blue-600"
            />
            Usuario activo (puede iniciar sesión)
          </label>

          {errorForm && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-100">
              {errorForm}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
          <button onClick={onCerrar}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={onGuardar} disabled={guardando}
            className="px-6 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-60">
            {guardando ? 'Guardando...' : esNuevo ? 'Crear Usuario' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Componentes auxiliares ────────────────────────────────────────────────────

function TarjetaContador({ label, valor, badge, badgeColor, rojo }) {
  return (
    <div className={`bg-white rounded-xl border p-5 ${rojo && valor > 0 ? 'border-red-200' : 'border-gray-200'}`}>
      <p className="text-xs text-gray-400 uppercase font-medium tracking-wide mb-1">{label}</p>
      <p className={`text-3xl font-bold ${rojo && valor > 0 ? 'text-red-600' : 'text-gray-900'}`}>
        {valor}
      </p>
      {badge && (
        <p className={`text-xs mt-1 font-medium ${badgeColor || 'text-gray-400'}`}>{badge}</p>
      )}
    </div>
  )
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