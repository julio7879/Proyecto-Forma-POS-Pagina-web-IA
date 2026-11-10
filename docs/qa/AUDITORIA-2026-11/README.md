# Auditoría Integral FORMA SPOS — 10 nov 2026

Esta carpeta contiene el resultado de la auditoría de documentación, agentes, código, diseño e infraestructura.

| Archivo | Qué es | Cómo usarlo |
| :--- | :--- | :--- |
| [`PLAN-QA-INTEGRAL.md`](PLAN-QA-INTEGRAL.md) | **Documento canónico.** Diagnóstico, 9 P0, 14 P1, 10 P2, solución, roadmap, accesos y anexos. | Empieza por §0 y §3. |
| [`tablero-auditoria.html`](tablero-auditoria.html) | Vista visual derivada, autocontenida (sin dependencias). | Ábrelo en el navegador; se puede imprimir. |

> **Regla de esta carpeta:** el `.md` es la fuente; el `.html` es una vista. Si cambia uno, se regenera el otro. No crear una tercera copia.

## Estado

- Fecha de corte: **10 de noviembre de 2026**.
- Repo: `main` en `f56bf49` + 9 archivos modificados y 2 sin seguimiento.
- Operación real: **1 persona**, rama `test/sandbox-testeo` → `main`. `test` está **19 commits atrás** de `main`; `develop` y las feature branches son legado.
- Método: 7 subagentes de auditoría + 2 de cierre (diseño e infraestructura) + verificación manual.
- Los conteos de test son **estáticos** (bloques `it(`); no se ejecutó la suite en esta auditoría.

## Siguiente paso

Aprobar el plan y ejecutar **F0 (seguridad y congelamiento)** antes de cualquier otra fase. Ver §8 y Anexo D del plan.
