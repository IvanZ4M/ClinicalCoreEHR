---
name: asana-sync
description: Mantiene el tablero de Asana "Plan Semanal" sincronizado con el desarrollo real de ClinicalCoreEHR. Úsala cuando durante el trabajo surja una tarea nueva que deba quedar registrada (un bug encontrado, un pendiente que se descubre a media implementación, una decisión que genera trabajo posterior), cuando se complete una tarea que ya existe en el tablero, o cuando el usuario pida ver/ajustar el estado del plan. También al cerrar una sesión de trabajo, para volcar lo pendiente.
---

# Sincronización con Asana — ClinicalCoreEHR

Mantiene el tablero de Asana alineado con lo que realmente pasa en el código, sin que
Ivan tenga que acordarse de capturar tareas a mano.

## Coordenadas fijas

| Dato | Valor |
|---|---|
| Workspace | `1217756213122539` (My workspace) |
| Proyecto | `1217838653061608` ("Plan Semanal") |
| Usuario | `1217756213122527` (IVAN ZAMARRON) — usar `assignee: "me"` |

Secciones (GIDs):

| Sección | GID |
|---|---|
| Inventario Puntuales | `1217838653061609` |
| Lunes | `1217838653061611` |
| Martes | `1217838653061612` |
| Miércoles | `1217838653061613` |
| Jueves | `1217838653061614` |
| Viernes | `1217838653061615` |
| Sábado | `1217838653061616` |
| Domingo | `1217838653061617` |

**Importante:** "Plan Semanal" NO es exclusivo de ClinicalCoreEHR. Contiene también
búsqueda de empleo (CV, LinkedIn, vacantes, portafolio) y trámites de titulación
(Escolares, sinodales, documento de tesis). Nunca toques esas tareas salvo petición
explícita. Este skill solo administra las tareas de desarrollo del sistema.

## Cuándo crear una tarea automáticamente

Crea una tarea cuando durante el trabajo aparezca algo que:

1. **No se va a resolver en la sesión actual** y se perdería si no se registra.
2. **Es trabajo real**, no una observación. "El contraste es bajo" no es tarea;
   "Subir `--text-3` a L=50% en system.css" sí lo es.
3. **Tiene un final verificable.** Si no puedes escribir cómo se comprueba que
   quedó lista, todavía no es una tarea.

No crees tareas para: cosas que acabas de terminar en la misma sesión, ideas sin
decisión tomada, ni sub-pasos triviales de una tarea que ya existe.

**Antes de crear, busca duplicados** con `search_objects` o `get_tasks` sobre el
proyecto. Si ya existe algo equivalente, actualiza esa tarea en vez de duplicarla.

## Cómo escribir la tarea

Sigue la convención que Ivan ya usa en su tablero: **verbo concreto + objeto
específico**. Su propio tablero registra que "dar seguimiento" fue rechazado por
vago — respeta ese criterio.

- ✅ "Migrar los 10 filtros de PocketBase a `pb.filter()`"
- ✅ "Corregir `hoyInicio()` en useTriage.js para comparar en UTC"
- ❌ "Revisar seguridad"
- ❌ "Mejorar la UI"

En `notes` incluye siempre:
- **Por qué**: el problema concreto que resuelve.
- **Dónde**: archivo y línea (`src/hooks/useTriage.js:5`).
- **Hecho cuando**: el criterio de verificación.

Prefijo en el nombre para poder filtrar de un vistazo: `[CCEHR]`.

## Colocación

- **Tarea que nace a media sesión** → sección "Inventario Puntuales", con `due_on`
  si hay una fecha razonable; sin fecha si todavía no se decide.
- **Tarea planeada para un día concreto** → la sección del día correspondiente.
- Asigna siempre `assignee: "me"`.

## Cerrar tareas

Cuando termines trabajo que corresponde a una tarea existente, márcala completada
con `update_tasks` (`completed: true`). Verifica primero que el trabajo realmente
esté hecho y probado — no cierres por optimismo.

## Reglas de seguridad

- **Nunca borres tareas sin confirmación explícita de Ivan en el momento.** La API
  de Asana no ofrece recuperación sencilla. Si algo parece obsoleto, propónlo y
  espera respuesta.
- **Nunca toques** las tareas de búsqueda de empleo, trámites de titulación, las
  tareas de control (`🔁TAREAS CONTROL🔁`, `🔼 SEMANA EN CURSO 🔼`) ni las
  "Revisión semanal".
- Al crear varias tareas de golpe, usa una sola llamada a `create_tasks` (acepta
  hasta 50) en lugar de una por tarea.
- Después de crear o cerrar tareas, dile a Ivan en una línea qué cambió. No lo
  hagas en silencio.

## Al cerrar sesión de trabajo

Si la sesión produjo pendientes, ofrece volcarlos: resume en una lista corta lo que
quedó abierto y pregunta si los registra. No los crees sin preguntar cuando son
más de tres.
