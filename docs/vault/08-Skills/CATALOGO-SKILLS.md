---
id: CATALOGO-SKILLS
tags: [skills, catalogo, harness, agentes, gobernanza]
fecha: 2026-11-10
---
# Catálogo Canónico de Skills

> **Fuente única:** `.agent/skills/` (33 carpetas).
> **Copia generada:** `.claude/skills/` (6 skills) — no editar; se sincroniza con `node scripts/sync-skills.mjs`.
> **Regla:** una skill de dominio se invoca solo cuando se activa su disparador. Las genéricas no son obligatorias.

**Resumen:** 19 skills de dominio + 14 genéricas/importadas = **33**. 16 tienen nota `SKI-*`; 17 no la tienen (14 genéricas + 3 de dominio).

---

## 1. Skills de dominio (19)

| Skill | Agente responsable | Nota atómica |
| :--- | :--- | :--- |
| `pos-evaluador-solicitudes` | `@Vigía-Requerimientos` | [[SKI-pos-evaluador-solicitudes]] |
| `pos-clarification-interview` | `@Inquisidor-Dudas` | [[SKI-pos-clarification-interview]] |
| `orquestador-pos-rag-audit` | `@Oraculo-Analista` | [[SKI-orquestador-pos-rag-audit]] |
| `pos-clean-architecture` | `@Arquitecto-Dominio` | [[SKI-pos-clean-architecture]] |
| `pos-postgres-concurrency-optimizer` | `@Forja-Backend` | [[SKI-pos-postgres-concurrency-optimizer]] |
| `pos-kardex-transaction` | `@Forja-Backend` | [[SKI-pos-kardex-transaction]] |
| `pos-ecommerce-checkout-machine` | `@Forja-Backend` / `@Vitral-UI` | [[SKI-pos-ecommerce-checkout-machine]] |
| `pos-financial-ledger-audit` | `@Forja-Backend` / `@Sabueso-Hunter` | [[SKI-pos-financial-ledger-audit]] |
| `pos-storefront-ui-designer` | `@Vitral-UI` | [[SKI-pos-storefront-ui-designer]] |
| `pos-ecommerce-ux-law` | `@Arquitecto-UX-Storefront` | [[SKI-pos-ecommerce-ux-law]] |
| `ui-ux-pro-max` | `@Vitral-UI` | Sin nota SKI; se rige por `AGENTS.md` §4 |
| `storefront-best-practices` | `@Vitral-UI` | Sin nota SKI; se rige por `AGENTS.md` §4 |
| `pos-sales-ui-design` | `@Vitral-UI` | [[SKI-pos-sales-ui-design]] |
| `react-shadcn-admin` | `@Vitral-UI` | [[SKI-react-shadcn-admin]] |
| `pos-dashboard-designer` | `@Vitral-Dashboard` | [[SKI-pos-dashboard-designer]] |
| `pos-adversarial-audit` | `@Sabueso-Hunter` + `@Juez-Esceptico` | [[SKI-pos-adversarial-audit]] |
| `security-audit` | `@Sabueso-Hunter` | Sin nota SKI; se rige por `AGENTS.md` §4 |
| `pos-gitflow-pr-review` | `@Centinela-QA` | [[SKI-pos-gitflow-pr-review]] |
| `pos-sprint-progress-tracker` | `@Centinela-QA` | [[SKI-pos-sprint-progress-tracker]] |

---

## 2. Skills genéricas / importadas (14)

| Skill | Agente sugerido | Uso |
| :--- | :--- | :--- |
| `code-review` | `@Centinela-QA` | Revisión de código. |
| `codebase-design` | `@Arquitecto-Dominio` | Diseño de estructura de código. |
| `diagnosing-bugs` | `@Sabueso-Hunter` | Diagnóstico de fallos. |
| `domain-modeling` | `@Arquitecto-Dominio` | Modelado de dominio. |
| `frontend-design` | `@Vitral-UI` | Diseño frontend. |
| `grill-me` | `@Inquisidor-Dudas` | Interrogatorio de requisitos. |
| `grill-with-docs` | Sin asignar | Genérica no asignada; no está en MOC ni AGENTS. |
| `grilling` | `@Inquisidor-Dudas` | Interrogatorio iterativo. |
| `postgresql-best-practices` | `@Forja-Backend` | Buenas prácticas PostgreSQL. |
| `stitch` | `@Vitral-UI` | Diseño/prototipado. |
| `to-spec` | `@Oraculo-Analista` | Convertir requisitos en especificación. |
| `to-tickets` | `@Oraculo-Analista` | Desglose en tickets. |
| `wait-what` | Sin asignar | Genérica no asignada; no está en MOC ni AGENTS. |
| `webapp-testing` | `@Centinela-QA` | Pruebas de aplicación web. |

---

## 3. Reglas de mantenimiento

1. **Crear** una skill nueva en `.agent/skills/<nombre>/SKILL.md`; nunca en `.claude/skills/`.
2. **Sincronizar** con `node scripts/sync-skills.mjs`.
3. **Verificar** con `node scripts/sync-skills.mjs --check`.
4. Si es de dominio, **agregarla** a `AGENTS.md` §4 y a este catálogo.
5. Si es genérica, marcarla como tal; no entra en la matriz obligatoria.
6. Los dueños deben ser handles existentes en `docs/vault/07-Agentes/`.

## 4. Conflictos resueltos

- `react-shadcn-admin`: dueño único **`@Vitral-UI`** (antes el MOC la asignaba también a `@Vitral-Dashboard`).
- `pos-adversarial-audit`: `@Sabueso-Hunter` (cazador) + `@Juez-Esceptico` (defensor).
- `grill-with-docs` y `wait-what`: genéricas sin dueño; no se invocan por defecto.
