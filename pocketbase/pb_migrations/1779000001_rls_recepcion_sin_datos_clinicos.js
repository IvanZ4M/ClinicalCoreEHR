/// <reference path="../pb_data/types.d.ts" />
// VULN-FIX (ÁREA 8): la recepcionista deja de ver diagnósticos y recetas.
//
// Principio de mínimo privilegio: recepción agenda citas y registra pacientes;
// no necesita el contenido clínico del expediente. Hasta ahora leía los 19
// diagnósticos y las 10 recetas completas, con medicamentos e indicaciones.
//
// La enfermera SÍ conserva el acceso: hace el triage y necesita conocer las
// condiciones crónicas y la medicación en curso para interpretar los signos
// vitales. El médico sigue viendo solo lo suyo; el administrador, todo.
//
// Efecto en la interfaz: en PatientDetail la tarjeta "Condiciones Actuales"
// quedará vacía para recepción, que es el comportamiento correcto.
migrate((app) => {
  const REGLA_CLINICA =
    "@request.auth.id != '' && @request.auth.rol != 'recepcionista' && " +
    "(@request.auth.rol != 'medico' || consulta.medico = @request.auth.id)"

  const diagnosticos = app.findCollectionByNameOrId("pbc_873124731")
  unmarshal({ "listRule": REGLA_CLINICA, "viewRule": REGLA_CLINICA }, diagnosticos)
  app.save(diagnosticos)

  const recetas = app.findCollectionByNameOrId("pbc_461983551")
  unmarshal({ "listRule": REGLA_CLINICA, "viewRule": REGLA_CLINICA }, recetas)
  app.save(recetas)
}, (app) => {
  // revert: vuelve a permitir a recepción (estado de la migración anterior)
  const ANTERIOR =
    "@request.auth.id != '' && (@request.auth.rol != 'medico' || consulta.medico = @request.auth.id)"

  const diagnosticos = app.findCollectionByNameOrId("pbc_873124731")
  unmarshal({ "listRule": ANTERIOR, "viewRule": ANTERIOR }, diagnosticos)
  app.save(diagnosticos)

  const recetas = app.findCollectionByNameOrId("pbc_461983551")
  unmarshal({ "listRule": ANTERIOR, "viewRule": ANTERIOR }, recetas)
  app.save(recetas)
})
