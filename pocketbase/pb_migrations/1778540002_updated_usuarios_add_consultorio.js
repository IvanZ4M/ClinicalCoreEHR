/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_882525820")

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

  // PocketBase v0.37 re-runs all index SQL when any field changes.
  // Patch index statements to use IF NOT EXISTS so re-runs don't error.
  if (Array.isArray(collection.indexes)) {
    collection.indexes = collection.indexes.map(idx =>
      idx.replace(/CREATE (UNIQUE )?INDEX (`)/gi, (_, unique, tick) =>
        `CREATE ${unique || ''}INDEX IF NOT EXISTS ${tick}`
      )
    )
  }

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_882525820")

  collection.fields.removeById("text4293847651")

  if (Array.isArray(collection.indexes)) {
    collection.indexes = collection.indexes.map(idx =>
      idx.replace(/CREATE (UNIQUE )?INDEX IF NOT EXISTS (`)/gi, (_, unique, tick) =>
        `CREATE ${unique || ''}INDEX ${tick}`
      )
    )
  }

  return app.save(collection)
})
