// VULN-FIX (ÁREA 9): registro centralizado de fallos.
//
// El proyecto tenía una decena de `catch {}` vacíos: cuando algo fallaba no
// quedaba rastro ni para el usuario ni en el archivo de log. Por eso el bug del
// buscador de pacientes pasó meses sin detectarse.
//
// En Electron el proceso principal escucha 'console-message' del renderer y lo
// vuelca a clinicalcore.log (ver electron/main.js), así que basta con escribir
// en consola para que quede registrado en disco.

function detalle(err) {
  return err?.data?.message || err?.message || String(err)
}

/** Fallo real: algo no funcionó y hay que poder investigarlo después. */
export function logError(contexto, err) {
  console.error(`[${contexto}] ${detalle(err)}`, err)
}

/** Fallo tolerable: la app sigue funcionando, pero conviene dejar constancia. */
export function logWarn(contexto, err) {
  console.warn(`[${contexto}] ${detalle(err)}`)
}
