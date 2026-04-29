import { useAuth } from '../context/AuthContext'
import { useColeccion } from '../hooks/usePocketBase'
import pb from '../lib/pb'

// Saludo según la hora del día
function obtenerSaludo() {
  const hora = new Date().getHours()
  if (hora < 12) return 'Buenos días'
  if (hora < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

// Formatea la hora de una fecha ISO
function formatearHora(fechaISO) {
  if (!fechaISO) return '—'
  return new Date(fechaISO).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Formatea fecha completa
function formatearFecha(fechaISO) {
  if (!fechaISO) return '—'
  return new Date(fechaISO).toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Colores por estado de la cita
const coloresEstado = {
  programada:   'bg-blue-100 text-blue-700',
  confirmada:   'bg-green-100 text-green-700',
  en_sala:      'bg-yellow-100 text-yellow-700',
  en_consulta:  'bg-purple-100 text-purple-700',
  completada:   'bg-gray-100 text-gray-600',
  cancelada:    'bg-red-100 text-red-600',
}

const etiquetasEstado = {
  programada:   'Programada',
  confirmada:   'Confirmada',
  en_sala:      'En sala',
  en_consulta:  'En consulta',
  completada:   'Completada',
  cancelada:    'Cancelada',
}

const etiquetasTipo = {
  consulta_general: 'Consulta General',
  seguimiento:      'Seguimiento',
  urgencia:         'Urgencia',
  revision:         'Revisión',
  chequeo:          'Chequeo de Rutina',
}

export default function Dashboard() {
  const { usuario } = useAuth()

  // Fecha de hoy en formato que PocketBase entiende para filtrar
  const hoy = new Date()
  const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
    .toISOString()
    .replace('T', ' ')
    .slice(0, 19)
  const finDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59)
    .toISOString()
    .replace('T', ' ')
    .slice(0, 19)

  // Datos reales de PocketBase
  const { datos: todosLosPacientes } = useColeccion('pacientes', {
    filtro: 'activo = true',
  })

  const { datos: citasHoy } = useColeccion('citas', {
    filtro: `fecha_hora >= "${inicioDia}" && fecha_hora <= "${finDia}"`,
    orden: 'fecha_hora',
    expandir: 'paciente,medico',
  })

  const { datos: informesPendientes } = useColeccion('consultas', {
    filtro: 'estado = "borrador"',
  })

  const { datos: todasLasCitas } = useColeccion('citas', {
    filtro: 'estado != "cancelada"',
  })

  // Calcular diagnósticos frecuentes desde consultas reales
  const { datos: diagnosticos } = useColeccion('diagnosticos', {
    porPagina: 500,
  })

  const diagnosticosFrecuentes = (() => {
    const conteo = {}
    diagnosticos.forEach((d) => {
      const clave = d.descripcion
      conteo[clave] = (conteo[clave] || 0) + 1
    })
    return Object.entries(conteo)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([nombre, cantidad]) => ({
        nombre,
        porcentaje: Math.round((cantidad / Math.max(diagnosticos.length, 1)) * 100),
      }))
  })()

  const citasPendientes = todasLasCitas.filter(
    (c) => c.estado === 'programada' || c.estado === 'confirmada'
  ).length

  const nombreMedico = usuario
    ? `${usuario.nombre} ${usuario.apellidos}`
    : 'Doctor'

  return (
    <div className="p-6 space-y-6">

      {/* Encabezado */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {obtenerSaludo()}, Dr. {usuario?.nombre}
          </h1>
          <p className="text-gray-500 mt-1 capitalize">
            Aquí está su resumen clínico para hoy, {formatearFecha(new Date().toISOString())}
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            📅 Nueva Cita
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors">
            👤 Registrar Paciente
          </button>
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-3 gap-4">
        <TarjetaStat
          icono="👥"
          etiqueta="TOTAL DE PACIENTES"
          valor={todosLosPacientes.length}
          badge="+4% esta semana"
          badgeColor="text-green-600"
        />
        <TarjetaStat
          icono="📅"
          etiqueta="CITAS HOY"
          valor={citasHoy.length}
          badge={`${citasPendientes} restantes`}
          badgeColor="text-blue-600"
        />
        <TarjetaStat
          icono="📋"
          etiqueta="INFORMES PENDIENTES"
          valor={informesPendientes.length}
          badge={informesPendientes.length > 0 ? `${informesPendientes.length} Urgentes` : 'Al día'}
          badgeColor={informesPendientes.length > 0 ? 'text-red-600' : 'text-green-600'}
        />
      </div>

      {/* Citas de hoy + panel derecho */}
      <div className="grid grid-cols-3 gap-4">

        {/* Tabla de citas */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Citas de Hoy</h2>
            <button className="text-sm text-blue-600 hover:underline">Ver Agenda →</button>
          </div>

          {citasHoy.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p className="text-4xl mb-3">📅</p>
              <p className="font-medium">Sin citas programadas para hoy</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
                  <th className="text-left pb-3 font-medium">Nombre del Paciente</th>
                  <th className="text-left pb-3 font-medium">Hora</th>
                  <th className="text-left pb-3 font-medium">Tipo</th>
                  <th className="text-left pb-3 font-medium">Estado</th>
                  <th className="text-left pb-3 font-medium">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {citasHoy.map((cita) => {
                  const paciente = cita.expand?.paciente
                  const nombrePaciente = paciente
                    ? `${paciente.nombre} ${paciente.apellidos}`
                    : 'Paciente no encontrado'
                  return (
                    <tr key={cita.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                            {paciente
                              ? `${paciente.nombre?.[0]}${paciente.apellidos?.[0]}`
                              : '?'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{nombrePaciente}</p>
                            <p className="text-gray-400 text-xs">ID: #{cita.id.slice(-6).toUpperCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-gray-700">{formatearHora(cita.fecha_hora)}</td>
                      <td className="py-3 text-gray-700">
                        {etiquetasTipo[cita.tipo] || cita.tipo}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${coloresEstado[cita.estado] || 'bg-gray-100 text-gray-600'}`}>
                          {etiquetasEstado[cita.estado] || cita.estado}
                        </span>
                      </td>
                      <td className="py-3">
                        <button className="text-sm font-medium text-blue-600 hover:underline">
                          {cita.estado === 'en_sala' || cita.estado === 'confirmada'
                            ? 'Iniciar Visita'
                            : 'Ver Historial'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Panel derecho */}
        <div className="flex flex-col gap-4">

          {/* Diagnósticos frecuentes */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 flex-1">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Diagnósticos Frecuentes</h2>
            {diagnosticosFrecuentes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                Sin datos aún. Se mostrarán conforme se registren consultas.
              </p>
            ) : (
              <div className="space-y-3">
                {diagnosticosFrecuentes.map((dx, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 font-medium">{dx.nombre}</span>
                      <span className="text-gray-500">{dx.porcentaje}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{ width: `${dx.porcentaje}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Alertas críticas */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-red-600 mb-3">⚠ Alertas Críticas</h2>
            {informesPendientes.length === 0 ? (
              <p className="text-sm text-gray-400">Sin alertas activas.</p>
            ) : (
              <div className="space-y-2">
                {informesPendientes.slice(0, 3).map((inf) => (
                  <div key={inf.id} className="flex gap-2 text-sm">
                    <span className="text-red-500 mt-0.5">●</span>
                    <div>
                      <p className="font-medium text-gray-800">Consulta sin completar</p>
                      <p className="text-gray-400 text-xs">
                        Motivo: {inf.motivo || 'Sin descripción'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

// Componente reutilizable de tarjeta de estadística
function TarjetaStat({ icono, etiqueta, valor, badge, badgeColor }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icono}</span>
        <span className={`text-xs font-medium ${badgeColor}`}>{badge}</span>
      </div>
      <p className="text-xs text-gray-400 uppercase font-medium tracking-wide mb-1">
        {etiqueta}
      </p>
      <p className="text-4xl font-bold text-gray-900">{valor}</p>
    </div>
  )
}