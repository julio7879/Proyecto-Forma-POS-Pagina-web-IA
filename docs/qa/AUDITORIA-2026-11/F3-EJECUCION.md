# F3 — Verdad del harness (ejecución)

- **Fecha:** 10 de noviembre de 2026, 17:11 COT.
- **Rama:** `test/sandbox-testeo`.
- **Commit F3:** `802131c`.
- **Corte de estado:** `2857386` (F2 publicado).
- **Objetivo:** un solo harness de 5 etapas, una sola fuente de skills y una parada obligatoria ejecutable.

---

## 1. Resultado

| Métrica | Antes | Ahora |
| :--- | ---: | ---: |
| Linajes del harness | 2 (`AGENTS` 5 etapas, `CLAUDE` 4 pasos) | **1** (`AGENTS.md`; `CLAUDE.md` es puntero) |
| Herramienta de parada | `ask_question` (inexistente) | **`ask_user_question`** |
| Skills duplicadas divergentes | 4 de 6 | **0 de 6** |
| Catálogos de skills | 19 / 28 / 31 | **1 catálogo: 19 dominio + 14 genéricas** |
| Dueño de `react-shadcn-admin` | 2 agentes | **`@Vitral-UI`** |
| Agentes “ejecutables” | 0 archivos, 11 notas | **11 roles documentados, sin ambigüedad** |

---

## 2. Qué se corrigió

| Área | Cambio |
| :--- | :--- |
| `CLAUDE.md` | Pasó de 26 líneas con 4 pasos a un **puntero de 8 líneas** a `AGENTS.md`. Ya no compite con el flujo de 5 etapas. |
| `ask_question` | Reemplazado por **`ask_user_question`** en `AGENTS.md`, `00-Oficina-Agentes-MOC.md`, `SKI-pos-clarification-interview`, `Oficina-Agentes.canvas` y 3 skills de `.agent`. |
| Etapas | `orquestador-pos-rag-audit` ya no dice “4 fases”: dice **5 fases (Paso 0 a Paso 4)**. |
| `.claude/skills` | Se sincronizaron las 6 skills desde `.agent/skills`. Las 4 que divergían (`orquestador`, `adversarial`, `gitflow`, `kardex`) ahora son idénticas al origen. |
| Sincronización | Nuevo `scripts/sync-skills.mjs`; `--check` falla si una copia diverge. `.claude/skills/README.md` advierte que es generada. |
| Catálogo | Nuevo `docs/vault/08-Skills/CATALOGO-SKILLS.md`: 19 skills de dominio + 14 genéricas, con dueño y estado de nota. |
| Propiedad | `react-shadcn-admin` queda en `@Vitral-UI`; `pos-adversarial-audit` declara `@Sabueso-Hunter` + `@Juez-Esceptico` (frontmatter con `agente_secundario`). |
| Agentes | Nuevo `docs/vault/07-Agentes/README.md`: los 11 `AGE-*` son roles, no archivos ejecutables; no existen `.agent/agents` ni `.claude/agents`. |
| Handles | `@Sabueso` → `@Sabueso-Hunter`; `@Arquitecto-UX` → `@Arquitecto-UX-Storefront` en telemetría; alias largos en la cabecera. |
| Invariante | `AGENTS.md` ya no cita `RN-CAJ-11`; usa `RN-CAJ-05`. |

---

## 3. Verificación

| Verificación | Comando | Resultado |
| :--- | :--- | :--- |
| Paridad de skills | `node scripts/sync-skills.mjs --check` | ✅ 6/6 skills coinciden |
| IDs RN | `node scripts/check-ids.mjs --check` | ✅ 0 faltantes, 0 duplicados |
| Tablero F1 | `node scripts/gen-progress.mjs --check` | ✅ al día |
| Enlaces del vault | chequeo `[[...]]` | ✅ sin roturas nuevas; quedan los 2 canvas y el ejemplo literal preexistentes |
| Rastros del linaje viejo | `ask_question`, `4 fases` | ✅ 0 en archivos activos |

---

## 4. Lo que F3 no resolvió (a propósito)

1. **3 skills de dominio sin nota SKI:** `ui-ux-pro-max`, `storefront-best-practices` y `security-audit`. El catálogo las cubre y `AGENTS.md` §4 las asigna; no se crearon notas nuevas para no inventar contenido.
2. **El canvas sigue listando 28 skills**, no las 33. Es una vista visual; el catálogo es la fuente. Actualizarlo requiere editar el JSON del canvas y no aporta al flujo.
3. **`.claude/skills` es un subconjunto de 6**, no las 33. Si Claude Code necesita todas, ejecutar `node scripts/sync-skills.mjs --all`.
4. **Los 11 agentes siguen sin archivos ejecutables.** Son roles/personas. Crear agentes específicos de plataforma es una decisión aparte, no un requisito del flujo de 5 etapas.
5. **P0 abiertos: 2** — POS en `localStorage` (P0-03) y la ley de diseño sin sus 14 mandamientos (P0-08).
6. **F0 pendiente:** rotación del token de Telegram y de las contraseñas semilla; regla de PR de GitHub.

---

## 5. Cómo se mantiene

1. Editar **solo** `.agent/skills/`.
2. Ejecutar `node scripts/sync-skills.mjs`.
3. Verificar `node scripts/sync-skills.mjs --check`.
4. Si la skill es de dominio, agregarla a `AGENTS.md` §4 y a `CATALOGO-SKILLS.md`.
5. No editar `.claude/skills/` ni `CLAUDE.md` con reglas nuevas.
