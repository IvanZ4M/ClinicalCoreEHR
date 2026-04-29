import { useState } from 'react'
import { useNavigate } from 'react-router-dom'  
import { useColeccion } from '../hooks/usePocketBase'
import pb from '../lib/pb'

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

export default function Patients() {
  const [busqueda, setBusqueda] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorForm, setErrorForm] = useState('')
  const navigate = useNavigate()

  const [form, setForm] = useState({
    nombre: '', apellidos: '', curp: '',
    fecha_nacimiento: '', sexo: '', grupo_sanguineo: '',
    telefono: '', email: '', alergias: '',
    alergias_criticas: false, activo: true,
  })

  const filtro = busqueda.trim()
    ? `nombre ~ "${busqueda}" || apellidos ~ "${busqueda}" || curp ~ "${busqueda}" || email ~ "${busqueda}"`
    : 'activo = true'

  const { datos: pacientes, cargando, recargar } = useColeccion('pacientes', {
    filtro,
    orden: 'nombre',
  })

  const handleGuardar = async () => {
    if (!form.nombre || !form.apellidos || !form.curp) {
      setErrorForm('Nombre, apellidos y CURP son obligatorios.')
      return
    }
    setGuardando(true)
    setErrorForm('')
    try {
      await pb.collection('pacientes').create(form)
      setModalAbierto(false)
      setForm({
        nombre: '', apellidos: '', curp: '',
        fecha_nacimiento: '', sexo: '', grupo_sanguineo: '',
        telefono: '', email: '', alergias: '',
        alergias_criticas: false, activo: true,
      })
      recargar()
    } catch (err) {
      setErrorForm('Error al guardar: ' + err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="p-6">

      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
          <p className="text-gray-500 text-sm mt-1">
            {pacientes.length} paciente{pacientes.length !== 1 ? 's' : ''} registrado{pacientes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setModalAbierto(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
        >
          + Nuevo Paciente
        </button>
      </div>

      {/* Buscador */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre, CURP o correo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {cargando ? (
          <div className="text-center py-16 text-gray-400">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p>Cargando pacientes...</p>
          </div>
        ) : pacientes.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">👥</p>
            <p className="font-medium text-gray-600">
              {busqueda ? 'No se encontraron resultados' : 'Aún no hay pacientes registrados'}
            </p>
            {!busqueda && (
              <button
                onClick={() => setModalAbierto(true)}
                className="mt-4 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm hover:bg-blue-800"
              >
                Registrar primer paciente
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-xs text-gray-400 uppercase">
                <th className="text-left px-5 py-3 font-medium">Paciente</th>
                <th className="text-left px-5 py-3 font-medium">CURP</th>
                <th className="text-left px-5 py-3 font-medium">Edad</th>
                <th className="text-left px-5 py-3 font-medium">Contacto</th>
                <th className="text-left px-5 py-3 font-medium">Alergias</th>
                <th className="text-left px-5 py-3 font-medium">Registro</th>
                <th className="text-left px-5 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pacientes.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {p.nombre?.[0]}{p.apellidos?.[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{p.nombre} {p.apellidos}</p>
                        <p className="text-gray-400 text-xs">{p.sexo || '—'} · {p.grupo_sanguineo || 'Tipo no registrado'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600 font-mono text-xs">{p.curp || '—'}</td>
                  <td className="px-5 py-4 text-gray-700">
                    {calcularEdad(p.fecha_nacimiento)} años
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    <p>{p.telefono || '—'}</p>
                    <p className="text-xs text-gray-400">{p.email || ''}</p>
                  </td>
                  <td className="px-5 py-4">
                    {p.alergias_criticas ? (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                        ⚠ Críticas
                      </span>
                    ) : p.alergias ? (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                        Con alergias
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">Ninguna</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-gray-500 text-xs">
                    {formatearFecha(p.created)}
                  </td>
                  <td className="px-5 py-4">
                    <button 
                      onClick={() => navigate(`/pacientes/${p.id}`)}
                      className="text-blue-600 text-sm hover:underline font-medium"
                    >
                      Ver expediente
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal — Nuevo Paciente */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Registrar Nuevo Paciente</h2>
              <button
                onClick={() => { setModalAbierto(false); setErrorForm('') }}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Campo label="Nombre(s) *" value={form.nombre}
                  onChange={(v) => setForm({ ...form, nombre: v })} />
                <Campo label="Apellidos *" value={form.apellidos}
                  onChange={(v) => setForm({ ...form, apellidos: v })} />
              </div>
              <Campo label="CURP *" value={form.curp}
                onChange={(v) => setForm({ ...form, curp: v.toUpperCase() })}
                placeholder="ZAMD000101HCOMNR00" />
              <div className="grid grid-cols-2 gap-4">
                <Campo label="Fecha de nacimiento" type="date" value={form.fecha_nacimiento}
                  onChange={(v) => setForm({ ...form, fecha_nacimiento: v })} />
                <CampoSelect label="Sexo" value={form.sexo}
                  onChange={(v) => setForm({ ...form, sexo: v })}
                  opciones={[
                    { valor: 'masculino', etiqueta: 'Masculino' },
                    { valor: 'femenino', etiqueta: 'Femenino' },
                    { valor: 'otro', etiqueta: 'Otro' },
                  ]} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <CampoSelect label="Grupo sanguíneo" value={form.grupo_sanguineo}
                  onChange={(v) => setForm({ ...form, grupo_sanguineo: v })}
                  opciones={['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => ({ valor: g, etiqueta: g }))} />
                <Campo label="Teléfono" value={form.telefono}
                  onChange={(v) => setForm({ ...form, telefono: v })}
                  placeholder="871 000 0000" />
              </div>
              <Campo label="Correo electrónico" type="email" value={form.email}
                onChange={(v) => setForm({ ...form, email: v })} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alergias conocidas
                </label>
                <textarea
                  value={form.alergias}
                  onChange={(e) => setForm({ ...form, alergias: e.target.value })}
                  placeholder="Ej: Penicilina, Látex, Cacahuates..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.alergias_criticas}
                  onChange={(e) => setForm({ ...form, alergias_criticas: e.target.checked })}
                  className="w-4 h-4 accent-red-600"
                />
                Marcar como alergias críticas (mostrará alerta roja en el expediente)
              </label>

              {errorForm && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-100">
                  {errorForm}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
              <button
                onClick={() => { setModalAbierto(false); setErrorForm('') }}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={guardando}
                className="px-6 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-60"
              >
                {guardando ? 'Guardando...' : 'Guardar Paciente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Componentes auxiliares del formulario
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

function CampoSelect({ label, value, onChange, opciones }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        <option value="">Seleccionar...</option>
        {opciones.map((op) => (
          <option key={op.valor} value={op.valor}>{op.etiqueta}</option>
        ))}
      </select>
    </div>
  )
}