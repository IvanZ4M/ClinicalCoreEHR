/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_518531199")

  // update collection data
  unmarshal({
    "createRule": "",
    "deleteRule": "",
    "listRule": "",
    "updateRule": "",
    "viewRule": ""
  }, collection)

  // update field
  collection.fields.addAt(6, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text4205952851",
    "max": 500,
    "min": 10,
    "name": "exploracion_fisica",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // update field
  collection.fields.addAt(7, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text2501736471",
    "max": 500,
    "min": 10,
    "name": "plan_tratamiento",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_518531199")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != ''",
    "deleteRule": "@request.auth.rol = 'administrador'",
    "listRule": "@request.auth.id != '' && (@request.auth.rol != 'medico' || medico = @request.auth.id)",
    "updateRule": "@request.auth.id != '' && (@request.auth.rol != 'medico' || medico = @request.auth.id)",
    "viewRule": "@request.auth.id != '' && (@request.auth.rol != 'medico' || medico = @request.auth.id)"
  }, collection)

  // update field
  collection.fields.addAt(6, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text4205952851",
    "max": 0,
    "min": 0,
    "name": "exploracion_fisica",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // update field
  collection.fields.addAt(7, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text2501736471",
    "max": 0,
    "min": 0,
    "name": "plan_tratamiento",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
})
