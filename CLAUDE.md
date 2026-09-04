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
- ⚠️ **`deleteRule: ""` significa que TODOS pueden borrar, no que nadie puede.** Para prohibirlo
  hay que poner `null` (solo superusuarios). `pacientes`, `consultas`, `diagnosticos`, `recetas`
  y `audit_log` ya están en `null`.
- `audit_log`: solo se crea; UPDATE y DELETE devuelven 403 incluso al administrador.
- Solo `administrador` crea/borra usuarios (`manageRule`).
- En colecciones auth se usa `@request.auth.rol`, **no** `@request.auth.record.rol`.

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

## Estado actual (3 septiembre 2026) — leer antes de tocar código

Rama activa `feat/ui-redesign`, en `a2e5b0d`, **commiteada y empujada a `origin`**.
`main` en `dc7afb0`. Defensa objetivo: finales de septiembre / inicios de octubre 2026.
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
más 6 commits del 03/09. `feat/ui-redesign` sigue **sin fusionar a `main`** — esa fusión es la
tarea abierta más urgente (Asana `1217984345164995`).

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

### 1. La receta PDF nunca se archiva en el expediente
Verificado en código: `src/pages/NewConsultation.jsx:352` termina con `doc.save(nombreArchivo)`,
que **solo descarga** el archivo al equipo del médico. El registro de la receta se crea pero su
campo `pdf` queda vacío (confirmado en la base: `pdf: ""`).

- La receta no se puede reimprimir desde el expediente. Si el paciente la pierde, hay que
  recapturar la consulta entera.
- El campo `pdf` del esquema es letra muerta.
- La NOM-024 espera que el documento entregado al paciente quede archivado.

Arreglo: `doc.output('blob')` y subirlo al campo `pdf` con `FormData`, además de descargarlo;
luego enlace de descarga en `ConsultaPreviaCard`. Asana `1217971750122965`, vence 10/09.

### 2. Seguridad de despliegue (bloque del prof. Badillo)

| Pendiente | Estado verificado | Asana |
|---|---|---|
| **TLS en la red local** | Tráfico en `http://` plano: usuario, contraseña y expedientes viajan legibles. Caddy o mkcert. | `1217984345370767`, 15/09 |
| **Cifrado en reposo (BitLocker)** | `pb_data/data.db` es SQLite **sin cifrar**: con acceso físico se copia a una USB y se lee todo sin dejar rastro en `audit_log`. Documentar BitLocker como requisito de instalación. | `1217984345320036`, 15/09 |
| **Auditoría de todas las escrituras** | Hoy `audit_log` solo registra `LOGIN_OK`, `LOGOUT` y `VER_EXPEDIENTE`. Falta toda creación y modificación de paciente, consulta, diagnóstico, receta y usuario. | `1217984345378164`, 16/09 |
| **Respaldos automatizados y probados** | Existe `scripts/backup.bat` pero no está automatizado ni se ha restaurado nunca. Un respaldo que no se restauró no es un respaldo. Esquema 3-2-1 + restauración documentada. | `1217969931277095`, 17/09 |
| Panel `/_/` expuesto | Accesible desde toda la LAN; desde ahí se salta el RLS por completo. | `1217969971867507`, 17/09 |
| Bloqueo de sesión | `Layout.jsx:15` — `INACTIVIDAD_MS = 30 * 60 * 1000`. En un consultorio con la pantalla a la vista del paciente deberían ser 5 min. | `1217970107763004`, 17/09 |
| Vista de auditoría | El `audit_log` existe pero no se puede consultar desde la app. | `1217970107827075`, 16/09 |

### 3. Otros abiertos (verificados en código)

- **Signos vitales del expediente** leen solo `consultas[0]` (`PatientDetail.jsx:187-194`): si la
  consulta más reciente no los tiene, el expediente aparenta no tener ninguno. `1217971294731931`
- **Diagnósticos repetidos** sin agrupar en "Condiciones Actuales". `1217985775397589`
- **Anchos fijos en px no escalan** con F9; el login parte texto. `1217971220444612`
- **Recharts y el zoom de Electron**: solo comprobable dentro de `npm run dev`. `1217971158334650`
- **Informes muestra ceros** con el periodo mensual por defecto. `1217984348969837`
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
- Datos del consultorio en `localStorage`. CIE-10 y medicamentos hardcodeados en
  `NewConsultation.jsx`. Sin tests ni CI.
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
