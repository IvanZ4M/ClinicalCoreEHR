#!/usr/bin/env node
/**
 * seed-demo.js — reinicia la base a un estado de demostración conocido.
 *
 * POR QUÉ EXISTE
 * La base de desarrollo contenía datos personales REALES (nombres, correos y
 * teléfonos de personas de verdad) y CURPs inválidas de relleno. Proyectar eso
 * ante un jurado, en un sistema cuya tesis trata sobre proteger datos de
 * pacientes, es indefendible. Este script deja un padrón íntegramente ficticio,
 * con CURPs que pasan el validador oficial del sistema.
 *
 * Además sirve como red de seguridad: si la demo se ensucia durante los
 * ensayos, se reinicia a un estado limpio en segundos.
 *
 * USO
 *   node scripts/seed-demo.js --wipe
 *
 * Requiere credenciales de SUPERUSUARIO de PocketBase por variables de entorno
 * (las reglas de borrado están en `null` y solo un superusuario puede saltarlas):
 *
 *   PB_SU_EMAIL=tu@correo PB_SU_PASS=tuclave node scripts/seed-demo.js --wipe
 *
 * NO borra la colección `usuarios`: las cuentas de médico, enfermera,
 * recepcionista y administrador se conservan.
 */

const PB = process.env.PB_URL || 'http://127.0.0.1:8090'
const SU_EMAIL = process.env.PB_SU_EMAIL
const SU_PASS  = process.env.PB_SU_PASS
const WIPE     = process.argv.includes('--wipe')

// ── Personal de la clínica (ids reales de la colección usuarios) ─────────────
const MEDICOS = [
  { id: 'xihagapooqo52a8', nombre: 'Vania camacho',  consultorio: 'Consultorio 1' },
  { id: 'y2u8sexhewh6jcm', nombre: 'Alberto Parga',  consultorio: 'Consultorio 2' },
]
const ENFERMERA_ID = '13wcez7rzq0p22v'

// ── Catálogos ────────────────────────────────────────────────────────────────
const NOMBRES_H = ['Santiago','Mateo','Sebastián','Leonardo','Emiliano','Diego','Miguel Ángel','Ricardo','Fernando','Javier','Alejandro','Rodrigo','Andrés','Tomás','Gabriel']
const NOMBRES_M = ['Sofía','Valentina','Regina','Camila','Renata','María José','Ximena','Fernanda','Daniela','Paulina','Adriana','Mariana','Lucía','Elena','Carmen']
const PATERNOS  = ['Herrera','Villalobos','Nájera','Quintero','Bermúdez','Salcedo','Peralta','Ordóñez','Zepeda','Maldonado','Rincón','Gallegos','Cisneros','Bustamante','Verduzco']
const MATERNOS  = ['Fuentes','Aguirre','Cordero','Robledo','Escalante','Cervantes','Montiel','Solórzano','Zavala','Barajas','Íñiguez','Lozano','Cabrera','Domínguez','Estrada']
const ESTADOS   = ['CL','DG','ZS','NL','JC','GT','SL','CH']
const SANGRE    = ['O+','O-','A+','A-','B+','B-','AB+','AB-']

const ALERGIAS_CRITICAS = ['Penicilina', 'Sulfamidas', 'Látex', 'Mariscos']
const ALERGIAS_LEVES    = ['Polen', 'Ácaros del polvo', 'Ibuprofeno', 'Nueces']

// Los diagnósticos se reparten por edad. Sin esto el generador producía
// disparates clínicos —una bebé de un año con hipertensión, hiperlipidemia y
// ansiedad generalizada— que cualquier sinodal detecta en la primera mirada.
const CIE10_PEDIATRICO = [
  ['J00','Nasofaringitis aguda (resfriado común)'], ['J06.9','Infección aguda de vías respiratorias superiores'],
  ['A09','Diarrea y gastroenteritis infecciosa'],   ['L30.9','Dermatitis no especificada'],
  ['J45.9','Asma no especificada'],                 ['J30.1','Rinitis alérgica'],
  ['Z00.0','Examen médico general (chequeo)'],
]
const CIE10_ADULTO = [
  ...CIE10_PEDIATRICO,
  ['M54.5','Lumbago (dolor lumbar)'],               ['R51','Cefalea (dolor de cabeza)'],
  ['N39.0','Infección de vías urinarias'],          ['K21.0','Enfermedad por reflujo gastroesofágico'],
  ['F41.1','Trastorno de ansiedad generalizada'],
]
// Crónicos de adulto: solo a partir de los 35 años.
const CIE10_CRONICO_ADULTO = [
  ['I10','Hipertensión esencial (primaria)'],       ['E11.9','Diabetes mellitus tipo 2 sin complicaciones'],
  ['E78.5','Hiperlipidemia no especificada'],       ['E66.0','Obesidad por exceso de calorías'],
]
const CRONICOS = new Set(['I10','E11.9','J45.9','E78.5','E66.0'])

/** Catálogo de diagnósticos admisible para una edad dada. */
function catalogoPorEdad(edad) {
  if (edad < 12) return CIE10_PEDIATRICO
  if (edad < 35) return CIE10_ADULTO
  return [...CIE10_ADULTO, ...CIE10_CRONICO_ADULTO, ...CIE10_CRONICO_ADULTO] // crónicos con más peso
}

/**
 * Signos vitales plausibles para la edad. Un lactante no pesa 70 kg ni tiene
 * una tensión de 120/80: los rangos siguen valores pediátricos de referencia.
 */
function signosPorEdad(edad) {
  let peso, talla, fc, sis, dia
  if (edad < 1)       { peso = ent(4, 10);   talla = ent(50, 76);   fc = ent(100, 155); sis = ent(72, 92);   dia = ent(40, 58) }
  else if (edad < 3)  { peso = ent(9, 15);   talla = ent(72, 96);   fc = ent(92, 140);  sis = ent(84, 100);  dia = ent(46, 62) }
  else if (edad < 6)  { peso = ent(14, 21);  talla = ent(94, 116);  fc = ent(88, 126);  sis = ent(90, 106);  dia = ent(52, 68) }
  else if (edad < 12) { peso = ent(21, 42);  talla = ent(113, 148); fc = ent(74, 112);  sis = ent(96, 112);  dia = ent(56, 72) }
  else if (edad < 18) { peso = ent(43, 72);  talla = ent(148, 178); fc = ent(62, 100);  sis = ent(104, 124); dia = ent(62, 78) }
  else if (edad < 65) { peso = ent(55, 96);  talla = ent(152, 186); fc = ent(58, 96);   sis = ent(108, 142); dia = ent(66, 90) }
  else                { peso = ent(50, 88);  talla = ent(148, 176); fc = ent(56, 92);   sis = ent(116, 152); dia = ent(68, 92) }
  return {
    presion_arterial: `${sis}/${dia}`,
    temperatura: (36 + Math.random() * 1.3).toFixed(1),
    frecuencia_cardiaca: String(fc),
    peso: String(peso),
    talla: String(talla),
    saturacion_o2: String(ent(94, 99)),
  }
}

/** Edad en años cumplidos a partir de la fecha almacenada en el paciente. */
function edadDe(paciente) {
  const nac = new Date(paciente.fecha_nacimiento)
  const hoy = new Date()
  let e = hoy.getFullYear() - nac.getFullYear()
  const m = hoy.getMonth() - nac.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) e--
  return e
}

const MEDICAMENTOS = [
  { nombre:'Paracetamol',  dosis:'500mg', via:'oral', frecuencia:'Cada 8 horas',        duracion:'5 días' },
  { nombre:'Amoxicilina',  dosis:'500mg', via:'oral', frecuencia:'Cada 8 horas',        duracion:'7 días' },
  { nombre:'Losartán',     dosis:'50mg',  via:'oral', frecuencia:'Una vez al día',      duracion:'Permanente' },
  { nombre:'Metformina',   dosis:'850mg', via:'oral', frecuencia:'Con cada comida',     duracion:'Permanente' },
  { nombre:'Omeprazol',    dosis:'20mg',  via:'oral', frecuencia:'En ayunas',           duracion:'14 días' },
  { nombre:'Loratadina',   dosis:'10mg',  via:'oral', frecuencia:'Una vez al día',      duracion:'10 días' },
  { nombre:'Ibuprofeno',   dosis:'400mg', via:'oral', frecuencia:'Cada 8 horas',        duracion:'3 días' },
  { nombre:'Salbutamol',   dosis:'100mcg',via:'inhalada', frecuencia:'Según necesidad', duracion:'Permanente' },
]

// Antihipertensivos, metformina y omeprazol no se prescriben a un niño en una
// consulta general: se restringen igual que los diagnósticos.
const MEDICAMENTOS_PEDIATRICOS = ['Paracetamol', 'Amoxicilina', 'Loratadina', 'Salbutamol', 'Ibuprofeno']
function medicamentosPorEdad(edad) {
  return edad < 12 ? MEDICAMENTOS.filter(m => MEDICAMENTOS_PEDIATRICOS.includes(m.nombre)) : MEDICAMENTOS
}

const MOTIVOS = [
  'Dolor de cabeza persistente desde hace tres días, sin fiebre asociada.',
  'Control de presión arterial. Refiere buen apego al tratamiento.',
  'Tos seca y congestión nasal de una semana de evolución.',
  'Revisión de rutina. Paciente asintomático.',
  'Dolor lumbar tras esfuerzo físico. Sin irradiación a miembros inferiores.',
  'Ardor al orinar y aumento en la frecuencia urinaria desde hace dos días.',
  'Control de diabetes. Trae resultados de laboratorio recientes.',
  'Molestia estomacal y reflujo después de las comidas.',
]
const EXPLORACIONES = [
  'Paciente consciente, orientado y cooperador. Buen estado general. Campos pulmonares bien ventilados, sin agregados. Ruidos cardíacos rítmicos.',
  'Faringe hiperémica sin exudados. Adenopatías cervicales pequeñas y móviles. Resto de la exploración sin alteraciones.',
  'Abdomen blando, depresible, no doloroso a la palpación. Peristalsis presente. Sin visceromegalias.',
  'Movilidad de columna lumbar limitada por dolor. Lasègue negativo bilateral. Fuerza y sensibilidad conservadas.',
]
const PLANES = [
  'Continuar tratamiento indicado. Reposo relativo e hidratación abundante. Cita de seguimiento en dos semanas.',
  'Mantener dieta hiposódica y caminata diaria de 30 minutos. Monitoreo de presión en casa. Control en un mes.',
  'Se solicita biometría hemática y química sanguínea. Reevaluar con resultados.',
  'Medidas generales, control de peso y actividad física. Acudir a urgencias si aparece fiebre o dolor intenso.',
]

// ── Utilidades ───────────────────────────────────────────────────────────────
const al   = (a) => a[Math.floor(Math.random() * a.length)]
const ent  = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const pad  = (n, l = 2) => String(n).padStart(l, '0')
const fmt  = (d) => d.toISOString().replace('T', ' ').slice(0, 19)

const VOCALES    = 'AEIOU'
const CONSONANTE = /[BCDFGHJKLMNPQRSTVWXYZ]/

/** Genera una CURP con la estructura oficial, derivada del nombre y la fecha. */
function generarCURP(nombre, paterno, materno, fechaNac, sexo, estado) {
  const limpia = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z ]/g, '')
  const P = limpia(paterno), M = limpia(materno), N = limpia(nombre).split(' ')[0]

  const vocalInterna = (s) => { for (let i = 1; i < s.length; i++) if (VOCALES.includes(s[i])) return s[i]; return 'X' }
  const consInterna  = (s) => { for (let i = 1; i < s.length; i++) if (CONSONANTE.test(s[i])) return s[i]; return 'X' }

  const aa = pad(fechaNac.getFullYear() % 100)
  const mm = pad(fechaNac.getMonth() + 1)
  const dd = pad(fechaNac.getDate())
  // Homoclave: dígito para nacidos antes de 2000, letra a partir de 2000.
  const homo = fechaNac.getFullYear() < 2000 ? String(ent(0, 9)) : al('ABCDEFGHIJKLMNPQRSTUVWXYZ'.split(''))

  return `${P[0]}${vocalInterna(P)}${M[0]}${N[0]}${aa}${mm}${dd}${sexo === 'masculino' ? 'H' : 'M'}${estado}${consInterna(P)}${consInterna(M)}${consInterna(N)}${homo}${ent(0, 9)}`
}

// ── Cliente HTTP ─────────────────────────────────────────────────────────────
let TOKEN = ''
async function api(ruta, opciones = {}) {
  const r = await fetch(`${PB}${ruta}`, {
    ...opciones,
    headers: { 'Content-Type': 'application/json', ...(TOKEN && { Authorization: TOKEN }), ...opciones.headers },
  })
  if (!r.ok) {
    const cuerpo = await r.text()
    throw new Error(`${opciones.method || 'GET'} ${ruta} → ${r.status}\n${cuerpo.slice(0, 400)}`)
  }
  return r.status === 204 ? null : r.json()
}
const crear = (col, datos) => api(`/api/collections/${col}/records`, { method: 'POST', body: JSON.stringify(datos) })

async function vaciar(col) {
  let borrados = 0
  for (;;) {
    const r = await api(`/api/collections/${col}/records?perPage=200`)
    if (!r.items.length) break
    for (const item of r.items) {
      await api(`/api/collections/${col}/records/${item.id}`, { method: 'DELETE' })
      borrados++
    }
  }
  console.log(`   ${col.padEnd(15)} ${borrados} registros eliminados`)
}

// ── Programa principal ───────────────────────────────────────────────────────
async function main() {
  if (!SU_EMAIL || !SU_PASS) {
    console.error(`
ERROR: faltan las credenciales de superusuario de PocketBase.

Las reglas de borrado están en 'null', así que solo un superusuario puede
vaciar las colecciones. Ejecuta:

  PB_SU_EMAIL=tu@correo PB_SU_PASS=tuclave node scripts/seed-demo.js --wipe

(en PowerShell:  $env:PB_SU_EMAIL="tu@correo"; $env:PB_SU_PASS="tuclave"; node scripts/seed-demo.js --wipe)

Si no recuerdas el superusuario, créalo con:
  cd pocketbase && ./pocketbase.exe superuser create tu@correo tuclave
`)
    process.exit(1)
  }

  console.log(`\nConectando a ${PB}…`)
  const auth = await api('/api/collections/_superusers/auth-with-password', {
    method: 'POST', body: JSON.stringify({ identity: SU_EMAIL, password: SU_PASS }),
  })
  TOKEN = auth.token
  console.log('Autenticado como superusuario.\n')

  // 1 ── Respaldo antes de tocar nada
  console.log('1. Respaldo de seguridad…')
  try {
    const nombre = `respaldo_previo_seed_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.zip`
    await api('/api/backups', { method: 'POST', body: JSON.stringify({ name: nombre }) })
    console.log(`   creado: ${nombre}`)
    console.log('   (se descarga desde el panel /_/ → Settings → Backups)\n')
  } catch (e) {
    console.log(`   AVISO: no se pudo crear el respaldo automático (${e.message.split('\n')[0]})`)
    console.log('   Continúa bajo tu responsabilidad, o cancela con Ctrl+C.\n')
  }

  // 2 ── Vaciado
  if (WIPE) {
    console.log('2. Vaciando datos clínicos (se conserva la colección usuarios)…')
    for (const col of ['triage', 'recetas', 'diagnosticos', 'consultas', 'notificaciones', 'citas', 'pacientes', 'audit_log']) {
      try { await vaciar(col) } catch (e) { console.log(`   ${col}: omitida (${e.message.split('\n')[0]})`) }
    }
    console.log()
  } else {
    console.log('2. Vaciado OMITIDO (pasa --wipe para borrar los datos existentes)\n')
  }

  // 3 ── Pacientes
  console.log('3. Creando 30 pacientes…')
  const hoy = new Date()
  const pacientes = []
  for (let i = 0; i < 30; i++) {
    const sexo    = Math.random() < 0.52 ? 'femenino' : 'masculino'
    const nombre  = sexo === 'femenino' ? al(NOMBRES_M) : al(NOMBRES_H)
    const paterno = al(PATERNOS), materno = al(MATERNOS)
    // Distribución de edad realista para consultorio general con pediatría:
    // 25% menores, 45% adultos jóvenes, 20% mediana edad, 10% adultos mayores.
    const r = Math.random()
    const edad = r < 0.25 ? ent(1, 17) : r < 0.70 ? ent(18, 39) : r < 0.90 ? ent(40, 64) : ent(65, 88)
    const nac = new Date(hoy.getFullYear() - edad, ent(0, 11), ent(1, 28))
    const estado = al(ESTADOS)

    const critica = i % 9 === 0
    const conAlergia = critica || i % 4 === 0

    pacientes.push(await crear('pacientes', {
      nombre, apellidos: `${paterno} ${materno}`,
      curp: generarCURP(nombre, paterno, materno, nac, sexo, estado),
      fecha_nacimiento: fmt(nac),
      sexo,
      telefono: `871${ent(1000000, 9999999)}`,
      email: `${nombre.split(' ')[0].toLowerCase()}.${paterno.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}@correo.mx`,
      grupo_sanguineo: al(SANGRE),
      alergias: conAlergia ? (critica ? al(ALERGIAS_CRITICAS) : al(ALERGIAS_LEVES)) : '',
      alergias_criticas: critica,
      activo: true,
    }))
  }
  console.log(`   ${pacientes.length} pacientes creados con CURP válida\n`)

  // 4 ── Historial: citas completadas + consultas + diagnósticos + recetas
  console.log('4. Generando historial clínico de los últimos 6 meses…')
  let nConsultas = 0, nDx = 0, nRec = 0
  for (let dias = 175; dias >= 1; dias -= 1) {
    // Sin actividad en domingo; volumen variable el resto de la semana.
    const fecha = new Date(hoy); fecha.setDate(hoy.getDate() - dias)
    if (fecha.getDay() === 0) continue
    if (Math.random() > 0.45) continue

    for (let k = 0; k < ent(1, 3); k++) {
      const medico   = al(MEDICOS)
      const paciente = al(pacientes)
      const hora = new Date(fecha); hora.setHours(ent(8, 18), al([0, 30]), 0, 0)

      const cita = await crear('citas', {
        paciente: paciente.id, medico: medico.id, fecha_hora: fmt(hora),
        tipo: al(['consulta_general','seguimiento','revision','chequeo']),
        consultorio: medico.consultorio, estado: 'completada', notas: '',
      })

      const edad = edadDe(paciente)
      const catalogo = catalogoPorEdad(edad)

      const consulta = await crear('consultas', {
        cita: cita.id, paciente: paciente.id, medico: medico.id, fecha: fmt(hora),
        motivo: al(MOTIVOS),
        exploracion_fisica: al(EXPLORACIONES),
        plan_tratamiento: al(PLANES),
        signos_vitales: signosPorEdad(edad),
        estado: 'completada',
      })
      nConsultas++

      const principal = al(catalogo)
      await crear('diagnosticos', {
        consulta: consulta.id, codigo_cie10: principal[0], descripcion: principal[1],
        tipo: 'principal', estado: CRONICOS.has(principal[0]) ? 'cronico' : 'activo',
      })
      nDx++
      if (Math.random() < 0.3) {
        const sec = al(catalogo)
        if (sec[0] !== principal[0]) {
          await crear('diagnosticos', {
            consulta: consulta.id, codigo_cie10: sec[0], descripcion: sec[1],
            tipo: 'secundario', estado: CRONICOS.has(sec[0]) ? 'cronico' : 'activo',
          })
          nDx++
        }
      }

      if (Math.random() < 0.65) {
        const permitidos = medicamentosPorEdad(edad)
        const meds = [al(permitidos)]
        if (Math.random() < 0.4) { const m2 = al(permitidos); if (m2.nombre !== meds[0].nombre) meds.push(m2) }
        await crear('recetas', {
          consulta: consulta.id, paciente: paciente.id, medico: medico.id,
          medicamentos: meds.map(m => ({ ...m, indicaciones: 'Tomar con alimentos.' })),
          indicaciones: al(PLANES),
        })
        nRec++
      }
    }
  }
  console.log(`   ${nConsultas} consultas · ${nDx} diagnósticos · ${nRec} recetas\n`)

  // 5 ── Agenda de HOY: el flujo completo, visible en la demo
  console.log('5. Creando la agenda de hoy…')
  const guion = [
    { h: 9,  m: 0,  estado: 'completada'  },
    { h: 9,  m: 30, estado: 'completada'  },
    { h: 10, m: 0,  estado: 'en_consulta' },
    { h: 10, m: 30, estado: 'en_sala'     },
    { h: 11, m: 0,  estado: 'en_sala'     },
    { h: 11, m: 30, estado: 'confirmada'  },
    { h: 12, m: 0,  estado: 'programada'  },
    { h: 12, m: 30, estado: 'programada'  },
    { h: 16, m: 0,  estado: 'programada'  },
    { h: 16, m: 30, estado: 'programada'  },
  ]
  let nTriage = 0
  for (let i = 0; i < guion.length; i++) {
    const { h, m, estado } = guion[i]
    const medico   = MEDICOS[i % MEDICOS.length]
    const paciente = pacientes[i]
    const hora = new Date(hoy); hora.setHours(h, m, 0, 0)

    const cita = await crear('citas', {
      paciente: paciente.id, medico: medico.id, fecha_hora: fmt(hora),
      tipo: al(['consulta_general','seguimiento','urgencia','revision']),
      consultorio: medico.consultorio, estado, notas: '',
    })

    const edad = edadDe(paciente)
    const sv = signosPorEdad(edad)

    // Triage de enfermería para quien ya pasó por la sala.
    if (['en_sala','en_consulta','completada'].includes(estado)) {
      await crear('triage', {
        cita_id: cita.id, paciente_id: paciente.id, enfermera_id: ENFERMERA_ID,
        presion_arterial: sv.presion_arterial,
        temperatura: sv.temperatura,
        frecuencia_cardiaca: sv.frecuencia_cardiaca,
        // La frecuencia respiratoria también depende de la edad:
        // un lactante respira mucho más rápido que un adulto.
        frecuencia_respiratoria: String(edad < 1 ? ent(30, 55) : edad < 6 ? ent(22, 34) : edad < 12 ? ent(18, 26) : ent(12, 20)),
        saturacion_oxigeno: sv.saturacion_o2,
        peso: sv.peso, talla: sv.talla,
        queja_principal: al(MOTIVOS),
        notas_enfermeria: edad < 12
          ? 'Paciente acompañado por su madre. Estable, buen estado general.'
          : 'Paciente estable, deambula sin apoyo.',
        estado: 'completado',
      })
      nTriage++
    }

    if (estado === 'completada') {
      const consulta = await crear('consultas', {
        cita: cita.id, paciente: paciente.id, medico: medico.id, fecha: fmt(hora),
        motivo: al(MOTIVOS), exploracion_fisica: al(EXPLORACIONES), plan_tratamiento: al(PLANES),
        signos_vitales: sv,
        estado: 'completada',
      })
      const dx = al(catalogoPorEdad(edad))
      await crear('diagnosticos', {
        consulta: consulta.id, codigo_cie10: dx[0], descripcion: dx[1],
        tipo: 'principal', estado: CRONICOS.has(dx[0]) ? 'cronico' : 'activo',
      })
      nConsultas++; nDx++
    }
  }
  console.log(`   ${guion.length} citas hoy · ${nTriage} triages de enfermería\n`)

  // 6 ── Agenda futura
  console.log('6. Creando agenda de las próximas dos semanas…')
  let futuras = 0
  for (let d = 1; d <= 14; d++) {
    const fecha = new Date(hoy); fecha.setDate(hoy.getDate() + d)
    if (fecha.getDay() === 0) continue
    for (let k = 0; k < ent(1, 3); k++) {
      const medico = al(MEDICOS)
      const hora = new Date(fecha); hora.setHours(ent(8, 18), al([0, 30]), 0, 0)
      await crear('citas', {
        paciente: al(pacientes).id, medico: medico.id, fecha_hora: fmt(hora),
        tipo: al(['consulta_general','seguimiento','revision','chequeo']),
        consultorio: medico.consultorio,
        estado: al(['programada','programada','confirmada']), notas: '',
      })
      futuras++
    }
  }
  console.log(`   ${futuras} citas futuras\n`)

  console.log('════════════════════════════════════════════')
  console.log('  Demo lista.')
  console.log(`  ${pacientes.length} pacientes · ${nConsultas} consultas · ${nDx} diagnósticos`)
  console.log(`  ${nRec} recetas · ${guion.length} citas hoy · ${futuras} citas futuras`)
  console.log('════════════════════════════════════════════\n')
}

main().catch(e => { console.error('\nFALLÓ:', e.message); process.exit(1) })
