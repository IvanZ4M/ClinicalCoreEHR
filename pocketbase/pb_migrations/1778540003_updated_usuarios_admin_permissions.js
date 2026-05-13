/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_882525820")

  unmarshal({
    // Admin can create new users; users cannot self-register
    "createRule": "@request.auth.record.rol = 'administrador'",
    // Admin can update any user; each user can update their own record
    "updateRule": "id = @request.auth.id || @request.auth.record.rol = 'administrador'",
    // Admin can delete users
    "deleteRule": "@request.auth.record.rol = 'administrador'"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_882525820")

  unmarshal({
    "createRule": null,
    "updateRule": "id = @request.auth.id",
    "deleteRule": null
  }, collection)

  return app.save(collection)
})
