/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1942636046")

  unmarshal({
    "fields": [
      {
        "hidden": false,
        "id": "select643686883",
        "maxSelect": 0,
        "name": "estado",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "programada",
          "confirmada",
          "en_sala",
          "en_consulta",
          "completada",
          "cancelada",
          "no_acudio"
        ]
      }
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1942636046")

  unmarshal({
    "fields": [
      {
        "hidden": false,
        "id": "select643686883",
        "maxSelect": 0,
        "name": "estado",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "programada",
          "confirmada",
          "en_sala",
          "en_consulta",
          "completada",
          "cancelada"
        ]
      }
    ]
  }, collection)

  return app.save(collection)
})
