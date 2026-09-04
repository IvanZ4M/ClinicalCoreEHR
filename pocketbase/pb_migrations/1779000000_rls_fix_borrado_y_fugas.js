/// <reference path="../pb_data/types.d.ts" />
// VULN-FIX (ÁREA 8): corrige cuatro fallos de control de acceso verificados
// contra la API en vivo el 29/08/2026.
//
// 1. `deleteRule: ""` NO significa "nadie borra" — en PocketBase la cadena vacía
//    significa "todos pueden". Verificado: una enfermera borró un paciente
//    (HTTP 204). Los expedientes actuales solo sobrevivían por integridad
//    referencial, no por las reglas. Para bloquear de verdad hay que usar `null`,
//    que reserva la acción a superusuarios del panel /_/.
//
// 2. `diagnosticos` no tenía reglas: un médico leía los diagnósticos de las
//    consultas de OTRO médico. Verificado con dos cuentas distintas.
//
// 3. `recetas` igual: recetas completas (medicamentos e indicaciones) visibles
//    para cualquier usuario autenticado.
//
// 4. `audit_log` era mutable y borrable pese a documentarse como inmutable.
//
// Las reglas de diagnosticos y recetas ESPEJAN las de consultas: el médico solo
// alcanza lo suyo; los demás roles conservan el acceso que ya tenían, para no
// romper pantallas existentes.
migrate((app) => {
  // ── pacientes — nadie borra (ahora de verdad) ─────────────────────────────
  const pacientes = app.findCollectionByNameOrId("pbc_4080049865")
  unmarshal({ "deleteRule": null }, pacientes)
  app.save(pacientes)

  // ── consultas — nadie borra (ahora de verdad) ─────────────────────────────
  const consultas = app.findCollectionByNameOrId("pbc_518531199")
  unmarshal({ "deleteRule": null }, consultas)
  app.save(consultas)

  // ── diagnosticos — heredan la confidencialidad de su consulta ─────────────
  const diagnosticos = app.findCollectionByNameOrId("pbc_873124731")
  unmarshal({
    "listRule":   "@request.auth.id != '' && (@request.auth.rol != 'medico' || consulta.medico = @request.auth.id)",
    "viewRule":   "@request.auth.id != '' && (@request.auth.rol != 'medico' || consulta.medico = @request.auth.id)",
    "createRule": "@request.auth.id != '' && @request.auth.rol = 'medico'",
    "updateRule": "@request.auth.id != '' && (@request.auth.rol = 'administrador' || consulta.medico = @request.auth.id)",
    "deleteRule": null
  }, diagnosticos)
  app.save(diagnosticos)

  // ── recetas — heredan la confidencialidad de su consulta ──────────────────
  const recetas = app.findCollectionByNameOrId("pbc_461983551")
  unmarshal({
    "listRule":   "@request.auth.id != '' && (@request.auth.rol != 'medico' || consulta.medico = @request.auth.id)",
    "viewRule":   "@request.auth.id != '' && (@request.auth.rol != 'medico' || consulta.medico = @request.auth.id)",
    "createRule": "@request.auth.id != '' && @request.auth.rol = 'medico'",
    "updateRule": "@request.auth.id != '' && (@request.auth.rol = 'administrador' || consulta.medico = @request.auth.id)",
    "deleteRule": null
  }, recetas)
  app.save(recetas)

  // ── audit_log — inmutable de verdad: se crea, se lee, jamás se altera ─────
  const auditLog = app.findCollectionByNameOrId("pbc_9100000001")
  unmarshal({
    "createRule": "@request.auth.id != ''",
    "listRule":   "@request.auth.rol = 'administrador'",
    "viewRule":   "@request.auth.rol = 'administrador'",
    "updateRule": null,
    "deleteRule": null
  }, auditLog)
  app.save(auditLog)
}, (app) => {
  // revert: restaura el estado anterior (inseguro — solo para rollback)
  const pacientes = app.findCollectionByNameOrId("pbc_4080049865")
  unmarshal({ "deleteRule": "" }, pacientes)
  app.save(pacientes)

  const consultas = app.findCollectionByNameOrId("pbc_518531199")
  unmarshal({ "deleteRule": "" }, consultas)
  app.save(consultas)

  const diagnosticos = app.findCollectionByNameOrId("pbc_873124731")
  unmarshal({
    "listRule": null, "viewRule": null, "createRule": null,
    "updateRule": null, "deleteRule": ""
  }, diagnosticos)
  app.save(diagnosticos)

  const recetas = app.findCollectionByNameOrId("pbc_461983551")
  unmarshal({
    "listRule": null, "viewRule": null, "createRule": null,
    "updateRule": null, "deleteRule": ""
  }, recetas)
  app.save(recetas)

  const auditLog = app.findCollectionByNameOrId("pbc_9100000001")
  unmarshal({ "updateRule": "", "deleteRule": "" }, auditLog)
  app.save(auditLog)
})
