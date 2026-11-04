# QA Issue #16 — Certificación PR #12 (Motor Kardex, FOR UPDATE, orden canónico)

Rama QA: `qa/SP2-01-certificacion-kardex` (desde `develop`).
Estado: **verificación estática hecha; ejecución local PENDIENTE** (ver "Cómo ejecutar").

## Hallazgos de la revisión
1. **Ruta incorrecta en la guía del Issue:** dice `backend/src/modules/02-inventario/...`; la real es `backend/src/modules/04-inventario/__tests__/InventoryLedgerService.test.ts` (`02-` es *ubicaciones*). Comando correcto, desde la raíz:
   `npx vitest run backend/src/modules/04-inventario/__tests__/InventoryLedgerService.test.ts` (o `cd backend && npx vitest run src/modules/04-inventario`).
2. **Los 18 tests son unitarios con `tx` simulada (mocks).** Demuestran la lógica (409, validaciones, orden de llamadas) pero **no** demuestran que `SELECT ... FOR UPDATE` serialice transacciones reales. La guía afirma que existe un test de "dos clientes comprando la última unidad"; **no existe** (la sección 5 "CA-02" solo verifica el orden `varianteId ASC` con spy). Para cerrar CA-02/QA-003 se agregó una prueba de integración contra Postgres real (abajo).
3. **Conteo de tests inconsistente en el Issue:** 57/57 (descripción), 59/59 (comentarios). Tras el fix de `.env` en `develop` se observó **61/61** en la rama `qa/SP1-04`. Se espera lo mismo aquí (+2 tests de integración *omitidos* si no se activa `RUN_DB_TESTS`).
4. **Invariante 3 (Kardex único):** `grep` confirma que `saldoStock.update/upsert/create` solo aparecen en `InventoryLedgerService.ts` (fuera de tests). OK.
5. Revisión estática del servicio — OK:
   - `bloquearYObtenerSaldo` usa `FOR UPDATE` (también tras el auto-crear).
   - CA-01: `FISICO` rechaza con `AppError.conflict` (409) si `nuevoFisico < 0` o `< reservas`.
   - RN-WEB-15/18: `ENDURECIMIENTO_RESERVA_WEB` y `DESPACHO_WEB` mueven blando→duro y físico+duro sin comparar contra disponible (sin falsos 409).
   - RN-GEN-04: rechaza no enteros/NaN (`Number.isInteger`), 0 y `|x| > 2_147_483_647`.
   - RNF-003: `registrarMovimientosBatch` ordena por `varianteId ASC` (desempate `ubicacionId`).
6. **Limitación (observación, no bloqueante):** el orden canónico solo protege *dentro* de un batch; dos llamadas sueltas a `registrarMovimiento` en la misma transacción siguen dependiendo de que el llamador ordene.
7. El archivo nuevo **no pudo compilarse ni ejecutarse en el entorno donde se escribió** (sin `node_modules` ni BD). Debe pasar `tsc --noEmit` en tu máquina antes de confiar en él.

## Cómo ejecutar (desde `backend/`, BD de desarrollo con migraciones + seed)
```bash
npx tsc --noEmit
npx vitest run src/modules/04-inventario/__tests__/InventoryLedgerService.test.ts   # 18/18
npx vitest run                                                                       # suite global
RUN_DB_TESTS=1 npx vitest run src/modules/04-inventario/__tests__/InventoryLedgerService.concurrency.integration.test.ts
```
Las pruebas de integración crean datos con prefijo `QA-KDX-<timestamp>` y **no los borran** (Invariante 7); usar BD de desarrollo.

## Mapa criterio → evidencia
| Criterio | Evidencia |
|---|---|
| CA-01 | tests 2.2 y 2.3 (unitarios) + revisión de código |
| CA-02 / QA-003 | **integración** "última unidad" (1 éxito, 1 × 409, saldo 0, 1 movimiento) |
| RNF-003 | test 5 (unitario, orden) + **integración** batches opuestos sin deadlock |
| RN-WEB-15 / 18 | tests 3.3 y 3.4 (unitarios) |
| RN-GEN-04 | tests 4.3 y 4.4 (unitarios) |
| TS limpio / 18 de 18 / suite global | resultado de tus comandos |

**Dictamen provisional:** sin bloqueantes en código; certificar solo con los resultados reales (incluida la integración).
