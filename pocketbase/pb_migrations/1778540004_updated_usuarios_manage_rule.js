/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_882525820")

  // manageRule grants admins full access to auth records including hidden fields
  // like email, which PocketBase hides by default (emailVisibility: false).
  unmarshal({
    "manageRule": "@request.auth.record.rol = 'administrador'"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_882525820")

  unmarshal({
    "manageRule": null
  }, collection)

  return app.save(collection)
})
