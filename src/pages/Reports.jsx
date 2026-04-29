import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { useColeccion } from '../hooks/usePocketBase'

const COLORES = ['#1d4ed8','#0891b2','#059669','#d97706','#dc2626','#7c3aed','#db2777','#65a30d']

function formatearFecha(fechaISO) {
  if (!fechaISO) return '—'
  return new Date(fechaISO).toLocaleString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function Reports() {

  // Cargar todos los datos necesarios
  const { datos: pacientes }    = useColeccion('pacientes',    { filtro: 'activo = true', porPagina: 500 })
  const { datos: consultas }    = useColeccion('consultas',    { filtro: 'estado = "completada"', porPagina: 500, expandir: 'medico,paciente' })
  const { datos: diagnosticos } = useColeccion('diagnosticos', { porPagina: 500 })
  const { datos: citas }        = useColeccion('citas',        { porPagina: 500 })

  // ── Estadísticas generales ──────────────────────────────────────────────────

  const totalAtenciones = consultas.length
  const totalPacientes  = pacientes.length

  const tiempoPromedioMin = 18 // Placeholder — se calcularía con timestamps reales

  const citasCompletadas = citas.filter(c => c.estado === 'completada').length
  const ocupacion = citas.length > 0
    ? Math.round((citasCompletadas / citas.length) * 100)
    : 0

  // ── Top 10 diagnósticos CIE-10 ──────────────────────────────────────────────

  const topDiagnosticos = useMemo(() => {
    const conteo = {}
    diagnosticos.forEach((d) => {
      const clave = `${d.codigo_cie10} — ${d.descripcion}`
      conteo[clave] = (conteo[clave] || 0) + 1
    })
    return Object.entries(conteo)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([nombre, casos]) => ({ nombre, casos }))
  }, [diagnosticos])

  // ── Pirámide poblacional ────────────────────────────────────────────────────

  const piramide = useMemo(() => {
    const grupos = [
      { rango: '0-19',  min: 0,  max: 19  },
      { rango: '20-39', min: 20, max: 39  },
      { rango: '40-59', min: 40, max: 59  },
      { rango: '60-79', min: 60, max: 79  },
      { rango: '80+',   min: 80, max: 999 },
    ]
    const hoy = new Date()
    return grupos.map(({ rango, min, max }) => {
      let hombres = 0, mujeres = 0
      pacientes.forEach((p) => {
        if (!p.fecha_nacimiento) return
        const edad = hoy.getFullYear() - new Date(p.fecha_nacimiento).getFullYear()
        if (edad < min || edad > max) return
        if (p.sexo === 'masculino') hombres++
        else if (p.sexo === 'femenino') mujeres++
      })
      return { rango, hombres: -hombres, mujeres }
    })
  }, [pacientes])

  // Estadísticas de pirámide
  const edadMedia = useMemo(() => {
    const hoy = new Date()
    const edades = pacientes
      .filter(p => p.fecha_nacimiento)
      .map(p => hoy.getFullYear() - new Date(p.fecha_nacimiento).getFullYear())
    if (edades.length === 0) return 0
    return Math.round(edades.reduce((a, b) => a + b, 0) / edades.length)
  }, [pacientes])

  const ratioFM = useMemo(() => {
    const f = pacientes.filter(p => p.sexo === 'femenino').length
    const m = pacientes.filter(p => p.sexo === 'masculino').length
    if (m === 0) return '—'
    return (f / m).toFixed(1) + ' : 1'
  }, [pacientes])

  // ── Consultas por especialidad ──────────────────────────────────────────────

  const consultasPorEspecialidad = useMemo(() => {
    const conteo = {}
    consultas.forEach((c) => {
      const esp = c.expand?.medico?.especialidad || 'General'
      conteo[esp] = (conteo[esp] || 0) + 1
    })
    return Object.entries(conteo).map(([name, value]) => ({ name, value }))
  }, [consultas])

  // ── Actividad reciente ──────────────────────────────────────────────────────

  const actividadReciente = useMemo(() => {
    return [...consultas]
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      .slice(0, 8)
  }, [consultas])

  return (
    <div className="p-6 space-y-5">

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes y Estadísticas</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Monitoreo global de la actividad clínica y demográfica
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            Diario
          </button>
          <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            Semanal
          </button>
          <button className="px-3 py-1.5 bg-blue-700 text-white rounded-lg text-sm font-medium">
            Mensual
          </button>
          <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            Anual
          </button>
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-4 gap-4">
        <TarjetaStat
          icono="🏥"
          label="Total Atenciones"
          valor={totalAtenciones}
          badge="+12%"
          badgeColor="text-green-600"
        />
        <TarjetaStat
          icono="👥"
          label="Total Pacientes"
          valor={totalPacientes}
          badge="+5.2%"
          badgeColor="text-green-600"
        />
        <TarjetaStat
          icono="⏱"
          label="Tiempo Prom. Consulta"
          valor={`${tiempoPromedioMin}m`}
          badge="-2.1%"
          badgeColor="text-red-500"
        />
        <TarjetaStat
          icono="📅"
          label="Ocupación de Citas"
          valor={`${ocupacion}%`}
          badge={`Meta: 90%`}
          badgeColor={ocupacion >= 90 ? 'text-green-600' : 'text-yellow-600'}
        />
      </div>

      {/* Gráficas principales */}
      <div className="grid grid-cols-2 gap-5">

        {/* Top 10 diagnósticos */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900">Top Diagnósticos (CIE-10)</h2>
              <p className="text-xs text-gray-400 mt-0.5">Frecuencia por código diagnóstico principal</p>
            </div>
          </div>

          {topDiagnosticos.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400">
              <div className="text-center">
                <p className="text-3xl mb-2">📊</p>
                <p className="text-sm">Sin datos aún</p>
                <p className="text-xs mt-1">Se mostrarán conforme se registren consultas</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {topDiagnosticos.map((dx, i) => {
                const max = topDiagnosticos[0].casos
                const pct = Math.round((dx.casos / max) * 100)
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-4 text-right flex-shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs text-gray-700 truncate pr-2">{dx.nombre}</span>
                        <span className="text-xs font-medium text-gray-900 flex-shrink-0">
                          {dx.casos} caso{dx.casos !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: COLORES[i % COLORES.length]
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Pirámide poblacional */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="mb-4">
            <h2 className="font-semibold text-gray-900">Pirámide Poblacional</h2>
            <p className="text-xs text-gray-400 mt-0.5">Distribución por edad y sexo</p>
          </div>

          {pacientes.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400">
              <div className="text-center">
                <p className="text-3xl mb-2">👥</p>
                <p className="text-sm">Sin pacientes registrados</p>
              </div>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={piramide}
                  layout="vertical"
                  margin={{ top: 0, right: 20, left: 30, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => Math.abs(v)}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis
                    dataKey="rango"
                    type="category"
                    tick={{ fontSize: 11 }}
                    width={35}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      Math.abs(value),
                      name === 'hombres' ? 'Hombres' : 'Mujeres'
                    ]}
                  />
                  <Bar dataKey="hombres" fill="#1d4ed8" name="hombres" radius={[0, 3, 3, 0]} />
                  <Bar dataKey="mujeres" fill="#db2777" name="mujeres" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>

              <div className="flex items-center justify-center gap-6 mt-2 mb-3">
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className="w-3 h-3 rounded-sm bg-blue-700 inline-block" />
                  Hombres
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className="w-3 h-3 rounded-sm bg-pink-600 inline-block" />
                  Mujeres
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-3">
                <div className="text-center">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Edad Media</p>
                  <p className="text-xl font-bold text-gray-900 mt-0.5">{edadMedia} años</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Ratio F:M</p>
                  <p className="text-xl font-bold text-gray-900 mt-0.5">{ratioFM}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Distribución por especialidad */}
      {consultasPorEspecialidad.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Consultas por Especialidad</h2>
          <div className="flex items-center gap-8">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie
                  data={consultasPorEspecialidad}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {consultasPorEspecialidad.map((_, i) => (
                    <Cell key={i} fill={COLORES[i % COLORES.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v} consultas`]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {consultasPorEspecialidad.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORES[i % COLORES.length] }}
                  />
                  <span className="text-sm text-gray-700 flex-1">{item.name}</span>
                  <span className="text-sm font-medium text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Actividad reciente */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">
            Actividad de Consultas Recientes
          </h2>
        </div>

        {actividadReciente.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-3xl mb-2">🩺</p>
            <p className="text-sm">Sin consultas registradas aún</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100">
              <tr className="text-xs text-gray-400 uppercase">
                <th className="text-left pb-3 font-medium">Fecha / Hora</th>
                <th className="text-left pb-3 font-medium">Paciente</th>
                <th className="text-left pb-3 font-medium">Especialidad</th>
                <th className="text-left pb-3 font-medium">Médico</th>
                <th className="text-left pb-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {actividadReciente.map((c) => {
                const paciente = c.expand?.paciente
                const medico   = c.expand?.medico
                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 text-gray-600">
                      {formatearFecha(c.fecha)}
                    </td>
                    <td className="py-3 font-medium text-gray-900">
                      {paciente
                        ? `${paciente.nombre} ${paciente.apellidos}`
                        : '—'}
                    </td>
                    <td className="py-3 text-gray-600">
                      {medico?.especialidad || 'Medicina General'}
                    </td>
                    <td className="py-3 text-gray-600">
                      {medico ? `Dr. ${medico.nombre} ${medico.apellidos}` : '—'}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        c.estado === 'completada'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {c.estado === 'completada' ? 'Completada' : 'Borrador'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

    </div>
  )
}

// Tarjeta de estadística
function TarjetaStat({ icono, label, valor, badge, badgeColor }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icono}</span>
        <span className={`text-xs font-medium ${badgeColor}`}>{badge}</span>
      </div>
      <p className="text-xs text-gray-400 uppercase font-medium tracking-wide mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{valor}</p>
    </div>
  )
}