import { useState, useEffect, useRef, useMemo } from 'react'
import { useColeccion } from './usePocketBase'
import { useTriageRealtime } from './useTriage'
import pb from '../lib/pb'

function hoyRango() {
  const d = new Date()
  const p = n => String(n).padStart(2, '0')
  const fmt = dt => `${dt.getUTCFullYear()}-${p(dt.getUTCMonth()+1)}-${p(dt.getUTCDate())} ${p(dt.getUTCHours())}:${p(dt.getUTCMinutes())}:${p(dt.getUTCSeconds())}`
  const inicio = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const fin    = new Date(inicio.getTime() + 86400000 - 1000)
  return { inicio: fmt(inicio), fin: fmt(fin) }
}

function mesInicio() {
  const d = new Date()
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-01 00:00:00`
}

const ORDEN_ESTADO = {
  en_consulta: 0, en_sala: 1, confirmada: 2, programada: 3,
  completada: 4, cancelada: 5, no_acudio: 5,
}

export function useDashboardData(usuario) {
  const esMedico = usuario?.rol === 'medico'
  const medicoId = usuario?.id || ''
  const filtroM = esMedico && medicoId ? `medico = "${medicoId}" && ` : ''

  const { inicio, fin } = useMemo(hoyRango, [])
  const inicioMes      = useMemo(mesInicio, [])

  const { datos: citasHoy, cargando: cargandoCitas, error: errorCitas, recargar: recargarCitas } =
    useColeccion('citas', {
      filtro:   `${filtroM}fecha_hora >= "${inicio}" && fecha_hora <= "${fin}"`,
      orden:    'fecha_hora',
      expandir: 'paciente',
    })

  const { datos: pacientes, cargando: cargandoPacientes } =
    useColeccion('pacientes', { filtro: 'activo = true' })

  const { datos: citasCompletadasMes, cargando: cargandoMes } =
    useColeccion('citas', {
      filtro: `${filtroM}estado = "completada" && fecha_hora >= "${inicioMes}"`,
    })

  const { datos: borradores, cargando: cargandoBorradores } =
    useColeccion('consultas', { filtro: `${filtroM}estado = "borrador"` })

  const { datos: diagnosticos } =
    useColeccion('diagnosticos', {
      filtro:    esMedico && medicoId ? `consulta.medico = "${medicoId}"` : '',
      porPagina: 500,
    })

  const { datos: triagesHoy } =
    useColeccion('triage', {
      filtro: `${esMedico && medicoId ? `cita_id.medico = "${medicoId}" && ` : ''}created >= "${inicio}" && created <= "${fin}" && estado = "completado"`,
    })

  // Auto-refresh every 60 s
  const recargarRef = useRef(recargarCitas)
  useEffect(() => { recargarRef.current = recargarCitas })
  useEffect(() => {
    const id = setInterval(() => recargarRef.current(), 60_000)
    return () => clearInterval(id)
  }, [])

  // Triage realtime — notify only when the triage belongs to this doctor
  const [notificacionTriage, setNotificacionTriage] = useState(null)
  useTriageRealtime(async (record) => {
    if (esMedico && medicoId) {
      try {
        const cita = await pb.collection('citas').getOne(record.cita_id)
        if (cita.medico !== medicoId) return
      } catch { return }
    }
    recargarRef.current()
    try {
      const pac = await pb.collection('pacientes').getOne(record.paciente_id)
      setNotificacionTriage({ nombre: `${pac.nombre} ${pac.apellidos}`, id: record.id })
    } catch {
      setNotificacionTriage({ nombre: 'Paciente', id: record.id })
    }
  })

  // Sort: active first, then upcoming by time, then finished
  const citasOrdenadas = useMemo(() =>
    [...citasHoy].sort((a, b) => {
      const oa = ORDEN_ESTADO[a.estado] ?? 10
      const ob = ORDEN_ESTADO[b.estado] ?? 10
      if (oa !== ob) return oa - ob
      return new Date(a.fecha_hora) - new Date(b.fecha_hora)
    }), [citasHoy])

  // First cita that hasn't ended yet
  const proximaCita = useMemo(() =>
    citasOrdenadas.find(c =>
      c.estado !== 'completada' && c.estado !== 'cancelada' && c.estado !== 'no_acudio'
    ) ?? null, [citasOrdenadas])

  return {
    citasOrdenadas,
    proximaCita,
    cargandoCitas,
    errorCitas,
    recargarCitas,
    pacientes,        cargandoPacientes,
    citasCompletadasMes, cargandoMes,
    borradores,       cargandoBorradores,
    diagnosticos,
    triagesHoy,
    notificacionTriage,
    setNotificacionTriage,
  }
}
