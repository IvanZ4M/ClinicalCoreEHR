// Cálculo y presentación de la edad del paciente.
//
// Antes cada pantalla repetía su propio `calcularEdad` y todas escribían
// "N años" sin excepción, así que un bebé de un año aparecía como "1 años".
// En un consultorio con pediatría (la Dra. Camacho es pediatra) además importa
// distinguir los meses: "8 meses" y "1 año" no son lo mismo clínicamente.

/** Edad en años cumplidos. Devuelve null si no hay fecha válida. */
export function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return null
  const nac = new Date(fechaNacimiento)
  if (Number.isNaN(nac.getTime())) return null
  const hoy = new Date()
  let edad = hoy.getFullYear() - nac.getFullYear()
  const m = hoy.getMonth() - nac.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--
  return edad
}

/** Edad en meses cumplidos (para menores de dos años). */
export function calcularEdadMeses(fechaNacimiento) {
  if (!fechaNacimiento) return null
  const nac = new Date(fechaNacimiento)
  if (Number.isNaN(nac.getTime())) return null
  const hoy = new Date()
  let meses = (hoy.getFullYear() - nac.getFullYear()) * 12 + (hoy.getMonth() - nac.getMonth())
  if (hoy.getDate() < nac.getDate()) meses--
  return Math.max(0, meses)
}

/** Texto listo para mostrar: "8 meses", "1 año", "43 años". */
export function formatearEdad(fechaNacimiento) {
  const edad = calcularEdad(fechaNacimiento)
  if (edad === null) return '—'
  if (edad < 2) {
    const meses = calcularEdadMeses(fechaNacimiento)
    if (meses !== null && meses < 24) {
      return meses === 1 ? '1 mes' : `${meses} meses`
    }
  }
  return edad === 1 ? '1 año' : `${edad} años`
}
