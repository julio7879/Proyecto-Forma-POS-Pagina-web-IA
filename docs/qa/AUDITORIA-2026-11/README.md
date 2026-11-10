# Auditoría Integral FORMA SPOS — 10 nov 2026

Esta carpeta contiene el resultado de la auditoría de documentación, agentes, código, diseño e infraestructura.

| Archivo | Qué es | Cómo usarlo |
| :--- | :--- | :--- |
| [`PLAN-QA-INTEGRAL.md`](PLAN-QA-INTEGRAL.md) | **Documento canónico.** Diagnóstico, 9 P0, 14 P1, 10 P2, solución, roadmap, accesos y anexos. | Empieza por §0 y §3. |
| [`tablero-auditoria.html`](tablero-auditoria.html) | Vista visual derivada, autocontenida (sin dependencias). | Ábrelo en el navegador; se puede imprimir. |
| [`F0-EJECUCION.md`](F0-EJECUCION.md) | Registro de F0: cambios, evidencia de tests y pendientes humanos. | Léelo antes de mergear a `main`. |

> **Regla de esta carpeta:** el `.md` es la fuente; el `.html` es una vista. Si cambia uno, se regenera el otro. No crear una tercera copia.

## Estado

- Fecha de corte: **10 de noviembre de 2026**.
- Repo: `main` en `f56bf49` + 9 archivos modificados y 2 sin seguimiento.
- Operación real: **1 persona**, rama `test/sandbox-testeo` → `main`. `test` está **19 commits atrás** de `main`; `develop` y las feature branches son legado.
- Método: 7 subagentes de auditoría + 2 de cierre (diseño e infraestructura) + verificación manual.
- Los conteos de test son **estáticos** (bloques `it(`); no se ejecutó la suite en esta auditoría.

## Siguiente paso

**F0 ejecutado** en `test/sandbox-testeo` (`211609c`). Antes de mergear a `main`: rotar el token de Telegram y las contraseñas semilla (ver [`F0-EJECUCION.md`](F0-EJECUCION.md)). Después, **F1: verdad operativa**.
