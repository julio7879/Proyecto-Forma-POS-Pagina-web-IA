# Auditoría Integral FORMA SPOS — 10 nov 2026

Esta carpeta contiene el resultado de la auditoría de documentación, agentes, código, diseño e infraestructura.

| Archivo | Qué es | Cómo usarlo |
| :--- | :--- | :--- |
| [`PLAN-QA-INTEGRAL.md`](PLAN-QA-INTEGRAL.md) | **Documento canónico.** Diagnóstico, 9 P0, 14 P1, 10 P2, solución, roadmap, accesos y anexos. | Empieza por §0 y §3. |
| [`tablero-auditoria.html`](tablero-auditoria.html) | Vista visual derivada, autocontenida (sin dependencias). | Ábrelo en el navegador; se puede imprimir. |
| [`F0-EJECUCION.md`](F0-EJECUCION.md) | Registro de F0: cambios, evidencia de tests y pendientes humanos. | Léelo antes de mergear a `main`. |
| [`F1-EJECUCION.md`](F1-EJECUCION.md) | Registro de F1: backlog único, tablero generado, SSOT y limpieza de ramas. | Léelo para entender de dónde sale el estado actual. |
| [`F2-EJECUCION.md`](F2-EJECUCION.md) | Registro de F2: IDs RN, arqueo, CA, 35/16 y generador obsoleto archivado. | Léelo antes de tocar reglas o RF. |
| [`F3-EJECUCION.md`](F3-EJECUCION.md) | Registro de F3: `CLAUDE.md` puntero, `ask_user_question`, skills sincronizadas y catálogo. | Léelo antes de editar una skill. |
| [`F4-EJECUCION.md`](F4-EJECUCION.md) | Registro de F4: constitución visual, 14 mandamientos, paleta y alcance MVP. | Léelo antes de tocar diseño o UI. |

> **Regla de esta carpeta:** el `.md` es la fuente; el `.html` es una vista. Si cambia uno, se regenera el otro. No crear una tercera copia.

## Estado

- Fecha de corte: **10 de noviembre de 2026**.
- Repo: `main` en `f56bf49` + 9 archivos modificados y 2 sin seguimiento.
- Operación real: **1 persona**, rama `test/sandbox-testeo` → `main`. `test` está **19 commits atrás** de `main`; `develop` y las feature branches son legado.
- Método: 7 subagentes de auditoría + 2 de cierre (diseño e infraestructura) + verificación manual.
- Los conteos de test son **estáticos** (bloques `it(`); no se ejecutó la suite en esta auditoría.

## Siguiente paso

**F4 ejecutado** en `test/sandbox-testeo` (`12f4dda`): `DISENO-SSOT`, 14 mandamientos en ARQ-07 §0, alcance MVP y regla de 6 bloques. Después, **F5: verdad del código** (POS persistente, arqueo y workers) y la decisión de paleta `DV-023`.
