import { useState, useEffect, useRef } from 'react'
import pb from '../lib/pb'

function hoyInicio() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} 00:00:00`
}

// Most recent completed triage for a patient today
export function useTriagePaciente(pacienteId) {
  const [triage,   setTriage]   = useState(null)
  const [cargando, setCargando] = useState(true)
  const [version,  setVersion]  = useState(0)

  useEffect(() => {
    if (!pacienteId) { setCargando(false); return }
    let cancelado = false
    setCargando(true)
    pb.collection('triage').getList(1, 1, {
      filter:  `paciente_id = "${pacienteId}" && estado = "completado" && created >= "${hoyInicio()}"`,
      sort:    '-created',
      expand:  'enfermera_id',
    }).then(r => {
      if (!cancelado) setTriage(r.items[0] ?? null)
    }).catch(() => {
      if (!cancelado) setTriage(null)
    }).finally(() => {
      if (!cancelado) setCargando(false)
    })
    return () => { cancelado = true }
  }, [pacienteId, version])

  return { triage, cargando, recargar: () => setVersion(v => v + 1) }
}

// Triage for a specific cita (any state)
export function useTriageCita(citaId) {
  const [triage,   setTriage]   = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!citaId) { setCargando(false); return }
    let cancelado = false
    setCargando(true)
    pb.collection('triage').getList(1, 1, {
      filter:  `cita_id = "${citaId}"`,
      sort:    '-created',
      expand:  'enfermera_id,paciente_id',
    }).then(r => {
      if (!cancelado) setTriage(r.items[0] ?? null)
    }).catch(() => {
      if (!cancelado) setTriage(null)
    }).finally(() => {
      if (!cancelado) setCargando(false)
    })
    return () => { cancelado = true }
  }, [citaId])

  return { triage, cargando }
}

// Real-time subscription — calls onNuevo(record) when triage is created
// Uses a ref so the parent callback doesn't need to be memoized.
export function useTriageRealtime(onNuevo) {
  const cbRef = useRef(onNuevo)
  useEffect(() => { cbRef.current = onNuevo })

  useEffect(() => {
    let unsub = null
    pb.collection('triage').subscribe('*', (e) => {
      if (e.action === 'create') cbRef.current(e.record)
    }).then(fn => { unsub = fn }).catch(() => {})
    return () => { unsub?.() }
  }, [])
}
