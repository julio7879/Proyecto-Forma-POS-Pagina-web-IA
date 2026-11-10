# `.claude/skills` — copia generada

> **No editar aquí.** La fuente única es `.agent/skills/`.

Estas skills se copian desde `.agent/skills/` para compatibilidad con Claude Code. Para actualizarlas:

```bash
node scripts/sync-skills.mjs
node scripts/sync-skills.mjs --check
```

`--check` falla si una copia diverge. No agregar skills nuevas en esta carpeta: se crean en `.agent/skills/` y se sincronizan.
