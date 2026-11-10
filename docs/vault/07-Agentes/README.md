# Agentes — roles documentados

> **Importante:** los 11 `AGE-*` son **roles/personas documentados**, no archivos ejecutables.
> No existen `.agent/agents/` ni `.claude/agents/` en este repositorio.

## Qué significa

- Cada `AGE-XX` define misión, skills y conexiones en el grafo de Obsidian.
- La ejecución real sigue las **5 etapas** de `AGENTS.md` §2, apoyadas en las skills de `.agent/skills/`.
- Un agente de IA puede asumir un rol leyendo su nota y la skill correspondiente; no hay un binario por rol.
- No crear agentes ad hoc ni duplicar sus reglas: se cita la nota y la skill.

## Handles canónicos

| Handle | Nota |
| :--- | :--- |
| `@Vigía-Requerimientos` | [[AGE-00-Vigia-Requerimientos]] |
| `@Inquisidor-Dudas` | [[AGE-01-Inquisidor-Dudas]] |
| `@Oraculo-Analista` | [[AGE-02-Oraculo-Analista]] |
| `@Arquitecto-Dominio` | [[AGE-03-Arquitecto-Dominio]] |
| `@Forja-Backend` | [[AGE-04-Forja-Backend]] |
| `@Vitral-UI` | [[AGE-05-Vitral-UI]] |
| `@Sabueso-Hunter` | [[AGE-06-Sabueso-Hunter]] |
| `@Juez-Esceptico` | [[AGE-07-Juez-Esceptico]] |
| `@Centinela-QA` | [[AGE-08-Centinela-QA]] |
| `@Arquitecto-UX-Storefront` | [[AGE-09-Arquitecto-UX-Storefront]] |
| `@Vitral-Dashboard` | [[AGE-10-Vitral-Dashboard]] |

No usar alias truncados como `@Sabueso` ni handles fantasma como `@Arquitecto-UX`.

## Relacionado

- [[SSOT]] — fuente única y precedencia.
- [[CATALOGO-SKILLS]] — dueño y estado de cada skill.
- `AGENTS.md` — flujo de 5 etapas y matriz de skills.
