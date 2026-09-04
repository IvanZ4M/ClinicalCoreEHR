---
name: git-commit
description: Vigila el control de versiones de ClinicalCoreEHR y crea los commits. Úsala cuando se termine una unidad de trabajo (un bug arreglado, una pantalla rediseñada, una migración de seguridad), cuando el árbol de trabajo acumule cambios sin commitear, antes de cualquier operación arriesgada (cambiar de rama, fusionar, reinstalar dependencias, correr seed-demo.js), y al cerrar una sesión de trabajo. También cuando el usuario pida commitear, revisar el estado del repositorio o preparar la fusión a main.
---

# Control de versiones de ClinicalCoreEHR

Esta skill nació de un fallo y sobrevivió a otro. Los dos hay que tenerlos presentes.

**31 de agosto de 2026** — se descubrió que tres días de trabajo, incluidas cuatro
correcciones de seguridad verificadas, vivían solo en el árbol de trabajo. El último commit
era del 14 de mayo.

**3 de septiembre de 2026** — se descubrió que `pocketbase/pb_data/data.db`, con expedientes
y datos personales reales, llevaba **desde el primer commit** dentro del historial de git y
publicado en un repositorio público. Hubo que reescribir el historial y recrear el
repositorio. La versión anterior de esta skill ya decía "nunca commitees `pb_data`" y aun así
falló: vigilaba lo que estaba a punto de **entrar** y nunca miró lo que ya estaba **dentro**.

De ahí las dos reglas que dominan el resto del documento: **auditar el historial, no solo el
árbol** (sección 2) y **comprobar la visibilidad del repositorio antes de empujar**
(sección 7).

## 1. Cuándo revisar (sin que te lo pidan)

Ejecuta el diagnóstico de la sección 2 cuando ocurra cualquiera de estas cosas:

- Se **terminó y verificó** una unidad de trabajo. Ese es el momento natural: el arreglo
  funciona, se comprobó, y todavía está fresco por qué se hizo.
- Se van a tocar **más de ~10 archivos** en la siguiente tarea.
- Antes de algo que puede destruir estado: cambiar de rama, `git checkout .`, fusionar,
  borrar `node_modules`, correr `scripts/seed-demo.js` (vacía colecciones enteras),
  aplicar migraciones de PocketBase.
- Al **cerrar la sesión de trabajo**, junto con el volcado de pendientes de `asana-sync`.
- Si el árbol lleva **más de un día** de trabajo acumulado sin commitear.

No hace falta commitear después de cada edición. La unidad correcta es *un cambio
coherente y verificado*, no *un archivo guardado*.

## 2. Diagnóstico antes de tocar nada

```bash
git branch --show-current
git log --oneline -10
git status --short
git diff --stat
```

Interpreta con cuidado:

- **`git diff main..<rama>` NO muestra el trabajo sin commitear.** Muestra la diferencia
  entre commits. Si buscas lo hecho hoy, es `git diff` a secas más `git status`.
- Fíjate en la **fecha del último commit** (`git log -1 --format=%ad --date=short`). Si
  tiene más de unos días y el árbol está sucio, dilo antes que nada.
- Rama activa: el trabajo va en `feat/ui-redesign`. **Nunca commitees directo a `main`.**
- Los SHA anteriores al 3/09/2026 **ya no existen**: el historial se reescribió. Si una nota
  o una tarjeta de Asana cita un SHA viejo, no lo busques, contrástalo con `CLAUDE.md`.

### Auditoría del historial — obligatoria, no solo el árbol de trabajo

`git status` y `git diff` solo ven el presente. Un archivo puede estar limpio hoy y llevar
años dentro del historial. Comprueba las dos cosas:

```bash
# 1. Que hay AHORA en el indice (presente)
git ls-files pocketbase/pb_data/ scripts/ .env

# 2. Que hubo ALGUNA VEZ en el historial (pasado) — esto es lo que se paso por alto
git log --all --oneline -- 'pocketbase/pb_data/*'
git rev-list --objects --all | grep -iE 'pb_data|\.db$|\.env|backup|\.sqlite'

# 3. Que cree que esta ignorado, y por que regla
git check-ignore -v pocketbase/pb_data/data.db
```

Tres trampas que costaron caro y que hay que leer bien:

- **`git check-ignore` sin salida y con código de salida 1 significa NO ignorado.** El
  silencio no es aprobación.
- **Filtra e ignora por directorio, no por archivo.** `pb_data/data.db` deja fuera
  `data.db-wal` y `data.db-shm`, los write-ahead logs de SQLite, que contienen transacciones
  sin volcar. La regla correcta es `pocketbase/pb_data/`.
- **`git ls-files` muestra el índice, no el historial.** Para el historial es
  `git log --all -- <ruta>` o `git rev-list --objects --all`.

Si aparece cualquier cosa en el punto 2, **detente y dilo antes de commitear nada más**: no
es una tarea de higiene para más adelante, es una fuga que puede estar publicada ahora mismo.

## 3. Qué NUNCA se commitea

Comprueba esto **antes** de cada `git add`:

| Ruta | Por qué |
|---|---|
| `pocketbase/pb_data/` (el directorio entero) | Expedientes de pacientes. Estuvo versionado y publicado hasta el 03/09/2026; se sacó del historial. El `.gitignore` cubre el directorio completo, incluidos los `-wal` y `-shm`. **Si algún día reaparece en `git status`, es que alguien tocó el `.gitignore`: para y avisa.** |
| `dist-electron/`, `dist/` | Artefactos de compilación. Ya ignorados. |
| `.env*` | Credenciales. Ya ignorado. |

Y **siempre** pasa un barrido de secretos por los archivos nuevos antes de commitear:

```bash
grep -rniE "password *[:=] *[\"'][^\"']|secret|api[_-]?key|PB_SU_PASS *=" <archivos nuevos>
```

Las credenciales de superusuario van **solo** por variables de entorno
(`PB_SU_EMAIL`, `PB_SU_PASS`), nunca en el código ni en un mensaje de commit.

## 4. Agrupar por intención, no por carpeta

Un commit debe responder a **una** pregunta: *¿qué problema resuelve?* Los grupos
naturales de este proyecto:

1. `security(rls):` — migraciones de PocketBase y reglas de acceso
2. `fix(estabilidad):` — bugs que afectan a un usuario real trabajando
3. `feat(ui):` — rediseño, tipografía, contraste, densidad
4. `chore(demo):` — `seed-demo.js` y datos de prueba
5. `docs:` — `CLAUDE.md`, manuales, diagramas
6. `chore(git):` — `.gitignore` y configuración

Cuando un archivo pertenece a dos grupos (pasa mucho: la sustitución de `fontSize` por
tokens barrió 28 archivos), **no lo dividas con `git add -p`**: ponlo en el commit de su
intención principal y dilo en el cuerpo del mensaje. Un historial honesto vale más que uno
artificialmente puro.

## 5. Cómo escribir el mensaje

Este historial se puede acabar mostrando en la defensa. Se escribe para que un sinodal
entienda el criterio, no solo el cambio.

- **En español, sin acentos** en el mensaje de commit (evita problemas de codificación en
  Windows). Los acentos sí van en el código y la documentación.
- Asunto: `tipo(alcance): que resuelve`, imperativo, ≤ 72 caracteres.
- Cuerpo: **el porqué y el impacto real**, no la lista de archivos —eso ya lo da el diff.
- **Cifras verificadas, nunca estimadas.** "medico1 ve 18 diagnosticos y medico2 ve 1
  (antes, 19 ambos)" vale; "mejora la seguridad" no vale.
- Si hay impacto clínico, nómbralo: *"el medico que estaba capturando una consulta perdia
  lo escrito"*.
- Si algo quedó sin probar, escríbelo en el commit. No lo escondas.

**No anadas ningun trailer de atribucion.** Nada de `Co-Authored-By:`, nada de
`Claude-Session:`, ninguna linea que mencione a Claude, Anthropic o la sesion. El mensaje
termina en su ultima linea de contenido. Es una decision explicita del autor para este
proyecto: el historial se muestra en la defensa de titulacion. Si algo los anade igualmente,
el hook `commit-msg` los borra — ver "Atribucion en los commits" en `CLAUDE.md`.

Usa `git commit -F -` con un heredoc `<<'MSG'` (comillas simples: evita que la shell
expanda `$` y backticks del mensaje).

## 6. Verificar antes de dar por bueno

- Si el commit toca `src/`, corre `npx vite build` y confirma que compila. Los errores más
  comunes de este proyecto son de sintaxis JSX: comentarios `{/* */}` dentro de una rama de
  ternario, o `//` dentro de los atributos de un componente. Para aislarlos:
  `npx esbuild <archivo> --loader:.jsx=jsx`.
- Después de commitear, `git status --short` debe quedar limpio salvo `pb_data/*.db`.
- Reporta el historial resultante con `git log --oneline`.

## 7. Límites

- **Nunca `git push` sin que el usuario lo pida en el momento.** Publicar es una acción
  hacia afuera.
- **Antes de cada `git push`, comprueba a dónde vas a publicar y con qué visibilidad.**
  Empujar a un repositorio público no es lo mismo que empujar a uno privado, y este proyecto
  maneja expedientes clínicos:

  ```bash
  git remote -v
  curl -s https://api.github.com/repos/<owner>/<repo> | grep -E '"(visibility|private)"'
  ```

  Si devuelve `"visibility": "public"`, dilo **antes** de empujar y confirma que el usuario lo
  sabe. Si la petición anónima falla o devuelve 404, el repositorio es privado o no existe:
  compruébalo, no lo supongas. Y si el push incluye archivos nuevos, pasa antes la auditoría
  de historial de la sección 2 — en un repositorio público, un commit equivocado es una
  publicación irreversible.
- **Nunca fusionar a `main` sin confirmación explícita.** Existe una tarea en Asana para
  esa fusión (`1217984345164995`); cuando se haga, debe incluir copia fuera del equipo.
- Nunca `git reset --hard`, `git checkout .` ni `git clean` sin decir antes exactamente qué
  se va a perder y obtener un sí.
- Nunca `--no-verify` ni `--amend` sobre algo ya publicado.
- Si el usuario dice que no quiere commitear todavía, no insistas: deja anotado el riesgo
  una vez y sigue.

## 8. Después del commit

Si el trabajo commiteado cierra o abre tareas del plan, invoca la skill **`asana-sync`**
para reflejarlo en el tablero "Plan Semanal". El commit registra *qué cambió en el código*;
Asana registra *qué significa para la defensa*. Los dos hacen falta.
