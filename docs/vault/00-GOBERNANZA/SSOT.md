---
id: SSOT
tags: [gobernanza, ssot, fuente-unica, backlog, flujo]
fecha: 2026-11-10
---

# Fuente Única de Verdad (SSOT)

> **Principio:** definir una vez, citar siempre, verificar en CI.
>
> Este documento decide **qué es canónico** y **qué es derivado**. Si dos fuentes se contradicen, no se elige por intuición: se detiene el trabajo y se pregunta (1-3 preguntas).

---

## 1. Qué es canónico

| Tema | Fuente canónica | Qué se deriva y no se edita a mano |
| :--- | :--- | :--- |
| Reglas de negocio (`RN-*`) | `docs/vault/01-Reglas-Dominio/` | Citas en RF, CA, ARQ y skills |
| Requerimientos (`RF-*`) | `docs/vault/02-Modulos-RF/` | Matriz de trazabilidad |
| Base de datos | `backend/prisma/schema.prisma` + `migrations/` | Conteo de modelos, nota de esquema |
| Calidad (`CA-*`, `DV-*`) | `docs/vault/04-Calidad-y-Parametros/` | Casos `QA-*` y gates |
| Estado del proyecto | `docs/vault/05-Estado-Sprints/backlog.yaml` | `PROGRESO-ACTUAL.md` (generado) |
| Arquitectura y diseño | `docs/vault/06-Arquitectura-y-Patrones/` (`ARQ-01`…`ARQ-08`) | `docs/design/` como anexo |
| Agentes | `docs/vault/07-Agentes/` | Handles y matriz de skills |
| Skills | `.agent/skills/` | Notas `SKI-*` como índice |
| Harness y flujo | `AGENTS.md` + este documento | `CLAUDE.md` como puntero |
| QA y ejecuciones | `docs/qa/` | Informes, gates y regresiones |

---

## 2. Jerarquía y precedencia

1. **Regla específica > guía general.** `RN-CAJ-06` manda sobre un resumen de RF.
2. **Ley de portal > guía visual.** ARQ-07 manda en Storefront; ARQ-08 en Admin; ARQ-06 es referencia general.
3. **`schema.prisma` + migraciones > cualquier conteo en Markdown.** Hoy son **35 modelos / 16 enums / 35 tablas**.
4. **`backlog.yaml` > cualquier tabla de estado escrita a mano.** `PROGRESO-ACTUAL.md` es derivado.
5. **Si dos fuentes canónicas chocan, se detiene y se pregunta.** La fecha solo desempata si este documento lo autoriza.
6. **Un ID se define una vez y se cita.** No se reescribe la regla en la skill ni en el agente.

---

## 3. Flujo operativo real (10-nov-2026)

- **Una persona.** No hay equipo de 6 ni reparto de carga vigente.
- **Rama de trabajo:** `test/sandbox-testeo`.
- **Publicación:** `main`. `develop` está archivada y no se usa.
- **PR:** no es obligatorio. La evidencia es commit + `tsc` + `vitest` + checklist.
- **Node:** 22.x para tests y build. Node 26 rompe Vitest 0.34 (`localStorage` indefinido).
- **Estado vivo:** `PROGRESO-ACTUAL.md`, generado desde `backlog.yaml`.

---

## 4. Artefactos derivados

| Artefacto | Se genera con | Regla |
| :--- | :--- | :--- |
| `docs/vault/05-Estado-Sprints/PROGRESO-ACTUAL.md` | `node scripts/gen-progress.mjs` | No editar a mano; `--check` falla si está desactualizado |
| Conteo de modelos/enums | `schema.prisma` | La nota `Esquema-Prisma-33-Modelos` debe renombrarse a 35 |
| Notas `SKI-*` | `.agent/skills/` | Son índice, no fuente |
| Conteo de tests | salida de `vitest` | No usar cifras escritas a mano |

---

## 5. Documentos históricos (no normativos)

- `PLAN-MAESTRO-SPRINTS.md`: plan original de 6 personas y 6 sprints.
- `MATRIZ-ROLES-Y-TAREAS.md`: roles y GitFlow de equipo.
- `PROGRESO-ACTUAL.md` anterior: reemplazado por el generado.
- `docs/design/`: especificaciones de diseño; se consideran anexo de ARQ-06/07, no ley.
- `SandboxRoleDock.tsx`: neutralizado en F0; no usar.

---

## 6. Protocolo de cambio

1. Cambiar la **fuente**, no la copia.
2. Regenerar los derivados (`node scripts/gen-progress.mjs`).
3. Ejecutar `node scripts/gen-progress.mjs --check`.
4. Commit con evidencia (qué, por qué, archivo).
5. Si cambia una regla de negocio, actualizar `RN-*`, `RF-*`, `CA-*` y la matriz de trazabilidad.
6. Si el cambio es de alcance, registrarlo como ADR o `DV-*` con fecha.

---

## 7. Regla de parada

Si no encuentras la regla, el ID no existe o hay ambigüedad: **detente y pregunta**. No rellenes vacíos con suposiciones. Esta regla aplica a humanos y agentes.
