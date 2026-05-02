import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useRegistro, useColeccion } from '../hooks/usePocketBase'
import { useAuth } from '../context/AuthContext'
import { jsPDF } from 'jspdf'
import pb from '../lib/pb'

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
  { codigo: 'Z73.0', desc: 'Estrés laboral' },
  { codigo: 'Z73.1', desc: 'Privación del sueño' },
  { codigo: 'Z73.3', desc: 'Estrés no clasificado en otra parte' },
  { codigo: 'F10.1', desc: 'Trastornos mentales por alcohol (uso nocivo)' },
  { codigo: 'E66.0', desc: 'Obesidad por exceso de calorías' },
  { codigo: 'E78.5', desc: 'Hiperlipidemia no especificada' },
  { codigo: 'J45.9', desc: 'Asma no especificada' },
  { codigo: 'K58.9', desc: 'Síndrome del intestino irritable' },
  { codigo: 'M79.3', desc: 'Paniculitis' },
  { codigo: 'N18.9', desc: 'Enfermedad renal crónica no especificada' },
]

const MEDICAMENTOS_COMUNES = [
  { nombre: 'Paracetamol',     dosis: '500mg',   via: 'oral',     frecuencia: 'Cada 8 horas' },
  { nombre: 'Ibuprofeno',      dosis: '400mg',   via: 'oral',     frecuencia: 'Cada 8 horas' },
  { nombre: 'Amoxicilina',     dosis: '500mg',   via: 'oral',     frecuencia: 'Cada 8 horas' },
  { nombre: 'Azitromicina',    dosis: '500mg',   via: 'oral',     frecuencia: 'Una vez al día' },
  { nombre: 'Metformina',      dosis: '850mg',   via: 'oral',     frecuencia: 'Con cada comida' },
  { nombre: 'Losartán',        dosis: '50mg',    via: 'oral',     frecuencia: 'Una vez al día' },
  { nombre: 'Atorvastatina',   dosis: '20mg',    via: 'oral',     frecuencia: 'Una vez al día (noche)' },
  { nombre: 'Omeprazol',       dosis: '20mg',    via: 'oral',     frecuencia: 'En ayunas' },
  { nombre: 'Metronidazol',    dosis: '500mg',   via: 'oral',     frecuencia: 'Cada 8 horas' },
  { nombre: 'Ciprofloxacino',  dosis: '500mg',   via: 'oral',     frecuencia: 'Cada 12 horas' },
  { nombre: 'Diclofenaco',     dosis: '50mg',    via: 'oral',     frecuencia: 'Cada 8 horas' },
  { nombre: 'Loratadina',      dosis: '10mg',    via: 'oral',     frecuencia: 'Una vez al día' },
  { nombre: 'Salbutamol',      dosis: '100mcg',  via: 'inhalada', frecuencia: 'Según necesidad' },
  { nombre: 'Prednisona',      dosis: '5mg',     via: 'oral',     frecuencia: 'Una vez al día' },
  { nombre: 'Metoclopramida',  dosis: '10mg',    via: 'oral',     frecuencia: 'Antes de comidas' },
  { nombre: 'Ranitidina',      dosis: '150mg',   via: 'oral',     frecuencia: 'Cada 12 horas' },
  { nombre: 'Clonazepam',      dosis: '0.5mg',   via: 'oral',     frecuencia: 'En la noche' },
  { nombre: 'Levotiroxina',    dosis: '50mcg',   via: 'oral',     frecuencia: 'En ayunas' },
  { nombre: 'Amlodipino',      dosis: '5mg',     via: 'oral',     frecuencia: 'Una vez al día' },
  { nombre: 'Tramadol',        dosis: '50mg',    via: 'oral',     frecuencia: 'Cada 8 horas' },
]

function buscarCIE10(termino) {
  if (!termino || termino.length < 2) return []
  const t = termino.toLowerCase()
  return CIE10_COMUNES.filter(
    (c) => c.codigo.toLowerCase().includes(t) || c.desc.toLowerCase().includes(t)
  ).slice(0, 6)
}

function buscarMedicamento(termino) {
  if (!termino || termino.length < 2) return []
  const t = termino.toLowerCase()
  return MEDICAMENTOS_COMUNES.filter(m =>
    m.nombre.toLowerCase().includes(t)
  ).slice(0, 6)
}

export default function NewConsultation() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { usuario } = useAuth()
  const pacienteId = searchParams.get('paciente')

  const { dato: paciente } = useRegistro('pacientes', pacienteId)

  // ── Estados del formulario ───────────────────────────────────────────────────
  const [motivo, setMotivo] = useState('')
  const [exploracion, setExploracion] = useState('')
  const [planTratamiento, setPlanTratamiento] = useState('')

  const [signosVitales, setSignosVitales] = useState({
    presion_arterial: '', temperatura: '', peso: '',
    talla: '', frecuencia_cardiaca: '', saturacion_o2: '',
  })

  // Diagnósticos
  const [diagnosticos, setDiagnosticos] = useState([])
  const [busquedaCIE, setBusquedaCIE] = useState('')
  const [resultadosCIE, setResultadosCIE] = useState([])
  const [mostrarResultados, setMostrarResultados] = useState(false)

  // Medicamentos
  const [medicamentos, setMedicamentos] = useState([])
  const [busquedaMed, setBusquedaMed] = useState('')
  const [resultadosMed, setResultadosMed] = useState([])
  const [mostrarMed, setMostrarMed] = useState(false)
  const [generandoPDF, setGenerandoPDF] = useState(false)

  // Control general
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  // IMC calculado automáticamente
  const imc = (() => {
    const p = parseFloat(signosVitales.peso)
    const t = parseFloat(signosVitales.talla)
    if (p > 0 && t > 0) return (p / ((t / 100) ** 2)).toFixed(1)
    return null
  })()

  // ── Efectos de búsqueda ──────────────────────────────────────────────────────
  useEffect(() => {
    const resultados = buscarCIE10(busquedaCIE)
    setResultadosCIE(resultados)
    setMostrarResultados(resultados.length > 0 && busquedaCIE.length >= 2)
  }, [busquedaCIE])

  useEffect(() => {
    const resultados = buscarMedicamento(busquedaMed)
    setResultadosMed(resultados)
    setMostrarMed(resultados.length > 0 && busquedaMed.length >= 2)
  }, [busquedaMed])

  // ── Diagnósticos ─────────────────────────────────────────────────────────────
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

  // ── Medicamentos ─────────────────────────────────────────────────────────────
  const agregarMedicamento = (med) => {
    if (medicamentos.find((m) => m.nombre === med.nombre)) return
    setMedicamentos([...medicamentos, { ...med, duracion: '', indicaciones: '' }])
    setBusquedaMed('')
    setMostrarMed(false)
  }

  const quitarMedicamento = (nombre) => {
    setMedicamentos(medicamentos.filter((m) => m.nombre !== nombre))
  }

  const actualizarMedicamento = (nombre, campo, valor) => {
    setMedicamentos(medicamentos.map((m) =>
      m.nombre === nombre ? { ...m, [campo]: valor } : m
    ))
  }

  const generarRecetaPDF = async (consultaId, planTexto) => {
  if (!paciente || !usuario) return
  setGenerandoPDF(true)

  try {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const ancho = doc.internal.pageSize.getWidth()

    const configConsultorio = JSON.parse(
      localStorage.getItem('config_consultorio') || '{}'
    )
    const nombreConsultorio = configConsultorio.nombre || 'ClinicalCore EHR'
    const direccion         = configConsultorio.direccion || ''
    const telConsultorio    = configConsultorio.telefono || ''

    // Encabezado azul
    doc.setFillColor(23, 96, 165)
    doc.rect(0, 0, ancho, 38, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(nombreConsultorio, 14, 14)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Dr. ${usuario.nombre} ${usuario.apellidos}  |  ${usuario.especialidad || 'Médico General'}`,
      14, 22
    )
    if (usuario.cedula_profesional) {
      doc.text(`Cédula: ${usuario.cedula_profesional}`, 14, 28)
    }
    if (direccion || telConsultorio) {
      doc.text(
        `${direccion}${telConsultorio ? '  |  Tel: ' + telConsultorio : ''}`,
        14, 34
      )
    }

    doc.setTextColor(200, 225, 255)
    doc.setFontSize(8)
    const fechaHoy = new Date().toLocaleDateString('es-MX', {
      day: '2-digit', month: 'long', year: 'numeric'
    })
    doc.text(`Fecha: ${fechaHoy}`, ancho - 14, 22, { align: 'right' })
    doc.text(
      `ID: #${consultaId?.slice(-6).toUpperCase() || 'N/A'}`,
      ancho - 14, 28, { align: 'right' }
    )

    // Datos del paciente
    let y = 48
    doc.setTextColor(30, 30, 30)
    doc.setFillColor(240, 245, 255)
    doc.roundedRect(10, y, ancho - 20, 28, 3, 3, 'F')

    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(23, 96, 165)
    doc.text('DATOS DEL PACIENTE', 14, y + 7)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 30, 30)
    doc.setFontSize(9)
    doc.text(`Nombre: ${paciente.nombre} ${paciente.apellidos}`, 14, y + 14)
    doc.text(`CURP: ${paciente.curp || '—'}`, 14, y + 20)

    const edad = (() => {
      if (!paciente.fecha_nacimiento) return '—'
      const hoy = new Date()
      const nac = new Date(paciente.fecha_nacimiento)
      return hoy.getFullYear() - nac.getFullYear() + ' años'
    })()

    doc.text(`Edad: ${edad}`, ancho / 2, y + 14)
    doc.text(`Grupo sanguíneo: ${paciente.grupo_sanguineo || '—'}`, ancho / 2, y + 20)

    if (paciente.alergias_criticas && paciente.alergias) {
      doc.setFillColor(254, 235, 235)
      doc.roundedRect(10, y + 24, ancho - 20, 10, 2, 2, 'F')
      doc.setTextColor(180, 30, 30)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.text(
        `ALERGIAS CRITICAS: ${paciente.alergias.toUpperCase()}`,
        14, y + 31
      )
      y += 10
    }

    // Diagnóstico
    y += 34
    doc.setTextColor(23, 96, 165)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('DIAGNOSTICO', 14, y)
    doc.setDrawColor(23, 96, 165)
    doc.setLineWidth(0.3)
    doc.line(14, y + 1, ancho - 14, y + 1)

    y += 6
    doc.setTextColor(30, 30, 30)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)

    if (diagnosticos.length === 0) {
      doc.text('Sin diagnostico registrado', 14, y)
      y += 6
    } else {
      diagnosticos.forEach((dx) => {
        doc.setFont('helvetica', 'bold')
        doc.text(`${dx.codigo}  `, 14, y)
        doc.setFont('helvetica', 'normal')
        doc.text(dx.desc, 32, y)
        y += 6
      })
    }

    // Medicamentos
    y += 4
    doc.setTextColor(23, 96, 165)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('MEDICAMENTOS PRESCRITOS', 14, y)
    doc.setDrawColor(23, 96, 165)
    doc.line(14, y + 1, ancho - 14, y + 1)
    y += 8

    if (medicamentos.length === 0) {
      doc.setTextColor(100, 100, 100)
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(9)
      doc.text('Sin medicamentos prescritos en esta consulta.', 14, y)
      y += 8
    } else {
      medicamentos.forEach((med, i) => {
        if (i % 2 === 0) {
          doc.setFillColor(248, 250, 255)
          doc.rect(10, y - 4, ancho - 20, 22, 'F')
        }
        doc.setTextColor(30, 30, 30)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.text(`${i + 1}. ${med.nombre}`, 14, y)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(60, 60, 60)
        doc.text(
          `Dosis: ${med.dosis}   Via: ${med.via}   Frecuencia: ${med.frecuencia}`,
          18, y + 6
        )
        if (med.duracion) {
          doc.text(`Duracion: ${med.duracion}`, 18, y + 12)
        }
        if (med.indicaciones) {
          doc.setTextColor(100, 100, 100)
          doc.setFontSize(8)
          const lineas = doc.splitTextToSize(
            `Indicaciones: ${med.indicaciones}`, ancho - 36
          )
          doc.text(lineas, 18, y + 17)
          y += lineas.length * 4
        }
        y += 26
      })
    }

    // ── Plan y tratamiento — usa el parámetro, no el estado ──────────────────
    if (planTexto && planTexto.trim()) {
      y += 2
      doc.setTextColor(23, 96, 165)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('INDICACIONES GENERALES', 14, y)
      doc.setDrawColor(23, 96, 165)
      doc.line(14, y + 1, ancho - 14, y + 1)
      y += 6
      doc.setTextColor(30, 30, 30)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      const lineasPlan = doc.splitTextToSize(planTexto.trim(), ancho - 28)
      doc.text(lineasPlan, 14, y)
      y += lineasPlan.length * 5 + 4
    }

    // Firma del médico
    const alturaPagina = doc.internal.pageSize.getHeight()
    const yFirma = Math.max(y + 20, alturaPagina - 45)

    doc.setDrawColor(180, 180, 180)
    doc.setLineWidth(0.3)
    doc.line(ancho / 2 - 40, yFirma, ancho / 2 + 40, yFirma)

    doc.setTextColor(30, 30, 30)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(
      `Dr. ${usuario.nombre} ${usuario.apellidos}`,
      ancho / 2, yFirma + 5, { align: 'center' }
    )
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(80, 80, 80)
    doc.text(
      usuario.especialidad || 'Medico General',
      ancho / 2, yFirma + 10, { align: 'center' }
    )
    if (usuario.cedula_profesional) {
      doc.text(
        `Cedula: ${usuario.cedula_profesional}`,
        ancho / 2, yFirma + 15, { align: 'center' }
      )
    }

    // Pie de página
    doc.setFillColor(23, 96, 165)
    doc.rect(0, alturaPagina - 12, ancho, 12, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(
      'Documento generado por ClinicalCore EHR - Valido solo con firma del medico',
      ancho / 2, alturaPagina - 5, { align: 'center' }
    )

    const nombreArchivo = `Receta_${paciente.apellidos}_${
      new Date().toLocaleDateString('es-MX').replace(/\//g, '-')
    }.pdf`
    doc.save(nombreArchivo)

    // Guardar receta en PocketBase
    if (consultaId) {
      await pb.collection('recetas').create({
        consulta:     consultaId,
        paciente:     pacienteId,
        medico:       usuario.id,
        medicamentos: JSON.stringify(medicamentos),
        indicaciones: planTexto,
      })
    }

  } catch (err) {
    console.error('Error generando PDF:', err)
    setError('Error al generar el PDF: ' + err.message)
  } finally {
    setGenerandoPDF(false)
  }
}

  // ── Guardar consulta ─────────────────────────────────────────────────────────
const handleGuardar = async (estadoFinal = 'completada') => {
  if (!motivo.trim()) {
    setError('El motivo de la consulta es obligatorio.')
    return
  }
  if (!pacienteId) {
    setError('No se especificó un paciente.')
    return
  }

  // Bloquear múltiples envíos
  if (guardando) return
  setGuardando(true)
  setError('')

  try {
    const fechaHoy = new Date().toISOString().replace('T', ' ').slice(0, 19)

    // Capturar el texto del plan ANTES de cualquier await
    const planTextoFinal = planTratamiento.trim()

    const consulta = await pb.collection('consultas').create({
      paciente:           pacienteId,
      medico:             usuario?.id,
      fecha:              fechaHoy,
      motivo:             motivo.trim(),
      exploracion_fisica: exploracion.trim(),
      plan_tratamiento:   planTextoFinal,
      estado:             estadoFinal,
      signos_vitales:     JSON.stringify(signosVitales),
    })

    for (const dx of diagnosticos) {
      await pb.collection('diagnosticos').create({
        consulta:     consulta.id,
        codigo_cie10: dx.codigo,
        descripcion:  dx.desc,
        tipo:         dx.tipo,
        estado:       dx.estado,
      })
    }

    // Generar PDF pasando el texto directamente como parámetro
    if (medicamentos.length > 0 && estadoFinal === 'completada') {
      await generarRecetaPDF(consulta.id, planTextoFinal)
    }

    // Redirigir siempre al terminar, con o sin PDF
    navigate(`/pacientes/${pacienteId}`)

  } catch (err) {
    console.error('Error al guardar consulta:', err)
    setError('Error al guardar: ' + (err.data?.message || err.message))
    setGuardando(false)
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

        {/* Motivo */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
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
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            📈 Registro de Signos Vitales
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <CampoSigno label="Presión Arterial"   unidad="mmHg" placeholder="120/80"
              valor={signosVitales.presion_arterial}
              onChange={(v) => setSignosVitales({ ...signosVitales, presion_arterial: v })} />
            <CampoSigno label="Temperatura"         unidad="°C"   placeholder="36.5" tipo="number"
              valor={signosVitales.temperatura}
              onChange={(v) => setSignosVitales({ ...signosVitales, temperatura: v })} />
            <CampoSigno label="Frecuencia Cardíaca" unidad="lpm"  placeholder="72"   tipo="number"
              valor={signosVitales.frecuencia_cardiaca}
              onChange={(v) => setSignosVitales({ ...signosVitales, frecuencia_cardiaca: v })} />
            <CampoSigno label="Peso"       unidad="kg" placeholder="70"  tipo="number"
              valor={signosVitales.peso}
              onChange={(v) => setSignosVitales({ ...signosVitales, peso: v })} />
            <CampoSigno label="Talla"      unidad="cm" placeholder="170" tipo="number"
              valor={signosVitales.talla}
              onChange={(v) => setSignosVitales({ ...signosVitales, talla: v })} />
            <CampoSigno label="Saturación O₂" unidad="%" placeholder="98" tipo="number"
              valor={signosVitales.saturacion_o2}
              onChange={(v) => setSignosVitales({ ...signosVitales, saturacion_o2: v })} />
          </div>
          {imc && (
            <div className="mt-3 flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
              <span className="text-sm text-blue-700 font-medium">IMC calculado:</span>
              <span className="text-sm font-bold text-blue-900">{imc} kg/m²</span>
              <span className="text-xs text-blue-600 ml-1">
                {imc < 18.5 ? '— Bajo peso' :
                 imc < 25   ? '— Peso normal ✓' :
                 imc < 30   ? '— Sobrepeso' : '— Obesidad'}
              </span>
            </div>
          )}
        </div>

        {/* Exploración física */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            🔬 Exploración Física
          </h2>
          <textarea
            value={exploracion}
            onChange={(e) => setExploracion(e.target.value)}
            placeholder="Registre los hallazgos del examen físico..."
            rows={5}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Diagnóstico CIE-10 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            🔍 Diagnóstico (CIE-10)
          </h2>
          <div className="relative mb-3">
            <input
              type="text"
              value={busquedaCIE}
              onChange={(e) => setBusquedaCIE(e.target.value)}
              placeholder="Buscar por nombre o código CIE-10 (ej. J00, Hipertensión)..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pl-9"
            />
            <span className="absolute left-3 top-3 text-gray-400 text-sm">🔍</span>
            {mostrarResultados && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1 overflow-hidden">
                {resultadosCIE.map((item) => (
                  <button key={item.codigo} onClick={() => agregarDiagnostico(item)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0">
                    <span className="font-mono text-blue-700 font-medium text-sm mr-2">{item.codigo}</span>
                    <span className="text-gray-700 text-sm">{item.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {diagnosticos.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-lg">
              Busca y selecciona los diagnósticos para esta consulta
            </p>
          ) : (
            <div className="space-y-2">
              {diagnosticos.map((dx) => (
                <div key={dx.codigo}
                  className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
                  <span className="font-mono text-blue-700 font-bold text-sm min-w-16">{dx.codigo}</span>
                  <span className="text-gray-800 text-sm flex-1">{dx.desc}</span>
                  <select value={dx.tipo}
                    onChange={(e) => cambiarEstadoDx(dx.codigo, 'tipo', e.target.value)}
                    className="text-xs border border-blue-200 rounded px-2 py-1 bg-white text-gray-600">
                    <option value="principal">Principal</option>
                    <option value="secundario">Secundario</option>
                  </select>
                  <select value={dx.estado}
                    onChange={(e) => cambiarEstadoDx(dx.codigo, 'estado', e.target.value)}
                    className="text-xs border border-blue-200 rounded px-2 py-1 bg-white text-gray-600">
                    <option value="activo">Activo</option>
                    <option value="cronico">Crónico</option>
                    <option value="resuelto">Resuelto</option>
                  </select>
                  <button onClick={() => quitarDiagnostico(dx.codigo)}
                    className="text-gray-400 hover:text-red-500 transition-colors ml-1">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Medicamentos prescritos */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            💊 Medicamentos Prescritos
          </h2>
          <div className="relative mb-3">
            <input
              type="text"
              value={busquedaMed}
              onChange={(e) => setBusquedaMed(e.target.value)}
              placeholder="Buscar medicamento (ej. Paracetamol, Amoxicilina)..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pl-9"
            />
            <span className="absolute left-3 top-3 text-gray-400 text-sm">💊</span>
            {mostrarMed && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1 overflow-hidden">
                {resultadosMed.map((med) => (
                  <button key={med.nombre} onClick={() => agregarMedicamento(med)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0">
                    <span className="font-medium text-gray-800 text-sm">{med.nombre}</span>
                    <span className="text-gray-400 text-xs ml-2">
                      {med.dosis} · {med.via} · {med.frecuencia}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {medicamentos.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-lg">
              Busca y selecciona los medicamentos a prescribir
            </p>
          ) : (
            <div className="space-y-3">
              {medicamentos.map((med) => (
                <div key={med.nombre} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{med.nombre}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{med.dosis} · vía {med.via}</p>
                    </div>
                    <button onClick={() => quitarMedicamento(med.nombre)}
                      className="text-gray-300 hover:text-red-500 transition-colors text-lg leading-none">✕</button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Frecuencia</label>
                      <input type="text" value={med.frecuencia}
                        onChange={(e) => actualizarMedicamento(med.nombre, 'frecuencia', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Duración</label>
                      <input type="text" value={med.duracion}
                        onChange={(e) => actualizarMedicamento(med.nombre, 'duracion', e.target.value)}
                        placeholder="Ej: 7 días, 2 semanas..."
                        className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <label className="block text-xs text-gray-500 mb-1">Indicaciones especiales</label>
                    <input type="text" value={med.indicaciones}
                      onChange={(e) => actualizarMedicamento(med.nombre, 'indicaciones', e.target.value)}
                      placeholder="Ej: Tomar con alimentos, evitar alcohol..."
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {medicamentos.length > 0 && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => generarRecetaPDF(null)}
                disabled={generandoPDF}
                className="flex items-center gap-2 px-4 py-2 border border-blue-200 text-blue-700 rounded-lg text-sm hover:bg-blue-50 transition-colors disabled:opacity-60"
              >
                {generandoPDF ? '⏳ Generando...' : '📄 Vista previa de receta PDF'}
              </button>
            </div>
          )}
        </div>

        {/* Plan y tratamiento */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
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

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Barra inferior */}
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="w-2 h-2 bg-green-400 rounded-full inline-block" />
            Los cambios se guardarán al finalizar
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate(`/pacientes/${pacienteId}`)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Descartar consulta
            </button>
            <button onClick={() => handleGuardar('borrador')} disabled={guardando}
              className="px-4 py-2 border border-blue-200 text-blue-700 rounded-lg text-sm hover:bg-blue-50 disabled:opacity-60">
              Guardar borrador
            </button>
            <button onClick={() => handleGuardar('completada')} disabled={guardando}
              className="px-5 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-60">
              {guardando ? 'Guardando...' : 'Enviar y Finalizar Registro'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Panel lateral ── */}
      <div className="w-72 flex-shrink-0 space-y-4">

        {/* Datos del paciente */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          {paciente ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold">
                  {paciente.nombre?.[0]}{paciente.apellidos?.[0]}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{paciente.nombre} {paciente.apellidos}</p>
                  <p className="text-xs text-gray-500">
                    ID: #{paciente.id.slice(-6).toUpperCase()} ·{' '}
                    {paciente.sexo === 'masculino' ? 'Masculino' :
                     paciente.sexo === 'femenino'  ? 'Femenino'  : '—'}
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

        {/* Resumen de la consulta */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Resumen de esta consulta</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Diagnósticos</span>
              <span className="font-medium text-gray-900">{diagnosticos.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Medicamentos</span>
              <span className="font-medium text-gray-900">{medicamentos.length}</span>
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

// ── Componente de signo vital ─────────────────────────────────────────────────
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