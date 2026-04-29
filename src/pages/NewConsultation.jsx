import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useRegistro, useColeccion } from '../hooks/usePocketBase'
import { useAuth } from '../context/AuthContext'
import pb from '../lib/pb'

// Catálogo CIE-10 básico — los más frecuentes en consulta general
const CIE10_COMUNES = [
  { codigo: 'J00',   desc: 'Nasofaringitis aguda (resfriado común)' },
  { codigo: 'J06.9', desc: 'Infección aguda de las vías respiratorias superiores' },
  { codigo: 'J11',   desc: 'Influenza (gripe)' },
  { codigo: 'J18.9', desc: 'Neumonía no especificada' },
  { codigo: 'A09',   desc: 'Diarrea y gastroenteritis infecciosa' },
  { codigo: 'K30',   desc: 'Dispepsia (indigestión)' },
  { codigo: 'K21.0', desc: 'Enfermedad por reflujo gastroesofágico' },
  { codigo: 'I10',   desc: 'Hipertensión esencial (primaria)' },
  { codigo: 'E11.9', desc: 'Diabetes mellitus tipo 2 sin complicaciones' },
  { codigo: 'E11.0', desc: 'Diabetes mellitus tipo 2 con coma hiperosmolar' },
  { codigo: 'E03.9', desc: 'Hipotiroidismo no especificado' },
  { codigo: 'M54.5', desc: 'Lumbago (dolor lumbar)' },
  { codigo: 'M54.2', desc: 'Cervicalgia (dolor de cuello)' },
  { codigo: 'G43.9', desc: 'Migraña no especificada' },
  { codigo: 'R51',   desc: 'Cefalea (dolor de cabeza)' },
  { codigo: 'R05',   desc: 'Tos' },
  { codigo: 'R50.9', desc: 'Fiebre no especificada' },
  { codigo: 'N39.0', desc: 'Infección de vías urinarias' },
  { codigo: 'L30.9', desc: 'Dermatitis no especificada' },
  { codigo: 'F32.9', desc: 'Episodio depresivo no especificado' },
  { codigo: 'F41.1', desc: 'Trastorno de ansiedad generalizada' },
  { codigo: 'J30.1', desc: 'Rinitis alérgica' },
  { codigo: 'H10.9', desc: 'Conjuntivitis no especificada' },
  { codigo: 'B34.9', desc: 'Infección viral no especificada' },
  { codigo: 'Z00.0', desc: 'Examen médico general (chequeo)' },
]

function buscarCIE10(termino) {
  if (!termino || termino.length < 2) return []
  const t = termino.toLowerCase()
  return CIE10_COMUNES.filter(
    (c) => c.codigo.toLowerCase().includes(t) || c.desc.toLowerCase().includes(t)
  ).slice(0, 6)
}

export default function NewConsultation() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { usuario } = useAuth()
  const pacienteId = searchParams.get('paciente')

  // Datos del paciente
  const { dato: paciente } = useRegistro('pacientes', pacienteId)

  // Estados del formulario
  const [motivo, setMotivo] = useState('')
  const [exploracion, setExploracion] = useState('')
  const [planTratamiento, setPlanTratamiento] = useState('')

  // Signos vitales
  const [signosVitales, setSignosVitales] = useState({
    presion_arterial: '',
    temperatura: '',
    peso: '',
    talla: '',
    frecuencia_cardiaca: '',
    saturacion_o2: '',
  })

  // Diagnósticos seleccionados
  const [diagnosticos, setDiagnosticos] = useState([])
  const [busquedaCIE, setBusquedaCIE] = useState('')
  const [resultadosCIE, setResultadosCIE] = useState([])
  const [mostrarResultados, setMostrarResultados] = useState(false)

  // Control del formulario
  const [guardando, setGuardando] = useState(false)
  const [autoguardado, setAutoguardado] = useState('')
  const [error, setError] = useState('')

  // IMC calculado automáticamente
  const imc = (() => {
    const p = parseFloat(signosVitales.peso)
    const t = parseFloat(signosVitales.talla)
    if (p > 0 && t > 0) return (p / ((t / 100) ** 2)).toFixed(1)
    return null
  })()

  // Buscar CIE-10 en tiempo real
  useEffect(() => {
    const resultados = buscarCIE10(busquedaCIE)
    setResultadosCIE(resultados)
    setMostrarResultados(resultados.length > 0 && busquedaCIE.length >= 2)
  }, [busquedaCIE])

  const agregarDiagnostico = (item) => {
    if (diagnosticos.find((d) => d.codigo === item.codigo)) return
    setDiagnosticos([...diagnosticos, {
      ...item,
      tipo: diagnosticos.length === 0 ? 'principal' : 'secundario',
      estado: 'activo',
    }])
    setBusquedaCIE('')
    setMostrarResultados(false)
  }

  const quitarDiagnostico = (codigo) => {
    setDiagnosticos(diagnosticos.filter((d) => d.codigo !== codigo))
  }

  const cambiarEstadoDx = (codigo, campo, valor) => {
    setDiagnosticos(diagnosticos.map((d) =>
      d.codigo === codigo ? { ...d, [campo]: valor } : d
    ))
  }

  const handleGuardar = async (estadoFinal = 'completada') => {
    if (!motivo.trim()) {
      setError('El motivo de la consulta es obligatorio.')
      return
    }
    if (!pacienteId) {
      setError('No se especificó un paciente.')
      return
    }

    setGuardando(true)
    setError('')

    try {
      const fechaHoy = new Date().toISOString().replace('T', ' ').slice(0, 19)

      // 1. Crear la consulta
      const consulta = await pb.collection('consultas').create({
        paciente: pacienteId,
        medico: usuario?.id,
        fecha: fechaHoy,
        motivo: motivo.trim(),
        exploracion_fisica: exploracion.trim(),
        plan_tratamiento: planTratamiento.trim(),
        estado: estadoFinal,
        signos_vitales: JSON.stringify(signosVitales),
      })

      // 2. Guardar cada diagnóstico
      for (const dx of diagnosticos) {
        await pb.collection('diagnosticos').create({
          consulta: consulta.id,
          codigo_cie10: dx.codigo,
          descripcion: dx.desc,
          tipo: dx.tipo,
          estado: dx.estado,
        })
      }

      // 3. Redirigir al expediente del paciente
      navigate(`/pacientes/${pacienteId}`)

    } catch (err) {
      console.error('Error al guardar consulta:', err)
      setError('Error al guardar: ' + (err.data?.message || err.message))
    } finally {
      setGuardando(false)
    }
  }

  const handleAutoguardar = async () => {
    if (!motivo.trim() || !pacienteId) return
    try {
      setAutoguardado('Guardando borrador...')
      await handleGuardar('borrador')
    } catch {
      setAutoguardado('Error al autoguardar')
    }
  }

  if (!pacienteId) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">No se especificó un paciente.</p>
        <button onClick={() => navigate('/pacientes')}
          className="mt-4 text-blue-600 hover:underline text-sm">
          ← Ir a pacientes
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 flex gap-6">

      {/* ── Columna principal ── */}
      <div className="flex-1 min-w-0 space-y-5">

        {/* Encabezado */}
        <div className="flex items-center justify-between">
          <div>
            <button onClick={() => navigate(`/pacientes/${pacienteId}`)}
              className="text-sm text-gray-500 hover:text-gray-800 mb-1 flex items-center gap-1">
              ← Volver al expediente
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Registro de Consulta</h1>
            {paciente && (
              <p className="text-sm text-gray-500 mt-0.5">
                Sesión #{Math.random().toString(36).slice(2, 8).toUpperCase()} ·{' '}
                {new Date().toLocaleDateString('es-MX', {
                  day: '2-digit', month: 'long', year: 'numeric'
                })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleGuardar('borrador')}
              disabled={guardando}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-60"
            >
              Guardar borrador
            </button>
            <button
              onClick={() => handleGuardar('completada')}
              disabled={guardando}
              className="px-5 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-60"
            >
              {guardando ? 'Guardando...' : 'Enviar y Finalizar'}
            </button>
          </div>
        </div>

        {/* Motivo de la consulta */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
            💬 Motivo de la Consulta
          </h2>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Describa el motivo principal y la historia del paciente para esta visita..."
            rows={4}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Signos vitales */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
            📈 Registro de Signos Vitales
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <CampoSigno
              label="Presión Arterial"
              unidad="mmHg"
              placeholder="120/80"
              valor={signosVitales.presion_arterial}
              onChange={(v) => setSignosVitales({ ...signosVitales, presion_arterial: v })}
            />
            <CampoSigno
              label="Temperatura"
              unidad="°C"
              placeholder="36.5"
              tipo="number"
              valor={signosVitales.temperatura}
              onChange={(v) => setSignosVitales({ ...signosVitales, temperatura: v })}
            />
            <CampoSigno
              label="Frecuencia Cardíaca"
              unidad="lpm"
              placeholder="72"
              tipo="number"
              valor={signosVitales.frecuencia_cardiaca}
              onChange={(v) => setSignosVitales({ ...signosVitales, frecuencia_cardiaca: v })}
            />
            <CampoSigno
              label="Peso"
              unidad="kg"
              placeholder="70"
              tipo="number"
              valor={signosVitales.peso}
              onChange={(v) => setSignosVitales({ ...signosVitales, peso: v })}
            />
            <CampoSigno
              label="Talla"
              unidad="cm"
              placeholder="170"
              tipo="number"
              valor={signosVitales.talla}
              onChange={(v) => setSignosVitales({ ...signosVitales, talla: v })}
            />
            <CampoSigno
              label="Saturación O₂"
              unidad="%"
              placeholder="98"
              tipo="number"
              valor={signosVitales.saturacion_o2}
              onChange={(v) => setSignosVitales({ ...signosVitales, saturacion_o2: v })}
            />
          </div>
          {imc && (
            <div className="mt-3 flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
              <span className="text-sm text-blue-700 font-medium">IMC calculado:</span>
              <span className="text-sm font-bold text-blue-900">{imc} kg/m²</span>
              <span className="text-xs text-blue-600 ml-1">
                {imc < 18.5 ? '— Bajo peso' :
                 imc < 25 ? '— Peso normal ✓' :
                 imc < 30 ? '— Sobrepeso' : '— Obesidad'}
              </span>
            </div>
          )}
        </div>

        {/* Exploración física */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
            🔬 Exploración Física
          </h2>
          <textarea
            value={exploracion}
            onChange={(e) => setExploracion(e.target.value)}
            placeholder="Registre los hallazgos del examen físico (apariencia general, sistema respiratorio, cardiovascular, abdominal, neurológico, etc.)..."
            rows={5}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Diagnóstico CIE-10 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
            🔍 Diagnóstico (CIE-10)
          </h2>

          {/* Buscador */}
          <div className="relative mb-3">
            <input
              type="text"
              value={busquedaCIE}
              onChange={(e) => setBusquedaCIE(e.target.value)}
              placeholder="Buscar por nombre o código CIE-10 (ej. J00, Hipertensión)..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pl-9"
            />
            <span className="absolute left-3 top-3 text-gray-400 text-sm">🔍</span>

            {/* Resultados */}
            {mostrarResultados && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1 overflow-hidden">
                {resultadosCIE.map((item) => (
                  <button
                    key={item.codigo}
                    onClick={() => agregarDiagnostico(item)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
                  >
                    <span className="font-mono text-blue-700 font-medium text-sm mr-2">
                      {item.codigo}
                    </span>
                    <span className="text-gray-700 text-sm">{item.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Diagnósticos seleccionados */}
          {diagnosticos.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-lg">
              Busca y selecciona los diagnósticos para esta consulta
            </p>
          ) : (
            <div className="space-y-2">
              {diagnosticos.map((dx) => (
                <div key={dx.codigo}
                  className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
                  <span className="font-mono text-blue-700 font-bold text-sm min-w-16">
                    {dx.codigo}
                  </span>
                  <span className="text-gray-800 text-sm flex-1">{dx.desc}</span>

                  {/* Tipo */}
                  <select
                    value={dx.tipo}
                    onChange={(e) => cambiarEstadoDx(dx.codigo, 'tipo', e.target.value)}
                    className="text-xs border border-blue-200 rounded px-2 py-1 bg-white text-gray-600"
                  >
                    <option value="principal">Principal</option>
                    <option value="secundario">Secundario</option>
                  </select>

                  {/* Estado */}
                  <select
                    value={dx.estado}
                    onChange={(e) => cambiarEstadoDx(dx.codigo, 'estado', e.target.value)}
                    className="text-xs border border-blue-200 rounded px-2 py-1 bg-white text-gray-600"
                  >
                    <option value="activo">Activo</option>
                    <option value="cronico">Crónico</option>
                    <option value="resuelto">Resuelto</option>
                  </select>

                  <button
                    onClick={() => quitarDiagnostico(dx.codigo)}
                    className="text-gray-400 hover:text-red-500 transition-colors ml-1"
                  >✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Plan y tratamiento */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
            📋 Plan y Tratamiento
          </h2>
          <textarea
            value={planTratamiento}
            onChange={(e) => setPlanTratamiento(e.target.value)}
            placeholder="Ingrese las instrucciones de medicación, cambios en el estilo de vida, estudios solicitados y planes de seguimiento..."
            rows={5}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Barra inferior fija */}
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="w-2 h-2 bg-green-400 rounded-full inline-block"></span>
            {autoguardado || 'Los cambios se guardarán al finalizar'}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/pacientes/${pacienteId}`)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              Descartar consulta
            </button>
            <button
              onClick={() => handleGuardar('borrador')}
              disabled={guardando}
              className="px-4 py-2 border border-blue-200 text-blue-700 rounded-lg text-sm hover:bg-blue-50 disabled:opacity-60"
            >
              Guardar borrador
            </button>
            <button
              onClick={() => handleGuardar('completada')}
              disabled={guardando}
              className="px-5 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-60"
            >
              {guardando ? 'Guardando...' : 'Enviar y Finalizar Registro'}
            </button>
          </div>
        </div>

      </div>

      {/* ── Panel lateral: datos del paciente ── */}
      <div className="w-72 flex-shrink-0 space-y-4">

        {/* Tarjeta del paciente */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          {paciente ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold">
                  {paciente.nombre?.[0]}{paciente.apellidos?.[0]}
                </div>
                <div>
                  <p className="font-bold text-gray-900">
                    {paciente.nombre} {paciente.apellidos}
                  </p>
                  <p className="text-xs text-gray-500">
                    ID: #{paciente.id.slice(-6).toUpperCase()} · {paciente.sexo === 'masculino' ? 'Masculino' : paciente.sexo === 'femenino' ? 'Femenino' : '—'}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm border-t border-gray-100 pt-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Grupo sanguíneo</span>
                  <span className="font-medium text-gray-900">{paciente.grupo_sanguineo || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">CURP</span>
                  <span className="font-mono text-xs text-gray-700">{paciente.curp?.slice(0, 10)}...</span>
                </div>
              </div>

              {/* Alergias críticas */}
              {paciente.alergias_criticas && paciente.alergias && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs font-bold text-red-700 mb-1">⚠ ALERGIAS CRÍTICAS</p>
                  <p className="text-xs text-red-600">{paciente.alergias}</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4 text-gray-400">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs">Cargando paciente...</p>
            </div>
          )}
        </div>

        {/* Resumen de la consulta actual */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Resumen de esta consulta</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Diagnósticos</span>
              <span className="font-medium text-gray-900">{diagnosticos.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Signos vitales</span>
              <span className="font-medium text-gray-900">
                {Object.values(signosVitales).filter(Boolean).length} / 6
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Motivo</span>
              <span className={motivo ? 'text-green-600 font-medium' : 'text-gray-400'}>
                {motivo ? '✓ Listo' : 'Pendiente'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Plan</span>
              <span className={planTratamiento ? 'text-green-600 font-medium' : 'text-gray-400'}>
                {planTratamiento ? '✓ Listo' : 'Pendiente'}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

// Componente de campo de signo vital
function CampoSigno({ label, unidad, placeholder, valor, onChange, tipo = 'text' }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <label className="block text-xs text-gray-500 uppercase font-medium mb-1.5 tracking-wide">
        {label}
      </label>
      <div className="flex items-center gap-1.5">
        <input
          type={tipo}
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-lg font-semibold text-gray-900 focus:outline-none min-w-0 placeholder:text-gray-300 placeholder:font-normal placeholder:text-sm"
        />
        <span className="text-xs text-gray-400 flex-shrink-0">{unidad}</span>
      </div>
    </div>
  )
}