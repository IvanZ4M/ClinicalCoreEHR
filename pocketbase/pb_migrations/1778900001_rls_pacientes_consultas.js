/// <reference path="../pb_data/types.d.ts" />
// VULN-FIX (ÁREA 2): reglas de acceso explícitas para pacientes y consultas.
// pacientes — todos los autenticados leen; solo recepción/admin crean;
//   médicos, recepción y admin actualizan; NADIE borra (integridad del expediente).
// consultas — solo médico propietario y admin leen/actualizan;
//   solo médicos crean; NADIE borra (integridad clínica).
migrate((app) => {
  // ── pacientes ──────────────────────────────────────────────────────────────
  const pacientes = app.findCollectionByNameOrId("pbc_4080049865")
  unmarshal({
    "listRule":   "@request.auth.id != ''",
    "viewRule":   "@request.auth.id != ''",
    "createRule": "@request.auth.id != '' && (@request.auth.rol = 'recepcionista' || @request.auth.rol = 'administrador')",
    "updateRule": "@request.auth.id != '' && (@request.auth.rol = 'recepcionista' || @request.auth.rol = 'administrador' || @request.auth.rol = 'medico')",
    "deleteRule": ""
  }, pacientes)
  app.save(pacientes)

  // ── consultas — deleteRule vacío: nadie puede borrar consultas ─────────────
  const consultas = app.findCollectionByNameOrId("pbc_518531199")
  unmarshal({
    "listRule":   "@request.auth.id != '' && (@request.auth.rol != 'medico' || medico = @request.auth.id)",
    "viewRule":   "@request.auth.id != '' && (@request.auth.rol != 'medico' || medico = @request.auth.id)",
    "createRule": "@request.auth.id != '' && @request.auth.rol = 'medico'",
    "updateRule": "@request.auth.id != '' && (@request.auth.rol = 'administrador' || medico = @request.auth.id)",
    "deleteRule": ""
  }, consultas)
  app.save(consultas)
}, (app) => {
  // revert: volver a reglas anteriores
  const pacientes = app.findCollectionByNameOrId("pbc_4080049865")
  unmarshal({ "listRule": null, "viewRule": null, "createRule": null, "updateRule": null, "deleteRule": null }, pacientes)
  app.save(pacientes)

  const consultas = app.findCollectionByNameOrId("pbc_518531199")
  unmarshal({
    "listRule":   "@request.auth.id != '' && (@request.auth.rol != 'medico' || medico = @request.auth.id)",
    "viewRule":   "@request.auth.id != '' && (@request.auth.rol != 'medico' || medico = @request.auth.id)",
    "createRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id != '' && (@request.auth.rol != 'medico' || medico = @request.auth.id)",
    "deleteRule": "@request.auth.rol = 'administrador'"
  }, consultas)
  app.save(consultas)
})
