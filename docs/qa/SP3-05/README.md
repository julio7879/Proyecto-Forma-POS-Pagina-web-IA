# QA Issue #28 — Certificación PR #26 (Comprobante Ticket POS 80 mm y Recibo Telegram)

Rama QA: `qa/SP3-05-certificacion-ticket-pos` (desde `develop`).
Responsable QA: @duvancovilla292-prog · Desarrollador: @andreycasadiego05-netizen (Thomas) · Issue origen: #22 (SP3-05)
Estado: **revisión estática hecha; ejecución local y prueba visual PENDIENTES** (llenar tabla de resultados).

## Qué agrega esta rama (solo QA, no es código de producción)
| Archivo | Para qué |
|---|---|
| `frontend/qa-ticket.html` + `frontend/src/qa/TicketPreviewQA.tsx` | Vista previa en `http://localhost:5173/qa-ticket.html` con escenarios EFECTIVO / TRANSFERENCIA / SIN_CLIENTE y el texto del recibo Telegram. Se necesita porque `TicketVentaPOS` **no está conectado a ninguna ruta** de la app. |
| `frontend/src/features/pos/__tests__/TicketVentaPOS.qa.test.tsx` | 7 pruebas QA que cubren criterios que la suite original no verifica: leyenda exacta, "Consumidor Final", transferencia sin efectivo (ticket y Telegram), efectivo sin referencia y total sin decimales. |

## Hallazgos de la revisión
1. **GitFlow:** el PR #26 ya está fusionado en `develop` (commit `4981494`) antes del QA Gate. Los archivos del ticket son idénticos a los de `feature/SP3-05-comprobante-ticket-pos`.
2. **Componente sin integrar (observación):** `TicketVentaPOS` y `formatTelegramReceipt` no se importan en ninguna parte de la app (ni en `PosTerminalPage` ni en una ruta). No se puede probar desde el flujo de venta real; por eso se agregó la vista previa QA.
3. **DoD "precio unitario/total" — NO CUMPLE:** el ticket muestra solo el **total por ítem**. `precioUnitarioCop` existe en el tipo, pero no se muestra ni en el ticket ni en Telegram.
4. **Formato COP (menor):** el DoD pone como ejemplo `$ 45.000 COP`. El ticket muestra `$45.000` (sin espacio) y solo el TOTAL lleva el sufijo `COP`. Hay que confirmar con el PO si es aceptable.
5. **RN-GEN-04 sin protección (observación):** `toLocaleString('es-CO')` mostraría decimales si llega un valor no entero (ej.: `45000.5` → `$45.000,5`). Hoy depende de que el backend envíe enteros. Sugerencia: `Math.round` o `maximumFractionDigits: 0`.
6. **Impresión térmica (observación):** no hay regla `@page { size: 80mm auto; margin: 0 }`. En impresora normal o PDF el ticket sale en una hoja Carta/A4 con márgenes. Verificar con la impresora real.
7. **Telegram (observaciones):**
   - Siempre imprime `Descuento: -$0` aunque no haya descuento.
   - Usa Markdown de Telegram sin escapar los datos: un nombre con `_` o `*` puede romper el mensaje (error de parseo del bot).
   - Si no hay cliente omite la línea (no dice "Consumidor Final"). Esto es aceptable porque el DoD no lo exige para Telegram.
8. **Conteo de tests:** el Issue dice 15/15 en frontend; hoy `develop` tiene 34 tests y esta rama suma 7 de QA (**41 esperados**). Los 7 de `TicketVentaPOS.test.tsx` se mantienen.
9. Las pruebas QA nuevas **no pudieron ejecutarse en el entorno donde se escribieron**. Deben pasar en local (`tsc` incluido vía `npm run build`).

## Revisión estática por criterio
| Criterio | Resultado |
|---|---|
| 80 mm `w-[80mm] max-w-[80mm] font-mono` | ✅ |
| Barra de botones `print:hidden`, fondo blanco al imprimir | ✅ (verificar en la impresión) |
| Separadores punteados | ✅ `border-dashed` |
| Sede, dirección, teléfono, consecutivo, fecha, cajero | ✅ |
| "Consumidor Final" sin cliente | ✅ (test QA) |
| Ítems: cantidad, descripción, talla, color | ✅ |
| Ítems: **precio unitario** | ❌ hallazgo 3 |
| Leyenda RN-VTA-10 exacta | ✅ (test QA de texto exacto) |
| COP sin decimales | ✅ con enteros (ver hallazgos 4 y 5) |
| Telegram: emojis y bloques monoespaciados (SKU, consecutivo) | ✅ (los montos no van en monoespaciado) |
| Telegram EFECTIVO: recibido y cambio | ✅ |
| Telegram TRANSFERENCIA: referencia, sin efectivo | ✅ (test QA) |

## Cómo ejecutar
```bash
npm test --prefix frontend -- src/features/pos/__tests__/TicketVentaPOS.test.tsx      # 7/7
npm test --prefix frontend -- src/features/pos/__tests__/TicketVentaPOS.qa.test.tsx   # 7/7 QA
npm test --prefix frontend                                                            # 41/41
npm run build --prefix frontend                                                       # 0 errores
npm run dev --prefix frontend   # → http://localhost:5173/qa-ticket.html
```

## Resultados de ejecución (llenar)
| Comprobación | Esperado | Obtenido |
|---|---|---|
| Tests TicketVentaPOS | 7/7 | |
| Tests QA | 7/7 | |
| Suite frontend completa | 41/41 | |
| Build | 0 errores | |
| Vista 80 mm sin desbordes (nombre largo) | OK | |
| Imprimir: barra oculta, fondo blanco, punteados | OK | |
| Escenario TRANSFERENCIA | Ref visible, sin recibido/cambio | |
| Escenario SIN_CLIENTE | "Consumidor Final" | |
| Recibo Telegram | Emojis, SKU/consecutivo en `código` | |

**Dictamen provisional:** **certificación condicionada**. Cumple todos los criterios excepto mostrar el **precio unitario** (hallazgo 3), que debe corregir el desarrollador o aceptar explícitamente el PO.
