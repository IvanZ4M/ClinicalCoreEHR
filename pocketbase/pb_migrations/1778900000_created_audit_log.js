/// <reference path="../pb_data/types.d.ts" />
// VULN-FIX (ÁREA 7): colección de auditoría inmutable.
// Registra acciones clínicas relevantes (login, acceso a expedientes,
// creación de consultas). Solo admin puede leer; nadie puede modificar
// ni borrar — garantiza integridad del log.
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.id != ''",
    "deleteRule": "",
    "updateRule": "",
    "listRule":   "@request.auth.rol = 'administrador'",
    "viewRule":   "@request.auth.rol = 'administrador'",
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
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text9100000001",
        "max": 0,
        "min": 0,
        "name": "usuario_id",
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
        "id": "text9100000002",
        "max": 100,
        "min": 0,
        "name": "accion",
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
        "id": "text9100000003",
        "max": 100,
        "min": 0,
        "name": "recurso",
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
        "id": "text9100000004",
        "max": 50,
        "min": 0,
        "name": "recurso_id",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "autodate9100000005",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "pbc_9100000001",
    "indexes": [],
    "name": "audit_log",
    "system": false,
    "type": "base"
  })

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_9100000001")
  return app.delete(collection)
})
