# F2 — Verdad normativa (ejecución)

- **Fecha:** 10 de noviembre de 2026, 17:05 COT.
- **Rama:** `test/sandbox-testeo`.
- **Commit F2:** `d9e4f1f`.
- **Corte de estado:** `3e0656e` (F1 publicado).
- **Objetivo:** eliminar IDs fantasma, alinear la fórmula de arqueo y resolver las contradicciones normativas sin inventar reglas de negocio.

---

## 1. Resultado

| Métrica | Antes | Después |
| :--- | ---: | ---: |
| IDs `RN-*` citados sin definición | 41 (incluyendo rangos expandidos) | **0** |
| Definiciones duplicadas | 7 detectadas por el checker | **0** |
| Modelos / enums documentados | 33 / 15 | **35 / 16** |
| Fórmulas de arqueo | 2 incompatibles | **1** (`RN-CAJ-06`) |
| CA-08 reclamado por | Compras y Traslados | **Solo Traslados** |
| Permiso `GESTIONAR_CATALOGO` | 12.º permiso inexistente | **Rol `ADMIN`** |
| Tipo de movimiento | `TRASLADO_SALIDA` (fuera del enum) | **`TRASLADO_ENVIADO`** |

**Checker:** `node scripts/check-ids.mjs --check` → `RN definidos: 103 · citados en RF: 66 · faltantes: 0 · duplicados: 0`.

---

## 2. Qué se corrigió

| Área | Cambio |
| :--- | :--- |
| Arqueo | `MOD-07` (RF-CAJ-03) y `CA-15` ahora usan la fórmula integral de `RN-CAJ-06`: base + ventas efectivo − reembolsos − sangrías − gastos menores + ingresos manuales. |
| IDs CAJ | Se eliminaron las citas a `RN-CAJ-04`, `RN-CAJ-11` y `RN-CAJ-14`; se repuntaron a `RN-CAJ-05`, `RN-CAJ-06`, `RN-CAJ-07`, `RN-CAJ-10` y `RN-AUD-02`. |
| IDs TRA | `MOD-06` ya no cita `RN-TRA-02/05/11/14/17/18/19`; se repuntó a `RN-TRA-01`, `03`, `04`, `07-10`, `12` y `15`. |
| IDs WEB | `RN-WEB-01/03/10/22/24` se eliminaron o repuntaron a `RN-WEB-05`, `RN-WEB-15` y `RN-REP-03`. |
| IDs DES | `MOD-09` ya no cita `RN-DES-03/13`; se repuntó a `RN-DES-01/02/04/05/07/09`. |
| IDs SEG | Se eliminó la familia inexistente `RN-SEG-03/05`; autenticación se apoya en `RN-ROL-06/08`. |
| RN-ENV | Se definieron `RN-ENV-01` a `RN-ENV-04` desde el contenido que ya existía (DANE, tarifas, excepción, flete entero). |
| RN-WEB-02 | Se definió el semáforo web (≥5 disponible, 1-4 últimas, 0 agotado) desde el RF y los parámetros. |
| Modelo | Nota renombrada a `Esquema-Prisma-35-Modelos.md`; enlaces, MOC y comentarios del schema actualizados a 35/16. |
| CA-08 | Solo pertenece a Traslados. `MOD-05` y `RN-COM-03` ya no lo reclaman; la compra se apoya en `RN-COM-03`/`RN-GEN-08`. |
| CA-52 | Asignado a `MOD-07` (vigencia de caja en `America/Bogota`). |
| CA-53 | **Sin RF dueño.** No se inventó una asignación; queda documentado como criterio de UI sin RF. |
| Permiso | `MOD-03` ya no exige `GESTIONAR_CATALOGO`: la creación de catálogo queda restringida a rol `ADMIN`. |
| Traslados | `TRASLADO_SALIDA` → `TRASLADO_ENVIADO`, que sí existe en el enum de 26 tipos. |
| RN-REP | Frontmatter completo (`criterios_ca`, `modelos_prisma`) y sección «E» duplicada de la matriz renombrada a «F». |
| RN-DEV-06 | Se explicó el redondeo entero: `Math.floor` por unidad y residuo a la última unidad devuelta. |
| Generador | `scripts/generate-vault.mjs` movido a `scripts/archive/`. Era un generador obsoleto que, al ejecutarse, **sobrescribía** el vault y `PROGRESO-ACTUAL.md`. |

---

## 3. Hallazgo crítico de F2

`scripts/generate-vault.mjs` seguía en la raíz y escribía `docs/vault/05-Estado-Sprints/PROGRESO-ACTUAL.md` con el contenido viejo. No estaba referenciado por `package.json` ni CI, pero un `node scripts/generate-vault.mjs` habría revertido F1 y F2. Se movió a `scripts/archive/` con un README que prohíbe ejecutarlo.

---

## 4. Verificación

| Verificación | Comando | Resultado |
| :--- | :--- | :--- |
| IDs RN | `node scripts/check-ids.mjs --check` | ✅ 0 faltantes, 0 duplicados |
| Tablero F1 | `node scripts/gen-progress.mjs --check` | ✅ al día |
| Enlaces del vault | chequeo `[[...]]` | ✅ sin roturas nuevas; quedan los 2 canvas y el ejemplo literal preexistentes |
| Typecheck/tests/build | F0 | ✅ sin cambios de código en F2; los resultados de F0 siguen vigentes |

---

## 5. Lo que F2 no resolvió (a propósito)

1. **CA-53 no tiene RF.** Es un criterio de UI (terminal POS sin scroll a 1024×768). Asignarlo a `RF-POS-01` sería falso: ese RF es búsqueda de catálogo. Se deja sin dueño hasta crear un RF de UI o declararlo criterio de QA visual.
2. **16 filas RF no declaran CA.** La matriz CA↔RF sigue incompleta; resolverlo requiere decidir qué criterio certifica cada flujo, no es una corrección mecánica.
3. **37 reglas RN no se citan en ningún RF.** No es un error, pero la trazabilidad podría mejorar.
4. **`docs/qa/` conserva referencias históricas** a 33 modelos y a los IDs viejos. No son normativas; se corrigen cuando se re-ejecuten los informes.
5. **Rotaciones de F0** (token de Telegram y contraseñas semilla) siguen pendientes en BotFather/Render y en la base.
6. **Regla de PR** de GitHub sigue activa y el flujo solo la bypassea.

---

## 6. Cómo se mantiene

1. Toda regla nueva se define una vez en `01-Reglas-Dominio/` y se cita; no se reescribe en el RF.
2. Antes de commitear cambios normativos:
   ```bash
   node scripts/check-ids.mjs --check
   node scripts/gen-progress.mjs --check
   ```
3. No ejecutar `scripts/archive/generate-vault.mjs`.
4. En F6, `check-ids --check` debe entrar al CI para bloquear IDs fantasma.
