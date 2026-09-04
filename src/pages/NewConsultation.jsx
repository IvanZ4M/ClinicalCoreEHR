import { useState, useEffect, lazy, Suspense } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useRegistro } from '../hooks/usePocketBase'
import { useTriagePaciente } from '../hooks/useTriage'
import { useAuth } from '../context/AuthContext'
import { validators } from '../lib/validators'
import { formatearEdad } from '../lib/edad'
import { jsPDF } from 'jspdf'
import pb from '../lib/pb'
import { I } from '../components/icons'

const SeguimientoDrawer = lazy(() => import('../components/SeguimientoDrawer'))

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

// Los cuatro pasos siguen el orden real de una consulta médica, no el orden
// en que resultó cómodo escribir el formulario.
const PASOS = [
  { n: 1, titulo: 'Motivo y signos vitales', corto: 'Motivo' },
  { n: 2, titulo: 'Exploración y diagnóstico', corto: 'Diagnóstico' },
  { n: 3, titulo: 'Receta', corto: 'Receta' },
  { n: 4, titulo: 'Plan y revisión', corto: 'Revisión' },
]
const TOTAL_PASOS = PASOS.length

function buscarCIE10(termino) {
  if (!termino || termino.length < 2) return []
  const t = termino.toLowerCase()
  return CIE10_COMUNES.filter(
    c => c.codigo.toLowerCase().includes(t) || c.desc.toLowerCase().includes(t)
  ).slice(0, 6)
}

function buscarMedicamento(termino) {
  if (!termino || termino.length < 2) return []
  const t = termino.toLowerCase()
  return MEDICAMENTOS_COMUNES.filter(m => m.nombre.toLowerCase().includes(t)).slice(0, 6)
}

export default function NewConsultation() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { usuario } = useAuth()
  const pacienteId = searchParams.get('paciente')
  const citaId     = searchParams.get('cita')

  const { dato: paciente }                   = useRegistro('pacientes', pacienteId)
  const { triage, cargando: cargTriage }    = useTriagePaciente(pacienteId)

  const [motivo,         setMotivo]         = useState('')
  const [exploracion,    setExploracion]    = useState('')
  const [planTratamiento, setPlanTratamiento] = useState('')

  const [signosVitales, setSignosVitales] = useState({
    presion_arterial: '', temperatura: '', peso: '',
    talla: '', frecuencia_cardiaca: '', saturacion_o2: '',
  })

  const [diagnosticos,       setDiagnosticos]       = useState([])
  const [busquedaCIE,        setBusquedaCIE]        = useState('')
  const [resultadosCIE,      setResultadosCIE]      = useState([])
  const [mostrarResultados,  setMostrarResultados]  = useState(false)

  const [medicamentos,    setMedicamentos]    = useState([])
  const [busquedaMed,     setBusquedaMed]     = useState('')
  const [resultadosMed,   setResultadosMed]   = useState([])
  const [mostrarMed,      setMostrarMed]      = useState(false)
  const [generandoPDF,    setGenerandoPDF]    = useState(false)

  const [guardando,       setGuardando]       = useState(false)
  const [error,           setError]           = useState('')
  const [drawerAbierto,   setDrawerAbierto]   = useState(false)
  const [consultaGuardada, setConsultaGuardada] = useState(null)
  const [signosErrors,    setSignosErrors]    = useState({})
  const [signosTouched,   setSignosTouched]   = useState({})
  const [motivoTouched,   setMotivoTouched]   = useState(false)
  const [motivoError,     setMotivoError]     = useState(null)

  // ── Flujo por pasos ───────────────────────────────────────────────────────
  // La pantalla mostraba las seis secciones apiladas en un solo scroll: en
  // 1024x768 solo cabía el 45% del formulario y proyectada era ilegible.
  // Dividirla en cuatro pasos además refleja el orden real de la consulta:
  // el médico no llena un formulario, sigue el proceso clínico.
  const [paso, setPaso] = useState(1)

  const SIGNOS_RULES = {
    presion_arterial:    validators.presionArterial,
    temperatura:         validators.temperatura,
    frecuencia_cardiaca: validators.frecuenciaCardiaca,
    peso:                validators.peso,
    talla:               validators.talla,
    saturacion_o2:       validators.saturacionOxigeno,
  }

  const handleSignoChange = (field, value) => {
    setSignosVitales(sv => ({ ...sv, [field]: value }))
    if (signosTouched[field] && SIGNOS_RULES[field]) {
      setSignosErrors(e => ({ ...e, [field]: SIGNOS_RULES[field](value) }))
    }
  }

  const handleSignoBlur = (field) => {
    setSignosTouched(t => ({ ...t, [field]: true }))
    if (SIGNOS_RULES[field]) {
      setSignosErrors(e => ({ ...e, [field]: SIGNOS_RULES[field](signosVitales[field]) }))
    }
  }

  const imc = (() => {
    const p = parseFloat(signosVitales.peso)
    const t = parseFloat(signosVitales.talla)
    if (p > 0 && t > 0) return (p / ((t / 100) ** 2)).toFixed(1)
    return null
  })()

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

  // Pre-populate vitals from triage when it loads
  useEffect(() => {
    if (!triage) return
    setSignosVitales(sv => ({
      presion_arterial:   triage.presion_arterial                 || sv.presion_arterial,
      temperatura:        triage.temperatura?.toString()          || sv.temperatura,
      frecuencia_cardiaca: triage.frecuencia_cardiaca?.toString() || sv.frecuencia_cardiaca,
      peso:               triage.peso?.toString()                 || sv.peso,
      talla:              triage.talla?.toString()                || sv.talla,
      saturacion_o2:      triage.saturacion_oxigeno?.toString()   || sv.saturacion_o2,
    }))
    if (triage.queja_principal && !motivo) {
      setMotivo(triage.queja_principal)
    }
  }, [triage])

  const agregarDiagnostico = (item) => {
    if (diagnosticos.find(d => d.codigo === item.codigo)) return
    setDiagnosticos([...diagnosticos, {
      ...item,
      tipo: diagnosticos.length === 0 ? 'principal' : 'secundario',
      estado: 'activo',
    }])
    setBusquedaCIE('')
    setMostrarResultados(false)
  }

  const quitarDiagnostico = (codigo) => {
    setDiagnosticos(diagnosticos.filter(d => d.codigo !== codigo))
  }

  const cambiarEstadoDx = (codigo, campo, valor) => {
    setDiagnosticos(diagnosticos.map(d =>
      d.codigo === codigo ? { ...d, [campo]: valor } : d
    ))
  }

  const agregarMedicamento = (med) => {
    if (medicamentos.find(m => m.nombre === med.nombre)) return
    setMedicamentos([...medicamentos, { ...med, duracion: '', indicaciones: '' }])
    setBusquedaMed('')
    setMostrarMed(false)
  }

  const quitarMedicamento = (nombre) => {
    setMedicamentos(medicamentos.filter(m => m.nombre !== nombre))
  }

  const actualizarMedicamento = (nombre, campo, valor) => {
    setMedicamentos(medicamentos.map(m =>
      m.nombre === nombre ? { ...m, [campo]: valor } : m
    ))
  }

  const generarRecetaPDF = async (consultaId, planTexto) => {
    if (!paciente || !usuario) return
    setGenerandoPDF(true)
    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' })
      const ancho = doc.internal.pageSize.getWidth()
      const configConsultorio = JSON.parse(localStorage.getItem('config_consultorio') || '{}')
      const nombreConsultorio = configConsultorio.nombre || 'ClinicalCore EHR'
      const direccion         = configConsultorio.direccion || ''
      const telConsultorio    = configConsultorio.telefono || ''

      doc.setFillColor(23, 96, 165)
      doc.rect(0, 0, ancho, 38, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text(nombreConsultorio, 14, 14)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text(`Dr. ${usuario.nombre} ${usuario.apellidos}  |  ${usuario.especialidad || 'Médico General'}`, 14, 22)
      if (usuario.cedula_profesional) doc.text(`Cédula: ${usuario.cedula_profesional}`, 14, 28)
      if (direccion || telConsultorio) doc.text(`${direccion}${telConsultorio ? '  |  Tel: ' + telConsultorio : ''}`, 14, 34)
      doc.setTextColor(200, 225, 255)
      doc.setFontSize(8)
      const fechaHoy = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
      doc.text(`Fecha: ${fechaHoy}`, ancho - 14, 22, { align: 'right' })
      doc.text(`ID: #${consultaId?.slice(-6).toUpperCase() || 'N/A'}`, ancho - 14, 28, { align: 'right' })

      let y = 48
      doc.setTextColor(30, 30, 30)
      doc.setFillColor(240, 245, 255)
      doc.roundedRect(10, y, ancho - 20, 28, 3, 3, 'F')
      doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(23, 96, 165)
      doc.text('DATOS DEL PACIENTE', 14, y + 7)
      doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 30, 30); doc.setFontSize(9)
      doc.text(`Nombre: ${paciente.nombre} ${paciente.apellidos}`, 14, y + 14)
      doc.text(`CURP: ${paciente.curp || '—'}`, 14, y + 20)
      // Antes se restaban solo los años, sin comprobar si el cumpleaños ya pasó:
      // la receta impresa podía envejecer al paciente un año entero.
      doc.text(`Edad: ${formatearEdad(paciente.fecha_nacimiento)}`, ancho / 2, y + 14)
      doc.text(`Grupo sanguíneo: ${paciente.grupo_sanguineo || '—'}`, ancho / 2, y + 20)
      if (paciente.alergias_criticas && paciente.alergias) {
        doc.setFillColor(254, 235, 235)
        doc.roundedRect(10, y + 24, ancho - 20, 10, 2, 2, 'F')
        doc.setTextColor(180, 30, 30); doc.setFontSize(8); doc.setFont('helvetica', 'bold')
        doc.text(`ALERGIAS CRITICAS: ${paciente.alergias.toUpperCase()}`, 14, y + 31)
        y += 10
      }

      y += 34
      doc.setTextColor(23, 96, 165); doc.setFontSize(9); doc.setFont('helvetica', 'bold')
      doc.text('DIAGNOSTICO', 14, y)
      doc.setDrawColor(23, 96, 165); doc.setLineWidth(0.3); doc.line(14, y + 1, ancho - 14, y + 1)
      y += 6; doc.setTextColor(30, 30, 30); doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
      if (diagnosticos.length === 0) { doc.text('Sin diagnostico registrado', 14, y); y += 6 }
      else { diagnosticos.forEach(dx => { doc.setFont('helvetica', 'bold'); doc.text(`${dx.codigo}  `, 14, y); doc.setFont('helvetica', 'normal'); doc.text(dx.desc, 32, y); y += 6 }) }

      y += 4
      doc.setTextColor(23, 96, 165); doc.setFontSize(9); doc.setFont('helvetica', 'bold')
      doc.text('MEDICAMENTOS PRESCRITOS', 14, y)
      doc.setDrawColor(23, 96, 165); doc.line(14, y + 1, ancho - 14, y + 1); y += 8
      if (medicamentos.length === 0) {
        doc.setTextColor(100, 100, 100); doc.setFont('helvetica', 'italic'); doc.setFontSize(9)
        doc.text('Sin medicamentos prescritos en esta consulta.', 14, y); y += 8
      } else {
        medicamentos.forEach((med, i) => {
          if (i % 2 === 0) { doc.setFillColor(248, 250, 255); doc.rect(10, y - 4, ancho - 20, 22, 'F') }
          doc.setTextColor(30, 30, 30); doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
          doc.text(`${i + 1}. ${med.nombre}`, 14, y)
          doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(60, 60, 60)
          doc.text(`Dosis: ${med.dosis}   Via: ${med.via}   Frecuencia: ${med.frecuencia}`, 18, y + 6)
          if (med.duracion) doc.text(`Duracion: ${med.duracion}`, 18, y + 12)
          if (med.indicaciones) {
            doc.setTextColor(100, 100, 100); doc.setFontSize(8)
            const lineas = doc.splitTextToSize(`Indicaciones: ${med.indicaciones}`, ancho - 36)
            doc.text(lineas, 18, y + 17); y += lineas.length * 4
          }
          y += 26
        })
      }

      if (planTexto && planTexto.trim()) {
        y += 2; doc.setTextColor(23, 96, 165); doc.setFontSize(9); doc.setFont('helvetica', 'bold')
        doc.text('INDICACIONES GENERALES', 14, y)
        doc.setDrawColor(23, 96, 165); doc.line(14, y + 1, ancho - 14, y + 1); y += 6
        doc.setTextColor(30, 30, 30); doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
        const lineasPlan = doc.splitTextToSize(planTexto.trim(), ancho - 28)
        doc.text(lineasPlan, 14, y); y += lineasPlan.length * 5 + 4
      }

      const alturaPagina = doc.internal.pageSize.getHeight()
      const yFirma = Math.max(y + 20, alturaPagina - 45)
      doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.3)
      doc.line(ancho / 2 - 40, yFirma, ancho / 2 + 40, yFirma)
      doc.setTextColor(30, 30, 30); doc.setFontSize(9); doc.setFont('helvetica', 'bold')
      doc.text(`Dr. ${usuario.nombre} ${usuario.apellidos}`, ancho / 2, yFirma + 5, { align: 'center' })
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(80, 80, 80)
      doc.text(usuario.especialidad || 'Medico General', ancho / 2, yFirma + 10, { align: 'center' })
      if (usuario.cedula_profesional) doc.text(`Cedula: ${usuario.cedula_profesional}`, ancho / 2, yFirma + 15, { align: 'center' })
      doc.setFillColor(23, 96, 165); doc.rect(0, alturaPagina - 12, ancho, 12, 'F')
      doc.setTextColor(255, 255, 255); doc.setFontSize(7); doc.setFont('helvetica', 'normal')
      doc.text('Documento generado por ClinicalCore EHR - Valido solo con firma del medico', ancho / 2, alturaPagina - 5, { align: 'center' })

      // VULN-FIX (ÁREA 6): el nombre del archivo NO debe incluir datos del
      // paciente. Un nombre predecible (apellido + fecha) permite identificar
      // a quién pertenece una receta si el archivo queda expuesto en el sistema.
      // Se usa un identificador opaco: ID corto de la consulta + timestamp.
      const timestamp = Date.now()
      const idOpaco   = (consultaId || 'borrador').substring(0, 8)
      const nombreArchivo = `Receta_${idOpaco}_${timestamp}.pdf`
      doc.save(nombreArchivo)

      if (consultaId) {
        await pb.collection('recetas').create({
          consulta: consultaId, paciente: pacienteId, medico: usuario.id,
          medicamentos: JSON.stringify(medicamentos), indicaciones: planTexto,
        })
      }
    } catch (err) {
      console.error('Error generando PDF:', err)
      setError('Error al generar el PDF: ' + err.message)
    } finally { setGenerandoPDF(false) }
  }

  const handleGuardar = async (estadoFinal = 'completada') => {
    setMotivoTouched(true)
    const mErr = validators.motivoConsulta(motivo)
    setMotivoError(mErr)
    if (mErr) return
    if (!pacienteId) { setError('No se especificó un paciente.'); return }
    if (guardando) return
    // Validate clinical ranges for any vitals that were entered
    const newErrors = {}
    let hasRangeError = false
    for (const [field, validator] of Object.entries(SIGNOS_RULES)) {
      const err = validator(signosVitales[field])
      if (err) { newErrors[field] = err; hasRangeError = true }
    }
    if (hasRangeError) {
      setSignosErrors(newErrors)
      setSignosTouched(Object.keys(SIGNOS_RULES).reduce((a, k) => ({ ...a, [k]: true }), {}))
      setError('Corrige los valores de signos vitales fuera de rango antes de continuar.')
      return
    }
    setGuardando(true); setError('')
    try {
      const fechaHoy = new Date().toISOString().replace('T', ' ').slice(0, 19)
      const planTextoFinal = planTratamiento.trim()
      const consulta = await pb.collection('consultas').create({
        paciente: pacienteId, medico: usuario?.id, fecha: fechaHoy,
        motivo: motivo.trim(), exploracion_fisica: exploracion.trim(),
        plan_tratamiento: planTextoFinal, estado: estadoFinal,
        signos_vitales: JSON.stringify(signosVitales),
      })
      for (const dx of diagnosticos) {
        await pb.collection('diagnosticos').create({
          consulta: consulta.id, codigo_cie10: dx.codigo,
          descripcion: dx.desc, tipo: dx.tipo, estado: dx.estado,
        })
      }
      if (medicamentos.length > 0 && estadoFinal === 'completada') {
        await generarRecetaPDF(consulta.id, planTextoFinal)
      }
      if (estadoFinal === 'completada') {
        if (citaId) {
          try {
            await pb.collection('citas').update(citaId, { estado: 'completada' })
          } catch {
            toast.warning('Consulta guardada, pero no se pudo actualizar el estado de la cita.')
          }
        }
        setConsultaGuardada(consulta)
        setDrawerAbierto(true)
      } else {
        navigate(`/pacientes/${pacienteId}`)
      }
    } catch (err) {
      console.error('Error al guardar consulta:', err)
      setError('Error al guardar: ' + (err.data?.message || err.message))
      setGuardando(false)
    }
  }

  // Solo el paso 1 bloquea el avance: el motivo es obligatorio y los signos
  // vitales fuera de rango deben corregirse antes de seguir. El resto del
  // flujo es libre — un médico puede no prescribir nada, por ejemplo.
  const validarPaso1 = () => {
    const mErr = validators.motivoConsulta(motivo)
    setMotivoTouched(true)
    setMotivoError(mErr)

    const errs = {}
    let fueraDeRango = false
    for (const [campo, validar] of Object.entries(SIGNOS_RULES)) {
      const e = validar(signosVitales[campo])
      if (e) { errs[campo] = e; fueraDeRango = true }
    }
    if (fueraDeRango) {
      setSignosErrors(errs)
      setSignosTouched(Object.keys(SIGNOS_RULES).reduce((a, k) => ({ ...a, [k]: true }), {}))
      setError('Corrige los signos vitales fuera de rango antes de continuar.')
    }
    return !mErr && !fueraDeRango
  }

  const irAPaso = (n) => {
    setError('')
    if (paso === 1 && n > 1 && !validarPaso1()) return
    setPaso(Math.min(TOTAL_PASOS, Math.max(1, n)))
    // Al cambiar de paso el usuario debe ver el inicio del nuevo contenido.
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!pacienteId) {
    return (
      <div style={{ padding: '1.5rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-3)', fontSize: 'var(--fs-2)' }}>No se especificó un paciente.</p>
        <button onClick={() => navigate('/pacientes')}
          style={{ marginTop: '1rem', fontSize: 'var(--fs-2)', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <I.ArrowLeft width={13} height={13} /> Ir a pacientes
        </button>
      </div>
    )
  }

  const signosCompletos = Object.values(signosVitales).filter(Boolean).length

  // Marca visual de "este paso ya tiene contenido". No bloquea nada: sirve
  // para que el médico vea de un vistazo qué le falta.
  const pasosListos = {
    1: Boolean(motivo.trim()),
    2: diagnosticos.length > 0,
    3: medicamentos.length > 0,
    4: Boolean(planTratamiento.trim()),
  }

  return (
    <div style={{ padding: '1.5rem', display: 'flex', gap: '1.25rem' }} className="anim-fade">

      {/* ── Main column ────────────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <button onClick={() => navigate(`/pacientes/${pacienteId}`)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'var(--fs-2)', color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 4 }}>
              <I.ArrowLeft width={13} height={13} /> Volver al expediente
            </button>
            <h1 style={{ fontSize: 'var(--fs-5)', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
              Registro de Consulta
            </h1>
            {paciente && (
              <p style={{ fontSize: 'var(--fs-2)', color: 'var(--text-3)', marginTop: 2 }}>
                {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
          {/* La acción de finalizar vive ahora en el último paso: aquí solo
              queda guardar el borrador, disponible en cualquier momento. */}
          <button onClick={() => handleGuardar('borrador')} disabled={guardando} className="btn btn-outline" style={{ fontSize: 'var(--fs-2)' }}>
            Guardar borrador
          </button>
        </div>

        <Stepper paso={paso} onIr={irAPaso} listos={pasosListos} />

        {/* ══ PASO 1 — Motivo y signos vitales ══════════════════════ */}
        {paso === 1 && (<>

        {/* Motivo */}
        <Seccion icon={<I.Clipboard width={15} height={15} />} titulo="Motivo de la Consulta">
          <textarea
            value={motivo}
            onChange={e => { setMotivo(e.target.value); if (motivoTouched) setMotivoError(validators.motivoConsulta(e.target.value)) }}
            onBlur={() => { setMotivoTouched(true); setMotivoError(validators.motivoConsulta(motivo)) }}
            placeholder="Describa el motivo principal y la historia del paciente para esta visita..."
            rows={4}
            className={`input${motivoTouched && motivoError ? ' input-error' : ''}`}
            style={{ resize: 'none' }}
            aria-invalid={motivoTouched && motivoError ? 'true' : undefined}
          />
          {motivoTouched && motivoError && (
            <p role="alert" style={{ fontSize: 'var(--fs-1)', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
              <I.Alert width={10} height={10} style={{ flexShrink: 0 }} />{motivoError}
            </p>
          )}
        </Seccion>

        {/* Signos vitales */}
        <Seccion
          icon={<I.Activity width={15} height={15} />}
          titulo="Signos Vitales"
          badge={triage ? (
            <span style={{ fontSize: 'var(--fs-1)', fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--ok-dim)', color: 'var(--ok)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <I.Check width={10} height={10} />
              Registrado por Enf. {triage.expand?.enfermera_id?.nombre || 'Enfermería'}
            </span>
          ) : null}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            <CampoSigno label="Presión Arterial"  unidad="mmHg" placeholder="120/80"
              valor={signosVitales.presion_arterial}
              onChange={v => handleSignoChange('presion_arterial', v)}
              onBlur={() => handleSignoBlur('presion_arterial')}
              error={signosErrors.presion_arterial} touched={signosTouched.presion_arterial} />
            <CampoSigno label="Temperatura"        unidad="°C"   placeholder="36.5" tipo="number"
              valor={signosVitales.temperatura}
              onChange={v => handleSignoChange('temperatura', v)}
              onBlur={() => handleSignoBlur('temperatura')}
              error={signosErrors.temperatura} touched={signosTouched.temperatura} />
            <CampoSigno label="Frec. Cardíaca"     unidad="lpm"  placeholder="72" tipo="number"
              valor={signosVitales.frecuencia_cardiaca}
              onChange={v => handleSignoChange('frecuencia_cardiaca', v)}
              onBlur={() => handleSignoBlur('frecuencia_cardiaca')}
              error={signosErrors.frecuencia_cardiaca} touched={signosTouched.frecuencia_cardiaca} />
            <CampoSigno label="Peso"     unidad="kg" placeholder="70"  tipo="number"
              valor={signosVitales.peso}
              onChange={v => handleSignoChange('peso', v)}
              onBlur={() => handleSignoBlur('peso')}
              error={signosErrors.peso} touched={signosTouched.peso} />
            <CampoSigno label="Talla"    unidad="cm" placeholder="170" tipo="number"
              valor={signosVitales.talla}
              onChange={v => handleSignoChange('talla', v)}
              onBlur={() => handleSignoBlur('talla')}
              error={signosErrors.talla} touched={signosTouched.talla} />
            <CampoSigno label="Saturación O₂" unidad="%" placeholder="98" tipo="number"
              valor={signosVitales.saturacion_o2}
              onChange={v => handleSignoChange('saturacion_o2', v)}
              onBlur={() => handleSignoBlur('saturacion_o2')}
              error={signosErrors.saturacion_o2} touched={signosTouched.saturacion_o2} />
          </div>
          {imc && (
            <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--accent-dim)', border: '1px solid color-mix(in oklch, var(--accent) 25%, transparent)', padding: '0.625rem 1rem', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: 'var(--fs-2)', color: 'var(--accent)', fontWeight: 500 }}>IMC:</span>
              <span style={{ fontSize: 'var(--fs-2)', fontWeight: 700, color: 'var(--text)' }}>{imc} kg/m²</span>
              <span style={{ fontSize: 'var(--fs-1)', color: 'var(--text-2)', marginLeft: 4 }}>
                {imc < 18.5 ? '— Bajo peso' : imc < 25 ? '— Peso normal ✓' : imc < 30 ? '— Sobrepeso' : '— Obesidad'}
              </span>
            </div>
          )}
        </Seccion>

        </>)}

        {/* ══ PASO 2 — Exploración y diagnóstico ════════════════════ */}
        {paso === 2 && (<>

        {/* Exploración física */}
        <Seccion icon={<I.Stethoscope width={15} height={15} />} titulo="Exploración Física">
          <textarea
            value={exploracion}
            onChange={e => setExploracion(e.target.value)}
            placeholder="Registre los hallazgos del examen físico..."
            rows={5}
            className="input"
            style={{ resize: 'none' }}
          />
        </Seccion>

        {/* Diagnóstico CIE-10 */}
        <Seccion icon={<I.Search width={15} height={15} />} titulo="Diagnóstico (CIE-10)">
          <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
            <I.Search width={14} height={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
            <input
              type="text"
              value={busquedaCIE}
              onChange={e => setBusquedaCIE(e.target.value)}
              placeholder="Buscar por nombre o código CIE-10 (ej. J00, Hipertensión)..."
              className="input"
              style={{ paddingLeft: 32 }}
            />
            {mostrarResultados && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-elev)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', zIndex: 10, marginTop: 4, overflow: 'hidden' }}>
                {resultadosCIE.map(item => (
                  <button key={item.codigo} onClick={() => agregarDiagnostico(item)}
                    style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'none', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'background 0.15s' }}
                    className="row-hover">
                    <span className="mono" style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 'var(--fs-2)', minWidth: 48 }}>{item.codigo}</span>
                    <span style={{ color: 'var(--text-2)', fontSize: 'var(--fs-2)' }}>{item.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {diagnosticos.length === 0 ? (
            <p style={{ fontSize: 'var(--fs-1)', color: 'var(--text-3)', textAlign: 'center', padding: '1.25rem', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
              Busca y selecciona los diagnósticos para esta consulta
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {diagnosticos.map((dx, idx) => (
                <div key={dx.codigo}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--accent-dim)', border: '1px solid color-mix(in oklch, var(--accent) 20%, transparent)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem' }}>
                  <span className="mono" style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 'var(--fs-2)', minWidth: 52 }}>{dx.codigo}</span>
                  <span style={{ color: 'var(--text)', fontSize: 'var(--fs-2)', flex: 1 }}>{dx.desc}</span>
                  <span style={{ fontSize: 'var(--fs-1)', fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: idx === 0 ? 'var(--accent)' : 'var(--bg-subtle)', color: idx === 0 ? 'white' : 'var(--text-3)', border: idx === 0 ? 'none' : '1px solid var(--border)' }}>
                    {idx === 0 ? 'Principal' : 'Secundario'}
                  </span>
                  <button onClick={() => quitarDiagnostico(dx.codigo)}
                    className="btn btn-ghost btn-icon" style={{ color: 'var(--text-3)' }}>
                    <I.X width={14} height={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Seccion>

        </>)}

        {/* ══ PASO 3 — Receta ═══════════════════════════════════════ */}
        {paso === 3 && (<>

        {/* Medicamentos */}
        <Seccion icon={<I.Pill width={15} height={15} />} titulo="Medicamentos Prescritos">
          <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
            <I.Search width={14} height={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
            <input
              type="text"
              value={busquedaMed}
              onChange={e => setBusquedaMed(e.target.value)}
              placeholder="Buscar medicamento (ej. Paracetamol, Amoxicilina)..."
              className="input"
              style={{ paddingLeft: 32 }}
            />
            {mostrarMed && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-elev)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', zIndex: 10, marginTop: 4, overflow: 'hidden' }}>
                {resultadosMed.map(med => (
                  <button key={med.nombre} onClick={() => agregarMedicamento(med)}
                    style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'none', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}
                    className="row-hover">
                    <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: 'var(--fs-2)' }}>{med.nombre}</span>
                    <span style={{ color: 'var(--text-3)', fontSize: 'var(--fs-1)' }}>{med.dosis} · {med.via} · {med.frecuencia}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {medicamentos.length === 0 ? (
            <p style={{ fontSize: 'var(--fs-1)', color: 'var(--text-3)', textAlign: 'center', padding: '1.25rem', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
              Busca y selecciona los medicamentos a prescribir
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {medicamentos.map(med => (
                <div key={med.nombre} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem', background: 'var(--bg-inset, var(--bg))' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div>
                      <p style={{ fontWeight: 600, color: 'var(--text)', fontSize: 'var(--fs-3)' }}>{med.nombre}</p>
                      <p style={{ fontSize: 'var(--fs-1)', color: 'var(--text-3)', marginTop: 2 }}>{med.dosis} · vía {med.via}</p>
                    </div>
                    <button onClick={() => quitarMedicamento(med.nombre)} className="btn btn-ghost btn-icon" style={{ color: 'var(--text-3)' }}>
                      <I.X width={14} height={14} />
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label className="field-label">Frecuencia</label>
                      <input type="text" value={med.frecuencia}
                        onChange={e => actualizarMedicamento(med.nombre, 'frecuencia', e.target.value)}
                        className="input" style={{ fontSize: 'var(--fs-2)' }} />
                    </div>
                    <div>
                      <label className="field-label">Duración</label>
                      <input type="text" value={med.duracion}
                        onChange={e => actualizarMedicamento(med.nombre, 'duracion', e.target.value)}
                        placeholder="Ej: 7 días, 2 semanas..."
                        className="input" style={{ fontSize: 'var(--fs-2)' }} />
                    </div>
                  </div>
                  <div style={{ marginTop: '0.625rem' }}>
                    <label className="field-label">Indicaciones especiales</label>
                    <input type="text" value={med.indicaciones}
                      onChange={e => actualizarMedicamento(med.nombre, 'indicaciones', e.target.value)}
                      placeholder="Ej: Tomar con alimentos, evitar alcohol..."
                      className="input" style={{ fontSize: 'var(--fs-2)' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          {medicamentos.length > 0 && (
            <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => generarRecetaPDF(null, planTratamiento)} disabled={generandoPDF}
                className="btn btn-outline" style={{ fontSize: 'var(--fs-2)', gap: 6 }}>
                <I.PDF width={14} height={14} />
                {generandoPDF ? 'Generando...' : 'Vista previa de receta PDF'}
              </button>
            </div>
          )}
        </Seccion>

        </>)}

        {/* ══ PASO 4 — Plan y revisión ══════════════════════════════ */}
        {paso === 4 && (<>

        {/* Plan y tratamiento */}
        <Seccion icon={<I.Clipboard width={15} height={15} />} titulo="Plan y Tratamiento">
          <textarea
            value={planTratamiento}
            onChange={e => setPlanTratamiento(e.target.value)}
            placeholder="Instrucciones de medicación, cambios en el estilo de vida, estudios solicitados y planes de seguimiento..."
            rows={5}
            className="input"
            style={{ resize: 'none' }}
          />
        </Seccion>

        {/* Revisión final: todo lo capturado, antes de firmar. */}
        <Seccion icon={<I.Check width={15} height={15} />} titulo="Revisión antes de finalizar">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <FilaRevision
              etiqueta="Motivo de la consulta"
              contenido={motivo.trim()}
              vacio="Sin motivo capturado"
              onIr={() => irAPaso(1)}
            />
            <FilaRevision
              etiqueta="Signos vitales"
              contenido={signosCompletos > 0 ? `${signosCompletos} de 6 registrados${imc ? ` · IMC ${imc}` : ''}` : ''}
              vacio="Ninguno registrado"
              onIr={() => irAPaso(1)}
            />
            <FilaRevision
              etiqueta="Exploración física"
              contenido={exploracion.trim()}
              vacio="Sin hallazgos capturados"
              onIr={() => irAPaso(2)}
            />
            <FilaRevision
              etiqueta="Diagnósticos"
              contenido={diagnosticos.map(d => `${d.codigo} ${d.desc}`).join(' · ')}
              vacio="Ningún diagnóstico"
              onIr={() => irAPaso(2)}
            />
            <FilaRevision
              etiqueta="Medicamentos"
              contenido={medicamentos.map(m => `${m.nombre} ${m.dosis}`).join(' · ')}
              vacio="Sin prescripción"
              onIr={() => irAPaso(3)}
            />
          </div>
        </Seccion>

        </>)}

        {error && (
          <div role="alert" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', background: 'var(--danger-dim)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', color: 'var(--danger)', fontSize: 'var(--fs-2)' }}>
            <I.Alert width={14} height={14} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
          </div>
        )}

        {/* ── Navegación entre pasos ─────────────────────────────── */}
        <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => (paso === 1 ? navigate(`/pacientes/${pacienteId}`) : irAPaso(paso - 1))}
            className="btn btn-outline"
          >
            <I.ArrowLeft width={14} height={14} />
            {paso === 1 ? 'Descartar' : 'Anterior'}
          </button>

          <span style={{ fontSize: 'var(--fs-1)', color: 'var(--text-3)' }}>
            Paso {paso} de {TOTAL_PASOS} · {PASOS[paso - 1].titulo}
          </span>

          {paso < TOTAL_PASOS ? (
            <button onClick={() => irAPaso(paso + 1)} className="btn btn-primary">
              Siguiente <I.ChevronRight width={14} height={14} />
            </button>
          ) : (
            <button onClick={() => handleGuardar('completada')} disabled={guardando} className="btn btn-primary">
              <I.Check width={14} height={14} />
              {guardando ? 'Guardando…' : 'Firmar y finalizar'}
            </button>
          )}
        </div>
      </div>

      {/* ── Follow-up drawer ───────────────────────────────────────── */}
      <Suspense fallback={null}>
        <SeguimientoDrawer
          open={drawerAbierto}
          onCerrar={() => navigate(`/pacientes/${pacienteId}`)}
          pacienteId={pacienteId}
          pacienteNombre={paciente ? `${paciente.nombre} ${paciente.apellidos}` : ''}
          medicoId={usuario?.id}
          medicoNombre={usuario ? `${usuario.nombre} ${usuario.apellidos}` : ''}
          consultorio={usuario?.consultorio || ''}
          planTratamiento={planTratamiento}
        />
      </Suspense>

      {/* ── Right sidebar ───────────────────────────────────────────── */}
      <div style={{ width: 256, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Patient card */}
        <div className="card" style={{ padding: '1.25rem' }}>
          {paciente ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div className="avatar" style={{ width: 48, height: 48, fontSize: 'var(--fs-4)', flexShrink: 0 }}>
                  {paciente.nombre?.[0]}{paciente.apellidos?.[0]}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 700, color: 'var(--text)', fontSize: 'var(--fs-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {paciente.nombre} {paciente.apellidos}
                  </p>
                  <p style={{ fontSize: 'var(--fs-1)', color: 'var(--text-3)', marginTop: 1 }}>
                    #{paciente.id.slice(-6).toUpperCase()} · <span style={{ textTransform: 'capitalize' }}>{paciente.sexo || '—'}</span>
                  </p>
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column' }}>
                <InfoRow label="Grupo sanguíneo" valor={paciente.grupo_sanguineo || '—'} />
                <InfoRow label="CURP" valor={paciente.curp?.slice(0, 10) + '...'} mono />
              </div>
              {paciente.alergias_criticas && paciente.alergias && (
                <div style={{ marginTop: '0.75rem', background: 'var(--danger-dim)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', padding: '0.625rem 0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <I.Alert width={11} height={11} style={{ color: 'var(--danger)' }} />
                    <p style={{ fontSize: 'var(--fs-1)', fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Alergias Críticas</p>
                  </div>
                  <p style={{ fontSize: 'var(--fs-1)', color: 'var(--danger)' }}>{paciente.alergias}</p>
                </div>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', color: 'var(--text-3)' }}>
              <div style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', marginBottom: 8 }} className="anim-spin" />
              <p style={{ fontSize: 'var(--fs-1)' }}>Cargando paciente...</p>
            </div>
          )}
        </div>

        {/* Consultation summary */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: 'var(--fs-1)', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
            Resumen
          </p>
          <InfoRow label="Diagnósticos"  valor={diagnosticos.length.toString()} />
          <InfoRow label="Medicamentos"  valor={medicamentos.length.toString()} />
          <InfoRow label="Signos vitales" valor={`${signosCompletos} / 6`} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 'var(--fs-1)', color: 'var(--text-3)' }}>Motivo</span>
            <span style={{ fontSize: 'var(--fs-1)', fontWeight: 500, color: motivo ? 'var(--ok)' : 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
              {motivo ? <><I.Check width={11} height={11} /> Listo</> : 'Pendiente'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
            <span style={{ fontSize: 'var(--fs-1)', color: 'var(--text-3)' }}>Plan</span>
            <span style={{ fontSize: 'var(--fs-1)', fontWeight: 500, color: planTratamiento ? 'var(--ok)' : 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
              {planTratamiento ? <><I.Check width={11} height={11} /> Listo</> : 'Pendiente'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Indicador de progreso de la consulta. Permite volver a un paso anterior. */
function Stepper({ paso, onIr, listos }) {
  return (
    <nav aria-label="Progreso de la consulta" className="card" style={{ padding: '0.875rem 1rem' }}>
      <ol style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', listStyle: 'none', margin: 0, padding: 0 }}>
        {PASOS.map(({ n, corto }, i) => {
          const activo    = n === paso
          const anterior  = n < paso
          const completo  = listos[n]
          return (
            <li key={n} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: i < PASOS.length - 1 ? 1 : 'none', minWidth: 0 }}>
              <button
                onClick={() => onIr(n)}
                aria-current={activo ? 'step' : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: activo ? 'var(--accent-dim)' : 'transparent',
                  border: 'none', borderRadius: 'var(--radius-md)',
                  padding: '0.375rem 0.625rem', cursor: 'pointer', minWidth: 0,
                  transition: 'background 0.15s',
                }}
              >
                <span style={{
                  width: 26, height: 26, flexShrink: 0,
                  borderRadius: 'var(--radius-full)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 'var(--fs-1)', fontWeight: 700,
                  background: activo ? 'var(--accent)' : anterior || completo ? 'var(--ok-dim)' : 'var(--bg-subtle)',
                  color:      activo ? 'white'        : anterior || completo ? 'var(--ok)'     : 'var(--text-3)',
                  border:     activo ? 'none' : '1px solid var(--border)',
                }}>
                  {(anterior || completo) && !activo ? <I.Check width={13} height={13} /> : n}
                </span>
                <span style={{
                  fontSize: 'var(--fs-2)',
                  fontWeight: activo ? 600 : 500,
                  color: activo ? 'var(--accent)' : 'var(--text-2)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {corto}
                </span>
              </button>
              {i < PASOS.length - 1 && (
                <span aria-hidden="true" style={{
                  flex: 1, height: 2, minWidth: 12, borderRadius: 1,
                  background: n < paso ? 'var(--ok)' : 'var(--border)',
                  transition: 'background 0.2s',
                }} />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/** Fila del resumen final, con acceso directo al paso que la origina. */
function FilaRevision({ etiqueta, contenido, vacio, onIr }) {
  const hay = Boolean(contenido)
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
      padding: '0.75rem', borderRadius: 'var(--radius-md)',
      background: 'var(--bg)', border: '1px solid var(--border)',
    }}>
      <I.Check
        width={15} height={15}
        style={{ flexShrink: 0, marginTop: 2, color: hay ? 'var(--ok)' : 'var(--text-3)', opacity: hay ? 1 : 0.4 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 'var(--fs-1)', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {etiqueta}
        </p>
        <p style={{ fontSize: 'var(--fs-2)', color: hay ? 'var(--text)' : 'var(--text-3)', marginTop: 2, fontStyle: hay ? 'normal' : 'italic' }}>
          {hay ? contenido : vacio}
        </p>
      </div>
      <button onClick={onIr} className="btn btn-ghost" style={{ fontSize: 'var(--fs-1)', color: 'var(--accent)', flexShrink: 0, padding: '0.25rem 0.5rem' }}>
        Editar
      </button>
    </div>
  )
}

function Seccion({ icon, titulo, badge, children }) {
  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--text-3)' }}>
        {icon}
        <h2 style={{ fontSize: 'var(--fs-1)', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {titulo}
        </h2>
        {badge && <div style={{ marginLeft: 'auto' }}>{badge}</div>}
      </div>
      {children}
    </div>
  )
}

function CampoSigno({ label, unidad, placeholder, valor, onChange, onBlur, tipo = 'text', error, touched }) {
  const showError = !!(touched && error)
  return (
    <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-md)', padding: '0.75rem', border: `1px solid ${showError ? 'var(--danger)' : 'var(--border)'}` }}>
      <label style={{ display: 'block', fontSize: 'var(--fs-1)', color: showError ? 'var(--danger)' : 'var(--text-3)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          type={tipo}
          value={valor}
          onChange={e => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 'var(--fs-4)', fontWeight: 700, color: showError ? 'var(--danger)' : 'var(--text)', minWidth: 0, fontVariantNumeric: 'tabular-nums' }}
          className="tabular"
          aria-invalid={showError ? 'true' : undefined}
        />
        <span style={{ fontSize: 'var(--fs-1)', color: 'var(--text-3)', flexShrink: 0 }}>{unidad}</span>
      </div>
      {showError && (
        <p role="alert" style={{ fontSize: 'var(--fs-1)', color: 'var(--danger)', marginTop: '0.375rem', lineHeight: 1.3 }}>
          {error}
        </p>
      )}
    </div>
  )
}

function InfoRow({ label, valor, mono }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 'var(--fs-1)', color: 'var(--text-3)' }}>{label}</span>
      <span style={{ fontSize: 'var(--fs-1)', fontWeight: 500, color: 'var(--text)', fontFamily: mono ? 'var(--font-mono, monospace)' : undefined }}>
        {valor || '—'}
      </span>
    </div>
  )
}
