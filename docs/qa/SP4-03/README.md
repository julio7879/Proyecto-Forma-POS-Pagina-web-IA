# QA Issue #54 — Certificación PR #53 (SP4-03 «No puedo despachar» y Custodia Central)

Rama QA: `qa/SP4-03-certificacion-no-puedo-despachar` (desde `develop`, base `9a942ab`).
Responsable QA: @duvancovilla292-prog · Desarrollador: Julio · Criterios: RF-WEB-06, RN-WEB-16, CA-42, CA-43, CA-62, QA-013, RN-ROL-04
Estado: **revisión estática hecha; ejecución local PENDIENTE**. Dictamen provisional: **NO aprobar todavía (`qa-approved` pendiente)** por los hallazgos 2 y 3.

## Qué agrega esta rama (solo QA)
| Archivo | Para qué |
|---|---|
| `backend/src/modules/11-pedidos-web/__tests__/noPuedoDespachar.qa.test.ts` | 11 pruebas con el mismo arnés que la suite original. Verifican lo que los 10 tests originales **no comprueban**: los movimientos reales del Kardex (`LIBERACION_RESERVA_WEB −2` en la sede origen y `RESERVA_WEB +2` en la nueva), los flags del pedido, que en custodia **no** se cree una nueva reserva, la alerta `alertaAdmin`, que se excluya la sede que reportó, sedes candidatas en cuarentena, Central inexistente, reporte repetido sin doble liberación, cuarentena solo de las variantes reportadas y los estados **reales** del enum. `[HALLAZGO] QA-11` documenta el defecto del estado ENVIADO. |

## Hallazgos
1. **GitFlow:** el PR #53 ya está en `develop` (`e0dabd3`); el Issue lo indica.
2. **Pedidos ENVIADOS se pueden "reasignar" (defecto):** el servicio rechaza `['CANCELADO', 'DESPACHADO', 'ENTREGADO', 'NO_ENTREGADO']`, pero **`DESPACHADO` no existe** en el enum `EstadoPedidoWeb`. El estado real de un pedido ya despachado es **`ENVIADO`**, y ese **no se rechaza**. Un pedido que ya salió de bodega puede ponerse en cuarentena y reasignarse a otra sede (con nueva reserva) o mandarse a custodia. El test original "422 si el pedido ya fue DESPACHADO" **pasa porque usa un estado ficticio** en el mock. **Corrección:** cambiar `'DESPACHADO'` por `'ENVIADO'` en el servicio y en el test (evidencia: `QA-11`).
3. **Carrera entre dos reportes simultáneos del mismo pedido (defecto):** el comentario dice "Bloqueo y re-consulta dentro de la transacción", pero `tx.pedidoWeb.findUnique` **no usa `FOR UPDATE`** y el `update` no filtra por `version`. Si dos vendedores o un admin reportan a la vez:
   - Los dos leen `tieneReservaActiva = true` y los dos **liberan** la reserva blanda. Si en esa sede hay reservas de **otros** pedidos de la misma variante, la segunda liberación **le quita la reserva a otro pedido**.
   - Luego los dos crean una reserva nueva, y puede quedar **doble reserva** en la sede destino.
   **Corrección sugerida:** `SELECT … FROM "PedidoWeb" WHERE id = $1 FOR UPDATE` al inicio de la transacción, o `update where { id, version }`. La idempotencia no lo cubre, porque son claves distintas.
4. **La cuarentena no tiene salida:** existe `InventoryLedgerService.levantarCuarentenaDespachoWeb`, pero **ningún endpoint lo usa**. Un SKU en cuarentena queda bloqueado para despacho web en esa sede indefinidamente.
5. **Custodia en Central sin reserva:** en CA-62 el pedido queda en Central con `tieneReservaActiva = false` y sin `RESERVA_WEB`. Es lo que pide el criterio ✅, pero no hay flujo que reintente la asignación cuando entre stock. Depende de la atención manual del admin con la alerta.
6. **Idempotencia duplicada:** igual que en el checkout (SP4-01), el servicio guarda `RegistroIdempotencia` y el middleware lo intenta otra vez, lo que deja un error en el log en cada reporte exitoso.
7. **Bucle infinito:** no ocurre ✅. Un pedido en custodia reportado otra vez vuelve a Central sin liberar nada (QA-7). La sede nunca queda `null`: si no hay Central activa, responde 409 sin actualizar (QA-6).

## Revisión por criterio
| Criterio | Evidencia | Resultado |
|---|---|---|
| CLIENTE → 403 | test original | ✅ |
| VENDEDOR sin `permPedidosWeb` → 403 | test original | ✅ |
| VENDEDOR de otra sede → 403 | test original | ✅ |
| VENDEDOR de la sede / ADMIN → procede | test original + QA-1 | ✅ |
| EN_PREPARACION → 409 (reserva dura protegida) | test original | ✅ |
| ENVIADO / ENTREGADO / CANCELADO → 422 | QA-9, QA-10, QA-11 | ❌ ENVIADO no se rechaza (hallazgo 2) |
| Cuarentena `bloqueadoDespachoWeb` + motivo en la sede que reporta | test original + QA-8 | ✅ |
| `LIBERACION_RESERVA_WEB` negativa en el origen | QA-1, QA-4 | ✅ |
| Reasignación + `RESERVA_WEB` en la nueva sede, flags false/true | QA-1 | ✅ |
| Custodia en Central, flags true/false, sin reserva nueva | test original + QA-4 | ✅ |
| Nunca sede `null` ni bucle | QA-6, QA-7 | ✅ |
| Auditoría con alerta al admin | QA-5 | ✅ |
| Concurrencia de reportes simultáneos | revisión de código | ❌ hallazgo 3 |

## Cómo ejecutar (desde la raíz)
```bash
npm test --prefix backend -- src/modules/11-pedidos-web/__tests__/noPuedoDespachar.test.ts      # 10/10
npm test --prefix backend -- src/modules/11-pedidos-web/__tests__/noPuedoDespachar.qa.test.ts   # 11/11
npm test --prefix backend
npm run typecheck --prefix backend
```

## Resultados (llenar)
| Comprobación | Esperado | Obtenido |
|---|---|---|
| noPuedoDespachar.test.ts | 10/10 | |
| Tests QA | 11/11 | |
| Suite backend | verde | |
| Typecheck | 0 errores | |

**Dictamen provisional:** cumplen el control de acceso, la cuarentena, la liberación, la reasignación determinista, la custodia en Central y la ausencia de bucles. **No aplicar `qa-approved`** hasta corregir el hallazgo 2 (ENVIADO no bloqueado y test con estado inexistente) y el 3 (carrera sin bloqueo del pedido), o hasta que Julio los acepte como pendientes.
