/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3500000001")

  // Fix rule syntax: use @request.auth.FIELD directly, not @request.auth.record.FIELD
  unmarshal({
    "createRule": "@request.auth.rol = 'enfermera'",
    "updateRule": "@request.auth.rol = 'enfermera'",
    "listRule":   "@request.auth.rol = 'medico' || @request.auth.rol = 'enfermera' || @request.auth.rol = 'administrador'",
    "viewRule":   "@request.auth.rol = 'medico' || @request.auth.rol = 'enfermera' || @request.auth.rol = 'administrador'",
    "deleteRule": "@request.auth.rol = 'administrador'"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3500000001")

  unmarshal({
    "createRule": "@request.auth.record.rol = 'enfermera'",
    "updateRule": "@request.auth.record.rol = 'enfermera'",
    "listRule":   "@request.auth.record.rol = 'medico' || @request.auth.record.rol = 'enfermera' || @request.auth.record.rol = 'administrador'",
    "viewRule":   "@request.auth.record.rol = 'medico' || @request.auth.record.rol = 'enfermera' || @request.auth.record.rol = 'administrador'",
    "deleteRule": "@request.auth.record.rol = 'administrador'"
  }, collection)

  return app.save(collection)
})
