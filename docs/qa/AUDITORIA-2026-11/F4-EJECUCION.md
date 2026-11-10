# F4 — Verdad del diseño (ejecución)

- **Fecha:** 10 de noviembre de 2026, 17:15 COT.
- **Rama:** `test/sandbox-testeo`.
- **Commit F4:** `12f4dda`.
- **Corte de estado:** `f7a3754` (F3 publicado).
- **Objetivo:** una ley por portal, 14 mandamientos en la ley, alcance MVP claro y conflicto de paletas resuelto por precedencia.

---

## 1. Resultado

| Problema | Antes | Ahora |
| :--- | :--- | :--- |
| Documentos de diseño | 6 sin precedencia | **1 constitución** (`DISENO-SSOT`) + ley por portal |
| 14 mandamientos | Citados, no escritos en ARQ-07 | **ARQ-07 §0** los enumera; SKI y AGE-09 los citan |
| Paletas | 3 sin regla | **Índigo Storefront / ARQ-08 Admin**; Navy queda como anexo no vinculante |
| Guest checkout / PCI | ARQ-01 los excluye; ARQ-07 los exige | **Fase 2**; ARQ-01 manda en el MVP |
| 5-6 tarjetas vs 9 | Contradicción | **6 bloques primarios**; la regla cuenta bloques, no tarjetas |
| `AGE-09` | Citaba un artefacto inexistente | Cita ARQ-07 §0 y `DISENO-SSOT` |

---

## 2. Qué se creó o cambió

| Archivo | Cambio |
| :--- | :--- |
| `docs/vault/00-GOBERNANZA/DISENO-SSOT.md` | **Nuevo.** Ley por portal, paleta vigente, alcance MVP, regla de conteo del dashboard y protocolo de cambio. |
| `ARQ-07` | **Nuevo §0** con los 14 mandamientos canónicos. Notas de alcance en §13.1 (360°), §18 (reseñas), §23.2 (guest checkout) y §25 (PCI). |
| `SKI-pos-ecommerce-ux-law` | Elimina su lista propia de 14; cita ARQ-07 §0. |
| `AGE-09` | Elimina su lista propia y el artefacto inexistente; cita ARQ-07 §0 y `DISENO-SSOT`. |
| `ARQ-08` | Regla de conteo: 4 KPI + 2 gráficos + histograma + 2 monitores = **6 bloques**. |
| `ARQ-06` | Nota de precedencia arriba; §C (Admin) marcada como histórica frente a ARQ-08. |
| `docs/design/GUIA-LIQUID-GLASS-v2` | Marcada como **anexo experimental**; Navy/champagne no vinculante hasta `DV-023`. |
| `docs/design/brief.md`, `design.md` | Marcados como especificación derivada y tokens, no ley. |
| `SSOT.md` / MOC | Enlazan `DISENO-SSOT` y la regla de conteo. |

---

## 3. Decisiones y supuestos

1. **Paleta del Storefront:** se mantiene **índigo `#4F46E5`** porque es la implementada, testeada y la que fija `design.md`. La dirección Navy/champagne queda como propuesta (`DV-023`), no como ley. Cambiarla exige decisión de marca y migración de tokens.
2. **Admin:** ARQ-08 es la ley; la paleta slate/índigo de ARQ-06 §C no aplica al dashboard.
3. **Guest checkout y PCI:** se declaran **fase 2** porque ARQ-01 los excluye explícitamente del MVP. Si el usuario decide incluirlos, se cambia ARQ-01 y se implementa en F5.
4. **360°:** fase 2. La UI no debe mostrar el badge hasta que exista visor real; F5 lo retira.
5. **Reseñas:** solo con compra verificada; las semillas se marcan como demo. F5 corrige el componente.
6. **Checkout:** 3 pasos con progreso es válido; el 1-step es alternativa, no obligación.

---

## 4. Verificación

| Verificación | Comando | Resultado |
| :--- | :--- | :--- |
| Enlaces del vault | chequeo `[[...]]` | ✅ sin roturas nuevas; quedan los 2 canvas y el ejemplo literal preexistentes |
| IDs RN | `node scripts/check-ids.mjs --check` | ✅ 0 faltantes, 0 duplicados |
| Tablero | `node scripts/gen-progress.mjs --check` | ✅ al día |
| Skills | `node scripts/sync-skills.mjs --check` | ✅ 6/6 |

---

## 5. Lo que F4 no resolvió

1. **`DV-023` (paleta Storefront)** sigue pendiente de decisión de marca. La constitución deja el default vigente, no una elección nueva.
2. **Assets del dashboard:** los 20 PNG siguen con nombres `media_*`; falta renombrarlos a `figNN-*` y mapearlos a una regla.
3. **Código de diseño:** el badge 360°, las reseñas semilla, el filtro de material y el stepper estático se corrigen en F5, no en F4.
4. **Canvas:** sigue listando 28 skills; el catálogo es la fuente.
5. **P0 abiertos: 1** — POS en `localStorage` (P0-03).
6. **F0 pendiente:** rotación del token, contraseñas semilla y regla de PR.

---

## 6. Cómo se mantiene

1. Toda decisión visual nueva se registra en `DISENO-SSOT` y, si cambia una ley, en `DV-*`/ADR.
2. Los 14 mandamientos viven solo en ARQ-07 §0; las skills y agentes los citan.
3. No se crea una segunda paleta, lista de mandamientos o sistema de tokens.
4. Los assets se nombran por figura, no por hash de exportación.
