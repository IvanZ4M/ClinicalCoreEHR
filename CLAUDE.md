# ClinicalCore EHR — contexto del proyecto

Sistema de historia clínica electrónica para consultorios médicos en México.
App de escritorio (Electron + React) con backend PocketBase en la red local de la clínica.
Autor: Ivan Zamarrón. Versión 1.0.0. Todo el código y la UI están en español.

## Stack

- React 19 + Vite 8, Tailwind 4 (`@tailwindcss/postcss`) + CSS custom properties en `src/styles/system.css`
- react-router-dom 7 con `HashRouter` (obligatorio: Electron carga por `file://`)
- PocketBase 0.26 como base de datos + auth + realtime (`src/lib/pb.js`)
- Electron 41 (`electron/main.js`, `electron/preload.cjs`), empaquetado con electron-builder (NSIS, `asar: false`)
- framer-motion (animaciones), sonner (toasts), recharts (informes), jspdf (recetas PDF)
- Sin TypeScript, sin tests.

## Comandos

```bash
npm run dev            # dev.mjs: levanta PocketBase + Vite + Electron (--dev)
npm run build          # vite build → dist/
npm run build:electron # vite build + electron-builder → dist-electron/
npm run setup <IP>     # genera .env.production apuntando al servidor de la clínica
```

## Arquitectura

- `src/App.jsx` — rutas. `RutaProtegida` (sesión) → `Layout` → `RoleGuard` por ruta.
  El dashboard `/` se resuelve por rol en `DashboardPorRol`. Páginas en `lazy()`.
- `src/lib/roles.js` — fuente de verdad de roles: `medico`, `enfermera`, `recepcionista`,
  `administrador`. Contiene navegación lateral, rutas permitidas y tabs de paciente por rol.
- `src/context/AuthContext.jsx` — sesión sobre `pb.authStore` (colección `usuarios`, auth collection).
- `src/lib/pb.js` — cliente único; persiste sesión en `localStorage.pb_auth`; al limpiarse el
  token redirige a `#/login`.
- `src/components/layout/Layout.jsx` — auto-logout a los 30 min de inactividad.
- `src/hooks/usePocketBase.js` — `useColeccion` / `useRegistro` genéricos.
- `src/services/` — `citasService` (crear cita, slots de 07:00–19:00 c/30 min),
  `auditService` (`logAuditEvent`, errores silenciados a propósito).

## Modelo de datos (PocketBase, `pocketbase/pb_migrations/`)

- `usuarios` (auth) — nombre, apellidos, rol, especialidad, cedula_profesional, consultorio, activo
- `pacientes` — nombre, apellidos, curp, fecha_nacimiento, sexo, telefono, email,
  grupo_sanguineo, alergias, alergias_criticas, antecedentes, foto, activo
- `citas` — paciente, medico, fecha_hora, tipo, consultorio, estado, notas
  (estados: programada, confirmada, en_espera, en_consulta, completada, cancelada, no_acudio)
- `triage` — cita_id, paciente_id, enfermera_id, signos vitales, queja_principal, notas, estado
- `consultas` — cita, paciente, medico, fecha, motivo, exploracion_fisica, signos_vitales,
  plan_tratamiento, estado
- `diagnosticos` — consulta, codigo_cie10, descripcion, tipo, estado
- `recetas` — consulta, paciente, medico, medicamentos, indicaciones, pdf
- `notificaciones` — usuario_destino, tipo, mensaje, cita, leida
- `audit_log` — usuario_id, accion, recurso, recurso_id (solo lectura del admin;
  inmutable desde la migración `1779000000`: UPDATE y DELETE devuelven 403 incluso al admin)

Flujo clínico: recepción agenda cita → enfermera hace triage (`/enfermeria`) → médico abre
consulta (`/consulta/nueva?paciente=&cita=`) → diagnósticos CIE-10 + receta PDF →
la cita pasa a `completada` automáticamente.

## Reglas de acceso (RLS en PocketBase)

Aplicadas por migración, no en el cliente. Lo esencial:
- El médico solo ve **sus** citas y consultas (`medico = @request.auth.id`) — verificado.
- Esa protección se extiende a `diagnosticos` y `recetas` recorriendo la relación
  (`consulta.medico = @request.auth.id`), desde la migración `1779000000` (29/08/2026).
- La `recepcionista` no ve `diagnosticos` ni `recetas` (migración `1779000001`). La `enfermera`
  sí: necesita crónicos y medicación vigente para el triage.
- El PDF de la receta (`recetas.pdf`) es un campo `file` con **`protected: true`** desde la
  migración `1779000002` (09/09/2026). La URL del archivo **no responde sin un token de acceso**
  emitido por `pb.files.getToken()` para el usuario autenticado. Sin esto, un campo `file` se
  sirve en abierto y se salta todo el RLS de arriba: el riesgo no es que la URL se adivine
  —PocketBase le añade sufijo aleatorio— sino que es **compartible y persistente** (historial,
  carpeta de descargas, un correo reenviado). El token se pide en el momento del clic y no se
  guarda; guardarlo reintroduciría el enlace compartible.
- ⚠️ **`deleteRule: ""` significa que TODOS pueden borrar, no que nadie puede.** Para prohibirlo
  hay que poner `null` (solo superusuarios). `pacientes`, `consultas`, `diagnosticos`, `recetas`
  y `audit_log` ya están en `null`.
- `audit_log`: solo se crea; UPDATE y DELETE devuelven 403 incluso al administrador.
- Solo `administrador` crea/borra usuarios (`manageRule`).
- En colecciones auth se usa `@request.auth.rol`, **no** `@request.auth.record.rol`.

## Cómo se prueba en este proyecto

**Las pruebas se hacen recorriendo el flujo clínico real completo**, de principio a fin:
cita → triage → consulta → diagnóstico → receta → firmar y finalizar. No basta con ejercitar
la función que se acaba de tocar.

**Y con datos coherentes entre sí.** El motivo, la exploración, los signos vitales, la edad
del paciente, el diagnóstico y la medicación tienen que contar la misma historia clínica.
Nada de datos de relleno, ni `aaa`, ni `prueba123`, ni un antibiótico para un esguince.

No es formalismo. Los defectos que más han dolido en este proyecto solo aparecen cuando los
datos son verosímiles: una pediatra firmando la receta de un paciente de 24 años, o un
`Dr.` fijo delante del nombre de una médica, no se ven en una prueba unitaria — se ven al
mirar el PDF de una consulta que podría haber sido real. Un relleno sin sentido hace que
esos fallos pasen desapercibidos justo hasta la defensa.

## Convenciones

- Nombres de dominio en español (`usuario`, `cargando`, `guardando`, `citas`); comentarios en español.
- Los arreglos de seguridad llevan comentario `VULN-FIX (ÁREA n)` — mantener ese formato.
- Estilos inline con variables CSS (`var(--bg)`, `var(--accent)`, `var(--text-3)`), no clases utilitarias sueltas.
- Fechas a PocketBase en formato `YYYY-MM-DD HH:mm:ss` (ver `citasService.createCita`).
- Nunca romper `HashRouter` ni introducir `nodeIntegration` en Electron.

### Atribución en los commits

**Los mensajes de commit no llevan trailers de atribución de IA.** Ni `Co-Authored-By: Claude`,
ni `Claude-Session:`. Decisión del autor: el historial se muestra en la defensa de titulación.
No es una afirmación sobre cómo se desarrolló el proyecto — Claude Code se sigue usando con
normalidad — sino sobre qué aparece en la portada del repositorio.

El motivo concreto: GitHub **sí** empareja el trailer `Co-Authored-By` con la cuenta oficial
`claude` de Anthropic y la muestra con avatar en la barra lateral de contribuidores. Ojo, la
API REST `/repos/.../contributors` **no** lo refleja: devuelve un solo contribuidor. El dato
bueno está en `github.com/<owner>/<repo>/graphs/contributors-data`, que es lo que alimenta la
interfaz. No dar por buena la API para esto.

Hay **tres capas**, y hacen falta las tres:

1. **`~/.claude/settings.json`** (fuera del repositorio, es preferencia personal):
   ```json
   "attribution": { "commit": "", "pr": "" }
   ```
   Suprime el `Co-Authored-By`. **No suprime el `Claude-Session`** — bug conocido: esa línea se
   inyecta por una vía que no lee la configuración local.

2. **`.claude/skills/git-commit/SKILL.md`**, sección 5: instruye explícitamente a no escribir
   ningún trailer. Hace falta porque la skill antes ordenaba lo contrario, y una instrucción
   negativa explícita es más fiable que el silencio.

3. **El hook `commit-msg`**, que es la garantía real porque git lo ejecuta siempre.

> ⚠️ **Los hooks viven en `.git/hooks/` y NO se versionan.** Un clon nuevo no lo tiene y los
> trailers vuelven sin avisar. Si clonas el repositorio, recrea el archivo
> `.git/hooks/commit-msg` con este contenido y dale permisos con `chmod +x`:

```sh
#!/bin/sh
msg="$1"
tmp="$msg.sinatribucion"
grep -viE '^[[:space:]]*(Co-Authored-By:[[:space:]]*Claude|Claude-Session:|Generated with \[Claude)' "$msg" > "$tmp"
awk '{l[NR]=$0} END{n=NR; while(n>0 && l[n]~/^[[:space:]]*$/) n--; for(i=1;i<=n;i++) print l[i]}' "$tmp" > "$msg"
rm -f "$tmp"
```

Solo filtra `Co-Authored-By:` seguido de `Claude`: un co-autor humano se conserva. El `awk`
recorta las líneas en blanco que quedan al final tras borrar los trailers.

Comprobar con `git log -1 --format=%B` después de commitear. Esto corta el problema **hacia
adelante**; los 41 commits que ya los llevan siguen igual hasta la reescritura de historial
pendiente, agendada junto con la de `pocketbase.exe` (Asana `1218178974697650`).

## Estado actual (9 septiembre 2026) — leer antes de tocar código

Rama activa `feat/ui-redesign`, **commiteada y empujada a `origin`**. `main` en `65bb5ba`, que
ya incluye la fusión del rediseño; `feat/ui-redesign` va por delante con el trabajo del 09/09 y
**sigue sin fusionar** desde entonces. Defensa objetivo: finales de septiembre / inicios de
octubre 2026.
Plan en Asana, proyecto "Plan Semanal" (`1217838653061608`), tareas con prefijo `[CCEHR]`.
La skill `.claude/skills/asana-sync/` mantiene ese tablero sincronizado.

### ⚠️ Lo primero: el historial se reescribió el 3 de septiembre de 2026

**Todos los SHA anteriores a esa fecha dejaron de existir.** El repositorio de GitHub se borró
y se recreó desde un historial filtrado. Cualquier referencia vieja que encuentres en notas,
tarjetas de Asana o conversaciones previas (`68cf872`, `9a984f6`, `fe1b330`, `b6b0657`…) ya no
resuelve contra este repositorio. El motivo está en "Incidente de seguridad", más abajo.

| Antes | Ahora |
|---|---|
| `9a984f6` — tip de `feat/ui-redesign` | `a442e20` |
| `fe1b330` — tip de `main` | `dc7afb0` |
| `c2c9e55` — "Cuarto Commit" | podado; solo tocaba los binarios de `pb_data` |

El trabajo de los días 29–31 de agosto **sí está commiteado y empujado**: 7 commits del 31/08
más 6 commits del 03/09. **La fusión a `main` ya se hizo** el 03/09 en `65bb5ba` ("Merge
feat/ui-redesign: rediseno, correcciones de RLS y limpieza de pb_data"), y la tarea de Asana
`1217984345164995` está cerrada. Corregido el 09/09: este párrafo afirmaba lo contrario y que
`main` seguía en `dc7afb0`.

`pocketbase/pb_data/` ya no está en el repositorio ni en el historial, y el `.gitignore` ignora
el directorio completo. La base local de trabajo sigue en su sitio, sin versionar.

> ⚠️ **El repositorio de GitHub es público, por decisión deliberada:** Diego lo necesita así para
> la defensa. El historial está limpio y las credenciales rotadas, de modo que no hay exposición
> pendiente — pero **cada `push` es una publicación**. La skill `git-commit` obliga a comprobar la
> visibilidad antes de empujar; ese aviso es intencional, no una alarma que haya que silenciar.

### ✅ Resuelto (26 tareas confirmadas en Asana, 29–30 agosto)

Cada una tiene nota de verificación en su tarjeta de Asana. Todas están **en el árbol de trabajo,
sin commitear**.

**Seguridad (RLS)** — migraciones `1779000000_rls_fix_borrado_y_fugas.js` y
`1779000001_rls_recepcion_sin_datos_clinicos.js`:
- Fuga de `diagnosticos` entre médicos cerrada (medico1 ve 18, medico2 ve 1; antes ambos los 19).
- Fuga de `recetas` cerrada (9 vs 1; antes ambos las 10).
- `audit_log` inmutable: DELETE y PATCH devuelven 403.
- **Hallazgo mayor:** `deleteRule: ""` en PocketBase significa *todos pueden*, no *nadie*.
  Afectaba a `pacientes` y `consultas` — una enfermera borró un paciente (204) en la prueba.
  Corregido a `null`.
- La recepcionista dejó de ver diagnósticos y recetas (0 y 0). La enfermera los conserva:
  necesita crónicos y medicación vigente para el triage.

**Estabilidad:**
- Un corte de red expulsaba la sesión de *todo* el personal — `AuthContext` cerraba sesión ante
  cualquier error. Ahora solo con 401/403. (Material directo para el prof. Diosdado.)
- `useColeccion` limpia los datos al fallar y expone el error en pantalla con botón Reintentar.
- `hoyInicio()` de `useTriage` corregido a UTC.
- 17 usos de `pb.filter()`; `grep 'filter:.*${'` devuelve 0.
- `catch {}` vacíos sustituidos por `src/lib/logger.js`.

**Rediseño ("Claridad Clínica": plano, alto contraste, guiado por tipografía):**
- Escala tokenizada `--fs-1..7` sobre `--ui-scale`; 465 `fontSize` inline sustituidos en 28 archivos.
- Contraste: `--text-3` 3.62:1 → 5.48:1 (supera AA); `--border` 1.43:1 → 1.86:1.
- Modo presentación con F9 + canal IPC `ui:set-zoom` (validado 0.5–3 en `main.js`).
- `NewConsultation` reestructurada en 4 pasos con stepper y compuerta de validación.
- Dashboard, Appointments y PatientDetail sin espacio muerto; mini-calendario eliminado.
- Contrato de color semántico documentado en `system.css`. El violeta **sí** significa
  "en consulta" y el ámbar "en sala"/"pendiente": solo se quitaron 4 usos decorativos.
- Paginación real en Pacientes (25/página) y aviso "Cifras parciales" en Informes.
- Fuentes autoalojadas con `@fontsource`: 0 peticiones a Google.

**Datos de demo** — `scripts/seed-demo.js`, reutilizable:
- La base contenía **datos personales reales** (nombre, correo y teléfono del autor y de un
  familiar). Padrón ahora íntegramente sintético: 30 pacientes, 161 citas, 133 consultas.
- Lógica clínica por edad (catálogos CIE-10, signos vitales y medicamentos en seis bandas).

> ⚠️ **Los datos de demo son relativos a la fecha.** `seed-demo.js` debe ejecutarse **la mañana
> de la defensa** o la agenda del día abre vacía. Requiere `PB_SU_EMAIL` y `PB_SU_PASS`.

### ✅ Resuelto el 9 de septiembre — la receta PDF ya se archiva (Asana `1217971750122965`)

El campo `recetas.pdf` era letra muerta: `doc.save()` solo descargaba al equipo del médico y el
registro se creaba con `pdf: ""`. Confirmado antes de tocar nada: **0 archivos en
`pb_data/storage/`** y ninguna cadena `.pdf` en toda la base.

- **`archivarReceta()` en `NewConsultation.jsx`**: el PDF se genera como `Blob`, se descarga en
  local **antes de tocar la red** —si PocketBase está caído, el paciente sale igual con su
  papel— y el registro más el archivo viajan en **un solo POST multipart**.
- ⚠️ **Se descartó el patrón crear-y-luego-actualizar** que proponía la nota original. Son dos
  peticiones y la segunda puede fallar, dejando una receta huérfana con `pdf: ""` — el mismo bug
  que este arreglo corrige, pero en silencio y sin forma de distinguirlo de una receta legítima.
  Con un POST único no hay estado intermedio. **No volver a partirlo en dos.**
- **Reintento sin archivo** si el multipart falla: salva medicamentos e indicaciones aunque se
  pierda el PDF, con `toast.warning`. Si también falla, `toast.error` y ningún registro.
- **Migración `1779000002`**: `recetas.pdf` pasa a `protected: true` (ver "Reglas de acceso").
- Botón "Descargar receta (PDF)" en `ConsultaPreviaCard`; el token se pide al hacer clic desde
  `ConsultasPrevias.descargarReceta()`.

Probado contra PocketBase levantado, con cuentas temporales borradas al terminar: receta con
`pdf` no vacío y archivo en `storage/`; fallo de subida (blob de 6 MB) → rama de reintento;
PocketBase apagado a mitad → cero huérfanos; médico y enfermera descargan (200), recepcionista
no lista nada y recibe 404, y sin token o con token inventado también 404.

> ⚠️ **Sin verificar: el enlace de descarga dentro de Electron.** Las pruebas anteriores son por
> API y no tocan el renderer. `electron/main.js` no define `setWindowOpenHandler` ni
> `will-download`; por eso el enlace usa `?download=1` (fuerza `Content-Disposition: attachment`)
> en vez de `target="_blank"`. **Verificado en Electron el 09/09**: el diálogo de guardado sale
> y el archivo descarga correctamente.

### ✅ Resuelto el 9 de septiembre — el tratamiento y los acentos de la receta

Al revisar el PDF ya archivado aparecieron defectos de presentación en el documento que se
entrega al paciente y que lleva la cédula profesional:

- **`Dr.` estaba escrito a mano en 13 sitios de 11 archivos**, incluidos los dos de la receta.
  Con una médica en el padrón, los 13 estaban mal. Ahora `src/lib/medico.js` expone
  `tratamiento()` y `nombreMedico()`, que derivan Dr./Dra. del campo `sexo` de `usuarios`
  (**migración `1779000003`**, misma convención `masculino`/`femenino`/`otro` que `pacientes`).
  Cuando el campo está vacío cae a `Dr.`, que es lo que la app ya mostraba: el cambio nunca
  empeora lo anterior.
- `nombreMedico()` **colapsa espacios**: un `nombre` capturado como `"Vania "` imprimía
  `Dr. Vania  Zamarron Camacho` con doble espacio.
- **Acentos en las etiquetas fijas**: `DIAGNÓSTICO`, `Vía`, `Duración`, `Cédula`, `Válido`,
  `médico`, `ALERGIAS CRÍTICAS`, `Médico General`. jsPDF los soporta sin configuración —
  comprobado extrayendo el content stream— simplemente estaban escritos sin acentuar. El texto
  libre sí los llevaba, de ahí la incoherencia.
- `ROLE_PREFIX` en `roles.js` es un mapa **sin uso** que también fija `'Dr.'`. Queda anotado
  para que nadie lo use y reintroduzca el fallo.

- **El formulario de Usuarios no tenía el campo `sexo`.** La migración habría quedado
  inservible desde la app: la única vía para rellenarlo sería el panel `/_/`, que es justo lo
  que hay pendiente restringir. Añadido el select junto a la cédula profesional.

> ⚠️ **La migración añade la columna `sexo`, no el dato.** Hay que rellenarla para cada médico
> desde la pantalla de Usuarios; hasta entonces todos siguen saliendo como `Dr.`.

**No reproduce:** se revisó también que el grupo sanguíneo perdía el signo (`AB` en vez de
`AB-`). Es falso: la base guarda `"AB-"` (3 caracteres), jsPDF escribe el guion, y el PDF real
archivado contiene literalmente `"Grupo sanguíneo: AB-"`. No se cambió nada por esto.

**Correcciones de datos comprometidas para el 10/09** (son datos, no código; se hacen desde la
pantalla de Usuarios): `sexo` de los dos médicos; para la Dra. Camacho, `apellidos` a `Camacho`,
quitar el espacio final de `nombre` y `especialidad` a `Medicina General`; y las erratas de
`Ana Cariilo Martinez` y `Minerva Lopez Juarez`, que arrastran del 3/09.

## Incidente de seguridad — exposición de `pb_data` (3 septiembre 2026)

Redactada para poder responderla en la defensa. Todo lo que sigue es verificable en el
historial de git y en los respaldos de `C:\respaldo-ccehr\`.

### Qué se expuso

`pocketbase/pb_data/data.db` —la base SQLite completa de PocketBase— estuvo versionada en git
desde el primer commit del proyecto y publicada en un repositorio **público** de GitHub.
Contenía:

- Las tablas `pacientes`, `consultas`, `diagnosticos`, `recetas`, `triage` y `usuarios`.
- Datos personales reales del autor y de un familiar, capturados como pacientes de prueba antes
  de que existiera el generador sintético: 18 correos y 120 cadenas de 10 dígitos compatibles
  con teléfonos.
- La tabla `_superusers`, con 7 hashes bcrypt.
- Los write-ahead logs `data.db-wal` y `auxiliary.db-wal`, que pueden contener transacciones
  todavía no volcadas a la base.

Era descargable sin autenticación: una petición anónima a
`raw.githubusercontent.com/.../main/pocketbase/pb_data/data.db` devolvía `HTTP 200` y 253 952 bytes.

**No** se commitearon nunca `pb_data/storage/` (adjuntos, fotos de pacientes) ni
`pb_data/backups/`: se verificó que esas rutas no aparecen en ninguno de los 44 commits del
historial original.

### Cómo se detectó — 3 de septiembre de 2026

Al reanudar el trabajo, `CLAUDE.md` afirmaba que nada de agosto estaba commiteado mientras el
repositorio mostraba lo contrario. Al resolver esa contradicción con diagnóstico en crudo
—`git log`, `git status -sb`, `git ls-remote`, `git log --all -- 'pocketbase/pb_data/*'`,
`git check-ignore`— apareció que la base estaba en el historial y que `check-ignore` devolvía
código 1: no estaba ignorada.

**No lo detectó ninguna herramienta automática.** No había escaneo de secretos, ni hook de
pre-commit, ni revisión de qué archivos entraban al repositorio. Lo detectó una verificación
manual disparada por una inconsistencia en la documentación.

### Qué se hizo, en este orden

1. **Respaldo** — clon `--mirror` y copia completa del proyecto en `C:\respaldo-ccehr\`.
2. **Repositorio a privado**, para detener la exposición en minutos.
3. **Rotación de credenciales** — superusuario de PocketBase y las 5 cuentas de `usuarios`.
   Primero esto: los hashes ya eran públicos y podían haber sido copiados.
4. **Reescritura del historial** con `git-filter-repo --invert-paths --path pocketbase/pb_data`,
   sobre un clon nuevo del respaldo. Filtro por **directorio**, no por archivo: uno a nivel de
   archivo habría dejado pasar los `-wal`.
5. **Borrado y recreación del repositorio en GitHub.** Una reescritura con `push --force` deja
   los objetos viejos accesibles por SHA hasta que Soporte los purga; borrar el repositorio no.
6. **Reapuntado de la carpeta de trabajo** con `git reset --mixed`, que mueve la rama sin tocar
   el árbol de trabajo y conserva la base local.
7. **Verificación** — `git log --all -- 'pocketbase/pb_data/*'` vacío, los blobs concretos
   buscados por SHA ya no existen, y `raw.githubusercontent.com` devuelve 404 en ambas ramas
   desde una sesión sin autenticar.

Coste: un commit podado (`c2c9e55`, "Cuarto Commit"), que tocaba únicamente los dos binarios de
la base y ninguna línea de código. Todos los SHA del proyecto cambiaron.

### Qué cambió para que no se repita

- El `.gitignore` ignora `pocketbase/pb_data/` **completo**, no archivos sueltos.
- La skill `.claude/skills/git-commit/` ahora obliga a revisar `git ls-files` del **historial**,
  no solo del árbol de trabajo, y a comprobar la visibilidad del repositorio antes de empujar.
  Ese fue exactamente el fallo: vigilaba lo que estaba a punto de entrar, no lo que ya estaba
  dentro.
- Los datos de demostración se generan con `scripts/seed-demo.js` y son íntegramente sintéticos.

### Riesgo residual, dicho con honestidad

Borrar el repositorio elimina los datos de los servidores de GitHub, pero **no** del equipo de
quien lo hubiera clonado mientras era público. Las credenciales ya no sirven porque se rotaron.
Lo que no se puede deshacer es la exposición de los datos de contacto, si alguien llegó a
descargarlos. El repositorio no tenía forks y no había tenido difusión, de modo que la
probabilidad es baja — pero baja no es cero, y esa es la respuesta correcta.

Lección que se traslada al despliegue en la clínica: **la base de un EHR no debe vivir nunca en
el mismo sitio que el código**. Es el mismo principio que sostiene los pendientes de cifrado en
reposo y de respaldos fuera del equipo, más abajo.

## Pendientes críticos para la defensa

### 1. Seguridad de despliegue (bloque del prof. Badillo)

| Pendiente | Estado verificado | Asana |
|---|---|---|
| **TLS en la red local** | Tráfico en `http://` plano: usuario, contraseña y expedientes viajan legibles. Caddy o mkcert. | `1217984345370767`, 15/09 |
| **Cifrado en reposo (BitLocker)** | `pb_data/data.db` es SQLite **sin cifrar**: con acceso físico se copia a una USB y se lee todo sin dejar rastro en `audit_log`. Documentar BitLocker como requisito de instalación. | `1217984345320036`, 15/09 |
| **Auditoría de todas las escrituras** | Hoy `audit_log` solo registra `LOGIN_OK`, `LOGOUT` y `VER_EXPEDIENTE`. Falta toda creación y modificación de paciente, consulta, diagnóstico, receta y usuario. | `1217984345378164`, 16/09 |
| **Respaldos automatizados y probados** | Existe `scripts/backup.bat` pero no está automatizado ni se ha restaurado nunca. **Dos defectos verificados el 09/09, ver abajo: anula el cifrado en reposo y copia en caliente.** Esquema 3-2-1 + restauración documentada. | `1217969931277095`, 17/09 |
| Panel `/_/` expuesto | Accesible desde toda la LAN; desde ahí se salta el RLS por completo. | `1217969971867507`, 17/09 |
| Bloqueo de sesión | `Layout.jsx:15` fija `INACTIVIDAD_MS = 30 * 60 * 1000` **e ignora `VITE_INACTIVITY_TIMEOUT`**, que ya existe en `.env.development` y `.env.production` sin que nadie la lea. En un consultorio con la pantalla a la vista del paciente deberían ser 5 min. | `1217970107763004`, 17/09 |
| Vista de auditoría | El `audit_log` existe pero no se puede consultar desde la app. | `1217970107827075`, 16/09 |
| **Sin Content-Security-Policy** | Verificado el 09/09: no hay CSP en ninguna capa — ni `<meta>` en `index.html`, ni `onHeadersReceived` en `electron/main.js`. El aviso de Electron **solo sale en desarrollo** (lo silencia en la app empaquetada), pero la ausencia de política es real en producción: una inyección en el renderer podría cargar código de cualquier origen y exfiltrar el expediente. `nodeIntegration:false` y `contextIsolation:true` limitan el daño, no la carga remota. | `1218348694623866`, 16/09 |

#### Orden de ataque — acordado el 09/09, vigente para la sesión del 10/09

Página consultable con el grafo de dependencias:
https://claude.ai/code/artifact/6f5585b6-3d6d-42ea-b608-8e94bf527007

Son **ocho tareas**, no seis, y los vencimientos se agolpan en **tres días** (15, 16 y 17), no
en seis. Solo hay tres dependencias reales entre las ocho; el resto es paralelizable.

| # | Movimiento | Cuándo |
|---|---|---|
| 1 | **Bloqueo de sesión** — cierra una tarjeta antes de entrar a lo pesado. No basta con bajar el número: `Layout.jsx` debe **leer `VITE_INACTIVITY_TIMEOUT`** en vez de tener el valor a mano, con 5 min por defecto. Una variable de entorno que el código ignora es una pregunta gratis para un sinodal. | primero, ~10 min |
| 2 | Decidir Caddy o mkcert → **TLS** → **panel `/_/`** en el mismo movimiento | 15/09 |
| 3 | **Cifrado en reposo + respaldos**, juntos | 15–16/09 |
| 4 | **Auditoría de escrituras** → **vista de auditoría**, en ese orden | 16/09 |
| 5 | **CSP**: empezar ya por `script-src`, `object-src` y `frame-src`; `connect-src` al final | parcial ya, cierre tras TLS |

Las dependencias, y por qué:

- **TLS es la raíz.** Cambiar esquema y puerto invalida los **12 sitios** con `http://…:8090`:
  `.env.production`, `.env.development`, `.env.example`, `src/lib/pb.js:6`,
  `scripts/setup-clinic.js:20`, `scripts/seed-demo.js:27`, `scripts/configure-firewall.bat:28`,
  `scripts/install-pocketbase-service.bat:54`, más `README.md`, `README-DESPLIEGUE.md`,
  `CHECKLIST-PRODUCCION.md` y este archivo. ⚠️ **`.env.production` está en `.gitignore`**, así
  que no sale en una búsqueda que respete el ignore: recorre el disco, no solo lo versionado.
- **TLS decide cómo se cierra el panel `/_/`.** Con Caddy delante es un *matcher* por ruta en
  el mismo Caddyfile; con mkcert y PocketBase sirviendo TLS directo no hay proxy donde
  bloquear y es otra tarea entera.
- **Cifrado en reposo y respaldos están acoplados** — ver abajo.
- **La vista de auditoría va detrás de las escrituras**: sin datos registrados sale vacía, y en
  la defensa una tabla vacía es peor que no tener la pantalla. Además, el esquema de lo que se
  registre (`accion`, `recurso`, `recurso_id`) es lo que la vista podrá filtrar.
- **La CSP NO cuelga entera de TLS.** Solo `connect-src` necesita el origen final de
  PocketBase; `script-src`, `object-src` y `frame-src` se pueden escribir desde ya. Cerrar
  `connect-src` al final evita que un desajuste de esquema bloquee las peticiones **en
  silencio**, que es como fallan las CSP: sin error visible, solo una app que deja de cargar.

> ⚠️ **Decisión pendiente: Caddy vs mkcert.** Inclinación actual hacia **Caddy**, porque cierra
> el panel `/_/` en el mismo archivo y en la defensa se explica en una frase. **Sin analizar
> todavía — se decide el 10/09.** Antes hay que responder tres cosas:
> 1. **Qué instala el personal de la clínica.** Caddy es un binario y un servicio más que
>    alguien tiene que instalar y mantener; hoy `install-pocketbase-service.bat` solo registra
>    PocketBase con NSSM.
> 2. **Qué pasa si Caddy no arranca.** Con un proxy delante, que falle deja el sistema entero
>    sin servicio en plena consulta. ¿Hay vuelta atrás rápida?
> 3. **Si el certificado local hace que Electron se queje.** Un certificado de CA interna puede
>    disparar errores de confianza en el renderer; hay que comprobar cómo se instala esa CA en
>    cada equipo de la clínica.

#### El respaldo anula el cifrado en reposo (verificado el 09/09)

Dos defectos de `scripts/backup.bat` que hacen la tarjeta más urgente de lo que parecía:

1. **Copia en claro.** Hace `xcopy /E` de `pb_data` entero a `D:\ClinicalCoreBackups`: una copia
   íntegra y **sin cifrar** de la misma base que BitLocker protegería en `C:`. Cifrar el origen
   y dejar el destino en claro no cifra nada — solo mueve el problema de disco. Por eso el
   cifrado en reposo y los respaldos son **una sola decisión**, no dos tareas separadas.
2. **Copia en caliente.** Se ejecuta con PocketBase encendido y el WAL activo, así que la copia
   puede salir inconsistente: ese respaldo quizá ni sea restaurable. Hay que cambiarlo a la
   **API `/api/backups`** de PocketBase, o detener el servicio durante la copia.

### 2. Otros abiertos (verificados en código)

- **Signos vitales del expediente** leen solo `consultas[0]` (`PatientDetail.jsx:187-194`): si la
  consulta más reciente no los tiene, el expediente aparenta no tener ninguno. `1217971294731931`
- **Diagnósticos repetidos** sin agrupar en "Condiciones Actuales". `1217985775397589`
- **Anchos fijos en px no escalan** con F9; el login parte texto. `1217971220444612`
- **Recharts y el zoom de Electron**: solo comprobable dentro de `npm run dev`. `1217971158334650`
- **Informes muestra ceros** con el periodo mensual por defecto. `1217984348900630`
- Documentación, diagramas, README, manual de instalación, congelamiento de alcance, pruebas de
  humo de los 4 roles, ensayo con proyector, video de respaldo y los tres bancos de preguntas por
  sinodal: 26 tareas abiertas en total, todas fechadas en Asana.

### Deuda pendiente

- ~~`pb_data/*.db` versionado en git~~ — **resuelto el 03/09/2026**, ver "Incidente de seguridad".
- ~~README = plantilla de Vite~~ — **resuelto el 03/09/2026** (commit `a2e5b0d`). Se recuperó el
  README de `main`, se corrigió el modelo de despliegue y se quitaron los enlaces rotos a `docs/`,
  que nunca existió en el historial.
- ~~`install-pocketbase-service.bat` buscaba en `backend\`~~ — **resuelto** (commit `4ea5aaa`).
  Sin verificar: el script no se ha ejecutado como administrador en un equipo real.
- **`pocketbase/pocketbase.exe` (31 MB) está commiteado.** Binario de terceros, no debería
  versionarse. **Sacarlo exige otra reescritura de historial, así que va DESPUÉS de la defensa**
  — decisión explícita del 03/09. No es una fuga: el binario es público y descargable de
  pocketbase.io; el coste es peso, no privacidad. Asana `1218178974697650`, fechada 10/10.
- Falta `pocketbase/pb_public/` — el acceso por `http://IP:8090` que promete
  `README-DESPLIEGUE.md` no funciona.
- **El Manual Técnico describe un sistema monopuesto** ("conexión de red: no requerida") pero el
  despliegue real es en red. Está **fuera del repositorio**, así que no se puede corregir desde
  aquí; la redacción correcta ya está en `README.md`, sección "Modelo de despliegue".
  Asana `1218178774746540`, vence 19/09. Blanco directo del prof. Diosdado.
- Datos del consultorio en `localStorage`. Sin tests ni CI.
- **CIE-10 y medicamentos hardcodeados en `NewConsultation.jsx`**: 35 códigos CIE-10 (no ~17,
  como se creía) y 20 medicamentos incrustados en la pantalla.
  ⚠️ **Lo más grave es que el capítulo S está ausente por completo**: no hay ni un código de
  traumatismos, así que hoy **no se puede codificar un esguince, una contusión ni una herida** —
  motivos de consulta cotidianos. No falta un código suelto: falta un capítulo entero de la
  CIE-10. Eso va antes que ampliar lo que ya existe. Después, ausencias sueltas comprobadas:
  `M79.1` (mialgia), `K29.7` (gastritis — hoy solo hay `K30` dispepsia y `K21.0` reflujo, que
  no son lo mismo), `K59.0`, `J20.9`, `L20.9`, `M25.5`. Sacar el catálogo a un archivo de datos
  y llegar a 60–80 códigos. Asana `1218354398964031`, vence 18/09, alta prioridad: si un
  sinodal pide registrar una gastritis en vivo, hoy no se puede.
- **Datos incoherentes en el padrón**, detectados al revisar la receta impresa (son datos, no
  código; se corrigen desde la pantalla de Usuarios): la Dra. Camacho figura con especialidad
  `Pediatría` pero atiende adultos en la demo, su `apellidos` dice `Zamarron Camacho` en vez
  de `Camacho`, su `nombre` tiene un espacio final, y el campo `sexo` está vacío para los dos
  médicos desde la migración `1779000003`.
- Cada pantalla conserva su `calcularEdad` local duplicado; unificar contra `src/lib/edad.js`.

### Sin verificar

Marcado así deliberadamente: no se pudo confirmar ni en git ni en Asana.

- **La consulta de prueba `3b3y08pz0hv5pvo` (`PRUEBA_RLS_BORRAR`)**: `seed-demo.js` vacía la
  colección `consultas`, así que muy probablemente ya no existe, pero no se consultó la base
  para confirmarlo.
- **Modo presentación con proyector real**: implementado y verificado en navegador, nunca
  probado en el aula. Es exactamente lo que falló en la revisión previa (tarea del 23/09).
- **El guardado final de `NewConsultation`** ("Firmar y finalizar") tras el rediseño en 4 pasos:
  la lógica de `handleGuardar` no se tocó, pero el flujo completo no se ha vuelto a recorrer
  extremo a extremo desde el último sembrado.
- **Conteo de tareas cerradas**: en sesión se dijo "31 cerradas". La cifra confirmable hoy
  contra la API de Asana es **26**.
