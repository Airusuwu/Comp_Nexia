# Guía de Git y GitHub para colaborar en Nexia

Esta guía está pensada para una persona que comienza a usar Git. Los ejemplos
usan el repositorio privado `Airusuwu/Comp_Nexia` y sus tres ramas permanentes:
`main`, `front` y `back`.

## 1. Conceptos fundamentales

### Git y GitHub no son lo mismo

**Git** es el programa que registra el historial de archivos en tu computadora.
Permite comparar cambios, crear commits y trabajar con ramas incluso sin conexión.

**GitHub** es el servicio en Internet donde se guarda una copia remota del
repositorio. Sirve para compartir cambios, revisarlos mediante Pull Requests y
mantener un respaldo del historial.

### Vocabulario básico

- **Repositorio local:** carpeta del proyecto en tu computadora, incluida su información de Git.
- **Repositorio remoto:** copia compartida en GitHub. En este proyecto se llama `origin`.
- **Rama:** línea de trabajo. `main` es estable, `front` recibe el frontend y `back` recibe el backend.
- **Working tree:** archivos tal como están actualmente en tu carpeta.
- **Staging area:** selección de cambios que entrarán en el próximo commit.
- **Commit:** punto guardado del historial con autor, fecha y mensaje.
- **Push:** envío de commits locales a GitHub.
- **Pull Request o PR:** solicitud para revisar e integrar una rama en otra.

El recorrido normal es:

```text
editar → revisar → staging → commit → push → Pull Request → Squash and merge
```

## 2. Configuración inicial

Abre PowerShell, Git Bash o la terminal de tu editor. En Windows puedes revisar
que Git esté instalado con:

```bash
git --version
```

- **Para qué sirve:** muestra la versión instalada de Git.
- **Dónde:** en cualquier carpeta.
- **Cuándo:** antes de empezar en una computadora nueva.
- **Resultado esperado:** un texto similar a `git version 2.51.2.windows.1`.

Configura el nombre que aparecerá en tus commits:

```bash
git config --global user.name "Tu nombre"
```

- **Para qué sirve:** identifica al autor de los commits.
- **Dónde:** en cualquier carpeta; la opción `--global` lo aplica a tu usuario.
- **Cuándo:** una vez por computadora o cuando necesites corregir el nombre.
- **Resultado esperado:** si funciona, no muestra ningún mensaje.

Configura tu correo de GitHub:

```bash
git config --global user.email "tu-correo@example.com"
```

- **Para qué sirve:** asocia los commits con tu cuenta.
- **Dónde:** en cualquier carpeta.
- **Cuándo:** una vez por computadora. También puedes usar el correo privado `noreply` de GitHub.
- **Resultado esperado:** no muestra mensajes.

Comprueba ambos valores:

```bash
git config --global --list
```

- **Para qué sirve:** lista la configuración global de Git.
- **Dónde:** en cualquier carpeta.
- **Cuándo:** después de configurar nombre y correo o al investigar un problema de autoría.
- **Resultado esperado:** aparecen líneas `user.name=...` y `user.email=...`.

### Acceso a GitHub

El repositorio usa HTTPS. Al hacer el primer `push` o `pull`, Git puede abrir el
navegador o el administrador de credenciales para iniciar sesión. Sigue el
inicio de sesión oficial de GitHub. No guardes contraseñas, tokens ni códigos de
acceso dentro del proyecto y no los compartas por mensajes.

## 3. Obtener el proyecto por primera vez

Ubícate en la carpeta donde quieras guardar el proyecto, no dentro de otra copia
de `Comp_Nexia`, y ejecuta:

```bash
git clone https://github.com/Airusuwu/Comp_Nexia.git
```

- **Para qué sirve:** descarga el repositorio, su historial y la configuración de `origin`.
- **Dónde:** en la carpeta padre donde se creará `Comp_Nexia`.
- **Cuándo:** una sola vez por computadora.
- **Resultado esperado:** se crea la carpeta `Comp_Nexia` y aparece el progreso de descarga.

Entra a la carpeta:

```bash
cd Comp_Nexia
```

- **Para qué sirve:** cambia la terminal a la raíz del proyecto.
- **Dónde:** en la carpeta padre de `Comp_Nexia`.
- **Cuándo:** antes de ejecutar comandos del proyecto.
- **Resultado esperado:** la ruta de la terminal termina en `Comp_Nexia`.

Comprueba el remoto:

```bash
git remote -v
```

- **Para qué sirve:** muestra las direcciones usadas para descargar y subir cambios.
- **Dónde:** en la raíz del repositorio.
- **Cuándo:** después de clonar o si Git intenta usar un repositorio equivocado.
- **Resultado esperado:** `origin` apunta a `https://github.com/Airusuwu/Comp_Nexia.git`.

## 4. Consultar el estado antes de trabajar

```bash
git status
```

- **Para qué sirve:** muestra la rama actual, archivos modificados y contenido del staging.
- **Dónde:** dentro de `Comp_Nexia`.
- **Cuándo:** antes y después de cada grupo de cambios, y antes de cambiar de rama.
- **Resultado esperado:** informa la rama y, si todo está limpio, `working tree clean`.

```bash
git branch --show-current
```

- **Para qué sirve:** muestra únicamente el nombre de la rama activa.
- **Dónde:** dentro de `Comp_Nexia`.
- **Cuándo:** antes de comenzar a editar.
- **Resultado esperado:** `front`, `back` o `main`.

```bash
git diff
```

- **Para qué sirve:** enseña los cambios que aún no están en staging.
- **Dónde:** dentro de `Comp_Nexia`.
- **Cuándo:** antes de seleccionar archivos para un commit.
- **Resultado esperado:** líneas eliminadas con `-` y añadidas con `+`; no muestra nada si no hay diferencias.

```bash
git log --oneline --decorate -10
```

- **Para qué sirve:** muestra los diez commits más recientes de forma compacta.
- **Dónde:** dentro de `Comp_Nexia`.
- **Cuándo:** para conocer el historial reciente o confirmar un commit.
- **Resultado esperado:** una lista de identificadores cortos, mensajes y ramas.

## 5. Consultar y entrar a las ramas

Lista ramas locales:

```bash
git branch
```

- **Para qué sirve:** lista las ramas existentes en tu computadora.
- **Dónde:** dentro de `Comp_Nexia`.
- **Cuándo:** antes de cambiar de rama.
- **Resultado esperado:** la rama activa aparece marcada con `*`.

Lista ramas locales y remotas:

```bash
git branch -a
```

- **Para qué sirve:** incluye referencias de GitHub como `remotes/origin/front`.
- **Dónde:** dentro de `Comp_Nexia`.
- **Cuándo:** después de clonar o buscar una rama que aún no existe localmente.
- **Resultado esperado:** aparecen `main`, `front`, `back` y sus versiones remotas.

Actualiza la información de GitHub sin modificar tus archivos:

```bash
git fetch origin
```

- **Para qué sirve:** descarga referencias y commits nuevos del remoto.
- **Dónde:** dentro de `Comp_Nexia`.
- **Cuándo:** al comenzar la jornada o antes de comparar ramas.
- **Resultado esperado:** se muestran las referencias actualizadas o no aparece salida si no cambió nada.

Entra a una rama que ya existe localmente:

```bash
git switch front
```

- **Para qué sirve:** cambia la rama activa a `front`.
- **Dónde:** dentro de `Comp_Nexia`.
- **Cuándo:** antes de modificar frontend o su documentación.
- **Resultado esperado:** `Switched to branch 'front'` o confirma que ya estabas en ella.

Para backend, usa:

```bash
git switch back
```

- **Para qué sirve:** cambia la rama activa a `back`.
- **Dónde:** dentro de `Comp_Nexia`.
- **Cuándo:** antes de modificar backend o su documentación.
- **Resultado esperado:** `Switched to branch 'back'`.

Si la rama aparece solo como remota durante el primer acceso:

```bash
git switch --track origin/front
```

- **Para qué sirve:** crea la rama local `front` vinculada con `origin/front`.
- **Dónde:** dentro de `Comp_Nexia`, después de `git fetch origin`.
- **Cuándo:** solo si `git switch front` indica que la rama local no existe.
- **Resultado esperado:** se crea `front` y queda configurada para seguir la rama remota.

Para el primer acceso a backend, el equivalente es:

```bash
git switch --track origin/back
```

- **Para qué sirve:** crea `back` local vinculada con `origin/back`.
- **Dónde:** dentro de `Comp_Nexia`.
- **Cuándo:** si `back` existe en GitHub, pero no localmente.
- **Resultado esperado:** se crea y activa `back`.

## 6. Diferencias entre comandos parecidos

| Comando | Qué hace | Cuándo se usa |
| --- | --- | --- |
| `clone` | Crea una copia local completa | Solo la primera vez en una computadora |
| `fetch` | Descarga información sin mezclarla con tu rama | Para revisar novedades de forma segura |
| `pull` | Descarga y aplica cambios a la rama activa | Para actualizar la rama en la que trabajas |
| `switch` | Cambia la rama activa | Antes de editar archivos de otra área |
| `push` | Envía commits locales a GitHub | Después de crear commits revisados |

`git pull` no reemplaza a `git fetch`: `fetch` permite mirar primero; `pull`
actualiza inmediatamente la rama activa.

## 7. Actualizar la rama de trabajo

Primero comprueba que no haya cambios pendientes con `git status`. Después entra
a la rama correcta y actualízala:

```bash
git switch front
git pull --ff-only origin front
```

- **Para qué sirve:** activa `front` y trae cambios solo si pueden aplicarse sin crear un merge inesperado.
- **Dónde:** dentro de `Comp_Nexia`.
- **Cuándo:** antes de comenzar trabajo de frontend.
- **Resultado esperado:** `Already up to date` o una lista de archivos actualizados.

Para backend:

```bash
git switch back
git pull --ff-only origin back
```

- **Para qué sirve:** activa y actualiza `back` de forma lineal.
- **Dónde:** dentro de `Comp_Nexia`.
- **Cuándo:** antes de comenzar trabajo de backend.
- **Resultado esperado:** la rama queda al día o Git informa que necesita resolver una diferencia de historial.

Si `--ff-only` rechaza la actualización, no fuerces el cambio. Ejecuta
`git status`, `git log --oneline --decorate --graph --all -15` y coordina con el
equipo antes de elegir cómo integrar los historiales.

## 8. Preparar y guardar un cambio

Después de editar, revisa el resumen:

```bash
git status --short
```

- **Para qué sirve:** muestra una lista compacta de archivos nuevos, modificados o seleccionados.
- **Dónde:** dentro de `Comp_Nexia`.
- **Cuándo:** antes de preparar cada commit.
- **Resultado esperado:** por ejemplo, ` M frontend/index.html`.

Selecciona archivos concretos:

```bash
git add frontend/index.html frontend/assets/css/base.css
```

- **Para qué sirve:** añade únicamente esos archivos al staging.
- **Dónde:** dentro de `Comp_Nexia`.
- **Cuándo:** cuando ambos archivos pertenecen al mismo cambio.
- **Resultado esperado:** no muestra salida; `git status` los presenta como preparados.

Para preparar todos los cambios revisados de la carpeta actual:

```bash
git add .
```

- **Para qué sirve:** lleva al staging todos los archivos nuevos, modificados y eliminados bajo la carpeta actual.
- **Dónde:** preferentemente en la raíz de `Comp_Nexia`.
- **Cuándo:** solo después de revisar `git status` y confirmar que todo pertenece al commit.
- **Resultado esperado:** no muestra salida.

Revisa exactamente lo que entrará al commit:

```bash
git diff --staged
```

- **Para qué sirve:** compara el staging con el último commit.
- **Dónde:** dentro de `Comp_Nexia`.
- **Cuándo:** siempre antes de confirmar un commit.
- **Resultado esperado:** muestra únicamente los cambios seleccionados.

Si seleccionaste un archivo por error, quítalo del staging sin borrar su trabajo:

```bash
git restore --staged ruta/del/archivo
```

- **Para qué sirve:** retira el archivo del próximo commit, pero conserva sus modificaciones.
- **Dónde:** dentro de `Comp_Nexia`.
- **Cuándo:** antes del commit, si el archivo no pertenece a ese cambio.
- **Resultado esperado:** vuelve a aparecer como modificado, pero no preparado.

Crea el commit:

```bash
git commit -m "feat: maquetar panel de acciones"
```

- **Para qué sirve:** guarda el contenido del staging como un punto del historial.
- **Dónde:** dentro de `Comp_Nexia` y en la rama correcta.
- **Cuándo:** cuando el cambio es coherente, está revisado y tiene un mensaje descriptivo.
- **Resultado esperado:** identificador del commit, mensaje y cantidad de archivos modificados.

Sube los commits:

```bash
git push
```

- **Para qué sirve:** envía los commits de la rama activa a su rama vinculada en GitHub.
- **Dónde:** dentro de `Comp_Nexia`.
- **Cuándo:** después de uno o varios commits correctos.
- **Resultado esperado:** Git muestra el rango enviado o indica `Everything up-to-date`.

## 9. Pull Request hacia `main`

Después de subir una mejora terminada:

1. Abre `https://github.com/Airusuwu/Comp_Nexia`.
2. Entra en **Pull requests** y selecciona **New pull request**.
3. Elige `main` como **base**.
4. Elige `front` o `back` como **compare**, según el área trabajada.
5. Revisa los commits y archivos modificados.
6. Escribe un título claro y un resumen de implementación y validaciones.
7. Crea el Pull Request y déjalo pendiente de revisión.

Crear el PR no integra cambios. No pulses botones de mezcla hasta que la revisión
esté aprobada. El método acordado es **Squash and merge**.

### Cómo funciona Squash and merge

GitHub reúne todos los commits del PR en un solo commit nuevo sobre `main`. Esto
mantiene un historial estable y compacto, pero el commit resultante tiene un
identificador diferente a los commits originales de `front` o `back`.

Después de revisar el PR:

1. Selecciona **Squash and merge**.
2. Revisa el mensaje final del commit.
3. Confirma la integración solo cuando el equipo lo haya autorizado.

Las ramas `front` y `back` son permanentes: no las elimines después de integrar.

## 10. Sincronizar después de un Squash and merge

Como el squash crea un commit nuevo, intentar mezclar historiales antiguos sin
revisión puede producir conflictos o commits duplicados. Usa este flujo seguro:

```bash
git fetch origin
git switch main
git pull --ff-only origin main
```

- **Para qué sirve:** actualiza las referencias, entra a `main` y descarga el commit creado por el squash.
- **Dónde:** dentro de `Comp_Nexia`, sin cambios pendientes.
- **Cuándo:** después de integrar un PR.
- **Resultado esperado:** `main` local coincide con `origin/main`.

Luego entra a la rama permanente correspondiente e incorpora `main`:

```bash
git switch front
git merge main
git push origin front
```

- **Para qué sirve:** conserva la historia de `front`, registra la integración de `main` y publica el resultado.
- **Dónde:** dentro de `Comp_Nexia`.
- **Cuándo:** después de integrar un PR de `front` mediante squash.
- **Resultado esperado:** Git crea o adelanta la integración; pueden aparecer conflictos si ambas ramas cambiaron las mismas líneas.

Para `back`, reemplaza `front` por `back`:

```bash
git switch back
git merge main
git push origin back
```

No uses `push --force` ni `reset --hard` como atajos para hacer coincidir las
ramas. En ramas compartidas pueden borrar o esconder trabajo de otras personas.

## 11. Antes de cambiar de rama

Ejecuta siempre:

```bash
git status
```

Si hay cambios, elige una opción segura:

- Termina la mejora y crea un commit.
- Si el trabajo todavía no está listo, crea un commit temporal claramente identificado y coordina antes de subirlo.
- Si necesitas guardar cambios brevemente, usa `git stash push -m "trabajo temporal"`, cambia de rama y recupéralos después con `git stash pop`.

```bash
git stash push -m "ajuste visual en progreso"
```

- **Para qué sirve:** guarda temporalmente cambios rastreados y limpia la carpeta de trabajo.
- **Dónde:** en la rama donde realizaste los cambios.
- **Cuándo:** solo para una interrupción breve, no como almacenamiento permanente.
- **Resultado esperado:** Git informa que guardó el estado de la rama.

```bash
git stash pop
```

- **Para qué sirve:** reaplica el último guardado temporal y lo retira de la lista si no hay problemas.
- **Dónde:** normalmente en la rama donde debe continuar el trabajo.
- **Cuándo:** al retomar inmediatamente los cambios.
- **Resultado esperado:** reaparecen los archivos modificados; si hay conflictos, Git los señala.

Antes de usar `stash`, revisa si existen archivos nuevos: para incluirlos se
necesita `git stash push -u -m "mensaje"`.

## 12. Problemas frecuentes y recuperación segura

### La subida fue rechazada

Normalmente significa que GitHub tiene commits que tú no tienes.

```bash
git status
git fetch origin
git log --oneline --decorate --graph --all -15
```

- **Para qué sirve:** comprueba el estado, descarga referencias y muestra dónde divergen las ramas.
- **Dónde:** dentro de `Comp_Nexia`.
- **Cuándo:** después de un rechazo de `git push`.
- **Resultado esperado:** permite identificar tus commits y los remotos antes de modificar el historial.

Si no tienes cambios pendientes y el equipo confirma que la actualización es
compatible, ejecuta `git pull --ff-only`. Si las ramas divergieron, coordina la
integración. No respondas al rechazo con `push --force`.

### Hay conflictos

Git marca los archivos afectados en `git status`. Abre cada archivo y busca los
marcadores `<<<<<<<`, `=======` y `>>>>>>>`; entre ellos aparecerán tu versión
y la versión que Git intentaba integrar.

Decide con el equipo qué contenido debe conservarse, elimina los marcadores,
prueba el resultado y prepara los archivos resueltos con `git add`. Después
completa el merge con `git commit`.

Si aún no modificaste los archivos y quieres cancelar el merge para pedir ayuda:

```bash
git merge --abort
```

- **Para qué sirve:** vuelve al estado anterior al intento de merge.
- **Dónde:** dentro del repositorio mientras existe un merge sin completar.
- **Cuándo:** cuando no puedes resolver con seguridad los conflictos.
- **Resultado esperado:** desaparece el estado de merge; tus cambios previos deben conservarse.

### Trabajaste en la rama equivocada y aún no hiciste commit

Conserva los cambios con stash, entra a la rama correcta y recupéralos:

```bash
git stash push -u -m "mover trabajo a la rama correcta"
git switch front
git stash pop
```

Revisa `git status` y los archivos antes de crear el commit.

### Hiciste un commit en la rama equivocada

No borres ni fuerces el historial compartido. Copia el identificador mostrado por
`git log --oneline`, cambia a la rama correcta y aplica el commit:

```bash
git switch front
git cherry-pick IDENTIFICADOR
```

- **Para qué sirve:** copia un commit concreto a la rama activa.
- **Dónde:** dentro de `Comp_Nexia` y con la carpeta de trabajo limpia.
- **Cuándo:** cuando un commit correcto quedó en otra rama y todavía necesitas conservarlo.
- **Resultado esperado:** se crea un commit equivalente en `front`.

Después avisa al equipo. La limpieza de la rama equivocada debe decidirse en
conjunto, especialmente si el commit ya fue subido.

### Quieres descartar algo

Antes de descartar, revisa `git diff` y confirma la ruta exacta. Para un archivo
modificado que todavía no tiene commit:

```bash
git restore ruta/del/archivo
```

- **Para qué sirve:** restaura ese archivo a su última versión confirmada.
- **Dónde:** dentro del repositorio.
- **Cuándo:** solo cuando estás seguro de que no necesitas sus cambios locales.
- **Resultado esperado:** el archivo deja de aparecer como modificado.

Este comando elimina cambios no guardados del archivo. Si existe alguna duda,
cópialos a un lugar seguro o crea un commit antes.

## 13. Reglas para ramas compartidas

- Confirma la rama activa antes de editar.
- Actualiza la rama antes de comenzar y antes de subir.
- Comunica qué archivos o componentes estás modificando.
- Crea commits pequeños con un solo propósito.
- Revisa `git diff --staged` antes de cada commit.
- No subas credenciales, dependencias, temporales ni resultados generados.
- No reescribas el historial de `main`, `front` o `back`.
- No uses `push --force` ni `reset --hard` como soluciones rutinarias.
- No integres un Pull Request sin revisión.
- Conserva las ramas permanentes después de cada integración.

## 14. Ejemplo completo de trabajo en `front`

```bash
cd Comp_Nexia
git status
git fetch origin
git switch front
git pull --ff-only origin front
```

Edita los archivos del frontend y después:

```bash
git status --short
git diff
git add frontend/index.html frontend/assets/css/base.css frontend/assets/css/components.css
git diff --staged
git commit -m "feat: construir interfaz visual de Nexia"
git push origin front
```

Resultado esperado: el commit aparece en `front` dentro de GitHub. Abre un Pull
Request con base `main` y compare `front`, solicita revisión y no lo integres de
forma automática.

## 15. Ejemplo completo de trabajo en `back`

```bash
cd Comp_Nexia
git status
git fetch origin
git switch back
git pull --ff-only origin back
```

Edita únicamente archivos del backend y su documentación. Después:

```bash
git status --short
git diff
git add backend docs/contexto/CONTEXTO.md
git diff --staged
git commit -m "feat: agregar validación inicial del pseudocódigo"
git push origin back
```

Resultado esperado: el commit aparece en `back`. Abre un Pull Request con base
`main` y compare `back`; espera la revisión y usa Squash and merge solo cuando
el equipo lo autorice.

## 16. Consulta rápida

| Necesidad | Comando | Lugar | Resultado esperado |
| --- | --- | --- | --- |
| Ver versión de Git | `git --version` | Cualquier carpeta | Versión instalada |
| Descargar el proyecto | `git clone URL` | Carpeta padre | Nueva carpeta del repositorio |
| Ver estado | `git status` | Repositorio | Rama y cambios actuales |
| Ver rama activa | `git branch --show-current` | Repositorio | Nombre de la rama |
| Listar ramas locales | `git branch` | Repositorio | Ramas con `*` en la activa |
| Listar todas las ramas | `git branch -a` | Repositorio | Ramas locales y remotas |
| Consultar novedades | `git fetch origin` | Repositorio | Referencias remotas actualizadas |
| Cambiar a frontend | `git switch front` | Repositorio limpio | Rama `front` activa |
| Cambiar a backend | `git switch back` | Repositorio limpio | Rama `back` activa |
| Actualizar rama | `git pull --ff-only` | Rama correcta | Commits remotos aplicados |
| Ver cambios | `git diff` | Repositorio | Diferencias sin staging |
| Seleccionar un archivo | `git add archivo` | Repositorio | Archivo en staging |
| Revisar staging | `git diff --staged` | Repositorio | Contenido del próximo commit |
| Quitar del staging | `git restore --staged archivo` | Repositorio | Cambio conservado sin staging |
| Crear commit | `git commit -m "mensaje"` | Rama correcta | Nuevo commit local |
| Subir commits | `git push` | Rama vinculada | Commits publicados en GitHub |
| Guardar temporalmente | `git stash push -u -m "mensaje"` | Rama con cambios | Carpeta limpia y cambios guardados |
| Recuperar temporal | `git stash pop` | Rama de destino | Cambios reaplicados |
| Cancelar merge | `git merge --abort` | Merge en conflicto | Estado previo restaurado |
| Ver historial | `git log --oneline --decorate -10` | Repositorio | Lista de commits recientes |

Cuando un comando produzca un resultado inesperado, detente y ejecuta
`git status`. Lee el mensaje completo, conserva el trabajo y consulta al equipo
antes de aplicar una solución destructiva.
