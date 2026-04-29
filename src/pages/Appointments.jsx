import { useState, useMemo } from 'react'
import { useColeccion } from '../hooks/usePocketBase'
import { useAuth } from '../context/AuthContext'
import pb from '../lib/pb'

// ── Helpers ───────────────────────────────────────────────────────────────────

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]

const COLORES_ESTADO = {
  programada:  'bg-blue-100 text-blue-700 border-blue-200',
  confirmada:  'bg-green-100 text-green-700 border-green-200',
  en_sala:     'bg-yellow-100 text-yellow-700 border-yellow-200',
  en_consulta: 'bg-purple-100 text-purple-700 border-purple-200',
  completada:  'bg-gray-100 text-gray-500 border-gray-200',
  cancelada:   'bg-red-100 text-red-600 border-red-200',
}

const ETIQUETAS_ESTADO = {
  programada:  'Programada',
  confirmada:  'Confirmada',
  en_sala:     'En sala',
  en_consulta: 'En consulta',
  completada:  'Completada',
  cancelada:   'Cancelada',
}

const TIPOS_CITA = [
  { valor: 'consulta_general', etiqueta: 'Consulta General' },
  { valor: 'seguimiento',      etiqueta: 'Seguimiento' },
  { valor: 'urgencia',         etiqueta: 'Urgencia' },
  { valor: 'revision',         etiqueta: 'Revisión' },
  { valor: 'chequeo',          etiqueta: 'Chequeo de Rutina' },
]

function formatearHora(fechaISO) {
  if (!fechaISO) return '—'
  return new Date(fechaISO).toLocaleTimeString('es-MX', {
    hour: '2-digit', minute: '2-digit',
  })
}

// Devuelve los días del mes con offset del primer día de la semana
function obtenerDiasDelMes(anio, mes) {
  const primerDia = new Date(anio, mes, 1).getDay()
  const totalDias = new Date(anio, mes + 1, 0).getDate()
  const celdas = []
  for (let i = 0; i < primerDia; i++) celdas.push(null)
  for (let d = 1; d <= totalDias; d++) celdas.push(d)
  return celdas
}

// ── Componente principal ───────────────────────────────────────────────────────

export default function Appointments() {
  const { usuario } = useAuth()
  const hoy = new Date()

  const [mesActual, setMesActual] = useState(hoy.getMonth())
  const [anioActual, setAnioActual] = useState(hoy.getFullYear())
  const [diaSeleccionado, setDiaSeleccionado] = useState(hoy.getDate())
  const [modalAbierto, setModalAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorForm, setErrorForm] = useState('')

  const [form, setForm] = useState({
    paciente: '',
    medico: usuario?.id || '',
    fecha_hora: '',
    tipo: 'consulta_general',
    estado: 'programada',
    consultorio: '',
    notas: '',
  })

  // Rango del mes completo para el filtro
  const inicioMes = `${anioActual}-${String(mesActual + 1).padStart(2, '0')}-01 00:00:00`
  const ultimoDia = new Date(anioActual, mesActual + 1, 0).getDate()
  const finMes = `${anioActual}-${String(mesActual + 1).padStart(2, '0')}-${ultimoDia} 23:59:59`

  const { datos: citasMes, recargar } = useColeccion('citas', {
    filtro: `fecha_hora >= "${inicioMes}" && fecha_hora <= "${finMes}"`,
    orden: 'fecha_hora',
    expandir: 'paciente,medico',
  })

  const { datos: pacientes } = useColeccion('pacientes', {
    filtro: 'activo = true',
    orden: 'nombre',
  })

  const { datos: medicos } = useColeccion('usuarios', {
    filtro: 'rol = "medico" && activo = true',
    orden: 'nombre',
  })

  // Días que tienen citas (para marcar en el calendario)
  const diasConCitas = useMemo(() => {
    const set = new Set()
    citasMes.forEach((c) => {
      if (c.fecha_hora) set.add(new Date(c.fecha_hora).getDate())
    })
    return set
  }, [citasMes])

  // Citas del día seleccionado
  const citasDia = useMemo(() => {
    return citasMes.filter((c) => {
      if (!c.fecha_hora) return false
      const d = new Date(c.fecha_hora)
      return d.getDate() === diaSeleccionado &&
             d.getMonth() === mesActual &&
             d.getFullYear() === anioActual
    })
  }, [citasMes, diaSeleccionado, mesActual, anioActual])

  const diasCalendario = obtenerDiasDelMes(anioActual, mesActual)

  const mesAnterior = () => {
    if (mesActual === 0) { setMesActual(11); setAnioActual(a => a - 1) }
    else setMesActual(m => m - 1)
    setDiaSeleccionado(1)
  }

  const mesSiguiente = () => {
    if (mesActual === 11) { setMesActual(0); setAnioActual(a => a + 1) }
    else setMesActual(m => m + 1)
    setDiaSeleccionado(1)
  }

  const irAHoy = () => {
    setMesActual(hoy.getMonth())
    setAnioActual(hoy.getFullYear())
    setDiaSeleccionado(hoy.getDate())
  }

const handleGuardar = async () => {
  if (!form.paciente || !form.fecha_hora) {
    setErrorForm('El paciente y la fecha/hora son obligatorios.')
    return
  }
  setGuardando(true)
  setErrorForm('')
  try {
    // Convertir fecha al formato que PocketBase espera: "YYYY-MM-DD HH:MM:SS"
    const fechaFormateada = new Date(form.fecha_hora)
      .toISOString()
      .replace('T', ' ')
      .slice(0, 19)

    await pb.collection('citas').create({
      paciente: form.paciente,
      medico: form.medico || usuario?.id,
      fecha_hora: fechaFormateada,
      tipo: form.tipo,
      estado: form.estado,
      consultorio: form.consultorio,
      notas: form.notas,
    })

    setModalAbierto(false)
    setForm({
      paciente: '', medico: usuario?.id || '',
      fecha_hora: '', tipo: 'consulta_general',
      estado: 'programada', consultorio: '', notas: '',
    })
    recargar()
  } catch (err) {
    // Mostrar error detallado para diagnóstico
    console.error('Error completo:', err)
    console.error('Data del error:', err.data)
    setErrorForm('Error al guardar: ' + (err.data?.message || err.message))
  } finally {
    setGuardando(false)
  }
}

  const cambiarEstado = async (citaId, nuevoEstado) => {
    try {
      await pb.collection('citas').update(citaId, { estado: nuevoEstado })
      recargar()
    } catch (err) {
      console.error('Error al cambiar estado:', err)
    }
  }

  const esHoy = (dia) =>
    dia === hoy.getDate() &&
    mesActual === hoy.getMonth() &&
    anioActual === hoy.getFullYear()

  return (
    <div className="p-6 flex gap-6">

      {/* ── Columna izquierda: calendario ── */}
      <div className="flex-1 min-w-0">

        {/* Encabezado del mes */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <button onClick={mesAnterior}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">‹</button>
            <h2 className="text-xl font-bold text-gray-900 min-w-48 text-center">
              {MESES[mesActual]} {anioActual}
            </h2>
            <button onClick={mesSiguiente}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">›</button>
            <button onClick={irAHoy}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 ml-2">
              Hoy
            </button>
          </div>
          <button
            onClick={() => setModalAbierto(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
          >
            + Nueva Cita
          </button>
        </div>

        {/* Cuadrícula del calendario */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Días de la semana */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DIAS.map((d) => (
              <div key={d} className="py-3 text-center text-xs font-medium text-gray-400 uppercase">
                {d}
              </div>
            ))}
          </div>

          {/* Celdas */}
          <div className="grid grid-cols-7">
            {diasCalendario.map((dia, idx) => {
              if (!dia) return <div key={`vacio-${idx}`} className="h-20 border-b border-r border-gray-50" />

              const seleccionado = dia === diaSeleccionado
              const tieneCitas = diasConCitas.has(dia)
              const citasDelDia = citasMes.filter((c) => {
                if (!c.fecha_hora) return false
                const d = new Date(c.fecha_hora)
                return d.getDate() === dia
              })

              return (
                <button
                  key={dia}
                  onClick={() => setDiaSeleccionado(dia)}
                  className={`h-20 border-b border-r border-gray-50 p-2 text-left transition-colors hover:bg-blue-50 relative
                    ${seleccionado ? 'bg-blue-50 ring-2 ring-inset ring-blue-400' : ''}
                  `}
                >
                  {/* Número del día */}
                  <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                    ${esHoy(dia) ? 'bg-blue-700 text-white' : seleccionado ? 'text-blue-700' : 'text-gray-700'}
                  `}>
                    {dia}
                  </span>

                  {/* Citas del día (máximo 2 visibles) */}
                  <div className="mt-1 space-y-0.5">
                    {citasDelDia.slice(0, 2).map((c) => (
                      <div key={c.id}
                        className={`text-xs px-1 py-0.5 rounded truncate border ${COLORES_ESTADO[c.estado] || 'bg-gray-100'}`}>
                        {formatearHora(c.fecha_hora)} {ETIQUETAS_ESTADO[c.estado] || ''}
                      </div>
                    ))}
                    {citasDelDia.length > 2 && (
                      <div className="text-xs text-gray-400 px-1">
                        +{citasDelDia.length - 2} más
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Leyenda de estados */}
        <div className="flex items-center gap-4 mt-3 px-1">
          {Object.entries(ETIQUETAS_ESTADO).map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className={`w-2.5 h-2.5 rounded-full border ${COLORES_ESTADO[key]}`} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Columna derecha: agenda del día ── */}
      <div className="w-80 flex-shrink-0 flex flex-col gap-4">

        {/* Encabezado agenda */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
              Agenda — {diaSeleccionado} de {MESES[mesActual]}
            </h3>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
              {citasDia.length} cita{citasDia.length !== 1 ? 's' : ''}
            </span>
          </div>

          {citasDia.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-3xl mb-2">📅</p>
              <p className="text-sm">Sin citas este día</p>
              <button
                onClick={() => setModalAbierto(true)}
                className="mt-3 text-xs text-blue-600 hover:underline"
              >
                + Agregar cita
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {citasDia
                .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora))
                .map((cita) => {
                  const paciente = cita.expand?.paciente
                  const nombrePaciente = paciente
                    ? `${paciente.nombre} ${paciente.apellidos}`
                    : 'Paciente'
                  return (
                    <div key={cita.id}
                      className={`border-l-4 rounded-r-lg p-3 ${
                        cita.estado === 'confirmada' ? 'border-green-400 bg-green-50' :
                        cita.estado === 'cancelada' ? 'border-red-300 bg-red-50' :
                        cita.estado === 'completada' ? 'border-gray-300 bg-gray-50' :
                        'border-blue-400 bg-blue-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {nombrePaciente}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {formatearHora(cita.fecha_hora)} ·{' '}
                            {TIPOS_CITA.find(t => t.valor === cita.tipo)?.etiqueta || cita.tipo}
                          </p>
                          {cita.consultorio && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              Consultorio: {cita.consultorio}
                            </p>
                          )}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${COLORES_ESTADO[cita.estado]}`}>
                          {ETIQUETAS_ESTADO[cita.estado]}
                        </span>
                      </div>

                      {/* Botones de acción según estado */}
                      {cita.estado !== 'completada' && cita.estado !== 'cancelada' && (
                        <div className="flex gap-2 mt-2">
                          {cita.estado === 'programada' && (
                            <button
                              onClick={() => cambiarEstado(cita.id, 'confirmada')}
                              className="text-xs text-green-700 hover:underline"
                            >
                              Confirmar
                            </button>
                          )}
                          {(cita.estado === 'confirmada' || cita.estado === 'programada') && (
                            <button
                              onClick={() => cambiarEstado(cita.id, 'en_sala')}
                              className="text-xs text-yellow-700 hover:underline"
                            >
                              Llegó a sala
                            </button>
                          )}
                          {cita.estado === 'en_sala' && (
                            <button
                              onClick={() => cambiarEstado(cita.id, 'en_consulta')}
                              className="text-xs text-purple-700 font-medium hover:underline"
                            >
                              Iniciar consulta
                            </button>
                          )}
                          <button
                            onClick={() => cambiarEstado(cita.id, 'cancelada')}
                            className="text-xs text-red-500 hover:underline ml-auto"
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          )}
        </div>

        {/* Mini calendario del mes siguiente */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">
              {MESES[mesActual === 11 ? 0 : mesActual + 1]}{' '}
              {mesActual === 11 ? anioActual + 1 : anioActual}
            </h4>
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center">
            {DIAS.map((d) => (
              <div key={d} className="text-xs text-gray-300 pb-1">{d[0]}</div>
            ))}
            {obtenerDiasDelMes(
              mesActual === 11 ? anioActual + 1 : anioActual,
              mesActual === 11 ? 0 : mesActual + 1
            ).map((dia, idx) => (
              <div key={idx}
                className={`text-xs rounded py-0.5 ${dia ? 'text-gray-500 hover:bg-gray-100 cursor-pointer' : ''}`}>
                {dia || ''}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Modal: Nueva Cita ── */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Nueva Cita</h2>
              <button
                onClick={() => { setModalAbierto(false); setErrorForm('') }}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >✕</button>
            </div>

            <div className="p-6 space-y-4">

              {/* Paciente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paciente *
                </label>
                <select
                  value={form.paciente}
                  onChange={(e) => setForm({ ...form, paciente: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Seleccionar paciente...</option>
                  {pacientes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} {p.apellidos}
                    </option>
                  ))}
                </select>
              </div>

              {/* Médico */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Médico asignado
                </label>
                <select
                  value={form.medico}
                  onChange={(e) => setForm({ ...form, medico: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Sin asignar</option>
                  {medicos.map((m) => (
                    <option key={m.id} value={m.id}>
                      Dr. {m.nombre} {m.apellidos}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fecha y hora */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha y hora *
                </label>
                <input
                  type="datetime-local"
                  value={form.fecha_hora}
                  onChange={(e) => setForm({ ...form, fecha_hora: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de consulta
                </label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {TIPOS_CITA.map((t) => (
                    <option key={t.valor} value={t.valor}>{t.etiqueta}</option>
                  ))}
                </select>
              </div>

              {/* Consultorio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Consultorio
                </label>
                <input
                  type="text"
                  value={form.consultorio}
                  onChange={(e) => setForm({ ...form, consultorio: e.target.value })}
                  placeholder="Ej: Consultorio 1, Sala A..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas adicionales
                </label>
                <textarea
                  value={form.notas}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                  rows={2}
                  placeholder="Indicaciones previas, motivo de la cita..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

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
                {guardando ? 'Guardando...' : 'Guardar Cita'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}