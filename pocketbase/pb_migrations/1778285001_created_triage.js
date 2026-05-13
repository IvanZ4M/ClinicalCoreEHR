/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.record.rol = 'enfermera'",
    "deleteRule":  "@request.auth.record.rol = 'administrador'",
    "listRule":    "@request.auth.record.rol = 'medico' || @request.auth.record.rol = 'enfermera' || @request.auth.record.rol = 'administrador'",
    "updateRule":  "@request.auth.record.rol = 'enfermera'",
    "viewRule":    "@request.auth.record.rol = 'medico' || @request.auth.record.rol = 'enfermera' || @request.auth.record.rol = 'administrador'",
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
        "cascadeDelete": false,
        "collectionId": "pbc_1942636046",
        "hidden": false,
        "id": "relation1110000001",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "cita_id",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_4080049865",
        "hidden": false,
        "id": "relation1110000002",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "paciente_id",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_882525820",
        "hidden": false,
        "id": "relation1110000003",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "enfermera_id",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text1110000004",
        "max": 0,
        "min": 0,
        "name": "presion_arterial",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "number1110000005",
        "max": null,
        "min": null,
        "name": "temperatura",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number1110000006",
        "max": null,
        "min": null,
        "name": "frecuencia_cardiaca",
        "onlyInt": true,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number1110000007",
        "max": null,
        "min": null,
        "name": "frecuencia_respiratoria",
        "onlyInt": true,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number1110000008",
        "max": null,
        "min": null,
        "name": "saturacion_oxigeno",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number1110000009",
        "max": null,
        "min": null,
        "name": "peso",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number1110000010",
        "max": null,
        "min": null,
        "name": "talla",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text1110000011",
        "max": 0,
        "min": 0,
        "name": "queja_principal",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text1110000012",
        "max": 0,
        "min": 0,
        "name": "antecedentes_actualizados",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text1110000013",
        "max": 0,
        "min": 0,
        "name": "notas_enfermeria",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "select1110000014",
        "maxSelect": 1,
        "name": "estado",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": ["pendiente", "completado"]
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
    "id": "pbc_3500000001",
    "indexes": [],
    "name": "triage",
    "system": false,
    "type": "base"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3500000001");
  return app.delete(collection);
})
