import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useRegistro, useColeccion } from '../hooks/usePocketBase'
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
  return new Date(fechaISO).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function formatearFechaHora(fechaISO) {
  if (!fechaISO) return '—'
  return new Date(fechaISO).toLocaleString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const TABS = ['Datos Personales', 'Antecedentes', 'Historial Médico', 'Consultas Previas']

export default function PatientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tabActiva, setTabActiva] = useState('Datos Personales')
  const [editandoAlergias, setEditandoAlergias] = useState(false)
  const [alergiasTxt, setAlergiasTxt] = useState('')
  const [guardando, setGuardando] = useState(false)

  // Datos del paciente
  const { dato: paciente, cargando, error } = useRegistro('pacientes', id)

  // Consultas del paciente
  const { datos: consultas } = useColeccion('consultas', {
    filtro: `paciente = "${id}"`,
    orden: '-fecha',
    expandir: 'medico',
  })

  // Diagnósticos del paciente (a través de consultas)
  const { datos: diagnosticos } = useColeccion('diagnosticos', {
    filtro: consultas.length > 0
      ? consultas.map(c => `consulta = "${c.id}"`).join(' || ')
      : 'id = ""',
    orden: '-created',
  })

  // Citas futuras del paciente
  const ahora = new Date().toISOString().replace('T', ' ').slice(0, 19)
  const { datos: citasFuturas } = useColeccion('citas', {
    filtro: `paciente = "${id}" && fecha_hora >= "${ahora}" && estado != "cancelada"`,
    orden: 'fecha_hora',
    expandir: 'medico',
  })

  const handleGuardarAlergias = async () => {
    setGuardando(true)
    try {
      await pb.collection('pacientes').update(id, { alergias: alergiasTxt })
      setEditandoAlergias(false)
    } catch (e) {
      console.error(e)
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-400">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Cargando expediente...</p>
        </div>
      </div>
    )
  }

  if (error || !paciente) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-400">
          <p className="text-4xl mb-3">⚠️</p>
          <p className="font-medium text-gray-600">Paciente no encontrado</p>
          <button onClick={() => navigate('/pacientes')}
            className="mt-4 text-sm text-blue-600 hover:underline">
            ← Volver a pacientes
          </button>
        </div>
      </div>
    )
  }

  const condicionesActivas = diagnosticos.filter(d => d.estado === 'activo' || d.estado === 'cronico')

  return (
    <div className="p-6 space-y-5">

      {/* Botón volver */}
      <button
        onClick={() => navigate('/pacientes')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        ← Volver a Pacientes
      </button>

      {/* ── Encabezado del paciente ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-start gap-5">

          {/* Avatar */}
          <div className="w-20 h-20 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-3xl font-bold flex-shrink-0">
            {paciente.nombre?.[0]}{paciente.apellidos?.[0]}
          </div>

          {/* Info principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {paciente.nombre} {paciente.apellidos}
                </h1>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  <span>ID: #{paciente.id.slice(-6).toUpperCase()}</span>
                  <span>·</span>
                  <span>{calcularEdad(paciente.fecha_nacimiento)} años</span>
                  <span>·</span>
                  <span className="capitalize">{paciente.sexo || '—'}</span>
                  <span>·</span>
                  <span>{paciente.grupo_sanguineo || 'Tipo no registrado'}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1 font-mono">
                  CURP: {paciente.curp || '—'}
                </p>
              </div>

              {/* Botón iniciar consulta */}
              <button
                onClick={() => navigate(`/consulta/nueva?paciente=${id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors flex-shrink-0"
              >
                ✚ Iniciar Nueva Consulta
              </button>
            </div>

            {/* Alerta de alergias críticas */}
            {paciente.alergias_criticas && paciente.alergias && (
              <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm font-medium">
                ⚠ ALERGIAS CRÍTICAS: {paciente.alergias.toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
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

      {/* ── Contenido de tabs ── */}

      {/* TAB: Datos Personales */}
      {tabActiva === 'Datos Personales' && (
        <div className="grid grid-cols-3 gap-4">

          {/* Signos vitales (última consulta) */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              📈 Signos Vitales
              {consultas[0]?.signos_vitales && (
                <span className="text-xs text-gray-400 font-normal">
                  · última consulta {formatearFecha(consultas[0]?.fecha)}
                </span>
              )}
            </h3>
            {consultas[0]?.signos_vitales ? (() => {
              const sv = typeof consultas[0].signos_vitales === 'string'
                ? JSON.parse(consultas[0].signos_vitales)
                : consultas[0].signos_vitales
              return (
                <div className="space-y-3">
                  {sv.presion_arterial && (
                    <SignoVital label="Presión Arterial" valor={sv.presion_arterial} unidad="mmHg" />
                  )}
                  {sv.frecuencia_cardiaca && (
                    <SignoVital label="Frec. Cardíaca" valor={sv.frecuencia_cardiaca} unidad="lpm" />
                  )}
                  {sv.temperatura && (
                    <SignoVital label="Temperatura" valor={sv.temperatura} unidad="°C" />
                  )}
                  {sv.peso && sv.talla && (
                    <SignoVital
                      label="IMC"
                      valor={(sv.peso / ((sv.talla / 100) ** 2)).toFixed(1)}
                      unidad="kg/m²"
                    />
                  )}
                  {sv.saturacion_o2 && (
                    <SignoVital label="SpO₂" valor={sv.saturacion_o2} unidad="%" />
                  )}
                </div>
              )
            })() : (
              <p className="text-sm text-gray-400 text-center py-4">
                Sin registros de signos vitales
              </p>
            )}
          </div>

          {/* Condiciones activas */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">🏥 Condiciones Actuales</h3>
            {condicionesActivas.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Sin condiciones registradas</p>
            ) : (
              <div className="space-y-3">
                {condicionesActivas.map((dx) => (
                  <div key={dx.id} className="border border-gray-100 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{dx.descripcion}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        dx.estado === 'activo' ? 'bg-blue-100 text-blue-700' :
                        dx.estado === 'cronico' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {dx.estado === 'cronico' ? 'Crónico' : 'Activo'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">CIE-10: {dx.codigo_cie10}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Próxima cita + datos de contacto */}
          <div className="flex flex-col gap-4">

            {/* Próxima cita */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">📅 Próxima Cita</h3>
              {citasFuturas[0] ? (
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="font-semibold text-gray-900 text-sm">
                    {citasFuturas[0].tipo?.replace(/_/g, ' ')}
                  </p>
                  <p className="text-blue-700 font-medium text-sm mt-1">
                    {formatearFechaHora(citasFuturas[0].fecha_hora)}
                  </p>
                  {citasFuturas[0].expand?.medico && (
                    <p className="text-xs text-gray-500 mt-1">
                      Dr. {citasFuturas[0].expand.medico.nombre}{' '}
                      {citasFuturas[0].expand.medico.apellidos}
                    </p>
                  )}
                  {citasFuturas[0].consultorio && (
                    <p className="text-xs text-gray-400">
                      {citasFuturas[0].consultorio}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-2">
                  Sin citas próximas
                </p>
              )}
            </div>

            {/* Datos de contacto */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">📞 Contacto</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Teléfono</span>
                  <span className="text-gray-900 font-medium">{paciente.telefono || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Correo</span>
                  <span className="text-gray-900 font-medium text-xs">{paciente.email || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Registro</span>
                  <span className="text-gray-900 font-medium">{formatearFecha(paciente.created)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Antecedentes */}
      {tabActiva === 'Antecedentes' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Alergias y Reacciones</h3>
            {editandoAlergias ? (
              <div className="space-y-3">
                <textarea
                  value={alergiasTxt}
                  onChange={(e) => setAlergiasTxt(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Penicilina, Látex, Cacahuates..."
                />
                <div className="flex gap-2">
                  <button onClick={handleGuardarAlergias} disabled={guardando}
                    className="px-4 py-2 bg-blue-700 text-white rounded-lg text-sm hover:bg-blue-800 disabled:opacity-60">
                    {guardando ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button onClick={() => setEditandoAlergias(false)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {paciente.alergias ? (
                  <div className={`p-3 rounded-lg text-sm ${paciente.alergias_criticas ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}>
                    {paciente.alergias_criticas && <p className="font-bold mb-1">⚠ CRÍTICAS</p>}
                    {paciente.alergias}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Sin alergias registradas</p>
                )}
                <button
                  onClick={() => { setAlergiasTxt(paciente.alergias || ''); setEditandoAlergias(true) }}
                  className="mt-3 text-xs text-blue-600 hover:underline"
                >
                  ✏ Editar alergias
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Información General</h3>
            <div className="space-y-3 text-sm">
              <Dato label="Nombre completo" valor={`${paciente.nombre} ${paciente.apellidos}`} />
              <Dato label="CURP" valor={paciente.curp} mono />
              <Dato label="Fecha de nacimiento" valor={formatearFecha(paciente.fecha_nacimiento)} />
              <Dato label="Edad" valor={`${calcularEdad(paciente.fecha_nacimiento)} años`} />
              <Dato label="Sexo" valor={paciente.sexo} capitalizar />
              <Dato label="Grupo sanguíneo" valor={paciente.grupo_sanguineo} />
            </div>
          </div>
        </div>
      )}

      {/* TAB: Historial Médico */}
      {tabActiva === 'Historial Médico' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Todos los diagnósticos registrados</h3>
          {diagnosticos.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-3">📋</p>
              <p>Sin diagnósticos registrados</p>
              <button
                onClick={() => navigate(`/consulta/nueva?paciente=${id}`)}
                className="mt-4 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm hover:bg-blue-800"
              >
                Iniciar primera consulta
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-xs text-gray-400 uppercase">
                  <th className="text-left px-4 py-3 font-medium">Código CIE-10</th>
                  <th className="text-left px-4 py-3 font-medium">Diagnóstico</th>
                  <th className="text-left px-4 py-3 font-medium">Tipo</th>
                  <th className="text-left px-4 py-3 font-medium">Estado</th>
                  <th className="text-left px-4 py-3 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {diagnosticos.map((dx) => (
                  <tr key={dx.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-blue-700 font-medium">{dx.codigo_cie10}</td>
                    <td className="px-4 py-3 text-gray-900">{dx.descripcion}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        dx.tipo === 'principal' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {dx.tipo === 'principal' ? 'Principal' : 'Secundario'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        dx.estado === 'activo' ? 'bg-green-100 text-green-700' :
                        dx.estado === 'cronico' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {dx.estado === 'cronico' ? 'Crónico' : dx.estado === 'activo' ? 'Activo' : 'Resuelto'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatearFecha(dx.created)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB: Consultas Previas */}
      {tabActiva === 'Consultas Previas' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
              Historial de consultas ({consultas.length})
            </h3>
            <button
              onClick={() => navigate(`/consulta/nueva?paciente=${id}`)}
              className="px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800"
            >
              + Nueva Consulta
            </button>
          </div>
          {consultas.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-3">🩺</p>
              <p>Sin consultas previas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {consultas.map((c) => (
                <div key={c.id}
                  className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{c.motivo || 'Sin motivo registrado'}</p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {c.expand?.medico
                          ? `Dr. ${c.expand.medico.nombre} ${c.expand.medico.apellidos}`
                          : 'Médico no asignado'}
                        {' · '}{formatearFechaHora(c.fecha)}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      c.estado === 'completada'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {c.estado === 'completada' ? 'Completada' : 'Borrador'}
                    </span>
                  </div>
                  {c.plan_tratamiento && (
                    <p className="text-sm text-gray-500 mt-2 border-t border-gray-100 pt-2">
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

// ── Componentes auxiliares ────────────────────────────────────────────────────

function SignoVital({ label, valor, unidad }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900">
        {valor} <span className="text-xs text-gray-400 font-normal">{unidad}</span>
      </span>
    </div>
  )
}

function Dato({ label, valor, mono, capitalizar }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className={`text-gray-900 font-medium ${mono ? 'font-mono text-xs' : ''} ${capitalizar ? 'capitalize' : ''}`}>
        {valor || '—'}
      </span>
    </div>
  )
}