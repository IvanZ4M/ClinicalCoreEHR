// Centralized validation rules — all form validators live here.
// Returns null (valid) or a Spanish error string (invalid).
// Never throws; callers compare to null.

export const validators = {

  // ─── Strings y nombres ─────────────────────────────────────────────────────
  nombre: (v) => {
    if (!v || v.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres'
    if (v.trim().length > 50) return 'El nombre no puede superar 50 caracteres'
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-']+$/.test(v.trim()))
      return 'El nombre solo puede contener letras, espacios y guiones'
    return null
  },

  apellido: (v) => {
    if (!v || v.trim().length < 2) return 'El apellido debe tener al menos 2 caracteres'
    if (v.trim().length > 50) return 'El apellido no puede superar 50 caracteres'
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-']+$/.test(v.trim()))
      return 'El apellido solo puede contener letras, espacios y guiones'
    return null
  },

  // CURP mexicana: formato oficial de 18 caracteres
  curp: (v) => {
    if (!v) return 'La CURP es obligatoria'
    const curpRegex = /^[A-Z]{1}[AEIOU]{1}[A-Z]{2}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[HM]{1}(AS|BC|BS|CC|CS|CH|CL|CM|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[0-9A-Z]{1}[0-9]{1}$/
    if (!curpRegex.test(v.toUpperCase()))
      return 'La CURP no tiene un formato válido (18 caracteres, formato oficial)'
    return null
  },

  // ─── Email ─────────────────────────────────────────────────────────────────
  email: (v) => {
    if (!v) return null // opcional en algunos contextos
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()))
      return 'El correo electrónico no tiene un formato válido'
    if (v.length > 100) return 'El correo es demasiado largo'
    return null
  },

  emailRequired: (v) => {
    if (!v || !v.trim()) return 'El correo electrónico es obligatorio'
    return validators.email(v)
  },

  // ─── Teléfono ──────────────────────────────────────────────────────────────
  // Acepta 10 dígitos, puede tener espacios/guiones/paréntesis que se limpian
  telefono: (v) => {
    if (!v) return null // opcional
    const limpio = v.replace(/[\s\-\(\)\.]/g, '')
    if (!/^\d{10}$/.test(limpio))
      return 'El teléfono debe tener 10 dígitos (ej: 871 123 4567)'
    if (/^0{10}$/.test(limpio) || /^1{10}$/.test(limpio))
      return 'Ingresa un número de teléfono real'
    return null
  },

  telefonoRequired: (v) => {
    if (!v || !v.trim()) return 'El teléfono es obligatorio'
    return validators.telefono(v)
  },

  // ─── Fechas ────────────────────────────────────────────────────────────────
  fechaNacimiento: (v) => {
    if (!v) return 'La fecha de nacimiento es obligatoria'
    const fecha = new Date(v)
    if (isNaN(fecha.getTime())) return 'La fecha no es válida'
    const hoy = new Date()
    const hace150 = new Date()
    hace150.setFullYear(hoy.getFullYear() - 150)
    if (fecha > hoy) return 'La fecha de nacimiento no puede ser futura'
    if (fecha < hace150) return 'La fecha de nacimiento no es realista'
    return null
  },

  fechaCita: (v) => {
    if (!v) return 'La fecha de la cita es obligatoria'
    const fecha = new Date(v)
    if (isNaN(fecha.getTime())) return 'La fecha no es válida'
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    if (fecha < hoy) return 'No se pueden agendar citas en fechas pasadas'
    const limite = new Date()
    limite.setFullYear(hoy.getFullYear() + 1)
    if (fecha > limite) return 'La cita no puede agendarse con más de un año de anticipación'
    return null
  },

  // ─── Signos vitales ────────────────────────────────────────────────────────
  presionArterial: (v) => {
    if (!v) return null // opcional si no se tomó
    if (!/^\d{2,3}\/\d{2,3}$/.test(v.trim()))
      return 'Formato inválido. Usa el formato: 120/80'
    const [sist, diast] = v.split('/').map(Number)
    if (sist < 60 || sist > 300) return 'Presión sistólica fuera de rango (60-300)'
    if (diast < 30 || diast > 200) return 'Presión diastólica fuera de rango (30-200)'
    if (diast >= sist) return 'La diastólica debe ser menor que la sistólica'
    return null
  },

  temperatura: (v) => {
    if (!v && v !== 0) return null
    const n = parseFloat(v)
    if (isNaN(n)) return 'La temperatura debe ser un número'
    if (n < 28 || n > 45) return 'Temperatura fuera de rango clínico (28–45 °C)'
    return null
  },

  frecuenciaCardiaca: (v) => {
    if (!v && v !== 0) return null
    const n = parseInt(v, 10)
    if (isNaN(n)) return 'La frecuencia cardíaca debe ser un número entero'
    if (n < 20 || n > 300) return 'Frecuencia cardíaca fuera de rango (20–300 lpm)'
    return null
  },

  frecuenciaRespiratoria: (v) => {
    if (!v && v !== 0) return null
    const n = parseInt(v, 10)
    if (isNaN(n)) return 'La frecuencia respiratoria debe ser un número entero'
    if (n < 4 || n > 60) return 'Frecuencia respiratoria fuera de rango (4–60 rpm)'
    return null
  },

  saturacionOxigeno: (v) => {
    if (!v && v !== 0) return null
    const n = parseFloat(v)
    if (isNaN(n)) return 'La saturación debe ser un número'
    if (n < 50 || n > 100) return 'Saturación fuera de rango (50–100 %)'
    return null
  },

  peso: (v) => {
    if (!v && v !== 0) return null
    const n = parseFloat(v)
    if (isNaN(n)) return 'El peso debe ser un número'
    if (n < 0.5 || n > 500) return 'Peso fuera de rango clínico (0.5–500 kg)'
    return null
  },

  talla: (v) => {
    if (!v && v !== 0) return null
    const n = parseFloat(v)
    if (isNaN(n)) return 'La talla debe ser un número'
    if (n < 30 || n > 250) return 'Talla fuera de rango clínico (30–250 cm)'
    return null
  },

  // ─── Texto libre clínico ───────────────────────────────────────────────────
  motivoConsulta: (v) => {
    if (!v || v.trim().length < 10)
      return 'El motivo de consulta debe tener al menos 10 caracteres'
    if (v.length > 2000) return 'El motivo de consulta es demasiado extenso (máx. 2000 chars)'
    return null
  },

  // ─── Contraseña ────────────────────────────────────────────────────────────
  password: (v) => {
    if (!v) return 'La contraseña es obligatoria'
    if (v.length < 8) return 'La contraseña debe tener al menos 8 caracteres'
    if (!/[A-Z]/.test(v)) return 'Debe incluir al menos una letra mayúscula'
    if (!/[0-9]/.test(v)) return 'Debe incluir al menos un número'
    return null
  },
}

// Validate a whole form object against a rules map.
// Returns { isValid: bool, errors: { field: string|null } }
export function validateForm(data, rules) {
  const errors = {}
  let isValid = true
  for (const [field, validator] of Object.entries(rules)) {
    const error = validator(data[field])
    if (error) {
      errors[field] = error
      isValid = false
    }
  }
  return { isValid, errors }
}
