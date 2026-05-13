/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1942636046")

  // Migration 1778285002 passed a partial fields[] to unmarshal, replacing the entire
  // fields array and leaving only id + estado in metadata (and SQLite). Re-add all
  // stripped fields so PocketBase issues ALTER TABLE ADD COLUMN for each missing one.

  const toAdd = [
    new Field({
      "cascadeDelete": false,
      "collectionId": "pbc_4080049865",
      "help": "",
      "hidden": false,
      "id": "relation3335235934",
      "maxSelect": 1,
      "minSelect": 0,
      "name": "paciente",
      "presentable": false,
      "required": true,
      "system": false,
      "type": "relation"
    }),
    new Field({
      "cascadeDelete": false,
      "collectionId": "pbc_882525820",
      "help": "",
      "hidden": false,
      "id": "relation887460172",
      "maxSelect": 1,
      "minSelect": 0,
      "name": "medico",
      "presentable": false,
      "required": true,
      "system": false,
      "type": "relation"
    }),
    new Field({
      "help": "",
      "hidden": false,
      "id": "date754245854",
      "max": "",
      "min": "",
      "name": "fecha_hora",
      "presentable": false,
      "required": true,
      "system": false,
      "type": "date"
    }),
    new Field({
      "help": "",
      "hidden": false,
      "id": "select1882004807",
      "maxSelect": 1,
      "name": "tipo",
      "presentable": false,
      "required": true,
      "system": false,
      "type": "select",
      "values": ["consulta_general","seguimiento","urgencia","revision","chequeo"]
    }),
    new Field({
      "autogeneratePattern": "",
      "help": "",
      "hidden": false,
      "id": "text2752861059",
      "max": 0,
      "min": 0,
      "name": "consultorio",
      "pattern": "",
      "presentable": false,
      "primaryKey": false,
      "required": false,
      "system": false,
      "type": "text"
    }),
    new Field({
      "autogeneratePattern": "",
      "help": "",
      "hidden": false,
      "id": "text1702323080",
      "max": 0,
      "min": 0,
      "name": "notas",
      "pattern": "",
      "presentable": false,
      "primaryKey": false,
      "required": false,
      "system": false,
      "type": "text"
    }),
    new Field({
      "hidden": false,
      "id": "autodate2990389176",
      "name": "created",
      "onCreate": true,
      "onUpdate": false,
      "presentable": false,
      "system": false,
      "type": "autodate"
    }),
    new Field({
      "hidden": false,
      "id": "autodate3332085495",
      "name": "updated",
      "onCreate": true,
      "onUpdate": true,
      "presentable": false,
      "system": false,
      "type": "autodate"
    }),
  ]

  for (const field of toAdd) {
    try {
      collection.fields.add(field)
    } catch (_) {
      // field already exists in metadata — skip
    }
  }

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1942636046")

  collection.fields.removeById("relation3335235934")
  collection.fields.removeById("relation887460172")
  collection.fields.removeById("date754245854")
  collection.fields.removeById("select1882004807")
  collection.fields.removeById("text2752861059")
  collection.fields.removeById("text1702323080")
  collection.fields.removeById("autodate2990389176")
  collection.fields.removeById("autodate3332085495")

  return app.save(collection)
})
