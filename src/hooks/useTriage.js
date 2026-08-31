import { useState, useEffect, useRef } from 'react'
import pb from '../lib/pb'
import { logWarn } from '../lib/logger'

// VULN-FIX (ÁREA 9): PocketBase almacena `created` en UTC. Antes esta función
// devolvía la medianoche LOCAL como texto plano, que al compararse se
// interpretaba como UTC: con UTC-6 se colaban las últimas 6 horas del día
// anterior y un triage de ayer por la tarde aparecía como el de hoy, con los
// signos vitales de ayer etiquetados "Registrado por Enfermería".
// Ahora se convierte explícitamente la medianoche local a UTC.
function hoyInicio() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString().replace('T', ' ').slice(0, 19)
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
      // VULN-FIX (ÁREA 9): pacienteId llega de la URL (?paciente=), así que se
      // enlaza como parámetro en lugar de interpolarse en el filtro.
      filter:  pb.filter('paciente_id = {:pid} && estado = "completado" && created >= {:desde}',
                         { pid: pacienteId, desde: hoyInicio() }),
      sort:    '-created',
      expand:  'enfermera_id',
    }).then(r => {
      if (!cancelado) setTriage(r.items[0] ?? null)
    }).catch(err => {
      logWarn('useTriagePaciente', err)
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
      filter:  pb.filter('cita_id = {:cid}', { cid: citaId }),
      sort:    '-created',
      expand:  'enfermera_id,paciente_id',
    }).then(r => {
      if (!cancelado) setTriage(r.items[0] ?? null)
    }).catch(err => {
      logWarn('useTriageCita', err)
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
    }).then(fn => { unsub = fn })
      .catch(err => logWarn('useTriageRealtime.subscribe', err))
    return () => { unsub?.() }
  }, [])
}
