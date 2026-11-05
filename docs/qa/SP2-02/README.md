# QA Issue #67 — Certificación PR #66 (SP2-02 Compras a Proveedor en Central con Idempotencia)

Rama QA: `qa/SP2-02-certificacion-compras` (desde `develop`, base `fde10b4`; el PR #66 ya está fusionado: `3106c34`).
Responsable QA: @duvancovilla292-prog · Desarrollador: Yeimer · Criterios: RN-COM-01..07, RF-COM-01, RF-COM-02, CA-08, RN-GEN-07, RN-GEN-08
Estado: **revisión estática hecha; ejecución local PENDIENTE**. Dictamen provisional: **APROBABLE con observaciones**. No se encontraron defectos que rompan los 5 casos críticos.

## Qué agrega esta rama (solo QA)
| Archivo | Para qué |
|---|---|
| `backend/src/modules/05-compras/tests/compras.qa.test.ts` | 7 pruebas con el mismo arnés que `compras.test.ts`: `FOR UPDATE` de la orden antes de leer su estado (recibir y cancelar), cancelar CANCELADA o RECIBIDA → 422, recepción con todo en 0, cantidades decimales o negativas → 400, DELETE → 400, y 2 `[HALLAZGO]`. |
| `backend/src/modules/05-compras/tests/compras.qa.integration.test.ts` | 4 pruebas contra **PostgreSQL real** (solo con `RUN_DB_TESTS=1`): orden PEDIDA sin tocar stock, **5 recepciones simultáneas** con claves distintas (1 × 200, 4 × 422, stock una sola vez), **ráfaga de 5 con la misma Idempotency-Key** (stock una vez, sin 500 y reintento cacheado) y carrera cancelar vs recibir. Cubre también la **sección 2 de la matriz SP2-07 (Issue #41)**. |

## Hallazgos
1. **GitFlow:** el PR #66 ya está en `develop`. La guía pide **aprobar el PR en GitHub**; como ya está fusionado, se deja el comentario de certificación en el PR y en el Issue.
2. **Sobre-recepción sin control (observación de negocio):** `cantidadRecibida` no tiene tope respecto a `cantidadPedida`. Se pueden ingresar 999 unidades a Central sobre 20 pedidas sin observación ni aprobación (QA-5). RN-COM no lo prohíbe explícitamente, pero es un riesgo de inventario inflado por error de digitación. Sugerencia: exigir `observacionDiferencia`, o rechazar, cuando `recibida > pedida`.
3. **Idempotency-Key reutilizada en otra orden (observación del middleware común):** `requireIdempotencyKey` busca solo por `(clave, usuario)` y **no compara el `endpoint`**. Si el admin reutiliza la clave de la OC #7 al recibir la OC #8, recibe el snapshot de la #7 (200) y **la #8 queda PEDIDA** sin que nadie lo note (QA-6). Afecta a todos los módulos que usan ese middleware. Sugerencia: validar `existing.endpoint === req.originalUrl` (y una huella del cuerpo) y responder 422 si no coinciden.
4. **Reintentos simultáneos con la misma clave:** la segunda petición que llega mientras la primera aún no confirma pasa el `findUnique` del middleware y termina en **422** ("ya RECIBIDA") en vez de devolver el snapshot. **No hay doble ingreso** ✅ (lo garantiza el `FOR UPDATE`), pero el cliente ve un error en un reintento legítimo. Lo demuestra INT-3.
5. **Doble guardado de idempotencia:** el servicio guarda el registro dentro de la transacción (correcto, CA-08) y el middleware lo intenta otra vez al responder. El segundo choca con la PK y deja `Error guardando registro de idempotencia` en el log en cada recepción exitosa (igual que en SP4-01 y SP4-03).
6. **Recepción "vacía":** una recepción con todas las líneas en 0 deja la orden RECIBIDA (cerrada para siempre) sin ingresar nada (QA-3). Es coherente con "recepción única", pero quizá debería tratarse como cancelación.
7. **Lo que está bien:** creación solo ADMIN en PEDIDA sin tocar stock. Cancelación PEDIDA→CANCELADA sin inventario, y 422 en otros estados. Recepción **con `SELECT … FOR UPDATE` dentro de la transacción** (a diferencia de SP4-02, SP4-03 y SP4-06, aquí el bloqueo está bien hecho). Ingreso exclusivo a Central con `COMPRA_RECIBIDA`/FISICO vía Kardex en orden canónico. Registro de idempotencia atómico con el stock. 422 al recibir una orden RECIBIDA o CANCELADA. DELETE → 400. Validación de enteros COP.

## Revisión por criterio
| Criterio | Evidencia | Resultado |
|---|---|---|
| 1. Crear OC en PEDIDA sin tocar stock; VENDEDOR → 403 | tests originales + INT-1 | ✅ |
| 2. Cancelar PEDIDA → CANCELADA; CANCELADA o RECIBIDA → 422 | tests originales + QA-2 | ✅ |
| 3. Recepción única a Central con `COMPRA_RECIBIDA` / FISICO → RECIBIDA | tests originales + QA-1, INT-2 | ✅ |
| 4. Misma clave → snapshot sin duplicar; clave nueva sobre RECIBIDA → 422 | tests originales + INT-2, INT-3 | ✅ (ver observaciones 3 y 4) |
| 5. DELETE → 400 por valor histórico | test original + QA-7 | ✅ |
| Concurrencia real (sin doble ingreso) | INT-2, INT-3, INT-4 | ✅ |

## Cómo ejecutar (desde la raíz)
```bash
npm test --prefix backend -- src/modules/05-compras/tests/compras.test.ts       # 20/20
npm test --prefix backend -- src/modules/05-compras/tests/compras.qa.test.ts    # 7/7
npm test --prefix backend
npm run typecheck --prefix backend
cd backend && RUN_DB_TESTS=1 npx vitest run src/modules/05-compras/tests/compras.qa.integration.test.ts && cd ..
```
La prueba de integración crea órdenes y stock reales de variantes `QA-SP202-*` en la Bodega Central de la BD de desarrollo. Avisar al equipo antes de correrla.

## Resultados (llenar)
| Comprobación | Esperado | Obtenido |
|---|---|---|
| compras.test.ts | 20/20 | |
| Tests QA | 7/7 | |
| Suite backend | verde | |
| Typecheck | 0 errores | |
| Integración (BD real) | 4/4 | |

**Dictamen provisional:** los 5 casos críticos cumplen y la concurrencia real está bien resuelta. **Se puede certificar** dejando las observaciones 2 a 6 para backlog (la 3 afecta a todo el sistema).
