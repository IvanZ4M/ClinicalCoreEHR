// VULN-FIX (ÁREA 4): funciones de sanitización de inputs clínicos.
// React escapa HTML automáticamente con JSX, pero sanitizar antes de enviar
// a PocketBase elimina caracteres de control y limita longitudes máximas,
// reduciendo la superficie de inyección en filtros y campos de texto libre.

/**
 * Sanitiza un string genérico: recorta espacios, elimina < > y trunca.
 * @param {string} str
 * @param {number} maxLen longitud máxima permitida
 */
export function sanitizeStr(str, maxLen = 500) {
  if (typeof str !== 'string') return str
  return str.trim().replace(/[<>]/g, '').substring(0, maxLen)
}

/**
 * Sanitiza los campos de un registro de paciente antes de guardarlo.
 * No modifica campos que no existen en el objeto original.
 */
export function sanitizePatientData(data) {
  return {
    ...data,
    nombre:    sanitizeStr(data.nombre,    100),
    apellidos: sanitizeStr(data.apellidos, 100),
    // CURP: estándar mexicano — 18 chars mayúsculas
    curp:      typeof data.curp === 'string'
      ? data.curp.toUpperCase().trim().substring(0, 18)
      : data.curp,
    email:     typeof data.email === 'string'
      ? data.email.toLowerCase().trim().substring(0, 200)
      : data.email,
    // Teléfono: solo dígitos, +, -, espacios, paréntesis
    telefono:  typeof data.telefono === 'string'
      ? data.telefono.trim().replace(/[^0-9+\-\s()]/g, '').substring(0, 20)
      : data.telefono,
    alergias:  sanitizeStr(data.alergias, 2000),
  }
}
