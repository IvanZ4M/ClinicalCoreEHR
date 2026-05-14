/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // ── citas ────────────────────────────────────────────────────────────────
  const citas = app.findCollectionByNameOrId("pbc_1942636046")
  unmarshal({
    "listRule":   "@request.auth.id != '' && (@request.auth.rol != 'medico' || medico = @request.auth.id)",
    "viewRule":   "@request.auth.id != '' && (@request.auth.rol != 'medico' || medico = @request.auth.id)",
    "createRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id != '' && (@request.auth.rol != 'medico' || medico = @request.auth.id)",
    "deleteRule": "@request.auth.rol = 'administrador'"
  }, citas)
  app.save(citas)

  // ── consultas ────────────────────────────────────────────────────────────
  const consultas = app.findCollectionByNameOrId("pbc_518531199")
  unmarshal({
    "listRule":   "@request.auth.id != '' && (@request.auth.rol != 'medico' || medico = @request.auth.id)",
    "viewRule":   "@request.auth.id != '' && (@request.auth.rol != 'medico' || medico = @request.auth.id)",
    "createRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id != '' && (@request.auth.rol != 'medico' || medico = @request.auth.id)",
    "deleteRule": "@request.auth.rol = 'administrador'"
  }, consultas)
  app.save(consultas)
}, (app) => {
  // revert to open rules
  const citas = app.findCollectionByNameOrId("pbc_1942636046")
  unmarshal({ "listRule": null, "viewRule": null, "createRule": null, "updateRule": null, "deleteRule": null }, citas)
  app.save(citas)

  const consultas = app.findCollectionByNameOrId("pbc_518531199")
  unmarshal({ "listRule": null, "viewRule": null, "createRule": null, "updateRule": null, "deleteRule": null }, consultas)
  app.save(consultas)
})
