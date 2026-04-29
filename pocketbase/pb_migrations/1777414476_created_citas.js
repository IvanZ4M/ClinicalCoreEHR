/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": null,
    "deleteRule": null,
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "help": "",
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
        "cascadeDelete": false,
        "collectionId": "pbc_4080049865",
        "help": "",
        "hidden": false,
        "id": "relation3335235934",
        "maxSelect": 0,
        "minSelect": 0,
        "name": "paciente",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_882525820",
        "help": "",
        "hidden": false,
        "id": "relation887460172",
        "maxSelect": 0,
        "minSelect": 0,
        "name": "medico",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
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
      },
      {
        "help": "",
        "hidden": false,
        "id": "select1882004807",
        "maxSelect": 0,
        "name": "tipo",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "consulta_general",
          "seguimiento",
          "urgencia",
          "revision",
          "chequeo"
        ]
      },
      {
        "help": "",
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
      },
      {
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
      },
      {
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
    "id": "pbc_1942636046",
    "indexes": [],
    "listRule": null,
    "name": "citas",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1942636046");

  return app.delete(collection);
})
