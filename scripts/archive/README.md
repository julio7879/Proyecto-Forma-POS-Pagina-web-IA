# Scripts archivados

## `generate-vault.mjs`

- **Archivado:** 10 de noviembre de 2026 (F2).
- **Motivo:** generaba el vault con contenido hardcodeado y escribía `docs/vault/05-Estado-Sprints/PROGRESO-ACTUAL.md`. Si se ejecutaba, **sobrescribía** las correcciones de F0/F1/F2 y devolvía el tablero a una versión contradictoria.
- **No ejecutar.** La fuente es `docs/vault/` y el tablero se genera con:

```bash
node scripts/gen-progress.mjs
node scripts/gen-progress.mjs --check
```

Se conserva solo como referencia histórica. No se debe volver a enlazar desde `package.json`, CI ni documentación operativa.
