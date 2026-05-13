/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.id != ''",
    "deleteRule": "usuario_destino = @request.auth.id",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "cascadeDelete": true,
        "collectionId": "pbc_882525820",
        "hidden": false,
        "id": "relation8857461231",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "usuario_destino",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "select7743218431",
        "maxSelect": 1,
        "name": "tipo",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": ["nueva_cita", "paciente_listo", "recordatorio"]
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text8821634521",
        "max": 0,
        "min": 0,
        "name": "mensaje",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_1942636046",
        "hidden": false,
        "id": "relation4928134561",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "cita",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "bool9823456712",
        "name": "leida",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "autodate2990389176",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate3332085495",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "pbc_7831946031",
    "indexes": [],
    "listRule": "usuario_destino = @request.auth.id",
    "name": "notificaciones",
    "system": false,
    "type": "base",
    "updateRule": "usuario_destino = @request.auth.id",
    "viewRule": "usuario_destino = @request.auth.id"
  })

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_7831946031")
  return app.delete(collection)
})
