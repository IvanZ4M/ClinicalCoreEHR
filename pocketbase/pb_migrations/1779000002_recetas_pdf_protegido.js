/// <reference path="../pb_data/types.d.ts" />
// VULN-FIX (ÁREA 10): el PDF de la receta se archiva en el expediente, y el
// archivo queda detrás de un token de acceso.
//
// Hasta ahora el campo `pdf` de `recetas` era letra muerta: el documento se
// descargaba al equipo del médico y nunca se guardaba (0 archivos en
// pb_data/storage/). Al empezar a archivarlo aparece una superficie nueva.
//
// Con `protected: false` —el valor con el que se creó la colección— la URL del
// archivo se sirve SIN autenticación: cualquiera en la LAN de la clínica que
// tenga el enlace descarga la receta completa (nombre, CURP, diagnóstico y
// medicación) saltándose por completo el RLS que cerraron las migraciones
// 1779000000 y 1779000001. El riesgo real no es que la URL se adivine —el
// sufijo aleatorio de PocketBase lo impide— sino que es COMPARTIBLE y
// PERSISTENTE: queda en el historial del navegador, en la carpeta de descargas
// y en cualquier correo al que se reenvíe.
//
// Con `protected: true` la URL solo responde acompañada de un token de vida
// corta que emite `pb.files.getToken()` para el usuario autenticado. El cliente
// lo pide en el momento del clic y no lo almacena (ver ConsultasPrevias.jsx).
//
// Se aplica AHORA y no después justamente porque storage/ está vacío: no hay
// un solo archivo que reconciliar. En cuanto se archive la primera receta, sí
// lo habrá.
migrate((app) => {
  const recetas = app.findCollectionByNameOrId("pbc_461983551")

  // El campo `pdf` ocupa la posición 6 (id, consulta, paciente, medico,
  // medicamentos, indicaciones, pdf, created, updated). `addAt` con un id que
  // ya existe REEMPLAZA el campo, que es la forma en que PocketBase genera sus
  // propias migraciones de actualización de campo.
  recetas.fields.addAt(6, new Field({
    "help": "",
    "hidden": false,
    "id": "file250665868",
    "maxSelect": 0,
    "maxSize": 0,
    "mimeTypes": null,
    "name": "pdf",
    "presentable": false,
    "protected": true,
    "required": false,
    "system": false,
    "thumbs": null,
    "type": "file"
  }))

  return app.save(recetas)
}, (app) => {
  // revert: vuelve a servir el archivo sin token (inseguro — solo rollback)
  const recetas = app.findCollectionByNameOrId("pbc_461983551")

  recetas.fields.addAt(6, new Field({
    "help": "",
    "hidden": false,
    "id": "file250665868",
    "maxSelect": 0,
    "maxSize": 0,
    "mimeTypes": null,
    "name": "pdf",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": null,
    "type": "file"
  }))

  return app.save(recetas)
})
