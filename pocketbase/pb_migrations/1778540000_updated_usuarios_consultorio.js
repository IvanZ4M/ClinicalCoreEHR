/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_882525820")

  // Allow any authenticated user to list and view users (needed for medico dropdown in citas)
  unmarshal({
    "listRule": "@request.auth.id != ''",
    "viewRule": "@request.auth.id != ''"
  }, collection)

  // Add consultorio text field to usuarios so each doctor can have one assigned
  collection.fields.add(new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text4293847651",
    "max": 0,
    "min": 0,
    "name": "consultorio",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_882525820")

  unmarshal({
    "listRule": null,
    "viewRule": null
  }, collection)

  collection.fields.removeById("text4293847651")

  return app.save(collection)
})
