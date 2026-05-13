import { I } from '../components/icons'

// ── Constantes de roles ──────────────────────────────────────────────────────
export const ROLES = {
  MEDICO:          'medico',
  ENFERMERA:       'enfermera',
  RECEPCIONISTA:   'recepcionista',
  ADMINISTRADOR:   'administrador',
}

// ── Etiquetas legibles ────────────────────────────────────────────────────────
export const ROLE_LABELS = {
  medico:          'Médico',
  enfermera:       'Enfermera',
  recepcionista:   'Recepcionista',
  administrador:   'Administrador',
}

// ── Prefijo para saludo contextual ───────────────────────────────────────────
export const ROLE_PREFIX = {
  medico:          'Dr.',
  enfermera:       'Enf.',
  recepcionista:   '',
  administrador:   '',
}

// ── Navegación lateral por rol ───────────────────────────────────────────────
// Cada entrada: { path, Icon, label }
// NO usar importación dinámica aquí; los iconos se pasan como referencia.
export const ROLE_NAV_CONFIG = {
  medico: [
    { path: '/',              Icon: I.Dashboard,  label: 'Panel de Control' },
    { path: '/pacientes',     Icon: I.Patients,   label: 'Pacientes'        },
    { path: '/citas',         Icon: I.Calendar,   label: 'Citas'            },
    { path: '/informes',      Icon: I.Chart,      label: 'Informes'         },
    { path: '/configuracion', Icon: I.Settings,   label: 'Configuración'    },
  ],
  enfermera: [
    { path: '/',            Icon: I.Dashboard,    label: 'Panel de Control' },
    { path: '/enfermeria',  Icon: I.Stethoscope,  label: 'Sala de espera'   },
    { path: '/citas',       Icon: I.Calendar,     label: 'Citas'            },
    { path: '/pacientes',   Icon: I.Patients,     label: 'Pacientes'        },
  ],
  recepcionista: [
    { path: '/',          Icon: I.Dashboard, label: 'Panel de Control' },
    { path: '/pacientes', Icon: I.Patients,  label: 'Pacientes'        },
    { path: '/citas',     Icon: I.Calendar,  label: 'Citas'            },
  ],
  administrador: [
    { path: '/',              Icon: I.Dashboard, label: 'Panel de Control' },
    { path: '/usuarios',      Icon: I.User,      label: 'Usuarios'         },
    { path: '/configuracion', Icon: I.Settings,  label: 'Configuración'    },
  ],
}

// ── Rutas protegidas y los roles que pueden acceder ──────────────────────────
// La ruta '/' (dashboard) la puede ver todo rol autenticado.
export const ROUTE_ROLES = {
  '/pacientes':      ['medico', 'recepcionista', 'enfermera'],
  '/citas':          ['medico', 'enfermera', 'recepcionista'],
  '/informes':       ['medico'],
  '/configuracion':  ['medico', 'administrador'],
  '/usuarios':       ['administrador'],
  '/consulta/nueva': ['medico'],
  '/enfermeria':     ['enfermera'],
}

// ── El botón "Nueva Consulta" solo aparece para el médico ─────────────────────
export const ROLES_CON_NUEVA_CONSULTA = ['medico']

// ── Tabs de PatientDetail permitidos por rol ──────────────────────────────────
// Los tabs son: 'Datos Personales', 'Antecedentes', 'Historial Médico', 'Consultas Previas'
export const PATIENT_TABS_POR_ROL = {
  medico:          ['Datos Personales', 'Antecedentes', 'Historial Médico', 'Consultas Previas'],
  enfermera:       ['Datos Personales', 'Antecedentes'],
  recepcionista:   ['Datos Personales'],
  administrador:   ['Datos Personales'],
}

// ── Helper: construye el saludo según hora y rol ──────────────────────────────
export function saludo(nombre, rol) {
  const h = new Date().getHours()
  const momento = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
  const prefijo = ROLE_PREFIX[rol] || ''
  return `${momento}${prefijo ? ', ' + prefijo : ','} ${nombre}`
}

// ── Helper: verifica si un rol puede acceder a una ruta ───────────────────────
export function puedeAcceder(rol, ruta) {
  const permitidos = ROUTE_ROLES[ruta]
  if (!permitidos) return true   // ruta sin restricción definida (ej. '/')
  return permitidos.includes(rol)
}
