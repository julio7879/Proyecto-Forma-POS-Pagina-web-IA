# SP2-07 (Issue #41) — Matriz de Pruebas de Concurrencia y Certificación QA Sprint 2

Rama: `test/SP2-07-matriz-concurrencia-kardex` (desde `develop`) → **PR a `develop`**.
QA Lead: @duvancovilla292-prog
Archivo de pruebas: `backend/src/modules/04-inventario/__tests__/concurrencyKardex.test.ts`

## Por qué contra PostgreSQL real
Los tests existentes del Kardex y de traslados usan Prisma **mockeado**. Sirven para la lógica, pero **no pueden demostrar** que `SELECT … FOR UPDATE` serializa, que no hay deadlocks ni que el `CHECK` de la BD existe. Esta suite usa la BD de desarrollo:

- Solo corre con `RUN_DB_TESTS=1`. En `npm test` normal aparece como **skipped**, así que no rompe la CI.
- Crea datos propios con prefijo `QA-SP207-<timestamp>`: una sede, un producto, variantes y sus saldos (incluida la fila de esas variantes en Bodega Central).
- **No toca productos existentes y no borra nada** (Invariante 7).
- Requiere migraciones + `prisma/constraints_post_migrate.sql` + seed (`admin@forma.com`, municipio `54001`, categoría `Ropa`, Bodega Central activa).

## Matriz
| # | Caso | Criterios | Estado |
|---|---|---|---|
| 1.1 | 10 ventas simultáneas sobre la última unidad → 1 éxito, 9 × 409, físico 0, 1 movimiento | QA-003, CA-01, CA-02 | ✅ implementado |
| 1.2 | 10 ventas simultáneas con stock 5 → 5 éxitos, Kardex suma −5, `saldoResultante` = {4,3,2,1,0} | QA-003, Inv. 3 | ✅ implementado |
| 1.3 | 6 batches simultáneos con orden opuesto (A,B)/(B,A) → sin deadlock, saldos 0 | RNF-003, Inv. 4 | ✅ implementado |
| 1.4 | `UPDATE fisico = -1` directo → la BD lo rechaza (`chk_saldo_stock_no_negativo`) | RN-INV-01 | ✅ implementado |
| 2.1 | Ráfaga de recepciones de OC con la misma `Idempotency-Key` → stock +N una sola vez | RN-COM-03, RN-GEN-08 | ⛔ bloqueado (SP2-02) |
| 2.2 | Misma key con cuerpo distinto → rechazo | RN-COM-03 | ⛔ bloqueado (SP2-02) |
| 3.1 | Despacho: Central −3, destino no recibe (tránsito), destino no puede vender (409) | CA-04, CA-05 | ✅ implementado |
| 3.2 | Cancelar en ENVIADO → RETORNANDO_A_CENTRAL sin reponer; confirmar retorno repone | CA-09, CA-59 | ✅ implementado |
| 3.3 | 2 confirmaciones de retorno simultáneas → reposición única | QA-012 | ✅ implementado |
| 3.4 | 2 despachos simultáneos del mismo traslado → descuento único | QA-014, Inv. 3 | ✅ implementado |
| 3.5 | 2 traslados compiten por la última unidad de Central → 1 ENVIADO, 1 × 409 | CA-04, QA-003 | ✅ implementado |
| 4.1 | Recepción con dañados → `noVendible` | CA-06, QA-010 | ⛔ bloqueado (SP2-04) |
| 4.2 | Recepción con faltantes → RECIBIDO_CON_NOVEDAD | CA-07, CA-57 | ⛔ bloqueado (SP2-04) |
| 4.3 | Recepción con excedentes → RECIBIDO_CON_NOVEDAD | CA-58 | ⛔ bloqueado (SP2-04) |
| 4.4 | VENDEDOR no resuelve novedad (403) | QA-011 | ⛔ bloqueado (SP2-04) |
| 4.5 | 2 recepciones simultáneas → stock destino sumado una vez | QA-010 | ⛔ bloqueado (SP2-04) |

Los casos ⛔ están como `it.todo` en el archivo. Se implementan cuando se fusionen en `develop`:
- **Compras (SP2-02, Yeimer):** `backend/src/modules/05-compras/index.ts` solo tiene `/health`.
- **Recepción y novedades de traslados (SP2-04):** `TrasladoService` no tiene `recibir` ni resolución de novedad. Las rutas existentes son solicitar, evaluar, despachar, cancelar y confirmar-retorno.

## Cómo ejecutar (desde la raíz)
```bash
npm test --prefix backend                                                    # suite normal: la matriz sale "skipped"
cd backend && RUN_DB_TESTS=1 npx vitest run src/modules/04-inventario/__tests__/concurrencyKardex.test.ts && cd ..
npm run typecheck --prefix backend
```

## Resultados (llenar)
| Comprobación | Esperado | Obtenido |
|---|---|---|
| Suite backend normal | verde (matriz skipped) | |
| Matriz con BD real | 9 passed, 7 todo | |
| Typecheck | 0 errores | |

## Interpretación de fallos
- **1.4 falla con `QA_SIN_CONSTRAINT`:** en esa BD no se aplicó `constraints_post_migrate.sql`. Es un hallazgo de entorno grave: la BD aceptaría stock negativo si algún código se saltara el Kardex.
- **1.3 falla con `deadlock detected` (40P01):** se rompió el orden canónico de RNF-003.
- **1.1 o 1.2 con más éxitos de los esperados:** el `FOR UPDATE` no está serializando. Revisar el pooler: con PgBouncer en modo *transaction* las transacciones interactivas de Prisma funcionan, pero conviene confirmarlo.
- **Errores `Transaction API error: Unable to start a transaction`:** el pool de conexiones es pequeño para 10 transacciones a la vez. Subir `connection_limit` en `DATABASE_URL` o reintentar; no es un defecto del Kardex.
