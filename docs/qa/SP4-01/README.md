# QA Issue #48 — Certificación PR #47 (SP4-01 Algoritmo DANE y Checkout Web)

Rama QA: `qa/SP4-01-certificacion-checkout-dane` (desde `develop`, commit base `aa2223b`).
Responsable QA: @duvancovilla292-prog · Desarrollador: Julio · Módulo `11-pedidos-web` (RF-WEB-02, RF-WEB-03)
Estado: **revisión estática hecha; ejecución local PENDIENTE**. Dictamen provisional: **certificación condicionada** (hallazgo 2).

## Qué agrega esta rama (solo QA)
| Archivo | Para qué |
|---|---|
| `backend/src/modules/11-pedidos-web/__tests__/checkoutDANE.qa.test.ts` | 16 pruebas de dominio, sin BD: las 4 zonas, excepción direccional, CA-37 antes que la excepción, **desempate por menor ID** (nivel 3 de CA-36, que no tenía test), determinismo ante el orden de entrada, tarifa por encima de prioridad, excepción que cambia la ganadora, carrito repartido → 409, sedes inactivas o sin despacho web ignoradas, stock exacto y carrito vacío. |
| `backend/src/modules/11-pedidos-web/__tests__/checkoutConcurrencia.qa.integration.test.ts` | 3 pruebas contra **PostgreSQL real** (solo con `RUN_DB_TESTS=1`): reserva blanda y TTL 24 h reales, dos clientes por la última unidad, y 5 checkouts simultáneos (evidencia del hallazgo 2). |

## Hallazgos
1. **GitFlow:** el PR #47 ya está fusionado en `develop` (`2febc8f`) antes del QA Gate.
2. **Consecutivo con colisión bajo concurrencia (defecto):** `referenciaLegible = PED-AAAA-` + `pedidoWeb.count() + 1`, sin bloqueo ni secuencia. Dos checkouts simultáneos de clientes distintos calculan el mismo número y el segundo falla por `@unique` (P2002 → **409**). Un cliente perdería su compra sin que haya problema de stock. Además, `count()` es global: el número **no se reinicia por año**, aunque el comentario dice "único por año". Sugerencia: secuencia de PostgreSQL o tabla de consecutivos con `FOR UPDATE`. Lo evidencia `INT-3`.
3. **Idempotencia — clave sin huella del cuerpo:** si se reutiliza la misma `Idempotency-Key` con **otro** carrito, se devuelve el pedido anterior sin avisar. Lo usual es responder 422 cuando el cuerpo no coincide.
4. **Idempotencia — doble escritura:** el servicio guarda `RegistroIdempotencia` dentro de la transacción y el middleware intenta guardarlo otra vez al responder. El segundo `create` choca con la PK y deja en consola `Error guardando registro de idempotencia` en **cada checkout exitoso**. No duplica efectos, pero ensucia los logs.
5. **Idempotencia — reintentos simultáneos:** si llegan dos peticiones con la misma clave a la vez, ambas pasan el `findUnique` inicial. La segunda termina en **409** (choque de PK) en vez de devolver la respuesta guardada. No hay doble pedido ✅, pero el cliente recibe un error.
6. **Asignación sin reintento:** la sede se elige leyendo saldos **sin bloqueo** y luego se reserva con `FOR UPDATE`. Si otra compra se llevó la unidad entre medias, el checkout falla con 409 aunque **otra sede** sí tenga stock. No hay sobreventa ✅, pero se pierden ventas posibles.
7. **Checkout abierto a cualquier rol:** la ruta solo exige JWT. Un ADMIN o VENDEDOR puede crear pedidos web a su nombre. Si solo deben comprar los CLIENTES, falta `requireRole('CLIENTE')`.
8. **`cuponCodigo` se ignora en silencio:** se acepta en el cuerpo, pero `descuentoTotalCop` es siempre 0 (pendiente de integrar el motor SP3-03).
9. **Aislamiento por rol ✅:** el cliente solo ve sus pedidos, el VENDEDOR necesita `permPedidosWeb` y solo ve su sede, y el ADMIN ve todo. Está cubierto por los tests originales y verificado en el código (`obtenerPorId`, `listar`).

## Revisión por criterio
| Criterio | Evidencia | Resultado |
|---|---|---|
| CA-37 `atendidoWeb` → 422 | tests originales + QA-3 | ✅ |
| RF-WEB-02 zonas $8.000 / $12.000 / $16.000 / $22.000 + excepciones | tests originales + Zonas 1-4 QA, QA-2, QA-7 | ✅ |
| CA-35 sin envíos divididos → 409 | test original + QA-8, QA-9 | ✅ |
| CA-36 desempate tarifa → prioridad → ID | tests originales (niveles 1-2) + QA-4, QA-5, QA-6 | ✅ |
| CA-38 reserva blanda `RESERVA_WEB` con orden canónico | test original + INT-1, INT-2 (BD real) | ✅ |
| CA-39 TTL 24 h en TRANSFERENCIA | test original + INT-1 (BD real) | ✅ |
| RN-GEN-08 Idempotency-Key obligatoria y respuesta cacheada | tests originales | ✅ con observaciones 3-5 |
| Aislamiento por rol | tests originales | ✅ |
| Checkouts concurrentes de clientes distintos | INT-3 | ❌ hallazgo 2 |

## Cómo ejecutar (desde la raíz)
```bash
npm test --prefix backend -- src/modules/11-pedidos-web/__tests__/checkoutDANE.test.ts      # originales
npm test --prefix backend -- src/modules/11-pedidos-web/__tests__/checkoutDANE.qa.test.ts   # 16/16
npm test --prefix backend                                                                  # suite completa (integración: skipped)
npm run typecheck --prefix backend
cd backend && RUN_DB_TESTS=1 npx vitest run src/modules/11-pedidos-web/__tests__/checkoutConcurrencia.qa.integration.test.ts && cd ..
```
La prueba de integración **crea pedidos web de prueba reales** en la BD de desarrollo (sede `QA-SP401-*`). Avisar al equipo antes de correrla.

## Resultados (llenar)
| Comprobación | Esperado | Obtenido |
|---|---|---|
| checkoutDANE.test.ts | todos verdes | |
| Tests QA de dominio | 16/16 | |
| Suite backend | verde | |
| Typecheck | 0 errores | |
| INT-1 reserva + TTL | ✅ | |
| INT-2 última unidad | ✅ | |
| INT-3 5 checkouts simultáneos | 5/5 | (si falla con `referenciaLegible` → hallazgo 2 confirmado) |

**Dictamen provisional:** el algoritmo DANE, la asignación determinista, la reserva blanda, el TTL, la idempotencia básica y el aislamiento por rol cumplen. **Condicionado** al hallazgo 2 (colisión del consecutivo con checkouts simultáneos).
