import pb from '../lib/pb'
import { logError } from '../lib/logger'

/**
 * Creates a new appointment record.
 * @param {{ paciente, medico, fecha_hora, tipo, consultorio, notas, estado }} data
 */
export async function createCita({ paciente, medico, fecha_hora, tipo, consultorio, notas, estado }) {
  const fechaFormateada = new Date(fecha_hora).toISOString().replace('T', ' ').slice(0, 19)
  return pb.collection('citas').create({
    paciente, medico,
    fecha_hora: fechaFormateada,
    tipo: tipo || 'seguimiento',
    consultorio: consultorio || '',
    notas: notas || '',
    estado: estado || 'programada',
  })
}

/**
 * Returns 30-minute slots between 07:00 and 19:00 for a doctor on a given date,
 * marking occupied slots based on existing confirmed appointments.
 * @param {string} medicoId
 * @param {string} fecha — "YYYY-MM-DD"
 * @returns {Promise<{ hora: string, disponible: boolean }[]>}
 */
export async function getSlotsDisponibles(medicoId, fecha) {
  const inicio = new Date(`${fecha}T07:00:00`).toISOString().replace('T', ' ').slice(0, 19)
  const fin    = new Date(`${fecha}T19:00:00`).toISOString().replace('T', ' ').slice(0, 19)

  let citasDelDia = []
  try {
    const r = await pb.collection('citas').getFullList({
      filter: pb.filter(
        'medico = {:med} && fecha_hora >= {:ini} && fecha_hora <= {:fin} && estado != "cancelada" && estado != "no_acudio"',
        { med: medicoId, ini: inicio, fin }
      ),
    })
    citasDelDia = r
  } catch (err) {
    // OJO: si la consulta falla se devuelven todos los horarios como libres,
    // lo que puede provocar una cita duplicada. Queda registrado para poder
    // detectarlo; a futuro convendría propagar el error a la interfaz.
    logError('citasService.getSlotsDisponibles', err)
  }

  const ocupadas = new Set(
    citasDelDia.map(c => {
      if (!c.fecha_hora) return null
      const d = new Date(c.fecha_hora)
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    }).filter(Boolean)
  )

  const slots = []
  for (let h = 7; h < 19; h++) {
    for (const m of [0, 30]) {
      const hora = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      slots.push({ hora, disponible: !ocupadas.has(hora) })
    }
  }
  return slots
}
