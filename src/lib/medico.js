// Tratamiento y nombre del personal médico, en un solo sitio.
//
// Antes había 13 usos de `Dr.` escritos a mano en 11 archivos, incluidos los dos
// de la receta en PDF. Con una médica en el padrón, todos ellos estaban mal.

/**
 * Deriva el tratamiento del campo `sexo` de `usuarios` (migración 1779000003).
 *
 * Cae a "Dr." cuando el campo está vacío —usuarios creados antes de esa
 * migración— porque es exactamente lo que la aplicación venía mostrando: así
 * el cambio nunca empeora lo que ya había. Para `otro` también se usa "Dr.",
 * que es la forma no marcada en español; si algún día hace falta un tratamiento
 * neutro, este es el único punto que hay que tocar.
 */
export function tratamiento(usuario) {
  return usuario?.sexo === 'femenino' ? 'Dra.' : 'Dr.'
}

/**
 * Nombre con tratamiento y sin espacios sobrantes: "Dra. Vania Camacho".
 *
 * El colapso de espacios no es adorno. Un `nombre` capturado como "Vania " con
 * espacio final imprimía "Dr. Vania  Zamarron Camacho" con doble espacio en la
 * receta entregada al paciente.
 *
 * @param usuario  registro de `usuarios` (o un `expand.medico`)
 * @param opciones `apellidos: false` para mostrar solo el nombre de pila
 */
export function nombreMedico(usuario, { apellidos = true } = {}) {
  if (!usuario) return '—'
  const partes = [usuario.nombre, apellidos ? usuario.apellidos : null]
  const nombre = partes.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
  if (!nombre) return '—'
  return `${tratamiento(usuario)} ${nombre}`
}
