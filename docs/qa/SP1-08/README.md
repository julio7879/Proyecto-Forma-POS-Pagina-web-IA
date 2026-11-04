# QA Issue #32 — Certificación PR #29 (Guía de Diseño y Tokens Apple Liquid Glass, SP1-08)

Rama QA: `qa/SP1-08-certificacion-guia-diseno` (desde `develop`).
Responsable QA: @duvancovilla292-prog · Desarrolladora: Sofía · Issue origen: #8 (SP1-08)
Estado: **NO CERTIFICABLE todavía ❌**. Hay hallazgos bloqueantes (1, 2, 3 y 4).

## Qué agrega esta rama (solo QA, no es código de producción)
| Archivo | Para qué |
|---|---|
| `frontend/qa-storefront.html` + `frontend/src/qa/StorefrontPreviewQA.tsx` | Vista previa en `http://localhost:5173/qa-storefront.html` de `BentoGridHero` y `CartDrawer`, con botones para abrir, vaciar y restaurar el carrito y un log de eventos. Se necesita porque **ninguno de los dos componentes está montado en una ruta** de la app. |

## Hallazgos
### Bloqueantes
1. **El showroom no existe.** La guía pide abrir `SHOWROOM_REAL_LIQUID_GLASS_v2.html`, pero ese archivo **no está en ningún commit ni rama** del repositorio (`git log --all -- '*SHOWROOM*'` vacío). No se pueden verificar "en vivo" las 3 personalidades de cristal.
2. **Regresión en `StorefrontLayout` (Ley 1581 / Ley 1480).** En el merge del PR #29 (`5b10a62`) el layout tenía un banner de retracto ("5 días hábiles… Ley 1480") y un footer con enlace a la Política de Datos Personales. El commit `7cd9b29` (refactor SP1-06, 04-nov) **los eliminó**. Hoy el footer solo dice "Cumplimiento Ley 1581 de 2012 …" en texto plano: **no tiene enlace a la política ni banner de retracto**. El criterio del checklist no se cumple en `develop`.
3. **Tokens contradictorios entre documentos.**
   - `GUIA-DISENO-LIQUID-GLASS-v2.md`: "Erradicamos por completo el azul eléctrico agresivo (`#4F46E5`)" y usa *Obsidian Navy* (`#1A2138`) para los CTAs; tipografía `Playfair Display` + `Plus Jakarta Sans`.
   - `design.md`: `color-primary` = **`#4F46E5` (indigo-600)**; tipografía `Plus Jakarta Sans` + `JetBrains Mono`, **sin Playfair Display**.
   - `hechos.md` no menciona tokens (solo reglas de negocio, que están correctas).
   No hay una fuente única de verdad para color y tipografía.
4. **Los tokens no están implementados en el código.**
   - `BentoGridHero` y `CartDrawer` usan `indigo-600` (`#4F46E5`), justo el color que la guía v2 dice erradicar.
   - Las clases `glass-card`, `shadow-glow-indigo` y `shadow-glass-hover` **no están definidas** ni en `tailwind.config.js` (`extend: {}`) ni en `index.css`. Por eso no hay efecto Liquid Glass en esas tarjetas.
   - Las fuentes `Playfair Display` / `Plus Jakarta Sans` **no se cargan** (no hay `<link>` ni `@font-face` ni `fontFamily` en Tailwind). Se ve la fuente por defecto del navegador.

### Observaciones (no bloqueantes)
5. **GitFlow:** el PR #29 ya está fusionado en `develop` (`5b10a62`) antes del QA Gate.
6. `CartDrawer`: `animate-in slide-in-from-right` requiere el plugin `tailwindcss-animate`, que no está instalado (el drawer aparece sin animación). La imagen del ítem tiene clases inválidas o duplicadas (`w-18 h-22 w-20 h-24`).
7. `BentoGridHero`: el producto, el precio `$189.000 COP` y la imagen están quemados en el código (Unsplash externo). Está bien para un prototipo, pero debe conectarse al catálogo real.
8. Conteo de tests: el Issue dice 16/16; hoy `develop` tiene **34 tests** en frontend. Los 8 de BentoGridHero + CartDrawer se mantienen.

## Revisión estática por criterio del checklist
| Criterio | Resultado |
|---|---|
| Docs `design.md`, `brief.md`, `hechos.md` con tokens de color, tipografía y reglas de negocio | ⚠️ existen, pero se contradicen con la guía v2 (hallazgo 3) |
| Guía v2: 3 personalidades (Perla Especular, Champán Seda, Obsidiana Ahumada) | ✅ documentadas en `GUIA-DISENO-LIQUID-GLASS-v2.md` |
| Showroom interactivo | ❌ no existe (hallazgo 1) |
| Bento: 4 módulos asimétricos | ✅ hero 2x2, categorías 1x1, sede 1x1, garantías 2x1 |
| Bento: badge "Colección Oficial 2026" | ✅ |
| Bento: precio COP entero | ✅ `$189.000 COP` |
| Bento: 5 días de retracto (Ley 1480) | ✅ "5 Días Hábiles de Retracto & 30 Días de Garantía" |
| CartDrawer: drawer lateral con `backdrop-blur` | ✅ |
| CartDrawer: lista de ítems, cierre con Escape, estado vacío | ✅ (tests + vista previa) |
| StorefrontLayout: footer con enlace a Política de Datos (Ley 1581) | ❌ regresión (hallazgo 2) |
| StorefrontLayout: banner legal de retracto | ❌ regresión (hallazgo 2) |

## Cómo ejecutar
```bash
npm test --prefix frontend -- src/features/storefront/components/__tests__/   # 8/8
npm test --prefix frontend                                                    # 34/34
npm run build --prefix frontend                                               # 0 errores
npm run dev --prefix frontend
#   http://localhost:5173/qa-storefront.html  → Bento + Carrito
#   http://localhost:5173/                     → footer del StorefrontLayout
```

## Resultados de ejecución (llenar)
| Comprobación | Esperado | Obtenido |
|---|---|---|
| Tests Bento + Carrito | 8/8 | |
| Suite frontend | 34/34 | |
| Build | 0 errores | |
| Bento: 4 tarjetas, badge 2026, $189.000 COP, retracto | OK | |
| Bento: clic en categoría cambia el estado | OK | |
| Carrito: abre con fondo desenfocado | OK | |
| Carrito: Escape, X y clic en el fondo cierran | OK | |
| Carrito: +/−, eliminar, total sin decimales | OK | |
| Carrito: estado vacío | OK | |
| Efecto glass visible en tarjetas | OK | ❌ esperado (hallazgo 4) |
| Fuentes Playfair / Jakarta | OK | ❌ esperado (hallazgo 4) |
| Footer `/`: enlace a política y banner de retracto | OK | ❌ esperado (hallazgo 2) |
| Showroom HTML | Existe | ❌ no existe (hallazgo 1) |

**Dictamen:** **rechazado por QA** hasta que se resuelvan 1–4, o hasta que el Tech Lead / PO acepte explícitamente posponerlos a otro issue.
