# QA Issue #33 — Certificación PR #30 (Prototipo Terminal POS Mostrador CA-53, SP1-06)

Rama QA: `qa/SP1-06-certificacion-terminal-pos` (desde `develop`).
Responsable QA: @duvancovilla292-prog · Desarrolladora: Sofía · Issue origen: #6 (SP1-06)
Estado: **revisión estática hecha; ejecución local y prueba visual PENDIENTES**. Dictamen provisional: **certificación condicionada** (hallazgos 3 y 4).

## Qué agrega esta rama (solo QA)
| Archivo | Para qué |
|---|---|
| `frontend/src/features/pos/__tests__/PosTerminalPage.qa.test.tsx` | 7 pruebas: F2, F12 + Escape, badge de cosméticos, cambio exacto ($66.000), botón Exacto, y 2 pruebas `[HALLAZGO]` que **documentan** el comportamiento defectuoso actual (pasan en verde mientras el defecto exista). |

## Hallazgos
1. **GitFlow:** el PR #30 ya está fusionado en `develop` (`0b2a2a1`) antes del QA Gate.
2. **Ruta incorrecta en la guía:** dice `http://localhost:5173/pos/terminal`, pero esa ruta no existe y redirige a `/` (tienda). La ruta real es **`/pos/venta`** (`/pos` también redirige ahí).
3. **Cobro en efectivo — monto prellenado (defecto de usabilidad):** al abrir el modal, "Monto Recibido" ya trae el total (`abrirModalCobro` → `setEfectivoRecibido(totalPagarCOP)`).
   - Los billetes rápidos **suman** sobre ese total: con $50.000 en el carrito, pulsar **+$100k** da recibido $150.000 y cambio **$100.000** (debería ser $50.000).
   - El teclado numérico **concatena** al total: escribir `100000` deja recibido `50000100000`.
   - El cajero tiene que pulsar **CLEAR** antes, y eso no está indicado. Con CLEAR primero, el cálculo es correcto.
   - El escenario de la guía ("producto de $50.000, paga con $100.000 → cambio $50.000") **no se cumple** sin CLEAR.
4. **Escape en el modal de éxito no inicia nueva venta:** Escape cierra el Frame 4, pero no llama a `handleNuevaVenta`; el carrito queda con los productos ya cobrados y se pueden cobrar dos veces.
5. **F12 en el navegador:** F12 es también el atajo de DevTools. Hay que verificar en Chrome que `preventDefault` evita abrirlas. Para la prueba, abre DevTools con **Ctrl+Shift+I**.
6. **Botón "CONFIRMAR VENTA E IMPRIMIR (Enter)":** no hay atajo `Enter` implementado y este botón no imprime (solo pasa al Frame 4).
7. **"Imprimir Ticket 80mm"** llama a `window.print()` ✅, pero imprime **la pantalla completa del POS**, no el componente `TicketVentaPOS` (SP3-05, Issue #28), que no está integrado.
8. **Consecutivo:** se genera aleatorio (`MED-00` + 4 dígitos al azar). Cumple el formato `#MED-00XXXX`, pero no es secuencial y puede repetirse. Aceptable en un prototipo.
9. **Prototipo sin backend:** el carrito arranca con 2 productos de ejemplo, "Enviar por Telegram" usa `alert()` y el texto "Inventario descargado del Kardex" es simulado.
10. **Tests:** los 5 tests originales no verifican el **valor** del cambio (solo que aparece la caja) ni F2/Escape; los cubren las pruebas QA. El Issue dice 13/13; `develop` hoy tiene 34 tests en frontend (**41 con esta rama**).

## Revisión estática por criterio
| Criterio | Resultado |
|---|---|
| CA-53 cero scroll: `PosLayout` `h-screen overflow-hidden`, página `h-full overflow-hidden` | ✅ en código (verificar a 1024×768) |
| 60/40: catálogo `md:w-[60%]`, carrito `md:w-[40%]` | ✅ |
| RN-CAT-04: badge "Uso personal" (catálogo) + "[Sin cambio]" (carrito) | ✅ |
| F2 enfoca buscador | ✅ |
| F12 abre cobro si hay productos | ✅ (botón COBRAR deshabilitado con carrito vacío) |
| Esc cierra modales | ✅ (ver hallazgo 4) |
| Botones +100k, +50k, Exacto | ✅ existen; ⚠️ suman sobre el total (hallazgo 3) |
| Cambio automático y grande | ✅ `text-2xl font-black`; ⚠️ valor inesperado sin CLEAR |
| Frame 4: consecutivo `#MED-00XXXX` | ✅ |
| Imprimir Ticket 80 mm → `window.print()` | ✅ (ver hallazgo 7) |

## Cómo ejecutar
```bash
npm test --prefix frontend -- src/features/pos/__tests__/PosTerminalPage.test.tsx      # 5/5
npm test --prefix frontend -- src/features/pos/__tests__/PosTerminalPage.qa.test.tsx   # 7/7
npm test --prefix frontend                                                             # 41/41
npm run build --prefix frontend                                                        # 0 errores
npm run dev --prefix frontend   # → http://localhost:5173/pos/venta  (1024×768)
```

## Resultados de ejecución (llenar)
| Comprobación | Esperado | Obtenido |
|---|---|---|
| Tests PosTerminalPage | 5/5 | |
| Tests QA | 7/7 | |
| Suite frontend | 41/41 | |
| Build | 0 errores | |
| 1024×768 sin scroll vertical | OK | |
| 60/40 | OK | |
| Badge cosméticos | OK | |
| F2 | Enfoca buscador | |
| F12 | Abre cobro (sin abrir DevTools) | |
| Esc | Cierra modal | |
| Carrito $50.000 → +$100k sin CLEAR | Cambio $50.000 | ❌ esperado $100.000 (hallazgo 3) |
| Carrito $50.000 → CLEAR → +$100k | Cambio $50.000 | |
| Confirmar → consecutivo #MED-00XXXX | OK | |
| Imprimir Ticket 80mm abre diálogo de impresión | OK | |
| Esc en modal de éxito limpia carrito | Carrito vacío | ❌ esperado: no se limpia (hallazgo 4) |

**Dictamen provisional:** cumple ergonomía, distribución, badge y atajos. **Condicionado** a corregir los hallazgos 3 (monto prellenado) y 4 (Escape sin nueva venta), o a que el PO los acepte como pendientes del prototipo.
