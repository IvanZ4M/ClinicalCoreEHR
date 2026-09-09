/// <reference path="../pb_data/types.d.ts" />
// Añade el campo `sexo` a `usuarios` para poder derivar el tratamiento.
//
// La receta impresa y toda la interfaz decían "Dr." de forma fija, incluso para
// una médica. En un documento clínico que se entrega al paciente y que lleva la
// cédula profesional, tratar mal a quien lo firma no es un detalle cosmético.
//
// Se reutiliza exactamente la convención que ya usa `pacientes.sexo`
// (masculino / femenino / otro) en lugar de inventar un campo `titulo`: el dato
// es el mismo y así una sola regla sirve para las dos colecciones.
//
// NO es `required`: los 5 usuarios existentes se crearon sin él y una migración
// no debe romper el login de nadie. `src/lib/medico.js` cae a "Dr." cuando el
// campo está vacío, que es el comportamiento que la aplicación ya tenía.
//
// ⚠️ Después de aplicar esto hay que RELLENAR el campo para cada médico desde
// la pantalla de Usuarios. La migración añade la columna, no adivina el dato.
migrate((app) => {
  const usuarios = app.findCollectionByNameOrId("pbc_882525820")

  usuarios.fields.add(new Field({
    "hidden": false,
    "id": "select741955219",
    "maxSelect": 0,
    "name": "sexo",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": ["masculino", "femenino", "otro"]
  }))

  return app.save(usuarios)
}, (app) => {
  const usuarios = app.findCollectionByNameOrId("pbc_882525820")
  usuarios.fields.removeById("select741955219")
  return app.save(usuarios)
})
