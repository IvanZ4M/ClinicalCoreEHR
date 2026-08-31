---
name: git-commit
description: Vigila el control de versiones de ClinicalCoreEHR y crea los commits. Úsala cuando se termine una unidad de trabajo (un bug arreglado, una pantalla rediseñada, una migración de seguridad), cuando el árbol de trabajo acumule cambios sin commitear, antes de cualquier operación arriesgada (cambiar de rama, fusionar, reinstalar dependencias, correr seed-demo.js), y al cerrar una sesión de trabajo. También cuando el usuario pida commitear, revisar el estado del repositorio o preparar la fusión a main.
---

# Control de versiones de ClinicalCoreEHR

El 31 de agosto de 2026 se descubrió que **tres días de trabajo —incluidas cuatro
correcciones de seguridad verificadas— vivían solo en el árbol de trabajo**. El último
commit era del 14 de mayo. Un `git checkout` descuidado o un disco muerto habría borrado
26 tareas cerradas.

Esta skill existe para que eso no vuelva a pasar.

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

## 3. Qué NUNCA se commitea

Comprueba esto **antes** de cada `git add`:

| Ruta | Por qué |
|---|---|
| `pocketbase/pb_data/*.db` | SQLite con expedientes de pacientes. Está versionado por un error histórico; sacarlo del índice es una tarea propia en Asana, no un efecto colateral. **Déjalo sin preparar y avisa.** |
| `pocketbase/pb_data/backups/` | ZIP pesados con datos clínicos. Ya ignorado. |
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

Cierra **siempre** con:

```
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: <URL de la sesion actual>
```

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
