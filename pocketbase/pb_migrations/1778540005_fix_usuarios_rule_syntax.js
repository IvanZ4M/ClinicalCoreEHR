/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_882525820")

  // Auth collections use @request.auth.FIELD directly (not @request.auth.record.FIELD)
  unmarshal({
    "listRule":   "@request.auth.id != ''",
    "viewRule":   "@request.auth.id != ''",
    "createRule": "@request.auth.rol = 'administrador'",
    "updateRule": "id = @request.auth.id || @request.auth.rol = 'administrador'",
    "deleteRule": "@request.auth.rol = 'administrador'",
    "manageRule": "@request.auth.rol = 'administrador'"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_882525820")

  unmarshal({
    "listRule":   null,
    "viewRule":   null,
    "createRule": null,
    "updateRule": "id = @request.auth.id",
    "deleteRule": null,
    "manageRule": null
  }, collection)

  return app.save(collection)
})
