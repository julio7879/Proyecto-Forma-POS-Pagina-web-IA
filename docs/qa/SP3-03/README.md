# QA Issue #43 — Certificación PR #42 (Motor Canónico de Descuentos y Prorrateo Exacto, SP3-03)

Rama QA: `qa/SP3-03-certificacion-motor-descuentos` (desde `develop`).
Responsable QA: @duvancovilla292-prog · Desarrollador: Julio · Criterios: CA-19..25, RN-DES-01..09, RN-GEN-04
Estado: **revisión estática hecha; ejecución local PENDIENTE**. Dictamen provisional: **certificación condicionada** (hallazgo 2).

## Qué agrega esta rama (solo QA)
| Archivo | Para qué |
|---|---|
| `backend/src/modules/09-descuentos/domain/__tests__/DiscountEngine.qa.test.ts` | 14 pruebas. 12 cubren el checklist con casos que la suite original no ejercita: residuo con una línea no elegible al final, cantidades > 1, 300 carritos aleatorios donde Σ netos = total, truncamiento con cosmético, tope exacto, tope en valor fijo y porcentajes decimales o fuera de rango. 2 están marcadas `[HALLAZGO]` y documentan defectos (verifican el comportamiento **actual**; al corregir el motor se cambian por la aserción correcta). |

## Hallazgos
1. **GitFlow:** el PR #42 ya está fusionado en `develop` (`0158264`) antes del QA Gate.
2. **Defecto de prorrateo (RN-DES-09):** la última línea elegible "absorbe el residuo" sin límite. Si esa línea es pequeña frente a las demás, el residuo **supera su subtotal**.
   - Ejemplo real: 3 prendas de $30.000 + un accesorio de $100 (subtotal $90.100), cortesía fija de admin de $90.000. El prorrateo da 29.966 / 29.966 / 29.966 / **102**, y la última línea solo vale **100**.
   - El código recorta su neto a $0 con `Math.max`, así que **Σ `precioNetoTotalCop` = $102** pero **`totalNetoPagarCop` = $100**. El checklist exige que sean iguales.
   - Impacto: tickets o facturas cuyas líneas no suman el total, y reembolsos por línea (RN-DEV-07) calculados sobre netos inconsistentes.
   - Sugerencia: repartir el residuo sin pasar el subtotal de cada línea (por ejemplo, método del mayor residuo, o asignar el sobrante a la línea de mayor subtotal) y verificar `descuentoLinea <= subtotalLinea`.
   - Con descuentos porcentuales y precios normales no se reproduce (se probaron 300 carritos). Ocurre con descuentos **fijos** cercanos al total y una línea pequeña al final.
3. **Montos decimales → error sin código HTTP:** `MoneyCOP.assertEnteroNoNegativo` lanza `new Error(...)`, no `AppError.badRequest`. El rechazo existe ✅, pero cuando el motor se use desde un endpoint, un `1000.5` respondería **500** en vez de **400**. Los topes y los porcentajes inválidos sí dan 400.
4. **El motor no está expuesto por HTTP:** `09-descuentos` solo tiene `/health`. Las verificaciones de "HTTP 400" del checklist se hacen sobre el `statusCode` del `AppError` del dominio, no contra una API.
5. **Topes dependen del llamador:** `esAdmin` y `topeMaximoPorcentaje` llegan en la solicitud. Si un vendedor no trae `topeMaximoPorcentaje`, no hay límite. Cuando se integre al POS, el tope debe leerse del usuario autenticado (`topeDescuentoPorc`), no del cuerpo de la petición.
6. **Referencias rotas en la guía:** los "tests #1, #2, #4" aparecen como autolinks a otros issues. Los reales son `1. Prorrateo exacto oficial CA-20`, `2. … se trunca a $0 COP` y `4. … líneas NO elegibles`.
7. **Conteos:** el Issue dice 85/85 en backend; hoy `develop` tiene 123 y con esta rama son **137**.

## Revisión por criterio
| Criterio | Evidencia | Resultado |
|---|---|---|
| $1.000 en 3 × $10.000 → 333/333/334 | test 1 + QA-1 | ✅ |
| Σ netos = totalNetoPagarCop | QA-1..4 | ✅ en casos normales; ❌ hallazgo 2 (QA-5) |
| Cupón $50.000 sobre $30.000 → $30.000, neto $0 | test 2 + QA-6 | ✅ |
| Truncamiento con línea no elegible | QA-7 | ✅ |
| Vendedor 10 % pide 15 % → 400 | test 5 + QA-8 | ✅ |
| Admin 25 % con tope 10 % → aprobado | test 6 + QA-10 | ✅ |
| Cosmético no elegible conserva su precio | test 4 + QA-2, QA-7 | ✅ |
| Decimales rechazados | test 7 + QA-12, QA-13 | ✅ (ver hallazgo 3) |

## Cómo ejecutar (desde la raíz)
```bash
npm test --prefix backend -- src/modules/09-descuentos/domain/__tests__/DiscountEngine.test.ts      # 8/8
npm test --prefix backend -- src/modules/09-descuentos/domain/__tests__/DiscountEngine.qa.test.ts   # 14/14
npm test --prefix backend                                                                           # 137/137
npm run typecheck --prefix backend                                                                  # 0 errores
```

## Resultados (llenar)
| Comprobación | Esperado | Obtenido |
|---|---|---|
| Tests DiscountEngine | 8/8 | |
| Tests QA | 14/14 | |
| Suite backend | 137/137 | |
| Typecheck | 0 errores | |

**Dictamen provisional:** prorrateo, truncamiento, topes, segregación de cosméticos y dinero entero cumplen en los escenarios del checklist. **Condicionado** al hallazgo 2 (el residuo puede superar el subtotal de la última línea y descuadrar la suma de netos).
