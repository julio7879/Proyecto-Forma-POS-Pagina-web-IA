# Harness — Forma SPOS

> **Este archivo es un puntero.** La fuente canónica es [AGENTS.md](AGENTS.md).
> No agregar reglas nuevas aquí: si hay conflicto, gana `AGENTS.md`.

- **Flujo obligatorio:** 5 etapas (0 a 4), en `AGENTS.md` §2.
- **Parada obligatoria:** usa `ask_user_question`; prohibido suponer reglas.
- **Invariantes:** 7, en `AGENTS.md` §3.
- **Skills:** matriz de 19 skills de dominio en `AGENTS.md` §4; catálogo completo en `docs/vault/08-Skills/CATALOGO-SKILLS.md`.
- **Operación:** 1 persona, `test/sandbox-testeo` → `main`; estado en `backlog.yaml`.
