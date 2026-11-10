# F1 — Verdad operativa (ejecución)

- **Fecha:** 10 de noviembre de 2026, 16:56 COT.
- **Rama:** `test/sandbox-testeo`.
- **Commit F1:** `4db1e70`.
- **Corte de estado:** `20fd212` (F0 publicado).
- **Objetivo:** que el estado del proyecto salga de una sola fuente y que las ramas de trabajo reflejen la operación real.

---

## 1. Resultado

El tablero anterior tenía tres denominadores incompatibles (46, 40 y 38) y estados que se contradecían. Ahora hay **una sola lista de 46 tareas** y el tablero se genera desde ella.

| Métrica | Valor |
| :--- | ---: |
| Tareas totales | **46** |
| Hechas con evidencia | **27** |
| En curso | **2** |
| Declaradas sin evidencia | **5** |
| Pendientes | **12** |
| Avance verificado | **58.7 %** |
| Avance con declaradas | **69.6 %** |

| Sprint | Tareas | Hechas | En curso | Declaradas | Pendientes | Avance verificado |
| :--- | ---: | ---: | ---: | ---: | ---: | :--- |
| 0 — Fundación, datos y utilidades | 6 | 3 | 0 | 1 | 2 | 50.0 % |
| 1 — Identidad, sedes y catálogo | 9 | 7 | 0 | 1 | 1 | 77.8 % |
| 2 — Kardex, compras y traslados | 8 | 5 | 1 | 1 | 1 | 62.5 % |
| 3 — Caja, POS, descuentos y devoluciones | 9 | 7 | 0 | 1 | 1 | 77.8 % |
| 4 — Tienda web, DANE y reservas | 8 | 4 | 1 | 0 | 3 | 50.0 % |
| 5 — Reportes, dashboard y certificación | 6 | 1 | 0 | 1 | 4 | 16.7 % |

> **`Declarado` no es `hecho`.** Son tareas que el tablero anterior daba por certificadas, pero para las que no hay PR, commit ni salida de test reproducible. Se cuentan aparte para no inflar el avance.

---

## 2. Qué se creó o cambió

| Artefacto | Cambio |
| :--- | :--- |
| `docs/vault/05-Estado-Sprints/backlog.yaml` | **Nuevo.** 46 tareas con `id`, `sprint`, `titulo`, `responsable`, `estado` y `evidencia`. Es la fuente única del estado. |
| `scripts/gen-progress.mjs` | **Nuevo.** Genera `PROGRESO-ACTUAL.md` desde el backlog, sin dependencias. `--check` falla si el tablero está desactualizado. |
| `docs/vault/05-Estado-Sprints/PROGRESO-ACTUAL.md` | **Reemplazado.** Ya no se edita a mano; incluye resumen, detalle y evidencia. |
| `docs/vault/00-GOBERNANZA/SSOT.md` | **Nuevo.** Declara qué es canónico, qué es derivado, la precedencia y el protocolo de cambio. |
| `AGENTS.md` | **Nuevo §0.** Operación de 1 persona, `test` → `main`, Node 22, estado generado y enlace al SSOT. |
| `PLAN-MAESTRO-SPRINTS.md` | **Aviso de histórico.** Se conserva como referencia; ya no es el estado. |
| `MATRIZ-ROLES-Y-TAREAS.md` | **Aviso de histórico.** El equipo de 6 y el GitFlow anterior ya no rigen. |
| `docs/vault/00-Indice-Mapa-Mental-MOC.md` | **Nueva sección 7.** Gobernanza y estado vivo. |

**Reconciliación de las 46 tareas:** se tomaron las 45 del Plan Maestro (Sprints 0-5) y se añadió `SP1-09` (catálogo público), que existía en el tablero pero no en el plan. Ese es el origen del número 46 que el tablero citaba sin respaldo.

---

## 3. Limpieza de ramas

| Acción | Resultado |
| :--- | :--- |
| Tags de archivo | `archive/develop-2026-11` y `archive/feature-*` para las 5 ramas declaradas obsoletas |
| Borradas localmente | `develop`, `SP1-01`, `SP1-02`, `SP1-05`, `SP2-08`, `SP3-05` |
| Borradas por estar fusionadas | 12 feature branches ya contenidas en `main` (con `git branch -d`, que solo borra si están mergeadas) |
| Ramas locales restantes | **2**: `main` y `test/sandbox-testeo` |
| Ramas remotas | **52 sin tocar.** Su limpieza requiere una decisión aparte. |

---

## 4. Verificación

| Verificación | Comando | Resultado |
| :--- | :--- | :--- |
| Tablero al día | `node scripts/gen-progress.mjs --check` | ✅ `PROGRESO-ACTUAL.md está al día` |
| Enlaces del vault | chequeo de `[[...]]` | ✅ sin enlaces nuevos roto; quedan los 2 canvas y el ejemplo literal `[[...]]` preexistentes |
| Typecheck/test/build | F0 | ✅ sin cambios de código en F1; los resultados de F0 siguen vigentes |

---

## 5. Decisiones y supuestos

- Los títulos y responsables vienen del **Plan Maestro**; donde el tablero y el plan chocaban (`SP1-01`, `SP5-02`), manda el plan y se anota la discrepancia en la evidencia.
- `SP0-03` queda **pendiente** porque la ruta declarada `backend/src/shared/seeds/daneCatalog.ts` no existe.
- `SP4-02` queda **en curso** porque el worker existe pero no se arranca desde `server.ts`.
- `SP5-01` queda **declarado** porque el tablero lo certifica sin PR ni salida reproducible.
- Los estados son una **primera reconciliación**; si alguno no coincide con tu criterio, se cambia en `backlog.yaml` y se regenera. No se edita el tablero.

---

## 6. Pendientes

1. **Revisar los 5 `declarados` y los 2 `en curso`.** Son los que más pueden cambiar el avance real.
2. **Decidir la limpieza de las 52 ramas remotas.** No se tocaron.
3. **Renombrar** `Esquema-Prisma-33-Modelos` a 35 modelos (F2). El SSOT ya fija el número real.
4. **Añadir `node scripts/gen-progress.mjs --check` al CI** (F6).
5. **Decidir la regla de PR** en GitHub: la regla actual exige PR y el flujo solo la bypassea.
6. **Actualizar el `commit` del backlog** cuando se cierre una fase; hoy apunta al corte de F0.

---

## 7. Cómo se mantiene

1. Se edita `docs/vault/05-Estado-Sprints/backlog.yaml`.
2. Se ejecuta `node scripts/gen-progress.mjs`.
3. Se verifica con `node scripts/gen-progress.mjs --check`.
4. Se commitea el backlog y el tablero juntos, con la evidencia.

El tablero ya no se escribe a mano. Si alguien lo edita, `--check` lo detecta.
